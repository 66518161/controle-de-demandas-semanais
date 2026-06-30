import { Moon, Sun, Plus, Bell, LayoutDashboard } from 'lucide-react'
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

export function Header() {
  const { theme, toggleTheme, currentUser, users, setCurrentUser } = useAppStore()

  return (
    <header className="sticky top-0 z-40 w-full glass h-16 flex items-center justify-between px-4 lg:px-8">
      <div className="flex items-center gap-2">
        <LayoutDashboard className="w-6 h-6 text-primary" />
        <span className="font-bold text-lg hidden sm:inline-block">DemandFlow</span>
        <div className="ml-4 px-3 py-1 bg-accent/50 text-accent-foreground text-xs font-semibold rounded-full hidden md:block">
          Semana 42 - Outubro
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

        <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={currentUser?.avatarUrl} alt={currentUser?.name} />
                <AvatarFallback>{currentUser?.name.charAt(0)}</AvatarFallback>
              </Avatar>
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
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Alternar Usuário (Demo)</DropdownMenuLabel>
            {users.map((u) => (
              <DropdownMenuItem key={u.id} onClick={() => setCurrentUser(u.id)}>
                {u.name} ({u.role})
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
