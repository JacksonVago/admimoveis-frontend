export enum ROUTE {
  // Auth routes
  LOGIN = '/login',
  REGISTER = '/register',

  //escolha de planos
  BEMVINDO = '/bemvindo/:email',
  PLANOS = '/planos/:email',
  PLANO_ANUAL = '/plano/anual',
  PLANO_MENSAL = '/plano/mensal',
  PLANO_SEMESTRAL = '/plano/semestral',
  PLANO_TIPO = '/planos/tipo/:email/:plano',
  PLANO_PAGAMENTO = '/planos/pagamento/:email/:plano',

  // Main routes
  HOME = '/',
  SOBRE = '/sobre',

  // Configurações
  EMPRESA_DETALHES = '/empresas/:id',
  EMPRESA = '/empresas',

  // Condomínios routes
  CONDOMINIOS = '/condominios',
  CONDOMINIOS_CRIAR = '/condominios/criar',
  CONDOMINIOS_DETALHES = '/condominios/:id',

  // Blocos routes
  BLOCOS = '/blocos',
  BLOCOS_CRIAR = '/blocos/criar',
  BLOCOS_DETALHES = '/blocos/:id',

  // Imoveis routes
  IMOVEIS = '/imoveis',
  IMOVEIS_CRIAR = '/imoveis/criar',
  IMOVEIS_DETALHES = '/imoveis/:id',

  // Locações routes
  LOCACOES = '/locacoes',
  LOCACOES_CRIAR = '/locacoes/criar',
  LOCACOES_DETALHES = '/locacoes/:id',

  // Lancamentos Condomínios routes
  LANCAMENTOS_CONDOMINIOS = '/lancamentosCondominios',
  LANCAMENTOS_CONDOMINIOS_CRIAR = '/lancamentosCondominios/criar',
  LANCAMENTOS_CONDOMINIOS_DETALHES = '/lancamentosCondominios/:id',

  // Lancamentos Imóveis routes
  LANCAMENTOS_IMOVEIS = '/lancamentosImoveis',
  LANCAMENTOS_IMOVEIS_CRIAR = '/lancamentosImoveis/criar',
  LANCAMENTOS_IMOVEIS_DETALHES = '/lancamentosImoveis/:id',

  // Lancamentos Locações routes
  LANCAMENTOS = '/lancamentos',
  LANCAMENTOS_CRIAR = '/lancamentos/criar',
  LANCAMENTOS_DETALHES = '/lancamentos/:id',

  // Clientes routes
  CLIENTES = '/pessoas',
  CLIENTES_CRIAR = '/pessoas/criar',
  CLIENTES_DETALHES = '/pessoas/:id',

  // Proprietarios routes
  PROPRIETARIOS = '/proprietarios',
  PROPRIETARIOS_CRIAR = '/proprietarios/criar',
  PROPRIETARIOS_DETALHES = '/proprietarios/:id',

  //Locatarios routes
  LOCATARIOS = '/locatarios',
  LOCATARIOS_CRIAR = '/locatarios/criar',
  LOCATARIOS_DETALHES = '/locatarios/:id',

  //Colaboradores routes
  COLABORADORES = '/colaboradores',
  COLABORADORES_CRIAR = '/colaboradores/criar',
  COLABORADORES_DETALHES = '/colaboradores/:id',

  //TipoImovel routes
  TIPOIMOVEL = '/tipoimovel',
  TIPOIMOVEL_CRIAR = '/tipoimovel/criar',
  TIPOIMOVEL_DETALHES = '/tipoimovel/:id',

  //TipoLancamento routes
  TIPOLANCAMENTO = '/tipolancamento',
  TIPOLANCAMENTO_CRIAR = '/tipolancamento/criar',
  TIPOLANCAMENTO_DETALHES = '/tipolancamento/:id',

  //Pagamento routes
  PAGAMENTOS = '/pagamentos',
  PAGAMENTOS_CRIAR = '/pagamentos/criar',
  PAGAMENTOS_DETALHES = '/pagamentos/:id',

  //Repasse routes
  REPASSES = '/repasses',

  // Error routes
  NOT_FOUND = '*',
  UNAUTHORIZED = '/unauthorized'
}
