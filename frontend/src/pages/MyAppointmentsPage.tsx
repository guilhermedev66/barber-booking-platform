import { useEffect, useState } from "react"
import { EmptyState, ErrorState, LoadingState } from "../components/ui/Feedback"
import { StatusBadge } from "../components/ui/StatusBadge"
import { api } from "../lib/api/client"
import type { Appointment } from "../lib/api/types"
import { ApiError } from "../lib/apiClient"
import { formatDateLong, formatPrice, formatUtcDateIso, formatUtcTime } from "../lib/format"

export function MyAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[] | null>(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    setAppointments(null)
    setError(false)
    api
      .listMyAppointments()
      .then((list) => {
        if (!cancelled) setAppointments(list)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  function handleCancelled(id: string) {
    setAppointments((current) =>
      current ? current.map((item) => (item.id === id ? { ...item, status: "Cancelled" } : item)) : current,
    )
  }

  const upcoming = (appointments ?? []).filter((item) => item.status !== "Cancelled" && item.status !== "Completed")
  const history = (appointments ?? []).filter((item) => item.status === "Cancelled" || item.status === "Completed")

  return (
    <section className="pb-8">
      <h1 className="font-heading text-2xl font-semibold text-ink-950 sm:text-3xl dark:text-ink-50">Minhas reservas</h1>
      <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Seus agendamentos e histórico.</p>

      {error && <ErrorState onRetry={() => setAttempt((n) => n + 1)} />}

      {!error && !appointments && <LoadingState label="Carregando suas reservas…" />}

      {!error && appointments && (
        <>
          <div className="mt-8">
            {upcoming.length === 0 ? (
              <EmptyState title="Nenhuma reserva em aberto" description="Que tal agendar seu próximo horário?" />
            ) : (
              <ol className="flex flex-col gap-3">
                {upcoming.map((appointment) => (
                  <AppointmentRow key={appointment.id} appointment={appointment} onCancelled={handleCancelled} />
                ))}
              </ol>
            )}
          </div>

          {history.length > 0 && (
            <div className="mt-10">
              <h2 className="font-heading text-lg font-semibold text-ink-900 dark:text-ink-100">Histórico</h2>
              <ol className="mt-3 flex flex-col gap-2">
                {history.map((appointment) => (
                  <AppointmentRow key={appointment.id} appointment={appointment} />
                ))}
              </ol>
            </div>
          )}
        </>
      )}
    </section>
  )
}

function AppointmentRow({
  appointment,
  onCancelled,
}: {
  appointment: Appointment
  onCancelled?: (id: string) => void
}) {
  const [confirming, setConfirming] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

  async function handleConfirmCancel() {
    setIsCancelling(true)
    setCancelError(null)
    try {
      await api.cancelAppointment(appointment.id)
      onCancelled?.(appointment.id)
    } catch (error) {
      setCancelError(
        error instanceof ApiError && error.status === 409
          ? "Este agendamento não pode mais ser cancelado."
          : "Não foi possível cancelar. Tente novamente.",
      )
    } finally {
      setIsCancelling(false)
      setConfirming(false)
    }
  }

  return (
    <li className="rounded-lg border border-ink-200 bg-white/60 px-4 py-3 dark:border-ink-800 dark:bg-ink-900/60">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-md bg-ink-950 py-1.5 text-brass-300">
            <span className="text-sm font-semibold leading-none tabular-nums">
              {formatUtcTime(appointment.startUtc)}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-medium text-ink-900 dark:text-ink-100">{appointment.serviceName}</p>
            <p className="text-sm text-ink-500 dark:text-ink-400">
              com {appointment.barberName} · {formatDateLong(formatUtcDateIso(appointment.startUtc))} ·{" "}
              <span className="tabular-nums">{formatPrice(appointment.price)}</span>
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <StatusBadge status={appointment.status} />
          {onCancelled && appointment.status !== "Cancelled" && (
            <>
              {confirming ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleConfirmCancel}
                    disabled={isCancelling}
                    className="text-sm font-semibold text-error-600 underline underline-offset-4 hover:text-error-600/80 dark:text-error-400"
                  >
                    {isCancelling ? "Cancelando…" : "Confirmar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    disabled={isCancelling}
                    className="text-sm text-ink-500 underline underline-offset-4 hover:text-ink-800 dark:text-ink-400 dark:hover:text-ink-100"
                  >
                    Manter
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  className="text-sm font-medium text-ink-600 underline underline-offset-4 hover:text-error-600 dark:text-ink-400 dark:hover:text-error-400"
                >
                  Cancelar
                </button>
              )}
            </>
          )}
        </div>
      </div>
      {cancelError && <p className="mt-2 text-xs font-medium text-error-600 dark:text-error-400">{cancelError}</p>}
    </li>
  )
}
