import { describe, expect, it } from "vitest"
import { isSlotValidForDate } from "./slots"

describe("isSlotValidForDate", () => {
  it("accepts a slot that actually falls on the given date in the booking timezone", () => {
    const slot = { startUtc: "2026-09-29T12:00:00Z", endUtc: "2026-09-29T12:40:00Z" }
    expect(isSlotValidForDate(slot, "2026-09-29", "America/Sao_Paulo")).toBe(true)
  })

  it("rejects a slot left over from a previously selected date", () => {
    const staleSlotFromToday = { startUtc: "2026-08-28T16:00:00Z", endUtc: "2026-08-28T16:40:00Z" }
    expect(isSlotValidForDate(staleSlotFromToday, "2026-09-29", "America/Sao_Paulo")).toBe(false)
  })
})
