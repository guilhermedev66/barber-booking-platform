import { apiClient } from "../apiClient"
import type {
  Appointment,
  AvailabilityException,
  AvailabilityResponse,
  Barber,
  CreateAppointmentPayload,
  CreateAvailabilityExceptionPayload,
  CreateWalkInPayload,
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  RegisteredUserResponse,
  Service,
} from "./types"

export const api = {
  listServices(): Promise<Service[]> {
    return apiClient.get<Service[]>("/api/services")
  },

  listBarbers(): Promise<Barber[]> {
    return apiClient.get<Barber[]>("/api/barbers")
  },

  getAvailability(barberId: string, date: string, serviceId: string): Promise<AvailabilityResponse> {
    const query = new URLSearchParams({ date, serviceId })
    return apiClient.get<AvailabilityResponse>(`/api/barbers/${barberId}/availability?${query}`)
  },

  createAppointment(payload: CreateAppointmentPayload): Promise<Appointment> {
    return apiClient.post<Appointment>("/api/appointments", payload, { auth: true })
  },

  cancelAppointment(id: string): Promise<void> {
    return apiClient.post<void>(`/api/appointments/${id}/cancel`, undefined, { auth: true })
  },

  /** Client's own bookings. */
  listMyAppointments(): Promise<Appointment[]> {
    return apiClient.get<Appointment[]>("/api/appointments/mine", { auth: true })
  },

  /** Barber/Admin agenda. */
  listAgenda(): Promise<Appointment[]> {
    return apiClient.get<Appointment[]>("/api/appointments", { auth: true })
  },

  createWalkInAppointment(payload: CreateWalkInPayload): Promise<Appointment> {
    return apiClient.post<Appointment>("/api/appointments/walk-in", payload, { auth: true })
  },

  createAvailabilityException(
    barberId: string,
    payload: CreateAvailabilityExceptionPayload,
  ): Promise<AvailabilityException> {
    return apiClient.post<AvailabilityException>(
      `/api/barbers/${barberId}/availability/exceptions`,
      payload,
      { auth: true },
    )
  },

  login(payload: LoginPayload): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>("/api/auth/login", payload)
  },

  register(payload: RegisterPayload): Promise<RegisteredUserResponse> {
    return apiClient.post<RegisteredUserResponse>("/api/auth/register", payload)
  },
}
