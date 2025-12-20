export const APP_NAME = 'TH Empresarial'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3004'

export const ESTADOS_ORDEN = {
  RECIBIDO: 'recibido',
  EN_DIAGNOSTICO: 'en_diagnostico',
  DIAGNOSTICADO: 'diagnosticado',
  EN_REPARACION: 'en_reparacion',
  REPARADO: 'reparado',
  NO_REPARABLE: 'no_reparable',
  ENTREGADO: 'entregado',
} as const

export const PRIORIDADES = {
  BAJA: 'baja',
  NORMAL: 'normal',
  ALTA: 'alta',
  URGENTE: 'urgente',
} as const

export const METODOS_PAGO = {
  EFECTIVO: 'efectivo',
  TARJETA: 'tarjeta',
  TRANSFERENCIA: 'transferencia',
} as const

export const TIPOS_PAGO = {
  ANTICIPO: 'anticipo',
  PAGO_FINAL: 'pago_final',
  ABONO: 'abono',
} as const

export const ROLES = {
  ADMIN: 'admin',
  GERENTE: 'gerente',
  TECNICO: 'tecnico',
  RECEPCIONISTA: 'recepcionista',
} as const

export const TIPOS_FOTO = {
  INGRESO: 'ingreso',
  DIAGNOSTICO: 'diagnostico',
  REPARACION: 'reparacion',
  ENTREGA: 'entrega',
} as const

export const MAX_FOTOS_POR_ORDEN = 10
export const MAX_FILE_SIZE = 1024 * 1024 // 1MB
