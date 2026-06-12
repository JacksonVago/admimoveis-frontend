import { FrequenciaEnvio } from "@/enums/alertas/FrequenciaEnvio";
import { TipoAgendamento } from "@/enums/alertas/TipoAgendamento";
import { TipoIntervaloEnvio } from "@/enums/alertas/TipoIntervaloEnvio";

export const TIPO_AGENDAMENTO_OPTIONS = [
  { value: TipoAgendamento.RECORRENTE, label: 'RECORRENTE' },
  { value: TipoAgendamento.UNICO, label: 'UNICO' },
]


export const FREQUENCIA_ENVIO_OPTIONS = [
  //{ value: FrequenciaEnvio.ANUAL, label: 'ANUAL' },  
  { value: FrequenciaEnvio.MENSAL, label: 'MENSAL' },  
  { value: FrequenciaEnvio.SEMANAL, label: 'SEMANAL' },  
  { value: FrequenciaEnvio.DIAS_VENCIMENTO, label: 'DIAS_VENCIMENTO' },  
  { value: FrequenciaEnvio.DIARIO, label: 'DIARIO' },  
]

export const TIPO_INTERVALO_OPTIONS = [
  { value: TipoIntervaloEnvio.HORAS, label: 'HORAS' },  
  { value: TipoIntervaloEnvio.MINUTOS, label: 'MINUTOS' },  
  { value: TipoIntervaloEnvio.SEGUNDOS, label: 'SEGUNDOS' },  
]
