import type {
  Appointment,
  AuthResponse,
  AvailabilityResponse,
  Barber,
  CreateAppointmentPayload,
  LoginPayload,
  RegisterPayload,
  Service,
} from "./types"

function delay(ms = 550) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const services: Service[] = [
  { id: "svc-corte", name: "Corte clássico", description: "Tesoura e máquina, acabamento na navalha.", durationMinutes: 40, priceCents: 6000 },
  { id: "svc-barba", name: "Barba completa", description: "Toalha quente, navalha e finalização.", durationMinutes: 30, priceCents: 4500 },
  { id: "svc-combo", name: "Corte + barba", description: "Ritual completo de corte e barba.", durationMinutes: 70, priceCents: 9500 },
  { id: "svc-sobrancelha", name: "Sobrancelha na navalha", description: "Design e alinhamento.", durationMinutes: 15, priceCents: 2500 },
]

const barbers: Barber[] = [
  { id: "brb-marcos", name: "Marcos Andrade", title: "Barbeiro sênior", bio: "16 anos de ofício, especialista em navalha.", initials: "MA" },
  { id: "brb-diego", name: "Diego Fontes", title: "Barbeiro sênior", bio: "Referência em degradê e barboterapia.", initials: "DF" },
  { id: "brb-lucas", name: "Lucas Prado", title: "Barbeiro pleno", bio: "Cortes clássicos e modernos sob medida.", initials: "LP" },
]

function nextWeekday(daysAhead: number) {
  const date = new Date()
  date.setDate(date.getDate() + daysAhead)
  return date.toISOString().slice(0, 10)
}

const today = new Date().toISOString().slice(0, 10)

let appointmentSeq = 1
const myAppointments: Appointment[] = [
  { id: "apt-seed-1", serviceId: "svc-combo", serviceName: "Corte + barba", barberId: "brb-marcos", barberName: "Marcos Andrade", date: today, time: "09:00", status: "Confirmed" },
  { id: "apt-seed-2", serviceId: "svc-corte", serviceName: "Corte clássico", barberId: "brb-marcos", barberName: "Marcos Andrade", date: today, time: "10:20", status: "Confirmed" },
  { id: "apt-seed-3", serviceId: "svc-barba", serviceName: "Barba completa", barberId: "brb-marcos", barberName: "Marcos Andrade", date: today, time: "11:00", status: "Pending" },
  { id: "apt-seed-4", serviceId: "svc-sobrancelha", serviceName: "Sobrancelha na navalha", barberId: "brb-marcos", barberName: "Marcos Andrade", date: today, time: "14:20", status: "Pending" },
  { id: "apt-seed-5", serviceId: "svc-combo", serviceName: "Corte + barba", barberId: "brb-marcos", barberName: "Marcos Andrade", date: nextWeekday(1), time: "10:30", status: "Confirmed" },
  { id: "apt-seed-6", serviceId: "svc-corte", serviceName: "Corte clássico", barberId: "brb-marcos", barberName: "Marcos Andrade", date: nextWeekday(3), time: "16:00", status: "Confirmed" },
]

const baseSlots = ["09:00", "09:40", "10:20", "11:00", "13:00", "13:40", "14:20", "15:00", "15:40", "16:20", "17:00"]

export const mockApi = {
  async listServices(): Promise<Service[]> {
    await delay()
    return services
  },

  async listBarbers(): Promise<Barber[]> {
    await delay()
    return barbers
  },

  async getAvailability(barberId: string, date: string, serviceId: string): Promise<AvailabilityResponse> {
    await delay(650)
    const day = new Date(`${date}T00:00:00`).getDay()

    if (day === 0) {
      return { date, barberId, serviceId, slots: [] }
    }

    const takenCount = (barberId.charCodeAt(barberId.length - 1) + day) % 5
    const slots = baseSlots.filter((_, index) => index % 5 !== takenCount)
    return { date, barberId, serviceId, slots }
  },

  async createAppointment(payload: CreateAppointmentPayload): Promise<Appointment> {
    await delay(700)
    const service = services.find((item) => item.id === payload.serviceId)
    const barber = barbers.find((item) => item.id === payload.barberId)
    if (!service || !barber) {
      throw new Error("Serviço ou barbeiro inválido.")
    }

    const start = new Date(payload.startUtc)
    const appointment: Appointment = {
      id: `apt-${appointmentSeq++}`,
      serviceId: service.id,
      serviceName: service.name,
      barberId: barber.id,
      barberName: barber.name,
      date: start.toISOString().slice(0, 10),
      time: start.toISOString().slice(11, 16),
      status: "Pending",
    }
    myAppointments.unshift(appointment)
    return appointment
  },

  async cancelAppointment(id: string): Promise<void> {
    await delay(400)
    const appointment = myAppointments.find((item) => item.id === id)
    if (appointment) {
      appointment.status = "Cancelled"
    }
  },

  async listMyAppointments(): Promise<Appointment[]> {
    await delay()
    return myAppointments
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    await delay(600)
    if (!payload.email || !payload.password) {
      throw new Error("Informe email e senha.")
    }
    return { token: "mock-token", name: payload.email.split("@")[0] }
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    await delay(700)
    return { token: "mock-token", name: payload.name }
  },
}
