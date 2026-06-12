import { Banco } from "./banco";

export interface TipoAutorizacaoCobranca {
  id:number;
  codigo: string;
  descricao: string;
  banco: Banco;
  bancoId:number;
}