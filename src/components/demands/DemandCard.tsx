import { Demand } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/use-app-store'
import { STATUS_CONFIG } from '@/lib/status-config'

const priorityConfig = {
  low: { label: 'Baixa', color: 'text-slate-500' },
  medium: { label: 'Média', color: 'text-orange-500' },
  high: { label: 'Alta', color: 'text-red-500' },
}

/** Retorna o número da semana ISO da data fornecida */
function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d as any) - (yearStart as any)) / 86400000 + 1) / 7)
}

/** Retorna a semana e o ano a partir do campo do banco (prioritário) ou calcula via ISO */
function getWeekLabel(demand: Demand): string {
  // Prioriza os campos do banco de dados
  if (demand.week && demand.year) {
    return `Sem. ${demand.week}/${demand.year}`
  }
  // Fallback: calcula via data de criação
  try {
    const date = new Date(demand.createdAt)
    const week = getISOWeek(date)
    const year = date.getFullYear()
    return `Sem. ${week}/${year}`
  } catch {
    return ''
  }
}

export function DemandCard({ demand, onClick }: { demand: Demand; onClick?: () => void }) {
  const { users } = useAppStore()
  const assignee = users.find((u) => u.id === demand.assigneeId)
  const statusConfig = STATUS_CONFIG[demand.status]
  const weekLabel = getWeekLabel(demand)

  return (
    <Card
      className="p-4 cursor-pointer hover:shadow-md transition-all hover:border-primary/40 border-border/60 group"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex gap-1.5 flex-wrap">
          <Badge className={cn('font-medium border', statusConfig.badgeClass)} variant="secondary">
            <span className="mr-1">{statusConfig.emoji}</span>
            {statusConfig.label}
          </Badge>
          <Badge
            className={cn(
              'font-medium border text-[11px] px-2 py-0.5 rounded-full',
              demand.priority === 'high'
                ? 'bg-red-500/10 text-red-500 border-red-500/20'
                : demand.priority === 'medium'
                ? 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
            )}
            variant="secondary"
          >
            {priorityConfig[demand.priority].label}
          </Badge>
        </div>
        {demand.priority === 'high' && <AlertCircle className="w-4 h-4 text-red-500" />}
      </div>

      <h4 className="font-semibold text-base line-clamp-2 mb-1 group-hover:text-primary transition-colors">
        {demand.title}
      </h4>
      <p className="text-xs text-muted-foreground line-clamp-1 mb-3">{demand.description}</p>

      {/* Rótulo da semana de criação */}
      {weekLabel && (
        <div className="flex items-center gap-1 mb-3">
          <CalendarDays className="w-3 h-3 text-primary/70" />
          <span className="text-[11px] font-semibold text-primary/80 tracking-wide">{weekLabel}</span>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
        <div className="flex items-center gap-1">
          <CalendarDays className="w-3.5 h-3.5" />
          {new Date(demand.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
        </div>
        <div className="flex items-center gap-2">
          {assignee && (
            <img
              src={assignee.avatarUrl || '/usuario.png'}
              alt={assignee.name}
              className="w-5 h-5 rounded-full border border-background"
            />
          )}
        </div>
      </div>
    </Card>
  )
}
