import { useMemo } from 'react'
import { Moon, Sun, Plus, Bell, LayoutDashboard, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAppStore } from '@/stores/use-app-store'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { AiTaskDialog } from '../ai-assistant/AiTaskDialog'
import { useNavigate } from 'react-router-dom'

export function Header() {
  const { 
    theme, 
    toggleTheme, 
    currentUser, 
    users, 
    setCurrentUser, 
    logout, 
    demands, 
    setSelectedDemand, 
    markCommentAsNotified 
  } = useAppStore()
  const navigate = useNavigate()

  const { currentWeek, currentMonthName } = useMemo(() => {
    const now = new Date()
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    const week = Math.ceil((((d as any) - (yearStart as any)) / 86400000 + 1) / 7)
    const monthName = now.toLocaleDateString('pt-BR', { month: 'long' })
    return {
      currentWeek: week,
      currentMonthName: monthName.charAt(0).toUpperCase() + monthName.slice(1),
    }
  }, [])

  const notifications = useMemo(() => {
    if (!currentUser) return []
    return demands.filter((d) => 
      d.assigneeId === currentUser.id && 
      d.comments && 
      d.comments.length > 0 && 
      d.comentarioNotificado === false
    )
  }, [demands, currentUser])

  const handleNotificationClick = async (demand: any) => {
    await markCommentAsNotified(demand.id)
    navigate('/demands')
    setSelectedDemand(demand)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-40 w-full glass h-16 flex items-center justify-between px-4 lg:px-8">
      <div className="flex items-center gap-2">
        <LayoutDashboard className="w-6 h-6 text-primary" />
        <span className="font-bold text-lg hidden sm:inline-block">DemandFlow</span>
        <div className="ml-4 px-3 py-1 bg-accent/50 text-accent-foreground text-xs font-semibold rounded-full hidden md:block">
          Semana {currentWeek} - {currentMonthName}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="hidden sm:flex gap-2 rounded-full shadow-subtle hover:scale-105 transition-transform"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Demanda AI</span>
            </Button>
          </DialogTrigger>
          <AiTaskDialog />
        </Dialog>

        {/* Sininho de Notificações */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative rounded-full hover:scale-105 transition-transform">
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-pulse shadow-sm">
                  {notifications.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80" align="end" forceMount>
            <DropdownMenuLabel className="font-semibold text-sm">
              Notificações de Feedback ({notifications.length})
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length > 0 ? (
              <div className="max-h-60 overflow-y-auto">
                {notifications.map((demand) => {
                  const lastComment = demand.comments && demand.comments.length > 0 
                    ? demand.comments[demand.comments.length - 1] 
                    : null;
                  return (
                    <DropdownMenuItem
                      key={demand.id}
                      onClick={() => handleNotificationClick(demand)}
                      className="flex flex-col items-start gap-1 p-3 cursor-pointer border-b last:border-b-0 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex justify-between w-full items-baseline">
                        <span className="font-semibold text-xs text-primary truncate max-w-[180px]">
                          {demand.title}
                        </span>
                        {lastComment && (
                          <span className="text-[9px] text-muted-foreground">
                            {new Date(lastComment.timestamp).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-medium line-clamp-1">
                        Novo feedback de {lastComment?.authorName || 'Superior'}:
                      </p>
                      <p className="text-xs italic text-foreground line-clamp-2 mt-0.5 bg-muted/30 p-1.5 rounded w-full border-l-2 border-primary/50">
                        "{lastComment?.text}"
                      </p>
                    </DropdownMenuItem>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-muted-foreground">
                Nenhuma notificação nova.
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2 py-1.5 h-auto rounded-lg hover:bg-accent/50">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={currentUser?.avatarUrl} alt={currentUser?.name} />
                <AvatarFallback>{currentUser?.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="text-left hidden md:flex flex-col max-w-[150px]">
                <span className="text-xs font-medium text-foreground truncate">{currentUser?.name}</span>
                <span className="text-[10px] text-muted-foreground truncate">{currentUser?.email}</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{currentUser?.name}</p>
                <p className="text-xs leading-none text-muted-foreground capitalize">
                  {currentUser?.role}
                </p>
              </div>
            </DropdownMenuLabel>
            {currentUser?.adm === true && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Alternar Usuário (Demo)</DropdownMenuLabel>
                {users.map((u) => (
                  <DropdownMenuItem key={u.id} onClick={() => setCurrentUser(u.id)}>
                    {u.name} ({u.role})
                  </DropdownMenuItem>
                ))}
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="w-4 h-4 mr-2" /> Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
