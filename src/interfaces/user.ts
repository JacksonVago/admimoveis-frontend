import { Empresa } from "./empresa"

export interface User {
  id: string;
  login: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  permissions: Permission[];
  createdAt: string;
  updatedAt?: string;
  empresa: Empresa;
  empresaId: number;
}

export type Permission =
  | 'ALL'
  | 'VIEW_EMPRESAS'
  | 'UPDATE_EMPRESA'
  | 'CREATE_TIPO'
  | 'UPDATE_TIPO'
  | 'DELETE_TIPO'
  | 'VIEW_TIPOS'
  | 'CREATE_TIPO_LANC'
  | 'UPDATE_TIPO_LANC'
  | 'DELETE_TIPO_LANC'
  | 'VIEW_TIPOS_LANC'
  | 'CREATE_CONDOMINIO'
  | 'UPDATE_CONDOMINIO'
  | 'DELETE_CONDOMINIO'
  | 'VIEW_CONDOMINIOS'
  | 'CREATE_BLOCO'
  | 'UPDATE_BLOCO'
  | 'DELETE_BLOCO'
  | 'VIEW_BLOCOS'
  | 'CREATE_IMOVEL'
  | 'UPDATE_IMOVEL'
  | 'DELETE_IMOVEL'
  | 'VIEW_IMOVELS'
  | 'CREATE_LOCATARIO'
  | 'UPDATE_LOCATARIO'
  | 'DELETE_LOCATARIO'
  | 'VIEW_LOCATARIOS'
  | 'CREATE_PESSOA'
  | 'UPDATE_PESSOA'
  | 'DELETE_PESSOA'
  | 'VIEW_PESSOAS'
  | 'CREATE_PROPRIETARIO'
  | 'UPDATE_PROPRIETARIO'
  | 'DELETE_PROPRIETARIO'
  | 'VIEW_PROPRIETARIOS'
  | 'CREATE_LOCACAO'
  | 'UPDATE_LOCACAO'
  | 'DELETE_LOCACAO'
  | 'VIEW_LOCACOES'
  | 'CREATE_LOCACAO_LANCAMENTO'
  | 'UPDATE_LOCACAO_LANCAMENTO'
  | 'DELETE_LOCACAO_LANCAMENTO'
  | 'VIEW_LOCACAO_LANCAMENTOS'
  | 'CREATE_CONDOMINIO_LANCAMENTO'
  | 'UPDATE_CONDOMINIO_LANCAMENTO'
  | 'DELETE_CONDOMINIO_LANCAMENTO'
  | 'VIEW_CONDOMINIO_LANCAMENTOS'
  | 'CREATE_PAGAMENTO'
  | 'UPDATE_PAGAMENTO'
  | 'DELETE_PAGAMENTO'
  | 'VIEW_PAGAMENTOS'
  | 'CREATE_MORADOR'
  | 'UPDATE_MORADOR'
  | 'DELETE_MORADOR'
  | 'VIEW_MORADORES'
  | 'CREATE_TIPO_ALERTA'
  | 'UPDATE_TIPO_ALERTA'
  | 'DELETE_TIPO_ALERTA'
  | 'VIEW_TIPOS_ALERTA'
  | 'CREATE_ALERTA'
  | 'UPDATE_ALERTA'
  | 'DELETE_ALERTA'
  | 'VIEW_ALERTAS'

  | 'CREATE_CLIENTE'
  | 'UPDATE_CLIENTE'
  | 'DELETE_CLIENTE'
  | 'VIEW_CLIENTES'
  | 'CREATE_LANCAMENTO_IMOVEL'
  | 'UPDATE_LANCAMENTO_IMOVEL'
  | 'DELETE_LANCAMENTO_IMOVEL'
  | 'VIEW_LANCAMENTOS_IMOVEIS'
  | 'CREATE_CONTA_CORRENTE'
  | 'UPDATE_CONTA_CORRENTE'
  | 'DELETE_CONTA_CORRENTE'
  | 'VIEW_CONTAS_CORRENTE'

  | 'CREATE_INSTRUCAO_COBRANCA'
  | 'UPDATE_INSTRUCAO_COBRANCA'
  | 'DELETE_INSTRUCAO_COBRANCA'
  | 'VIEW_INSTRUCOES_COBRANCA'

  //Instrução de recebimento
  | 'CREATE_INSTRUCAO_RECEBIMENTO'
  | 'UPDATE_INSTRUCAO_RECEBIMENTO'
  | 'DELETE_INSTRUCAO_RECEBIMENTO'
  | 'VIEW_INSTRUCOES_RECEBIMENTO'

  //Carteira de cobrança
  | 'CREATE_CARTEIRA_COBRANCA'
  | 'UPDATE_CARTEIRA_COBRANCA'
  | 'DELETE_CARTEIRA_COBRANCA'
  | 'VIEW_CARTEIRAS_COBRANCA'

  //Espécie de cobrança
  | 'CREATE_ESPECIE_COBRANCA'
  | 'UPDATE_ESPECIE_COBRANCA'
  | 'DELETE_ESPECIE_COBRANCA'
  | 'VIEW_ESPECIES_COBRANCA'

  //Banco
  | 'CREATE_BANCO'
  | 'UPDATE_BANCO'
  | 'DELETE_BANCO'
  | 'VIEW_BANCOS'

  //Tipo de juros
  | 'CREATE_TIPO_JUROS'
  | 'UPDATE_TIPO_JUROS'
  | 'DELETE_TIPO_JUROS'
  | 'VIEW_TIPOS_JUROS'

  //Tipo de multa
  | 'CREATE_TIPO_MULTA'
  | 'UPDATE_TIPO_MULTA'
  | 'DELETE_TIPO_MULTA'
  | 'VIEW_TIPOS_MULTA'

  //Tipo de desconto
  | 'CREATE_TIPO_DESCONTOS'
  | 'UPDATE_TIPO_DESCONTOS'
  | 'DELETE_TIPO_DESCONTOS'
  | 'VIEW_TIPOS_DESCONTOS'

  //Tipo de AUTORIZACAO
  | 'CREATE_TIPO_AUTORIZACAO'
  | 'UPDATE_TIPO_AUTORIZACAO'
  | 'DELETE_TIPO_AUTORIZACAO'
  | 'VIEW_TIPO_AUTORIZACAO'

  //Boleto bancario
  | 'CREATE_BOLETO_BANCARIO'
  | 'UPDATE_BOLETO_BANCARIO'
  | 'DELETE_BOLETO_BANCARIO'
  | 'VIEW_BOLETO_BANCARIO'

  //Grupo fluxo de caixa
  | 'CREATE_GRUPO_FLUXO_CAIXA'
  | 'UPDATE_GRUPO_FLUXO_CAIXA'
  | 'DELETE_GRUPO_FLUXO_CAIXA'
  | 'VIEW_GRUPO_FLUXO_CAIXA'

