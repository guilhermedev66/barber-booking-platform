import { createContext, type ReactNode, useContext, useMemo, useState } from "react"
import { mockApi } from "../api/mockApi"
import type { LoginPayload, RegisterPayload } from "../api/types"

interface AuthUser {
  name: string
  token: string
}

interface AuthContextValue {
  user: AuthUser | null
  login: (payload: LoginPayload) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => void
}

const STORAGE_KEY = "bb_auth"

const AuthContext = createContext<AuthContextValue | null>(null)

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser())

  const value = useMemo<AuthContextValue>(() => {
    async function authenticate(payload: LoginPayload) {
      const response = await mockApi.login(payload)
      const authUser = { name: response.user.fullName ?? response.user.email, token: response.accessToken }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser))
      setUser(authUser)
    }

    return {
      user,
      login: authenticate,
      async register(payload) {
        await mockApi.register(payload)
        await authenticate({ email: payload.email, password: payload.password })
      },
      logout() {
        localStorage.removeItem(STORAGE_KEY)
        setUser(null)
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
