import type { AvailabilitySlot } from "./api/types"
import { formatUtcTime } from "./format"

const PERIODS = [
  { label: "Manhã", from: 0, to: 12 },
  { label: "Tarde", from: 12, to: 18 },
  { label: "Noite", from: 18, to: 24 },
]

export function groupSlotsByPeriod(slots: AvailabilitySlot[], timeZoneId: string) {
  return PERIODS.map((period) => ({
    label: period.label,
    slots: slots
      .filter((slot) => {
        const hour = Number(formatUtcTime(slot.startUtc, timeZoneId).slice(0, 2))
        return hour >= period.from && hour < period.to
      })
      .map((slot) => ({ slot, time: formatUtcTime(slot.startUtc, timeZoneId) })),
  })).filter((group) => group.slots.length > 0)
}
