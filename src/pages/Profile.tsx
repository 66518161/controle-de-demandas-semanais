import { useAppStore } from '@/stores/use-app-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Settings, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Profile() {
  const { currentUser, logout } = useAppStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up">
      <h1 className="text-2xl font-bold tracking-tight mb-6">Perfil</h1>

      <Card className="overflow-hidden border-none shadow-elevation">
        <div className="h-32 bg-gradient-to-r from-primary to-secondary opacity-80" />
        <CardContent className="relative pt-0 px-6 pb-6">
          <div className="flex justify-between items-end -mt-12 mb-6">
            <Avatar className="w-24 h-24 border-4 border-card shadow-sm">
              <AvatarImage src={currentUser?.avatarUrl} />
              <AvatarFallback className="text-2xl">{currentUser?.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="w-4 h-4" /> Configurações
            </Button>
          </div>

          <div className="space-y-1 mb-8">
            <h2 className="text-2xl font-bold">{currentUser?.name}</h2>
            <p className="text-muted-foreground capitalize font-medium">{currentUser?.role}</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">Notificações por Email</p>
                <p className="text-sm text-muted-foreground">Receba resumos semanais.</p>
              </div>
              <div className="w-12 h-6 bg-primary/20 rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-4 h-4 bg-primary rounded-full shadow-sm" />
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-border flex justify-end">
            <Button
              variant="ghost"
              className="text-foreground hover:bg-muted"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" /> Sair da Conta
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
