import type { HTMLAttributes } from "react"

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={[
        "rounded-lg border border-ink-200 bg-white/60 p-5 dark:border-ink-800 dark:bg-ink-900/60",
        className,
      ].join(" ")}
      {...props}
    />
  )
}
