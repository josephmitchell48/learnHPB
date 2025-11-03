import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type ThemePreference = 'system' | 'light' | 'dark'
type ResolvedTheme = 'light' | 'dark'

type ThemeContextValue = {
  preference: ThemePreference
  setPreference: (value: ThemePreference) => void
  theme: ResolvedTheme
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

const getSystemTheme = (): ResolvedTheme => {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return 'light'
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

type ThemeProviderProps = {
  initialPreference?: ThemePreference
  children: ReactNode
}

export const ThemeProvider = ({
  initialPreference = 'system',
  children,
}: ThemeProviderProps) => {
  const [preference, setPreference] = useState<ThemePreference>(initialPreference)
  const [theme, setTheme] = useState<ResolvedTheme>(() => {
    if (initialPreference === 'system') {
      return getSystemTheme()
    }
    return initialPreference
  })

  useEffect(() => {
    if (preference === 'system') {
      const updateTheme = () => setTheme(getSystemTheme())
      const media = window.matchMedia('(prefers-color-scheme: dark)')
      updateTheme()
      media.addEventListener('change', updateTheme)
      return () => media.removeEventListener('change', updateTheme)
    }

    setTheme(preference)
    return undefined
  }, [preference])

  useEffect(() => {
    document.body.classList.toggle('theme-dark', theme === 'dark')
  }, [theme])

  const value = useMemo(
    () => ({
      preference,
      setPreference,
      theme,
    }),
    [preference, theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
