import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react"
import { onUnauthorized } from "../apiClient"
import { api } from "../api/client"
import type { LoginPayload, RegisterPayload } from "../api/types"
import { clearStoredAuth, readStoredAuth, writeStoredAuth, type StoredAuth } from "./storage"

interface AuthContextValue {
  user: StoredAuth | null
  login: (payload: LoginPayload) => Promise<StoredAuth>
  register: (payload: RegisterPayload) => Promise<StoredAuth>
  logout: () => void
  hasRole: (...roles: string[]) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StoredAuth | null>(() => readStoredAuth())

  useEffect(() => {
    onUnauthorized(() => setUser(null))
  }, [])

  const value = useMemo<AuthContextValue>(() => {
    async function authenticate(payload: LoginPayload) {
      const response = await api.login(payload)
      const authUser: StoredAuth = {
        token: response.accessToken,
        tokenType: response.tokenType,
        expiresAtUtc: response.expiresAtUtc,
        userId: response.user.id,
        name: response.user.fullName ?? response.user.email,
        email: response.user.email,
        roles: response.user.roles,
      }
      writeStoredAuth(authUser)
      setUser(authUser)
      return authUser
    }

    return {
      user,
      login: authenticate,
      async register(payload) {
        await api.register(payload)
        return authenticate({ email: payload.email, password: payload.password })
      },
      logout() {
        clearStoredAuth()
        setUser(null)
      },
      hasRole(...roles: string[]) {
        return user !== null && roles.some((role) => user.roles.includes(role))
      },
    }
  }, [user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider")
  }
  return context
}
