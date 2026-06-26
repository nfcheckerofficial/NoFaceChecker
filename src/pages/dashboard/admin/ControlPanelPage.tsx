import { useState, useEffect } from 'react'
import { clsx } from 'clsx'
import {
  Users, UserPlus, Ban, AlertTriangle, DollarSign, Plus,
  Search, Edit, Trash2, Shield, Minus, Check, X,
} from 'lucide-react'
import { useAdminStore, type User } from '@/features/admin/adminStore'

type ModalType = 'add' | 'edit' | 'ban' | 'delete' | 'credits' | null

interface UserForm { username: string; email: string; credits: number; role: 'admin' | 'user' }
const emptyUser: UserForm = { username: '', email: '', credits: 0, role: 'user' }

export function ControlPanelPage() {
  const { users, fetchUsers, addUser, updateUser, deleteUser, toggleBan, addCredits, removeCredits } = useAdminStore()

  useEffect(() => { fetchUsers() }, [])
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [modal, setModal] = useState<ModalType>(null)

  const [form, setForm] = useState(emptyUser)
  const [banReason, setBanReason] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [creditsAmount, setCreditsAmount] = useState(10)
  const [creditsMode, setCreditsMode] = useState<'add' | 'remove'>('add')
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const showNotif = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  const openModal = (type: ModalType, user?: User) => {
    setSelectedUser(user ?? null)
    setModal(type)
    if (type === 'add') setForm(emptyUser)
    if (type === 'edit' && user) setForm({ username: user.username, email: user.email, credits: user.credits, role: user.role })
    if (type === 'ban') setBanReason('')
    if (type === 'delete') setDeleteConfirm('')
    if (type === 'credits' && user) { setCreditsAmount(10); setCreditsMode('add') }
  }

  const handleAdd = () => {
    if (!form.username.trim() || !form.email.trim()) return showNotif('error', 'Username and email are required')
    addUser({ ...form, credits: form.credits || 0, banned: false })
    showNotif('success', `User ${form.username} created`)
    setModal(null)
  }

  const handleEdit = () => {
    if (!selectedUser) return
    updateUser(selectedUser.id, form)
    showNotif('success', `User ${form.username} updated`)
    setModal(null)
  }

  const handleBan = () => {
    if (!selectedUser) return
    toggleBan(selectedUser.id, banReason)
    showNotif('success', selectedUser.banned ? `User ${selectedUser.username} unbanned` : `User ${selectedUser.username} banned`)
    setModal(null)
  }

  const handleDelete = () => {
    if (!selectedUser || deleteConfirm !== selectedUser.username) return showNotif('error', 'Username does not match')
    deleteUser(selectedUser.id)
    showNotif('success', `User ${selectedUser.username} deleted`)
    setModal(null)
  }

  const handleCredits = () => {
    if (!selectedUser || creditsAmount <= 0) return showNotif('error', 'Invalid amount')
    if (creditsMode === 'add') {
      addCredits(selectedUser.id, creditsAmount)
      showNotif('success', `Added ${creditsAmount} credits to ${selectedUser.username}`)
    } else {
      if (!removeCredits(selectedUser.id, creditsAmount)) return showNotif('error', 'Insufficient credits')
      showNotif('success', `Removed ${creditsAmount} credits from ${selectedUser.username}`)
    }
    setModal(null)
  }

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

      {notification && (
        <div className={clsx(
          'px-4 py-3 rounded-lg border text-sm flex items-center gap-2',
          notification.type === 'success' ? 'bg-cyber-green/10 border-cyber-green/40 text-cyber-green' : 'bg-cyber-red/10 border-cyber-red/40 text-cyber-red'
        )}>
          {notification.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
          {notification.message}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon={<Users size={20} />} label="Total Users" value={users.length} color="bg-blue-600/80" />
        <SummaryCard icon={<DollarSign size={20} />} label="Total Credits" value={totalCredits.toLocaleString()} color="bg-green-600/80" />
        <SummaryCard icon={<UserPlus size={20} />} label="New This Month" value="12" color="bg-purple-600/80" />
        <SummaryCard icon={<Ban size={20} />} label="Banned" value={bannedCount} color="bg-red-600/80" />
      </div>

      <div className="rounded-lg border border-cyber-border bg-cyber-panel/70 backdrop-blur-sm">
        <div className="px-5 py-4 border-b border-cyber-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-cyber-text">Users</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-text-muted" />
              <input
                type="text" placeholder="Search users..."
                value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-cyber-dark border border-cyber-border rounded-lg text-sm text-cyber-text placeholder-cyber-text-muted focus:outline-none focus:border-cyber-blue"
              />
            </div>
            <button onClick={() => openModal('add')}
              className="px-3 py-2 bg-cyber-blue/20 border border-cyber-blue/50 rounded-lg text-sm text-cyber-blue hover:bg-cyber-blue/30 transition-colors flex items-center gap-2"
            >
              <UserPlus size={14} /> Add User
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
                    <span className={clsx('px-2 py-1 rounded-full text-xs font-medium', user.role === 'admin' ? 'bg-cyber-purple/20 text-cyber-purple' : 'bg-cyber-blue/20 text-cyber-blue')}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={clsx('px-2 py-1 rounded-full text-xs font-medium', user.banned ? 'bg-cyber-red/20 text-cyber-red' : 'bg-cyber-green/20 text-cyber-green')}>
                      {user.banned ? 'Banned' : 'Active'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-cyber-text-muted">{user.lastSession}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openModal('credits', user)} className="p-2 rounded-lg hover:bg-cyber-dark text-cyber-text-muted hover:text-cyber-green transition-colors" title="Manage Credits">
                        <DollarSign size={14} />
                      </button>
                      <button onClick={() => openModal('edit', user)} className="p-2 rounded-lg hover:bg-cyber-dark text-cyber-text-muted hover:text-cyber-blue transition-colors" title="Edit">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => openModal('ban', user)} className="p-2 rounded-lg hover:bg-cyber-dark text-cyber-text-muted hover:text-cyber-yellow transition-colors" title={user.banned ? 'Unban' : 'Ban'}>
                        <Shield size={14} />
                      </button>
                      <button onClick={() => openModal('delete', user)} className="p-2 rounded-lg hover:bg-cyber-dark text-cyber-text-muted hover:text-cyber-red transition-colors" title="Delete">
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

      {/* Add User Modal */}
      {modal === 'add' && (
        <Modal title="Add User" onClose={() => setModal(null)}>
          <Input label="Username" value={form.username} onChange={(v) => setForm(f => ({ ...f, username: v }))} />
          <Input label="Email" value={form.email} onChange={(v) => setForm(f => ({ ...f, email: v }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Credits" type="number" value={String(form.credits)} onChange={(v) => setForm(f => ({ ...f, credits: Number(v) || 0 }))} />
            <div>
              <label className="block text-sm text-cyber-text-muted mb-1">Role</label>
              <select value={form.role} onChange={(e) => setForm(f => ({ ...f, role: e.target.value as 'admin' | 'user' }))}
                className="w-full px-3 py-2 bg-cyber-black border border-cyber-border rounded-lg text-cyber-text focus:outline-none focus:border-cyber-blue">
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <ModalActions>
            <ModalBtn label="Cancel" onClick={() => setModal(null)} variant="ghost" />
            <ModalBtn label="Create User" onClick={handleAdd} variant="primary" />
          </ModalActions>
        </Modal>
      )}

      {/* Edit User Modal */}
      {modal === 'edit' && selectedUser && (
        <Modal title="Edit User" onClose={() => setModal(null)}>
          <Input label="Username" value={form.username} onChange={(v) => setForm(f => ({ ...f, username: v }))} />
          <Input label="Email" value={form.email} onChange={(v) => setForm(f => ({ ...f, email: v }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Credits" type="number" value={String(form.credits)} onChange={(v) => setForm(f => ({ ...f, credits: Number(v) || 0 }))} />
            <div>
              <label className="block text-sm text-cyber-text-muted mb-1">Role</label>
              <select value={form.role} onChange={(e) => setForm(f => ({ ...f, role: e.target.value as 'admin' | 'user' }))}
                className="w-full px-3 py-2 bg-cyber-black border border-cyber-border rounded-lg text-cyber-text focus:outline-none focus:border-cyber-blue">
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <ModalActions>
            <ModalBtn label="Cancel" onClick={() => setModal(null)} variant="ghost" />
            <ModalBtn label="Save Changes" onClick={handleEdit} variant="primary" />
          </ModalActions>
        </Modal>
      )}

      {/* Ban/Unban Modal */}
      {modal === 'ban' && selectedUser && (
        <Modal title={selectedUser.banned ? 'Unban User' : 'Ban User'} onClose={() => setModal(null)}>
          <p className="text-sm text-cyber-text-muted mb-4">
            {selectedUser.banned
              ? `Are you sure you want to unban ${selectedUser.username}?`
              : `Are you sure you want to ban ${selectedUser.username}?`}
          </p>
          {!selectedUser.banned && (
            <div>
              <label className="block text-sm text-cyber-text-muted mb-1">Reason</label>
              <textarea value={banReason} onChange={(e) => setBanReason(e.target.value)}
                className="w-full px-3 py-2 bg-cyber-black border border-cyber-border rounded-lg text-cyber-text focus:outline-none focus:border-cyber-blue h-20 resize-none"
                placeholder="Enter reason..." />
            </div>
          )}
          <ModalActions>
            <ModalBtn label="Cancel" onClick={() => setModal(null)} variant="ghost" />
            <ModalBtn label={selectedUser.banned ? 'Unban' : 'Ban'} onClick={handleBan}
              variant={selectedUser.banned ? 'success' : 'warning'} />
          </ModalActions>
        </Modal>
      )}

      {/* Delete User Modal */}
      {modal === 'delete' && selectedUser && (
        <Modal title="Delete User" onClose={() => setModal(null)}>
          <div className="flex items-center gap-3 p-3 bg-cyber-red/10 border border-cyber-red/30 rounded-lg mb-4">
            <AlertTriangle size={18} className="text-cyber-red shrink-0" />
            <p className="text-sm text-cyber-text">This action cannot be undone.</p>
          </div>
          <p className="text-sm text-cyber-text-muted mb-3">
            Type <span className="font-mono text-cyber-red font-bold">{selectedUser.username}</span> to confirm:
          </p>
          <input type="text" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)}
            className="w-full px-3 py-2 bg-cyber-black border border-cyber-border rounded-lg text-cyber-text focus:outline-none focus:border-cyber-red"
            placeholder="Type username..." />
          <ModalActions>
            <ModalBtn label="Cancel" onClick={() => setModal(null)} variant="ghost" />
            <ModalBtn label="Delete" onClick={handleDelete} variant="danger" disabled={deleteConfirm !== selectedUser.username} />
          </ModalActions>
        </Modal>
      )}

      {/* Credits Modal */}
      {modal === 'credits' && selectedUser && (
        <Modal title="Manage Credits" onClose={() => setModal(null)}>
          <div className="p-3 bg-cyber-panel rounded-lg border border-cyber-border mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-cyber-text-muted">{selectedUser.username}</span>
              <span className="text-cyber-text font-bold">{selectedUser.credits} credits</span>
            </div>
          </div>
          <div className="flex gap-2 mb-4">
            <button onClick={() => setCreditsMode('add')}
              className={clsx('flex-1 py-2 rounded-lg text-sm font-medium border transition-colors',
                creditsMode === 'add' ? 'bg-cyber-green/20 border-cyber-green/50 text-cyber-green' : 'border-cyber-border text-cyber-text-muted hover:text-cyber-text')}>
              <Plus size={14} className="inline mr-1" /> Add
            </button>
            <button onClick={() => setCreditsMode('remove')}
              className={clsx('flex-1 py-2 rounded-lg text-sm font-medium border transition-colors',
                creditsMode === 'remove' ? 'bg-cyber-red/20 border-cyber-red/50 text-cyber-red' : 'border-cyber-border text-cyber-text-muted hover:text-cyber-text')}>
              <Minus size={14} className="inline mr-1" /> Remove
            </button>
          </div>
          <Input label="Amount" type="number" value={String(creditsAmount)} onChange={(v) => setCreditsAmount(Number(v) || 0)} />
          <ModalActions>
            <ModalBtn label="Cancel" onClick={() => setModal(null)} variant="ghost" />
            <ModalBtn label={creditsMode === 'add' ? 'Add Credits' : 'Remove Credits'} onClick={handleCredits}
              variant={creditsMode === 'add' ? 'success' : 'danger'} />
          </ModalActions>
        </Modal>
      )}
    </div>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md bg-cyber-dark border border-cyber-border rounded-xl p-6 animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-cyber-text">{title}</h3>
          <button onClick={onClose} className="text-cyber-text-muted hover:text-cyber-text"><X size={18} /></button>
        </div>
        <div className="space-y-4">{children}</div>
      </div>
    </div>
  )
}

function Input({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-sm text-cyber-text-muted mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-cyber-black border border-cyber-border rounded-lg text-cyber-text placeholder-cyber-text-muted focus:outline-none focus:border-cyber-blue" />
    </div>
  )
}

function ModalActions({ children }: { children: React.ReactNode }) {
  return <div className="flex justify-end gap-3 mt-6">{children}</div>
}

function ModalBtn({ label, onClick, variant = 'primary', disabled }: { label: string; onClick: () => void; variant?: 'primary' | 'danger' | 'warning' | 'success' | 'ghost'; disabled?: boolean }) {
  const variants = {
    primary: 'bg-cyber-blue/20 border-cyber-blue/50 text-cyber-blue hover:bg-cyber-blue/30',
    danger: 'bg-cyber-red/20 border-cyber-red/50 text-cyber-red hover:bg-cyber-red/30',
    warning: 'bg-cyber-yellow/20 border-cyber-yellow/50 text-cyber-yellow hover:bg-cyber-yellow/30',
    success: 'bg-cyber-green/20 border-cyber-green/50 text-cyber-green hover:bg-cyber-green/30',
    ghost: 'border-cyber-border text-cyber-text-muted hover:text-cyber-text',
  }
  return (
    <button onClick={onClick} disabled={disabled}
      className={clsx('px-4 py-2 rounded-lg text-sm font-medium border transition-colors disabled:opacity-40 disabled:cursor-not-allowed', variants[variant])}>
      {label}
    </button>
  )
}

function SummaryCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-lg border border-cyber-border bg-cyber-panel/70 backdrop-blur-sm px-4 py-4">
      <div className="flex items-center gap-3">
        <span className={clsx('w-11 h-11 rounded-md flex items-center justify-center text-white shrink-0', color)}>{icon}</span>
        <div>
          <p className="text-2xl font-bold text-cyber-text">{value}</p>
          <p className="text-xs text-cyber-text-muted">{label}</p>
        </div>
      </div>
    </div>
  )
}
