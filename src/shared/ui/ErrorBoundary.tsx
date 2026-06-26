import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-cyber-black flex items-center justify-center p-4 font-mono">
          <div className="max-w-md text-center space-y-6">
            <div className="text-cyber-red text-6xl font-orbitron font-bold tracking-widest">!</div>
            <h1 className="text-cyber-red text-xl font-orbitron tracking-wider">SYSTEM ERROR</h1>
            <p className="text-cyber-text-muted text-sm leading-relaxed">
              The application encountered an unexpected error. Please reload the page.
            </p>
            <div className="bg-cyber-red/5 border border-cyber-red/20 rounded-lg p-3 text-left">
              <pre className="text-xs text-cyber-text-muted break-all max-h-32 overflow-y-auto">
                {this.state.error?.message}
              </pre>
            </div>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload() }}
              className="px-6 py-3 bg-cyber-red/20 border border-cyber-red/50 rounded-lg text-cyber-red text-sm hover:bg-cyber-red/30 transition-colors tracking-wider uppercase"
            >
              Reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
