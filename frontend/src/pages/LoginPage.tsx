import { type FormEvent, useState } from "react"
import { Link, useNavigate } from "react-router"
import { Button } from "../components/ui/Button"
import { Field } from "../components/ui/Field"
import { useAuth } from "../lib/auth/AuthContext"
import { STAFF_ROLES } from "../lib/auth/roles"

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      const authUser = await login({ email, password })
      navigate(authUser.roles.some((role) => STAFF_ROLES.includes(role)) ? "/dashboard" : "/book")
    } catch {
      setError("Email ou senha inválidos.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-sm py-6">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brass-600">Bem-vindo de volta</span>
      <h1 className="mt-3 font-heading text-3xl font-semibold text-ink-950">Entrar</h1>
      <p className="mt-1 text-sm text-ink-500">Acesse sua conta para gerenciar seus agendamentos.</p>

      <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-4">
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="voce@exemplo.com"
        />
        <Field
          label="Senha"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
        />

        {error && (
          <p role="alert" className="text-sm font-medium text-error-600">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" disabled={isSubmitting} className="mt-2">
          {isSubmitting ? "Entrando…" : "Entrar"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        Ainda não tem conta?{" "}
        <Link to="/register" className="font-semibold text-ink-800 underline underline-offset-4 hover:text-brass-600">
          Cadastre-se
        </Link>
      </p>
    </section>
  )
}
