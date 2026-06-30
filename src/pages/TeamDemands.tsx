import { useState, useMemo } from 'react'
import { useAppStore } from '@/stores/use-app-store'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { DemandCard } from '@/components/demands/DemandCard'
import { DemandDrawer } from '@/components/demands/DemandDrawer'
import { Demand } from '@/lib/types'
import { getDirectReports } from '@/lib/hierarchy'

export default function TeamDemands() {
  const { users, demands, currentUser } = useAppStore()
  const [selectedDemand, setSelectedDemand] = useState<Demand | null>(null)

  const visibleUsers = useMemo(() => {
    if (!currentUser) return []
    return getDirectReports(currentUser.id, users)
  }, [currentUser, users])

  if (currentUser?.role === 'analyst') {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Acesso restrito a gestores e diretores.
      </div>
    )
  }

  const getMetrics = (userId: string) => {
    const userDemands = demands.filter((d) => d.assigneeId === userId)
    const total = userDemands.length
    const done = userDemands.filter((d) => d.status === 'concluido').length
    const progress = total === 0 ? 0 : Math.round((done / total) * 100)
    return { total, done, progress, demands: userDemands }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Demandas da Equipe</h1>
        <p className="text-muted-foreground">Acompanhe a produtividade dos seus liderados.</p>
      </div>

      <Accordion type="multiple" className="space-y-4">
        {visibleUsers.map((user) => {
          const metrics = getMetrics(user.id)
          return (
            <AccordionItem
              key={user.id}
              value={user.id}
              className="border rounded-xl px-4 bg-card shadow-sm"
            >
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-4 w-full pr-4">
                  <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                    <AvatarImage src={user.avatarUrl} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-base">{user.name}</h3>
                    <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                  </div>
                  <div className="hidden sm:flex flex-col items-end w-32 gap-1">
                    <div className="flex justify-between w-full text-xs font-medium">
                      <span>Progresso</span>
                      <span>
                        {metrics.done}/{metrics.total}
                      </span>
                    </div>
                    <Progress value={metrics.progress} className="h-1.5" />
                  </div>
                  <Badge
                    variant={metrics.progress === 100 ? 'default' : 'secondary'}
                    className="hidden sm:inline-flex"
                  >
                    {metrics.progress}%
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                {metrics.demands.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    {metrics.demands.map((demand) => (
                      <DemandCard
                        key={demand.id}
                        demand={demand}
                        onClick={() => setSelectedDemand(demand)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center bg-muted/30 rounded-lg">
                    Nenhuma demanda atribuída.
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>

      <DemandDrawer
        demand={selectedDemand}
        open={!!selectedDemand}
        onOpenChange={(open) => !open && setSelectedDemand(null)}
      />
    </div>
  )
}
