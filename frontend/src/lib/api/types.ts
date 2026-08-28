export interface Service {
  id: string
  name: string
  description: string
  durationMinutes: number
  priceCents: number
}

export interface Barber {
  id: string
  name: string
  title: string
  bio: string
  initials: string
}

export type AppointmentStatus = "Pending" | "Confirmed" | "Cancelled" | "Completed"

export interface Appointment {
  id: string
  serviceId: string
  serviceName: string
  barberId: string
  barberName: string
  date: string
  time: string
  status: AppointmentStatus
}

export interface AvailabilityResponse {
  date: string
  barberId: string
  serviceId: string
  slots: string[]
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  name: string
}

export interface CreateAppointmentPayload {
  serviceId: string
  barberId: string
  startUtc: string
}
