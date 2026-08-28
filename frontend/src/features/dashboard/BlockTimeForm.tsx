import { type FormEvent, useState } from "react"
import { Button } from "../../components/ui/Button"
import { Field } from "../../components/ui/Field"
import { api } from "../../lib/api/client"
import { ApiError } from "../../lib/apiClient"
import { localDateIso } from "../../lib/format"

export function BlockTimeForm({ barberId, onSuccess }: { barberId: string; onSuccess: () => void }) {
  const today = localDateIso()
  const [date, setDate] = useState(today)
  const [isDayOff, setIsDayOff] = useState(false)
  const [startTime, setStartTime] = useState("12:00")
  const [endTime, setEndTime] = useState("13:00")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await api.createAvailabilityException(barberId, {
        date,
        startTime: `${startTime}:00`,
        endTime: `${endTime}:00`,
        isDayOff,
      })
      onSuccess()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível bloquear o horário.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <Field
        label="Data"
        type="date"
        min={today}
        required
        value={date}
        onChange={(event) => setDate(event.target.value)}
      />

      <label className="flex items-center gap-2 text-sm text-ink-700">
        <input
          type="checkbox"
          checked={isDayOff}
          onChange={(event) => setIsDayOff(event.target.checked)}
          className="h-4 w-4 rounded border-ink-300 text-brass-600 focus:ring-brass-500"
        />
        Bloquear o dia inteiro
      </label>

      {!isDayOff && (
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Início"
            type="time"
            required
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
          />
          <Field
            label="Fim"
            type="time"
            required
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
          />
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm font-medium text-error-600">
          {error}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Bloqueando…" : "Bloquear horário"}
      </Button>
    </form>
  )
}
