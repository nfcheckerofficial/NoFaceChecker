import { useState } from 'react'
import { clsx } from 'clsx'
import {
  Network, Plus, Edit, Trash2, Search, Eye, EyeOff,
  DollarSign, Zap, Shield, Settings,
} from 'lucide-react'

interface Gate {
  id: string
  name: string
  category: string
  endpoint: string
  status: 'active' | 'inactive' | 'maintenance'
  cost: number
  description: string
}

const MOCK_GATES: Gate[] = [
  { id: '1', name: 'Vice Gate', category: 'Stripe CCN', endpoint: '/api/gates/vice', status: 'active', cost: 5, description: 'High success rate Stripe checker' },
  { id: '2', name: 'Ocean Gate', category: 'Stripe CCN', endpoint: '/api/gates/ocean', status: 'active', cost: 8, description: 'Premium Stripe authentication' },
  { id: '3', name: 'Horus Gate', category: 'Charge', endpoint: '/api/gates/horus', status: 'active', cost: 10, description: 'PayPal charge verification' },
  { id: '4', name: 'Auth Gate', category: 'Stripe Auth', endpoint: '/api/gates/auth', status: 'maintenance', cost: 15, description: '3D Secure authentication' },
  { id: '5', name: 'AllBirds', category: 'Special', endpoint: '/api/gates/allbirds', status: 'inactive', cost: 20, description: 'Shopify special gate' },
]

