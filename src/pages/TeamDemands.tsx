import { useState, useMemo, useEffect } from 'react'
import { useAppStore } from '@/stores/use-app-store'
import { Card } from '@/components/ui/card'
import { Sparkles } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/dashboard/StatCard'
import { DemandCard } from '@/components/demands/DemandCard'
import { DemandDrawer } from '@/components/demands/DemandDrawer'
import { ProductivityChart } from '@/components/dashboard/ProductivityChart'
import { Demand, Status } from '@/lib/types'
import { getDirectReports, getSubordinateIds } from '@/lib/hierarchy'
import { STATUS_CONFIG } from '@/lib/status-config'
import {
  ListTodo, CheckCircle2, Clock, AlertCircle,
  Search, X, SlidersHorizontal, ChevronLeft, ChevronRight,
} from 'lucide-react'

const PAGE_SIZE = 6

/** Calcula o número da semana ISO */
function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d as any) - (yearStart as any)) / 86400000 + 1) / 7)
}

function weekKey(demand: Demand): string {
  const w = demand.week || getISOWeek(new Date(demand.createdAt))
  const y = demand.year || new Date(demand.createdAt).getFullYear()
  return `${w}/${y}`
}

// ──────────────────────────────────────────────────────────────
// Sub-componente: filtros + cards paginados por usuário
// ──────────────────────────────────────────────────────────────
function UserDemandPanel({
  userId,
  allDemands,
  onSelect,
}: {
  userId: string
  allDemands: Demand[]
  onSelect: (d: Demand) => void
}) {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<Status | 'all'>('all')
  const [filterWeek, setFilterWeek] = useState<string>('all')
  const [page, setPage] = useState(1)

  // Apenas tarefas pendentes (sem concluído e cancelado)
  const pending = useMemo(
    () =>
      allDemands.filter(
        (d) => d.assigneeId === userId && d.status !== 'concluido' && d.status !== 'cancelado'
      ),
    [allDemands, userId]
  )

  const weeks = useMemo(() => {
    const s = new Set<string>()
    pending.forEach((d) => s.add(weekKey(d)))
    return Array.from(s).sort()
  }, [pending])

  // Filtra + ordena por mais recente
  const filtered = useMemo(() => {
    const result = pending.filter((d) => {
      if (search && !d.title.toLowerCase().includes(search.toLowerCase())) return false
      if (filterStatus !== 'all' && d.status !== filterStatus) return false
      if (filterWeek !== 'all' && weekKey(d) !== filterWeek) return false
      return true
    })
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [pending, search, filterStatus, filterWeek])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pagedItems = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  )

  const hasFilters = search !== '' || filterStatus !== 'all' || filterWeek !== 'all'

  function handleFilter(setter: (v: any) => void) {
    return (val: any) => { setter(val); setPage(1) }
  }

  function clear() {
    setSearch(''); setFilterStatus('all'); setFilterWeek('all'); setPage(1)
  }

  return (
    <div className="space-y-3 mt-2">
      {/* Filtros */}
      <div className="bg-muted/30 border border-border/50 rounded-lg p-3 space-y-2">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filtros
          {hasFilters && (
            <Button variant="ghost" size="sm" className="ml-auto h-6 text-xs gap-1 px-2" onClick={clear}>
              <X className="w-3 h-3" /> Limpar
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Pesquisar..."
              value={search}
              onChange={(e) => handleFilter(setSearch)(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
          <Select value={filterStatus} onValueChange={handleFilter(setFilterStatus)}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {(['nao-iniciado', 'em-andamento', 'aguardando'] as Status[]).map((s) => (
                <SelectItem key={s} value={s}>
                  <span className="mr-1">{STATUS_CONFIG[s].emoji}</span>
                  {STATUS_CONFIG[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterWeek} onValueChange={handleFilter(setFilterWeek)}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Semana" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as semanas</SelectItem>
              {weeks.map((wk) => (
                <SelectItem key={wk} value={wk}>
                  Semana {wk.split('/')[0]}/{wk.split('/')[1]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cards */}
      {pagedItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {pagedItems.map((demand) => (
            <DemandCard key={demand.id} demand={demand} onClick={() => onSelect(demand)} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground py-4 text-center bg-muted/30 rounded-lg">
          {pending.length === 0
            ? 'Nenhuma tarefa pendente. 🎉'
            : 'Nenhuma demanda encontrada para os filtros selecionados.'}
        </p>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border/60 pt-3">
          <p className="text-xs text-muted-foreground">
            Página {page} de {totalPages} — {pagedItems.length} de {filtered.length} tarefas
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline" size="sm" className="h-7 w-7 p-0"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
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
                  <span key={`e-${idx}`} className="px-1 text-xs text-muted-foreground">…</span>
                ) : (
                  <Button
                    key={item}
                    variant={page === item ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 w-7 p-0 text-xs"
                    onClick={() => setPage(item as number)}
                  >
                    {item}
                  </Button>
                )
              )}
            <Button
              variant="outline" size="sm" className="h-7 w-7 p-0"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {filtered.length} pendente{filtered.length !== 1 ? 's' : ''}
        {hasFilters && ` (de ${pending.length} no total)`}
      </p>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────
// Página principal
// ──────────────────────────────────────────────────────────────
export default function TeamDemands() {
  const { users, demands, currentUser, selectedDemand, setSelectedDemand, weeklyReport, fetchWeeklyReport } = useAppStore()

  useEffect(() => {
    if (currentUser) {
      const now = new Date()
      const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
      const dayNum = d.getUTCDay() || 7
      d.setUTCDate(d.getUTCDate() + 4 - dayNum)
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
      const currentWeek = Math.ceil((((d as any) - (yearStart as any)) / 86400000 + 1) / 7)
      const currentYear = now.getFullYear()

      fetchWeeklyReport(currentWeek, currentYear, currentUser.id)
    }
  }, [currentUser, fetchWeeklyReport])

  const isDirector = currentUser?.role === 'director'
  const isManager = currentUser?.role === 'manager'

  const visibleUsers = useMemo(() => {
    if (!currentUser) return []
    return getDirectReports(currentUser.id, users)
  }, [currentUser, users])

  const teamIds = useMemo(() => {
    if (!currentUser) return []
    if (currentUser.role === 'director') {
      // Diretor visualiza estatísticas compiladas apenas de seus gerentes diretos
      return getDirectReports(currentUser.id, users).map((u) => u.id)
    }
    // Gerente visualiza estatísticas compiladas de seus liderados
    return getSubordinateIds(currentUser.id, users)
  }, [currentUser, users])

  if (currentUser?.role === 'analyst') {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Acesso restrito a gestores e diretores.
      </div>
    )
  }

  // Estatísticas da equipe
  const teamDemands = demands.filter((d) => teamIds.includes(d.assigneeId))
  const teamTotal = teamDemands.length
  const teamDone = teamDemands.filter((d) => d.status === 'concluido').length
  const teamInProgress = teamDemands.filter((d) => d.status === 'em-andamento').length
  const teamWaiting = teamDemands.filter((d) => d.status === 'aguardando').length

  const getMetrics = (userId: string) => {
    const ud = demands.filter((d) => d.assigneeId === userId)
    const total = ud.length
    const done = ud.filter((d) => d.status === 'concluido').length
    const pending = ud.filter((d) => d.status !== 'concluido' && d.status !== 'cancelado').length
    const progress = total === 0 ? 0 : Math.round((done / total) * 100)
    return { total, done, pending, progress }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {isDirector ? 'Demandas dos Gerentes' : 'Demandas da Equipe'}
        </h1>
        <p className="text-muted-foreground">
          {isDirector
            ? 'Acompanhe e gerencie as demandas dos seus gerentes.'
            : 'Acompanhe a produtividade dos seus liderados.'}
        </p>
      </div>

      {/* ── BLOCO 1: Stats da equipe ── */}
      {teamIds.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Equipe — {visibleUsers.length} {visibleUsers.length === 1 ? 'colaborador' : 'colaboradores'}
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard title="Total da Equipe"  value={teamTotal}      icon={ListTodo}    />
            <StatCard title="Concluídas"        value={teamDone}       icon={CheckCircle2}/>
            <StatCard title="Em Andamento"      value={teamInProgress} icon={Clock}       />
            <StatCard title="Aguardando"        value={teamWaiting}    icon={AlertCircle} />
          </div>
        </div>
      )}

      {/* ── BLOCO: Relatório Executivo Semanal (LLM) ── */}
      {weeklyReport && (
        <Card className="p-6 border border-border/60 bg-gradient-to-br from-card to-background shadow-sm rounded-2xl animate-fade-in space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
              <h3 className="font-bold text-lg text-foreground tracking-tight">Consolidação Semanal (IA)</h3>
            </div>
            <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
              OpenRouter / Gemini
            </Badge>
          </div>
          <div className="prose dark:prose-invert max-w-none space-y-1">
            {weeklyReport.split('\n').map((line, index) => {
              const trimmed = line.trim()
              if (trimmed.startsWith('# ')) {
                return <h1 key={index} className="text-xl font-bold text-foreground mt-4 mb-2">{trimmed.replace('# ', '')}</h1>
              }
              if (trimmed.startsWith('### ')) {
                return <h3 key={index} className="text-base font-semibold text-primary mt-3 mb-1.5">{trimmed.replace('### ', '')}</h3>
              }
              if (trimmed.startsWith('**Período:**')) {
                return <p key={index} className="text-xs text-muted-foreground mb-3">{trimmed}</p>
              }
              if (trimmed.startsWith('- ') || trimmed.startsWith('⚪') || trimmed.startsWith('🟢') || trimmed.startsWith('🟡') || trimmed.startsWith('🔴') || trimmed.startsWith('⚫') || trimmed.startsWith('👤')) {
                return <li key={index} className="text-sm list-none ml-1 my-1 flex items-start gap-2"><span className="shrink-0">{trimmed.slice(0, 2)}</span><span>{trimmed.slice(2)}</span></li>
              }
              if (trimmed === '') return <div key={index} className="h-2" />
              return <p key={index} className="text-sm text-foreground/90 leading-relaxed my-1.5">{trimmed}</p>
            })}
          </div>
        </Card>
      )}

      {/* ── BLOCO 2: Gráfico de produtividade da equipe ── */}
      {teamIds.length > 0 && (
        <ProductivityChart userIds={teamIds} title="Produtividade da Equipe" />
      )}

      {/* ── BLOCO 3: Accordion com tarefas pendentes por colaborador ── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Tarefas Pendentes por Colaborador
        </p>
        <Accordion type="multiple" className="space-y-3">
          {visibleUsers.map((user) => {
            const { total, done, pending, progress } = getMetrics(user.id)
            return (
              <AccordionItem
                key={user.id}
                value={user.id}
                className="border rounded-xl px-4 bg-card shadow-sm"
              >
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-4 w-full pr-4">
                    <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
                      <AvatarImage src={user.avatarUrl || '/usuario.png'} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left min-w-0">
                      <h3 className="font-semibold text-sm truncate">{user.name}</h3>
                      <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                    </div>
                    <div className="hidden sm:flex flex-col items-end w-32 gap-1 shrink-0">
                      <div className="flex justify-between w-full text-xs text-muted-foreground">
                        <span>Progresso</span>
                        <span>{done}/{total}</span>
                      </div>
                      <Progress value={progress} className="h-1.5" />
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={progress === 100 ? 'default' : 'secondary'}
                        className="hidden sm:inline-flex"
                      >
                        {progress}%
                      </Badge>
                      {pending > 0 && (
                        <Badge variant="outline" className="text-xs text-orange-500 border-orange-500/40">
                          {pending} pend.
                        </Badge>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-4">
                  <UserDemandPanel
                    userId={user.id}
                    allDemands={demands}
                    onSelect={setSelectedDemand}
                  />
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </div>

      <DemandDrawer
        demand={selectedDemand}
        open={!!selectedDemand}
        onOpenChange={(open) => !open && setSelectedDemand(null)}
        canEditStatus={false}
        canEditPriority={
          currentUser && selectedDemand
            ? users.find((u) => u.id === selectedDemand.assigneeId)?.managerId === currentUser.id
            : false
        }
        canComment={
          currentUser && selectedDemand
            ? users.find((u) => u.id === selectedDemand.assigneeId)?.managerId === currentUser.id
            : false
        }
      />
    </div>
  )
}
