import { Boleto } from "./boleto";
import { BoletoBancario } from "./boletobancario";
import { Empresa } from "./empresa";
import { GenericAnexo } from "./generic-anexo";
import { Imovel } from "./imovel";
import { Locacao } from "./locacao";
import { Pessoa } from "./pessoa";


export interface Acordo {
    id: number;
    observacao: string;
    valorOriginal: number;
    juros: number;
    multa: number;
    desconto: number;
    valorLiquido: number;
    qtdParcelas: number;
    tipoGeracaoBoleto: string;
    dataEmissao: string;
    dataVencimento: string;
    status: string;
    pessoa: Pessoa;
    pessoaId:number;

    empresaId:number;
    
    locacao?: Locacao;
    locacaoId?:number;
    
    imovel?: Imovel;
    imovelId?:number;

    documentos?: GenericAnexo[]

    createdAt: string;
    updatedAt: string;
    lancamentos: LancamentoAcordo[]
    boletos: Boleto[]
}

export interface LancamentoAcordo {
    id: number
    descricao: string
    valorOriginal: number
    juros: number;
    multa: number;
    desconto: number;
    dataLancamento: string
    acordo:Acordo;
    boletoBancario?:BoletoBancario;
}