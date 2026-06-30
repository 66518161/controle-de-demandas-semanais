import { CheckCircle2, Clock, ListTodo, AlertOctagon } from 'lucide-react'
import { StatCard } from '@/components/dashboard/StatCard'
import { ProductivityChart } from '@/components/dashboard/ProductivityChart'
import { useAppStore } from '@/stores/use-app-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function Index() {
  const { demands, currentUser } = useAppStore()

  const userDemands = demands.filter((d) => d.assigneeId === currentUser?.id)
  const teamDemands = demands.filter((d) => d.assigneeId !== currentUser?.id) // Simplified for demo

  const stats = {
    total: userDemands.length,
    inProgress: userDemands.filter((d) => d.status === 'in-progress').length,
    done: userDemands.filter((d) => d.status === 'done').length,
    blocked: userDemands.filter((d) => d.status === 'blocked').length,
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Olá, {currentUser?.name.split(' ')[0]} 👋
        </h1>
        <p className="text-muted-foreground">Aqui está o resumo da sua semana.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total"
          value={stats.total}
          icon={ListTodo}
          className="animate-fade-in-up"
          style={{ animationDelay: '0ms' }}
        />
        <StatCard
          title="Em Progresso"
          value={stats.inProgress}
          icon={Clock}
          className="animate-fade-in-up"
          style={{ animationDelay: '100ms' }}
        />
        <StatCard
          title="Concluídas"
          value={stats.done}
          icon={CheckCircle2}
          className="animate-fade-in-up"
          style={{ animationDelay: '200ms' }}
        />
        <StatCard
          title="Bloqueadas"
          value={stats.blocked}
          icon={AlertOctagon}
          className="animate-fade-in-up border-destructive/50"
          style={{ animationDelay: '300ms' }}
        />
      </div>

      <div
        className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fade-in-up"
        style={{ animationDelay: '400ms' }}
      >
        <ProductivityChart />

        {(currentUser?.role === 'manager' || currentUser?.role === 'director') && (
          <Card className="col-span-full lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Atenção da Equipe</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {teamDemands
                .filter((d) => d.status === 'blocked')
                .map((d) => (
                  <div key={d.id} className="flex flex-col space-y-1 p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium line-clamp-1">{d.title}</span>
                    <div className="flex justify-between items-center mt-2">
                      <Badge variant="destructive" className="text-[10px]">
                        Bloqueado
                      </Badge>
                    </div>
                  </div>
                ))}
              {teamDemands.filter((d) => d.status === 'blocked').length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum bloqueio na equipe.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
