import { type ReactNode, useEffect, useState } from "react"

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg
      className={["h-5 w-5 animate-spin text-brass-500", className].join(" ")}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v3a5 5 0 0 0-5 5H4z" />
    </svg>
  )
}

export function LoadingState({ label = "Carregando…" }: { label?: string }) {
  const [isSlow, setIsSlow] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsSlow(true), 6000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div role="status" className="flex flex-col items-center justify-center gap-3 py-12 text-center text-ink-500">
      <div className="flex items-center gap-3">
        <Spinner />
        <span className="text-sm">{label}</span>
      </div>
      {isSlow && (
        <p className="max-w-xs text-xs text-ink-500">
          Isso está demorando mais que o normal — o servidor pode estar iniciando após um período sem uso.
        </p>
      )}
    </div>
  )
}

export function ErrorState({
  message = "Não foi possível carregar as informações.",
  onRetry,
}: {
  message?: string
  onRetry?: () => void
}) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-lg border border-error-100 bg-error-100/40 py-10 text-center">
      <p className="text-sm font-medium text-error-600">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="text-sm font-semibold text-ink-800 underline underline-offset-4 hover:text-ink-900"
        >
          Tentar novamente
        </button>
      )}
    </div>
  )
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-ink-300 py-12 text-center">
      <p className="font-heading text-lg font-semibold text-ink-800">{title}</p>
      {description && <p className="max-w-sm text-sm text-ink-500">{description}</p>}
      {action}
    </div>
  )
}
