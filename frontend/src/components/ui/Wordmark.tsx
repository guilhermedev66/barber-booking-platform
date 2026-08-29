export function Wordmark({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const primary = tone === "dark" ? "text-brass-400" : "text-brass-600"
  const secondary = tone === "dark" ? "text-ink-300" : "text-ink-500"

  return (
    <span className="inline-flex items-baseline gap-2 leading-none">
      <span className={`font-heading text-xl font-semibold tracking-wide ${primary}`}>Ofício</span>
      <span className={`text-[0.65rem] font-semibold uppercase tracking-[0.28em] ${secondary}`}>
        Barbearia
      </span>
    </span>
  )
}
