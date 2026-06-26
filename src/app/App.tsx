import { BrowserRouter as Router } from 'react-router-dom'
import { AppRoutes } from './routes'
import { ScanLines } from '@/shared/ui/ScanLines'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-cyber-black text-cyber-text font-mono relative overflow-x-hidden">
        <ScanLines />
        <AppRoutes />
      </div>
    </Router>
  )
}

export default App
