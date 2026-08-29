import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react"

export type Theme = "light" | "dark"

const STORAGE_KEY = "bb_theme"

function readStoredTheme(): Theme | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw === "light" || raw === "dark" ? raw : null
  } catch {
    return null
  }
}

function systemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme)
  const meta = document.querySelector('meta[name="theme-color"]:not([media])')
  const color = theme === "dark" ? "#16130f" : "#f8f3ea"
  if (meta) {
    meta.setAttribute("content", color)
  } else {
    const tag = document.createElement("meta")
    tag.setAttribute("name", "theme-color")
    tag.setAttribute("content", color)
    document.head.appendChild(tag)
  }
}

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => readStoredTheme() ?? systemTheme())

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    function handleChange(event: MediaQueryListEvent) {
      if (readStoredTheme()) return
      setTheme(event.matches ? "dark" : "light")
    }
    media.addEventListener("change", handleChange)
    return () => media.removeEventListener("change", handleChange)
  }, [])

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      toggleTheme() {
        setTheme((current) => {
          const next = current === "dark" ? "light" : "dark"
          try {
            localStorage.setItem(STORAGE_KEY, next)
          } catch {
            // Theme preference stays in memory for this session when storage is unavailable.
          }
          return next
        })
      },
    }),
    [theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme deve ser usado dentro de ThemeProvider")
  }
  return context
}
