import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router'
import App from './App'
import { AuthProvider } from './lib/auth/AuthContext'

function renderApp(initialEntries: string[]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('App routing', () => {
  it('renders the home page and nav links by default', () => {
    renderApp(['/'])

    expect(screen.getByRole('heading', { name: /barber booking platform/i })).toBeInTheDocument()

    const nav = screen.getByRole('navigation')
    expect(within(nav).getByRole('link', { name: /agendar/i })).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: /painel/i })).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: /entrar/i })).toBeInTheDocument()
  })

  it('renders the booking page heading at /book', () => {
    renderApp(['/book'])

    expect(screen.getByRole('heading', { name: /agendar horário/i })).toBeInTheDocument()
  })

  it('renders the dashboard page heading at /dashboard', () => {
    renderApp(['/dashboard'])

    expect(screen.getByRole('heading', { name: /painel/i })).toBeInTheDocument()
  })
})
