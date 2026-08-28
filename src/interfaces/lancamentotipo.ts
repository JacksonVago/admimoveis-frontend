import { lancamentoTipo } from "@/enums/locacao/enums-locacao";
import { PessoaStatus } from "@/enums/pessoal/status-pesoa";
import { LancamentoLocacao } from "./lancamentos";
import { Empresa } from "./empresa";
import { LancamentoCondominio } from "./lancamentocondominio";
import { GrupoFluxoCaixa } from "./grupo-fluxo-caixa";

export interface TipoLancamento {
    id: number;
    name: string;
    tipo: lancamentoTipo;
    automatico: string;
    parcelas: number;
    geraObservacao: string;
    valorFixo: number;
    status: PessoaStatus
    createdAt: string;
    updatedAt?: string;
    lancamentosLocacoes: LancamentoLocacao[];
    lancamentosCondominio: LancamentoCondominio[];
    grupofluxo: GrupoFluxoCaixa;
    grupofluxoId: number;
    empresa: Empresa;
    empresaId: number;
}
