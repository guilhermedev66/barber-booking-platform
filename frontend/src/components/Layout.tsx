import { NavLink, Outlet } from "react-router"

const navLinks = [
  { to: "/book", label: "Agendar" },
  { to: "/dashboard", label: "Painel" },
  { to: "/login", label: "Entrar" },
]

function navLinkClass({ isActive }: { isActive: boolean }) {
  return [
    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
    isActive
      ? "bg-ink-800 text-brass-300"
      : "text-ink-200 hover:bg-ink-800 hover:text-brass-300",
  ].join(" ")
}

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-ink-950">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
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
          </ul>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-ink-200 py-4 text-center text-sm text-ink-500">
        Barber Booking Platform
      </footer>
    </div>
  )
}
