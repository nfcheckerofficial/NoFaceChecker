// ---------------------------------------------------------------------------
// Capa de base de datos — SQLite por defecto, PostgreSQL si DATABASE_URL está configurada
// ---------------------------------------------------------------------------

import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { mkdirSync, existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))

const usePg = !!process.env.DATABASE_URL

let db

if (usePg) {
  const pg = await import('./db-pg.js')
  db = pg
  console.log('[db] Using PostgreSQL')
} else {
  const sqlite = await import('./db-sqlite.js')
  db = sqlite
  console.log('[db] Using SQLite')
}

export const {
  initDb,
  markEventProcessed,
  saveValidatedCard,
  listValidatedCards,
  saveCharge,
  listCharges,
  listSubscribers,
  getSubscriberCount,
  addSubscriber,
  removeSubscriber,
  createUser,
  getUserByUsername,
  getUserById,
  getUserByTelegramId,
  updateUserCredits,
  setUserRole,
  linkTelegramToUser,
  resetAllCredits,
  restoreCreditsFromBackup,
  listUsers,
  recordCheck,
  getUserStats,
  getGlobalStats,
  getTopRankers,
  resetAllStats,
  updateUserPassword,
  ensureTelegramUser,
  saveLive,
  listLives,
  deleteLive,
  clearLives,
  setGateAccess,
  listUserGateAccess,
  listAllGateAccess,
  deleteGateAccessById,
  checkGateAccessToday,
} = db

// Ensure the default export exists (pool for PG, db instance for SQLite)
export default db.default || db
