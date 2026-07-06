export enum GarantiaLocacao {
  SEGURO_FIANCA = 'SEGURO_FIANCA',
  TITULO_CAPITALIZACAO = 'TITULO_CAPITALIZACAO',
  DEPOSITO_CALCAO = 'DEPOSITO_CALCAO',
  FIADOR = 'FIADOR',
}

export enum LocacaoStatus {
  ATIVA = 'ATIVA',
  ENCERRADA = 'ENCERRADA',
  AGUARDANDO_DOCUMENTOS = 'AGUARDANDO_DOCUMENTOS'
}

export enum LancamentoStatus {
  ABERTO = 'ABERTO',
  CONFIRMADO = 'CONFIRMADO',
}

export enum lancamentoTipo {
  DEBITO = 'DEBITO',
  CREDITO = 'CREDITO',
}

export enum BoletoStatus {
  PENDENTE = 'PENDENTE',
  CONFIRMADO = 'CONFIRMADO',  
  ATRASADO = 'ATRASADO',
  PAGO = 'PAGO',
  CANCELADO = 'CANCELADO',
  
}

export enum BoletoTipo {
  IMOVEL = 'IMOVEL',
  LOCACAO = 'LOCACAO',    
}

