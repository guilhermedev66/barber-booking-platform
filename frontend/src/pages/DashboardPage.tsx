const summary = [
  { label: "Agendamentos hoje", value: "—" },
  { label: "Pendentes", value: "—" },
  { label: "Concluídos no mês", value: "—" },
]

export function DashboardPage() {
  return (
    <section>
      <h1 className="font-heading text-2xl font-semibold text-ink-900">Painel</h1>
      <p className="mt-1 text-sm text-ink-500">Visão geral da agenda para barbeiro/admin.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {summary.map((item) => (
          <div key={item.label} className="rounded-lg border border-ink-200 bg-ink-50 p-4">
            <p className="text-sm text-ink-500">{item.label}</p>
            <p className="mt-1 font-heading text-2xl font-semibold text-ink-900">{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
