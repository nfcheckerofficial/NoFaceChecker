import { useState } from 'react'
import { clsx } from 'clsx'
import { useShallow } from 'zustand/react/shallow'
import { Network, Plus, Edit, Trash2, Search, Zap, Settings, X, Check, AlertTriangle } from 'lucide-react'
import { useAdminStore, type Gate } from '@/features/admin/adminStore'
import { Modal, ModalActions, ModalBtn } from '@/shared/ui/Modal'
import { SummaryCard } from '@/shared/ui/SummaryCard'

type ModalType = 'add' | 'edit' | 'delete' | null

const CATEGORIES = ['Stripe CCN', 'Stripe Auth', 'Charge', 'Special', 'PayPal', 'Amazon']

interface GateForm { name: string; category: string; endpoint: string; status: 'active' | 'inactive' | 'maintenance'; cost: number; description: string }
const emptyGate: GateForm = { name: '', category: CATEGORIES[0], endpoint: '', status: 'active', cost: 1, description: '' }

export function GatesPanelPage() {
  const { gates, addGate, updateGate, deleteGate } = useAdminStore(useShallow((s) => ({
    gates: s.gates,
    addGate: s.addGate,
    updateGate: s.updateGate,
    deleteGate: s.deleteGate,
  })))
  const [search, setSearch] = useState('')
  const [selectedGate, setSelectedGate] = useState<Gate | null>(null)
  const [modal, setModal] = useState<ModalType>(null)
  const [form, setForm] = useState(emptyGate)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const notif = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  const openModal = (type: ModalType, gate?: Gate) => {
    setSelectedGate(gate ?? null)
    setModal(type)
    if (type === 'add') setForm(emptyGate)
    if (type === 'edit' && gate) setForm({ name: gate.name, category: gate.category, endpoint: gate.endpoint, status: gate.status, cost: gate.cost, description: gate.description })
  }

  const handleSave = () => {
    if (!form.name.trim() || !form.endpoint.trim()) return notif('error', 'Name and endpoint are required')
    if (modal === 'add') {
      addGate(form)
      notif('success', `Gate "${form.name}" created`)
    } else if (selectedGate) {
      updateGate(selectedGate.id, form)
      notif('success', `Gate "${form.name}" updated`)
    }
    setModal(null)
  }

  const handleDelete = () => {
    if (!selectedGate) return
    deleteGate(selectedGate.id)
    notif('success', `Gate "${selectedGate.name}" deleted`)
    setModal(null)
  }

  const filteredGates = gates.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.category.toLowerCase().includes(search.toLowerCase())
  )

  const statusColors = {
    active: 'bg-cyber-green/20 text-cyber-green',
    inactive: 'bg-cyber-text-muted/20 text-cyber-text-muted',
    maintenance: 'bg-cyber-yellow/20 text-cyber-yellow',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-cyber-text">Gates Panel</h1>
          <p className="text-sm text-cyber-text-muted mt-1">Manage checking gates and categories</p>
        </div>
        <button onClick={() => openModal('add')}
          className="px-4 py-2 bg-cyber-green/20 border border-cyber-green/50 rounded-lg text-sm text-cyber-green hover:bg-cyber-green/30 transition-colors flex items-center gap-2">
          <Plus size={14} /> Add Gate
        </button>
      </div>

      {notification && (
        <div className={clsx('px-4 py-3 rounded-lg border text-sm flex items-center gap-2',
          notification.type === 'success' ? 'bg-cyber-green/10 border-cyber-green/40 text-cyber-green' : 'bg-cyber-red/10 border-cyber-red/40 text-cyber-red')}>
          {notification.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}{notification.message}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard icon={<Zap size={20} />} label="Active Gates" value={gates.filter(g => g.status === 'active').length} color="bg-cyber-green/20 text-cyber-green" />
        <SummaryCard icon={<Settings size={20} />} label="Maintenance" value={gates.filter(g => g.status === 'maintenance').length} color="bg-cyber-yellow/20 text-cyber-yellow" />
        <SummaryCard icon={<Network size={20} />} label="Total Gates" value={gates.length} color="bg-cyber-blue/20 text-cyber-blue" />
      </div>

      <div className="rounded-lg border border-cyber-border bg-cyber-panel/70 backdrop-blur-sm">
        <div className="px-5 py-4 border-b border-cyber-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-cyber-text">All Gates</h2>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-text-muted" />
            <input type="text" placeholder="Search gates..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-cyber-dark border border-cyber-border rounded-lg text-sm text-cyber-text placeholder-cyber-text-muted focus:outline-none focus:border-cyber-blue" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-cyber-border/50">
                <th className="px-5 py-3 text-left text-xs font-medium text-cyber-text-muted uppercase">Gate</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-cyber-text-muted uppercase">Category</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-cyber-text-muted uppercase">Status</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-cyber-text-muted uppercase">Cost</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-cyber-text-muted uppercase">Endpoint</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-cyber-text-muted uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyber-border/50">
              {filteredGates.map(gate => (
                <tr key={gate.id} className="hover:bg-cyber-dark/50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-cyber-text">{gate.name}</p>
                    <p className="text-xs text-cyber-text-muted">{gate.description}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-cyber-purple/20 text-cyber-purple">{gate.category}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={clsx('px-2 py-1 rounded-full text-xs font-medium', statusColors[gate.status])}>{gate.status}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-cyber-text">{gate.cost} credits</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs font-mono text-cyber-text-muted">{gate.endpoint}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openModal('edit', gate)} className="p-2 rounded-lg hover:bg-cyber-dark text-cyber-text-muted hover:text-cyber-blue transition-colors"><Edit size={14} /></button>
                      <button onClick={() => openModal('delete', gate)} className="p-2 rounded-lg hover:bg-cyber-dark text-cyber-text-muted hover:text-cyber-red transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Add New Gate' : 'Edit Gate'} onClose={() => setModal(null)}>
          <div>
            <label className="block text-sm text-cyber-text-muted mb-1">Gate Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 bg-cyber-black border border-cyber-border rounded-lg text-cyber-text focus:outline-none focus:border-cyber-blue" placeholder="Enter gate name..." />
          </div>
          <div>
            <label className="block text-sm text-cyber-text-muted mb-1">Category</label>
            <select value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full px-3 py-2 bg-cyber-black border border-cyber-border rounded-lg text-cyber-text focus:outline-none focus:border-cyber-blue">
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-cyber-text-muted mb-1">Endpoint</label>
            <input type="text" value={form.endpoint} onChange={(e) => setForm(f => ({ ...f, endpoint: e.target.value }))}
              className="w-full px-3 py-2 bg-cyber-black border border-cyber-border rounded-lg text-cyber-text focus:outline-none focus:border-cyber-blue" placeholder="/api/gates/..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-cyber-text-muted mb-1">Cost (Credits)</label>
              <input type="number" value={form.cost} onChange={(e) => setForm(f => ({ ...f, cost: Number(e.target.value) || 0 }))}
                className="w-full px-3 py-2 bg-cyber-black border border-cyber-border rounded-lg text-cyber-text focus:outline-none focus:border-cyber-blue" />
            </div>
            <div>
              <label className="block text-sm text-cyber-text-muted mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm(f => ({ ...f, status: e.target.value as Gate['status'] }))}
                className="w-full px-3 py-2 bg-cyber-black border border-cyber-border rounded-lg text-cyber-text focus:outline-none focus:border-cyber-blue">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-cyber-text-muted mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2 bg-cyber-black border border-cyber-border rounded-lg text-cyber-text focus:outline-none focus:border-cyber-blue h-20 resize-none" placeholder="Enter description..." />
          </div>
          <ModalActions>
            <ModalBtn label="Cancel" onClick={() => setModal(null)} variant="ghost" />
            <ModalBtn label={modal === 'add' ? 'Create Gate' : 'Save Changes'} onClick={handleSave} variant="primary" />
          </ModalActions>
        </Modal>
      )}

      {/* Delete Modal */}
      {modal === 'delete' && selectedGate && (
        <Modal title="Delete Gate" onClose={() => setModal(null)}>
          <p className="text-sm text-cyber-text-muted">
            Are you sure you want to delete <span className="font-mono text-cyber-red">{selectedGate.name}</span>?
          </p>
          <ModalActions>
            <ModalBtn label="Cancel" onClick={() => setModal(null)} variant="ghost" />
            <ModalBtn label="Delete Gate" onClick={handleDelete} variant="danger" />
          </ModalActions>
        </Modal>
      )}
    </div>
  )
}


