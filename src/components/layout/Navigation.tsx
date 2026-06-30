import { Link, useLocation } from 'react-router-dom'
import { Home, ListTodo, Users, UserCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/use-app-store'

export function Navigation({ isMobile = false }: { isMobile?: boolean }) {
  const location = useLocation()
  const { currentUser } = useAppStore()

  const navItems = [
    { name: 'Painel', href: '/', icon: Home, visible: true },
    { name: 'Minhas Demandas', href: '/demands', icon: ListTodo, visible: true },
    { name: 'Equipe', href: '/team', icon: Users, visible: currentUser?.role !== 'analyst' },
    { name: 'Perfil', href: '/profile', icon: UserCircle, visible: true },
  ]

  const visibleItems = navItems.filter((item) => item.visible)

  if (isMobile) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass h-16 flex items-center justify-around md:hidden border-t pb-safe">
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <item.icon className={cn('w-5 h-5', isActive && 'fill-primary/20')} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>
    )
  }

  return (
    <aside className="hidden md:flex flex-col w-64 border-r bg-card min-h-[calc(100vh-4rem)] p-4 transition-width duration-300">
      <div className="space-y-2">
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground hover:scale-[1.02]',
              )}
            >
              <item.icon className={cn('w-5 h-5', isActive && 'fill-primary/20')} />
              {item.name}
            </Link>
          )
        })}
      </div>
    </aside>
  )
}
