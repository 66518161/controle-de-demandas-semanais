export type CargoId = 1 | 2 | 3
export type TarefaStatusId = 1 | 2 | 3 | 4 | 5

export interface Cargo {
  IdCargo: CargoId
  NomeCargo: string
}

export interface Usuario {
  IdUsuario: string
  Nome: string
  Email: string
  SenhaHash: string
  IdCargo: CargoId
  AvatarUrl?: string
}

export interface Reporte {
  IdReporte: string
  IdUsuario: string
  TextoOriginal: string
  DataReporte: string
}

export interface TarefaReportada {
  IdTarefa: string
  IdReporte: string
  DescricaoTarefa: string
  Status: TarefaStatusId
  Prioridade: 'low' | 'medium' | 'high'
  Prazo: string
}

export interface HierarquiaReporte {
  IdHierarquia: string
  IdGestor: string
  IdSubordinado: string
}

export interface VHierarquiaReporte {
  IdUsuario: string
  Nome: string
  IdCargo: CargoId
  NomeCargo: string
  IdGestor: string | null
  NomeGestor: string | null
}

export const STATUS_MAP: Record<TarefaStatusId, string> = {
  1: 'nao-iniciado',
  2: 'em-andamento',
  3: 'aguardando',
  4: 'concluido',
  5: 'cancelado',
}

export const CARGO_MAP: Record<CargoId, string> = {
  1: 'Analyst',
  2: 'Manager',
  3: 'Director',
}
