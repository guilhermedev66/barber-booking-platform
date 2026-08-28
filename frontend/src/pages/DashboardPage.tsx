import { useEffect, useMemo, useState } from "react"
import { EmptyState, ErrorState, LoadingState } from "../components/ui/Feedback"
import { StatusBadge } from "../components/ui/StatusBadge"
import { mockApi } from "../lib/api/mockApi"
import type { Appointment } from "../lib/api/types"
import { BOOKING_TIME_ZONE, formatDateLong, formatUtcDateIso, formatUtcTime } from "../lib/format"

export function DashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[] | null>(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    setAppointments(null)
    setError(false)
    mockApi
      .listAgendaAppointments()
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

  const { today, upcoming } = useMemo(() => {
    if (!appointments) return { today: [], upcoming: [] }
    const todayIso = formatUtcDateIso(new Date().toISOString(), BOOKING_TIME_ZONE)
    const active = appointments.filter((item) => item.status !== "Cancelled")
    return {
      today: active
        .filter((item) => formatUtcDateIso(item.startUtc, BOOKING_TIME_ZONE) === todayIso)
        .sort((a, b) => a.startUtc.localeCompare(b.startUtc)),
      upcoming: active
        .filter((item) => formatUtcDateIso(item.startUtc, BOOKING_TIME_ZONE) > todayIso)
        .sort((a, b) => a.startUtc.localeCompare(b.startUtc)),
    }
  }, [appointments])

  const summary = [
    { label: "Hoje", value: today.length },
    { label: "Pendentes", value: (appointments ?? []).filter((item) => item.status === "Pending").length },
    { label: "Próximos dias", value: upcoming.length },
  ]

  return (
    <section className="pb-8">
      <h1 className="font-heading text-2xl font-semibold text-ink-950 sm:text-3xl">Painel</h1>
      <p className="mt-1 text-sm text-ink-500">Agenda do dia e próximos agendamentos.</p>

      {error && <ErrorState onRetry={() => setAttempt((n) => n + 1)} />}

      {!error && !appointments && <LoadingState label="Carregando agenda…" />}

      {!error && appointments && (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {summary.map((item) => (
              <div key={item.label} className="rounded-lg border border-ink-200 bg-white/60 p-4">
                <p className="text-sm text-ink-500">{item.label}</p>
                <p className="mt-1 font-heading text-3xl font-semibold text-ink-950 tabular-nums">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <h2 className="font-heading text-lg font-semibold text-ink-900">Hoje</h2>
            {today.length === 0 ? (
              <div className="mt-3">
                <EmptyState title="Nenhum agendamento hoje" description="A agenda de hoje está livre." />
              </div>
            ) : (
              <ol className="mt-3 flex flex-col gap-2">
                {today.map((appointment) => (
                  <AppointmentRow key={appointment.id} appointment={appointment} />
                ))}
              </ol>
            )}
          </div>

          <div className="mt-10">
            <h2 className="font-heading text-lg font-semibold text-ink-900">Próximos agendamentos</h2>
            {upcoming.length === 0 ? (
              <div className="mt-3">
                <EmptyState title="Nada agendado nos próximos dias" />
              </div>
            ) : (
              <ol className="mt-3 flex flex-col gap-2">
                {upcoming.map((appointment) => (
                  <AppointmentRow key={appointment.id} appointment={appointment} showDate />
                ))}
              </ol>
            )}
          </div>
        </>
      )}
    </section>
  )
}

function AppointmentRow({ appointment, showDate = false }: { appointment: Appointment; showDate?: boolean }) {
  return (
    <li className="flex items-center justify-between gap-4 rounded-lg border border-ink-200 bg-white/60 px-4 py-3">
      <div className="flex items-center gap-4">
        <div className="flex w-14 flex-col items-center justify-center rounded-md bg-ink-950 py-1.5 text-brass-300">
          <span className="text-sm font-semibold leading-none tabular-nums">{formatUtcTime(appointment.startUtc)}</span>
        </div>
        <div>
          <p className="font-medium text-ink-900">{appointment.serviceName}</p>
          <p className="text-sm text-ink-500">
            Cliente reservado{showDate ? ` · ${formatDateLong(formatUtcDateIso(appointment.startUtc))}` : ""}
          </p>
        </div>
      </div>
      <StatusBadge status={appointment.status} />
    </li>
  )
}
