import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router"
import { useAuth } from "../lib/auth/AuthContext"

export function RequireRole({ roles, redirectTo, children }: { roles: string[]; redirectTo: string; children: ReactNode }) {
  const { user, hasRole } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!hasRole(...roles)) {
    return <Navigate to={redirectTo} replace />
  }

  return children
}
