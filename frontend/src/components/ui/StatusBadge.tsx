import type { AppointmentStatus } from "../../lib/api/types"

const labels: Record<AppointmentStatus, string> = {
  Pending: "Pendente",
  Confirmed: "Confirmado",
  Cancelled: "Cancelado",
  Completed: "Concluído",
}

const classes: Record<AppointmentStatus, string> = {
  Pending: "bg-brass-200 text-ink-900 dark:bg-brass-300/20 dark:text-brass-300",
  Confirmed: "bg-ink-800 text-brass-300",
  Cancelled: "bg-error-100 text-error-600 dark:bg-error-600/20 dark:text-error-400",
  Completed: "bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-400",
}

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-semibold uppercase tracking-wide",
        classes[status],
      ].join(" ")}
    >
      {labels[status]}
    </span>
  )
}
