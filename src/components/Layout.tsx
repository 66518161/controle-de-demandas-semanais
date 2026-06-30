import { Outlet, useLocation, Navigate } from 'react-router-dom'
import { Header } from './layout/Header'
import { Navigation } from './layout/Navigation'
import { useAppStore } from '@/stores/use-app-store'
import { AiTaskDialog } from './ai-assistant/AiTaskDialog'
import { Dialog } from './ui/dialog'

export default function Layout() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const location = useLocation()

  if (!isAuthenticated) return <Navigate to="/login" replace />

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-background text-foreground transition-colors duration-300">
      <Header />
      <div className="flex flex-1 flex-col md:flex-row overflow-hidden relative">
        <Navigation />
        <main className="flex-1 min-h-0 overflow-y-auto p-4 lg:p-8 pb-24 md:pb-8 animate-fade-in">
          <Outlet key={location.pathname} />
        </main>
        <Navigation isMobile />
      </div>

      <div className="md:hidden fixed bottom-20 right-4 z-40">
        <Dialog>
          <AiTaskDialog isMobileFab />
        </Dialog>
      </div>
    </div>
  )
}
