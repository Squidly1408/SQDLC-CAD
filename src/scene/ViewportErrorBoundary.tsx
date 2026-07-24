import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ViewportErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error('Viewport crashed:', error)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="viewport-crash">
          <p>The 3D viewport hit an error and had to stop.</p>
          <p className="viewport-crash-detail">{this.state.error.message}</p>
          <button onClick={() => window.location.reload()}>Reload</button>
        </div>
      )
    }
    return this.props.children
  }
}
