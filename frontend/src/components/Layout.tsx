import { NavLink, Outlet } from "react-router"
import { useAuth } from "../lib/auth/AuthContext"
import { STAFF_ROLES } from "../lib/auth/roles"
import { ThemeToggle } from "./ui/ThemeToggle"
import { Wordmark } from "./ui/Wordmark"

function navLinkClass({ isActive }: { isActive: boolean }) {
  return [
    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
    isActive
      ? "bg-ink-800 text-brass-300"
      : "text-ink-200 hover:bg-ink-800 hover:text-brass-300",
  ].join(" ")
}

export function Layout() {
  const { user, logout, hasRole } = useAuth()
  const isStaff = hasRole(...STAFF_ROLES)

  const navLinks = isStaff
    ? [{ to: "/dashboard", label: "Painel" }]
    : [
        { to: "/book", label: "Agendar" },
        ...(user ? [{ to: "/appointments", label: "Minhas reservas" }] : []),
      ]

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-brass-500 focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink-950"
      >
        Pular para o conteúdo
      </a>
      <header className="bg-ink-950 dark:border-b dark:border-ink-800">
        <nav
          className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3"
          aria-label="Principal"
        >
          <NavLink to="/" aria-label="Ofício Barbearia — início">
            <Wordmark />
          </NavLink>
          <ul className="flex flex-wrap items-center justify-end gap-1">
            {navLinks.map((link) => (
              <li key={link.to}>
                <NavLink to={link.to} className={navLinkClass}>
                  {link.label}
                </NavLink>
              </li>
            ))}
            <li>
              {user ? (
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-md px-3 py-2 text-sm font-medium text-ink-200 transition-colors hover:bg-ink-800 hover:text-brass-300"
                >
                  Sair <span className="hidden sm:inline">({user.name})</span>
                </button>
              ) : (
                <NavLink to="/login" className={navLinkClass}>
                  Entrar
                </NavLink>
              )}
            </li>
            <li>
              <ThemeToggle />
            </li>
          </ul>
        </nav>
      </header>
      <main id="main-content" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-ink-200 dark:border-ink-800">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 py-6 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <span className="font-heading text-sm font-semibold tracking-wide text-ink-800 dark:text-ink-200">
              Ofício Barbearia
            </span>
            <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">
              Projeto demonstrativo — Barber Booking Platform
            </p>
          </div>
          <a
            href="https://github.com/guilhermedev66/barber-booking-platform"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-medium text-ink-500 underline underline-offset-4 transition-colors hover:text-brass-600 dark:text-ink-400 dark:hover:text-brass-400"
          >
            Ver código no GitHub
          </a>
        </div>
      </footer>
    </div>
  )
}
