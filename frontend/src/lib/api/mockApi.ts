import { addLocalDays, BOOKING_TIME_ZONE, localDateIso, zonedTimeToUtc } from "../format"
import type {
  Appointment,
  AvailabilityResponse,
  Barber,
  CreateAppointmentPayload,
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  RegisteredUserResponse,
  Service,
} from "./types"

function delay(ms = 550) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function localTimeToUtc(date: string, time: string) {
  return zonedTimeToUtc(date, time, BOOKING_TIME_ZONE)
}

function addMinutes(isoDateTime: string, minutes: number) {
  return new Date(new Date(isoDateTime).getTime() + minutes * 60_000).toISOString()
}

const services: Service[] = [
  { id: "svc-corte", name: "Corte clássico", durationMinutes: 40, price: 60 },
  { id: "svc-barba", name: "Barba completa", durationMinutes: 30, price: 45 },
  { id: "svc-combo", name: "Corte + barba", durationMinutes: 70, price: 95 },
  { id: "svc-sobrancelha", name: "Sobrancelha na navalha", durationMinutes: 15, price: 25 },
]

const barbers: Barber[] = [
  {
    id: "brb-marcos",
    displayName: "Marcos Andrade",
    bio: "16 anos de ofício, especialista em navalha.",
    services,
  },
  {
    id: "brb-diego",
    displayName: "Diego Fontes",
    bio: "Referência em degradê e barboterapia.",
    services,
  },
  {
    id: "brb-lucas",
    displayName: "Lucas Prado",
    bio: "Cortes clássicos e modernos sob medida.",
    services,
  },
]

let appointmentSeq = 1
const registeredFullNames = new Map<string, string>()
const today = localDateIso()
const nextWeekday = addLocalDays(today, 3)
const myAppointments: Appointment[] = [
  {
    id: "apt-seed-1",
    clientName: "Cliente de demonstração",
    serviceId: "svc-combo",
    serviceName: "Corte + barba",
    durationMinutes: 70,
    price: 95,
    barberId: "brb-marcos",
    barberName: "Marcos Andrade",
    startUtc: localTimeToUtc(today, "09:00"),
    endUtc: localTimeToUtc(today, "10:10"),
    status: "Confirmed",
  },
  {
    id: "apt-seed-2",
    clientName: "Cliente de demonstração",
    serviceId: "svc-corte",
    serviceName: "Corte clássico",
    durationMinutes: 40,
    price: 60,
    barberId: "brb-marcos",
    barberName: "Marcos Andrade",
    startUtc: localTimeToUtc(today, "10:20"),
    endUtc: localTimeToUtc(today, "11:00"),
    status: "Confirmed",
  },
  {
    id: "apt-seed-3",
    clientName: "Cliente de demonstração",
    serviceId: "svc-barba",
    serviceName: "Barba completa",
    durationMinutes: 30,
    price: 45,
    barberId: "brb-marcos",
    barberName: "Marcos Andrade",
    startUtc: localTimeToUtc(today, "11:00"),
    endUtc: localTimeToUtc(today, "11:30"),
    status: "Pending",
  },
  {
    id: "apt-seed-4",
    clientName: "Cliente de demonstração",
    serviceId: "svc-sobrancelha",
    serviceName: "Sobrancelha na navalha",
    durationMinutes: 15,
    price: 25,
    barberId: "brb-marcos",
    barberName: "Marcos Andrade",
    startUtc: localTimeToUtc(today, "14:20"),
    endUtc: localTimeToUtc(today, "14:35"),
    status: "Pending",
  },
  {
    id: "apt-seed-5",
    clientName: "Cliente de demonstração",
    serviceId: "svc-combo",
    serviceName: "Corte + barba",
    durationMinutes: 70,
    price: 95,
    barberId: "brb-marcos",
    barberName: "Marcos Andrade",
    startUtc: localTimeToUtc(nextWeekday, "10:30"),
    endUtc: localTimeToUtc(nextWeekday, "11:40"),
    status: "Confirmed",
  },
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
    const service = services.find((item) => item.id === serviceId)
    const barber = barbers.find((item) => item.id === barberId)
    if (!service || !barber) {
      throw new Error("Barbeiro ou serviço inválido.")
    }

    const [year, month, dayOfMonth] = date.split("-").map(Number)
    const day = new Date(Date.UTC(year, month - 1, dayOfMonth)).getUTCDay()
    if (day === 0) {
      return { barberId, serviceId, date, timeZoneId: BOOKING_TIME_ZONE, slots: [] }
    }

    const takenCount = (barberId.charCodeAt(barberId.length - 1) + day) % 5
    const slots = baseSlots
      .filter((_, index) => index % 5 !== takenCount)
      .map((time) => {
        const startUtc = localTimeToUtc(date, time)
        return { startUtc, endUtc: addMinutes(startUtc, service.durationMinutes) }
      })

    return { barberId, serviceId, date, timeZoneId: BOOKING_TIME_ZONE, slots }
  },

  async createAppointment(payload: CreateAppointmentPayload): Promise<Appointment> {
    await delay(700)
    const service = services.find((item) => item.id === payload.serviceId)
    const barber = barbers.find((item) => item.id === payload.barberId)
    if (!service || !barber) {
      throw new Error("Serviço ou barbeiro inválido.")
    }

    const startUtc = new Date(payload.startUtc).toISOString()
    const appointment: Appointment = {
      id: `apt-${appointmentSeq++}`,
      clientName: "Cliente de demonstração",
      serviceId: service.id,
      serviceName: service.name,
      durationMinutes: service.durationMinutes,
      price: service.price,
      barberId: barber.id,
      barberName: barber.displayName,
      startUtc,
      endUtc: addMinutes(startUtc, service.durationMinutes),
      status: "Confirmed",
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

  async listAgendaAppointments(): Promise<Appointment[]> {
    await delay()
    return myAppointments
  },

  async login(payload: LoginPayload): Promise<LoginResponse> {
    await delay(600)
    if (!payload.email || !payload.password) {
      throw new Error("Informe email e senha.")
    }

    const fullName = registeredFullNames.get(payload.email) ?? payload.email.split("@")[0]
    return {
      accessToken: "mock-token",
      tokenType: "Bearer",
      expiresAtUtc: addMinutes(new Date().toISOString(), 60),
      user: { id: "mock-user", fullName, email: payload.email, roles: ["Client"] },
    }
  },

  async register(payload: RegisterPayload): Promise<RegisteredUserResponse> {
    await delay(700)
    registeredFullNames.set(payload.email, payload.fullName)
    return {
      id: "mock-user",
      fullName: payload.fullName,
      email: payload.email,
      roles: ["Client"],
    }
  },
}
