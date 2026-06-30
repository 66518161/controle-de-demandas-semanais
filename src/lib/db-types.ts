export interface Cargo {
  IdCargo: number
  NomeCargo: string
}

export interface Usuario {
  IdUsuario: number
  Nome: string
  Email: string
  Senha: string
  IdCargo: number
  AvatarUrl?: string
}

export interface Reporte {
  IdReporte: number
  IdUsuario: number
  TextoOriginal: string
  DataReporte: string
}

export interface TarefaReportada {
  IdTarefa: number
  IdReporte: number
  DescricaoTarefa: string
  Status: string
  Prioridade: string
  Prazo: string
}

export interface HierarquiaReporte {
  IdHierarquia: number
  IdGestor: number
  IdSubordinado: number
}

export interface VHierarquiaReporte {
  IdUsuario: number
  Nome: string
  IdCargo: number
  NomeCargo: string
  IdGestor: number | null
  NomeGestor: string | null
}
