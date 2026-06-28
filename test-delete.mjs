import { createUser, getUserByUsername, deleteUser } from './server/db-sqlite.js'

const testUser = 'test_delete_me_' + Date.now()
createUser(testUser, 'hash123', null)
let user = getUserByUsername(testUser)
console.log('Created user:', user ? `id=${user.id}` : 'FAILED')

if (user) {
  deleteUser(user.id)
  let check = getUserByUsername(testUser)
  console.log('After delete, user found:', check ? 'YES (BUG!)' : 'NO (OK)')
}
