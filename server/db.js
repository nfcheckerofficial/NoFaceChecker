// ---------------------------------------------------------------------------
// Capa de base de datos (SQLite vía better-sqlite3).
//
// CUMPLIMIENTO PCI-DSS — qué se guarda aquí:
//   ✓ Token del método de pago de Stripe (pm_xxx)  -> referencia opaca
//   ✓ Token del customer de Stripe (cus_xxx)
//   ✓ Últimos 4 dígitos, marca, expiración, funding, país  -> metadatos
//
// LO QUE NUNCA SE GUARDA (prohibido por PCI-DSS):
//   ✗ Número de tarjeta completo (PAN)
//   ✗ CVC / CVV
//   ✗ Banda magnética / datos del chip / PIN
//
// El PAN nunca llega a este servidor: vive solo en el iframe de Stripe.
// ---------------------------------------------------------------------------

import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const db = new Database(join(__dirname, 'payments.db'))

// WAL: mejor concurrencia entre el webhook y las rutas HTTP.
db.pragma('journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS payment_methods (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    stripe_pm_id    TEXT NOT NULL UNIQUE,   -- pm_xxx (token, no es el PAN)
    stripe_customer TEXT,                   -- cus_xxx
    email           TEXT,
    brand           TEXT,
    last4           TEXT,                    -- solo últimos 4, permitido
    exp_month       INTEGER,
    exp_year        INTEGER,
    funding         TEXT,                    -- credit / debit / prepaid
    country         TEXT,
    cvc_check       TEXT,                    -- pass / fail / unavailable
    three_d_secure  TEXT,                    -- estado de la autenticación
    validated_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Garantiza idempotencia de webhooks: un event_id se procesa una sola vez.
  CREATE TABLE IF NOT EXISTS processed_events (
    event_id     TEXT PRIMARY KEY,
    processed_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Recibos de cobros off-session a un método de pago guardado.
  -- Cada fila es una transacción real autorizada por el titular.
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
 * Guarda (o actualiza) un método de pago validado.
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

/** Lista los métodos de pago guardados (datos seguros para mostrar). */
export function listValidatedCards(email) {
  if (email) {
    return db
      .prepare('SELECT * FROM payment_methods WHERE email = ? ORDER BY validated_at DESC')
      .all(email)
  }
  return db.prepare('SELECT * FROM payment_methods ORDER BY validated_at DESC').all()
}

export default db
