import { PessoaStatus } from "@/enums/pessoal/status-pesoa"
import { Empresa } from "./empresa";

export interface TipoAlerta {
  id:number;
  descricao: string;

  status:PessoaStatus;

  empresa: Empresa;
  empresaId:number;

  createdAt:Date;
  updatedAt:Date;
}