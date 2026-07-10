// Servidor de pagos (Stripe). Modo TEST o LIVE según la clave + NODE_ENV.
// La clave secreta SOLO vive aquí, nunca en el frontend.

import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import Stripe from 'stripe'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
import {
  markEventProcessed,
  saveValidatedCard,
  listValidatedCards,
  saveCharge,
  listCharges,
  listSubscribers,
  getSubscriberCount,
  addSubscriber,
  createUser,
  getUserByUsername,
  getUserById,
  getUserByTelegramId,
  updateUserCredits,
  spendUserCredits,
  setUserRole,
  deleteUser,
  linkTelegramToUser,
  claimBotUser,
  resetAllCredits,
  removeSubscriber,
  restoreCreditsFromBackup,
  listUsers,
  recordCheck,
  getUserStats,
  getGlobalStats,
  getTopRankers,
  resetAllStats,
  updateUserPassword,
  saveLive,
  listLives,
  deleteLive,
  clearLives,
  setGateAccess,
  listUserGateAccess,
  listAllGateAccess,
  deleteGateAccessById,
  checkGateAccessToday,
  initDb,
} from './db.js'
import { startBot, stopBot } from './telegram-bot.js'
import { lookupBin } from './extrap.js'

dotenv.config()

const {
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET,
  CLIENT_URL = 'http://localhost:5173',
  PORT = 4242,
  NODE_ENV = 'development',
  JWT_SECRET,
  OXAPAY_API_KEY,
} = process.env

const INSECURE_JWT_DEFAULTS = [
  'dev_only_insecure_jwt_secret_2024',
  'dev_only_insecure',
  'insecure',
  'changeme',
  'secret',
]
const isProd = NODE_ENV === 'production'

function deriveJwtSecret(input) {
  if (!input) {
    if (isProd) {
      console.error('[!] FATAL: JWT_SECRET must be set in production')
      process.exit(1)
    }
    const generated = crypto.randomBytes(48).toString('base64')
    console.warn('[!] JWT_SECRET not set — generated an ephemeral one for this process (sessions reset on restart)')
    return generated
  }
  if (INSECURE_JWT_DEFAULTS.some((s) => input.includes(s))) {
    console.error('[!] FATAL: JWT_SECRET looks like an insecure default value')
    process.exit(1)
  }
  if (input.length >= 32) return input
  console.warn(`[!] JWT_SECRET is only ${input.length} characters — deriving a secure 64-char key from it`)
  return crypto.createHash('sha256').update(input).digest('base64') + crypto.randomBytes(8).toString('base64')
}

const _JWT_SECRET = deriveJwtSecret(JWT_SECRET)

if (!STRIPE_SECRET_KEY) {
  console.warn('\n[!] STRIPE_SECRET_KEY no configurada — rutas de pago deshabilitadas')
}

const DEPLOY_VERSION = process.env.RENDER_GIT_COMMIT || process.env.DEPLOY_VERSION || String(Date.now())
let isLiveKey = false
let isTestKey = false
let stripe = null

if (STRIPE_SECRET_KEY) {
  isLiveKey = STRIPE_SECRET_KEY.startsWith('sk_live_')
  isTestKey = STRIPE_SECRET_KEY.startsWith('sk_test_')

  if (!isLiveKey && !isTestKey) {
    console.warn('\n[!] STRIPE_SECRET_KEY no parece válida (debe empezar por sk_test_ o sk_live_). Rutas de pago deshabilitadas.')
    STRIPE_SECRET_KEY = null
  } else {
    if (isLiveKey && !isProd) {
      console.error(
        '\n[!] PELIGRO: estás usando una clave LIVE (sk_live_) con NODE_ENV != production.\n' +
        '    Esto haría cargos REALES. Usa sk_test_ en desarrollo o pon NODE_ENV=production.\n'
      )
      process.exit(1)
    }
    if (isTestKey && isProd) {
      console.warn('\n[!] ADVERTENCIA: NODE_ENV=production pero la clave es de TEST. No procesarás pagos reales.\n')
    }
    console.log(`[i] Stripe en modo: ${isLiveKey ? 'LIVE (producción)' : 'TEST'}`)
    if (!STRIPE_WEBHOOK_SECRET) {
      console.warn('\n[!] Falta STRIPE_WEBHOOK_SECRET. El webhook rechazará todos los eventos hasta configurarlo.\n')
    }
    stripe = new Stripe(STRIPE_SECRET_KEY)
  }
}

// --- Oxapay (crypto payments) ---
const OXAPAY_API = 'https://api.oxapay.com/v1'
let oxapayConfigured = false
if (OXAPAY_API_KEY) {
  oxapayConfigured = true
  console.log('[i] Oxapay crypto payments enabled')
} else {
  console.warn('[!] OXAPAY_API_KEY no configurada — pagos crypto deshabilitados')
}

const app = express()

// Detras de Render/proxy: confiar en X-Forwarded-* para que express-rate-limit
// identifique correctamente a los usuarios por IP real.
app.set('trust proxy', 1)

// Compresión HTTP (gzip) — reduce tamaño de payloads JSON grandes.
app.use(compression())

// Seguridad: headers HTTP con CSP estricta
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://js.stripe.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: [
        "'self'",
        'https://api.telegram.org',
        'https://api.stripe.com',
        'https://chk-no-face-clan-api.onrender.com',
        'https://data.handyapi.com',
        'https://bins.antipublic.cc',
        'https://lookup.binlist.net',
        'https://www.1secmail.com',
        'https://api.oxapay.com',
        CLIENT_URL,
      ],
      frameSrc: ['https://js.stripe.com', 'https://hooks.stripe.com', 'https://pay.oxapay.com'],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
}))

// Seguridad: CORS restringido
const allowedOrigins = [
  'https://nofacechk.com',
]
const corsOrigins = isProd ? allowedOrigins : [CLIENT_URL, ...allowedOrigins]
app.use(cors({ origin: corsOrigins }))

// Health check (antes del rate limiter para evitar 429 en los pings de Render)
app.get('/health', (_req, res) => {
  res.json({ ok: true, mode: isLiveKey ? 'live' : 'test' })
})

// Seguridad: rate limiting global (500 req / 15 min por IP)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes, intenta de nuevo más tarde' },
})
app.use('/api/', globalLimiter)

