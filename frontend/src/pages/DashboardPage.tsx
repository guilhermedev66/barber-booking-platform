import { useEffect, useMemo, useState } from "react"
import { Button } from "../components/ui/Button"
import { EmptyState, ErrorState, LoadingState } from "../components/ui/Feedback"
import { Modal } from "../components/ui/Modal"
import { StatusBadge } from "../components/ui/StatusBadge"
import { BlockTimeForm } from "../features/dashboard/BlockTimeForm"
import { ChairTimeline } from "../features/dashboard/ChairTimeline"
import { WalkInForm } from "../features/dashboard/WalkInForm"
import { api } from "../lib/api/client"
import type { Appointment, Barber } from "../lib/api/types"
import { BOOKING_TIME_ZONE, formatDateLong, formatUtcDateIso, formatUtcTime } from "../lib/format"
import { useAuth } from "../lib/auth/AuthContext"

export function DashboardPage() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[] | null>(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [myBarber, setMyBarber] = useState<Barber | null>(null)
  const [openModal, setOpenModal] = useState<"block" | "walk-in" | null>(null)

  useEffect(() => {
    let cancelled = false
    setAppointments(null)
    setError(false)
    api
      .listAgenda()
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

  useEffect(() => {
    if (!appointments) return
    let cancelled = false
    api.listBarbers().then((list) => {
      if (cancelled) return
      const fromAgenda = appointments.length > 0 ? list.find((b) => b.id === appointments[0].barberId) : null
      const fromName = list.find((b) => b.displayName === user?.name)
      setMyBarber(fromAgenda ?? fromName ?? null)
    })
    return () => {
      cancelled = true
    }
  }, [appointments, user?.name])

  function handleActionSuccess() {
    setOpenModal(null)
    setAttempt((n) => n + 1)
  }

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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-ink-950 sm:text-3xl dark:text-ink-50">Painel</h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Agenda do dia e próximos agendamentos.</p>
        </div>
        {myBarber && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setOpenModal("block")}>
              Bloquear horário
            </Button>
            <Button onClick={() => setOpenModal("walk-in")}>Encaixe rápido</Button>
          </div>
        )}
      </div>

      {myBarber && (
        <>
          <Modal open={openModal === "block"} onClose={() => setOpenModal(null)} title="Bloquear horário">
            <BlockTimeForm barberId={myBarber.id} onSuccess={handleActionSuccess} />
          </Modal>
          <Modal open={openModal === "walk-in"} onClose={() => setOpenModal(null)} title="Encaixe rápido">
            <WalkInForm barberId={myBarber.id} services={myBarber.services} onSuccess={handleActionSuccess} />
          </Modal>
        </>
      )}

      {error && <ErrorState onRetry={() => setAttempt((n) => n + 1)} />}

      {!error && !appointments && <LoadingState label="Carregando agenda…" />}

      {!error && appointments && (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {summary.map((item) => (
              <div key={item.label} className="rounded-lg border border-ink-200 bg-white/60 p-4 dark:border-ink-800 dark:bg-ink-900/60">
                <p className="text-sm text-ink-500 dark:text-ink-400">{item.label}</p>
                <p className="mt-1 font-heading text-3xl font-semibold text-ink-950 tabular-nums dark:text-ink-50">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <h2 className="font-heading text-lg font-semibold text-ink-900 dark:text-ink-100">Hoje</h2>
            {today.length === 0 ? (
              <div className="mt-3">
                <EmptyState title="Nenhum agendamento hoje" description="A agenda de hoje está livre." />
              </div>
            ) : (
              <div className="mt-5 rounded-lg border border-ink-200 bg-white/60 p-5 dark:border-ink-800 dark:bg-ink-900/60">
                <ChairTimeline appointments={today} />
              </div>
            )}
          </div>

          <div className="mt-10">
            <h2 className="font-heading text-lg font-semibold text-ink-900 dark:text-ink-100">Próximos agendamentos</h2>
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
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ink-200 bg-white/60 px-4 py-3 dark:border-ink-800 dark:bg-ink-900/60">
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-md bg-ink-950 py-1.5 text-brass-300">
          <span className="text-sm font-semibold leading-none tabular-nums">{formatUtcTime(appointment.startUtc)}</span>
        </div>
        <div className="min-w-0">
          <p className="font-medium text-ink-900 dark:text-ink-100">{appointment.serviceName}</p>
          <p className="text-sm text-ink-500 dark:text-ink-400">
            {appointment.clientName ?? "Cliente"}
            {showDate ? ` · ${formatDateLong(formatUtcDateIso(appointment.startUtc))}` : ""}
          </p>
        </div>
      </div>
      <StatusBadge status={appointment.status} />
    </li>
  )
}