export function GatesPanelPage() {
  const [gates, setGates] = useState(MOCK_GATES)
  const [search, setSearch] = useState('')
  const [selectedGate, setSelectedGate] = useState<Gate | null>(null)
  const [showModal, setShowModal] = useState<'add' | 'edit' | 'delete' | null>(null)

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
        <button
          onClick={() => setShowModal('add')}
          className="px-4 py-2 bg-cyber-green/20 border border-cyber-green/50 rounded-lg text-sm text-cyber-green hover:bg-cyber-green/30 transition-colors flex items-center gap-2"
        >
          <Plus size={14} />
          Add Gate
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border border-cyber-border bg-cyber-panel/70 backdrop-blur-sm px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-md flex items-center justify-center bg-cyber-green/20 text-cyber-green">
              <Zap size={20} />
            </span>
            <div>
              <p className="text-2xl font-bold text-cyber-text">{gates.filter(g => g.status === 'active').length}</p>
              <p className="text-xs text-cyber-text-muted">Active Gates</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-cyber-border bg-cyber-panel/70 backdrop-blur-sm px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-md flex items-center justify-center bg-cyber-yellow/20 text-cyber-yellow">
              <Settings size={20} />
            </span>
            <div>
              <p className="text-2xl font-bold text-cyber-text">{gates.filter(g => g.status === 'maintenance').length}</p>
              <p className="text-xs text-cyber-text-muted">Maintenance</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-cyber-border bg-cyber-panel/70 backdrop-blur-sm px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-md flex items-center justify-center bg-cyber-blue/20 text-cyber-blue">
              <DollarSign size={20} />
            </span>
            <div>
              <p className="text-2xl font-bold text-cyber-text">{gates.length}</p>
              <p className="text-xs text-cyber-text-muted">Total Gates</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gates Table */}
      <div className="rounded-lg border border-cyber-border bg-cyber-panel/70 backdrop-blur-sm">
        <div className="px-5 py-4 border-b border-cyber-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-cyber-text">All Gates</h2>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-text-muted" />
            <input
              type="text"
              placeholder="Search gates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-cyber-dark border border-cyber-border rounded-lg text-sm text-cyber-text placeholder-cyber-text-muted focus:outline-none focus:border-cyber-blue"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-cyber-border/50">
                <th className="px-5 py-3 text-left text-xs font-medium text-cyber-text-muted uppercase tracking-wider">Gate</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-cyber-text-muted uppercase tracking-wider">Category</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-cyber-text-muted uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-cyber-text-muted uppercase tracking-wider">Cost</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-cyber-text-muted uppercase tracking-wider">Endpoint</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-cyber-text-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyber-border/50">
              {filteredGates.map(gate => (
                <tr key={gate.id} className="hover:bg-cyber-dark/50 transition-colors">
                  <td className="px-5 py-4">
                    <div>
                      <p className="text-sm font-medium text-cyber-text">{gate.name}</p>
                      <p className="text-xs text-cyber-text-muted">{gate.description}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-cyber-purple/20 text-cyber-purple">
                      {gate.category}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={clsx('px-2 py-1 rounded-full text-xs font-medium', statusColors[gate.status])}>
                      {gate.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-cyber-text">{gate.cost} credits</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs font-mono text-cyber-text-muted">{gate.endpoint}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setSelectedGate(gate); setShowModal('edit') }}
                        className="p-2 rounded-lg hover:bg-cyber-dark text-cyber-text-muted hover:text-cyber-blue transition-colors"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => { setSelectedGate(gate); setShowModal('delete') }}
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
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-cyber-dark border border-cyber-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-cyber-text">
                {showModal === 'add' && 'Add New Gate'}
                {showModal === 'edit' && 'Edit Gate'}
                {showModal === 'delete' && 'Delete Gate'}
              </h3>
              <button onClick={() => setShowModal(null)} className="text-cyber-text-muted hover:text-cyber-text">
                <span className="text-xl">&times;</span>
              </button>
            </div>

            {showModal === 'delete' && selectedGate && (
              <div className="space-y-4">
                <p className="text-sm text-cyber-text-muted">
                  Are you sure you want to delete <span className="font-mono text-cyber-red">{selectedGate.name}</span>?
                </p>
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setShowModal(null)} className="px-4 py-2 border border-cyber-border rounded-lg text-cyber-text-muted hover:text-cyber-text transition-colors">
                    Cancel
                  </button>
                  <button className="px-4 py-2 bg-cyber-red/20 border border-cyber-red/50 rounded-lg text-cyber-red hover:bg-cyber-red/30 transition-colors">
                    Delete Gate
                  </button>
                </div>
              </div>
            )}

            {(showModal === 'add' || showModal === 'edit') && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-cyber-text-muted mb-1">Gate Name</label>
                  <input
                    type="text"
                    defaultValue={selectedGate?.name}
                    className="w-full px-3 py-2 bg-cyber-black border border-cyber-border rounded-lg text-cyber-text focus:outline-none focus:border-cyber-blue"
                    placeholder="Enter gate name..."
                  />
                </div>
                <div>
                  <label className="block text-sm text-cyber-text-muted mb-1">Category</label>
                  <select className="w-full px-3 py-2 bg-cyber-black border border-cyber-border rounded-lg text-cyber-text focus:outline-none focus:border-cyber-blue">
                    <option>Stripe CCN</option>
                    <option>Stripe Auth</option>
                    <option>Charge</option>
                    <option>Special</option>
                    <option>PayPal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-cyber-text-muted mb-1">Endpoint</label>
                  <input
                    type="text"
                    defaultValue={selectedGate?.endpoint}
                    className="w-full px-3 py-2 bg-cyber-black border border-cyber-border rounded-lg text-cyber-text focus:outline-none focus:border-cyber-blue"
                    placeholder="/api/gates/..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-cyber-text-muted mb-1">Cost (Credits)</label>
                    <input
                      type="number"
                      defaultValue={selectedGate?.cost}
                      className="w-full px-3 py-2 bg-cyber-black border border-cyber-border rounded-lg text-cyber-text focus:outline-none focus:border-cyber-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-cyber-text-muted mb-1">Status</label>
                    <select className="w-full px-3 py-2 bg-cyber-black border border-cyber-border rounded-lg text-cyber-text focus:outline-none focus:border-cyber-blue">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-cyber-text-muted mb-1">Description</label>
                  <textarea
                    defaultValue={selectedGate?.description}
                    className="w-full px-3 py-2 bg-cyber-black border border-cyber-border rounded-lg text-cyber-text focus:outline-none focus:border-cyber-blue h-20 resize-none"
                    placeholder="Enter description..."
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setShowModal(null)} className="px-4 py-2 border border-cyber-border rounded-lg text-cyber-text-muted hover:text-cyber-text transition-colors">
                    Cancel
                  </button>
                  <button className="px-4 py-2 bg-cyber-blue/20 border border-cyber-blue/50 rounded-lg text-cyber-blue hover:bg-cyber-blue/30 transition-colors">
                    {showModal === 'add' ? 'Create Gate' : 'Save Changes'}
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
