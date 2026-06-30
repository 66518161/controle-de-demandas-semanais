import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './layout/Header'
import { Navigation } from './layout/Navigation'
import { useAppStore } from '@/stores/use-app-store'
import { AiTaskDialog } from './ai-assistant/AiTaskDialog'
import { Dialog } from './ui/dialog'

export default function Layout() {
  const { theme } = useAppStore()
  const location = useLocation()

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
  }, [theme])

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      <Header />
      <div className="flex flex-1 flex-col md:flex-row overflow-hidden relative">
        <Navigation />
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 pb-24 md:pb-8 animate-fade-in">
          <Outlet key={location.pathname} />
        </main>
        <Navigation isMobile />
      </div>

      {/* Mobile Floating Action Button */}
      <div className="md:hidden fixed bottom-20 right-4 z-40">
        <Dialog>
          <AiTaskDialog isMobileFab />
        </Dialog>
      </div>
    </div>
  )
}
