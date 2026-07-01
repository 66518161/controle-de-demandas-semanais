import { useState, useMemo } from 'react'
import { useAppStore } from '@/stores/use-app-store'
import { DemandCard } from '@/components/demands/DemandCard'
import { DemandDrawer } from '@/components/demands/DemandDrawer'
import { Demand, Status } from '@/lib/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LayoutList, LayoutGrid, Search, X, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getSubordinateIds } from '@/lib/hierarchy'
import { STATUS_CONFIG } from '@/lib/status-config'
import { cn } from '@/lib/utils'

const COLUMNS = ['nao-iniciado', 'em-andamento', 'aguardando', 'concluido', 'cancelado'] as const
const COL_TITLES = {
  'nao-iniciado': 'Não Iniciado',
  'em-andamento': 'Em Andamento',
  aguardando: 'Aguardando',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
}

export default function MyDemands() {
  const { demands, currentUser, users, selectedDemand, setSelectedDemand } = useAppStore()
  const [view, setView] = useState<'list' | 'kanban'>('list')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 18

  // Estados dos filtros
  const [searchText, setSearchText] = useState('')
  const [filterStatus, setFilterStatus] = useState<Status | 'all'>('all')
  const [filterWeek, setFilterWeek] = useState<string>('all')
  const [filterUser, setFilterUser] = useState<string>('all')

  // Demandas visíveis = apenas as próprias demandas do usuário logado
  const baseDemands = useMemo(
    () => (currentUser ? demands.filter((d) => d.assigneeId === currentUser.id) : []),
    [demands, currentUser]
  )

  // Lista de semanas disponíveis
  const availableWeeks = useMemo(() => {
    const weeks = new Set<string>()
    for (const d of baseDemands) {
      const semana = d.week
      const ano = d.year
      if (semana && ano) {
        weeks.add(`${semana}/${ano}`)
      } else if (d.createdAt) {
        const date = new Date(d.createdAt)
        const w = getISOWeek(date)
        weeks.add(`${w}/${date.getFullYear()}`)
      }
    }
    return Array.from(weeks).sort()
  }, [baseDemands])

  // Aplicar filtros
  const filteredDemands = useMemo(() => {
    return baseDemands.filter((d) => {
      // Filtro de texto
      if (searchText && !d.title.toLowerCase().includes(searchText.toLowerCase())) return false
      // Filtro de status
      if (filterStatus !== 'all' && d.status !== filterStatus) return false
      // Filtro de semana
      if (filterWeek !== 'all') {
        const [wk, yr] = filterWeek.split('/')
        const demandWeek = d.week || getISOWeek(new Date(d.createdAt))
        const demandYear = d.year || new Date(d.createdAt).getFullYear()
        if (String(demandWeek) !== wk || String(demandYear) !== yr) return false
      }
      return true
    })
  }, [baseDemands, searchText, filterStatus, filterWeek])

  // Reset de página ao mudar qualquer filtro
  const handleFilterChange = (setter: (v: any) => void) => (val: any) => {
    setter(val)
    setPage(1)
  }

  const hasActiveFilters =
    searchText !== '' || filterStatus !== 'all' || filterWeek !== 'all'

  function clearFilters() {
    setSearchText('')
    setFilterStatus('all')
    setFilterWeek('all')
    setPage(1)
  }

  // Ordenar por mais recente e paginar
  const sortedDemands = useMemo(
    () => [...filteredDemands].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [filteredDemands]
  )
  const totalPages = Math.max(1, Math.ceil(sortedDemands.length / PAGE_SIZE))
  const pagedDemands = useMemo(
    () => sortedDemands.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [sortedDemands, page, PAGE_SIZE]
  )

  // Configuração do farol de prazos para liderados
  const getFarolConfig = () => {
    const now = new Date()
    const day = now.getDay() // 0: Dom, 1: Seg, 2: Ter, 3: Qua, 4: Qui, 5: Sex, 6: Sab
    const hour = now.getHours()

    if (day === 4) {
      if (hour < 16) {
        return {
          bgColor: 'bg-red-500/10 dark:bg-red-950/20 border-red-500/20 text-red-700 dark:text-red-300',
          dotColor: 'bg-red-500',
          text: 'Urgente: O prazo para envio das demandas desta semana encerra hoje às 16:00!'
        }
      } else {
        return {
          bgColor: 'bg-slate-500/10 dark:bg-slate-900/20 border-slate-500/20 text-slate-700 dark:text-slate-300',
          dotColor: 'bg-slate-500',
          text: 'Prazo encerrado para o envio das demandas da semana atual (limite era quinta às 16:00).'
        }
      }
    }

    if (day === 2 || day === 3) {
      return {
        bgColor: 'bg-amber-500/10 dark:bg-amber-950/20 border-amber-500/20 text-amber-700 dark:text-amber-300',
        dotColor: 'bg-amber-500',
        text: 'Atenção: Lembre-se de enviar suas demandas semanais até quinta-feira às 16:00!'
      }
    }

    return {
      bgColor: 'bg-emerald-500/10 dark:bg-emerald-950/20 border-emerald-500/20 text-emerald-700 dark:text-emerald-300',
      dotColor: 'bg-emerald-500',
      text: 'Período aberto: Envie suas demandas semanais até quinta-feira às 16:00.'
    }
  }

  const isLiderado = currentUser?.role !== 'director'
  const farol = getFarolConfig()

  return (
    <div className="space-y-5 max-w-6xl mx-auto h-full min-h-0 flex flex-col">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Minhas Demandas</h1>
          <p className="text-muted-foreground">Gerencie suas tarefas da semana.</p>
        </div>
        <Tabs
          value={view}
          onValueChange={(v) => setView(v as 'list' | 'kanban')}
          className="hidden sm:block"
        >
          <TabsList>
            <TabsTrigger value="list">
              <LayoutList className="w-4 h-4 mr-2" /> Lista
            </TabsTrigger>
            <TabsTrigger value="kanban">
              <LayoutGrid className="w-4 h-4 mr-2" /> Quadro
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLiderado && (
        <div className={cn("flex items-center gap-3 p-4 rounded-xl border text-sm font-medium transition-all shadow-sm", farol.bgColor)}>
          <span className="relative flex h-3 w-3">
            <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", farol.dotColor)}></span>
            <span className={cn("relative inline-flex rounded-full h-3 w-3", farol.dotColor)}></span>
          </span>
          <span>{farol.text}</span>
        </div>
      )}

      {/* Barra de Filtros */}
      <div className="bg-card border border-border/60 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
          <SlidersHorizontal className="w-4 h-4" />
          Filtros
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="ml-auto h-7 text-xs gap-1" onClick={clearFilters}>
              <X className="w-3 h-3" /> Limpar
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Pesquisa por texto */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar demanda..."
              value={searchText}
              onChange={(e) => handleFilterChange(setSearchText)(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filtro de Status */}
          <Select value={filterStatus} onValueChange={handleFilterChange(setFilterStatus)}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {(Object.keys(STATUS_CONFIG) as Status[]).map((s) => (
                <SelectItem key={s} value={s}>
                  <span className="mr-1">{STATUS_CONFIG[s].emoji}</span> {STATUS_CONFIG[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filtro de Semana */}
          <Select value={filterWeek} onValueChange={handleFilterChange(setFilterWeek)}>
            <SelectTrigger>
              <SelectValue placeholder="Semana" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as semanas</SelectItem>
              {availableWeeks.map((wk) => (
                <SelectItem key={wk} value={wk}>
                  Semana {wk.split('/')[0]}/{wk.split('/')[1]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Badges de filtros ativos */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 pt-1">
            {filterStatus !== 'all' && (
              <Badge variant="secondary" className="gap-1 text-xs">
                {STATUS_CONFIG[filterStatus]?.label}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setFilterStatus('all')} />
              </Badge>
            )}
            {filterWeek !== 'all' && (
              <Badge variant="secondary" className="gap-1 text-xs">
                Semana {filterWeek}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setFilterWeek('all')} />
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Contador de resultados */}
      <p className="text-xs text-muted-foreground">
        {filteredDemands.length} demanda{filteredDemands.length !== 1 ? 's' : ''} encontrada{filteredDemands.length !== 1 ? 's' : ''}
        {hasActiveFilters && ` (de ${baseDemands.length} no total)`}
      </p>

      {/* Visualização Lista */}
      {view === 'list' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
            {pagedDemands.map((demand) => (
              <DemandCard key={demand.id} demand={demand} onClick={() => setSelectedDemand(demand)} />
            ))}
            {filteredDemands.length === 0 && (
              <p className="text-muted-foreground col-span-full py-8 text-center">
                Nenhuma demanda encontrada para os filtros selecionados.
              </p>
            )}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border/60 pt-4 mt-2">
              <p className="text-xs text-muted-foreground">
                Página {page} de {totalPages} &mdash; exibindo {pagedDemands.length} de {sortedDemands.length} demandas
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('ellipsis')
                    acc.push(p)
                    return acc
                  }, [])
                  .map((item, idx) =>
                    item === 'ellipsis' ? (
                      <span key={`ellipsis-${idx}`} className="px-1 text-muted-foreground text-xs">…</span>
                    ) : (
                      <Button
                        key={item}
                        variant={page === item ? 'default' : 'outline'}
                        size="sm"
                        className="h-8 w-8 p-0 text-xs"
                        onClick={() => setPage(item as number)}
                      >
                        {item}
                      </Button>
                    )
                  )}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex-1 flex gap-6 overflow-x-auto pb-4 snap-x animate-fade-in hidden sm:flex">
          {COLUMNS.map((col) => (
            <div
              key={col}
              className="min-w-[300px] w-[300px] flex-shrink-0 flex flex-col bg-muted/30 rounded-xl p-4 snap-center border border-border/60"
            >
              <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">
                {COL_TITLES[col]} ({filteredDemands.filter((d) => d.status === col).length})
              </h3>
              <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-1">
                {filteredDemands
                  .filter((d) => d.status === col)
                  .map((demand) => (
                    <DemandCard
                      key={demand.id}
                      demand={demand}
                      onClick={() => setSelectedDemand(demand)}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Aviso mobile kanban */}
      {view === 'kanban' && (
        <div className="sm:hidden text-center text-muted-foreground py-8">
          A visualização em quadro é melhor aproveitada em telas maiores. Mude para Lista.
        </div>
      )}

      <DemandDrawer
        demand={selectedDemand}
        open={!!selectedDemand}
        onOpenChange={(open) => !open && setSelectedDemand(null)}
        canComment={false}
      />
    </div>
  )
}

/** Utilitário: retorna o número da semana ISO */
function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d as any) - (yearStart as any)) / 86400000 + 1) / 7)
}
