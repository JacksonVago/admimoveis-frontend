import { TipoAgendamento } from "@/enums/alertas/TipoAgendamento";
import { Empresa } from "./empresa";
import { TipoAlerta } from "./tipoalerta";
import { FrequenciaEnvio } from "@/enums/alertas/FrequenciaEnvio";
import { TipoIntervaloEnvio } from "@/enums/alertas/TipoIntervaloEnvio";

export interface ConfiguracaoAlerta {
  id:number;
  descricao:string; //Descrição do tipo de alerta (ex: Reajuste de locação, Vencimento de contrato, etc.)
  ativo:boolean; //Indica se o alerta está ativo ou não
  empresa:Empresa;
  empresaId:number;

  alerta:TipoAlerta;
  alertaId:number;

  textoAlerta:string; //Texto do alerta a ser enviado (ex: "O contrato de locação do imóvel X está vencendo em Y dias.")
  tipoAgendamento:TipoAgendamento; //Tipo agendamento (ex: "UNICO", "RECORRENTE")
  frequenciaEnvio:FrequenciaEnvio; //Frequência de envio dos alertas (ex: "DIARIO", "SEMANAL", "MENSAL", "ANUAL") quando for recorrente

  dataInicio:string; //Data e hora de início do envio dos alertas quando for único, pode ser a (data de vencimento - dias parametrizados para aviso)
  //Se estiver vazia será a data de vencimento do tipo de alerta menos o número de dias parametrizados para aviso, 
  // por exemplo, se for um alerta de vencimento de contrato e o número de dias para aviso for 30, 
  // a data de início será a data de vencimento do contrato menos 30 dias

  ocorreAcada:number; //A cada quantos dias, meses, semanas, anos, etc. deve ser enviado o alerta quando for recorrente
  grupoEnvio:string; //Grupo (dias, meses, semanas, anos) para envio dos alertas, armazenados como string separada por vírgula ou intervalo 
  // Depende da frequência escolhida
  // Exemplo:
  //Dias :
  //- 30,15,7,1 dias específicos
  //- [1-10] range de dias
  //Meses:
  //- 3,2,1 meses específicos
  //- [1-3] range de meses
  //Dias Semanas:
  //- 7,3,1 dias específicos
  //- [1-7] range de dias da semana (1=Domingo, 2=Segunda, ..., 7=Sábado)
  //Anos:
  //- 1,2,3 anos específicos a partir de 2001
  //- [1-5] range de anos
  horarioEnvio:string; //Horário do dia para envio dos alertas (ex: "09:00", "18:00", etc.) uma vez ao dia

  tipoIntervaloEnvio:TipoIntervaloEnvio; //Tipo de intervalo para envio dos alertas (ex: "HORAS", "MINUTOS", "SEGUNDOS") quando for recorrente e mais de uma vez ao dia
  intervaloEnvio:number; //Intervalo envio dos alertas quando for recorrente pode ser (dias, meses, semanas, anos, 1 a cada , 2 a cada 2 dias, etc.) 
  horarioInicial:string; //Horário inicial para envio dos alertas (ex: "09:00", "18:00", etc.) quando for recorrente e mais de uma vez ao dia
  horarioFinal:string; //Horário final para envio dos alertas (ex: "17:00", "23:00", etc.) quando for recorrente e mais de uma vez ao dia

  dataInicioEnvio:string; //Data e hora de início do envio dos alertas quando for recorrente
  dataFinalEnvio:string; //Data e hora de finalização do envio dos alertas quando for recorrente sem data será enviado indefinidamente
}