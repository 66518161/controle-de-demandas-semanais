import { useState } from 'react'
import { useAppStore } from '@/stores/use-app-store'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UserForm } from '@/components/admin/UserForm'
import { HierarchyManager } from '@/components/admin/HierarchyManager'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, Users, Network } from 'lucide-react'
import { User, Role } from '@/lib/types'

const ROLE_LABELS: Record<Role, string> = {
  analyst: 'Analista',
  manager: 'Gerente',
  director: 'Diretor',
}
const ROLE_COLORS: Record<Role, string> = {
  analyst: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
  manager: 'bg-orange-500/15 text-orange-500 border-orange-500/30',
  director: 'bg-purple-500/15 text-purple-500 border-purple-500/30',
}

export default function Admin() {
  const { users, deleteUser, currentUser } = useAppStore()
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showForm, setShowForm] = useState(false)

  if (currentUser?.role !== 'director') {
    return (
      <div className="text-center py-12 text-muted-foreground">Acesso restrito a diretores.</div>
    )
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setShowForm(true)
  }

  const handleAdd = () => {
    setEditingUser(null)
    setShowForm(true)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Painel Administrativo</h1>
        <p className="text-muted-foreground">Gerencie usuários e hierarquias da equipe.</p>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">
            <Users className="w-4 h-4 mr-2" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="hierarchy">
            <Network className="w-4 h-4 mr-2" />
            Hierarquia
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={handleAdd} className="gap-2">
              <Plus className="w-4 h-4" /> Novo Usuário
            </Button>
          </div>
          <div className="space-y-2">
            {users.map((user) => (
              <Card key={user.id} className="p-4 flex items-center gap-4">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={user.avatarUrl} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  {user.microsoftId && (
                    <p className="text-[10px] text-muted-foreground/70">
                      MS ID: {user.microsoftId}
                    </p>
                  )}
                </div>
                <Badge className={ROLE_COLORS[user.role]} variant="secondary">
                  {ROLE_LABELS[user.role]}
                </Badge>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => handleEdit(user)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  {user.id !== currentUser?.id && (
                    <Button size="icon" variant="ghost" onClick={() => deleteUser(user.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="hierarchy" className="mt-4">
          <HierarchyManager />
        </TabsContent>
      </Tabs>

      <UserForm user={editingUser} open={showForm} onOpenChange={setShowForm} />
    </div>
  )
}
