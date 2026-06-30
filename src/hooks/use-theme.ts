import { useEffect } from 'react'
import { useAppStore } from '@/stores/use-app-store'

export function useTheme() {
  const theme = useAppStore((s) => s.theme)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('demandflow-theme', theme)
  }, [theme])
}