// Seguridad: rate limit para login/register (20 intentos / 1 min)
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Espera 1 minuto.' },
})
app.use('/api/auth/', authLimiter)

// IMPORTANTE: el webhook necesita el body CRUDO para verificar la firma.
// Por eso se registra ANTES de express.json() y con express.raw().
// Si lo parseas como JSON primero, la verificación de firma fallará.
app.post(
  '/api/webhook',
  express.raw({ type: 'application/json' }),
  (req, res) => {
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe not configured' })
    }
    const signature = req.headers['stripe-signature']
    let event

    try {
      // Verifica que el evento viene realmente de Stripe y no fue alterado.
      // Sin esto, cualquiera podría falsificar un POST diciendo "pago exitoso".
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        STRIPE_WEBHOOK_SECRET
      )
    } catch (err) {
      console.error('[webhook] firma inválida:', err.message)
      return res.status(400).send(`Webhook signature verification failed`)
    }

    // Responde 200 rápido; el trabajo pesado va aparte para no
    // hacer reintentar a Stripe por timeout.
    handleStripeEvent(event).catch((err) =>
      console.error('[webhook] error procesando evento:', err.message)
    )

    res.json({ received: true })
  }
)

// Webhook de Oxapay (crypto) — también necesita body CRUDO para HMAC
app.post(
  '/api/oxapay/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    if (!oxapayConfigured) {
      return res.status(503).json({ error: 'Oxapay not configured' })
    }
    try {
      const signature = req.headers['hmac']
      if (!signature) {
        return res.status(400).send('Missing HMAC signature')
      }
      const expected = crypto
        .createHmac('sha512', OXAPAY_API_KEY)
        .update(req.body)
        .digest('hex')
      if (signature !== expected) {
        console.error('[oxapay-webhook] firma inválida')
        return res.status(400).send('Invalid HMAC signature')
      }
      const payload = JSON.parse(req.body.toString('utf8'))
      console.log('[oxapay-webhook] evento recibido:', payload.status, 'order:', payload.order_id)

      if (payload.status === 'Paid' && payload.order_id) {
        const parts = payload.order_id.split(':')
        if (parts.length === 2) {
          const userId = Number(parts[0])
          const packageId = parts[1]
          const pkg = PACKAGES[packageId]
          if (pkg && Number.isFinite(userId)) {
            const user = await getUserById(userId)
            if (user) {
              await updateUserCredits(user.username, user.credits + pkg.credits)
              console.log(`[oxapay-webhook] ✓ Acreditados ${pkg.credits} créditos a ${user.username} (ID: ${userId})`)
            }
          }
        }
      }
      res.status(200).send('ok')
    } catch (err) {
      console.error('[oxapay-webhook] error:', err.message)
      res.status(500).send('Internal error')
    }
  }
)

// El resto de rutas SÍ usan JSON parseado con límite de tamaño
app.use(express.json({ limit: '100kb' }))

