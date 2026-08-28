import type { ReactNode } from "react"

export function TicketFrame({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-dashed border-ink-300 bg-white/70">
      <div
        className="h-2 w-full"
        style={{
          backgroundImage: "radial-gradient(circle, var(--color-ink-300) 1.4px, transparent 1.4px)",
          backgroundSize: "10px 100%",
          backgroundRepeat: "repeat-x",
          backgroundPosition: "center",
        }}
        aria-hidden="true"
      />
      <div className="p-6">{children}</div>
    </div>
  )
}

export function ReceiptRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</dt>
      <dd className={["text-right font-medium text-ink-900", mono && "tabular-nums"].filter(Boolean).join(" ")}>
        {value}
      </dd>
    </div>
  )
}

export function ReceiptTotal({ label = "Total", value }: { label?: string; value: string }) {
  return (
    <div className="mt-5 flex items-center justify-between border-t border-dashed border-ink-300 pt-4">
      <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</span>
      <span className="font-heading text-2xl font-semibold text-brass-700 tabular-nums">{value}</span>
    </div>
  )
}
