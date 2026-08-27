import { Link } from "react-router"

export function HomePage() {
  return (
    <section className="text-center">
      <h1 className="font-heading text-3xl font-semibold text-ink-900">Barber Booking Platform</h1>
      <p className="mt-2 text-ink-500">Agende seu horário com o barbeiro de sua preferência.</p>
      <Link
        to="/book"
        className="mt-6 inline-block rounded-md bg-brass-600 px-5 py-2.5 font-medium text-ink-50 transition-colors hover:bg-brass-500"
      >
        Agendar agora
      </Link>
    </section>
  )
}
