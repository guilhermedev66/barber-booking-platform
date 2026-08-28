import { clearStoredAuth, readStoredAuth } from "./auth/storage"

const baseUrl = import.meta.env.VITE_API_URL ?? ""

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

type UnauthorizedListener = () => void
let unauthorizedListener: UnauthorizedListener | null = null

export function onUnauthorized(listener: UnauthorizedListener) {
  unauthorizedListener = listener
}

async function extractErrorMessage(response: Response): Promise<string | undefined> {
  try {
    const data = await response.clone().json()
    if (data?.errors && typeof data.errors === "object") {
      const messages = Object.values(data.errors).flat() as string[]
      if (messages.length > 0) return messages.join(" ")
    }
    return data?.detail ?? data?.title
  } catch {
    return undefined
  }
}

interface RequestOptions {
  /** Attaches the stored bearer token. Omit for public/anonymous endpoints. */
  auth?: boolean
}

async function request<T>(path: string, init?: RequestInit, options?: RequestOptions): Promise<T> {
  const auth = readStoredAuth()
  const token = options?.auth && auth ? auth.token : null

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })

  if (response.status === 401) {
    clearStoredAuth()
    unauthorizedListener?.()
  }

  if (!response.ok) {
    const detail = await extractErrorMessage(response)
    throw new ApiError(response.status, detail ?? `Request to ${path} failed with status ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { method: "GET" }, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }, options),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined }, options),
  delete: <T>(path: string, options?: RequestOptions) => request<T>(path, { method: "DELETE" }, options),
}
