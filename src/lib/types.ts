export type Role = 'analyst' | 'manager' | 'director' | 'admin'
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
  microsoftId?: string
  adm?: boolean
}

export interface Comment {
  id: string
  demandId: string
  authorId: string
  authorName: string
  text: string
  timestamp: string
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
  week?: number
  year?: number
  comments?: Comment[]
  comentarioNotificado?: boolean
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  parsedTasks?: ParsedTask[]
  confirmed?: boolean
  suggestedActions?: {
    type: 'update_status'
    taskId: string
    taskTitle: string
    currentStatus: Status
  }[]
}

export interface ChartData {
  name: string
  completed: number
  added: number
}
