import { create } from 'zustand'
import { User, Demand, Status, Priority, ChatMessage, Comment } from '@/lib/types'
import { MOCK_USERS, MOCK_DEMANDS } from '@/lib/mock-data'

interface AppState {
  currentUser: User | null
  isAuthenticated: boolean
  users: User[]
  demands: Demand[]
  theme: 'light' | 'dark'
  chatMessages: ChatMessage[]
  selectedDemand: Demand | null
  login: (email: string, password: string) => Promise<boolean>
  microsoftLogin: () => Promise<boolean>
  logout: () => void
  setCurrentUser: (id: string) => void
  setSelectedDemand: (demand: Demand | null) => void
  toggleTheme: () => void
  addDemand: (demand: Omit<Demand, 'id' | 'createdAt'>) => void
  updateDemandStatus: (id: string, status: Status) => Promise<void>
  updateDemandPriority: (id: string, priority: Priority) => Promise<void>
  addComment: (demandId: string, text: string, authorId: string, authorName: string) => void
  markCommentAsNotified: (demandId: string) => Promise<void>
  addChatMessage: (message: ChatMessage) => void
  confirmChatTasks: (messageId: string) => void
  addUser: (user: Omit<User, 'id'>) => void
  updateUser: (id: string, updates: Partial<User>) => void
  deleteUser: (id: string) => void
  fetchData: () => Promise<void>
  weeklyReport: string | null
  fetchWeeklyReport: (semana: number, ano: number, idSuperior: string) => Promise<void>
}

const getInitialTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'dark'
  const stored = localStorage.getItem('demandflow-theme')
  return stored === 'light' ? 'light' : 'dark'
}

// Helper para converter Status do Banco para Status do Frontend
const mapDbStatusToFrontend = (status: string): Status => {
  const s = status ? status.toLowerCase() : ''
  if (s.includes('concluid') || s.includes('finaliz')) return 'concluido'
  if (s.includes('andament') || s.includes('progresso')) return 'em-andamento'
  if (s.includes('aguard') || s.includes('esper') || s.includes('pend')) return 'aguardando'
  if (s.includes('cancel')) return 'cancelado'
  return 'nao-iniciado'
}

