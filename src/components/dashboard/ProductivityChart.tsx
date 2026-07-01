import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { useAppStore } from '@/stores/use-app-store'
import { useMemo } from 'react'

/** Retorna o número da semana ISO da data fornecida */
export function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d as any) - (yearStart as any)) / 86400000 + 1) / 7)
}

/**
 * Monta dados agrupados por semana para o mês corrente.
 * @param demands  lista de demandas
 * @param userIds  filtra por lista de IDs (undefined = sem filtro = todos)
 */
export function buildMonthlyData(demands: any[], userIds?: string[], targetMonth?: number, targetYear?: number) {
  const now = new Date()
  const currentYear = targetYear ?? now.getFullYear()
  const currentMonth = targetMonth ?? now.getMonth()

  const weeksInMonth: Map<number, { completed: number; added: number }> = new Map()
  const firstDay = new Date(currentYear, currentMonth, 1)
  const lastDay = new Date(currentYear, currentMonth + 1, 0)

  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    const week = getISOWeek(new Date(d))
    if (!weeksInMonth.has(week)) {
      weeksInMonth.set(week, { completed: 0, added: 0 })
    }
  }

  for (const demand of demands) {
    if (userIds && !userIds.includes(demand.assigneeId)) continue
    const createdAt = new Date(demand.createdAt || demand.dueDate)
    if (
      createdAt.getFullYear() !== currentYear ||
      createdAt.getMonth() !== currentMonth
    ) continue

    const week = getISOWeek(createdAt)
    const entry = weeksInMonth.get(week) || { completed: 0, added: 0 }
    entry.added++
    if (demand.status === 'concluido') entry.completed++
    weeksInMonth.set(week, entry)
  }

  const sortedWeeks = Array.from(weeksInMonth.entries()).sort((a, b) => a[0] - b[0])
  return sortedWeeks.map(([week, vals], idx) => ({
    name: `Sem ${idx + 1}`,
    semana: `Semana ${week}`,
    completed: vals.completed,
    added: vals.added,
  }))
}

interface ProductivityChartProps {
  /** IDs dos usuários a filtrar. Se undefined, usa o usuário logado */
  userIds?: string[]
  /** Título customizado */
  title?: string
}

export function ProductivityChart({ userIds, title }: ProductivityChartProps) {
  const { demands, currentUser } = useAppStore()

  const effectiveUserIds = userIds ?? (currentUser?.id ? [currentUser.id] : undefined)

  const { targetMonth, targetYear } = useMemo(() => {
    const filteredDemands = demands.filter((d) => !effectiveUserIds || effectiveUserIds.includes(d.assigneeId))
    if (filteredDemands.length > 0) {
      const dates = filteredDemands
        .map((d) => new Date(d.createdAt || d.dueDate))
        .filter((d) => !isNaN(d.getTime()))
      if (dates.length > 0) {
        const latestDate = new Date(Math.max(...dates.map((d) => d.getTime())))
        return { targetMonth: latestDate.getMonth(), targetYear: latestDate.getFullYear() }
      }
    }
    const now = new Date()
    return { targetMonth: now.getMonth(), targetYear: now.getFullYear() }
  }, [demands, effectiveUserIds])

  const data = useMemo(
    () => buildMonthlyData(demands, effectiveUserIds, targetMonth, targetYear),
    [demands, effectiveUserIds, targetMonth, targetYear]
  )

  const monthName = useMemo(() => {
    const date = new Date(targetYear, targetMonth, 1)
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  }, [targetMonth, targetYear])

  const chartTitle = title ?? 'Produtividade Mensal'

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="text-lg">
          {chartTitle} —{' '}
          <span className="capitalize text-muted-foreground font-normal text-base">{monthName}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            completed: { label: 'Concluídas', color: 'hsl(var(--primary))' },
            added: { label: 'Adicionadas', color: 'hsl(var(--muted-foreground))' },
          }}
          className="h-[220px] w-full"
        >
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.semana ?? ''}
                />
              }
            />
            <Bar dataKey="completed" fill="var(--color-completed)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="added" fill="var(--color-added)" radius={[4, 4, 0, 0]} opacity={0.5} />
          </BarChart>
        </ChartContainer>
        {data.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-4">
            Nenhuma demanda registrada neste mês.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
