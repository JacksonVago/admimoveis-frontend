import { Boleto } from "./boleto";
import { ContaCorrente } from "./contacorrente";

export interface BoletoBancario {
  id:number;
  boleto?:Boleto;
  boletoId:number;
  valor:number;
  valorPago:number;
  dataBoleto:string;
  dataVencimento:string;
  dataPagamento:string;
  formaPix:string;
  codigoBarras:string;
  linhaDigitavel:string;
  nossoNumero:string;
  urlBoleto:string;
  registrado:string;
  emvPIX:string;
  metodoPagamento:string;
  status:string;
  observacao:string;

  pagtoParcial:boolean;
  qtdeMaxParcial:number;
  formaEnvio:string;
  email:string;
  assuntoEmail:string;
  mensagemEmail1:string;
  mensagemEmail2:string;
  mensagemEmail3:string;

  tipoJurosCobCod:string;
  valorJuros:number;
  percJuros:number;
  diasInicioJuros:number;

  tipoMultaCobCod:string;
  valorMulta:number;
  percMulta:number;
  diasInicioMulta:number;

  tipoDescontoCobCod:string;
  valorDesconto:number;
  percDesconto:number;
  diasInicioDesconto:number;

  tipoAutorizacaoCobCod:string;
  tipoRecebimentoDiv:string;
  valorMinDiverg:number;
  valorMaxDiverg:number;
  percMinDiverg:number;
  percMaxDiverg:number;

  protestar:boolean;
  qtdeDiasProtesto:number;
  negativar:boolean;
  qtdeDiasNegativar:number;

  instrucaoCobCod1:string;
  instrucaoCobCod2:string;
  instrucaoCobCod3:string;

  instrucaoRecCod1:string;
  instrucaoRecCod2:string;
  instrucaoRecCod3:string;
  instrucaoRecCod4:string;

  carteiraCod:string;

  especieCod:string;

  contacorrente?:ContaCorrente;
  contaId:number;
}