// --- JWT Middleware ---
function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' })
  }
  try {
    const token = header.slice(7)
    req.user = jwt.verify(token, _JWT_SECRET, { algorithms: ['HS256'] })
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

// --- Auth Routes ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, telegram_id } = req.body
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' })
    if (!telegram_id) return res.status(400).json({ error: 'Telegram ID is required. Send /start to the bot and register at nofacechk.com/register' })
    if (typeof username !== 'string' || typeof password !== 'string') return res.status(400).json({ error: 'Invalid input' })
    if (username.length < 3 || username.length > 30) return res.status(400).json({ error: 'Username must be 3-30 characters' })
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return res.status(400).json({ error: 'Username can only contain letters, numbers, underscores' })
    if (password.length < 4) return res.status(400).json({ error: 'Password must be at least 4 characters' })
    if (!/^\d+$/.test(telegram_id)) return res.status(400).json({ error: 'Invalid Telegram ID format' })

    const existing = await getUserByUsername(username)
    if (existing) return res.status(409).json({ error: 'Username already taken' })

    const existingTg = await getUserByTelegramId(telegram_id)
    if (existingTg && !existingTg.username?.startsWith('tg_')) {
      return res.status(409).json({ error: 'Telegram ID already linked to another account' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    let user
    if (existingTg && existingTg.username?.startsWith('tg_')) {
      // Reclama el usuario auto-creado por el bot (/start) para que pase
      // a ser un usuario web con su username y password elegidos.
      user = await claimBotUser(telegram_id, username, passwordHash)
      if (!user) user = await createUser(username, passwordHash, telegram_id)
    } else {
      user = await createUser(username, passwordHash, telegram_id)
    }
    if (!user) return res.status(500).json({ error: 'Failed to create user' })

    await addSubscriber(telegram_id, username, username)

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, _JWT_SECRET, { expiresIn: '7d', algorithm: 'HS256' })
    res.status(201).json({ token, user })
  } catch (err) {
    console.error('[auth] register error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' })
    if (typeof username !== 'string' || typeof password !== 'string') return res.status(400).json({ error: 'Invalid input' })

    const user = await getUserByUsername(username)
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const match = await bcrypt.compare(password, user.password_hash)
    if (!match) return res.status(401).json({ error: 'Invalid credentials' })

    // Auto-vincular telegram: si el user no tiene telegram_id pero existe
    // un subscriber del bot con el mismo username, vincular su chat_id.
    let telegramId = user.telegram_id
    if (!telegramId) {
      const subs = await listSubscribers(false)
      const match = subs.find((s) => s.username && s.username.toLowerCase() === user.username.toLowerCase())
      if (match) {
        telegramId = match.chat_id
        await linkTelegramToUser(user.id, telegramId)
        await addSubscriber(telegramId, user.username, user.username)
        console.log(`[auth] auto-linked telegram for ${user.username} → ${telegramId}`)
      }
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, _JWT_SECRET, { expiresIn: '7d', algorithm: 'HS256' })
    res.json({
      token,
      user: { id: user.id, username: user.username, credits: user.credits, role: user.role, telegram_id: telegramId, created_at: user.created_at },
    })
  } catch (err) {
    console.error('[auth] login error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/auth/telegram-login', async (req, res) => {
  try {
    const { telegram_id } = req.body
    if (!telegram_id) return res.status(400).json({ error: 'Telegram ID required' })
    const user = await getUserByTelegramId(telegram_id)
    if (!user) return res.status(404).json({ error: 'Telegram ID not linked. Send /start to @NoFaceCheckerBot' })
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, _JWT_SECRET, { expiresIn: '7d', algorithm: 'HS256' })
    res.json({
      token,
      user: { id: user.id, username: user.username, credits: user.credits, role: user.role, telegram_id: user.telegram_id, created_at: user.created_at },
    })
  } catch (err) {
    console.error('[auth] telegram-login error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/auth/link-telegram', authMiddleware, async (req, res) => {
  try {
    const { telegram_id } = req.body
    if (!telegram_id) return res.status(400).json({ error: 'Telegram ID required' })
    const existing = await getUserByTelegramId(telegram_id)
    if (existing && existing.id !== req.user.id) return res.status(409).json({ error: 'Telegram ID already linked to another account' })
    await linkTelegramToUser(req.user.id, telegram_id)
    await addSubscriber(telegram_id, req.user.username, req.user.username)
    const user = await getUserById(req.user.id)
    res.json({ user: { id: user.id, username: user.username, credits: user.credits, role: user.role, telegram_id: user.telegram_id, created_at: user.created_at } })
  } catch (err) {
    console.error('[auth] link-telegram error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/admin/users', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' })
    const users = await listUsers()
    res.json(users.map(u => ({
      id: String(u.id),
      username: u.username,
      email: '',
      credits: u.credits,
      role: u.role,
      telegram_id: u.telegram_id,
      banned: false,
      createdAt: u.created_at ? new Date(u.created_at).toISOString().split('T')[0] : '',
      lastSession: u.created_at ? new Date(u.created_at).toISOString().split('T')[0] : '',
    })))
  } catch (err) {
    console.error('[admin] /api/admin/users error:', err.message, err.stack)
    res.status(500).json({ error: isProd ? 'Internal server error' : err.message })
  }
})

app.post('/api/admin/reset-credits', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' })
  console.warn(`[ADMIN] ${req.user.username} reset ALL credits to 0 at ${new Date().toISOString()}`)
  await resetAllCredits()
  res.json({ ok: true })
})

app.post('/api/admin/set-credits', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' })
    const { username, credits } = req.body
    if (!username || typeof credits !== 'number' || credits < 0) return res.status(400).json({ error: 'Invalid data' })
    await updateUserCredits(username, credits)
    res.json({ ok: true, username, credits })
  } catch (err) {
    console.error('[admin] set-credits error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.delete('/api/admin/users/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' })
  const { id } = req.params
  try {
    const user = await getUserById(Number(id))
    if (!user) return res.status(404).json({ error: 'User not found' })
    await deleteUser(Number(id))
    res.json({ ok: true })
  } catch (err) {
    console.error('[admin] delete user error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  const user = await getUserById(req.user.id)
  if (!user) return res.status(404).json({ error: 'User not found' })
  res.json(user)
})

app.put('/api/auth/credits', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' })
  const { username, credits } = req.body
  if (!username || typeof credits !== 'number' || credits < 0) return res.status(400).json({ error: 'Invalid data' })
  await updateUserCredits(username, credits)
  res.json({ ok: true, username, credits })
})

// Endpoint para que el USER pueda gastar sus propios créditos.
// Body: { amount: number } → descuenta 'amount' de los créditos del user actual.
// Retorna { ok, credits (nuevo saldo) } o 402 si no tiene suficientes.
app.post('/api/auth/spend', authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body
    if (typeof amount !== 'number' || amount <= 0 || !Number.isInteger(amount)) {
      return res.status(400).json({ error: 'Invalid amount' })
    }
    const result = await spendUserCredits(req.user.id, amount)
    if (!result.ok) {
      if (result.reason === 'not_found') return res.status(404).json({ error: 'User not found' })
      return res.status(402).json({ error: 'Insufficient credits', credits: result.credits })
    }
    res.json({ ok: true, credits: result.credits, spent: amount })
  } catch (err) {
    console.error('[credits] spend error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// --- Idempotencia persistente: evita procesar el mismo evento dos veces ---
// Stripe puede reenviar eventos. markEventProcessed usa UNIQUE(event_id)
// en SQLite, así que sobrevive a reinicios del servidor.
async function handleStripeEvent(event) {
  const processed = await markEventProcessed(event.id)
  if (!processed) {
    console.log(`[webhook] evento ${event.id} ya procesado, ignorado`)
    return
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      // Solo cumple la orden si el pago realmente se completó.
      if (session.payment_status !== 'paid') break

      const credits = Number(session.metadata?.credits ?? 0)
      const email = session.customer_details?.email ?? 'unknown'

      // === AQUÍ acreditas los créditos en TU base de datos ===
      // await db.users.incrementCredits({ email, credits })
      console.log(`[webhook] ✓ Acreditar ${credits} créditos a ${email}`)
      break
    }

    case 'setup_intent.succeeded': {
      // La tarjeta fue validada (activa + titular autenticado vía 3DS).
      // Fuente de verdad fiable: persistimos en la BD desde aquí, no
      // confiando solo en el frontend.
      const si = event.data.object

      // Recupera detalles de la tarjeta y del customer (solo metadatos).
      const pm = await stripe.paymentMethods.retrieve(si.payment_method)
      let email = null
      if (si.customer) {
        const customer = await stripe.customers.retrieve(si.customer)
        email = customer.deleted ? null : customer.email
      }

      await saveValidatedCard({
        pmId: pm.id,
        customerId: si.customer ?? null,
        email,
        brand: pm.card?.brand ?? null,
        last4: pm.card?.last4 ?? null,
        expMonth: pm.card?.exp_month ?? null,
        expYear: pm.card?.exp_year ?? null,
        funding: pm.card?.funding ?? null,
        country: pm.card?.country ?? null,
        cvcCheck: pm.card?.checks?.cvc_check ?? null,
        threeDSecure: si.latest_attempt ? 'authenticated' : 'n/a',
      })

      console.log(`[webhook] ✓ Tarjeta validada y guardada en BD: pm=${pm.id} ${pm.card?.brand} ····${pm.card?.last4}`)
      break
    }

    case 'setup_intent.setup_failed': {
      const si = event.data.object
      console.warn(`[webhook] validación de tarjeta fallida: ${si.last_setup_error?.message ?? 'desconocido'}`)
      break
    }

    case 'payment_intent.succeeded': {
      // Un cobro se completó (incluido el caso en que el cliente terminó
      // el reto 3D Secure de forma asíncrona). Actualiza el recibo.
      const intent = event.data.object
      const charge = intent.charges?.data?.[0]
      await saveCharge({
        piId: intent.id,
        pmId: typeof intent.payment_method === 'string' ? intent.payment_method : null,
        customerId: typeof intent.customer === 'string' ? intent.customer : null,
        email: intent.receipt_email ?? null,
        amount: intent.amount,
        currency: intent.currency,
        status: intent.status,
        description: intent.description ?? null,
        avsLine1: charge?.payment_method_details?.card?.checks?.address_line1_check ?? null,
        avsPostal: charge?.payment_method_details?.card?.checks?.address_postal_code_check ?? null,
        receiptUrl: charge?.receipt_url ?? null,
      })
      console.log(`[webhook] ✓ Cobro completado: pi=${intent.id} ${intent.amount / 100} ${intent.currency}`)
      break
    }

    case 'payment_intent.payment_failed': {
      // Registra el fallo en el recibo correspondiente. Múltiples fallos
      // seguidos => posible card testing; Stripe Radar normalmente lo bloquea.
      const intent = event.data.object
      await saveCharge({
        piId: intent.id,
        pmId: typeof intent.payment_method === 'string' ? intent.payment_method : null,
        customerId: typeof intent.customer === 'string' ? intent.customer : null,
        amount: intent.amount,
        currency: intent.currency,
        status: 'failed',
        description: intent.description ?? null,
      })
      console.warn(`[webhook] pago fallido: ${intent.last_payment_error?.message ?? 'desconocido'}`)
      break
    }

    default:
      // Otros eventos que no nos interesan.
      break
  }
}

// Catálogo de paquetes de créditos (precios en centavos USD).
const PACKAGES = {
  starter: { name: '500 Credits', credits: 500, amount: 500 },   // $5.00
  pro: { name: '2000 Credits', credits: 2000, amount: 1500 },    // $15.00
  elite: { name: '10000 Credits', credits: 10000, amount: 5000 }, // $50.00
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, mode: isLiveKey ? 'live' : 'test' })
})

app.get('/api/packages', (_req, res) => {
  res.json(
    Object.entries(PACKAGES).map(([id, p]) => ({
      id,
      name: p.name,
      credits: p.credits,
      price: p.amount / 100,
    }))
  )
})

// Extrap Database — lookup de BIN (exacto + 40 BINs cercanos).
// Pensado para que el bot de Telegram pueda consumirlo via /gen <bin>.
app.get('/api/extrap/:bin', async (req, res) => {
  try {
    const result = await lookupBin(req.params.bin)
    if (result.error) return res.status(400).json({ error: result.error })
    res.json(result)
  } catch (err) {
    console.error('[extrap] error:', err.message)
    res.status(500).json({ error: 'Lookup failed' })
  }
})

// Crea una sesión de Stripe Checkout para un paquete.
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { packageId } = req.body
    const pkg = PACKAGES[packageId]
    if (!pkg) {
      return res.status(400).json({ error: 'Invalid package' })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: pkg.name },
            unit_amount: pkg.amount,
          },
          quantity: 1,
        },
      ],
      metadata: { packageId, credits: String(pkg.credits) },
      success_url: `${CLIENT_URL}/dashboard/pay/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${CLIENT_URL}/dashboard/pay/cancel`,
    })

    res.json({ url: session.url })
  } catch (err) {
    console.error('create-checkout-session error:', err.message)
    res.status(500).json({ error: 'Could not create checkout session' })
  }
})

