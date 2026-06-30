import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Demand, Status } from '@/lib/types'
import { useAppStore } from '@/stores/use-app-store'
import { Badge } from '@/components/ui/badge'
import { Calendar, User, Clock, AlertTriangle } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { STATUS_CONFIG, STATUS_ORDER } from '@/lib/status-config'
import { cn } from '@/lib/utils'

interface DemandDrawerProps {
  demand: Demand | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DemandDrawer({ demand, open, onOpenChange }: DemandDrawerProps) {
  const { updateDemandStatus, users } = useAppStore()

  if (!demand) return null

  const assignee = users.find((u) => u.id === demand.assigneeId)
  const statusConfig = STATUS_CONFIG[demand.status]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline">{demand.priority.toUpperCase()}</Badge>
            <Badge
              variant="secondary"
              className={cn('hover:bg-transparent border', statusConfig.badgeClass)}
            >
              <span className="mr-1">{statusConfig.emoji}</span>
              {statusConfig.label}
            </Badge>
          </div>
          <SheetTitle className="text-xl">{demand.title}</SheetTitle>
          <SheetDescription className="text-base mt-4 whitespace-pre-wrap">
            {demand.description}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="p-2 bg-background rounded-md">
                <Calendar className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Prazo</p>
                <p className="text-sm font-medium">
                  {new Date(demand.dueDate).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="p-2 bg-background rounded-md">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Responsável</p>
                <p className="text-sm font-medium line-clamp-1">{assignee?.name}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2 border-t pt-4">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4" /> Atualizar Status
            </h4>
            <Select
              value={demand.status}
              onValueChange={(val: Status) => updateDemandStatus(demand.id, val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_ORDER.map((status) => (
                  <SelectItem key={status} value={status}>
                    {STATUS_CONFIG[status].emoji} {STATUS_CONFIG[status].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {demand.status === 'aguardando' && (
            <div className="bg-danger/10 text-danger-foreground p-3 rounded-lg flex gap-3 items-start">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-danger" />
              <p className="text-sm">
                Esta demanda está aguardando. Entre em contato com seu gestor se precisar de ajuda.
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
