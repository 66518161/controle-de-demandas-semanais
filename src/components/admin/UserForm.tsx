import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppStore } from '@/stores/use-app-store'
import { User, Role } from '@/lib/types'
import { toast } from '@/hooks/use-toast'

interface UserFormProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'analyst', label: 'Analista' },
  { value: 'manager', label: 'Gerente' },
  { value: 'director', label: 'Diretor' },
]

export function UserForm({ user, open, onOpenChange }: UserFormProps) {
  const { addUser, updateUser, users } = useAppStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [microsoftId, setMicrosoftId] = useState('')
  const [role, setRole] = useState<Role>('analyst')
  const [managerId, setManagerId] = useState('')

  useEffect(() => {
    if (user) {
      setName(user.name)
      setEmail(user.email)
      setMicrosoftId(user.microsoftId || '')
      setRole(user.role)
      setManagerId(user.managerId || '')
    } else {
      setName('')
      setEmail('')
      setMicrosoftId('')
      setRole('analyst')
      setManagerId('')
    }
  }, [user, open])

  const possibleManagers = users.filter((u) => u.role === 'manager' || u.role === 'director')

  const handleSubmit = () => {
    if (!name.trim() || !email.trim()) {
      toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' })
      return
    }
    const userData = {
      name: name.trim(),
      email: email.trim(),
      password: '123456',
      role,
      microsoftId: microsoftId.trim() || undefined,
      managerId: managerId || undefined,
      avatarUrl: `https://img.usecurling.com/ppl/thumbnail?seed=${Date.now()}`,
    }
    if (user) {
      updateUser(user.id, userData)
      toast({ title: 'Usuário atualizado com sucesso!' })
    } else {
      addUser(userData)
      toast({ title: 'Usuário criado com sucesso!' })
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{user ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
          <DialogDescription>
            {user
              ? 'Atualize os dados do usuário.'
              : 'Preencha os dados para criar um novo usuário.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome completo"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@empresa.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="microsoftId">Microsoft ID</Label>
            <Input
              id="microsoftId"
              value={microsoftId}
              onChange={(e) => setMicrosoftId(e.target.value)}
              placeholder="Opcional"
            />
          </div>
          <div className="space-y-2">
            <Label>Cargo (Role) *</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {role !== 'director' && (
            <div className="space-y-2">
              <Label>Superior (Gestor/Diretor)</Label>
              <Select value={managerId} onValueChange={setManagerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  {possibleManagers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleSubmit}>
              {user ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
