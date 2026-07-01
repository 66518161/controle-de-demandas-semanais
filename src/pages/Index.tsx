import { useAppStore } from '@/stores/use-app-store'
import { StatCard } from '@/components/dashboard/StatCard'
import { ProductivityChart } from '@/components/dashboard/ProductivityChart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { getDirectReports, getSubordinateIds } from '@/lib/hierarchy'
import { ListTodo, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Index() {
  const { currentUser, demands, users } = useAppStore()

  if (!currentUser) return null

  const isDirector = currentUser.role === 'director'
  const subordinates = getDirectReports(currentUser.id, users)
  const subordinateIds = getSubordinateIds(currentUser.id, users)
  const relevantDemands = isDirector
    ? demands.filter((d) => subordinateIds.includes(d.assigneeId))
    : demands.filter((d) => d.assigneeId === currentUser.id)

  const total = relevantDemands.length
  const completed = relevantDemands.filter((d) => d.status === 'concluido').length
  const inProgress = relevantDemands.filter((d) => d.status === 'em-andamento').length
  const blocked = relevantDemands.filter((d) => d.status === 'aguardando').length

  const roleLabels: Record<string, string> = {
    analyst: 'Analista',
    manager: 'Gerente',
    director: 'Diretor',
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Painel</h1>
        <p className="text-muted-foreground">
          {isDirector
            ? 'Visão geral global da equipe'
            : 'Bem-vindo de volta! Aqui está seu resumo.'}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={isDirector ? 'Total da Equipe' : 'Minhas Demandas'}
          value={total}
          icon={ListTodo}
        />
        <StatCard title="Concluídas" value={completed} icon={CheckCircle2} />
        <StatCard title="Em Andamento" value={inProgress} icon={Clock} />
        <StatCard title="Aguardando" value={blocked} icon={AlertCircle} />
      </div>

      <ProductivityChart />

      {subordinates.length > 0 && isDirector && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gerentes Supervisionados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-80 overflow-y-auto">
            {subordinates.map((user) => {
              const userDemands = demands.filter((d) => d.assigneeId === user.id)
              const done = userDemands.filter((d) => d.status === 'concluido').length
              const progress =
                userDemands.length === 0 ? 0 : Math.round((done / userDemands.length) * 100)
              return (
                <Link
                  key={user.id}
                  to="/team"
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={user.avatarUrl} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{roleLabels[user.role]}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-3 w-40">
                    <Progress value={progress} className="h-2" />
                    <Badge variant={progress === 100 ? 'default' : 'secondary'} className="text-xs">
                      {progress}%
                    </Badge>
                  </div>
                </Link>
              )
            })}
          </CardContent>
        </Card>
      )}

      {!isDirector && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Demandas Recentes</CardTitle>
          </CardHeader>
          <CardContent className="max-h-72 overflow-y-auto">
            {relevantDemands.slice(0, 5).map((demand) => (
              <Link
                key={demand.id}
                to="/demands"
                className="flex items-center justify-between py-2 border-b last:border-0 hover:bg-muted/30 -mx-2 px-2 rounded transition-colors"
              >
                <span className="text-sm font-medium line-clamp-1">{demand.title}</span>
                <Badge variant="secondary" className="text-xs ml-2 shrink-0">
                  {demand.status}
                </Badge>
              </Link>
            ))}
            {relevantDemands.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma demanda encontrada.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