// Consulta el estado de una sesión (para la página de éxito).
app.get('/api/checkout-session/:id', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.id)
    res.json({
      status: session.payment_status,
      credits: Number(session.metadata?.credits ?? 0),
      amountTotal: (session.amount_total ?? 0) / 100,
      customerEmail: session.customer_details?.email ?? null,
    })
  } catch (err) {
    console.error('checkout-session error:', err.message)
    res.status(404).json({ error: 'Session not found' })
  }
})

// Crea una factura de Oxapay para pago con crypto.
app.post('/api/oxapay/create-invoice', authMiddleware, async (req, res) => {
  try {
    const { packageId } = req.body
    const pkg = PACKAGES[packageId]
    if (!pkg) return res.status(400).json({ error: 'Invalid package' })

    const apiUrl = `${req.protocol}://${req.get('host')}`
    const orderId = `${req.user.id}:${packageId}`
    const oxaRes = await fetch(`${OXAPAY_API}/payment/invoice`, {
      method: 'POST',
      headers: {
        'merchant_api_key': OXAPAY_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: pkg.amount / 100,
        currency: 'USD',
        order_id: orderId,
        callback_url: `${apiUrl}/api/oxapay/webhook`,
        return_url: `${CLIENT_URL}/dashboard/pay/success?oxapay=1`,
        description: pkg.name,
        lifetime: 60,
        sandbox: !isProd,
      }),
    })
    const oxaData = await oxaRes.json()
    if (!oxaRes.ok || oxaData.error) {
      console.error('[oxapay] error:', oxaData)
      return res.status(500).json({ error: 'Oxapay invoice creation failed' })
    }
    res.json({ url: oxaData.data.payment_url, trackId: oxaData.data.track_id })
  } catch (err) {
    console.error('[oxapay] create-invoice error:', err.message)
    res.status(500).json({ error: 'Could not create Oxapay invoice' })
  }
})

// Proxy para mail.tm (Instaddr) — evita CORS desde el frontend.
const INSTADDR_API = 'https://api.mail.tm'
// Use app.use with a path prefix to match all /api/instaddr/* routes
app.use('/api/instaddr', async (req, res, next) => {
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  try {
    const path = req.path.replace(/^\/+/, '') || ''
    const url = `${INSTADDR_API}/${path}`
    const fetchOpts = { method: req.method, headers: { Accept: 'application/json' } }
    const auth = req.headers.authorization
    if (auth) fetchOpts.headers['Authorization'] = auth
    if (req.method !== 'GET' && req.method !== 'DELETE') {
      fetchOpts.headers['Content-Type'] = 'application/json'
      fetchOpts.body = JSON.stringify(req.body)
    }
    const response = await fetch(url, fetchOpts)
    const text = await response.text()
    res.status(response.status).type('application/json').send(text)
  } catch (err) {
    console.error('[instaddr-proxy] error:', err.message)
    if (!res.headersSent) res.status(502).json({ error: 'Instaddr proxy failed' })
  }
})

