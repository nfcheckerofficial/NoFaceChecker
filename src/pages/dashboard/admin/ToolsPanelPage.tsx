import { useState } from 'react'
import { clsx } from 'clsx'
import { useShallow } from 'zustand/react/shallow'
import { Database, Plus, Edit, Trash2, Search, Globe, X, Check, AlertTriangle } from 'lucide-react'
import { useAdminStore, type Country } from '@/features/admin/adminStore'

type ModalType = 'add' | 'edit' | 'delete' | null

const emptyCountry = { name: '', code: '', endpoint: '', active: true }

export function ToolsPanelPage() {
  const { countries, addCountry, updateCountry, deleteCountry } = useAdminStore(useShallow((s) => ({
    countries: s.countries,
    addCountry: s.addCountry,
    updateCountry: s.updateCountry,
    deleteCountry: s.deleteCountry,
  })))
  const [search, setSearch] = useState('')
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)
  const [modal, setModal] = useState<ModalType>(null)
  const [form, setForm] = useState(emptyCountry)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const notif = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  const openModal = (type: ModalType, country?: Country) => {
    setSelectedCountry(country ?? null)
    setModal(type)
    if (type === 'add') setForm(emptyCountry)
    if (type === 'edit' && country) setForm({ name: country.name, code: country.code, endpoint: country.endpoint, active: country.active })
  }

  const handleSave = () => {
    if (!form.name.trim() || !form.code.trim() || !form.endpoint.trim()) return notif('error', 'All fields are required')
    if (modal === 'add') {
      addCountry({ ...form, code: form.code.toUpperCase() })
      notif('success', `Country "${form.name}" added`)
    } else if (selectedCountry) {
      updateCountry(selectedCountry.id, { ...form, code: form.code.toUpperCase() })
      notif('success', `Country "${form.name}" updated`)
    }
    setModal(null)
  }

  const handleDelete = () => {
    if (!selectedCountry) return
    deleteCountry(selectedCountry.id)
    notif('success', `Country "${selectedCountry.name}" deleted`)
    setModal(null)
  }

  const handleToggle = (country: Country) => {
    const { toggleCountry } = useAdminStore.getState()
    toggleCountry(country.id)
    notif('success', `Country "${country.name}" ${country.active ? 'deactivated' : 'activated'}`)
  }

  const filteredCountries = countries.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-cyber-text">Tools Panel</h1>
          <p className="text-sm text-cyber-text-muted mt-1">Manage random data countries and tool configurations</p>
        </div>
        <button onClick={() => openModal('add')}
          className="px-4 py-2 bg-cyber-green/20 border border-cyber-green/50 rounded-lg text-sm text-cyber-green hover:bg-cyber-green/30 transition-colors flex items-center gap-2">
          <Plus size={14} /> Add Country
        </button>
      </div>

      {notification && (
        <div className={clsx('px-4 py-3 rounded-lg border text-sm flex items-center gap-2',
          notification.type === 'success' ? 'bg-cyber-green/10 border-cyber-green/40 text-cyber-green' : 'bg-cyber-red/10 border-cyber-red/40 text-cyber-red')}>
          {notification.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}{notification.message}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SummaryCard icon={Globe} label="Active Countries" value={countries.filter(c => c.active).length} color="bg-cyber-green/20 text-cyber-green" />
        <SummaryCard icon={Database} label="Total Countries" value={countries.length} color="bg-cyber-blue/20 text-cyber-blue" />
      </div>

      <div className="rounded-lg border border-cyber-border bg-cyber-panel/70 backdrop-blur-sm">
        <div className="px-5 py-4 border-b border-cyber-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-cyber-text">Random Data Countries</h2>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-text-muted" />
            <input type="text" placeholder="Search countries..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-cyber-dark border border-cyber-border rounded-lg text-sm text-cyber-text placeholder-cyber-text-muted focus:outline-none focus:border-cyber-blue" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-cyber-border/50">
                <th className="px-5 py-3 text-left text-xs font-medium text-cyber-text-muted uppercase">Country</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-cyber-text-muted uppercase">Code</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-cyber-text-muted uppercase">Status</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-cyber-text-muted uppercase">Endpoint</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-cyber-text-muted uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyber-border/50">
              {filteredCountries.map(country => (
                <tr key={country.id} className="hover:bg-cyber-dark/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getFlagEmoji(country.code)}</span>
                      <span className="text-sm font-medium text-cyber-text">{country.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="px-2 py-1 rounded bg-cyber-dark text-xs font-mono text-cyber-text-muted">{country.code}</span>
                  </td>
                  <td className="px-5 py-4">
                    <button onClick={() => handleToggle(country)}
                      className={clsx('px-2 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer',
                        country.active ? 'bg-cyber-green/20 border-cyber-green/50 text-cyber-green' : 'bg-cyber-text-muted/20 border-cyber-border text-cyber-text-muted')}>
                      {country.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs font-mono text-cyber-text-muted">{country.endpoint}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openModal('edit', country)} className="p-2 rounded-lg hover:bg-cyber-dark text-cyber-text-muted hover:text-cyber-blue transition-colors"><Edit size={14} /></button>
                      <button onClick={() => openModal('delete', country)} className="p-2 rounded-lg hover:bg-cyber-dark text-cyber-text-muted hover:text-cyber-red transition-colors"><Trash2 size={14} /></button>
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
        <Modal title={modal === 'add' ? 'Add New Country' : 'Edit Country'} onClose={() => setModal(null)}>
          <div>
            <label className="block text-sm text-cyber-text-muted mb-1">Country Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 bg-cyber-black border border-cyber-border rounded-lg text-cyber-text focus:outline-none focus:border-cyber-blue" placeholder="Enter country name..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-cyber-text-muted mb-1">Country Code</label>
              <input type="text" value={form.code} onChange={(e) => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                className="w-full px-3 py-2 bg-cyber-black border border-cyber-border rounded-lg text-cyber-text focus:outline-none focus:border-cyber-blue" placeholder="US, GB..." maxLength={2} />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm(f => ({ ...f, active: e.target.checked }))}
                  className="w-4 h-4 rounded border-cyber-border bg-cyber-black text-cyber-green focus:ring-cyber-green" />
                <span className="text-sm text-cyber-text-muted">Active</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm text-cyber-text-muted mb-1">API Endpoint</label>
            <input type="text" value={form.endpoint} onChange={(e) => setForm(f => ({ ...f, endpoint: e.target.value }))}
              className="w-full px-3 py-2 bg-cyber-black border border-cyber-border rounded-lg text-cyber-text focus:outline-none focus:border-cyber-blue" placeholder="/api/random/..." />
          </div>
          <ModalActions>
            <ModalBtn label="Cancel" onClick={() => setModal(null)} variant="ghost" />
            <ModalBtn label={modal === 'add' ? 'Add Country' : 'Save Changes'} onClick={handleSave} variant="primary" />
          </ModalActions>
        </Modal>
      )}

      {/* Delete Modal */}
      {modal === 'delete' && selectedCountry && (
        <Modal title="Delete Country" onClose={() => setModal(null)}>
          <p className="text-sm text-cyber-text-muted">
            Are you sure you want to delete <span className="font-mono text-cyber-red">{selectedCountry.name}</span>?
          </p>
          <ModalActions>
            <ModalBtn label="Cancel" onClick={() => setModal(null)} variant="ghost" />
            <ModalBtn label="Delete Country" onClick={handleDelete} variant="danger" />
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

function ModalActions({ children }: { children: React.ReactNode }) {
  return <div className="flex justify-end gap-3 mt-6">{children}</div>
}

function ModalBtn({ label, onClick, variant = 'primary' }: { label: string; onClick: () => void; variant?: 'primary' | 'danger' | 'ghost' }) {
  const variants = {
    primary: 'bg-cyber-blue/20 border-cyber-blue/50 text-cyber-blue hover:bg-cyber-blue/30',
    danger: 'bg-cyber-red/20 border-cyber-red/50 text-cyber-red hover:bg-cyber-red/30',
    ghost: 'border-cyber-border text-cyber-text-muted hover:text-cyber-text',
  }
  return <button onClick={onClick} className={clsx('px-4 py-2 rounded-lg text-sm font-medium border transition-colors', variants[variant])}>{label}</button>
}

function SummaryCard({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ size?: number }>; label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg border border-cyber-border bg-cyber-panel/70 backdrop-blur-sm px-4 py-4">
      <div className="flex items-center gap-3">
        <span className={clsx('w-11 h-11 rounded-md flex items-center justify-center shrink-0', color)}><Icon size={20} /></span>
        <div>
          <p className="text-2xl font-bold text-cyber-text">{value}</p>
          <p className="text-xs text-cyber-text-muted">{label}</p>
        </div>
      </div>
    </div>
  )
}

function getFlagEmoji(countryCode: string): string {
  const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}
