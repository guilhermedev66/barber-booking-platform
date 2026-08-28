import { useEffect, useMemo, useState } from "react"
import { Button } from "../components/ui/Button"
import { ErrorState, LoadingState } from "../components/ui/Feedback"
import { LinkButton } from "../components/ui/LinkButton"
import { StatusBadge } from "../components/ui/StatusBadge"
import { Stepper } from "../features/booking/Stepper"
import { mockApi } from "../lib/api/mockApi"
import type { Appointment, AvailabilitySlot, Barber, Service } from "../lib/api/types"
import {
  addLocalDays,
  BOOKING_TIME_ZONE,
  formatDateLabel,
  formatUtcDateLong,
  formatUtcTime,
  formatDuration,
  formatPrice,
  localDateIso,
} from "../lib/format"

const PERIODS = [
  { label: "Manhã", from: 0, to: 12 },
  { label: "Tarde", from: 12, to: 18 },
  { label: "Noite", from: 18, to: 24 },
]

function groupSlotsByPeriod(slots: AvailabilitySlot[], timeZoneId: string) {
  return PERIODS.map((period) => ({
    label: period.label,
    slots: slots.filter((slot) => {
      const time = formatUtcTime(slot.startUtc, timeZoneId)
      const hour = Number(time.slice(0, 2))
      return hour >= period.from && hour < period.to
    }).map((slot) => ({ slot, time: formatUtcTime(slot.startUtc, timeZoneId) })),
  })).filter((group) => group.slots.length > 0)
}

function useUpcomingDates(count = 7) {
  return useMemo(() => {
    return Array.from({ length: count }, (_, index) => {
      return addLocalDays(localDateIso(), index)
    })
  }, [count])
}

