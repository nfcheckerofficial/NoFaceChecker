// ---------------------------------------------------------------------------
// Capa de base de datos (SQLite v+�a better-sqlite3).
//
// CUMPLIMIENTO PCI-DSS ��� qu+� se guarda aqu+�:
//   ԣ� Token del m+�todo de pago de Stripe (pm_xxx)  -> referencia opaca
//   ԣ� Token del customer de Stripe (cus_xxx)
//   ԣ� +�ltimos 4 d+�gitos, marca, expiraci+�n, funding, pa+�s  -> metadatos
//
// LO QUE NUNCA SE GUARDA (prohibido por PCI-DSS):
//   ԣ� N+�mero de tarjeta completo (PAN)
//   ԣ� CVC / CVV
//   ԣ� Banda magn+�tica / datos del chip / PIN
//
// El PAN nunca llega a este servidor: vive solo en el iframe de Stripe.
// ---------------------------------------------------------------------------

import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'
import { mkdirSync, existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Render monta un disco persistente y define RENDER_DISK_MOUNT_PATH autom+�ticamente.
// Si no hay disco, usa la ruta local por defecto.
const diskPath = process.env.RENDER_DISK_MOUNT_PATH
const dbDir = diskPath || __dirname
if (!existsSync(dbDir)) mkdirSync(dbDir, { recursive: true })
const db = new Database(join(dbDir, 'payments.db'))

// WAL: mejor concurrencia entre el webhook y las rutas HTTP.
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS payment_methods (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    stripe_pm_id    TEXT NOT NULL UNIQUE,   -- pm_xxx (token, no es el PAN)
    stripe_customer TEXT,                   -- cus_xxx
    email           TEXT,
    brand           TEXT,
    last4           TEXT,                    -- solo +�ltimos 4, permitido
    exp_month       INTEGER,
    exp_year        INTEGER,
    funding         TEXT,                    -- credit / debit / prepaid
    country         TEXT,
    cvc_check       TEXT,                    -- pass / fail / unavailable
    three_d_secure  TEXT,                    -- estado de la autenticaci+�n
    validated_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS users (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    username        TEXT NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    credits         INTEGER NOT NULL DEFAULT 0,
    role            TEXT NOT NULL DEFAULT 'user',
    telegram_id     TEXT,
    telegram_username TEXT,
    telegram_name   TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS telegram_subscribers (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id   TEXT NOT NULL UNIQUE,
    username  TEXT,
    first_name TEXT,
    subscribed_at TEXT NOT NULL DEFAULT (datetime('now')),
    active    INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS lives (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id   INTEGER NOT NULL,
    raw       TEXT NOT NULL,
    number    TEXT NOT NULL,
    gate_id   TEXT,
    gate_name TEXT,
    message   TEXT,
    bank      TEXT,
    card_type TEXT,
    brand     TEXT,
    country   TEXT,
    country_emoji TEXT,
    enriched  INTEGER NOT NULL DEFAULT 0,
    captured_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Garantiza idempotencia de webhooks: un event_id se procesa una sola vez.
  CREATE TABLE IF NOT EXISTS processed_events (
    event_id     TEXT PRIMARY KEY,
    processed_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Acceso de usuarios a gates por d+�a (renta por d+�a).
  CREATE TABLE IF NOT EXISTS gate_access (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL,
    gate_id         TEXT NOT NULL,
    days            TEXT NOT NULL DEFAULT '[]',
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, gate_id)
  );

  -- Recibos de cobros off-session a un m+�todo de pago guardado.
  -- Cada fila es una transacci+�n real autorizada por el titular.
  CREATE TABLE IF NOT EXISTS charges (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    stripe_pi_id    TEXT NOT NULL UNIQUE,   -- pi_xxx (PaymentIntent)
    stripe_pm_id    TEXT,                   -- pm_xxx cargado
    stripe_customer TEXT,                   -- cus_xxx
    email           TEXT,
    amount          INTEGER NOT NULL,        -- en centavos
    currency        TEXT NOT NULL,
    status          TEXT NOT NULL,           -- succeeded / requires_action / failed
    description     TEXT,
    avs_line1       TEXT,                    -- resultado AVS de este cargo
    avs_postal      TEXT,
    receipt_url     TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );
`)

// --- Indexes ---
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
  CREATE INDEX IF NOT EXISTS idx_lives_user_id ON lives(user_id);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_lives_user_raw ON lives(user_id, raw);
  CREATE INDEX IF NOT EXISTS idx_charges_email ON charges(email);
  CREATE INDEX IF NOT EXISTS idx_payment_methods_email ON payment_methods(email);
  CREATE INDEX IF NOT EXISTS idx_gate_access_user ON gate_access(user_id);
`)

// Migrations: add missing columns to existing tables
const existingCols = db.prepare(`PRAGMA table_info(users)`).all().map(c => c.name)
const addCol = (col, type) => {
  if (!existingCols.includes(col)) {
    db.exec(`ALTER TABLE users ADD COLUMN ${col} ${type}`)
    console.log(`[migrate] Added column: ${col}`)
  }
}
addCol('telegram_id', 'TEXT')
addCol('telegram_username', 'TEXT')
addCol('telegram_name', 'TEXT')
addCol('checks_total', 'INTEGER NOT NULL DEFAULT 0')
addCol('checks_live', 'INTEGER NOT NULL DEFAULT 0')
addCol('checks_dead', 'INTEGER NOT NULL DEFAULT 0')
addCol('checks_unknown', 'INTEGER NOT NULL DEFAULT 0')

/** Marca un evento como procesado. Devuelve false si ya lo estaba (idempotencia). */
export function markEventProcessed(eventId) {
  try {
    db.prepare('INSERT INTO processed_events (event_id) VALUES (?)').run(eventId)
    return true
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') return false
    throw err
  }
}

/**
 * Guarda (o actualiza) un m+�todo de pago validado.
 * Recibe SOLO tokens y metadatos seguros, nunca datos sensibles.
 */
export function saveValidatedCard(data) {
  const stmt = db.prepare(`
    INSERT INTO payment_methods
      (stripe_pm_id, stripe_customer, email, brand, last4,
       exp_month, exp_year, funding, country, cvc_check, three_d_secure)
    VALUES
      (@stripe_pm_id, @stripe_customer, @email, @brand, @last4,
       @exp_month, @exp_year, @funding, @country, @cvc_check, @three_d_secure)
    ON CONFLICT(stripe_pm_id) DO UPDATE SET
      cvc_check      = excluded.cvc_check,
      three_d_secure = excluded.three_d_secure,
      validated_at   = datetime('now')
  `)
  return stmt.run({
    stripe_pm_id: data.pmId,
    stripe_customer: data.customerId ?? null,
    email: data.email ?? null,
    brand: data.brand ?? null,
    last4: data.last4 ?? null,
    exp_month: data.expMonth ?? null,
    exp_year: data.expYear ?? null,
    funding: data.funding ?? null,
    country: data.country ?? null,
    cvc_check: data.cvcCheck ?? null,
    three_d_secure: data.threeDSecure ?? null,
  })
}

/** Registra (o actualiza) un cobro off-session. Idempotente por pi_id. */
export function saveCharge(data) {
  const stmt = db.prepare(`
    INSERT INTO charges
      (stripe_pi_id, stripe_pm_id, stripe_customer, email, amount, currency,
       status, description, avs_line1, avs_postal, receipt_url)
    VALUES
      (@stripe_pi_id, @stripe_pm_id, @stripe_customer, @email, @amount, @currency,
       @status, @description, @avs_line1, @avs_postal, @receipt_url)
    ON CONFLICT(stripe_pi_id) DO UPDATE SET
      status      = excluded.status,
      avs_line1   = excluded.avs_line1,
      avs_postal  = excluded.avs_postal,
      receipt_url = excluded.receipt_url
  `)
  return stmt.run({
    stripe_pi_id: data.piId,
    stripe_pm_id: data.pmId ?? null,
    stripe_customer: data.customerId ?? null,
    email: data.email ?? null,
    amount: data.amount,
    currency: data.currency,
    status: data.status,
    description: data.description ?? null,
    avs_line1: data.avsLine1 ?? null,
    avs_postal: data.avsPostal ?? null,
    receipt_url: data.receiptUrl ?? null,
  })
}

/** Lista los cobros registrados (recibos). */
export function listCharges(email) {
  if (email) {
    return db
      .prepare('SELECT * FROM charges WHERE email = ? ORDER BY created_at DESC')
      .all(email)
  }
  return db.prepare('SELECT * FROM charges ORDER BY created_at DESC').all()
}

/** Lista los m+�todos de pago guardados (datos seguros para mostrar). */
export function listValidatedCards(email) {
  if (email) {
    return db
      .prepare('SELECT * FROM payment_methods WHERE email = ? ORDER BY validated_at DESC')
      .all(email)
  }
  return db.prepare('SELECT * FROM payment_methods ORDER BY validated_at DESC').all()
}

// --- Telegram subscribers ---

export function addSubscriber(chatId, username, firstName) {
  try {
    db.prepare(`
      INSERT INTO telegram_subscribers (chat_id, username, first_name, active)
      VALUES (?, ?, ?, 1)
      ON CONFLICT(chat_id) DO UPDATE SET
        active = 1, username = excluded.username, first_name = excluded.first_name
    `).run(chatId, username || null, firstName || null)
    return true
  } catch (err) {
    console.error('[db] addSubscriber error:', err.message)
    return false
  }
}

export function removeSubscriber(chatId) {
  try {
    db.prepare('UPDATE telegram_subscribers SET active = 0 WHERE chat_id = ?').run(chatId)
    return true
  } catch (err) {
    console.error('[db] removeSubscriber error:', err.message)
    return false
  }
}

export function listSubscribers(onlyActive = true) {
  if (onlyActive) {
    return db.prepare('SELECT * FROM telegram_subscribers WHERE active = 1 ORDER BY subscribed_at DESC').all()
  }
  return db.prepare('SELECT * FROM telegram_subscribers ORDER BY subscribed_at DESC').all()
}

export function getSubscriberCount() {
  const row = db.prepare('SELECT COUNT(*) as count FROM telegram_subscribers WHERE active = 1').get()
  return row.count
}

// --- Auth users ---

export function createUser(username, passwordHash, telegramId) {
  try {
    db.prepare(`
      INSERT INTO users (username, password_hash, credits, role, telegram_id)
      VALUES (?, ?, 0, 'user', ?)
    `).run(username, passwordHash, telegramId || null)
    return db.prepare('SELECT id, username, credits, role, telegram_id, created_at FROM users WHERE username = ?').get(username)
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') return null
    throw err
  }
}

export function getUserByUsername(username) {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username)
}

export function getUserById(id) {
  return db.prepare('SELECT id, username, credits, role, telegram_id, created_at FROM users WHERE id = ?').get(id)
}

export function getUserByTelegramId(telegramId) {
  return db.prepare('SELECT id, username, credits, role, telegram_id, created_at FROM users WHERE telegram_id = ?').get(telegramId)
}

const BACKUP_FILE = join(dbDir, 'credits_backup.json')

function saveCreditsBackup() {
  try {
    const users = db.prepare('SELECT username, credits FROM users').all()
    const data = Object.fromEntries(users.map(u => [u.username, u.credits]))
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(data, null, 2))
  } catch (err) {
    console.error('[credits] Backup failed:', err.message)
  }
}

function restoreCreditsFromBackup() {
  try {
    if (!fs.existsSync(BACKUP_FILE)) return false
    const raw = fs.readFileSync(BACKUP_FILE, 'utf-8')
    const data = JSON.parse(raw)
    const stmt = db.prepare('UPDATE users SET credits = ? WHERE username = ?')
    const tx = db.transaction(() => {
      for (const [username, credits] of Object.entries(data)) {
        const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
        if (exists) stmt.run(credits, username)
      }
    })
    tx()
    console.log(`[credits] Restored ${Object.keys(data).length} users from backup`)
    return true
  } catch (err) {
    console.error('[credits] Restore failed:', err.message)
    return false
  }
}

export function updateUserCredits(username, credits) {
  const before = db.prepare('SELECT credits FROM users WHERE username = ?').get(username)
  db.prepare('UPDATE users SET credits = ? WHERE username = ?').run(credits, username)
  saveCreditsBackup()
  console.log(`[credits] ${username}: ${before?.credits ?? '?'} ��� ${credits}`)
}

export function resetAllCredits() {
  console.warn(`[credits] RESET ALL to 0 at ${new Date().toISOString()}`)
  db.prepare('UPDATE users SET credits = 0').run()
  saveCreditsBackup()
}

export { restoreCreditsFromBackup }

export function ensureTelegramUser(chatId, username, firstName) {
  const existing = db.prepare('SELECT id FROM users WHERE telegram_id = ?').get(chatId)
  if (existing) {
    db.prepare('UPDATE users SET telegram_username = ?, telegram_name = ? WHERE id = ?').run(username || null, firstName || null, existing.id)
    return existing.id
  }
  const genUsername = 'tg_' + chatId
  const hash = 'telegram_only_' + Date.now() + '_' + Math.random().toString(36).slice(2)
  db.prepare(`
    INSERT INTO users (username, password_hash, credits, role, telegram_id, telegram_username, telegram_name)
    VALUES (?, ?, 0, 'user', ?, ?, ?)
    ON CONFLICT(username) DO UPDATE SET telegram_id = excluded.telegram_id
  `).run(genUsername, hash, chatId, username || null, firstName || null)
  return db.prepare('SELECT id FROM users WHERE telegram_id = ?').get(chatId).id
}

export function listUsers() {
  return db.prepare('SELECT id, username, credits, role, telegram_id, created_at FROM users ORDER BY created_at DESC').all()
}

export function setUserRole(username, role) {
  db.prepare('UPDATE users SET role = ? WHERE username = ?').run(role, username)
}

export function deleteUser(userId) {
  db.prepare('DELETE FROM users WHERE id = ?').run(userId)
}

export function updateUserPassword(username, hash) {
  db.prepare('UPDATE users SET password_hash = ? WHERE username = ?').run(hash, username)
}

export function recordCheck(userId, status) {
  db.prepare(`
    UPDATE users SET
      checks_total = checks_total + 1,
      checks_live  = checks_live  + CASE WHEN ? = 'live'    THEN 1 ELSE 0 END,
      checks_dead  = checks_dead  + CASE WHEN ? = 'dead'    THEN 1 ELSE 0 END,
      checks_unknown = checks_unknown + CASE WHEN ? = 'unknown' THEN 1 ELSE 0 END
    WHERE id = ?
  `).run(status, status, status, userId)
}

export function getUserStats(userId) {
  return db.prepare(`
    SELECT checks_total, checks_live, checks_dead, checks_unknown
    FROM users WHERE id = ?
  `).get(userId)
}

export function getGlobalStats() {
  return db.prepare(`
    SELECT
      COALESCE(SUM(checks_total), 0) AS checks_total,
      COALESCE(SUM(checks_live), 0) AS checks_live,
      COALESCE(SUM(checks_dead), 0) AS checks_dead,
      COALESCE(SUM(checks_unknown), 0) AS checks_unknown
    FROM users
  `).get()
}

export function getTopRankers(limit = 5) {
  return db.prepare(`
    SELECT username, checks_live AS value
    FROM users WHERE checks_live > 0
    ORDER BY checks_live DESC LIMIT ?
  `).all(limit)
}

export function resetAllStats() {
  db.exec(`
    UPDATE users SET checks_total = 0, checks_live = 0, checks_dead = 0, checks_unknown = 0
  `)
}

export function linkTelegramToUser(userId, telegramId) {
  db.prepare('UPDATE users SET telegram_id = ? WHERE id = ?').run(telegramId, userId)
}

// --- Lives ---

export function saveLive(userId, live) {
  const existing = db.prepare('SELECT id FROM lives WHERE user_id = ? AND raw = ?').get(userId, live.raw)
  if (existing) return existing.id
  db.prepare(`
    INSERT INTO lives (user_id, raw, number, gate_id, gate_name, message, bank, card_type, brand, country, country_emoji, enriched, captured_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId,
    live.raw,
    live.number || '',
    live.gateId || null,
    live.gateName || null,
    live.message || null,
    live.bank || null,
    live.cardType || null,
    live.brand || null,
    live.country || null,
    live.countryEmoji || null,
    live.enriched ? 1 : 0,
    live.capturedAt ? new Date(live.capturedAt).toISOString().replace('T', ' ').split('.')[0] : new Date().toISOString().replace('T', ' ').split('.')[0]
  )
}

export function listLives(userId) {
  return db.prepare(`
    SELECT id, raw, number, gate_id AS gateId, gate_name AS gateName, message,
           bank, card_type AS cardType, brand, country, country_emoji AS countryEmoji,
           enriched, captured_at AS capturedAt
    FROM lives WHERE user_id = ? ORDER BY captured_at DESC
  `).all(userId)
}

export function deleteLive(userId, raw) {
  db.prepare('DELETE FROM lives WHERE user_id = ? AND raw = ?').run(userId, raw)
}

export function clearLives(userId) {
  db.prepare('DELETE FROM lives WHERE user_id = ?').run(userId)
}

// --- Gate Access ---

export function setGateAccess(userId, gateId, days) {
  const daysStr = JSON.stringify(days)
  db.prepare(`
    INSERT INTO gate_access (user_id, gate_id, days)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id, gate_id) DO UPDATE SET days = excluded.days
  `).run(userId, gateId, daysStr)
}

export function getGateAccess(userId, gateId) {
  return db.prepare('SELECT * FROM gate_access WHERE user_id = ? AND gate_id = ?').get(userId, gateId)
}

export function listUserGateAccess(userId) {
  return db.prepare('SELECT * FROM gate_access WHERE user_id = ?').all(userId)
}

export function listAllGateAccess() {
  return db.prepare(`
    SELECT ga.*, u.username FROM gate_access ga
    JOIN users u ON u.id = ga.user_id
    ORDER BY ga.created_at DESC
  `).all()
}

export function deleteGateAccessById(id) {
  db.prepare('DELETE FROM gate_access WHERE id = ?').run(id)
}

export function checkGateAccessToday(userId, gateId) {
  const record = db.prepare('SELECT * FROM gate_access WHERE user_id = ? AND gate_id = ?').get(userId, gateId)
  if (!record) return false
  try {
    const days = JSON.parse(record.days || '[]')
    const today = new Date().toISOString().split('T')[0]
    return days.includes(today)
  } catch { return false }
}

export default db

export function initDb() { return Promise.resolve() }
