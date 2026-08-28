import { PessoaStatus } from "@/enums/pessoal/status-pesoa"
import { Empresa } from "./empresa";

export interface GrupoFluxoCaixa {
  id:number;
  descricao: string;
  cor: string;

  status:PessoaStatus;

  empresa: Empresa;
  empresaId:number;

  createdAt:Date;
  updatedAt:Date;
}