// Proxy para temp-sms.org (SMS Pool)
const TEMPSMS_API = 'https://temp-sms.org/api'
app.use('/api/tempsms', async (req, res, next) => {
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  try {
    const path = req.path.replace(/^\/+/, '')
    const url = `${TEMPSMS_API}/${path}`
    const response = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' } })
    const text = await response.text()
    res.status(response.status).type('application/json').send(text)
  } catch (err) {
    console.error('[tempsms-proxy] error:', err.message)
    if (!res.headersSent) res.status(502).json({ error: 'TempSMS proxy failed' })
  }
})

// ---------------------------------------------------------------------------
// Validación de tarjeta SIN cobrar: SetupIntent + 3D Secure (SCA) + AVS/CVC.
//
// Caso de uso legítimo: tu propio cliente guarda SU tarjeta para cobros
// futuros (suscripción, "pagar después"). Valida que la tarjeta es real,
// activa y que el TITULAR la controla — sin mover dinero.
//
// La autenticación 3D Secure es obligatoria aquí: es lo que diferencia
// validar tu propia tarjeta (legal) de probar tarjetas ajenas (fraude).
// ---------------------------------------------------------------------------
app.post('/api/create-setup-intent', authMiddleware, async (req, res) => {
  try {
    const { email } = req.body

    const customer = await stripe.customers.create({
      email: email || undefined,
    })

    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      payment_method_types: ['card'],
      payment_method_options: {
        card: {
          request_three_d_secure: 'any',
        },
      },
    })

    res.json({
      clientSecret: setupIntent.client_secret,
      customerId: customer.id,
    })
  } catch (err) {
    console.error('create-setup-intent error:', err.message)
    res.status(500).json({ error: 'Could not create setup intent' })
  }
})

// Tras confirmar en el frontend, consulta el resultado de la validación
app.get('/api/setup-intent/:id', authMiddleware, async (req, res) => {
  try {
    const intent = await stripe.setupIntents.retrieve(req.params.id, {
      expand: ['payment_method', 'latest_attempt'],
    })

    const pm = intent.payment_method
    const checks = pm?.card?.checks ?? {}
    const attempt = intent.latest_attempt

    res.json({
      status: intent.status,
      card: pm?.card
        ? {
            brand: pm.card.brand,
            last4: pm.card.last4,
            expMonth: pm.card.exp_month,
            expYear: pm.card.exp_year,
            funding: pm.card.funding,
            country: pm.card.country,
          }
        : null,
      validation: {
        cvcCheck: checks.cvc_check ?? null,
        addressLine1Check: checks.address_line1_check ?? null,
        postalCodeCheck: checks.address_postal_code_check ?? null,
        threeDSecure: attempt?.payment_method_details?.card?.three_d_secure?.result ?? 'n/a',
      },
    })
  } catch (err) {
    console.error('setup-intent error:', err.message)
    res.status(404).json({ error: 'Setup intent not found' })
  }
})

// Lista los métodos de pago validados y guardados (solo metadatos seguros).
app.get('/api/saved-cards', authMiddleware, async (req, res) => {
  try {
    const { email } = req.query
    const cards = await listValidatedCards(typeof email === 'string' ? email : undefined)
    res.json(
      cards.map((c) => ({
        id: c.id,
        paymentMethodId: c.stripe_pm_id,
        customerId: c.stripe_customer,
        brand: c.brand,
        last4: c.last4,
        expMonth: c.exp_month,
        expYear: c.exp_year,
        funding: c.funding,
        country: c.country,
        cvcCheck: c.cvc_check,
        threeDSecure: c.three_d_secure,
        email: c.email,
        validatedAt: c.validated_at,
      }))
    )
  } catch (err) {
    console.error('saved-cards error:', err.message)
    res.status(500).json({ error: 'Could not list saved cards' })
  }
})

// ---------------------------------------------------------------------------
// Cobro OFF-SESSION a un método de pago guardado.
//
// Caso de uso legítimo: cobrar una tarjeta que el propio titular validó y
// autorizó antes (suscripción, "pagar después"). El cliente no está presente,
// por eso off_session: true. Si el banco exige autenticación (SCA), Stripe
// lanza 'authentication_required' y devolvemos requires_action para que el
// cliente complete el reto 3D Secure.
//
// El resultado se guarda como un RECIBO (tabla charges) ligado al método de
// pago y al usuario. No se etiqueta ni se acumula en ningún pool.
// ---------------------------------------------------------------------------
app.post('/api/charge-saved-card', authMiddleware, async (req, res) => {
  try {
    const { paymentMethodId, customerId, amount, currency = 'usd', description } = req.body

    if (!paymentMethodId || !customerId) {
      return res.status(400).json({ error: 'paymentMethodId and customerId are required' })
    }
    const cents = Math.round(Number(amount) * 100)
    if (!Number.isFinite(cents) || cents <= 0) {
      return res.status(400).json({ error: 'Invalid amount' })
    }

    let intent
    try {
      intent = await stripe.paymentIntents.create({
        amount: cents,
        currency,
        customer: customerId,
        payment_method: paymentMethodId,
        description: description || 'Off-session charge',
        off_session: true, // el titular no está presente
        confirm: true,     // intenta cobrar inmediatamente
      })
    } catch (err) {
      // El banco requiere autenticación: el cargo no procede sin SCA.
      if (err.code === 'authentication_required') {
        const pi = err.raw?.payment_intent
        if (pi) {
          await saveCharge({
            piId: pi.id,
            pmId: paymentMethodId,
            customerId,
            amount: cents,
            currency,
            status: 'requires_action',
            description,
          })
          return res.json({
            status: 'requires_action',
            clientSecret: pi.client_secret,
            paymentIntentId: pi.id,
            message: 'Authentication required. Complete 3D Secure to finish the charge.',
          })
        }
      }
      // Tarjeta declinada u otro error del cargo.
      return res.status(402).json({
        status: 'failed',
        error: err.message,
        code: err.code ?? null,
      })
    }

    // Cargo exitoso: registra el recibo.
    const charge = intent.charges?.data?.[0]
    await saveCharge({
      piId: intent.id,
      pmId: paymentMethodId,
      customerId,
      amount: intent.amount,
      currency: intent.currency,
      status: intent.status,
      description,
      avsLine1: charge?.payment_method_details?.card?.checks?.address_line1_check ?? null,
      avsPostal: charge?.payment_method_details?.card?.checks?.address_postal_code_check ?? null,
      receiptUrl: charge?.receipt_url ?? null,
    })

    res.json({
      status: intent.status, // succeeded
      paymentIntentId: intent.id,
      amount: intent.amount / 100,
      currency: intent.currency,
      receiptUrl: charge?.receipt_url ?? null,
    })
  } catch (err) {
    console.error('charge-saved-card error:', err.message)
    res.status(500).json({ error: 'Could not process charge' })
  }
})

