import type { HTMLAttributes } from "react"

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={["rounded-lg border border-ink-200 bg-white/60 p-5", className].join(" ")}
      {...props}
    />
  )
}
