import { Banco } from "./banco";

export interface TipoMultaCobranca {
  id:number;
  codigo: string;
  descricao: string;
  banco: Banco;
  bancoId:number;
}