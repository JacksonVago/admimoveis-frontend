import { ImovelStatus } from '@/enums/imovel/enums-imovel'
import { Endereco } from './endereco'
import { Locacao } from './locacao'
//import { Locatario } from './locatario'
import { Proprietario } from './proprietario'
import { TipoImovel } from './tipoimovel'
import { Empresa } from './empresa'
import { Condominio } from './condominio'
import { Bloco } from './bloco'
import { LancamentoImovel } from './lancamentoimovel'
import { Boleto } from './boleto'

export interface Imovel {
  id: number;
  title: string;
  status: ImovelStatus;
  description?: string;
  tipo: TipoImovel;
  tipoId: number;

  porcentagemLucroImobiliaria: number;
  valorAluguel?: number;

  metragem?: number //Metragem do imóvel em metros quadrados
  quartos?:number
  banheiros?:number //Número de banheiros
  vagasEstacionamento?:number; //Número de vagas de estacionamento
  andar?:number //Andar do imóvel (se for apartamento)

  enderecoId: number;
  endereco: Endereco;
  createdAt: Date;
  updatedAt?: Date;
  
  empresa:Empresa;
  empresaId:number;

  condominio:Condominio;
  condominioId:number;

  bloco:Bloco;
  blocoId:number;

  locacoes?: Locacao[];
  proprietarios?: Proprietario[];
  imovelPhotos?: ImovelPhotos[];
  lancamentos?: LancamentoImovel[];
  boletos?: Boleto[];
}

export interface ImovelPhotos {
  id: number
  url: string
  imovelid: number
  createdAt?: string
  updatedAt?: string
}
