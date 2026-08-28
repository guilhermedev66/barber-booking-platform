import type { ReactNode } from "react"
import { Navigate } from "react-router"
import { useAuth } from "../lib/auth/AuthContext"
import { STAFF_ROLES } from "../lib/auth/roles"

/** Keeps logged-in Barber/Admin users out of the client-only booking flow. */
export function RedirectStaffAway({ redirectTo, children }: { redirectTo: string; children: ReactNode }) {
  const { hasRole } = useAuth()

  if (hasRole(...STAFF_ROLES)) {
    return <Navigate to={redirectTo} replace />
  }

  return children
}
