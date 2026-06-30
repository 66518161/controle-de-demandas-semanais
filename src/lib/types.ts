export type Role = 'analyst' | 'manager' | 'director'
export type Status = 'todo' | 'in-progress' | 'done' | 'blocked'
export type Priority = 'low' | 'medium' | 'high'

export interface User {
  id: string
  name: string
  role: Role
  avatarUrl?: string
  managerId?: string
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
