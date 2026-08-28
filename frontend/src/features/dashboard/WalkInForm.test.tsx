import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { WalkInForm } from "./WalkInForm"

vi.mock("../../lib/api/client", () => ({
  api: {
    getAvailability: vi.fn(),
    createWalkInAppointment: vi.fn(),
  },
}))

const { api } = await import("../../lib/api/client")

const barberId = "barber-1"
const services = [{ id: "svc-1", name: "Corte clássico", durationMinutes: 40, price: 60 }]

const TODAY_SLOT_UTC = "2026-08-28T12:00:00Z"
const FUTURE_DATE = "2026-09-29"
const FUTURE_SLOT_UTC = "2026-09-29T15:00:00Z"

function mockAvailabilityFor(date: string) {
  const startUtc = date === FUTURE_DATE ? FUTURE_SLOT_UTC : TODAY_SLOT_UTC
  return {
    barberId,
    serviceId: services[0].id,
    date,
    timeZoneId: "America/Sao_Paulo",
    slots: [{ startUtc, endUtc: startUtc }],
  }
}

describe("WalkInForm", () => {
  beforeEach(() => {
    vi.mocked(api.getAvailability).mockImplementation(async (_barberId, date) => mockAvailabilityFor(date))
    vi.mocked(api.createWalkInAppointment).mockResolvedValue({
      id: "apt-1",
      clientName: "Cliente Teste",
      barberId,
      barberName: "Barbeiro",
      serviceId: services[0].id,
      serviceName: services[0].name,
      durationMinutes: services[0].durationMinutes,
      price: services[0].price,
      startUtc: FUTURE_SLOT_UTC,
      endUtc: FUTURE_SLOT_UTC,
      status: "Confirmed",
    })
  })

  it("never submits a slot picked before the date was changed", async () => {
    const user = userEvent.setup()
    render(<WalkInForm barberId={barberId} services={services} onSuccess={vi.fn()} />)

    // Pick today's slot first.
    const todayTimeButton = await screen.findByRole("button", { name: "09:00" })
    await user.click(todayTimeButton)
    expect(screen.getByRole("button", { name: /criar encaixe/i })).toBeEnabled()

    // Changing the date must drop the stale selection immediately, not only once the
    // background refetch resolves. Native date inputs aren't reliably typeable via
    // keystroke simulation in jsdom, so set the value the way the browser does.
    const dateInput = screen.getByLabelText("Data")
    fireEvent.change(dateInput, { target: { value: FUTURE_DATE } })
    expect(screen.getByRole("button", { name: /criar encaixe/i })).toBeDisabled()

    // Pick the real slot for the newly selected date and submit.
    const futureTimeButton = await screen.findByRole("button", { name: "12:00" })
    await user.click(futureTimeButton)
    await user.type(screen.getByLabelText(/nome do cliente/i), "Cliente Teste")
    await user.click(screen.getByRole("button", { name: /criar encaixe/i }))

    await waitFor(() => expect(api.createWalkInAppointment).toHaveBeenCalledTimes(1))
    const payload = vi.mocked(api.createWalkInAppointment).mock.calls[0][0]
    expect(payload.startUtc).toBe(FUTURE_SLOT_UTC)
    expect(payload.startUtc).not.toBe(TODAY_SLOT_UTC)
  })
})
