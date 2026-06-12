import { Banco } from "./banco";

export interface InstrucaoCobranca {
  id:number;
  codigo: number;
  descricao: string;
  
  banco: Banco;
  bancoId:number;
}