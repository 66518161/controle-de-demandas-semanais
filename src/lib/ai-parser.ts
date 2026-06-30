import { Status, Priority, ParsedTask } from './types'

export function parseTasksFromText(text: string): ParsedTask[] {
  const lines = text
    .split(/[,\n;]|\be\b/i)
    .map((l) => l.trim())
    .filter(Boolean)

  const priorities: Priority[] = ['high', 'medium', 'low']
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  const dueDate = nextWeek.toISOString().split('T')[0]

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
      dueDate,
      status,
    }
  })
}
