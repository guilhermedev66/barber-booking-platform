import { type ButtonHTMLAttributes, forwardRef } from "react"

export type ButtonVariant = "primary" | "secondary" | "ghost"
export type ButtonSize = "md" | "lg"

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-brass-600 text-ink-50 hover:bg-brass-500 disabled:bg-ink-300 disabled:text-ink-50",
  secondary:
    "border border-ink-300 bg-transparent text-ink-900 hover:border-ink-500 hover:bg-ink-100 disabled:border-ink-200 disabled:text-ink-400",
  ghost: "text-ink-700 hover:bg-ink-100 disabled:text-ink-300",
}

const sizeClasses: Record<ButtonSize, string> = {
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-3 text-base",
}

export function buttonClassName(variant: ButtonVariant = "primary", size: ButtonSize = "md", className = "") {
  return [
    "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:cursor-not-allowed",
    variantClasses[variant],
    sizeClasses[size],
    className,
  ].join(" ")
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className = "", ...props },
  ref,
) {
  return <button ref={ref} className={buttonClassName(variant, size, className)} {...props} />
})
