import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

const data = [
  { name: 'Seg', completed: 4, added: 2 },
  { name: 'Ter', completed: 3, added: 5 },
  { name: 'Qua', completed: 7, added: 3 },
  { name: 'Qui', completed: 5, added: 4 },
  { name: 'Sex', completed: 2, added: 1 },
]

export function ProductivityChart() {
  return (
    <Card className="col-span-full lg:col-span-3">
      <CardHeader>
        <CardTitle className="text-lg">Produtividade da Semana</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            completed: { label: 'Concluídas', color: 'hsl(var(--primary))' },
            added: { label: 'Adicionadas', color: 'hsl(var(--muted-foreground))' },
          }}
          className="h-[250px] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="completed" fill="var(--color-completed)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="added" fill="var(--color-added)" radius={[4, 4, 0, 0]} opacity={0.5} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
