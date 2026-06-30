import { useState } from 'react'
import { useAppStore } from '@/stores/use-app-store'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Link2, Unlink, ArrowRight } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { Role } from '@/lib/types'

const ROLE_LABELS: Record<Role, string> = {
  analyst: 'Analista',
  manager: 'Gerente',
  director: 'Diretor',
}

export function HierarchyManager() {
  const { users, updateUser } = useAppStore()
  const [subordinateId, setSubordinateId] = useState('')
  const [superiorId, setSuperiorId] = useState('')

  const superiors = users.filter((u) => u.role === 'manager' || u.role === 'director')
  const subordinates = users.filter((u) => u.role !== 'director')

  const handleLink = () => {
    if (!subordinateId || !superiorId) {
      toast({ title: 'Selecione ambos os campos', variant: 'destructive' })
      return
    }
    if (subordinateId === superiorId) {
      toast({ title: 'Usuário não pode ser superior de si mesmo', variant: 'destructive' })
      return
    }
    updateUser(subordinateId, { managerId: superiorId })
    toast({ title: 'Hierarquia atualizada!', description: 'Vínculo criado com sucesso.' })
    setSubordinateId('')
    setSuperiorId('')
  }

  const handleUnlink = (userId: string) => {
    updateUser(userId, { managerId: undefined })
    toast({ title: 'Vínculo removido.' })
  }

  const getManager = (id: string) => users.find((u) => u.id === id)
  const linkedUsers = users.filter((u) => u.managerId)

  return (
    <div className="space-y-6">
      <Card className="p-4 space-y-4">
        <h3 className="font-semibold text-sm">Criar Vínculo Hierárquico</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Colaborador (Subordinado)
            </label>
            <Select value={subordinateId} onValueChange={setSubordinateId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {subordinates.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Superior (Gestor/Diretor)
            </label>
            <Select value={superiorId} onValueChange={setSuperiorId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {superiors.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name} ({ROLE_LABELS[u.role]})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={handleLink} className="gap-2 w-full sm:w-auto">
          <Link2 className="w-4 h-4" /> Vincular
        </Button>
      </Card>

      <div className="space-y-2">
        <h3 className="font-semibold text-sm">Vínculos Atuais</h3>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {linkedUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center bg-muted/30 rounded-lg">
              Nenhum vínculo hierárquico definido.
            </p>
          ) : (
            linkedUsers.map((user) => {
              const manager = getManager(user.managerId!)
              return (
                <Card key={user.id} className="p-3 flex items-center gap-3">
                  <div className="flex-1 flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-medium">{user.name}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {ROLE_LABELS[user.role]}
                    </Badge>
                    <ArrowRight className="w-4 h-4 text-muted-foreground mx-1" />
                    <span className="text-muted-foreground">{manager?.name}</span>
                    {manager && (
                      <Badge variant="outline" className="text-[10px]">
                        {ROLE_LABELS[manager.role]}
                      </Badge>
                    )}
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => handleUnlink(user.id)}>
                    <Unlink className="w-4 h-4 text-destructive" />
                  </Button>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
