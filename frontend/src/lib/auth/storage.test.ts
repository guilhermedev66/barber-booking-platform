import { beforeEach, describe, expect, it } from "vitest"
import { readStoredAuth, type StoredAuth } from "./storage"

const validAuth: StoredAuth = {
  token: "test-token",
  tokenType: "Bearer",
  expiresAtUtc: "2099-01-01T00:00:00.000Z",
  userId: "test-user",
  name: "Test User",
  email: "test@example.test",
  roles: ["Client"],
}

describe("stored authentication", () => {
  beforeEach(() => localStorage.clear())

  it("discards the legacy mock schema", () => {
    localStorage.setItem("bb_auth", JSON.stringify({ name: "Legacy", token: "legacy-token" }))

    expect(readStoredAuth()).toBeNull()
    expect(localStorage.getItem("bb_auth")).toBeNull()
  })

  it("loads a valid v2 session", () => {
    localStorage.setItem("bb_auth:v2", JSON.stringify(validAuth))

    expect(readStoredAuth()).toEqual(validAuth)
  })

  it("discards an expired v2 session", () => {
    localStorage.setItem(
      "bb_auth:v2",
      JSON.stringify({ ...validAuth, expiresAtUtc: "2020-01-01T00:00:00.000Z" }),
    )

    expect(readStoredAuth()).toBeNull()
    expect(localStorage.getItem("bb_auth:v2")).toBeNull()
  })
})