// Helper para converter Status do Frontend para Status do Banco
const mapFrontendStatusToDb = (status: Status): string => {
  switch (status) {
    case 'concluido': return 'Finalizado'
    case 'em-andamento': return 'Em Andamento'
    case 'aguardando': return 'Aguardando'
    case 'cancelado': return 'Cancelado'
    default: return 'Não Iniciado'
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: null,
  isAuthenticated: false,
  users: MOCK_USERS,
  demands: MOCK_DEMANDS,
  theme: getInitialTheme(),
  chatMessages: [],
  selectedDemand: null,
  weeklyReport: null,

  setSelectedDemand: (selectedDemand) => set({ selectedDemand }),

  fetchData: async () => {
    try {
      // Carrega usuários da API
      const usersRes = await fetch('/api/users')
      if (usersRes.ok) {
        const dbUsers = await usersRes.json()
        const mappedUsers: User[] = dbUsers.map((u: any) => ({
          id: u.IdUsuario.toString(),
          name: u.Nome,
          email: u.Email || '',
          password: u.Senha || '123456',
          role: u.IdCargo === 3 ? 'director' : u.IdCargo === 2 ? 'manager' : 'analyst',
          microsoftId: u.MicrosoftID,
          managerId: u.IdSuperior ? u.IdSuperior.toString() : undefined,
          adm: u.Adm === true,
          avatarUrl: u.AvatarUrl || '/usuario.png',
        }))
        set({ users: mappedUsers.length > 0 ? mappedUsers : MOCK_USERS })
      }

      // Carrega tarefas da API
      const tasksRes = await fetch('/api/tasks')
      if (tasksRes.ok) {
        const dbTasks = await tasksRes.json()
        const mappedDemands: Demand[] = dbTasks.map((t: any) => {
          const comments: Comment[] = []
          if (t.ComentarioDiretor) {
            comments.push({
              id: `c-sup-${t.IdTarefa}`,
              demandId: t.IdTarefa.toString(),
              authorId: t.IdSuperior ? t.IdSuperior.toString() : 'superior-id',
              authorName: t.NomeSuperior || 'Superior',
              text: t.ComentarioDiretor,
              timestamp: t.DataComentario || t.DataRegistro || new Date().toISOString(),
            })
          }
          return {
            id: t.IdTarefa.toString(),
            title: t.DescricaoTarefa,
            description: t.DescricaoTarefa,
            status: mapDbStatusToFrontend(t.StatusTarefa),
            priority: (t.OrdemPrioridade <= 1 ? 'high' : t.OrdemPrioridade === 2 ? 'medium' : 'low') as Priority,
            dueDate: t.DataRegistro ? t.DataRegistro.split('T')[0] : new Date().toISOString().split('T')[0],
            assigneeId: t.IdUsuario ? t.IdUsuario.toString() : '1',
            createdAt: t.DataRegistro || new Date().toISOString(),
            week: t.Semana || undefined,
            year: t.Ano || undefined,
            comments,
            comentarioNotificado: t.ComentarioNotificado === true,
          }
        })
        set({ demands: mappedDemands.length > 0 ? mappedDemands : MOCK_DEMANDS })

        // Sincroniza a demanda selecionada aberta
        const currentSelected = get().selectedDemand
        if (currentSelected) {
          const updated = mappedDemands.find(d => d.id === currentSelected.id)
          if (updated) set({ selectedDemand: updated })
        }
      }
    } catch (err) {
      console.warn('Erro ao conectar com API do Backend. Usando dados mockados.', err)
    }
  },

  login: async (email, password) => {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (res.ok) {
        const data = await res.json()
        set({ currentUser: data.user, isAuthenticated: true })
        return true
      }
    } catch (err) {
      console.warn('Erro ao conectar com API de Login. Usando fallback local.', err)
    }

    const user = get().users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
    )
    if (user) {
      set({ currentUser: user, isAuthenticated: true })
      return true
    }
    return false
  },

  microsoftLogin: async () => {
    try {
      const { msalInstance, loginRequest, initializeMsal } = await import('@/lib/msal')
      
      // Limpa estados residuais de interações que podem ter travado anteriormente no localStorage e sessionStorage
      const storages = [localStorage, sessionStorage];
      storages.forEach((storage) => {
        const keysToRemove: string[] = [];
        for (let i = 0; i < storage.length; i++) {
          const key = storage.key(i);
          if (key && (key.includes('msal.interaction.status') || key.includes('msal.login.request') || key.includes('msal.request.keys'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((key) => storage.removeItem(key));
      });

      // Garante inicialização única do MSAL
      await initializeMsal()
      
      // Inicia a autenticação com popup do MSAL
      const loginResponse = await msalInstance.loginPopup(loginRequest)
      const account = loginResponse.account
      
      if (!account || !account.username) {
        throw new Error('Conta Microsoft inválida ou cancelada.')
      }

      // Envia os dados para validação real no backend
      const res = await fetch('/api/microsoft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: account.username,
          name: account.name || account.username.split('@')[0],
          microsoftId: account.homeAccountId || account.localAccountId,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        set({ currentUser: data.user, isAuthenticated: true })
        return true
      } else {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Erro na autenticação com Microsoft.')
      }
    } catch (err: any) {
      console.error('Erro no login Microsoft SSO:', err)
      // Dispara um toast de erro para ser exibido na UI
      throw err
    }
  },

  logout: () => set({ currentUser: null, isAuthenticated: false, chatMessages: [] }),

  setCurrentUser: (id) =>
    set((state) => ({ currentUser: state.users.find((u) => u.id === id) || state.currentUser })),

  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

  addDemand: async (demand) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          DescricaoTarefa: demand.title,
          StatusTarefa: mapFrontendStatusToDb(demand.status),
          IdUsuario: parseInt(demand.assigneeId, 10),
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const newDemand: Demand = {
          id: data.task.IdTarefa.toString(),
          title: data.task.DescricaoTarefa,
          description: data.task.DescricaoTarefa,
          status: mapDbStatusToFrontend(data.task.StatusTarefa),
          priority: demand.priority,
          dueDate: data.task.DataRegistro ? data.task.DataRegistro.split('T')[0] : new Date().toISOString().split('T')[0],
          assigneeId: data.task.IdUsuario.toString(),
          createdAt: data.task.DataRegistro || new Date().toISOString(),
          comments: [],
        }
        set((state) => ({
          demands: [newDemand, ...state.demands],
        }))
      } else {
        set((state) => ({
          demands: [
            { ...demand, id: `d-${Date.now()}`, createdAt: new Date().toISOString() },
            ...state.demands,
          ],
        }))
      }
    } catch (err) {
      console.error('Falha ao adicionar demanda no banco, salvando localmente.', err)
      set((state) => ({
        demands: [
          { ...demand, id: `d-${Date.now()}`, createdAt: new Date().toISOString() },
          ...state.demands,
        ],
      }))
    }
  },

  updateDemandStatus: async (id, status) => {
    const { currentUser } = get()
    set((state) => ({ 
      demands: state.demands.map((d) => (d.id === id ? { ...d, status } : d)),
      selectedDemand: state.selectedDemand && state.selectedDemand.id === id 
        ? { ...state.selectedDemand, status } 
        : state.selectedDemand
    }))
    try {
      if (!id.startsWith('d-') && currentUser) {
        await fetch(`/api/tasks/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            StatusTarefa: mapFrontendStatusToDb(status),
            IdUsuarioRequisitante: parseInt(currentUser.id, 10),
          }),
        })
      }
    } catch (err) {
      console.warn('Falha ao sincronizar status com banco de dados.', err)
    }
  },

  updateDemandPriority: async (id, priority) => {
    const { currentUser } = get()
    set((state) => ({ 
      demands: state.demands.map((d) => (d.id === id ? { ...d, priority } : d)),
      selectedDemand: state.selectedDemand && state.selectedDemand.id === id 
        ? { ...state.selectedDemand, priority } 
        : state.selectedDemand
    }))
    try {
      if (!id.startsWith('d-') && currentUser) {
        const priorityValue = priority === 'high' ? 1 : priority === 'medium' ? 2 : 3
        await fetch(`/api/tasks/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            OrdemPrioridade: priorityValue,
            IdUsuarioRequisitante: parseInt(currentUser.id, 10),
          }),
        })
      }
    } catch (err) {
      console.warn('Falha ao sincronizar prioridade com banco de dados.', err)
    }
  },

  addComment: async (demandId, text, authorId, authorName) => {
    const { currentUser } = get()
    set((state) => {
      const comment: Comment = {
        id: `c-${Date.now()}`,
        demandId,
        authorId,
        authorName,
        text,
        timestamp: new Date().toISOString(),
      }
      const updatedDemands = state.demands.map((d) =>
        d.id === demandId ? { ...d, comments: [...(d.comments || []), comment], comentarioNotificado: false } : d,
      )
      const updatedSelected = state.selectedDemand && state.selectedDemand.id === demandId
        ? { ...state.selectedDemand, comments: [...(state.selectedDemand.comments || []), comment], comentarioNotificado: false }
        : state.selectedDemand
      return {
        demands: updatedDemands,
        selectedDemand: updatedSelected
      }
    })
    try {
      if (!demandId.startsWith('d-') && currentUser) {
        await fetch(`/api/tasks/${demandId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            ComentarioDiretor: text,
            IdUsuarioRequisitante: parseInt(currentUser.id, 10),
          }),
        })
      }
    } catch (err) {
      console.warn('Falha ao sincronizar comentário com banco de dados.', err)
    }
  },

  markCommentAsNotified: async (demandId) => {
    const { currentUser } = get()
    set((state) => ({
      demands: state.demands.map((d) => (d.id === demandId ? { ...d, comentarioNotificado: true } : d)),
      selectedDemand: state.selectedDemand && state.selectedDemand.id === demandId 
        ? { ...state.selectedDemand, comentarioNotificado: true } 
        : state.selectedDemand
    }))
    try {
      if (!demandId.startsWith('d-') && currentUser) {
        await fetch(`/api/tasks/${demandId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            ComentarioNotificado: true,
            IdUsuarioRequisitante: parseInt(currentUser.id, 10),
          }),
        })
      }
    } catch (err) {
      console.warn('Falha ao marcar comentário como notificado.', err)
    }
  },

  addChatMessage: (message) => set((state) => ({ chatMessages: [...state.chatMessages, message] })),

  confirmChatTasks: (messageId) =>
    set((state) => ({
      chatMessages: state.chatMessages.map((m) =>
        m.id === messageId ? { ...m, confirmed: true } : m,
      ),
    })),

  addUser: async (user) => {
    try {
      const roleId = user.role === 'director' ? 3 : user.role === 'manager' ? 2 : 1
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Nome: user.name,
          Email: user.email,
          Senha: user.password,
          IdCargo: roleId,
          Status: 'Ativo',
        }),
      })
      if (res.ok) {
        const data = await res.json()
        set((state) => ({ users: [...state.users, { ...user, id: data.IdUsuario.toString() }] }))
      } else {
        set((state) => ({ users: [...state.users, { ...user, id: `u-${Date.now()}` }] }))
      }
    } catch (err) {
      set((state) => ({ users: [...state.users, { ...user, id: `u-${Date.now()}` }] }))
    }
  },

  updateUser: async (id, updates) => {
    set((state) => ({
      users: state.users.map((u) => (u.id === id ? { ...u, ...updates } : u)),
      currentUser:
        state.currentUser?.id === id ? { ...state.currentUser, ...updates } : state.currentUser,
    }))
    try {
      if (!id.startsWith('u-')) {
        const user = get().users.find((u) => u.id === id)
        if (user) {
          const roleId = user.role === 'director' ? 3 : user.role === 'manager' ? 2 : 1
          await fetch(`/api/users/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              Nome: user.name,
              Email: user.email,
              Senha: user.password,
              IdCargo: roleId,
              Status: 'Ativo',
              MicrosoftID: user.microsoftId,
            }),
          })
        }
      }
    } catch (err) {
      console.warn('Falha ao sincronizar atualização de usuário com banco de dados.', err)
    }
  },

  deleteUser: async (id) => {
    set((state) => ({
      users: state.users.filter((u) => u.id !== id),
      demands: state.demands.filter((d) => d.assigneeId !== id),
    }))
    try {
      if (!id.startsWith('u-')) {
        await fetch(`/api/users/${id}`, { method: 'DELETE' })
      }
    } catch (err) {
      console.warn('Falha ao sincronizar exclusão de usuário com banco de dados.', err)
    }
  },

  fetchWeeklyReport: async (semana, ano, idSuperior) => {
    try {
      const res = await fetch(`/api/consolidation?semana=${semana}&ano=${ano}&idSuperior=${idSuperior}`)
      if (res.ok) {
        const data = await res.json()
        set({ weeklyReport: data.Relatorio })
      } else {
        set({ weeklyReport: null })
      }
    } catch (err) {
      console.warn('Erro ao carregar relatório consolidado semanal.', err)
      set({ weeklyReport: null })
    }
  },
}))
