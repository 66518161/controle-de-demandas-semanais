import { useState } from 'react'
import { useAppStore } from '@/stores/use-app-store'
import { DemandCard } from '@/components/demands/DemandCard'
import { DemandDrawer } from '@/components/demands/DemandDrawer'
import { Demand } from '@/lib/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LayoutList, LayoutGrid } from 'lucide-react'

const COLUMNS = ['nao-iniciado', 'em-andamento', 'aguardando', 'concluido', 'cancelado'] as const
const COL_TITLES = {
  'nao-iniciado': 'Não Iniciado',
  'em-andamento': 'Em Andamento',
  aguardando: 'Aguardando',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
}

export default function MyDemands() {
  const { demands, currentUser } = useAppStore()
  const [selectedDemand, setSelectedDemand] = useState<Demand | null>(null)
  const [view, setView] = useState<'list' | 'kanban'>('list')

  const myDemands = demands.filter((d) => d.assigneeId === currentUser?.id)

  return (
    <div className="space-y-6 max-w-6xl mx-auto h-full flex flex-col">
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

      {view === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
          {myDemands.map((demand) => (
            <DemandCard key={demand.id} demand={demand} onClick={() => setSelectedDemand(demand)} />
          ))}
          {myDemands.length === 0 && (
            <p className="text-muted-foreground col-span-full py-8 text-center">
              Nenhuma demanda encontrada.
            </p>
          )}
        </div>
      ) : (
        <div className="flex-1 flex gap-6 overflow-x-auto pb-4 snap-x animate-fade-in hidden sm:flex">
          {COLUMNS.map((col) => (
            <div
              key={col}
              className="min-w-[300px] w-[300px] flex-shrink-0 flex flex-col bg-muted/30 rounded-xl p-4 snap-center border"
            >
              <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">
                {COL_TITLES[col]} ({myDemands.filter((d) => d.status === col).length})
              </h3>
              <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-1">
                {myDemands
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

      {/* Mobile Kanban warning */}
      {view === 'kanban' && (
        <div className="sm:hidden text-center text-muted-foreground py-8">
          A visualização em quadro é melhor aproveitada em telas maiores. Mude para Lista.
        </div>
      )}

      <DemandDrawer
        demand={selectedDemand}
        open={!!selectedDemand}
        onOpenChange={(open) => !open && setSelectedDemand(null)}
      />
    </div>
  )
}
