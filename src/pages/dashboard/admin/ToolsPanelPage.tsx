import { useState } from 'react'
import { clsx } from 'clsx'
import {
  Database, Plus, Edit, Trash2, Search, Globe, Eye, EyeOff,
} from 'lucide-react'

interface Country {
  id: string
  name: string
  code: string
  endpoint: string
  active: boolean
}

const MOCK_COUNTRIES: Country[] = [
  { id: '1', name: 'United States', code: 'US', endpoint: '/api/random/us', active: true },
  { id: '2', name: 'United Kingdom', code: 'GB', endpoint: '/api/random/gb', active: true },
  { id: '3', name: 'Germany', code: 'DE', endpoint: '/api/random/de', active: true },
  { id: '4', name: 'France', code: 'FR', endpoint: '/api/random/fr', active: false },
  { id: '5', name: 'Spain', code: 'ES', endpoint: '/api/random/es', active: true },
  { id: '6', name: 'Italy', code: 'IT', endpoint: '/api/random/it', active: true },
  { id: '7', name: 'Brazil', code: 'BR', endpoint: '/api/random/br', active: false },
  { id: '8', name: 'Japan', code: 'JP', endpoint: '/api/random/jp', active: true },
]

export function ToolsPanelPage() {
  const [countries, setCountries] = useState(MOCK_COUNTRIES)
  const [search, setSearch] = useState('')
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)
  const [showModal, setShowModal] = useState<'add' | 'edit' | 'delete' | null>(null)

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
        <button
          onClick={() => setShowModal('add')}
          className="px-4 py-2 bg-cyber-green/20 border border-cyber-green/50 rounded-lg text-sm text-cyber-green hover:bg-cyber-green/30 transition-colors flex items-center gap-2"
        >
          <Plus size={14} />
          Add Country
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-lg border border-cyber-border bg-cyber-panel/70 backdrop-blur-sm px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-md flex items-center justify-center bg-cyber-green/20 text-cyber-green">
              <Globe size={20} />
            </span>
            <div>
              <p className="text-2xl font-bold text-cyber-text">{countries.filter(c => c.active).length}</p>
              <p className="text-xs text-cyber-text-muted">Active Countries</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-cyber-border bg-cyber-panel/70 backdrop-blur-sm px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-md flex items-center justify-center bg-cyber-blue/20 text-cyber-blue">
              <Database size={20} />
            </span>
            <div>
              <p className="text-2xl font-bold text-cyber-text">{countries.length}</p>
              <p className="text-xs text-cyber-text-muted">Total Countries</p>
            </div>
          </div>
        </div>
      </div>

      {/* Countries Table */}
      <div className="rounded-lg border border-cyber-border bg-cyber-panel/70 backdrop-blur-sm">
        <div className="px-5 py-4 border-b border-cyber-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-cyber-text">Random Data Countries</h2>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-text-muted" />
            <input
              type="text"
              placeholder="Search countries..."
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
                <th className="px-5 py-3 text-left text-xs font-medium text-cyber-text-muted uppercase tracking-wider">Country</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-cyber-text-muted uppercase tracking-wider">Code</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-cyber-text-muted uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-cyber-text-muted uppercase tracking-wider">Endpoint</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-cyber-text-muted uppercase tracking-wider">Actions</th>
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
                    <span className="px-2 py-1 rounded bg-cyber-dark text-xs font-mono text-cyber-text-muted">
                      {country.code}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={clsx(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      country.active ? 'bg-cyber-green/20 text-cyber-green' : 'bg-cyber-text-muted/20 text-cyber-text-muted'
                    )}>
                      {country.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs font-mono text-cyber-text-muted">{country.endpoint}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setSelectedCountry(country); setShowModal('edit') }}
                        className="p-2 rounded-lg hover:bg-cyber-dark text-cyber-text-muted hover:text-cyber-blue transition-colors"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => { setSelectedCountry(country); setShowModal('delete') }}
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
                {showModal === 'add' && 'Add New Country'}
                {showModal === 'edit' && 'Edit Country'}
                {showModal === 'delete' && 'Delete Country'}
              </h3>
              <button onClick={() => setShowModal(null)} className="text-cyber-text-muted hover:text-cyber-text">
                <span className="text-xl">&times;</span>
              </button>
            </div>

            {showModal === 'delete' && selectedCountry && (
              <div className="space-y-4">
                <p className="text-sm text-cyber-text-muted">
                  Are you sure you want to delete <span className="font-mono text-cyber-red">{selectedCountry.name}</span>?
                </p>
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setShowModal(null)} className="px-4 py-2 border border-cyber-border rounded-lg text-cyber-text-muted hover:text-cyber-text transition-colors">
                    Cancel
                  </button>
                  <button className="px-4 py-2 bg-cyber-red/20 border border-cyber-red/50 rounded-lg text-cyber-red hover:bg-cyber-red/30 transition-colors">
                    Delete Country
                  </button>
                </div>
              </div>
            )}

            {(showModal === 'add' || showModal === 'edit') && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-cyber-text-muted mb-1">Country Name</label>
                  <input
                    type="text"
                    defaultValue={selectedCountry?.name}
                    className="w-full px-3 py-2 bg-cyber-black border border-cyber-border rounded-lg text-cyber-text focus:outline-none focus:border-cyber-blue"
                    placeholder="Enter country name..."
                  />
                </div>
                <div>
                  <label className="block text-sm text-cyber-text-muted mb-1">Country Code</label>
                  <input
                    type="text"
                    defaultValue={selectedCountry?.code}
                    className="w-full px-3 py-2 bg-cyber-black border border-cyber-border rounded-lg text-cyber-text focus:outline-none focus:border-cyber-blue"
                    placeholder="US, GB, DE..."
                    maxLength={2}
                  />
                </div>
                <div>
                  <label className="block text-sm text-cyber-text-muted mb-1">API Endpoint</label>
                  <input
                    type="text"
                    defaultValue={selectedCountry?.endpoint}
                    className="w-full px-3 py-2 bg-cyber-black border border-cyber-border rounded-lg text-cyber-text focus:outline-none focus:border-cyber-blue"
                    placeholder="/api/random/..."
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    defaultChecked={selectedCountry?.active ?? true}
                    className="w-4 h-4 rounded border-cyber-border bg-cyber-black text-cyber-green focus:ring-cyber-green"
                  />
                  <label className="text-sm text-cyber-text-muted">Active</label>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setShowModal(null)} className="px-4 py-2 border border-cyber-border rounded-lg text-cyber-text-muted hover:text-cyber-text transition-colors">
                    Cancel
                  </button>
                  <button className="px-4 py-2 bg-cyber-blue/20 border border-cyber-blue/50 rounded-lg text-cyber-blue hover:bg-cyber-blue/30 transition-colors">
                    {showModal === 'add' ? 'Add Country' : 'Save Changes'}
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

function getFlagEmoji(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}
