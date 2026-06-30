import { Status, Priority } from './types'

export interface ParsedTask {
  title: string
  description: string
  priority: Priority
  dueDate: string
  status: Status
}

export function parseTasksFromText(text: string): ParsedTask[] {
  const lines = text
    .split(/[,\n;]/)
    .map((l) => l.trim())
    .filter(Boolean)
  const priorities: Priority[] = ['high', 'medium', 'low']

  return lines.slice(0, 8).map((line, idx) => {
    let status: Status = 'nao-iniciado'

    if (/terminad|feit|conclu[ií]d|pront|finaliz/i.test(line)) {
      status = 'concluido'
    } else if (/fazend|progress|andament|trabalh|desenvolv/i.test(line)) {
      status = 'em-andamento'
    } else if (/esper|aguard|bloque|pend|terceir|imped/i.test(line)) {
      status = 'aguardando'
    } else if (/cancel|desist|suspend/i.test(line)) {
      status = 'cancelado'
    }

    const priorityMatch = line.match(/(?:prioridade|urgente|alta|m[ée]dia|baixa)/i)
    let priority: Priority = priorities[idx % 3]
    if (priorityMatch) {
      const p = priorityMatch[0].toLowerCase()
      if (/urgente|alta/.test(p)) priority = 'high'
      else if (/m/.test(p)) priority = 'medium'
      else if (/baixa/.test(p)) priority = 'low'
    }

    const dateMatch = line.match(/(\d{1,2})[/-](\d{1,2})/)
    let dueDate = '2024-10-27'
    if (dateMatch) {
      const day = dateMatch[1].padStart(2, '0')
      const month = dateMatch[2].padStart(2, '0')
      dueDate = `2024-${month}-${day}`
    }

    return {
      title: line.charAt(0).toUpperCase() + line.slice(1),
      description: line,
      priority,
      dueDate,
      status,
    }
  })
}
