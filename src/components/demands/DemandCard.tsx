import { Demand } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/use-app-store'

const statusConfig = {
  todo: {
    label: 'A Fazer',
    color: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  },
  'in-progress': {
    label: 'Em Progresso',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  },
  done: {
    label: 'Concluído',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  },
  blocked: {
    label: 'Bloqueado',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
  },
}

const priorityConfig = {
  low: { label: 'Baixa', color: 'text-slate-500' },
  medium: { label: 'Média', color: 'text-orange-500' },
  high: { label: 'Alta', color: 'text-red-500' },
}

export function DemandCard({ demand, onClick }: { demand: Demand; onClick?: () => void }) {
  const { users } = useAppStore()
  const assignee = users.find((u) => u.id === demand.assigneeId)

  return (
    <Card
      className="p-4 cursor-pointer hover:shadow-md transition-all hover:border-primary/50 group"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <Badge
          className={cn('font-medium', statusConfig[demand.status].color)}
          variant="secondary"
          disableAnimation
        >
          {statusConfig[demand.status].label}
        </Badge>
        {demand.priority === 'high' && <AlertCircle className="w-4 h-4 text-red-500" />}
      </div>

      <h4 className="font-semibold text-base line-clamp-2 mb-1 group-hover:text-primary transition-colors">
        {demand.title}
      </h4>
      <p className="text-xs text-muted-foreground line-clamp-1 mb-4">{demand.description}</p>

      <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
        <div className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          {new Date(demand.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
        </div>
        <div className="flex items-center gap-2">
          <span className={cn('font-medium', priorityConfig[demand.priority].color)}>
            {priorityConfig[demand.priority].label}
          </span>
          {assignee && (
            <img
              src={assignee.avatarUrl}
              alt={assignee.name}
              className="w-5 h-5 rounded-full border border-background"
            />
          )}
        </div>
      </div>
    </Card>
  )
}
