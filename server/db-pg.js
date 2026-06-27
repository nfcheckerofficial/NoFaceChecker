// PostgreSQL adapter — same API as db.js but uses DATABASE_URL
import pg from 'pg'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { writeFileSync, existsSync, readFileSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BACKUP_FILE = join(__dirname, 'credits_backup.json')

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

async function query(sql, params = []) {
  const client = await pool.connect()
  try {
    const res = await client.query(sql, params)
    return res
  } finally {
    client.release()
  }
}

// --- Init schema ---
export async function initDb() {
  await query(`
    CREATE TABLE IF NOT EXISTS payment_methods (
      id              SERIAL PRIMARY KEY,
      stripe_pm_id    TEXT NOT NULL UNIQUE,
      stripe_customer TEXT,
      email           TEXT,
      brand           TEXT,
      last4           TEXT,
      exp_month       INTEGER,
      exp_year        INTEGER,
      funding         TEXT,
      country         TEXT,
      cvc_check       TEXT,
      three_d_secure  TEXT,
      validated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS users (
      id              SERIAL PRIMARY KEY,
      username        TEXT NOT NULL UNIQUE,
      password_hash   TEXT NOT NULL,
      credits         INTEGER NOT NULL DEFAULT 0,
      role            TEXT NOT NULL DEFAULT 'user',
      telegram_id     TEXT,
      telegram_username TEXT,
      telegram_name   TEXT,
      checks_total    INTEGER NOT NULL DEFAULT 0,
      checks_live     INTEGER NOT NULL DEFAULT 0,
      checks_dead     INTEGER NOT NULL DEFAULT 0,
      checks_unknown  INTEGER NOT NULL DEFAULT 0,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS telegram_subscribers (
      id        SERIAL PRIMARY KEY,
      chat_id   TEXT NOT NULL UNIQUE,
      username  TEXT,
      first_name TEXT,
      subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      active    INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS processed_events (
      event_id     TEXT PRIMARY KEY,
      processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS charges (
      id              SERIAL PRIMARY KEY,
      stripe_pi_id    TEXT NOT NULL UNIQUE,
      stripe_pm_id    TEXT,
      stripe_customer TEXT,
      email           TEXT,
      amount          INTEGER NOT NULL,
      currency        TEXT NOT NULL,
      status          TEXT NOT NULL,
      description     TEXT,
      avs_line1       TEXT,
      avs_postal      TEXT,
      receipt_url     TEXT,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS lives (
      id        SERIAL PRIMARY KEY,
      user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
      captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)
  console.log('[db-pg] Schema initialized')
}

export async function markEventProcessed(eventId) {
  try {
    await query('INSERT INTO processed_events (event_id) VALUES ($1)', [eventId])
    return true
  } catch (err) {
    if (err.code === '23505') return false
    throw err
  }
}

export async function saveValidatedCard(data) {
  await query(`
    INSERT INTO payment_methods (stripe_pm_id, stripe_customer, email, brand, last4, exp_month, exp_year, funding, country, cvc_check, three_d_secure)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    ON CONFLICT (stripe_pm_id) DO UPDATE SET
      cvc_check = EXCLUDED.cvc_check,
      three_d_secure = EXCLUDED.three_d_secure,
      validated_at = NOW()
  `, [
    data.pmId, data.customerId ?? null, data.email ?? null, data.brand ?? null, data.last4 ?? null,
    data.expMonth ?? null, data.expYear ?? null, data.funding ?? null, data.country ?? null,
    data.cvcCheck ?? null, data.threeDSecure ?? null,
  ])
}

export async function saveCharge(data) {
  await query(`
    INSERT INTO charges (stripe_pi_id, stripe_pm_id, stripe_customer, email, amount, currency, status, description, avs_line1, avs_postal, receipt_url)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    ON CONFLICT (stripe_pi_id) DO UPDATE SET
      status = EXCLUDED.status, avs_line1 = EXCLUDED.avs_line1, avs_postal = EXCLUDED.avs_postal, receipt_url = EXCLUDED.receipt_url
  `, [
    data.piId, data.pmId ?? null, data.customerId ?? null, data.email ?? null,
    data.amount, data.currency, data.status, data.description ?? null,
    data.avsLine1 ?? null, data.avsPostal ?? null, data.receiptUrl ?? null,
  ])
}

export async function listCharges(email) {
  if (email) {
    const r = await query('SELECT * FROM charges WHERE email = $1 ORDER BY created_at DESC', [email])
    return r.rows
  }
  const r = await query('SELECT * FROM charges ORDER BY created_at DESC')
  return r.rows
}

export async function listValidatedCards(email) {
  if (email) {
    const r = await query('SELECT * FROM payment_methods WHERE email = $1 ORDER BY validated_at DESC', [email])
    return r.rows
  }
  const r = await query('SELECT * FROM payment_methods ORDER BY validated_at DESC')
  return r.rows
}

export async function addSubscriber(chatId, username, firstName) {
  await query(`
    INSERT INTO telegram_subscribers (chat_id, username, first_name, active)
    VALUES ($1, $2, $3, 1)
    ON CONFLICT (chat_id) DO UPDATE SET active = 1, username = EXCLUDED.username, first_name = EXCLUDED.first_name
  `, [chatId, username || null, firstName || null])
  return true
}

export async function removeSubscriber(chatId) {
  await query('UPDATE telegram_subscribers SET active = 0 WHERE chat_id = $1', [chatId])
}

export async function listSubscribers(onlyActive = true) {
  if (onlyActive) {
    const r = await query("SELECT * FROM telegram_subscribers WHERE active = 1 ORDER BY subscribed_at DESC")
    return r.rows
  }
  const r = await query('SELECT * FROM telegram_subscribers ORDER BY subscribed_at DESC')
  return r.rows
}

export async function getSubscriberCount() {
  const r = await query('SELECT COUNT(*) as count FROM telegram_subscribers WHERE active = 1')
  return parseInt(r.rows[0].count)
}

export async function createUser(username, passwordHash, telegramId) {
  try {
    const r = await query(
      'INSERT INTO users (username, password_hash, credits, role, telegram_id) VALUES ($1, $2, 0, $3, $4) RETURNING id, username, credits, role, telegram_id, created_at',
      [username, passwordHash, 'user', telegramId || null]
    )
    return r.rows[0]
  } catch (err) {
    if (err.code === '23505') return null
    throw err
  }
}

export async function getUserByUsername(username) {
  const r = await query('SELECT * FROM users WHERE username = $1', [username])
  return r.rows[0] || null
}

export async function getUserById(id) {
  const r = await query('SELECT id, username, credits, role, telegram_id, created_at FROM users WHERE id = $1', [id])
  return r.rows[0] || null
}

export async function getUserByTelegramId(telegramId) {
  const r = await query('SELECT id, username, credits, role, telegram_id, created_at FROM users WHERE telegram_id = $1', [telegramId])
  return r.rows[0] || null
}

export async function updateUserCredits(username, credits) {
  await query('UPDATE users SET credits = $1 WHERE username = $2', [credits, username])
  await saveCreditsBackup()
}

export async function resetAllCredits() {
  console.warn(`[credits] RESET ALL to 0 at ${new Date().toISOString()}`)
  await query('UPDATE users SET credits = 0')
  await saveCreditsBackup()
}

export async function ensureTelegramUser(chatId, username, firstName) {
  const existing = await getUserByTelegramId(chatId)
  if (existing) {
    await query('UPDATE users SET telegram_username = $1, telegram_name = $2 WHERE id = $3', [username || null, firstName || null, existing.id])
    return existing.id
  }
  const genUsername = 'tg_' + chatId
  const hash = 'telegram_only_' + Date.now() + '_' + Math.random().toString(36).slice(2)
  await query(`
    INSERT INTO users (username, password_hash, credits, role, telegram_id, telegram_username, telegram_name)
    VALUES ($1, $2, 0, $3, $4, $5, $6)
    ON CONFLICT (username) DO UPDATE SET telegram_id = EXCLUDED.telegram_id
  `, [genUsername, hash, 'user', chatId, username || null, firstName || null])
  const u = await getUserByTelegramId(chatId)
  return u.id
}

export async function listUsers() {
  const r = await query('SELECT id, username, credits, role, telegram_id, created_at FROM users ORDER BY created_at DESC')
  return r.rows
}

export async function setUserRole(username, role) {
  await query('UPDATE users SET role = $1 WHERE username = $2', [role, username])
}

export async function updateUserPassword(username, hash) {
  await query('UPDATE users SET password_hash = $1 WHERE username = $2', [hash, username])
}

export async function recordCheck(userId, status) {
  await query(`
    UPDATE users SET
      checks_total = checks_total + 1,
      checks_live  = checks_live  + CASE WHEN $1 = 'live' THEN 1 ELSE 0 END,
      checks_dead  = checks_dead  + CASE WHEN $1 = 'dead' THEN 1 ELSE 0 END,
      checks_unknown = checks_unknown + CASE WHEN $1 = 'unknown' THEN 1 ELSE 0 END
    WHERE id = $2
  `, [status, userId])
}

export async function getUserStats(userId) {
  const r = await query('SELECT checks_total, checks_live, checks_dead, checks_unknown FROM users WHERE id = $1', [userId])
  return r.rows[0] || null
}

export async function getGlobalStats() {
  const r = await query(`
    SELECT
      COALESCE(SUM(checks_total), 0)::int AS checks_total,
      COALESCE(SUM(checks_live), 0)::int AS checks_live,
      COALESCE(SUM(checks_dead), 0)::int AS checks_dead,
      COALESCE(SUM(checks_unknown), 0)::int AS checks_unknown
    FROM users
  `)
  return r.rows[0]
}

export async function getTopRankers(limit = 5) {
  const r = await query('SELECT username, checks_live AS value FROM users WHERE checks_live > 0 ORDER BY checks_live DESC LIMIT $1', [limit])
  return r.rows
}

export async function resetAllStats() {
  await query('UPDATE users SET checks_total = 0, checks_live = 0, checks_dead = 0, checks_unknown = 0')
}

export async function linkTelegramToUser(userId, telegramId) {
  await query('UPDATE users SET telegram_id = $1 WHERE id = $2', [telegramId, userId])
}

// --- Lives ---

export async function saveLive(userId, live) {
  const existing = await query('SELECT id FROM lives WHERE user_id = $1 AND raw = $2', [userId, live.raw])
  if (existing.rows.length > 0) return existing.rows[0].id
  await query(`
    INSERT INTO lives (user_id, raw, number, gate_id, gate_name, message, bank, card_type, brand, country, country_emoji, enriched, captured_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
  `, [
    userId, live.raw, live.number || '', live.gateId || null, live.gateName || null,
    live.message || null, live.bank || null, live.cardType || null, live.brand || null,
    live.country || null, live.countryEmoji || null, live.enriched ? 1 : 0,
    live.capturedAt ? new Date(live.capturedAt).toISOString() : new Date().toISOString(),
  ])
}

export async function listLives(userId) {
  const r = await query(`
    SELECT id, raw, number, gate_id AS "gateId", gate_name AS "gateName", message,
           bank, card_type AS "cardType", brand, country, country_emoji AS "countryEmoji",
           enriched::int, captured_at AS "capturedAt"
    FROM lives WHERE user_id = $1 ORDER BY captured_at DESC
  `, [userId])
  return r.rows
}

export async function deleteLive(userId, raw) {
  await query('DELETE FROM lives WHERE user_id = $1 AND raw = $2', [userId, raw])
}

export async function clearLives(userId) {
  await query('DELETE FROM lives WHERE user_id = $1', [userId])
}

// --- Backup ---

async function saveCreditsBackup() {
  try {
    const r = await query('SELECT username, credits FROM users')
    const data = Object.fromEntries(r.rows.map(u => [u.username, u.credits]))
    writeFileSync(BACKUP_FILE, JSON.stringify(data, null, 2))
  } catch (err) {
    console.error('[credits] Backup failed:', err.message)
  }
}

export async function restoreCreditsFromBackup() {
  try {
    if (!existsSync(BACKUP_FILE)) return false
    const raw = readFileSync(BACKUP_FILE, 'utf-8')
    const data = JSON.parse(raw)
    for (const [username, credits] of Object.entries(data)) {
      const exists = await query('SELECT id FROM users WHERE username = $1', [username])
      if (exists.rows.length > 0) {
        await query('UPDATE users SET credits = $1 WHERE username = $2', [credits, username])
      }
    }
    console.log(`[credits] Restored ${Object.keys(data).length} users from backup`)
    return true
  } catch (err) {
    console.error('[credits] Restore failed:', err.message)
    return false
  }
}

export default pool
