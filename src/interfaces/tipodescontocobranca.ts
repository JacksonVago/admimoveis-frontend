import { Banco } from "./banco";

export interface TipoDescontoCobranca {
  id:number;
  codigo: string;
  descricao: string;
  banco: Banco;
  bancoId:number;
}