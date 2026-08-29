import { type InputHTMLAttributes, forwardRef, useId } from "react"

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, error, hint, id, className = "", ...props },
  ref,
) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const hintId = hint ? `${inputId}-hint` : undefined
  const errorId = error ? `${inputId}-error` : undefined

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-ink-700 dark:text-ink-300">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
        aria-invalid={Boolean(error)}
        className={[
          "rounded-md border bg-ink-50 px-3 py-2.5 text-ink-900 outline-none transition-colors placeholder:text-ink-400 dark:bg-ink-900 dark:text-ink-100 dark:placeholder:text-ink-400",
          error ? "border-error-600 dark:border-error-500" : "border-ink-300 focus:border-brass-500 dark:border-ink-700 dark:focus:border-brass-400",
          className,
        ].join(" ")}
        {...props}
      />
      {hint && !error && (
        <p id={hintId} className="text-xs text-ink-500 dark:text-ink-400">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs font-medium text-error-600 dark:text-error-400">
          {error}
        </p>
      )}
    </div>
  )
})
