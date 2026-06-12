import { Banco } from "./banco";

export interface InstrucaoRecebimentos {
  id:number;
  codigo: number;
  descricao: string;
  
  banco: Banco;
  bancoId:number;
}