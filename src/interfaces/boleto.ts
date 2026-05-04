import { BoletoBancario } from "./boletobancario";
import { GenericAnexo } from "./generic-anexo";
import { LancamentoCondominio } from "./lancamentocondominio";
import { LancamentoLocacao } from "./lancamentos";
import { Locacao } from "./locacao";
import { Locatario } from "./locatario";

export interface Boleto {
    id:number;
    createdAt:string;
    updatedAt:string;
  
    locacao?:Locacao;
    locacaoId:number;
  
    status:string;
    dataEmissao:string;
    dataVencimento:string;
    dataPagamento:string;
  
    valorOriginal:number;
    valorPago:number;
    observacao:string;
    linhaDigitavel:string;
    documentos?:GenericAnexo[]
    lanctoLocacao?:LancamentoLocacao[];
    locatario?:Locatario;
    boletosBancarios?: BoletoBancario[]
    lanctoCondominio?: LancamentoCondominio[]

  }
  