import { Component, type ErrorInfo, type ReactNode } from "react"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error("Unhandled UI error", error, info.componentStack)
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink-50 px-4 text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brass-600">Algo deu errado</span>
        <h1 className="font-heading text-2xl font-semibold text-ink-950">Não foi possível carregar a página</h1>
        <p className="max-w-sm text-sm text-ink-500">
          Tente recarregar. Se o problema continuar, tente novamente em alguns instantes.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-md bg-brass-600 px-5 py-2.5 text-sm font-medium text-ink-50 transition-colors hover:bg-brass-500"
        >
          Recarregar página
        </button>
      </div>
    )
  }
}
