import { Banco } from "./banco";

export interface TipoJurosCobranca {
  id:number;
  codigo: string;
  descricao: string;
  banco: Banco;
  bancoId:number;
}