import { type FormEvent, useState } from "react"

export function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
  }

  return (
    <section className="mx-auto max-w-sm">
      <h1 className="font-heading text-2xl font-semibold text-ink-900">Entrar</h1>
      <p className="mt-1 text-sm text-ink-500">Acesse sua conta para gerenciar seus agendamentos.</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-ink-700">
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-md border border-ink-200 bg-ink-50 px-3 py-2 text-ink-900 outline-none focus:border-brass-500"
            placeholder="voce@exemplo.com"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-ink-700">
          Senha
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded-md border border-ink-200 bg-ink-50 px-3 py-2 text-ink-900 outline-none focus:border-brass-500"
            placeholder="••••••••"
          />
        </label>

        <button
          type="submit"
          className="mt-2 rounded-md bg-brass-600 px-4 py-2 font-medium text-ink-50 transition-colors hover:bg-brass-500"
        >
          Entrar
        </button>
      </form>
    </section>
  )
}
