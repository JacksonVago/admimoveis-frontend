import { PessoaStatus } from '@/enums/pessoal/status-pesoa'
import { Endereco } from './endereco'

export interface Empresa {
  id: number  
  nome?: string
  cnpj:string
  telefone:string
  email:string
  status: PessoaStatus

  avisosReajusteLocacao: number
  avisosRenovacaoContrato: number
  avisosSeguroFianca : number
  avisosSeguroIncendio: number
  avisosTituloCapitalizacao: number
  avisosDepositoCalcao: number
  porcentagemComissao: number
  emiteBoleto:string
  valorTaxaBoleto: number
  tipoLancamento: number
  emissaoBoletoAntecedencia: number
  porcentagemMultaAtraso: number
  porcentagemJurosAtraso: number

  logo?: string
  enderecoId: number
  endereco: Endereco
  createdAt: Date
  updatedAt?: Date
}
