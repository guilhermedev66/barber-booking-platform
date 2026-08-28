import type { ComponentProps } from "react"
import { Link } from "react-router"
import { type ButtonSize, type ButtonVariant, buttonClassName } from "./Button"

interface LinkButtonProps extends ComponentProps<typeof Link> {
  variant?: ButtonVariant
  size?: ButtonSize
}

export function LinkButton({ variant = "primary", size = "md", className = "", ...props }: LinkButtonProps) {
  return <Link className={buttonClassName(variant, size, className)} {...props} />
}
