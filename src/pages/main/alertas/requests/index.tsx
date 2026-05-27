import { ConfiguracaoAlerta } from '@/interfaces/configuracaoalerta'
import { TipoAlerta } from '@/interfaces/tipoalerta'
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


//Consulta um alert Alerta
export const getAlerta = async (id: number): Promise<ConfiguracaoAlerta> => {
  try {
    const response = await api.get<ConfiguracaoAlerta>(`alertas/findbyid/${id}`)
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

//Criar alerta
export const createAlerta = async (data: FormData): Promise<ConfiguracaoAlerta> => {
  const response = await api.post<ConfiguracaoAlerta>(`/alertas`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data
}

//Altera bloco
export const updateAlerta = async (id: number, data: FormData): Promise<ConfiguracaoAlerta> => {
  const response = await api.put<ConfiguracaoAlerta>(`alertas/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data
}

export const getTipos = async (empresaId: number) => {
  return await api.get<TipoAlerta[]>('tipoalerta/' + empresaId)
}


export const getAlertasPag = async (empresaId: number, { page, limit, search, exclude }: GetAlertasParams) => {
  //const result =  await api.get<BasePaginationData<ConfiguracaoAlerta>>('alertas/' + empresaId.toString(), {
  const result = await api.get<ConfiguracaoAlerta[]>('alertas/' + empresaId.toString(), {
    params: {
      page,
      limit,
      search,
      exclude
    }
  });
  return result
}

