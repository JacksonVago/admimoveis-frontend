import { Locacao } from "./locacao";
import { Pessoa } from "./pessoa";

export interface Morador {
  id: number;
  pessoa?: Pessoa;
  pessoaId: number;
  locacao?: Locacao;
  locacaoId:number;
  
}
