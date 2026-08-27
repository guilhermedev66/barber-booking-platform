const steps = [
  { title: "Serviço", description: "Escolha o serviço desejado." },
  { title: "Barbeiro", description: "Escolha o profissional." },
  { title: "Horário", description: "Escolha data e hora disponíveis." },
]

export function BookPage() {
  return (
    <section>
      <h1 className="font-heading text-2xl font-semibold text-ink-900">Agendar horário</h1>
      <p className="mt-1 text-sm text-ink-500">Fluxo de agendamento do cliente.</p>

      <ol className="mt-6 grid gap-4 sm:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.title} className="rounded-lg border border-ink-200 bg-ink-50 p-4">
            <span className="text-xs font-semibold uppercase tracking-wide text-brass-600">
              Passo {index + 1}
            </span>
            <h2 className="mt-1 text-base font-semibold text-ink-900">{step.title}</h2>
            <p className="mt-1 text-sm text-ink-500">{step.description}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
