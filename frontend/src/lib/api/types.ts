export interface Service {
  id: string
  name: string
  durationMinutes: number
  price: number
}

export interface BarberService extends Service {}

export interface Barber {
  id: string
  displayName: string
  bio: string | null
  services: BarberService[]
}

export type AppointmentStatus = "Pending" | "Confirmed" | "Cancelled" | "Completed"

export interface Appointment {
  id: string
  clientName: string | null
  barberId: string
  barberName: string
  serviceId: string
  serviceName: string
  durationMinutes: number
  price: number
  startUtc: string
  endUtc: string
  status: AppointmentStatus
}

export interface AvailabilitySlot {
  startUtc: string
  endUtc: string
}

export interface AvailabilityResponse {
  barberId: string
  serviceId: string
  date: string
  timeZoneId: string
  slots: AvailabilitySlot[]
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  fullName: string
  email: string
  password: string
}

export interface RegisteredUserResponse {
  id: string
  fullName: string | null
  email: string
  roles: string[]
}

export interface AuthenticatedUser {
  id: string
  fullName: string | null
  email: string
  roles: string[]
}

export interface LoginResponse {
  accessToken: string
  tokenType: string
  expiresAtUtc: string
  user: AuthenticatedUser
}

export interface CreateAppointmentPayload {
  serviceId: string
  barberId: string
  startUtc: string
}
