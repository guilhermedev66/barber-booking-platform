import { type FormEvent, useState } from "react"
import { Link, useNavigate } from "react-router"
import { Button } from "../components/ui/Button"
import { Field } from "../components/ui/Field"
import { useAuth } from "../lib/auth/AuthContext"

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.")
      return
    }

    setIsSubmitting(true)
    try {
      await register({ name, email, password })
      navigate("/book")
    } catch {
      setError("Não foi possível criar sua conta. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-sm py-6">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brass-600">Primeira vez aqui</span>
      <h1 className="mt-3 font-heading text-3xl font-semibold text-ink-950">Criar conta</h1>
      <p className="mt-1 text-sm text-ink-500">Cadastre-se para agendar e acompanhar seus horários.</p>

      <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-4">
        <Field
          label="Nome"
          type="text"
          autoComplete="name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Seu nome completo"
        />
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
          autoComplete="new-password"
          required
          minLength={6}
          hint="Mínimo de 6 caracteres."
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
          {isSubmitting ? "Criando conta…" : "Criar conta"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        Já tem conta?{" "}
        <Link to="/login" className="font-semibold text-ink-800 underline underline-offset-4 hover:text-brass-600">
          Entrar
        </Link>
      </p>
    </section>
  )
}
