import { type FormEvent, useEffect, useState } from "react"
import { Button } from "../../components/ui/Button"
import { Field } from "../../components/ui/Field"
import { ErrorState, LoadingState } from "../../components/ui/Feedback"
import { api } from "../../lib/api/client"
import type { AvailabilityResponse, AvailabilitySlot, BarberService } from "../../lib/api/types"
import { ApiError } from "../../lib/apiClient"
import { BOOKING_TIME_ZONE, formatPrice, localDateIso } from "../../lib/format"
import { groupSlotsByPeriod, isSlotValidForDate } from "../../lib/slots"

export function WalkInForm({
  barberId,
  services,
  onSuccess,
}: {
  barberId: string
  services: BarberService[]
  onSuccess: () => void
}) {
  const today = localDateIso()
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "")
  const [date, setDate] = useState(today)
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null)
  const [slotsError, setSlotsError] = useState(false)
  const [slotsAttempt, setSlotsAttempt] = useState(0)
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null)
  const [clientName, setClientName] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [clientNameError, setClientNameError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleDateChange(nextDate: string) {
    setDate(nextDate)
    setAvailability(null)
    setSelectedSlot(null)
    setError(null)
  }

  function handleServiceChange(nextServiceId: string) {
    setServiceId(nextServiceId)
    setAvailability(null)
    setSelectedSlot(null)
    setError(null)
  }

  useEffect(() => {
    if (!serviceId) return
    let cancelled = false
    setAvailability(null)
    setSlotsError(false)
    setSelectedSlot(null)
    api
      .getAvailability(barberId, date, serviceId)
      .then((response) => {
        if (!cancelled) setAvailability(response)
      })
      .catch(() => {
        if (!cancelled) setSlotsError(true)
      })
    return () => {
      cancelled = true
    }
  }, [barberId, serviceId, date, slotsAttempt])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedSlot) return

    if (clientName.trim().length < 2) {
      setClientNameError("Informe o nome do cliente (mínimo 2 caracteres).")
      return
    }
    setClientNameError(null)

    const submittedDate = new FormData(event.currentTarget).get("date")
    if (
      typeof submittedDate !== "string" ||
      submittedDate !== date ||
      availability?.date !== date ||
      !isSlotValidForDate(selectedSlot, date, availability?.timeZoneId ?? BOOKING_TIME_ZONE)
    ) {
      setDate(typeof submittedDate === "string" ? submittedDate : date)
      setAvailability(null)
      setSelectedSlot(null)
      setError("A disponibilidade foi alterada. Escolha novamente o horário.")
      setSlotsAttempt((n) => n + 1)
      return
    }

    setError(null)
    setIsSubmitting(true)
    try {
      await api.createWalkInAppointment({
        barberId,
        serviceId,
        startUtc: selectedSlot.startUtc,
        clientName,
        clientPhone: clientPhone.trim() || undefined,
      })
      onSuccess()
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError("Esse horário acabou de ser ocupado. Escolha outro.")
        setSelectedSlot(null)
        setSlotsAttempt((n) => n + 1)
        return
      }
      setError(err instanceof ApiError ? err.message : "Não foi possível criar o encaixe.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink-700 dark:text-ink-300">Serviço</span>
        <select
          value={serviceId}
          onChange={(event) => handleServiceChange(event.target.value)}
          className="rounded-md border border-ink-300 bg-ink-50 px-3 py-2.5 text-ink-900 outline-none focus:border-brass-500 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-100 dark:focus:border-brass-400"
        >
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name} — {formatPrice(service.price)}
            </option>
          ))}
        </select>
      </label>

      <Field
        label="Data"
        name="date"
        type="date"
        min={today}
        required
        value={date}
        onChange={(event) => handleDateChange(event.target.value)}
        onInput={(event) => handleDateChange(event.currentTarget.value)}
      />

      <div>
        <span className="text-sm font-medium text-ink-700 dark:text-ink-300">Horário</span>
        <div className="mt-2">
          {slotsError && <ErrorState onRetry={() => setSlotsAttempt((n) => n + 1)} />}
          {!slotsError && !availability && <LoadingState label="Buscando horários…" />}
          {!slotsError && availability && availability.slots.length === 0 && (
            <p className="rounded-md border border-dashed border-ink-300 px-3 py-4 text-center text-sm text-ink-500 dark:border-ink-700 dark:text-ink-400">
              Sem horários livres nesse dia.
            </p>
          )}
          {!slotsError && availability && availability.slots.length > 0 && (
            <div className="flex flex-col gap-3">
              {groupSlotsByPeriod(availability.slots, availability.timeZoneId).map((group) => (
                <div key={group.label}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">{group.label}</p>
                  <div className="mt-1.5 grid grid-cols-3 gap-1.5 sm:grid-cols-4">
                    {group.slots.map(({ slot, time }) => (
                      <button
                        key={slot.startUtc}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={[
                          "rounded-md border px-2 py-2 text-sm font-medium tabular-nums transition-colors",
                          selectedSlot?.startUtc === slot.startUtc
                            ? "border-brass-500 bg-brass-200/40 text-ink-900 dark:bg-brass-500/10 dark:text-ink-100"
                            : "border-ink-200 bg-white/60 text-ink-700 hover:border-ink-400 dark:border-ink-800 dark:bg-ink-900/60 dark:text-ink-300 dark:hover:border-ink-600",
                        ].join(" ")}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Field
        label="Nome do cliente"
        required
        minLength={2}
        error={clientNameError ?? undefined}
        value={clientName}
        onChange={(event) => {
          setClientName(event.target.value)
          if (clientNameError) setClientNameError(null)
        }}
        placeholder="Nome de quem chegou"
      />
      <Field
        label="Telefone (opcional)"
        type="tel"
        value={clientPhone}
        onChange={(event) => setClientPhone(event.target.value)}
        placeholder="(11) 99999-9999"
      />

      {error && (
        <p role="alert" className="text-sm font-medium text-error-600 dark:text-error-400">
          {error}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting || !selectedSlot}>
        {isSubmitting ? "Criando…" : "Criar encaixe"}
      </Button>
    </form>
  )
}
