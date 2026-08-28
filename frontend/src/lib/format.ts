export function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export function formatDuration(minutes: number) {
  return `${minutes} min`
}

export function formatDateLabel(isoDate: string) {
  const date = new Date(`${isoDate}T00:00:00`)
  return date.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })
}

export function formatDateLong(isoDate: string) {
  const date = new Date(`${isoDate}T00:00:00`)
  return date.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })
}
