import { useEffect, useState } from "react"
import { Link } from "react-router"
import { ErrorState, LoadingState } from "../components/ui/Feedback"
import { api } from "../lib/api/client"
import type { Barber, Service } from "../lib/api/types"
import { formatDuration, formatPrice } from "../lib/format"

const highlights = [
  { title: "Ofício", description: "Barbeiros com anos de bancada, formados na tradição da navalha." },
  { title: "Ritual", description: "Toalha quente, produtos selecionados e tempo dedicado a cada corte." },
  { title: "Precisão", description: "Agenda sem sobreposição — seu horário é só seu." },
]

function useServicesPreview() {
  const [services, setServices] = useState<Service[] | null>(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    setError(false)
    api
      .listServices()
      .then((list) => {
        if (!cancelled) setServices(list)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  return { services, error, retry: () => setAttempt((n) => n + 1) }
}

function useBarbersPreview() {
  const [barbers, setBarbers] = useState<Barber[] | null>(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    setError(false)
    api
      .listBarbers()
      .then((list) => {
        if (!cancelled) setBarbers(list)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  return { barbers, error, retry: () => setAttempt((n) => n + 1) }
}

export function HomePage() {
  const { services, error: servicesError, retry: retryServices } = useServicesPreview()
  const { barbers, error: barbersError, retry: retryBarbers } = useBarbersPreview()

  return (
    <div className="flex flex-col gap-20 pb-8">
      <section className="grid gap-10 pt-6 sm:pt-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brass-600 dark:text-brass-400">
            Barbearia de bairro, padrão de ofício
          </span>
          <h1 className="mt-4 font-heading text-4xl font-semibold leading-[1.05] text-ink-950 sm:text-5xl lg:text-6xl dark:text-ink-50">
            Ofício Barbearia
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-ink-600 sm:text-lg dark:text-ink-300">
            Agende seu horário com o barbeiro de sua preferência. Sem fila, sem ligação — só o corte
            certo, no horário certo.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              to="/book"
              className="inline-flex w-full items-center justify-center rounded-md bg-brass-600 px-5 py-3 text-base font-medium text-ink-50 transition-colors hover:bg-brass-500 sm:w-auto dark:bg-brass-500 dark:text-ink-950 dark:hover:bg-brass-400"
            >
              Agendar agora
            </Link>
          </div>
        </div>

        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-ink-950 sm:aspect-[5/4] lg:aspect-[4/5]">
          <img
            src="/images/hero-barber.jpg"
            srcSet="/images/hero-barber-mobile.jpg 640w, /images/hero-barber.jpg 1000w"
            sizes="(min-width: 1024px) 40vw, 100vw"
            alt="Barbeiro concentrado aparando o cabelo de um cliente com navalha reta, em ambiente de barbearia com iluminação quente."
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: "50% 30%" }}
            loading="eager"
            fetchPriority="high"
            width={1000}
            height={1250}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(22,19,15,0) 40%, rgba(22,19,15,0.85) 100%)",
            }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8">
            <p className="font-heading text-2xl italic text-brass-300">"O corte é o cartão de visita."</p>
            <p className="mt-2 text-sm text-ink-300">Marcos Andrade, barbeiro sênior</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-heading text-2xl font-semibold text-ink-950 dark:text-ink-50">
          Por que agendar aqui
        </h2>
        <div className="mt-6 grid gap-px overflow-hidden rounded-lg border border-ink-200 bg-ink-200 dark:border-ink-800 dark:bg-ink-800 sm:grid-cols-3">
          {highlights.map((item) => (
            <div key={item.title} className="bg-ink-50 p-6 dark:bg-ink-900">
              <h3 className="font-heading text-lg font-semibold text-ink-900 dark:text-ink-100">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500 dark:text-ink-400">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-heading text-2xl font-semibold text-ink-950 dark:text-ink-50">Serviços</h2>
          <Link
            to="/book"
            className="text-sm font-semibold text-brass-600 underline underline-offset-4 hover:text-brass-500 dark:text-brass-400 dark:hover:text-brass-300"
          >
            Ver todos
          </Link>
        </div>
        <div className="mt-6">
          {servicesError && <ErrorState message="Não foi possível carregar os serviços." onRetry={retryServices} />}
          {!servicesError && !services && <LoadingState label="Carregando serviços…" />}
          {!servicesError && services && (
            <div className="grid gap-4 sm:grid-cols-3">
              {services.slice(0, 3).map((service) => (
                <Link
                  key={service.id}
                  to="/book"
                  className="group rounded-lg border border-ink-200 bg-ink-50 p-5 transition-colors hover:border-brass-400 dark:border-ink-800 dark:bg-ink-900 dark:hover:border-brass-500"
                >
                  <h3 className="font-heading text-lg font-semibold text-ink-900 group-hover:text-brass-600 dark:text-ink-100 dark:group-hover:text-brass-400">
                    {service.name}
                  </h3>
                  <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                    {formatDuration(service.durationMinutes)}
                  </p>
                  <p className="mt-3 font-heading text-xl font-semibold text-ink-950 dark:text-ink-50">
                    {formatPrice(service.price)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="font-heading text-2xl font-semibold text-ink-950 dark:text-ink-50">Profissionais</h2>
        <div className="mt-6">
          {barbersError && <ErrorState message="Não foi possível carregar os profissionais." onRetry={retryBarbers} />}
          {!barbersError && !barbers && <LoadingState label="Carregando profissionais…" />}
          {!barbersError && barbers && (
            <div className="grid gap-4 sm:grid-cols-2">
              {barbers.map((barber) => (
                <Link
                  key={barber.id}
                  to="/book"
                  className="group rounded-lg border border-ink-200 bg-ink-50 p-5 transition-colors hover:border-brass-400 dark:border-ink-800 dark:bg-ink-900 dark:hover:border-brass-500"
                >
                  <h3 className="font-heading text-lg font-semibold text-ink-900 group-hover:text-brass-600 dark:text-ink-100 dark:group-hover:text-brass-400">
                    {barber.displayName}
                  </h3>
                  {barber.bio && (
                    <p className="mt-1 text-sm leading-relaxed text-ink-500 dark:text-ink-400">{barber.bio}</p>
                  )}
                </Link>
              ))}
            </div>
          )}
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
