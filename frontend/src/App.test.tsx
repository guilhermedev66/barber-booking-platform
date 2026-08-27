import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router'
import App from './App'

describe('App routing', () => {
  it('renders the home page and nav links by default', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: /barber booking platform/i })).toBeInTheDocument()

    const nav = screen.getByRole('navigation')
    expect(within(nav).getByRole('link', { name: /agendar/i })).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: /painel/i })).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: /entrar/i })).toBeInTheDocument()
  })

  it('renders the booking page heading at /book', () => {
    render(
      <MemoryRouter initialEntries={['/book']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: /agendar horário/i })).toBeInTheDocument()
  })

  it('renders the dashboard page heading at /dashboard', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: /painel/i })).toBeInTheDocument()
  })
})
