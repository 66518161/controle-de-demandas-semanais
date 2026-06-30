export type Role = 'analyst' | 'manager' | 'director'
export type Status = 'nao-iniciado' | 'em-andamento' | 'aguardando' | 'concluido' | 'cancelado'
export type Priority = 'low' | 'medium' | 'high'

export interface User {
  id: string
  name: string
  email: string
  password: string
  role: Role
  avatarUrl?: string
  managerId?: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  parsedTasks?: ParsedTask[]
  confirmed?: boolean
}

export interface ParsedTask {
  title: string
  description: string
  priority: Priority
  dueDate: string
  status: Status
}

export interface Demand {
  id: string
  title: string
  description: string
  status: Status
  priority: Priority
  dueDate: string
  assigneeId: string
  createdAt: string
}

export interface ChartData {
  name: string
  completed: number
  added: number
}
