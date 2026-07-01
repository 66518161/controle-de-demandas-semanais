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
  const [isForgotMode, setIsForgotMode] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')

  const handleMicrosoftLogin = async () => {
    setIsLoading(true)
    try {
      const success = await microsoftLogin()
      if (success) {
        toast({ title: 'Bem-vindo!', description: 'Login com Microsoft realizado com sucesso.' })
        navigate('/')
      }
    } catch (err: any) {
      toast({
        title: 'Falha no login com Microsoft',
        description: err.message || 'Não foi possível autenticar sua conta.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    const success = await login(email, password)
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
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({
          title: 'Senha redefinida!',
          description: data.message || 'Uma nova senha temporária foi enviada para o seu e-mail.',
        })
        setIsForgotMode(false)
        setForgotEmail('')
      } else {
        toast({
          title: 'Erro na redefinição',
          description: data.error || 'Não foi possível redefinir sua senha.',
          variant: 'destructive',
        })
      }
    } catch (err: any) {
      toast({
        title: 'Erro de rede',
        description: 'Erro ao se conectar ao servidor.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-screen overflow-y-auto flex items-center justify-center bg-background p-4 relative">
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
            <CardTitle className="text-xl">
              {isForgotMode ? 'Recuperar Senha' : 'Entrar'}
            </CardTitle>
            <CardDescription>
              {isForgotMode
                ? 'Digite seu e-mail para receber uma senha temporária'
                : 'Acesse sua conta para gerenciar demandas'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isForgotMode ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="seu@email.com"
                      className="pl-10"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                        Redefinindo...
                      </>
                    ) : (
                      'Enviar Senha Temporária'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-xs text-muted-foreground hover:text-foreground mt-1"
                    onClick={() => {
                      setIsForgotMode(false)
                      setForgotEmail('')
                    }}
                  >
                    Voltar para o Login
                  </Button>
                </div>
              </form>
            ) : (
              <>
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
                    <div className="flex justify-between items-center">
                      <Label htmlFor="password">Senha</Label>
                      <button
                        type="button"
                        onClick={() => setIsForgotMode(true)}
                        className="text-xs text-primary hover:underline"
                      >
                        Esqueci minha senha
                      </button>
                    </div>
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
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
