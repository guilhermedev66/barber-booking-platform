import { Link } from "react-router"

const highlights = [
  { title: "Ofício", description: "Barbeiros com anos de bancada, formados na tradição da navalha." },
  { title: "Ritual", description: "Toalha quente, produtos selecionados e tempo dedicado a cada corte." },
  { title: "Precisão", description: "Agenda sem sobreposição — seu horário é só seu." },
]

export function HomePage() {
  return (
    <div className="flex flex-col gap-20 pb-8">
      <section className="grid gap-10 pt-6 sm:pt-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brass-600">
            Barbearia de bairro, padrão de ofício
          </span>
          <h1 className="mt-4 font-heading text-4xl font-semibold leading-[1.05] text-ink-950 sm:text-5xl lg:text-6xl">
            Barber Booking Platform
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-ink-600 sm:text-lg">
            Agende seu horário com o barbeiro de sua preferência. Sem fila, sem ligação — só o corte
            certo, no horário certo.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              to="/book"
              className="inline-flex w-full items-center justify-center rounded-md bg-brass-600 px-5 py-3 text-base font-medium text-ink-50 transition-colors hover:bg-brass-500 sm:w-auto"
            >
              Agendar agora
            </Link>
          </div>
        </div>

        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-ink-950 sm:aspect-[5/4] lg:aspect-[4/5]">
          <div
            className="absolute inset-0 opacity-90"
            style={{
              background:
                "radial-gradient(120% 120% at 20% 15%, var(--color-ink-800) 0%, var(--color-ink-950) 55%, #0b0906 100%)",
            }}
          />
          <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8">
            <p className="font-heading text-2xl italic text-brass-300">"O corte é o cartão de visita."</p>
            <p className="mt-2 text-sm text-ink-300">Marcos Andrade, barbeiro sênior</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-heading text-2xl font-semibold text-ink-950">Por que agendar aqui</h2>
        <div className="mt-6 grid gap-px overflow-hidden rounded-lg border border-ink-200 bg-ink-200 sm:grid-cols-3">
          {highlights.map((item) => (
            <div key={item.title} className="bg-ink-50 p-6">
              <h3 className="font-heading text-lg font-semibold text-ink-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl bg-ink-950 px-6 py-10 text-center sm:px-10 sm:py-14">
        <h2 className="font-heading text-2xl font-semibold text-brass-200 sm:text-3xl">
          Pronto para o próximo corte?
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-ink-300 sm:text-base">
          Escolha o serviço, o barbeiro e o horário. Leva menos de um minuto.
        </p>
        <Link
          to="/book"
          className="mt-6 inline-block rounded-md bg-brass-500 px-6 py-3 text-sm font-semibold text-ink-950 transition-colors hover:bg-brass-400"
        >
          Ver horários disponíveis
        </Link>
      </section>
    </div>
  )
}
