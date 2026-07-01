import { useState, useRef, useEffect } from 'react'
import { Send, Wand2, Loader2, CheckCircle2, Bot, User as UserIcon } from 'lucide-react'
import { useAppStore } from '@/stores/use-app-store'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from '@/hooks/use-toast'
import { ChatMessage, Status } from '@/lib/types'
import { parseTasksFromText } from '@/lib/llm-parser'
import { STATUS_CONFIG } from '@/lib/status-config'
import { cn } from '@/lib/utils'
import { getSubordinateIds } from '@/lib/hierarchy'
import { Link } from 'react-router-dom'
import { MarkdownText } from '@/components/ai-assistant/MarkdownText'

export default function ChatPage() {
  const { chatMessages, addChatMessage, addDemand, confirmChatTasks, currentUser, demands, users, updateDemandStatus } = useAppStore()
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [chatMessages])

  const handleUpdateStatusFromChat = async (taskId: string, status: Status) => {
    const task = demands.find((d) => d.id === taskId)
    if (!task) return

    if (task.assigneeId !== currentUser?.id) {
      toast({
        title: 'Acesso negado',
        description: 'Apenas o criador original da demanda pode alterar seu status.',
        variant: 'destructive',
      })
      return
    }

    // 1. Atualiza a demanda no banco e no store
    await updateDemandStatus(taskId, status)

    // 2. Atualiza dinamicamente o status no texto e nas ações do chatMessages
    const updatedMessages = chatMessages.map((msg) => {
      let newContent = msg.content
      if (msg.suggestedActions) {
        const hasAction = msg.suggestedActions.some((act) => act.taskId === taskId)
        if (hasAction) {
          const actionToUpdate = msg.suggestedActions.find((act) => act.taskId === taskId)
          if (actionToUpdate) {
            const oldLabel = STATUS_CONFIG[actionToUpdate.currentStatus].label
            const oldEmoji = actionToUpdate.currentStatus === 'nao-iniciado' ? '⚪' : 
                             actionToUpdate.currentStatus === 'em-andamento' ? '🟡' : 
                             actionToUpdate.currentStatus === 'aguardando' ? '🔴' : 
                             actionToUpdate.currentStatus === 'concluido' ? '🟢' : '❌'
            
            const newLabel = STATUS_CONFIG[status].label
            const newEmoji = status === 'nao-iniciado' ? '⚪' : 
                             status === 'em-andamento' ? '🟡' : 
                             status === 'aguardando' ? '🔴' : 
                             status === 'concluido' ? '🟢' : '❌'
            
            // Substitui (🟡 Em Andamento) por (🟢 Concluído)
            const oldPattern = `(${oldEmoji} ${oldLabel})`
            const newPattern = `(${newEmoji} ${newLabel})`
            newContent = newContent.replaceAll(oldPattern, newPattern)
          }

          return {
            ...msg,
            content: newContent,
            suggestedActions: msg.suggestedActions.map((act) =>
              act.taskId === taskId ? { ...act, currentStatus: status } : act
            ),
          }
        }
      }
      return msg
    })

    // Seta as mensagens no store global
    useAppStore.setState({ chatMessages: updatedMessages })

    toast({
      title: 'Status atualizado!',
      description: `A tarefa "${task.title}" foi alterada para "${STATUS_CONFIG[status].label}".`,
    })
  }

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    }
    addChatMessage(userMessage)
    setInput('')
    setIsProcessing(true)

    try {
      const subordinateIds = currentUser ? getSubordinateIds(currentUser.id, users) : []
      const allowedDemands = demands.filter(
        (d) => d.assigneeId === currentUser?.id || (currentUser?.role !== 'analyst' && subordinateIds.includes(d.assigneeId))
      )
      const mappedDemandsForLlm = allowedDemands.map((d) => {
        const owner = users.find((u) => u.id === d.assigneeId)
        return {
          id: d.id,
          title: d.title,
          status: d.status,
          priority: d.priority,
          assigneeName: owner?.name || 'Desconhecido',
          assigneeEmail: owner?.email || '',
          assigneeId: d.assigneeId,
          dueDate: d.dueDate,
        }
      })

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          existingTasks: mappedDemandsForLlm,
          currentUser: {
            id: currentUser?.id,
            name: currentUser?.name,
            email: currentUser?.email,
            role: currentUser?.role,
            adm: currentUser?.adm
          }
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const parsed = (data.tarefas || []).map((t: any) => ({
          title: t.tarefa,
          description: t.tarefa,
          priority: 'medium',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: t.status === 'Finalizado' || t.status === 'concluido' ? 'concluido' : t.status === 'Em Andamento' || t.status === 'em-andamento' ? 'em-andamento' : t.status === 'Aguardando' || t.status === 'aguardando' ? 'aguardando' : t.status === 'Cancelado' || t.status === 'cancelado' ? 'cancelado' : 'nao-iniciado',
        }))

        const assistantMessage: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: data.reply || (parsed.length > 0
            ? `Identifiquei ${parsed.length} tarefa(s) na sua mensagem. Revise e confirme para adicioná-las ao seu painel.`
            : 'Não consegui identificar nenhuma tarefa ou ação correspondente.'),
          timestamp: new Date().toISOString(),
          parsedTasks: parsed.length > 0 ? parsed : undefined,
          suggestedActions: data.suggestedActions || undefined,
        }
        addChatMessage(assistantMessage)
      } else {
        throw new Error('Erro na rede.')
      }
    } catch (err) {
      console.warn('Erro ao chamar API de chat, usando parser local.', err)
      const parsed = parseTasksFromText(userMessage.content)
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content:
          parsed.length > 0
            ? `[Modo Offline] Identifiquei ${parsed.length} tarefa(s) na sua mensagem. Revise e confirme para adicioná-las.`
            : 'Não consegui identificar tarefas na sua mensagem. Tente descrever suas atividades de forma mais detalhada.',
        timestamp: new Date().toISOString(),
        parsedTasks: parsed.length > 0 ? parsed : undefined,
      }
      addChatMessage(assistantMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleConfirm = (messageId: string, tasks: ChatMessage['parsedTasks']) => {
    if (!tasks || !currentUser) return
    tasks.forEach((task) => {
      addDemand({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        assigneeId: currentUser.id,
      })
    })
    confirmChatTasks(messageId)
    toast({
      title: 'Demandas criadas!',
      description: `${tasks.length} tarefa(s) adicionada(s) ao seu painel.`,
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0 max-w-3xl mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Wand2 className="w-6 h-6 text-primary" />
          Chat IA
        </h1>
        <p className="text-muted-foreground text-sm">
          Descreva suas atividades e a IA estrutura tudo para você.
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pb-4 px-1">
        {chatMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Como funciona?</p>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">
                Digite suas tarefas naturalmente. Ex: "Terminei o relatório financeiro, estou
                trabalhando na apresentação, e aguardando resposta do cliente sobre o orçamento."
              </p>
            </div>
          </div>
        )}

        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex gap-3 animate-fade-in-up',
              msg.role === 'user' ? 'flex-row-reverse' : 'flex-row',
            )}
          >
            {msg.role === 'assistant' ? (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-primary" />
              </div>
            ) : (
              <Avatar className="w-8 h-8 shrink-0">
                <AvatarImage src={currentUser?.avatarUrl} />
                <AvatarFallback>
                  <UserIcon className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
            )}

            <div
              className={cn(
                'max-w-[80%] space-y-3',
                msg.role === 'user' ? 'items-end' : 'items-start',
              )}
            >
              <div
                className={cn(
                  'rounded-2xl px-4 py-3 text-sm',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                    : 'bg-card border border-border rounded-tl-sm',
                )}
              >
                {msg.role === 'assistant' ? (
                  <MarkdownText text={msg.content} />
                ) : (
                  msg.content
                )}
              </div>

               {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                 <div className="space-y-2 mt-2 w-full">
                   {msg.suggestedActions.map((action, idx) => (
                     <Card key={idx} className="p-3 bg-card border border-border rounded-xl space-y-2 max-w-sm">
                       <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                         <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                         Ação: Atualizar Status
                       </p>
                       <p className="text-xs font-medium text-muted-foreground line-clamp-2">
                         {action.taskTitle}
                       </p>
                       <div className="flex gap-1 flex-wrap">
                         {(['nao-iniciado', 'em-andamento', 'aguardando', 'concluido', 'cancelado'] as Status[]).map((status) => (
                           <Button
                             key={status}
                             size="sm"
                             variant={action.currentStatus === status ? 'default' : 'outline'}
                             className="text-[9px] h-6 px-1.5"
                             onClick={() => handleUpdateStatusFromChat(action.taskId, status)}
                           >
                             {STATUS_CONFIG[status].label}
                           </Button>
                         ))}
                       </div>
                       <p className="text-[10px] text-muted-foreground pt-1 border-t border-border/50">
                         Ou clique em: <Link to="/demands" onClick={() => useAppStore.getState().setSelectedDemand(demands.find(d => d.id === action.taskId) || null)} className="text-primary underline font-medium">Editar Detalhes</Link>
                       </p>
                     </Card>
                   ))}
                 </div>
               )}

               {msg.parsedTasks && msg.parsedTasks.length > 0 && !msg.confirmed && (
                 <div className="space-y-2">
                  {msg.parsedTasks.map((task, idx) => {
                    const config = STATUS_CONFIG[task.status]
                    return (
                      <Card key={idx} className="p-3 bg-muted/50 border-border">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{task.title}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <Badge
                                variant="secondary"
                                className={cn('text-[10px] border', config.badgeClass)}
                              >
                                {config.emoji} {config.label}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Prioridade: {task.priority}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => handleConfirm(msg.id, msg.parsedTasks)}
                  >
                    Confirmar e Adicionar Demandas
                  </Button>
                </div>
              )}

              {msg.confirmed && (
                <div className="flex items-center gap-2 text-xs text-success">
                  <CheckCircle2 className="w-4 h-4" />
                  Tarefas adicionadas ao painel
                </div>
              )}
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-border pt-4 pb-2">
        <div className="flex gap-2 items-end">
          <Textarea
            placeholder="Descreva suas tarefas..."
            className="min-h-[48px] max-h-[120px] resize-none"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isProcessing}
          />
          <Button
            size="icon"
            className="h-12 w-12 shrink-0"
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
