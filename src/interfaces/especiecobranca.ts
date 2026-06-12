import { Banco } from "./banco";

export interface EspecieCobranca {
  id:number;
  codigo: number;
  descricao: string;
  sigla: string;
  banco: Banco;
  bancoId:number;
}