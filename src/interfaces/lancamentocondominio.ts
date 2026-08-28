import { LancamentoStatus } from "@/enums/locacao/enums-locacao";
import { Bloco } from "./bloco";
import { Boleto } from "./boleto";
import { TipoLancamento } from "./lancamentotipo";

export interface LancamentoCondominio {
  id:number;
  lancamentotipo:TipoLancamento;
  parcela:number;
  tipoId:number;
  valorLancamento:number;
  dataLancamento:Date;
  vencimentoLancamento:Date;
  linhaDigitavel:string;
  observacao:string;
  numeroDocumento?: string
  dataDocumento?: string
  serieDocumento?: string
  valorDocumento?: number
  descontoDocumento?: number
  rateia:string;
  status:LancamentoStatus;
  createdAt:Date;
  updatedAt:Date;

  bloco?:Bloco;
  blocoId:number;
  boleto?:Boleto;
  boletoId?:number;

}