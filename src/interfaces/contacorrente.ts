import { PessoaStatus } from "@/enums/pessoal/status-pesoa";
import { Banco } from "./banco";
import { InstrucaoCobranca } from "./instrucaocobranca";
import { InstrucaoRecebimentos } from "./instrucaorecebimentos";
import { CarteiraCobranca } from "./carteiracobranca";
import { EspecieCobranca } from "./especiecobranca";
import { Pessoa } from "./pessoa";
import { Empresa } from "./empresa";
import { FormaEnvio } from "@/enums/cobranca/FormaEnvio";
import { TipoJurosCobranca } from "./tipojuroscobranca";
import { TipoMultaCobranca } from "./tipomultacobranca";
import { TipoDescontoCobranca } from "./tipodescontocobranca";
import { TipoAutorizacaoCobranca } from "./tipoautorizacaocobranca";

export interface ContaCorrente {
  id:number;
  agencia:string;
  conta:string;
  digito:string;
  descricao:string;
  cooperativa:string;
  usuarioBancoAPI:string;
  senhaBancoAPI:string;
  chaveAppAPI:string;
  urlPIX:string;
  urlBoleto:string;
  urlWebhookPIX:string;
  urlWebhookBoleto:string;
  status:PessoaStatus;

  pagtoParcial:boolean;
  qtdeMaxParcial:number;
  formaEnvio:FormaEnvio;
  assuntoEmail:string;
  mensagemEmail1:string;
  mensagemEmail2:string;
  mensagemEmail3:string;
  convenio: string;
  
  tipoJurosCob:TipoJurosCobranca;
  tipoJurosCobId:number;
  valorJuros:number;
  percJuros:number;
  diasInicioJuros:number;

  tipoMultaCob:TipoMultaCobranca;
  tipoMultaCobId:number;
  valorMulta:number;
  percMulta:number;
  diasInicioMulta:number;

  tipoDescontoCob:TipoDescontoCobranca;
  tipoDescontoCobId:number;
  valorDesconto:number;
  percDesconto:number;
  diasInicioDesconto:number;

  tipoAutorizacaoCob:TipoAutorizacaoCobranca;
  tipoAutorizacaoCobId:number;
  tipoRecebimentoDiv:string;
  valorMinDiverg:number;
  valorMaxDiverg:number;
  percMinDiverg :number;
  percMaxDiverg :number;

  protestar:boolean;
  qtdeDiasProtesto:number;
  negativar:boolean;
  qtdeDiasNegativar:number;

  instrucaoCob1:InstrucaoCobranca;
  instrucaoCobId1:number;
  instrucaoCob2:InstrucaoCobranca;
  instrucaoCobId2:number;
  instrucaoCob3:InstrucaoCobranca;
  instrucaoCobId3:number;
  qtdeDiasAposVencto:number;
  cobrancaDiaUtil:boolean;

  instrucaoRec1:InstrucaoRecebimentos;
  instrucaoRecId1:number;
  instrucaoRec2:InstrucaoRecebimentos;
  instrucaoRecId2:number;
  instrucaoRec3:InstrucaoRecebimentos;
  instrucaoRecId3:number;
  instrucaoRec4:InstrucaoRecebimentos;
  instrucaoRecId4:number;

  banco:Banco;
  bancoId:number;

  carteira:CarteiraCobranca;
  carteiraId:number;

  especie:EspecieCobranca;
  especieId:number;

  pessoa:Pessoa;
  pessoaId:number;

  empresa:Empresa;
  empresaId:number;

}