import { useMemo } from 'react'
import { CheckCircle2, Clock, ListTodo, AlertOctagon } from 'lucide-react'
import { StatCard } from '@/components/dashboard/StatCard'
import { ProductivityChart } from '@/components/dashboard/ProductivityChart'
import { useAppStore } from '@/stores/use-app-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { STATUS_CONFIG } from '@/lib/status-config'
import { getSubordinateIds } from '@/lib/hierarchy'
import { cn } from '@/lib/utils'

export default function Index() {
  const { demands, currentUser, users } = useAppStore()

  const userDemands = useMemo(
    () => demands.filter((d) => d.assigneeId === currentUser?.id),
    [demands, currentUser],
  )

  const teamDemands = useMemo(() => {
    if (!currentUser) return []
    const subIds = getSubordinateIds(currentUser.id, users)
    return demands.filter((d) => subIds.includes(d.assigneeId))
  }, [demands, currentUser, users])

  const stats = {
    total: userDemands.length,
    emAndamento: userDemands.filter((d) => d.status === 'em-andamento').length,
    concluido: userDemands.filter((d) => d.status === 'concluido').length,
    aguardando: userDemands.filter((d) => d.status === 'aguardando').length,
  }

  const teamBlocked = teamDemands.filter((d) => d.status === 'aguardando')

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
          title="Em Andamento"
          value={stats.emAndamento}
          icon={Clock}
          className="animate-fade-in-up"
          style={{ animationDelay: '100ms' }}
        />
        <StatCard
          title="Concluídas"
          value={stats.concluido}
          icon={CheckCircle2}
          className="animate-fade-in-up"
          style={{ animationDelay: '200ms' }}
        />
        <StatCard
          title="Aguardando"
          value={stats.aguardando}
          icon={AlertOctagon}
          className="animate-fade-in-up border-danger/50"
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
              {teamBlocked.map((d) => {
                const config = STATUS_CONFIG[d.status]
                return (
                  <div key={d.id} className="flex flex-col space-y-1 p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium line-clamp-1">{d.title}</span>
                    <div className="flex justify-between items-center mt-2">
                      <Badge
                        variant="secondary"
                        className={cn('text-[10px] border', config.badgeClass)}
                      >
                        {config.emoji} {config.label}
                      </Badge>
                    </div>
                  </div>
                )
              })}
              {teamBlocked.length === 0 && (
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