export const userPermissions: {
  [key in Permission]: string
} = {
  ALL: 'Todas as permissões',
  UPDATE_EMPRESA: 'Atualizar Empresa',
  VIEW_EMPRESAS: 'Visualizar Empresas',
  CREATE_TIPO: 'Criar tipos de imóvel',
  UPDATE_TIPO: 'Atualizar tipos de imóvel',
  DELETE_TIPO: 'Deletar tipos de imóvel',
  VIEW_TIPOS: 'Visualizar tipos de imóvel',
  CREATE_TIPO_LANC: 'Criar tipos de lançamento',
  UPDATE_TIPO_LANC: 'Atualizar tipos de lançamento',
  DELETE_TIPO_LANC: 'Deletar tipos de lançamento',
  VIEW_TIPOS_LANC: 'Visualizar tipos de lançamentos',
  CREATE_CONDOMINIO: 'Criar condomínio',
  UPDATE_CONDOMINIO: 'Atualizar condomínio',
  DELETE_CONDOMINIO: 'Deletar condomínio',
  VIEW_CONDOMINIOS: 'Visualizar condomínios',
  CREATE_BLOCO: 'Criar bloco',
  UPDATE_BLOCO: 'Atualizar bloco',
  DELETE_BLOCO: 'Deletar bloco',
  VIEW_BLOCOS: 'Visualizar blocos',
  CREATE_IMOVEL: 'Criar imóveis',
  UPDATE_IMOVEL: 'Atualizar imóveis',
  DELETE_IMOVEL: 'Deletar imóveis',
  VIEW_IMOVELS: 'Visualizar imóveis',
  CREATE_LOCATARIO: 'Criar locatários',
  UPDATE_LOCATARIO: 'Atualizar locatários',
  DELETE_LOCATARIO: 'Deletar locatários',
  VIEW_LOCATARIOS: 'Visualizar locatários',
  CREATE_PESSOA: 'Criar Pessoa',
  UPDATE_PESSOA: 'Atualizar Pessoa',
  DELETE_PESSOA: 'Deletar Pessoa',
  VIEW_PESSOAS: 'Visualizar Pessoas',
  CREATE_PROPRIETARIO: 'Criar proprietários',
  UPDATE_PROPRIETARIO: 'Atualizar proprietários',
  DELETE_PROPRIETARIO: 'Deletar proprietários',
  VIEW_PROPRIETARIOS: 'Visualizar proprietários',
  CREATE_LOCACAO: 'Criar locações',
  UPDATE_LOCACAO: 'Atualizar locações',
  DELETE_LOCACAO: 'Deletar locações',
  VIEW_LOCACOES: 'Visualizar locações',
  CREATE_LOCACAO_LANCAMENTO: 'Criar lançamento',
  UPDATE_LOCACAO_LANCAMENTO: 'Atualizar lançamento',
  DELETE_LOCACAO_LANCAMENTO: 'Deletar lançamento',
  VIEW_LOCACAO_LANCAMENTOS: 'Visualizar lançamentos',
  CREATE_CONDOMINIO_LANCAMENTO: 'Criar lançamento condomínio',
  UPDATE_CONDOMINIO_LANCAMENTO: 'Atualizar lançamento condomínio',
  DELETE_CONDOMINIO_LANCAMENTO: 'Deletar lançamento condomínio',
  VIEW_CONDOMINIO_LANCAMENTOS: 'Visualizar lançamentos condomínios',
  CREATE_PAGAMENTO: 'Criar pagamento',
  UPDATE_PAGAMENTO: 'Atualizar pagamento',
  DELETE_PAGAMENTO: 'Deletar pagamento',
  VIEW_PAGAMENTOS: 'Visualizar pagamentos',
  CREATE_MORADOR: 'Criar morador',
  UPDATE_MORADOR: 'Atualizar morador',
  DELETE_MORADOR: 'Deletar morador',
  VIEW_MORADORES: 'Visualizar moradores',
  CREATE_TIPO_ALERTA: 'Criar tipo alerta',
  UPDATE_TIPO_ALERTA: 'Atualizar tipo alerta',
  DELETE_TIPO_ALERTA: 'Deletar tipo alerta',
  VIEW_TIPOS_ALERTA: 'Visualizar tipos alertas',
  CREATE_ALERTA: 'Criar alerta',
  UPDATE_ALERTA: 'Atualizar alerta',
  DELETE_ALERTA: 'Deletar alerta',
  VIEW_ALERTAS: 'Visualizar alertas',

  CREATE_LANCAMENTO_IMOVEL: 'Criar lançamento imóvel',
  UPDATE_LANCAMENTO_IMOVEL: 'Atualizar lançamento imóvel',
  DELETE_LANCAMENTO_IMOVEL: 'Deletar lançamento imóvel',
  VIEW_LANCAMENTOS_IMOVEIS: 'Visualizar lançamentos imóveis',
  CREATE_CONTA_CORRENTE: 'Criar Conta corrente',
  UPDATE_CONTA_CORRENTE: 'Atualizar Conta corrente',
  DELETE_CONTA_CORRENTE: 'Deletar Conta corrente',
  VIEW_CONTAS_CORRENTE: 'Visualizar Contas corrente',

  CREATE_INSTRUCAO_COBRANCA: 'Visualizar Instrucao de Cobranca',
  UPDATE_INSTRUCAO_COBRANCA: 'Visualizar Instrucao de Cobranca',
  DELETE_INSTRUCAO_COBRANCA: 'Visualizar Instrucao de Cobranca',
  VIEW_INSTRUCOES_COBRANCA: 'Visualizar Instrucao de Cobranca',

  //Instrução de recebimento
  CREATE_INSTRUCAO_RECEBIMENTO: 'Visualizar Instrucao de Recebimento',
  UPDATE_INSTRUCAO_RECEBIMENTO: 'Visualizar Instrucao de Recebimento',
  DELETE_INSTRUCAO_RECEBIMENTO: 'Visualizar Instrucao de Recebimento',
  VIEW_INSTRUCOES_RECEBIMENTO: 'Visualizar Instrucao de Recebimento',

  //Carteira de cobrança
  CREATE_CARTEIRA_COBRANCA: 'Visualizar Carteira de Cobranca',
  UPDATE_CARTEIRA_COBRANCA: 'Visualizar Carteira de Cobranca',
  DELETE_CARTEIRA_COBRANCA: 'Visualizar Carteira de Cobranca',
  VIEW_CARTEIRAS_COBRANCA: 'Visualizar Carteira de Cobranca',

  //Espécie de cobrança
  CREATE_ESPECIE_COBRANCA: 'Visualizar Espécie de Cobranca',
  UPDATE_ESPECIE_COBRANCA: 'Visualizar Espécie de Cobranca',
  DELETE_ESPECIE_COBRANCA: 'Visualizar Espécie de Cobranca',
  VIEW_ESPECIES_COBRANCA: 'Visualizar Espécie de Cobranca',

  //Banco
  CREATE_BANCO: 'Visualizar Banco',
  UPDATE_BANCO: 'Visualizar Banco',
  DELETE_BANCO: 'Visualizar Banco',
  VIEW_BANCOS: 'Visualizar Banco',

  //Tipo de juros
  CREATE_TIPO_JUROS: 'Visualizar Tipo de Juros',
  UPDATE_TIPO_JUROS: 'Visualizar Tipo de Juros',
  DELETE_TIPO_JUROS: 'Visualizar Tipo de Juros',
  VIEW_TIPOS_JUROS: 'Visualizar Tipo de Juros',

  //Tipo de multa
  CREATE_TIPO_MULTA: 'Visualizar Tipo de Multa',
  UPDATE_TIPO_MULTA: 'Visualizar Tipo de Multa',
  DELETE_TIPO_MULTA: 'Visualizar Tipo de Multa',
  VIEW_TIPOS_MULTA: 'Visualizar Tipo de Multa',

  //Tipo de desconto
  CREATE_TIPO_DESCONTOS: 'Visualizar Tipo de Desconto',
  UPDATE_TIPO_DESCONTOS: 'Visualizar Tipo de Desconto',
  DELETE_TIPO_DESCONTOS: 'Visualizar Tipo de Desconto',
  VIEW_TIPOS_DESCONTOS: 'Visualizar Tipo de Desconto',

  //Tipo de AUTORIZACAO
  CREATE_TIPO_AUTORIZACAO: 'Visualizar Tipo de Autorização',
  UPDATE_TIPO_AUTORIZACAO: 'Visualizar Tipo de Autorização',
  DELETE_TIPO_AUTORIZACAO: 'Visualizar Tipo de Autorização',
  VIEW_TIPO_AUTORIZACAO: 'Visualizar Tipo de Autorização',

  //Boleto bancario
  CREATE_BOLETO_BANCARIO: 'Visualizar Boleto bancário',
  UPDATE_BOLETO_BANCARIO: 'Visualizar Boleto bancário',
  DELETE_BOLETO_BANCARIO: 'Visualizar Boleto bancário',
  VIEW_BOLETO_BANCARIO: 'Visualizar Boleto bancário',

  CREATE_CLIENTE: 'Criar clientes',
  UPDATE_CLIENTE: 'Atualizar clientes',
  DELETE_CLIENTE: 'Deletar clientes',
  VIEW_CLIENTES: 'Visualizar clientes',

  //Grupo fluxo de caixa
  CREATE_GRUPO_FLUXO_CAIXA: 'Visualizar Grupo de Fluxo de Caixa',
  UPDATE_GRUPO_FLUXO_CAIXA: 'Visualizar Grupo de Fluxo de Caixa',
  DELETE_GRUPO_FLUXO_CAIXA: 'Visualizar Grupo de Fluxo de Caixa',
  VIEW_GRUPO_FLUXO_CAIXA: 'Visualizar Grupo de Fluxo de Caixa'

}

export enum UserRole {
  ADMIN = 'ADMIN',
  COLLABORATOR = 'COLLABORATOR'
}
