import { Link } from "react-router"

export function NotFoundPage() {
  return (
    <section className="mx-auto max-w-md py-16 text-center">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brass-600">Erro 404</span>
      <h1 className="mt-3 font-heading text-3xl font-semibold text-ink-950">Página não encontrada</h1>
      <p className="mt-2 text-sm text-ink-500">O endereço acessado não existe ou foi movido.</p>
      <Link
        to="/"
        className="mt-8 inline-block rounded-md bg-brass-600 px-5 py-2.5 font-medium text-ink-50 transition-colors hover:bg-brass-500"
      >
        Voltar para o início
      </Link>
    </section>
  )
}
