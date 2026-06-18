import { Banco } from '@/interfaces/banco'
import { CarteiraCobranca } from '@/interfaces/carteiracobranca'
import { ContaCorrente } from '@/interfaces/contacorrente'
import { EspecieCobranca } from '@/interfaces/especiecobranca'
import { InstrucaoCobranca } from '@/interfaces/instrucaocobranca'
import { InstrucaoRecebimentos } from '@/interfaces/instrucaorecebimentos'
import { TipoAutorizacaoCobranca } from '@/interfaces/tipoautorizacaocobranca'
import { TipoDescontoCobranca } from '@/interfaces/tipodescontocobranca'
import { TipoJurosCobranca } from '@/interfaces/tipojuroscobranca'
import { TipoMultaCobranca } from '@/interfaces/tipomultacobranca'
import api from '@/services/axios/api'
import { isAxiosError } from 'axios'

// Types
export interface GetAlertasParams {
  search?: string
  page?: number
  limit?: number
  exclude?: string
}

export interface BasePaginationData<T> {
  data: T[]
  page: number
  pageSize: number
  totalPages: number
  currentPosition: number
}


//Consulta uma conta corrente
export const getContaCorrente = async (id: number): Promise<ContaCorrente> => {
  try {
    const response = await api.get<ContaCorrente>(`contas-corrente/findbyid/${id}`)
    console.log(response);
    return response.data
  } catch (error) {
    console.log(error);
    if (isAxiosError(error) && error?.response?.status === 401) {
      // Token expired, logout
      console.log(error);
    }
    throw error;
  }
}

//Criar Conta Corrente
export const createContaCorrente = async (data: FormData): Promise<ContaCorrente> => {
  const response = await api.post<ContaCorrente>(`/contas-corrente`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data
}

//Altera Conta Corrente
export const updateContaCorrente = async (id: number, data: FormData): Promise<ContaCorrente> => {
  const response = await api.put<ContaCorrente>(`contas-corrente/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data
}

export const getBanco = async (BancoId: number) => {
  try {
    const result = await api.get<Banco[]>('bancos/' + BancoId)
    return result.data;
  }
  catch(error){
        if (isAxiosError(error)) {
      // Token expired, logout
      console.log(error);
    }
    throw error;
  }
}

export const getTipoJurosCobranca = async (BancoId: number) => {
  const result = await api.get<TipoJurosCobranca[]>('tipo-juros/' + BancoId)
  return result.data;
}

export const getTipoDescontoCobranca = async (BancoId: number) => {
  const result = await api.get<TipoDescontoCobranca[]>('tipo-descontos/' + BancoId)
  return result.data;
}

export const getTipoMultaCobranca = async (BancoId: number) => {
  const result = await api.get<TipoMultaCobranca[]>('tipo-multas/' + BancoId)
  return result.data;
}

export const getTipoAutorizacaoCobranca = async (BancoId: number) => {
  const result = await api.get<TipoAutorizacaoCobranca[]>('tipo-autorizacao/' + BancoId)
  return result.data;
}

export const getInstrucaoCobranca = async (BancoId: number) => {
  const result = await api.get<InstrucaoCobranca[]>('instrucao-cobranca/' + BancoId)
  return result.data;
}

export const getInstrucaoRecebimentos = async (BancoId: number) => {
  const result = await api.get<InstrucaoRecebimentos[]>('instrucao-recebimentos/' + BancoId)
  return result.data;
}

export const getCarteiraCobranca = async (BancoId: number) => {
  const result = await api.get<CarteiraCobranca[]>('carteira-cobranca/' + BancoId)
  return result.data;
}

export const getEspecieCobranca = async (BancoId: number) => {
  const result = await api.get<EspecieCobranca[]>('especie-cobranca/' + BancoId)
  return result.data;
}

export const getContasCorrentes = async (empresaId: number, { page, limit, search, exclude }: GetAlertasParams) => {
  const result = await api.get<BasePaginationData<ContaCorrente>>('contas-corrente/findmany/' + empresaId.toString(), {
    //const result = await api.get<ContaCorrente[]>('contas-corrente/findmany/' + empresaId.toString(), {
    params: {
      page,
      limit,
      search,
      exclude
    }
  });
  return result
}

