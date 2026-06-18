import { BoletoBancario } from "./boletobancario";
import { ContaCorrente } from "./contacorrente";
import { GenericAnexo } from "./generic-anexo";
import { Imovel } from "./imovel";
import { LancamentoCondominio } from "./lancamentocondominio";
import { LancamentoImovel } from "./lancamentoimovel";
import { LancamentoLocacao } from "./lancamentos";
import { Locacao } from "./locacao";
import { Locatario } from "./locatario";

export interface Boleto {
    id:number;
    createdAt:string;
    updatedAt:string;
  
    locacao?:Locacao;
    locacaoId?:number;
  
    imovel?:Imovel;
    imovelId?:number;
  
    empresaId?:number;

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
    boletosBancarios?: BoletoBancario[];
    lanctoCondominio?: LancamentoCondominio[];
    lancamentoImovels?: LancamentoImovel[];
    contacorrente?: ContaCorrente;

  }
  