export function BookPage() {
  const [step, setStep] = useState(0)

  const [services, setServices] = useState<Service[] | null>(null)
  const [barbers, setBarbers] = useState<Barber[] | null>(null)
  const [catalogError, setCatalogError] = useState(false)
  const [catalogAttempt, setCatalogAttempt] = useState(0)

  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null)
  const [isSelectingFirstBarber, setIsSelectingFirstBarber] = useState(false)

  const dates = useUpcomingDates()
  const [selectedDate, setSelectedDate] = useState(dates[0])
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null)
  const [availability, setAvailability] = useState<{
    timeZoneId: string
    slots: AvailabilitySlot[]
  } | null>(null)
  const [slotsError, setSlotsError] = useState(false)
  const [slotsAttempt, setSlotsAttempt] = useState(0)

  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null)
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)

  useEffect(() => {
    let cancelled = false
    setServices(null)
    setBarbers(null)
    setCatalogError(false)
    Promise.all([mockApi.listServices(), mockApi.listBarbers()])
      .then(([serviceList, barberList]) => {
        if (cancelled) return
        setServices(serviceList)
        setBarbers(barberList)
      })
      .catch(() => {
        if (!cancelled) setCatalogError(true)
      })
    return () => {
      cancelled = true
    }
  }, [catalogAttempt])

  useEffect(() => {
    if (step !== 2 || !selectedBarber || !selectedService) return
    let cancelled = false
    setAvailability(null)
    setSlotsError(false)
    setSelectedSlot(null)
    mockApi
      .getAvailability(selectedBarber.id, selectedDate, selectedService.id)
      .then((response) => {
        if (!cancelled) setAvailability(response)
      })
      .catch(() => {
        if (!cancelled) setSlotsError(true)
      })
    return () => {
      cancelled = true
    }
  }, [step, selectedBarber, selectedService, selectedDate, slotsAttempt])

  async function handleFirstAvailable() {
    if (!services || !barbers || !selectedService) return

    setIsSelectingFirstBarber(true)
    try {
      for (const date of dates) {
        const availabilities = await Promise.all(
          barbers.map((barber) => mockApi.getAvailability(barber.id, date, selectedService.id)),
        )
        const first = availabilities
          .map((item, index) => ({ barber: barbers[index], availability: item }))
          .filter((item) => item.availability.slots.length > 0)
          .sort((a, b) => a.availability.slots[0].startUtc.localeCompare(b.availability.slots[0].startUtc))[0]

        if (first) {
          setSelectedBarber(first.barber)
          setSelectedDate(date)
          setStep(2)
          return
        }
      }
    } finally {
      setIsSelectingFirstBarber(false)
    }
  }

  async function handleConfirm() {
    if (!selectedService || !selectedBarber || !selectedSlot) return
    setIsConfirming(true)
    setConfirmError(null)
    try {
      const appointment = await mockApi.createAppointment({
        serviceId: selectedService.id,
        barberId: selectedBarber.id,
        startUtc: selectedSlot.startUtc,
      })
      setConfirmedAppointment(appointment)
    } catch {
      setConfirmError("Não foi possível confirmar o agendamento. Tente novamente.")
    } finally {
      setIsConfirming(false)
    }
  }

  function resetBooking() {
    setStep(0)
    setSelectedService(null)
    setSelectedBarber(null)
    setSelectedSlot(null)
    setAvailability(null)
    setConfirmedAppointment(null)
    setConfirmError(null)
  }

  if (confirmedAppointment) {
    return (
      <section className="mx-auto max-w-md py-10 text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brass-600">Tudo certo</span>
        <h1 className="mt-3 font-heading text-3xl font-semibold text-ink-950">Agendamento confirmado</h1>
        <div className="mt-6 flex flex-col items-center gap-3 rounded-lg border border-ink-200 bg-white/60 p-6 text-left">
          <div className="flex w-full items-center justify-between">
            <p className="font-heading text-lg font-semibold text-ink-900">{confirmedAppointment.serviceName}</p>
            <StatusBadge status={confirmedAppointment.status} />
          </div>
          <p className="text-sm text-ink-500">com {confirmedAppointment.barberName}</p>
          <p className="text-sm text-ink-700">
            {formatUtcDateLong(confirmedAppointment.startUtc)} às{" "}
            <span className="tabular-nums">{formatUtcTime(confirmedAppointment.startUtc)}</span>
          </p>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <LinkButton to="/dashboard" variant="secondary">
            Ver painel
          </LinkButton>
          <Button onClick={resetBooking}>Agendar outro horário</Button>
        </div>
      </section>
    )
  }

  return (
    <section className={step === 3 ? "pb-28 sm:pb-8" : "pb-8"}>
      <h1 className="font-heading text-2xl font-semibold text-ink-950 sm:text-3xl">Agendar horário</h1>
      <p className="mt-1 text-sm text-ink-500">Escolha o serviço, o barbeiro e o melhor horário para você.</p>

      <div className="mt-8">
        <Stepper current={step} />
      </div>

      <div className="mt-8">
        {catalogError && <ErrorState onRetry={() => setCatalogAttempt((n) => n + 1)} />}

        {!catalogError && !services && <LoadingState label="Carregando serviços…" />}

        {!catalogError && services && barbers && step === 0 && (
          <ul className="divide-y divide-ink-200 rounded-lg border border-ink-200 bg-white/60">
            {services.map((service) => (
              <li key={service.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedService(service)
                    setStep(1)
                  }}
                  className={[
                    "flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors sm:px-5",
                    selectedService?.id === service.id ? "bg-brass-200/30" : "hover:bg-ink-100",
                  ].join(" ")}
                >
                  <div>
                    <p className="font-heading text-lg font-semibold text-ink-900">{service.name}</p>
                    <p className="mt-1.5 text-xs font-medium uppercase tracking-wide text-ink-500 tabular-nums">
                      {formatDuration(service.durationMinutes)}
                    </p>
                  </div>
                  <span className="shrink-0 font-heading text-lg font-semibold text-brass-700 tabular-nums">
                    {formatPrice(service.price)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {!catalogError && services && barbers && step === 1 && (
          <div>
            <button
              type="button"
              onClick={handleFirstAvailable}
              disabled={isSelectingFirstBarber}
              className="mb-3 flex w-full items-center justify-between rounded-lg border border-dashed border-brass-500 bg-brass-200/20 px-4 py-3.5 text-left transition-colors hover:bg-brass-200/40"
            >
              <span>
                <span className="block font-heading text-base font-semibold text-ink-900">
                  {isSelectingFirstBarber ? "Procurando primeiro horário livre…" : "Primeiro barbeiro disponível"}
                </span>
                <span className="text-sm text-ink-500">Mais rápido — vemos quem tem o próximo horário livre.</span>
              </span>
              <span className="shrink-0 text-sm font-semibold text-brass-700">Escolher</span>
            </button>

            <div className="grid gap-3 sm:grid-cols-3">
              {barbers.map((barber) => (
                <button
                  key={barber.id}
                  type="button"
                  onClick={() => {
                    setSelectedBarber(barber)
                    setStep(2)
                  }}
                  className={[
                    "flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors",
                    selectedBarber?.id === barber.id
                      ? "border-brass-500 bg-brass-200/40"
                      : "border-ink-200 bg-white/60 hover:border-ink-400",
                  ].join(" ")}
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink-950 font-heading text-sm font-semibold text-brass-300">
                    {barber.displayName.split(" ").map((name) => name[0]).join("").slice(0, 2)}
                  </span>
                  <span className="font-heading text-base font-semibold text-ink-900">{barber.displayName}</span>
                  <span className="text-xs font-medium uppercase tracking-wide text-brass-600">Barbeiro</span>
                  <span className="text-sm text-ink-500">{barber.bio}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setStep(0)}
              className="mt-6 text-sm font-medium text-ink-600 underline underline-offset-4 hover:text-ink-900"
            >
              Voltar para serviços
            </button>
          </div>
        )}

        {!catalogError && services && barbers && step === 2 && selectedBarber && (
          <div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {dates.map((date) => (
                <button
                  key={date}
                  type="button"
                  onClick={() => setSelectedDate(date)}
                  className={[
                    "shrink-0 rounded-md border px-3.5 py-2.5 text-sm font-medium capitalize transition-colors",
                    selectedDate === date
                      ? "border-ink-950 bg-ink-950 text-brass-300"
                      : "border-ink-200 bg-white/60 text-ink-700 hover:border-ink-400",
                  ].join(" ")}
                >
                  {formatDateLabel(date)}
                </button>
              ))}
            </div>

            <div className="mt-6">
              {slotsError && <ErrorState onRetry={() => setSlotsAttempt((n) => n + 1)} />}
              {!slotsError && !availability && <LoadingState label="Buscando horários disponíveis…" />}
              {!slotsError && availability && availability.slots.length === 0 && (
                <div className="rounded-lg border border-dashed border-ink-300 py-10 text-center">
                  <p className="font-heading text-lg font-semibold text-ink-800">Sem horários neste dia</p>
                  <p className="mt-1 text-sm text-ink-500">Escolha outra data para ver a agenda de {selectedBarber.displayName}.</p>
                </div>
              )}
              {!slotsError && availability && availability.slots.length > 0 && (
                <div className="flex flex-col gap-6">
                  {groupSlotsByPeriod(availability.slots, availability.timeZoneId).map((group) => (
                    <div key={group.label}>
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">{group.label}</p>
                      <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                        {group.slots.map(({ slot, time }) => (
                          <button
                            key={slot.startUtc}
                            type="button"
                            onClick={() => {
                              setSelectedSlot(slot)
                              setStep(3)
                            }}
                            className={[
                              "rounded-md border px-3 py-2.5 text-sm font-medium tabular-nums transition-colors",
                              selectedSlot?.startUtc === slot.startUtc
                                ? "border-brass-500 bg-brass-200/40 text-ink-900"
                                : "border-ink-200 bg-white/60 text-ink-700 hover:border-ink-400",
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

            <button
              type="button"
              onClick={() => setStep(1)}
              className="mt-6 text-sm font-medium text-ink-600 underline underline-offset-4 hover:text-ink-900"
            >
              Voltar para barbeiros
            </button>
          </div>
        )}

        {!catalogError && services && barbers && step === 3 && selectedService && selectedBarber && selectedSlot && (
          <div className="mx-auto max-w-md">
            <div className="flex flex-col gap-4 rounded-lg border border-ink-200 bg-white/60 p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">Serviço</span>
                <span className="text-right font-medium text-ink-900">{selectedService.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">Barbeiro</span>
                <span className="text-right font-medium text-ink-900">{selectedBarber.displayName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">Quando</span>
                <span className="text-right font-medium capitalize text-ink-900">
                  {formatDateLabel(selectedDate)}, <span className="tabular-nums">{formatUtcTime(selectedSlot.startUtc, availability?.timeZoneId ?? BOOKING_TIME_ZONE)}</span>
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-ink-200 pt-4">
                <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">Total</span>
                <span className="text-right font-heading text-lg font-semibold text-brass-700 tabular-nums">
                  {formatPrice(selectedService.price)}
                </span>
              </div>
            </div>

            {confirmError && (
              <p role="alert" className="mt-4 text-sm font-medium text-error-600">
                {confirmError}
              </p>
            )}

            <div className="mt-6 hidden gap-3 sm:flex sm:flex-row-reverse">
              <Button size="lg" onClick={handleConfirm} disabled={isConfirming} className="sm:w-auto">
                {isConfirming ? "Confirmando…" : "Confirmar agendamento"}
              </Button>
              <Button variant="secondary" onClick={() => setStep(2)} disabled={isConfirming} className="sm:w-auto">
                Voltar
              </Button>
            </div>

            <div className="fixed inset-x-0 bottom-0 z-40 flex gap-3 border-t border-ink-200 bg-ink-50 px-4 py-3 sm:hidden">
              <Button
                variant="secondary"
                onClick={() => setStep(2)}
                disabled={isConfirming}
                className="basis-1/3"
              >
                Voltar
              </Button>
              <Button size="lg" onClick={handleConfirm} disabled={isConfirming} className="flex-1">
                {isConfirming ? "Confirmando…" : "Confirmar agendamento"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
