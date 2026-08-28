const steps = ["Serviço", "Barbeiro", "Horário", "Confirmação"]

export function Stepper({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-2 sm:gap-3">
      {steps.map((label, index) => {
        const state = index < current ? "done" : index === current ? "active" : "upcoming"
        return (
          <li key={label} className="flex flex-1 items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <span
                className={[
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  state === "done" && "bg-brass-600 text-ink-50",
                  state === "active" && "bg-ink-950 text-brass-300",
                  state === "upcoming" && "bg-ink-200 text-ink-600",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {index + 1}
              </span>
              <span
                className={[
                  "hidden text-sm font-medium sm:inline",
                  state === "upcoming" ? "text-ink-500" : "text-ink-800",
                ].join(" ")}
              >
                {label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <span className={["h-px flex-1", state === "done" ? "bg-brass-500" : "bg-ink-200"].join(" ")} />
            )}
          </li>
        )
      })}
    </ol>
  )
}
