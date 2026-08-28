function toIcsDateTime(iso: string) {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
}

function escapeIcsText(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n")
}

export function buildIcsContent(params: {
  uid: string
  summary: string
  description?: string
  startUtc: string
  endUtc: string
}) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Barber Booking Platform//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${params.uid}`,
    `DTSTAMP:${toIcsDateTime(new Date().toISOString())}`,
    `DTSTART:${toIcsDateTime(params.startUtc)}`,
    `DTEND:${toIcsDateTime(params.endUtc)}`,
    `SUMMARY:${escapeIcsText(params.summary)}`,
    params.description ? `DESCRIPTION:${escapeIcsText(params.description)}` : null,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter((line): line is string => line !== null)

  return lines.join("\r\n")
}

export function downloadIcsFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
