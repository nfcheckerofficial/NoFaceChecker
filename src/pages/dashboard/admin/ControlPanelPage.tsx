import { useState } from 'react'
import { clsx } from 'clsx'
import {
  Users, UserPlus, Ban, AlertTriangle, DollarSign,
  Search, MoreVertical, Edit, Trash2, Shield, Mail,
} from 'lucide-react'

interface User {
  id: string
  username: string
  email: string
  credits: number
  role: 'admin' | 'user'
  banned: boolean
  createdAt: string
  lastSession: string
}

const MOCK_USERS: User[] = [
  { id: '1', username: 'kikolaquema24', email: 'kiko@example.com', credits: 827, role: 'admin', banned: false, createdAt: '2024-05-06', lastSession: '2024-12-20' },
  { id: '2', username: 'jatin029', email: 'jatin@example.com', credits: 15420, role: 'user', banned: false, createdAt: '2024-03-15', lastSession: '2024-12-19' },
  { id: '3', username: 'Thejacker', email: 'jacker@example.com', credits: 10400, role: 'user', banned: false, createdAt: '2024-02-20', lastSession: '2024-12-18' },
  { id: '4', username: 'M3LECI0', email: 'm3l@example.com', credits: 9300, role: 'user', banned: true, createdAt: '2024-04-10', lastSession: '2024-11-30' },
  { id: '5', username: 'Hector32', email: 'hector@example.com', credits: 8900, role: 'user', banned: false, createdAt: '2024-01-25', lastSession: '2024-12-20' },
]