// Lista los recibos de cobros (historial de transacciones).
app.get('/api/charges', authMiddleware, async (req, res) => {
  try {
    const { email } = req.query
    const rows = await listCharges(typeof email === 'string' ? email : undefined)
    res.json(
      rows.map((c) => ({
        id: c.id,
        paymentIntentId: c.stripe_pi_id,
        last4FromPm: c.stripe_pm_id,
        email: c.email,
        amount: c.amount / 100,
        currency: c.currency,
        status: c.status,
        description: c.description,
        avsLine1: c.avs_line1,
        avsPostal: c.avs_postal,
        receiptUrl: c.receipt_url,
        createdAt: c.created_at,
      }))
    )
  } catch (err) {
    console.error('charges error:', err.message)
    res.status(500).json({ error: 'Could not list charges' })
  }
})

// --- Telegram Bot API ---

// Start bot if TELEGRAM_BOT_TOKEN is set
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
let botActive = false
if (TELEGRAM_BOT_TOKEN) {
  // Test the token first so we log a clear error early
  fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`)
    .then((r) => r.json())
    .then((data) => {
      if (data.ok) {
        console.log(`[i] Telegram token OK — bot @${data.result.username} (id=${data.result.id})`)
        return startBot(TELEGRAM_BOT_TOKEN)
      } else {
        console.error(`[!] Telegram token INVALID: ${data.description || JSON.stringify(data)}`)
        console.error('[!] Live notifications will NOT work until TELEGRAM_BOT_TOKEN is fixed in Render env')
      }
    })
    .then(() => {
      botActive = true
      console.log('[i] Telegram bot started')
    })
    .catch((err) => {
      console.error('[!] Failed to reach Telegram API:', err.message)
      console.error('[!] Check Render network egress to api.telegram.org')
    })
} else {
  console.warn('[!] TELEGRAM_BOT_TOKEN not set in env — live notifications disabled')
}

// Debug: muestra el telegram_id de un user (admin puede ver el de cualquiera, user solo el suyo)
app.get('/api/telegram/my-id', authMiddleware, async (req, res) => {
  res.json({
    username: req.user.username,
    userId: req.user.id,
    telegram_id: req.user.telegram_id || null,
  })
})

// Helper: envía un mensaje a un chat vía Telegram API
async function tgSendMessage(token, chatId, text) {
  const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'MarkdownV2',
      disable_web_page_preview: true,
    }),
  })
  if (!r.ok) {
    const err = await r.json().catch(() => ({}))
    return { ok: false, error: err.description || `HTTP ${r.status}` }
  }
  return { ok: true }
}

// Endpoint unificado: el cliente llama esto cuando se detecta una live.
// El server envia la live SOLO al telegram_id del user que la detectó.
// (No broadcast — cada user recibe solo SUS propias live.)
app.post('/api/telegram/notify-live', authMiddleware, express.json(), async (req, res) => {
  try {
    if (!TELEGRAM_BOT_TOKEN) {
      return res.status(503).json({ error: 'TELEGRAM_BOT_TOKEN not configured on server' })
    }
    const { payload } = req.body
    if (!payload) return res.status(400).json({ error: 'payload required' })

    if (!req.user.telegram_id) {
      console.log(`[Telegram] notify-live: user ${req.user.username} has no telegram_id, skipping send`)
      return res.json({ ok: true, sent: false, reason: 'no telegram_id' })
    }

    const text = fmtBroadcast(payload, req.user.credits ?? null)
    const r = await tgSendMessage(TELEGRAM_BOT_TOKEN, req.user.telegram_id, text)
    if (r.ok) {
      console.log(`[Telegram] notify-live → user ${req.user.username} (${req.user.telegram_id}) OK`)
      return res.json({ ok: true, sent: true })
    }
    console.warn(`[Telegram] notify-live → user ${req.user.username} (${req.user.telegram_id}) FAILED: ${r.error}`)
    res.status(502).json({ ok: false, error: r.error })
  } catch (err) {
    console.error('[Telegram] notify-live error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// Broadcast a live card to all subscribers
app.post('/api/telegram/broadcast', authMiddleware, express.json(), async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' })
    const { botToken, payload } = req.body
    const token = botToken || TELEGRAM_BOT_TOKEN
    if (!token) return res.status(400).json({ error: 'No bot token available' })

    const subscribers = await listSubscribers(true)
    if (subscribers.length === 0) return res.json({ sent: 0, total: 0 })

    const TG_API = 'https://api.telegram.org/bot'
    let sent = 0

    await Promise.allSettled(
      subscribers.map(async (sub) => {
        try {
          const user = await getUserByTelegramId(sub.chat_id)
          const text = fmtBroadcast(payload, user ? user.credits : null)
          const r = await fetch(`${TG_API}${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: sub.chat_id,
              text,
              parse_mode: 'MarkdownV2',
              disable_web_page_preview: true,
            }),
          })
          if (r.ok) sent++
        } catch (e) {
          console.warn(`[Telegram] Failed to send to ${sub.chat_id}:`, e.message)
        }
      })
    )

    res.json({ sent, total: subscribers.length })
  } catch (err) {
    console.error('[Telegram] Broadcast error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// Test Telegram connection
app.post('/api/telegram/test', authMiddleware, express.json(), async (req, res) => {
  try {
    const { botToken, chatId } = req.body
    if (!botToken) return res.status(400).json({ ok: false, error: 'Bot token required' })
    if (!chatId) return res.status(400).json({ ok: false, error: 'Chat ID required' })

    const TG_API = 'https://api.telegram.org/bot'
    const r = await fetch(`${TG_API}${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: '🟢 *No Face Checker* — Telegram bot connected successfully\\!',
        parse_mode: 'MarkdownV2',
      }),
    })

    if (!r.ok) {
      const err = await r.json().catch(() => ({}))
      return res.json({ ok: false, error: err.description || `HTTP ${r.status}` })
    }
    res.json({ ok: true })
  } catch (err) {
    res.json({ ok: false, error: String(err) })
  }
})

// Send a personal notification to a single chat
app.post('/api/telegram/send-personal', authMiddleware, express.json(), async (req, res) => {
  try {
    const { botToken, chatId, payload } = req.body
    const token = botToken || TELEGRAM_BOT_TOKEN
    if (!token) return res.status(400).json({ error: 'Bot token required' })
    if (!chatId) return res.status(400).json({ error: 'Chat ID required' })
    if (!payload) return res.status(400).json({ error: 'Payload required' })

    const TG_API = 'https://api.telegram.org/bot'
    const text = fmtBroadcast(payload, null)
    const r = await fetch(`${TG_API}${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'MarkdownV2',
        disable_web_page_preview: true,
      }),
    })

    if (!r.ok) {
      const err = await r.json().catch(() => ({}))
      console.warn(`[Telegram] send-personal FAILED: userId=${req.user.id} (${req.user.username}) chatId=${chatId} → ${err.description || r.status}`)
      return res.status(400).json({ error: err.description || 'Failed to send' })
    }
    console.log(`[Telegram] send-personal OK: userId=${req.user.id} (${req.user.username}) chatId=${chatId}`)
    res.json({ sent: 1 })
  } catch (err) {
    console.error('[Telegram] Send personal error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// Current deploy version (for auto-refresh)
app.get('/api/version', (_req, res) => {
  res.json({ version: DEPLOY_VERSION })
})

// Check if the authenticated user is subscribed
app.get('/api/telegram/am-i-subscribed', authMiddleware, async (req, res) => {
  try {
    const user = await getUserById(req.user.id)
    if (!user || !user.telegram_id) return res.json({ subscribed: false })
    const subs = await listSubscribers()
    const subscribed = subs.some((s) => s.chat_id === user.telegram_id)
    res.json({ subscribed })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Subscribe the authenticated user's telegram_id
app.post('/api/telegram/subscribe-me', authMiddleware, async (req, res) => {
  try {
    const user = await getUserById(req.user.id)
    if (!user || !user.telegram_id) return res.json({ ok: true, skipped: true })
    await addSubscriber(user.telegram_id, user.username, user.username)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// List all subscribers
app.get('/api/telegram/subscribers', authMiddleware, async (_req, res) => {
  try {
    if (_req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' })
    const subs = await listSubscribers(true)
    res.json({ subscribers: subs, count: subs.length })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

function escapeMd(text) {
  return String(text).replace(/([_*[\]()~`>#+\-=|{}.!])/g, '\\$1')
}

function fmtBroadcast(payload, credits) {
  const lines = [
    `🔥 *LIVE HIT* 🔥`,
    ``,
    '```',
    `${escapeMd(payload.raw)}`,
    '```',
    ``,
    `╭── *GATE* ──╮`,
    `│ ${escapeMd(payload.gateName)}`,
    `╰────────────╯`,
    ``,
    `├ BIN:     \`${escapeMd(payload.bin)}\``,
    `├ BRAND:   ${escapeMd(payload.brand)}`,
    `├ BANK:    ${escapeMd(payload.bank)}`,
    `├ COUNTRY: ${payload.countryEmoji} ${escapeMd(payload.country)}`,
    `└ TYPE:    ${escapeMd(payload.cardType)} \\| ${escapeMd(payload.cardCategory)}`,
    ``,
    `✅ *${escapeMd(payload.message)}*`,
  ]
  if (credits != null) {
    lines.push(
      ``,
      `├ CREDITS: ${escapeMd(String(credits))}`,
    )
  }
  return lines.join('\n')
}

// --- Lives API (persistencia servidor) ---

app.get('/api/lives', authMiddleware, async (req, res) => {
  try {
    const lives = await listLives(req.user.id)
    res.json({ lives })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/lives/save', authMiddleware, async (req, res) => {
  try {
    const { live } = req.body
    if (!live || !live.raw) return res.status(400).json({ error: 'Live data required' })
    await saveLive(req.user.id, live)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/lives/save-batch', authMiddleware, async (req, res) => {
  try {
    const { lives } = req.body
    if (!Array.isArray(lives)) return res.status(400).json({ error: 'Array of lives required' })
    for (const live of lives) {
      if (live.raw) await saveLive(req.user.id, live)
    }
    res.json({ ok: true, saved: lives.length })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/lives/delete', authMiddleware, async (req, res) => {
  try {
    const { raw } = req.body
    if (!raw) return res.status(400).json({ error: 'raw required' })
    await deleteLive(req.user.id, raw)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/lives/clear', authMiddleware, async (req, res) => {
  try {
    await clearLives(req.user.id)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// --- Gate Access API (renta de gates por d+�a) ---

app.get('/api/admin/gate-access', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' })
    const records = await listAllGateAccess()
    res.json(records)
  } catch (err) {
    console.error('[admin] gate-access list error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/admin/gate-access', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' })
    const { userId, gateId, days } = req.body
    if (!userId || !gateId || !Array.isArray(days)) {
      return res.status(400).json({ error: 'userId, gateId, and days array required' })
    }
    const todayUtc = new Date().toISOString().split('T')[0]
    console.log(`[admin] gate-access: userId=${Number(userId)} gateId=${gateId} days=${JSON.stringify(days)} (today UTC=${todayUtc})`)
    await setGateAccess(Number(userId), gateId, days)
    res.json({ ok: true, today: todayUtc, savedDays: days })
  } catch (err) {
    console.error('[admin] gate-access set error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.delete('/api/admin/gate-access/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' })
    await deleteGateAccessById(Number(req.params.id))
    res.json({ ok: true })
  } catch (err) {
    console.error('[admin] gate-access delete error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/gate-access/my', authMiddleware, async (req, res) => {
  try {
    const records = await listUserGateAccess(req.user.id)
    res.json(records)
  } catch (err) {
    console.error('[gate-access] my error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/gate-access/check/:gateId', authMiddleware, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const hasAccess = await checkGateAccessToday(req.user.id, req.params.gateId)
    console.log(`[gate-access] check: userId=${req.user.id} gateId=${req.params.gateId} today=${today} hasAccess=${hasAccess}`)
    res.json({ hasAccess, today })
  } catch (err) {
    console.error('[gate-access] check error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// Debug: muestra el gate_access guardado para un user (solo admin)
app.get('/api/admin/gate-access/user/:userId', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' })
    const { listAllGateAccess } = await import('./db.js')
    const all = await listAllGateAccess()
    const userRecords = all.filter((r) => String(r.user_id) === String(req.params.userId))
    res.json({ today: new Date().toISOString().split('T')[0], records: userRecords })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// --- Global error handler (no leakear stack traces) ---
app.use((err, req, res, _next) => {
  console.error('[error]', err.message)
  const status = err.status || 500
  res.status(status).json({
    error: isProd ? 'Internal server error' : err.message,
  })
})

// Endpoint para promover un usuario a admin (protegido por setup key)
const ADMIN_SETUP_KEY = process.env.ADMIN_SETUP_KEY
app.post('/api/admin/setup', async (req, res) => {
  const { username, key } = req.body
  if (!ADMIN_SETUP_KEY) return res.status(403).json({ error: 'Admin setup is disabled. Set ADMIN_SETUP_KEY env var.' })
  if (typeof key !== 'string' || typeof username !== 'string') return res.status(400).json({ error: 'Invalid payload' })
  const a = Buffer.from(key)
  const b = Buffer.from(ADMIN_SETUP_KEY)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ error: 'Invalid setup key' })
  }
  if (username.length < 1 || username.length > 64) return res.status(400).json({ error: 'Username required' })
  try {
    const user = await getUserByUsername(username)
    if (!user) return res.status(404).json({ error: `User "${username}" not found. Register first.` })
    if (user.role === 'admin') return res.json({ ok: true, message: `${username} is already admin` })
    await setUserRole(username, 'admin')
    res.json({ ok: true, message: `${username} is now admin` })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// --- Stats endpoints ---

app.post('/api/stats/record', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body
    if (!['live', 'dead', 'unknown'].includes(status)) return res.status(400).json({ error: 'Invalid status' })
    await recordCheck(req.user.id, status)
    const stats = await getUserStats(req.user.id)
    res.json({ ok: true, stats })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/stats/me', authMiddleware, async (req, res) => {
  try {
    const stats = await getUserStats(req.user.id)
    res.json(stats)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/stats/global', async (req, res) => {
  try {
    const stats = await getGlobalStats()
    const rankers = await getTopRankers()
    res.json({ ...stats, rankers })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/admin/reset-stats', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
    await resetAllStats()
    res.json({ ok: true, message: 'All stats reset to 0' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// En producción, servir el frontend build desde dist/ si existe
if (isProd) {
  const distPath = path.join(__dirname, '../dist')
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath))
    app.get('/{*path}', (req, res) => {
      const indexFile = path.join(distPath, 'index.html')
      if (fs.existsSync(indexFile)) return res.sendFile(indexFile)
      res.status(404).json({ error: 'Not found' })
    })
  }
}

// Seed: crear admin por defecto si no existe
async function seedAdmin() {
  const ADMIN_USER = process.env.ADMIN_USER || 'admin'
  const ADMIN_PASS = process.env.ADMIN_PASS || (isProd ? '' : 'admin123')
  if (isProd && !ADMIN_PASS) {
    console.error('[!] FATAL: ADMIN_PASS must be set in production')
    process.exit(1)
  }
  try {
    const existing = await getUserByUsername(ADMIN_USER)
    if (!existing) {
      const hash = await bcrypt.hash(ADMIN_PASS, 10)
      const user = await createUser(ADMIN_USER, hash)
      if (user) {
        await setUserRole(ADMIN_USER, 'admin')
        console.log(`[seed] Admin user "${ADMIN_USER}" created`)
      }
    } else {
      if (existing.role !== 'admin') {
        await setUserRole(ADMIN_USER, 'admin')
        console.log(`[seed] User "${ADMIN_USER}" promoted to admin`)
      }
      // Actualizar password si ADMIN_PASS está definido
      if (process.env.ADMIN_PASS) {
        const hash = await bcrypt.hash(ADMIN_PASS, 10)
        await updateUserPassword(ADMIN_USER, hash)
        console.log(`[seed] Admin password updated`)
      }
    }

    const EXTRA_ADMINS = ['ElBoni87']
    for (const username of EXTRA_ADMINS) {
      const u = await getUserByUsername(username)
      if (!u) {
        console.warn(`[seed] Extra admin "${username}" not found — register the account first`)
        continue
      }
      if (u.role !== 'admin') {
        await setUserRole(username, 'admin')
        console.log(`[seed] User "${username}" promoted to admin`)
      } else {
        console.log(`[seed] User "${username}" is already admin`)
      }
    }
  } catch (err) {
    console.error('[seed] Error:', err.message)
  }
}

app.listen(PORT, async () => {
  await initDb()
  await seedAdmin()
  const restored = await restoreCreditsFromBackup()
  if (restored) console.log('[credits] Backup restored successfully')
  console.log(`\n[✓] Payments server (${isLiveKey ? 'LIVE' : 'TEST'}) running at http://localhost:${PORT}`)
  console.log(`    Allowed client: ${CLIENT_URL}\n`)
  if (botActive) console.log(`[✓] Telegram bot active — ${await getSubscriberCount()} subscribers`)
})

const shutdown = async (signal) => {
  console.log(`\n[shutdown] ${signal} received, flushing...`)
  try { await flushBackup() } catch (e) { console.error('[shutdown] flush error:', e.message) }
  process.exit(0)
}
process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
