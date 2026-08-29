import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router'
import App from './App'
import { AuthProvider } from './lib/auth/AuthContext'
import { ThemeProvider } from './lib/theme/ThemeContext'

function renderApp(initialEntries: string[]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

describe('App routing', () => {
  it('renders the home page and guest nav links by default', () => {
    renderApp(['/'])

    expect(screen.getByRole('heading', { name: /ofício barbearia/i })).toBeInTheDocument()

    const nav = screen.getByRole('navigation')
    expect(within(nav).getByRole('link', { name: /agendar/i })).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: /entrar/i })).toBeInTheDocument()
    expect(within(nav).queryByRole('link', { name: /painel/i })).not.toBeInTheDocument()
  })

  it('renders the booking page heading at /book for a guest', () => {
    renderApp(['/book'])

    expect(screen.getByRole('heading', { name: /agendar horário/i })).toBeInTheDocument()
  })

  it('redirects to login when a logged-out visitor requests /dashboard', () => {
    renderApp(['/dashboard'])

    expect(screen.getByRole('heading', { name: /entrar/i })).toBeInTheDocument()
  })

  it('redirects to login when a logged-out visitor requests /appointments', () => {
    renderApp(['/appointments'])

    expect(screen.getByRole('heading', { name: /entrar/i })).toBeInTheDocument()
  })

  it('renders a 404 page for an unknown route', () => {
    renderApp(['/nope'])

    expect(screen.getByRole('heading', { name: /página não encontrada/i })).toBeInTheDocument()
  })
})
