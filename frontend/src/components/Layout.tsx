import { NavLink, Outlet } from "react-router"
import { useAuth } from "../lib/auth/AuthContext"
import { STAFF_ROLES } from "../lib/auth/roles"

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
      <header className="bg-ink-950">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3" aria-label="Principal">
          <NavLink to="/" className="font-heading text-lg font-semibold tracking-wide text-brass-400">
            Barber Booking
          </NavLink>
          <ul className="flex items-center gap-1">
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
                  Sair ({user.name})
                </button>
              ) : (
                <NavLink to="/login" className={navLinkClass}>
                  Entrar
                </NavLink>
              )}
            </li>
          </ul>
        </nav>
      </header>
      <main id="main-content" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-ink-200 py-4 text-center text-sm text-ink-500">
        Barber Booking Platform
      </footer>
    </div>
  )
}
