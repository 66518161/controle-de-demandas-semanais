import { useState } from 'react'
import { Wand2, Loader2, CheckCircle2, MessageSquareText } from 'lucide-react'
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useAppStore } from '@/stores/use-app-store'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { Status, Priority } from '@/lib/types'
import { STATUS_CONFIG } from '@/lib/status-config'
import { cn } from '@/lib/utils'

interface ParsedTask {
  title: string
  priority: Priority
  dueDate: string
  status: Status
}

function parseTasksFromText(text: string): ParsedTask[] {
  const lines = text
    .split(/[,\n;]/)
    .map((l) => l.trim())
    .filter(Boolean)
  const priorities: Priority[] = ['high', 'medium', 'low']

  return lines.slice(0, 6).map((line, idx) => {
    let status: Status = 'nao-iniciado'

    if (/terminad|feit|conclu[ií]d|pront/i.test(line)) {
      status = 'concluido'
    } else if (/fazend|progress|andament|trabalh|desenvolv/i.test(line)) {
      status = 'em-andamento'
    } else if (/esper|aguard|bloque|pend|terceir/i.test(line)) {
      status = 'aguardando'
    } else if (/cancel|desist|suspend/i.test(line)) {
      status = 'cancelado'
    }

    return {
      title: line.charAt(0).toUpperCase() + line.slice(1),
      priority: priorities[idx % 3],
      dueDate: '2023-10-27',
      status,
    }
  })
}

export function AiTaskDialog({ isMobileFab = false }: { isMobileFab?: boolean }) {
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [parsedTasks, setParsedTasks] = useState<ParsedTask[]>([])
  const { addDemand, currentUser } = useAppStore()

  const handleProcess = () => {
    if (!input.trim()) return
    setIsProcessing(true)
    setTimeout(() => {
      setParsedTasks(parseTasksFromText(input))
      setIsProcessing(false)
    }, 2000)
  }

  const handleConfirm = () => {
    parsedTasks.forEach((task) => {
      addDemand({
        ...task,
        description: 'Gerado via IA',
        assigneeId: currentUser!.id,
      })
    })
    toast({
      title: 'Demandas criadas com sucesso!',
      description: `${parsedTasks.length} tarefas adicionadas à sua lista.`,
    })
    setParsedTasks([])
    setInput('')
  }

  return (
    <>
      {isMobileFab && (
        <DialogTrigger asChild>
          <Button
            size="icon"
            className="w-14 h-14 rounded-full shadow-elevation bg-primary hover:bg-primary/90"
          >
            <Wand2 className="w-6 h-6 text-white" />
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px] border-border bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-primary" />
            AI Demand Parser
          </DialogTitle>
          <DialogDescription>
            Cole suas anotações ou digite o que precisa ser feito. Nossa IA estruturará as tarefas
            para você.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!parsedTasks.length ? (
            <div className="space-y-4">
              <Textarea
                placeholder="Ex: Preciso terminar o relatório até quinta, estou fazendo a análise de concorrentes, aguardando resposta do João sobre o orçamento, cancelar a campanha antiga..."
                className="min-h-[150px] resize-none border-muted focus-visible:ring-primary"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <Button
                onClick={handleProcess}
                disabled={!input.trim() || isProcessing}
                className="w-full relative overflow-hidden group"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando com IA...
                  </>
                ) : (
                  <>
                    <MessageSquareText className="mr-2 h-4 w-4" />
                    Estruturar Demandas
                  </>
                )}
                {isProcessing && <div className="absolute inset-0 bg-primary/20 animate-pulse" />}
              </Button>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in-up">
              <h4 className="text-sm font-medium text-muted-foreground">Tarefas Detectadas</h4>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {parsedTasks.map((task, idx) => {
                  const config = STATUS_CONFIG[task.status]
                  return (
                    <Card key={idx} className="p-3 flex items-start gap-3 bg-muted/50 border-none">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{task.title}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge
                            variant="secondary"
                            className={cn('text-[10px] border', config.badgeClass)}
                          >
                            {config.emoji} {config.label}
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            Prazo: {task.dueDate} • Prioridade: {task.priority}
                          </p>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="w-full" onClick={() => setParsedTasks([])}>
                  Cancelar
                </Button>
                <Button onClick={handleConfirm} className="w-full">
                  Confirmar e Adicionar
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </>
  )
}
