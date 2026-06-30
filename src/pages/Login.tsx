import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutDashboard, Mail, Lock, Loader2, Eye, EyeOff, Moon, Sun } from 'lucide-react'
import { useAppStore } from '@/stores/use-app-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'

export default function Login() {
  const navigate = useNavigate()
  const { login, microsoftLogin, theme, toggleTheme } = useAppStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleMicrosoftLogin = () => {
    setIsLoading(true)
    setTimeout(() => {
      const success = microsoftLogin()
      setIsLoading(false)
      if (success) {
        toast({ title: 'Bem-vindo!', description: 'Login com Microsoft realizado com sucesso.' })
        navigate('/')
      }
    }, 800)
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setTimeout(() => {
      const success = login(email, password)
      setIsLoading(false)
      if (success) {
        toast({ title: 'Bem-vindo!', description: 'Login realizado com sucesso.' })
        navigate('/')
      } else {
        toast({
          title: 'Erro de autenticação',
          description: 'Email ou senha inválidos.',
          variant: 'destructive',
        })
      }
    }, 800)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="absolute top-4 right-4 rounded-full"
      >
        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </Button>

      <div className="w-full max-w-md animate-fade-in-up">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <LayoutDashboard className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">DemandFlow</h1>
          <p className="text-sm text-muted-foreground mt-1">Controle de Demandas Semanais</p>
        </div>

        <Card className="shadow-elevation border-border">
          <CardHeader>
            <CardTitle className="text-xl">Entrar</CardTitle>
            <CardDescription>Acesse sua conta para gerenciar demandas</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleMicrosoftLogin}
              disabled={isLoading}
            >
              <svg className="w-5 h-5" viewBox="0 0 23 23" fill="none">
                <path d="M1 1h10v10H1z" fill="#f25022" />
                <path d="M12 1h10v10H12z" fill="#7fba00" />
                <path d="M1 12h10v10H1z" fill="#00a4ef" />
                <path d="M12 12h10v10H12z" fill="#ffb900" />
              </svg>
              Entrar com Microsoft
            </Button>

            <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                Contas de demonstração:
              </p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>👩‍💼 Diretora: ana@demandflow.com</p>
                <p>👨‍💼 Gerente: carlos@demandflow.com</p>
                <p>👩‍💻 Analista: beatriz@demandflow.com</p>
                <p className="text-muted-foreground/70 mt-1">Senha: 123456</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
