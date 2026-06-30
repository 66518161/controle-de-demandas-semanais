import { Status } from './types'

export interface StatusConfig {
  label: string
  emoji: string
  badgeClass: string
}

export const STATUS_CONFIG: Record<Status, StatusConfig> = {
  'nao-iniciado': {
    label: 'Não Iniciado',
    emoji: '⚪',
    badgeClass: 'bg-muted text-muted-foreground border-border',
  },
  'em-andamento': {
    label: 'Em Andamento',
    emoji: '🟡',
    badgeClass: 'bg-warning/15 text-warning-foreground border-warning/30',
  },
  aguardando: {
    label: 'Aguardando',
    emoji: '🔴',
    badgeClass: 'bg-danger/15 text-danger-foreground border-danger/30',
  },
  concluido: {
    label: 'Concluído',
    emoji: '🟢',
    badgeClass: 'bg-success/15 text-success-foreground border-success/30',
  },
  cancelado: {
    label: 'Cancelado',
    emoji: '⚫',
    badgeClass: 'bg-inactive/15 text-inactive-foreground border-inactive/30',
  },
}

export const STATUS_ORDER: Status[] = [
  'nao-iniciado',
  'em-andamento',
  'aguardando',
  'concluido',
  'cancelado',
]
