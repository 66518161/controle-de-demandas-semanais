import { User, Demand } from './types'

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Ana Diretora',
    role: 'director',
    avatarUrl: 'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=1',
  },
  {
    id: 'u2',
    name: 'Carlos Gerente',
    role: 'manager',
    managerId: 'u1',
    avatarUrl: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=2',
  },
  {
    id: 'u3',
    name: 'Beatriz Analista',
    role: 'analyst',
    managerId: 'u2',
    avatarUrl: 'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=3',
  },
  {
    id: 'u4',
    name: 'Diego Analista',
    role: 'analyst',
    managerId: 'u2',
    avatarUrl: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=4',
  },
]

export const MOCK_DEMANDS: Demand[] = [
  {
    id: 'd1',
    title: 'Relatório Financeiro Q3',
    description: 'Consolidar dados do trimestre',
    status: 'in-progress',
    priority: 'high',
    dueDate: '2023-10-25',
    assigneeId: 'u3',
    createdAt: '2023-10-20',
  },
  {
    id: 'd2',
    title: 'Aprovação de Orçamento',
    description: 'Revisar orçamento da campanha',
    status: 'todo',
    priority: 'high',
    dueDate: '2023-10-26',
    assigneeId: 'u2',
    createdAt: '2023-10-21',
  },
  {
    id: 'd3',
    title: 'Atualizar Apresentação',
    description: 'Slides para a reunião geral',
    status: 'done',
    priority: 'medium',
    dueDate: '2023-10-22',
    assigneeId: 'u4',
    createdAt: '2023-10-18',
  },
  {
    id: 'd4',
    title: 'Planejamento Estratégico',
    description: 'Definir metas para o próximo ano',
    status: 'blocked',
    priority: 'high',
    dueDate: '2023-10-30',
    assigneeId: 'u1',
    createdAt: '2023-10-15',
  },
  {
    id: 'd5',
    title: 'Análise de Concorrentes',
    description: 'Levantamento de novas features',
    status: 'todo',
    priority: 'low',
    dueDate: '2023-10-28',
    assigneeId: 'u3',
    createdAt: '2023-10-23',
  },
]
