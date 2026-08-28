import { useEffect, useState } from "react"
import { StatusBadge } from "../../components/ui/StatusBadge"
import type { Appointment } from "../../lib/api/types"
import { formatUtcTime } from "../../lib/format"

function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

export function ChairTimeline({ appointments }: { appointments: Appointment[] }) {
  const now = useNow()
  const nowIso = now.toISOString()

  const activeIndex = appointments.findIndex((item) => item.endUtc > nowIso)
  const dayIsOver = activeIndex === -1

  return (
    <ol className="flex flex-col">
      {appointments.map((appointment, index) => (
        <li key={appointment.id}>
          {index === activeIndex && <NowMarker time={formatUtcTime(nowIso)} />}
          <AppointmentNode
            appointment={appointment}
            isActive={index === activeIndex}
            isInProgress={appointment.startUtc <= nowIso}
            isLast={index === appointments.length - 1 && !dayIsOver}
          />
        </li>
      ))}
      {dayIsOver && <NowMarker time={formatUtcTime(nowIso)} label="Agenda de hoje encerrada" />}
    </ol>
  )
}

function NowMarker({ time, label = "Agora" }: { time: string; label?: string }) {
  return (
    <div className="grid grid-cols-[1.5rem_1fr] items-center gap-4 pb-6">
      <div className="flex justify-center">
        <span className="h-3 w-3 rounded-full bg-brass-500 ring-4 ring-brass-200" aria-hidden="true" />
      </div>
      <div className="flex items-center gap-3">
        <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-brass-700 tabular-nums">
          {label} · {time}
        </span>
        <span className="h-px flex-1 bg-brass-300" aria-hidden="true" />
      </div>
    </div>
  )
}

function AppointmentNode({
  appointment,
  isActive,
  isInProgress,
  isLast,
}: {
  appointment: Appointment
  isActive: boolean
  isInProgress: boolean
  isLast: boolean
}) {
  return (
    <div className="grid grid-cols-[1.5rem_1fr] gap-4">
      <div className="flex flex-col items-center">
        <span
          className={[
            "h-3 w-3 shrink-0 rounded-full",
            isActive ? "bg-brass-500 ring-4 ring-brass-200" : "bg-ink-950",
          ].join(" ")}
          aria-hidden="true"
        />
        {!isLast && <span className="mt-1 w-px flex-1 bg-ink-200" aria-hidden="true" />}
      </div>
      <div className={isLast ? "pb-0" : "pb-6"}>
        <div className="flex items-center justify-between gap-3">
          <span className="font-heading text-base font-semibold text-ink-900 tabular-nums">
            {formatUtcTime(appointment.startUtc)}
          </span>
          <StatusBadge status={appointment.status} />
        </div>
        <p className="mt-0.5 font-medium text-ink-900">{appointment.serviceName}</p>
        <p className="text-sm text-ink-500">{appointment.clientName ?? "Cliente"}</p>
        {isActive && (
          <span className="mt-1.5 inline-block rounded-sm bg-brass-200 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-brass-700">
            {isInProgress ? "Em atendimento" : "Próximo cliente"}
          </span>
        )}
      </div>
    </div>
  )
}
