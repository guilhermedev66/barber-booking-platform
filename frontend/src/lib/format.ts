export const BOOKING_TIME_ZONE = "America/Sao_Paulo"

export function formatPrice(price: number) {
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export function formatDuration(minutes: number) {
  return `${minutes} min`
}

export function formatDateLabel(isoDate: string) {
  const date = new Date(`${isoDate}T12:00:00`)
  return date.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })
}

export function formatDateLong(isoDate: string) {
  const date = new Date(`${isoDate}T12:00:00`)
  return date.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })
}

export function formatUtcDateIso(utcDateTime: string, timeZone = BOOKING_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(utcDateTime))
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

export function formatUtcTime(utcDateTime: string, timeZone = BOOKING_TIME_ZONE) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(utcDateTime))
}

export function formatUtcDateLong(utcDateTime: string, timeZone = BOOKING_TIME_ZONE) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone,
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date(utcDateTime))
}

export function localDateIso(timeZone = BOOKING_TIME_ZONE) {
  return formatUtcDateIso(new Date().toISOString(), timeZone)
}

export function addLocalDays(dateIso: string, days: number) {
  const [year, month, day] = dateIso.split("-").map(Number)
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10)
}

function zonedWallClockAsUtcMs(instant: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second),
  )
}

// Converts a wall-clock date+time as observed in `timeZone` into the UTC instant it
// represents — independent of the host process's own timezone. Uses the standard
// two-pass Intl technique: guess the instant, read back what that instant looks like
// in the target zone, then correct by the difference.
export function zonedTimeToUtc(dateIso: string, time: string, timeZone = BOOKING_TIME_ZONE) {
  const [year, month, day] = dateIso.split("-").map(Number)
  const [hour, minute] = time.split(":").map(Number)
  const wantedUtcMs = Date.UTC(year, month - 1, day, hour, minute, 0)

  const guess = new Date(wantedUtcMs)
  const diff = wantedUtcMs - zonedWallClockAsUtcMs(guess, timeZone)
  return new Date(guess.getTime() + diff).toISOString()
}
