export interface StoredAuth {
  token: string
  tokenType: string
  expiresAtUtc: string
  userId: string
  name: string
  email: string
  roles: string[]
}

const STORAGE_KEY = "bb_auth:v2"
const LEGACY_STORAGE_KEY = "bb_auth"

function isStoredAuth(value: unknown): value is StoredAuth {
  if (!value || typeof value !== "object") return false
  const auth = value as Partial<StoredAuth>
  return (
    typeof auth.token === "string" &&
    typeof auth.expiresAtUtc === "string" &&
    typeof auth.userId === "string" &&
    typeof auth.name === "string" &&
    typeof auth.email === "string" &&
    Array.isArray(auth.roles) &&
    auth.roles.every((role) => typeof role === "string")
  )
}

export function readStoredAuth(): StoredAuth | null {
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY)
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const auth: unknown = JSON.parse(raw)
    if (!isStoredAuth(auth) || Date.parse(auth.expiresAtUtc) <= Date.now()) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }

    return auth
  } catch {
    return null
  }
}

export function writeStoredAuth(auth: StoredAuth) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(auth))
  } catch {
    // Authentication remains valid in memory when storage is unavailable.
  }
}

export function clearStoredAuth() {
  try {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(LEGACY_STORAGE_KEY)
  } catch {
    // The in-memory auth state is still cleared by AuthContext.
  }
}
