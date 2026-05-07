import { LancamentoStatus } from "@/enums/locacao/enums-locacao"
import { Imovel } from "./imovel"
import { Boleto } from "./boleto"
import { TipoLancamento } from "./lancamentotipo"

export interface LancamentoImovel {
  id: number
  lancamentotipo: TipoLancamento
  tipoId:number
  valorLancamento: number
  dataLancamento: string
  vencimentoLancamento: string
  linhaDigitavel:string;
  observacao?: string
  status:LancamentoStatus
  imovel: Imovel
  imovelId: number
  boleto?: Boleto
  boletoId?: number
}