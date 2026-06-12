import { Banco } from "./banco";

export interface CarteiraCobranca {
  id:number;
  carteira: number;
  descricao: string;
  
  vencimentoMinimo: number;
  vencimentoMaximo: number;
  banco: Banco;
  bancoId:number;
}