export function ControlPanelPage() {
  const [users, setUsers] = useState(MOCK_USERS)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showModal, setShowModal] = useState<'edit' | 'ban' | 'delete' | null>(null)

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const totalCredits = users.reduce((sum, u) => sum + u.credits, 0)
  const bannedCount = users.filter(u => u.banned).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-cyber-text">Control Panel</h1>
          <p className="text-sm text-cyber-text-muted mt-1">Manage users, credits, and system settings</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon={<Users size={20} />} label="Total Users" value={users.length} color="bg-blue-600/80" />
        <SummaryCard icon={<DollarSign size={20} />} label="Total Credits" value={totalCredits.toLocaleString()} color="bg-green-600/80" />
        <SummaryCard icon={<UserPlus size={20} />} label="New This Month" value="12" color="bg-purple-600/80" />
        <SummaryCard icon={<Ban size={20} />} label="Banned" value={bannedCount} color="bg-red-600/80" />
      </div>

      {/* Users Table */}
      <div className="rounded-lg border border-cyber-border bg-cyber-panel/70 backdrop-blur-sm">
        <div className="px-5 py-4 border-b border-cyber-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-cyber-text">Users</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-text-muted" />
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-cyber-dark border border-cyber-border rounded-lg text-sm text-cyber-text placeholder-cyber-text-muted focus:outline-none focus:border-cyber-blue"
              />
            </div>
            <button className="px-3 py-2 bg-cyber-blue/20 border border-cyber-blue/50 rounded-lg text-sm text-cyber-blue hover:bg-cyber-blue/30 transition-colors flex items-center gap-2">
              <UserPlus size={14} />
              Add User
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-cyber-border/50">
                <th className="px-5 py-3 text-left text-xs font-medium text-cyber-text-muted uppercase tracking-wider">User</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-cyber-text-muted uppercase tracking-wider">Credits</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-cyber-text-muted uppercase tracking-wider">Role</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-cyber-text-muted uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-cyber-text-muted uppercase tracking-wider">Last Session</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-cyber-text-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyber-border/50">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-cyber-dark/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-cyber-purple/20 border border-cyber-purple flex items-center justify-center">
                        <span className="text-sm font-bold text-cyber-purple">{user.username[0].toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-cyber-text">{user.username}</p>
                        <p className="text-xs text-cyber-text-muted">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-cyber-text">{user.credits.toLocaleString()}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={clsx(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      user.role === 'admin' ? 'bg-cyber-purple/20 text-cyber-purple' : 'bg-cyber-blue/20 text-cyber-blue'
                    )}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={clsx(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      user.banned ? 'bg-cyber-red/20 text-cyber-red' : 'bg-cyber-green/20 text-cyber-green'
                    )}>
                      {user.banned ? 'Banned' : 'Active'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-cyber-text-muted">{user.lastSession}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setSelectedUser(user); setShowModal('edit') }}
                        className="p-2 rounded-lg hover:bg-cyber-dark text-cyber-text-muted hover:text-cyber-blue transition-colors"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => { setSelectedUser(user); setShowModal('ban') }}
                        className="p-2 rounded-lg hover:bg-cyber-dark text-cyber-text-muted hover:text-cyber-yellow transition-colors"
                      >
                        <Shield size={14} />
                      </button>
                      <button
                        onClick={() => { setSelectedUser(user); setShowModal('delete') }}
                        className="p-2 rounded-lg hover:bg-cyber-dark text-cyber-text-muted hover:text-cyber-red transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-cyber-dark border border-cyber-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-cyber-text">
                {showModal === 'edit' && 'Edit User'}
                {showModal === 'ban' && (selectedUser.banned ? 'Unban User' : 'Ban User')}
                {showModal === 'delete' && 'Delete User'}
              </h3>
              <button onClick={() => setShowModal(null)} className="text-cyber-text-muted hover:text-cyber-text">
                <span className="text-xl">&times;</span>
              </button>
            </div>

            {showModal === 'edit' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-cyber-text-muted mb-1">Username</label>
                  <input
                    type="text"
                    defaultValue={selectedUser.username}
                    className="w-full px-3 py-2 bg-cyber-black border border-cyber-border rounded-lg text-cyber-text focus:outline-none focus:border-cyber-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm text-cyber-text-muted mb-1">Credits</label>
                  <input
                    type="number"
                    defaultValue={selectedUser.credits}
                    className="w-full px-3 py-2 bg-cyber-black border border-cyber-border rounded-lg text-cyber-text focus:outline-none focus:border-cyber-blue"
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setShowModal(null)} className="px-4 py-2 border border-cyber-border rounded-lg text-cyber-text-muted hover:text-cyber-text transition-colors">
                    Cancel
                  </button>
                  <button className="px-4 py-2 bg-cyber-blue/20 border border-cyber-blue/50 rounded-lg text-cyber-blue hover:bg-cyber-blue/30 transition-colors">
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {showModal === 'ban' && (
              <div className="space-y-4">
                <p className="text-sm text-cyber-text-muted">
                  {selectedUser.banned
                    ? `Are you sure you want to unban ${selectedUser.username}?`
                    : `Are you sure you want to ban ${selectedUser.username}?`
                  }
                </p>
                <div>
                  <label className="block text-sm text-cyber-text-muted mb-1">Reason</label>
                  <textarea
                    className="w-full px-3 py-2 bg-cyber-black border border-cyber-border rounded-lg text-cyber-text focus:outline-none focus:border-cyber-blue h-20 resize-none"
                    placeholder="Enter reason..."
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setShowModal(null)} className="px-4 py-2 border border-cyber-border rounded-lg text-cyber-text-muted hover:text-cyber-text transition-colors">
                    Cancel
                  </button>
                  <button className={clsx(
                    'px-4 py-2 rounded-lg transition-colors',
                    selectedUser.banned
                      ? 'bg-cyber-green/20 border border-cyber-green/50 text-cyber-green hover:bg-cyber-green/30'
                      : 'bg-cyber-yellow/20 border border-cyber-yellow/50 text-cyber-yellow hover:bg-cyber-yellow/30'
                  )}>
                    {selectedUser.banned ? 'Unban' : 'Ban'}
                  </button>
                </div>
              </div>
            )}

            {showModal === 'delete' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-cyber-red/10 border border-cyber-red/30 rounded-lg">
                  <AlertTriangle size={18} className="text-cyber-red shrink-0" />
                  <p className="text-sm text-cyber-text">This action cannot be undone. All user data will be permanently deleted.</p>
                </div>
                <p className="text-sm text-cyber-text-muted">
                  Type <span className="font-mono text-cyber-red">{selectedUser.username}</span> to confirm deletion.
                </p>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-cyber-black border border-cyber-border rounded-lg text-cyber-text focus:outline-none focus:border-cyber-red"
                  placeholder="Type username..."
                />
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setShowModal(null)} className="px-4 py-2 border border-cyber-border rounded-lg text-cyber-text-muted hover:text-cyber-text transition-colors">
                    Cancel
                  </button>
                  <button className="px-4 py-2 bg-cyber-red/20 border border-cyber-red/50 rounded-lg text-cyber-red hover:bg-cyber-red/30 transition-colors">
                    Delete User
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-lg border border-cyber-border bg-cyber-panel/70 backdrop-blur-sm px-4 py-4">
      <div className="flex items-center gap-3">
        <span className={clsx('w-11 h-11 rounded-md flex items-center justify-center text-white shrink-0', color)}>
          {icon}
        </span>
        <div>
          <p className="text-2xl font-bold text-cyber-text">{value}</p>
          <p className="text-xs text-cyber-text-muted">{label}</p>
        </div>
      </div>
    </div>
  )
}
