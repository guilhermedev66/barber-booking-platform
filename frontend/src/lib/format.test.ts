import { describe, expect, it } from "vitest"
import { addLocalDays, formatUtcTime, zonedTimeToUtc } from "./format"

describe("zonedTimeToUtc", () => {
  it("converts a São Paulo wall-clock time to the correct UTC instant regardless of the host timezone", () => {
    const result = zonedTimeToUtc("2026-08-28", "09:00", "America/Sao_Paulo")
    expect(result).toBe("2026-08-28T12:00:00.000Z")
  })

  it("round-trips back to the same wall-clock time when formatted for display", () => {
    const startUtc = zonedTimeToUtc("2026-08-28", "09:00", "America/Sao_Paulo")
    expect(formatUtcTime(startUtc, "America/Sao_Paulo")).toBe("09:00")
  })
})

describe("addLocalDays", () => {
  it("adds calendar days without drifting across a host-timezone reinterpretation", () => {
    expect(addLocalDays("2026-08-28", 3)).toBe("2026-08-31")
    expect(addLocalDays("2026-12-30", 3)).toBe("2027-01-02")
  })
})
