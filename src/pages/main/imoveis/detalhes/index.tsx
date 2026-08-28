import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { CircleDollarSign, Edit, Mail, Pencil, Phone, Plus, Search, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import * as z from 'zod'
import { useMediaQuery } from 'react-responsive'
import moment from "moment";

import { ROUTE } from '@/enums/routes.enum'
import { Imovel } from '@/interfaces/imovel'
import { BackendGarantiaLocacaoTypes, Locacao, LocacaoStatus } from '@/interfaces/locacao'
//import { Locatario } from '@/interfaces/locatario'
import { Proprietario } from '@/interfaces/proprietario'
import { PageLoader } from '@/pages/assistant/page-loader'
import { ImovelSchema, imovelSchema } from '@/schemas/imovel.schema'
import { locacaoSchema, LocacaoSchema } from '@/schemas/locacao.schema'
import api from '@/services/axios/api'
import { queryClient } from '@/services/react-query/query-client'
import { hasValues } from '@/utils/has-valuest'
import { transformNullToUndefined } from '@/utils/transform-null-to-undefined'
import { useNavigate, useParams } from 'react-router-dom'
import { ImovelForm } from '../criarImovel/components/imovel-form'
//import { useGetProprietariosSearchQueryOptions } from '../hooks/use-get-proprietarios-search-query-options'
import { BasePaginationData } from '../listarImoveis'
import ListarClientes from '../../clientes'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Pessoa } from '@/interfaces/pessoa'
import { PropImovelSchema, propImoveSchema } from '@/schemas/proprietario.schema'
import { BoletoStatus, GarantiaLocacao, LancamentoStatus } from '@/enums/locacao/enums-locacao'
import { Textarea } from '@/components/ui/textarea'
import { GARANTIA_LOCACAO_OPTIONS } from '@/constants/garantia-locacao'
import { STATUS_LOCACAO_OPTIONS } from '@/constants/status-locacao'
import { useGlobalParams, usePessoa } from '@/globals/GlobalParams'
import { useAuth } from '@/hooks/auth/use-auth'
import { usdFormatter } from '@/utils/format-money'
import { STATUS_LANCAMENTO_OPTIONS } from '@/constants/status-lancamentos'
import { getEnderecoFormatado } from '@/helpers/get-endereco-formatado'
import { lancamentoImovelSchema, LancamentoImovelSchema } from '@/schemas/lancamentos.schema'
import { LancamentoImovel } from '@/interfaces/lancamentoimovel'
import axios from 'axios'
import { TipoLancamento } from '@/interfaces/lancamentotipo'
import { Calc_DIG_Modulo } from '@/utils/pagseguro-ecrypt'

//REFACTOR: move to another directory
//const LOCATARIO_ERROR_MESSAGES = ['A location already exists for this property']
/*const mapLocatarioErrorMessages = (message?: string) => {
  if (!message) return message
  if (LOCATARIO_ERROR_MESSAGES.includes(message)) {
    return 'Já existe uma locação para este imóvel'
  }
  return message
}*/


const createLocacaoSchema = z.object({
  dataInicio: z.string().min(1, 'Data de início é obrigatória'),
  dataFim: z.string().optional(),
  valorAluguel: z.number().min(0, 'Valor do aluguel deve ser positivo')
  // locatarioId: z.number().min(1, 'Locatário é obrigatório'),
  // imovelId: z.number().min(1, 'Imóvel é obrigatório')
})

type CreateLocacaoSchema = z.infer<typeof createLocacaoSchema>
export interface CreateLocacaoData extends CreateLocacaoSchema {
  locatarioId: number
  imovelId: number
}

// Types
export const getTipos = async (empresaId: number) => {
  return await api.get<TipoLancamento[]>('tipolancamento/' + empresaId)
}


//Funções de acesso ao banco de dados
//Consulta imóvel
export const getImovel = async (id: number): Promise<Imovel> => {
  const response = await api.get<Imovel>(`imoveis/findbyid/${id}`)
  console.log('response', response);
  return response.data
}

//Altera imóvel
const updateImovel = async (id: number, data: FormData): Promise<Imovel> => {
  const response = await api.put<Imovel>(`imoveis/${id}`, data)
  return response.data
}

//Pesquisa proprietários
export const searchProprietarios = async (
  query: string
): Promise<BasePaginationData<Proprietario>> => {
  const response = await api.get<BasePaginationData<Proprietario>>('proprietarios', {
    params: { search: query }
  })
  return response.data
}

//Pesquisa locatários
/*const searchLocatarios = async (query: string): Promise<BasePaginationData<Locatario>> => {
  const response = await api.get<BasePaginationData<Locatario>>('locatarios', {
    params: { search: query }
  })
  return response.data
}*/

//Cria proprietário do imóvel
const createProprietario = async (data: FormData): Promise<void> => {
  await api.post<Proprietario>('/proprietarios', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

//Excluir proprietário do imóvel
const deleteProprietario = async (propriedadeId: number): Promise<void> => {
  await api.delete(`proprietarios/${propriedadeId}`)
}

//Alterar proprietário do imóvel
const updateProprietario = async (proprietarioId: number, data: FormData): Promise<void> => {
  api.put(`proprietarios/${proprietarioId}/`, data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

//Cria locação do imóvel
const createLocacao = async (data: FormData): Promise<void> => {
  await api.post<Proprietario>('/locacoes', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

//Excluir locação do imóvel
const deleteLocacao = async (locacaoId: number): Promise<void> => {
  console.log(locacaoId);

  await api.delete(`locacoes/${locacaoId}`)
  //await api.delete(`locacoes/locacao/${locacaoId}`)
}

//Alterar locação do imóvel
const updateLocacao = async (locacaoId: number, data: FormData): Promise<void> => {
  await api.put(`locacoes/${locacaoId}`, data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

//Valores default do imóvel
export const getFormattedDefaultValues = (imovel: Imovel | undefined) => {
  return {
    title: imovel?.title || undefined,
    status: imovel?.status || undefined,
    description: imovel?.description || undefined,
    tipo: imovel?.tipo,
    porcentagemLucroImobiliaria: imovel?.porcentagemLucroImobiliaria || undefined,
    valorAluguel: imovel?.valorAluguel || undefined,

    //address
    bairro: imovel?.endereco?.bairro || undefined,
    numero: imovel?.endereco?.numero || undefined,
    cep: imovel?.endereco?.cep || undefined,
    cidade: imovel?.endereco?.cidade || undefined,
    complemento: imovel?.endereco?.complemento || undefined,
    estado: imovel?.endereco?.estado || undefined,
    logradouro: imovel?.endereco?.logradouro || undefined
  }
}


export const DetalhesImovel = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isBigScreen = useMediaQuery({ query: '(min-width: 1424px)' })
  const isPortrait = useMediaQuery({ query: '(min-width: 1224px)' })
  const isTablet = useMediaQuery({ query: '(min-width: 746px)' })
  const isMobile = useMediaQuery({ query: '(min-width: 400px)' })

  const navigate = useNavigate()
  const dataParams = useParams<{ id: string }>()
  const id = dataParams.id ? parseInt(dataParams.id) : undefined
  const [isEditingPersonalInfo, setIsEditingPersonalInfo] = useState(false)
  const [activeTab, setActiveTab] = useState('personal-info')
  //const [proprietariosSearchQuery, setProprietariosSearchQuery] = useState('')
  //const [locatariosSearchQuery, setLocatariosSearchQuery] = useState('')
  //const [isCreateLocacaoOpen, setIsCreateLocacaoOpen] = useState(false)
  //const [selectedLocatario, setSelectedLocatario] = useState<Locatario | null>(null)
  const { toast } = useToast()

  const [propEdit, setPropEdit] = useState<Proprietario>();
  const [locEdit, setLocEdit] = useState<Locacao>();
  const [selGarantia, setSelGarantia] = useState<GarantiaLocacao>();
  const [selFiador, setSelFiador] = useState<boolean>(false);
  const [selPessoa, setSelPessoa] = useState<boolean>(false);
  const [openCli, setOpenCli] = useState<boolean>(false);
  const [openLoc, setOpenLoc] = useState<boolean>(false);
  const [loader, setLoader] = useState<boolean>(false);
  const [dataInicial, setdataInicial] = useState(moment(new Date()).format("YYYY-MM-DD"));
  const [dataFinal, setdataFinal] = useState(moment(new Date()).format("YYYY-MM-DD"));
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [titulo, setTitulo] = useState("Criar novo lançamento");
  const [isEditing, setIsEditing] = useState(false);
  const disabled = isEditing;

  //Globals
  const glb_params = useGlobalParams();
  const { pessoa } = usePessoa();

  //Mutations
  //Excluir imóveis
  const deleteImovelMutation = useMutation({
    mutationFn: (id: number) => api.delete(`imoveis/${id}`),
    onSuccess: () => {
      ;['imovel', id].forEach((key) =>
        queryClient.invalidateQueries({
          queryKey: [key]
        })
      )
      toast({ title: 'Imóvel excluído com sucesso' })
      navigate(ROUTE.IMOVEIS)
    },
    onError: () => {
      toast({ title: 'Erro ao excluir imóvel', variant: 'destructive' })
    }
  });

  //Altera Imóvel
  const updateMutation = useMutation({
    mutationFn: (data: FormData) => updateImovel(id!, data),
    onSuccess: () => {
      ;['imovel', id].forEach((key) =>
        queryClient.invalidateQueries({
          queryKey: [key]
        })
      )
      setLoader(false);
      toast({ title: 'Imóvel atualizado com sucesso' })
      setIsEditingPersonalInfo(false)
    },
    onError: () => {
      setLoader(false);
      toast({ title: 'Erro ao atualizar imóvel', variant: 'destructive' })
    }
  })

  //Criar proprietário
  const linkProprietarioMutation = useMutation({
    mutationFn: ({ data }: { data: FormData }) => createProprietario(data),
    onSuccess: () => {
      ;['imovel', id].forEach((key) =>
        queryClient.invalidateQueries({
          queryKey: [key]
        })
      );
      toast({ title: 'Proprietário vinculado com sucesso' });
      setOpenCli(false);
    },
    onError: () => {
      toast({ title: 'Erro ao vincular proprietário', variant: 'destructive' })
    }
  })

  //Excluir proprietário
  const unlinkProprietarioMutation = useMutation({
    mutationFn: (propriedadeId: number) => deleteProprietario(propriedadeId),
    onSuccess: () => {
      ['imovel', id].forEach((key) =>
        queryClient.invalidateQueries({
          queryKey: [key]
        })
      );
      toast({ title: 'Proprietário desvinculado com sucesso' })
    },
    onError: () => {
      toast({ title: 'Erro ao desvincular proprietário', variant: 'destructive' })
    }
  })

  //Alterar  proprietário
  const updateProprietarioMutation = useMutation({
    mutationFn: ({ propriedadeId, data }: { propriedadeId: number, data: FormData }) => updateProprietario(propriedadeId, data),
    onSuccess: () => {
      ['imovel', id].forEach((key) =>
        queryClient.invalidateQueries({
          queryKey: [key]
        })
      );
      toast({ title: 'Proprietário alterado com sucesso' })
    },
    onError: () => {
      toast({ title: 'Erro ao alterar proprietário', variant: 'destructive' })
    }
  })

  //Criar locação
  const createLocacaoMutation = useMutation({
    mutationFn: ({ data }: { data: FormData }) => createLocacao(data),
    onSuccess: () => {
      ;['imovel', id].forEach((key) =>
        queryClient.invalidateQueries({
          queryKey: [key]
        })
      );
      toast({ title: 'Locação criada com sucesso' });
      setOpenLoc(false);
    },
    onError: () => {
      toast({ title: 'Erro ao criar locação', variant: 'destructive' })
    }
  })

  //Excluir locação
  const deleteLocacaoMutation = useMutation({
    mutationFn: (locacaoId: number) => deleteLocacao(locacaoId),
    onSuccess: () => {
      ['imovel', id].forEach((key) =>
        queryClient.invalidateQueries({
          queryKey: [key]
        })
      );
      toast({ title: 'Locação excluida com sucesso' })
    },
    onError: () => {
      toast({ title: 'Erro ao excluir locação', variant: 'destructive' })
    }
  })

  //Alterar  locação
  const updateLocacaoMutation = useMutation({
    mutationFn: ({ locacaoId, data }: { locacaoId: number, data: FormData }) => updateLocacao(locacaoId, data),
    onSuccess: () => {
      ['imovel', id].forEach((key) =>
        queryClient.invalidateQueries({
          queryKey: [key]
        })
      );
      toast({ title: 'Locação alterada com sucesso' })
    },
    onError: () => {
      toast({ title: 'Erro ao alterar locação', variant: 'destructive' })
    }
  })

  // const [selectedEndLocacaoId, setSelectedEndLocacaoId] = useState<number>()

  //Pesquisa proprietário
  /*const { data: proprietariosSearchResultsData } = useQuery(
    useGetProprietariosSearchQueryOptions(proprietariosSearchQuery)
  )*/

  //Pesquisa proprietário
  /*const proprietariosSearchResults = proprietariosSearchResultsData?.data?.filter(
    (proprietario) => !imovel?.proprietarios?.some((p) => p.id === proprietario.id)
  )

  //Pesquisa locatários
  const { data: locatariosSearchResultsData } = useQuery({
    queryKey: ['locatarios', locatariosSearchQuery],
    queryFn: () => searchLocatarios(locatariosSearchQuery),
    enabled: !!locatariosSearchQuery
  })*/

  //Pesquisa locatários
  /*const locatariosSearchResults = locatariosSearchResultsData?.data?.filter(
    (locatario) => !imovel?.locacoes?.some((l) => l.id === locatario.id)
  )*/

  //Consulta imóvel
  const {
    data: imovel,
    isLoading,
    isSuccess
  } = useQuery({
    queryKey: ['imovel', id],
    queryFn: () => getImovel(id!)
  });

  //Tipos de garantia
  const mappGarantyType = (
    type: string
  ): 'fiador' | 'titulo-capitalizacao' | 'seguro-fianca' | 'deposito-calcao' | undefined => {
    if (type === BackendGarantiaLocacaoTypes.FIADOR) return 'fiador'
    if (type === BackendGarantiaLocacaoTypes.DEPOSITO_CALCAO) return 'deposito-calcao'
    if (type === BackendGarantiaLocacaoTypes.TITULO_CAPITALIZACAO) return 'titulo-capitalizacao'
    if (type === BackendGarantiaLocacaoTypes.SEGURO_FIANCA) return 'seguro-fianca'
    return undefined
  }

  //Imagems do imóvel
  const { data: imageFiles, isLoading: isLoadingImages } = useQuery({
    queryKey: ['imovelPhotos', id, imovel?.imovelPhotos],
    queryFn: () => fetchImageFiles(imovel?.imovelPhotos),
    enabled: !!imovel?.imovelPhotos?.length
  })

  //Leitura das imagens
  const fetchImageFiles = async (imovelPhotos: Imovel['imovelPhotos']) => {
    if (!imovelPhotos) return []

    const imageFilesPromises = imovelPhotos.map(async (image) => {
      try {
        /*const response = await fetch(
          'https://jrseqfittadsxfbmlwvz.supabase.co/storage/v1/object/public/' + image.url
        )*/

        console.log('link', import.meta.env.VITE_AZURE_BLOB_CONTAINER + image.url);
        const response = await fetch(
          import.meta.env.VITE_AZURE_BLOB_CONTAINER + image.url
        )
        console.log('response', response);
        if (!response.ok) {
          throw new Error(`Erro ao buscar imagem: ${image.url}, Status: ${response.status}`)
        }
        const blob = await response.blob()

        const file = new File([blob], image.url, { type: blob.type })
        //const file = new File([blob], image.url, { type: 'application/png' })
        console.log('blob', file);
        return {
          file,
          preview: URL.createObjectURL(file),
          id: image.id
        }
      } catch (error) {
        console.error('Erro ao processar imagem:', error)
        return null
      }
    })
    const resolvedImages = await Promise.all(imageFilesPromises)
    return resolvedImages.filter(Boolean)
  }

  //Consulta Tipo lanacmento
  const {
    data: tipolancamento
  } = useQuery({
    queryKey: ['tipolancamento'],
    queryFn: () => getTipos(glb_params.id_empresa ? Number(glb_params.id_empresa) : 0),
  });


  //remove null values from object
  const parsedData = transformNullToUndefined(imovel || {})
  console.log('parsedData', imovel);

  //remove null values from object endereço
  const enderecoData = transformNullToUndefined(imovel?.endereco || {})

  const defaultValuesImovel = {
    ...parsedData,
    //tipoId: imovel?.tipo.name,
    empresaId: imovel?.empresaId,
    logradouro: enderecoData?.logradouro,
    numero: enderecoData?.numero ? enderecoData.numero : undefined,
    complemento: enderecoData?.complemento,
    bairro: enderecoData?.bairro,
    cidade: enderecoData?.cidade,
    cep: enderecoData?.cep,
    estado: enderecoData?.estado,
    images: imageFiles,
    condominioId: imovel?.condominioId ? imovel?.condominioId : undefined,
    blocoId: imovel?.blocoId,
    condominioBloco: (imovel?.condominioId && imovel?.blocoId) ? imovel?.condominioId.toString() + ';' + imovel?.blocoId.toString() : undefined,
    imovelPhotos: imageFiles,
  }

  //default values
  const defaultValuesLan = useMemo(
    () => ({
      id: 0,
      imovelId: imovel?.id,
      dataLancamento: moment.utc(new Date()).format("YYYY-MM-DD"),
      vencimentoLancamento: moment.utc(new Date()).format("YYYY-MM-DD"),
      parcela: 1,
      status: LancamentoStatus.ABERTO,
    }),
    [imovel]
  )


  //Dados do imóvel schema de validação
  const imovelMethods = useForm<ImovelSchema>({
    resolver: zodResolver(imovelSchema),
    mode: 'all',
    defaultValues: defaultValuesImovel
  })

  console.log(imovelMethods.getValues());

  //Dados do proprietário schema de validação
  const imovelProp = useForm<PropImovelSchema>({
    resolver: zodResolver(propImoveSchema),
  });

  //Alteração Dados do proprietário schema de validação
  const imovelPropAlt = useForm<PropImovelSchema>({
    resolver: zodResolver(propImoveSchema),
  });

  //Proprietário lista 
  const {
    control: CTLimovelProp,
  } = imovelProp;

  const imovelPropers = useFieldArray({
    control: CTLimovelProp,
    name: 'proprietarios'
  });

  //react hook form
  const lancamentoMethods = useForm<LancamentoImovelSchema>({
    resolver: zodResolver(lancamentoImovelSchema),
    defaultValues: defaultValuesLan,
    mode: 'all'
  });

  useEffect(() => {
    //setProprietariosSearchQuery('');
    //setLocatariosSearchQuery('');
    glb_params.updTitle_form('Imóveis');
    if (imovel && locacaoAtiva) {
      //set the default values for the form
      transformNullToUndefined(locacaoAtiva)
    }

    if (glb_params.pastaOrig === '') {
      glb_params.updPastaOrig('personal-info');
    }
    else {
      //setActiveTab(glb_params.pastaOrig);
    }

    //Quando vem da tela de criação de clientes chama função para carregar a tela correta (proprietários ou locatários)
    if (pessoa !== null && (pessoa !== undefined && pessoa[0] !== undefined) && imovelPropers.fields.length === 0) {
      console.log('carrega proprietario');
      console.log(pessoa[0]);
      handleSelectProp(pessoa[0]);
    }
    else {
      if (glb_params.pastaOrig === '') {
        glb_params.updPastaOrig('personal-info');
      }
    }

  }, [])

  useEffect(() => {
    if (isSuccess) {
      console.log('reset');
      imovelMethods.reset(defaultValuesImovel)
    }

  }, [isSuccess, imageFiles])

  useEffect(() => {
    if (imovel?.condominioId && imovel?.blocoId) {
      imovelMethods.setValue("condominioBloco", imovel?.condominioId.toString() + ';' + imovel?.blocoId.toString())
    }
  }, [defaultValuesImovel])

  //Validade dados do imóvel no caso de alteração
  const onSubmitImovelData = (data: ImovelSchema) => {
    setLoader(true);
    // Verifica se existem imagens novas ou se todas as imagens foram removidas

    // const newImages = data?.images?.find((imgData) => {
    //   imgData?.id
    // })
    const imagesToDeleteIds = data?.imagesToDeleteIds;
    const newImages = data?.images?.filter((image: any) => !image.id) || []
    const documentosToDeleteIds = data?.documentosToDeleteIds;
    const newDocs = data?.documentos?.filter((doc: any) => !doc.id) || []
    //if images are the same, we can send an empty array

    //form data
    const form = new FormData()

    if (data.description) {
      form.append('description', data.description)
    }
    if (data.tipoId) {
      form.append('tipoId', data.tipoId.toString())
    }
    if (data.status) {
      form.append('status', data.status)
    }
    if (data.finalidade) {
      form.append('finalidade', data.finalidade)
    }
    if (hasValues(data.porcentagemLucroImobiliaria ? data.porcentagemLucroImobiliaria : "")) {
      form.append('porcentagemLucroImobiliaria', data.porcentagemLucroImobiliaria ? data.porcentagemLucroImobiliaria.toString() : "")
    }
    if (data.valorAluguel) {
      form.append('valorAluguel', data.valorAluguel.toString())
    }

    if (data.metragem) {
      form.append('metragem', data.metragem.toString())
    }
    if (data.quartos) {
      form.append('quartos', data.quartos.toString())
    }
    if (data.banheiros) {
      form.append('banheiros', data.banheiros.toString())
    }
    if (data.vagasEstacionamento) {
      form.append('vagasEstacionamento', data.vagasEstacionamento.toString())
    }
    if (data.andar) {
      form.append('andar', data.andar.toString())
    }

    if (data.logradouro) {
      form.append('logradouro', data.logradouro)
    }

    if (data.numero) {
      form.append('numero', data.numero.toString())
    }

    if (data.complemento) {
      form.append('complemento', data.complemento)
    }

    if (data.bairro) {
      form.append('bairro', data.bairro)
    }

    if (data.cidade) {
      form.append('cidade', data.cidade)
    }

    if (data.cep) {
      form.append('cep', data.cep)
    }

    if (data.estado) {
      form.append('estado', data.estado)
    }

    if (data.empresaId) {
      form.append('empresaId', data.empresaId.toString())
    }

    newImages?.forEach((image: any) => {
      if (image?.file) {
        form.append('images[]', image.file)
      }
      // form.append('images', image.file)
    })

    if (imagesToDeleteIds) {
      imagesToDeleteIds.forEach((id) => {
        if (id) {
          form.append('imagesToDeleteIds[]', id.toString())
        }
      })
    }

    newDocs?.forEach((doc: any) => {
      if (doc?.file) {
        form.append('documentos[]', doc.file)
      }
    })


    if (documentosToDeleteIds) {
      console.log(documentosToDeleteIds);
      documentosToDeleteIds.forEach((docId: any) => {
        form.append('documentosToDeleteIds[]', docId.toString())
      })
    }

    updateMutation.mutate(form)
  }

  //Locação
  const locacaoAtiva = imovel?.locacoes?.find((locacao) => locacao.status === 'ATIVA')

  const initialDefaultValues = {
    dataFim: (locacaoAtiva?.dataFim ? moment(locacaoAtiva?.dataInicio).format("DD/MM/YYYY") : moment(new Date()).format("DD/MM/YYYY")),
    dataInicio: (locacaoAtiva?.dataInicio ? moment(locacaoAtiva?.dataInicio).format("DD/MM/YYYY") : moment(new Date()).format("DD/MM/YYYY")),
    valorAluguel: locacaoAtiva?.valorAluguel,
    diaVencimento: locacaoAtiva?.diaVencimento,
    status: locacaoAtiva?.status,
    garantiaLocacaoTipo: locacaoAtiva?.garantiaLocacaoTipo
      ? mappGarantyType(locacaoAtiva.garantiaLocacaoTipo)
      : 'fiador',
    imovelId: locacaoAtiva?.imovelId,
    locatarios: locacaoAtiva?.locatarios?.map((locatario) => {
      return { nome: locatario.pessoa?.nome, id: locatario.pessoaId }
    }),
    fiadores: locacaoAtiva?.fiadores?.map((fiador) => {
      return { nome: fiador.pessoa?.nome, id: fiador.pessoaId }
    }),
    imoveis: [{ nome: locacaoAtiva?.imovel?.description, id: locacaoAtiva?.imovel?.id }],
    tituloCap: { numeroTitulo: locacaoAtiva?.garantiaTituloCapitalizacao?.numeroTitulo },
    seguroFianca: { numeroSeguro: locacaoAtiva?.garantiaSeguroFianca?.numeroSeguro },
    depCalcao: {
      valorDeposito: locacaoAtiva?.garantiaDepositoCalcao?.valorDeposito,
      quantidadeMeses: locacaoAtiva?.garantiaDepositoCalcao?.quantidadeMeses
    },
    documentos: locacaoAtiva?.documentos,
  }


  //Dados da locação schema de validação
  const locacaoMethods = useForm<LocacaoSchema>({
    resolver: zodResolver(locacaoSchema),
    mode: 'all',
    defaultValues: initialDefaultValues
  });

  //Dados da locação schema de validação
  const locacaoMethodsAlt = useForm<LocacaoSchema>({
    resolver: zodResolver(locacaoSchema),
  })

  /*const {
    control: CTLlocacaoMethods,
    handleSubmit,
    formState: { errors },
  } = locacaoMethods;*/

  const {
    control: CTLlocacaoMethods,
  } = locacaoMethods;

  //Lista de Fiadores
  const locacaoFiadores = useFieldArray({
    control: CTLlocacaoMethods,
    name: 'fiadores'
  });

  //Lista de locatários
  const imovelLocatarios = useFieldArray({
    control: CTLlocacaoMethods,
    name: 'locatarios'
  });

  //Validação dos formuláriose e eventos

  //Validação dos dados do proprietário
  function handleSubmitProprietario(data: PropImovelSchema) {
    console.log(data);

    const formData = new FormData();

    if (imovelPropers.fields.length === 0) {
      imovelProp.setValue('pessoaId', 0);
      return false;
    }
    else {
      imovelProp.setValue('pessoaId', imovelPropers.fields[0].id);
    }

    formData.append('imovelId', (id!! ? id.toString() : '0'));
    formData.append('cotaImovel', (data.cotaImovel ? data.cotaImovel.toString() : ""));
    formData.append('pessoaId', (data.pessoaId ? data.pessoaId.toString() : ""));

    linkProprietarioMutation.mutate({ data: formData });
  }

  //Novo proprietário
  const handlerNewProp = () => {
    imovelProp.reset();
    imovelProp.setValue('imovelId', id!);
    if (imovelPropers.fields.length > 0) {
      imovelPropers.remove(0);
    }
    setOpenCli(!openCli);
  }

  //Edição de proprietário
  const handlerEditProprietario = (proprietario: Proprietario) => {
    if (proprietario) {
      imovelPropAlt.reset();
      if (imovelPropers.fields.length > 0) {
        imovelPropers.remove(0);
      }
      setPropEdit(proprietario);
      imovelPropAlt.setValue('pessoaId', proprietario.pessoaId);
      imovelPropAlt.setValue('imovelId', proprietario.imovelId);
      imovelPropAlt.setValue('cotaImovel', proprietario.cotaImovel);
      imovelPropAlt.setValue('proprietarios', (proprietario.pessoa ? [{ nome: proprietario.pessoa?.nome, id: proprietario.pessoaId }] : []));
      imovelPropers.append((proprietario.pessoa ? [{ nome: proprietario.pessoa?.nome, id: proprietario.pessoaId }] : []));
    }
  }

  //Exclusão de proprietário
  const handleDeleteProprietario = (proprietario: Proprietario) => {
    unlinkProprietarioMutation.mutate(proprietario.id);
  }

  //Alteração de proprietário
  function handlerUpdateProprietario(data: PropImovelSchema) {
    const formData = new FormData();

    if (propEdit) {
      formData.append('id', propEdit.id.toString());
      formData.append('cotaImovel', (data.cotaImovel ? data.cotaImovel.toString() : ""));
      formData.append('pessoaId', (data.pessoaId ? data.pessoaId.toString() : ""));
      formData.append('imovelId', propEdit.imovelId.toString());

      console.log(formData);

      updateProprietarioMutation.mutate({ propriedadeId: propEdit.id, data: formData })
    }

  }

  //Retorno ao selecionar o propriétario/locatário/fiador
  const handleSelectProp = (proprietario: Pessoa | undefined) => {

    if (proprietario) {

      switch (glb_params.pastaOrig) {
        case 'proprietarios':
          if (imovelPropers.fields.length === 0) {
            imovelPropers.append({
              nome: proprietario.nome,
              id: proprietario.id
            });
            imovelPropers.fields.map((item, index) => {
              console.log(item.nome);
              console.log(index);
            })
            imovelProp.setValue('pessoaId', proprietario.id);
            imovelProp.setValue('imovelId', id!);
          }
          if (glb_params.origin_url === 'imoveis') {
            setOpenCli(true);
          }
          break;

        case 'locacoes':

          if (imovelLocatarios.fields.length === 0) {
            imovelLocatarios.append({
              nome: proprietario.nome,
              id: proprietario.id
            });
            imovelLocatarios.fields.map((item, index) => {
              console.log(item.nome);
              console.log(index);
            })

            locacaoMethods.setValue('status', LocacaoStatus.AGUARDANDO_DOCUMENTOS);
            locacaoMethods.setValue('imovelId', (id! ? id : 0));
            locacaoMethods.setValue('valorAluguel', (imovel?.valorAluguel ? imovel?.valorAluguel : 0))
            //locacaoMethods.setValue('pessoaId', proprietario.id);
            locacaoMethods.setValue('imovelId', id!);
          }
          if (glb_params.origin_url === 'imoveis') {
            setOpenLoc(true);
          }
          break;
      }
      setActiveTab(glb_params.pastaOrig);
    }


    setSelPessoa(false);
  }

  const handlerDetailProp = (id: number) => {
    navigate(`${ROUTE.CLIENTES}/${id}`)
  }

  //Locação
  /*const handlerNewLoc = () => {
    if (imovelLocatarios.fields.length > 0) {
      imovelLocatarios.remove(0);
    }

    locacaoMethods.reset();
    locacaoMethods.setValue('status', LocacaoStatus.AGUARDANDO_DOCUMENTOS);
    locacaoMethods.setValue('imovelId', (id! ? id : 0));
    locacaoMethods.setValue('valorAluguel', (imovel?.valorAluguel ? imovel?.valorAluguel : 0))
    setOpenLoc(!openLoc);
  }*/

  const handlerEditLocacao = (locacao: Locacao) => {
    if (locacao) {
      console.log(locacao);
      locacaoMethodsAlt.reset();
      setLocEdit(locacao);
      if (imovelLocatarios.fields.length > 0) {
        imovelLocatarios.remove(0);
      }
      if (locacaoFiadores.fields.length > 0) {
        locacaoFiadores.remove(0);
      }
      locacaoMethodsAlt.setValue('locatarios', (locacao.locatarios ? locacao.locatarios.map(x => { return { id: x.id, nome: (x.pessoa ? x.pessoa?.nome : '') } }) : []));
      locacaoMethodsAlt.setValue('dataInicio', moment(locacao.dataInicio).format("YYYY-MM-DD"));
      locacaoMethodsAlt.setValue('dataFim', moment(locacao.dataFim).format("YYYY-MM-DD"));
      locacaoMethodsAlt.setValue('valorAluguel', locacao.valorAluguel);
      locacaoMethodsAlt.setValue('diaVencimento', locacao.diaVencimento);
      locacaoMethodsAlt.setValue('status', locacao.status);
      locacaoMethodsAlt.setValue('garantiaLocacaoTipo', locacao.garantiaLocacaoTipo);
      locacaoMethodsAlt.setValue('depCalcao.quantidadeMeses', (locacao.garantiaDepositoCalcao?.quantidadeMeses ? locacao.garantiaDepositoCalcao?.quantidadeMeses : 0));
      locacaoMethodsAlt.setValue('depCalcao.valorDeposito', (locacao.garantiaDepositoCalcao?.valorDeposito ? locacao.garantiaDepositoCalcao?.valorDeposito : 0));
      locacaoMethodsAlt.setValue('seguroFianca.numeroSeguro', (locacao.garantiaSeguroFianca?.numeroSeguro ? locacao.garantiaSeguroFianca?.numeroSeguro : '0'));
      locacaoMethodsAlt.setValue('tituloCap.numeroTitulo', (locacao.garantiaTituloCapitalizacao?.numeroTitulo ? locacao.garantiaTituloCapitalizacao?.numeroTitulo : '0'));
      locacaoMethodsAlt.setValue('imovelId', locacao.imovelId);
      locacaoMethodsAlt.setValue('fiadores', (locacao.fiadores ? locacao.fiadores.map(x => { return { id: x.id, nome: (x.pessoa ? x.pessoa?.nome : '') } }) : []));
      imovelLocatarios.append((locacao.locatarios ? locacao.locatarios.map(x => { return { id: x.id, nome: (x.pessoa ? x.pessoa?.nome : '') } }) : []));
      locacaoFiadores.append((locacao.fiadores ? locacao.fiadores.map(x => { return { id: x.id, nome: (x.pessoa ? x.pessoa?.nome : '') } }) : []));
      setSelGarantia(locacao.garantiaLocacaoTipo);
      console.log(locacaoMethodsAlt.getValues('locatarios'));
    }
  }

  const handleDeleteLocacao = (locacao: Locacao) => {
    console.log(locacao);
    deleteLocacaoMutation.mutate(locacao.id);
  }

  function handlerUpdateLocacao(data: LocacaoSchema) {
    const formData = new FormData();

    console.log(locEdit);
    console.log(data);

    if (locEdit) {
      locacaoMethodsAlt.setValue('dataInicio', data.dataInicio);
      locacaoMethodsAlt.setValue('dataFim', moment(data.dataFim).format("YYYY-MM-DD"));
      locacaoMethodsAlt.setValue('valorAluguel', data.valorAluguel);
      locacaoMethodsAlt.setValue('status', data.status);
      locacaoMethodsAlt.setValue('garantiaLocacaoTipo', data.garantiaLocacaoTipo);
      locacaoMethodsAlt.setValue('imovelId', data.imovelId);
      locacaoMethodsAlt.setValue('fiadores', (data.fiadores ? data.fiadores.map(x => { return { id: x.id, nome: x.nome } }) : []));
      locacaoMethodsAlt.setValue('tituloCap.numeroTitulo', (data.tituloCap?.numeroTitulo ? data.tituloCap?.numeroTitulo.toString() : '0'));
      locacaoMethodsAlt.setValue('seguroFianca.numeroSeguro', (data.seguroFianca?.numeroSeguro ? data.seguroFianca?.numeroSeguro.toString() : '0'));
      locacaoMethodsAlt.setValue('depCalcao.valorDeposito', (data.depCalcao?.valorDeposito ? data.depCalcao?.valorDeposito : 0));
      locacaoMethodsAlt.setValue('depCalcao.quantidadeMeses', (data.depCalcao?.quantidadeMeses ? data.depCalcao?.quantidadeMeses : 0));
      //locacaoMethodsAlt.setValue('pessoaId', (data.pessoaId! ? data.pessoaId : 0));

      console.log(formData);

      updateLocacaoMutation.mutate({ locacaoId: locEdit.id, data: formData });
    }

  }

  function handleSubmitLocacao(data: LocacaoSchema) {
    const formData = new FormData();

    console.log(JSON.stringify(data));


    formData.append('dataInicio', data.dataInicio);
    formData.append('dataFim', moment(data.dataFim).format("YYYY-MM-DD"));
    formData.append('valorAluguel', (data.valorAluguel ? data.valorAluguel.toString() : "0"));
    formData.append('status', data.status);
    formData.append('imovelId', (data.imovelId ? data.imovelId.toString() : '0'));
    formData.append('diaVencimento', (data.diaVencimento ? data.diaVencimento.toString() : "0"));
    formData.append('garantiaLocacaoTipo', data.garantiaLocacaoTipo);
    formData.append('fiador', (data.fiadores ? data.fiadores.map(x => { return x.id; }).toString() : ''));
    formData.append('numeroTitulo', (data.tituloCap?.numeroTitulo ? data.tituloCap?.numeroTitulo.toString() : '0'));
    formData.append('numeroSeguro', (data.seguroFianca?.numeroSeguro ? data.seguroFianca?.numeroSeguro.toString() : '0'));
    formData.append('valorDeposito', (data.depCalcao?.valorDeposito ? data.depCalcao?.valorDeposito.toString() : '0'));
    formData.append('quantidadeMeses', (data.depCalcao?.quantidadeMeses ? data.depCalcao?.quantidadeMeses.toString() : '0'));
    //formData.append('pessoaId', (data.pessoaId! ? data.pessoaId.toString() : '0'));

    console.log(formData.values());

    createLocacaoMutation.mutate({ data: formData });
  }

  const handlerDetailPessoa = (id: number) => {
    navigate(`${ROUTE.CLIENTES}/${id}`)
  }

  const handleSelectFiador = (fiador: Pessoa | undefined) => {
    //let fiador: Pessoa[] = fiadores?.filter((x: any) => x.id === fiadorId)
    if (fiador) {
      setSelFiador(false);
      locacaoFiadores.append({
        nome: fiador.nome,
        id: fiador.id
      });
    }
  }

  const handlerChangeGarantia = (e: GarantiaLocacao) => {
    let bol_limpa = {
      fiador: true,
      calcao: true,
      seguro: true,
      titulo: true,
    };

    setSelGarantia(e);
    console.log(e);

    locacaoMethods.setValue('garantiaLocacaoTipo', e);

    switch (e) {
      case GarantiaLocacao.DEPOSITO_CALCAO:
        bol_limpa.calcao = false;
        bol_limpa.fiador = true;
        bol_limpa.seguro = true;
        bol_limpa.titulo = true;
        break;

      case GarantiaLocacao.FIADOR:
        bol_limpa.calcao = true;
        bol_limpa.fiador = false;
        bol_limpa.seguro = true;
        bol_limpa.titulo = true;
        break;

      case GarantiaLocacao.SEGURO_FIANCA:
        bol_limpa.calcao = true;
        bol_limpa.fiador = true;
        bol_limpa.seguro = false;
        bol_limpa.titulo = true;
        break;

      case GarantiaLocacao.TITULO_CAPITALIZACAO:
        bol_limpa.calcao = true;
        bol_limpa.fiador = true;
        bol_limpa.seguro = true;
        bol_limpa.titulo = false;
        break;
    }

    //limpa fiador
    if (bol_limpa.fiador) {
      if (locacaoFiadores.fields.length > 0) {
        for (let i = 0; i < locacaoFiadores.fields.length; i++) {
          locacaoFiadores.remove(i);
        }
      }
      setSelFiador(false);
    }
    else {
      setSelFiador(true);
    }

    if (bol_limpa.calcao) {
      locacaoMethods.setValue('depCalcao.valorDeposito', 0);
      locacaoMethods.setValue('depCalcao.quantidadeMeses', 0);
    }

    if (bol_limpa.seguro) {
      locacaoMethods.setValue('seguroFianca.numeroSeguro', '0');
    }

    if (bol_limpa.titulo) {
      locacaoMethods.setValue('tituloCap.numeroTitulo', '0');
    }

  }
  const handlerSelProp = (origin: string) => {

    glb_params.updOrigin_url("imoveis");
    console.log('seleciona ' + origin);
    switch (origin) {
      case 'proprietarios':
        if (imovelPropers.fields.length > 0) {
          imovelPropers.remove(0);
        }
        break;

      case 'locacoes':
        if (imovelLocatarios.fields.length > 0) {
          imovelLocatarios.remove(0);
        }
        break;
    }
    setSelPessoa(true);

  }

  const handlerChangeFolder = (folder: string) => {
    glb_params.updOrigin_url("imoveis");
    glb_params.updId_orig((id! ? id : 0).toString());
    glb_params.updPastaOrig(folder);
    setActiveTab(folder);
  }

  const handlerChangeStatus = (status: string) => {
    navigate({
      search: `?status=${status}`
    })
  }

  const createLancamento = useMutation({
    mutationFn: async (data: FormData) => {

      return await api.post<LancamentoImovel>(`/lancamentosimoveis`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },
    onSuccess: () => {
      ['imovel', id].forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] })
      })
    }
  })

  const updateLancamento = useMutation({
    mutationFn: async (data: FormData) => {
      return await api.put<LancamentoImovel>(`/lancamentosimoveis/${data.get('id')}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },
    onSuccess: () => {
      ['imovel', id].forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] })
      })
    }
  })

  const handleDeleteLancamento = (idLancamento: number) => {
    deleteLancamento.mutate(idLancamento);
  }

  const deleteLancamento = useMutation({
    mutationFn: async (idLancamento: number) => {
      return await api.delete(`/lancamentosimoveis/${idLancamento}`)
    },
    onSuccess: () => {
      ['imovel', id].forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] })
      })

      toast({
        title: 'Lançamento excluído com sucesso',
        description: `Lançamento excluído com sucesso`
      })
    }
  });

  const onSubmitLancamentoDataLan = async (data: LancamentoImovelSchema) => {
    try {
      const form = new FormData()

      if (data?.linhaDigitavel) {
        form.append('linhaDigitavel', data.linhaDigitavel)
      }


      if (data?.dataLancamento) {
        form.append('dataLancamento', data.dataLancamento)
      }

      if (data?.vencimentoLancamento) {
        form.append('vencimentoLancamento', data.vencimentoLancamento)
      }

      if (data?.valorLancamento) {
        form.append('valorLancamento', data.valorLancamento.toString())
      }

      if (data?.parcela) {
        form.append('parcela', data.parcela.toString())
      }

      if (data?.observacao) {
        form.append('observacao', data.observacao)
      }

      if (data?.status) {
        form.append('status', data.status)
      }

      if (data?.tipoId) {
        form.append('tipoId', data.tipoId.toString())
      }

      if (data?.imovelId) {
        form.append('imovelId', data.imovelId.toString())
      }

      form.append('id', data.id.toString())

      if (titulo === "Criar novo lançamento") {
        await createLancamento.mutateAsync(form)
      }
      else {
        await updateLancamento.mutateAsync(form)
      }

      toast({
        title: 'Lancamento atualizado com sucesso',
        description: `Lancamento atualizado com sucesso`

      });
      setIsCreateDialogOpen(false);
      setIsEditing(false);

    } catch (error) {

      if (axios.isAxiosError(error)) {
        // Check if there's a response and data within the error
        if (error.response && error.response.data) {
          console.error('Error message from server:', error.response.data);
          toast({
            title: 'Erro ao atualizar os lançamentos',
            description: error.response.data.message,
          })

          // You can also set this error message to a state to display it in your UI
        } else {
          console.error('Axios error without response data:', error.message);
        }
      } else {
        console.error('Non-Axios error:', error);
        toast({
          title: 'Erro',
          description: error instanceof Error ? error.message : 'Ocorreu um erro ao tentar atualizar o lançamento. Tente novamente.',
          variant: 'destructive'
        })
      }
    }
  }

  const handleChangeTipo = (value: string) => {
    let tipo = tipolancamento?.data.find(tipo => tipo.id === Number(value));
    lancamentoMethods.setValue('valorLancamento', Number(tipo?.valorFixo));
  }

  const handlerValidaLinhaDig = (value: string) => {
    if (value) {
      // Remove espaços e traços
      const linhaDigitavelDig = value.replace(/\s/g, '').replace(/-/g, '');
      const linhaDigitavel = linhaDigitavelDig.substring(0, 11) + linhaDigitavelDig.substring(12, 23) + linhaDigitavelDig.substring(24, 35) + linhaDigitavelDig.substring(36, 47);
      console.log(linhaDigitavel);
      // Verifica se a linha digitável tem 44 ou 48 dígitos
      if (linhaDigitavel.length === 44 || linhaDigitavel.length === 48) {
        // Verifica se todos os caracteres são dígitos
        if (/^\d+$/.test(linhaDigitavel)) {
          // Aqui você pode implementar a lógica de validação do dígito verificador, se necessário
          var dbl_valor = 0;
          var int_dig = 0;
          var int_modulo = (linhaDigitavel.substring(2, 1) === '6' ? 11 : 10)
          var str_vencimento = '';

          //Validar digitos
          //Bloco 1
          int_dig = Calc_DIG_Modulo(linhaDigitavel.substring(0, 11), int_modulo);
          if (int_dig === parseInt(linhaDigitavelDig.substring(12, 1))) {
            return true;
          }

          //Bloco 2
          int_dig = Calc_DIG_Modulo(linhaDigitavel.substring(12, 11), int_modulo);
          if (int_dig === parseInt(linhaDigitavelDig.substring(23, 1))) {
            return true;
          }

          //Bloco 3
          int_dig = Calc_DIG_Modulo(linhaDigitavel.substring(24, 11), int_modulo);
          if (int_dig === parseInt(linhaDigitavelDig.substring(35, 1))) {
            return true;
          }

          //Bloco 4
          int_dig = Calc_DIG_Modulo(linhaDigitavel.substring(36, 11), int_modulo);
          if (int_dig === parseInt(linhaDigitavelDig.substring(47, 1))) {
            return true;
          }

          if (linhaDigitavel.length == 44) {
            console.log(linhaDigitavel.substring(4, 13));
            console.log(linhaDigitavel.substring(13, 15));
            dbl_valor = parseFloat(linhaDigitavel.substring(4, 13) + '.' + linhaDigitavel.substring(13, 15));
          }

          if (linhaDigitavel.length == 48) {
            console.log(linhaDigitavel.substring(4, 9));
            console.log(linhaDigitavel.substring(13, 2));
            dbl_valor = parseFloat(linhaDigitavel.substring(4, 13) + '.' + linhaDigitavel.substring(13, 15));
          }

          lancamentoMethods.setValue('valorLancamento', dbl_valor);

          //Vencimento
          str_vencimento = linhaDigitavel.substring(19, 27);
          console.log(str_vencimento);
          lancamentoMethods.setValue('vencimentoLancamento', moment.utc(str_vencimento, 'YYYYMMDD').format("YYYY-MM-DD"));


        } else {
        }
      } else {
      }
    } else {
    }
  }

  const handleEditLancamento = (lancamento: LancamentoImovel) => {
    setTitulo("Alterar lançamento")
    setIsCreateDialogOpen(true);
    lancamentoMethods.setValue("id", lancamento.id);
    lancamentoMethods.setValue("dataLancamento", moment.utc(lancamento.dataLancamento).format("YYYY-MM-DD"));
    lancamentoMethods.setValue("vencimentoLancamento", moment.utc(lancamento.vencimentoLancamento).format("YYYY-MM-DD"));
    lancamentoMethods.setValue("valorLancamento", lancamento.valorLancamento);
    lancamentoMethods.setValue("observacao", lancamento.observacao);
    lancamentoMethods.setValue("status", lancamento.status);
    lancamentoMethods.setValue("tipoId", lancamento.tipoId);
    lancamentoMethods.setValue("imovelId", lancamento.imovelId);
    console.log(lancamentoMethods.getValues());
  }

  console.log(imovelMethods.formState.errors);
  console.log(imovelMethods.formState.isDirty);
  console.log(imovelMethods.formState.isValid);
  if (isLoading) return <PageLoader />

  return (
    <div className="container mx-auto space-y-6 p-4 font-[Poppins-regular]" style={{color:"#034869"}}>
      {loader && (<PageLoader />)}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Detalhes</h1>
        {activeTab === 'personal-info' && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              {(isAdmin ||
                user?.permissions.includes("ALL") ||
                user?.permissions.includes("DELETE_IMOVEL")
              ) && (
                  <Button variant="destructive" className='h-full hover:cursor-pointer hover:bg-red-400'>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir Imóvel
                  </Button>)}
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription style={{color:"#034869"}}>
                  Esta ação não pode ser desfeita. Isso excluirá permanentemente o imóvel e todos os
                  dados associados a ele.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    deleteImovelMutation.mutate(id!)
                  }}
                  className=" hover:bg-[#a9d9ef] hover:cursor-pointer bg-[#034869] hover:text-[#034869] text-white"
                >
                  Sim, excluir imóvel
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(value) => { handlerChangeFolder(value) }}>
        <div className="w-full flex overflow-x-auto">
          <TabsList>
            <TabsTrigger value="personal-info" style={{color:"#034869"}} className='hover:cursor-pointer hover:bg-gray-200'>Dados do Imóvel</TabsTrigger>
            <TabsTrigger value="proprietarios" style={{color:"#034869"}} className='hover:cursor-pointer hover:bg-gray-200'>Proprietários</TabsTrigger>
            <TabsTrigger value="locacoes" style={{color:"#034869"}} className='hover:cursor-pointer hover:bg-gray-200'>Locação</TabsTrigger>
            <TabsTrigger value="lancamentos" style={{color:"#034869"}} className='hover:cursor-pointer hover:bg-gray-200'>Lançamentos</TabsTrigger>
            <TabsTrigger value="boletos" style={{color:"#034869"}} className='hover:cursor-pointer hover:bg-gray-200'>Boletos</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="personal-info" className="space-y-4 font-[Poppins-regular]">
          <Card style={{color:"#034869"}}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-1xl">
                <span>Informações do Imóvel</span>
                {(isAdmin ||
                  user?.permissions.includes("ALL") ||
                  user?.permissions.includes("DELETE_IMOVEL")
                ) && (

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingPersonalInfo(!isEditingPersonalInfo)}
                      className='hover:cursor-pointer hover:bg-gray-200'
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      {isEditingPersonalInfo ? 'Cancelar' : 'Editar'}
                    </Button>
                  )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ImovelForm.Root
                createImovelMethods={imovelMethods}
                onSubmitImovelData={onSubmitImovelData}
              >
                <ImovelForm.FormContent
                  createImovelMethods={imovelMethods}
                  disabled={!isEditingPersonalInfo || isLoadingImages}
                />
                <div className="mt-6">
                  {isEditingPersonalInfo && (
                    <Button
                      disabled={//!imovelMethods.formState.isDirty 
                        !imovelMethods.formState.isDirty || !imovelMethods.formState.isValid
                      }
                      type="submit"
                      className=" hover:bg-[#a9d9ef] hover:cursor-pointer bg-[#034869] hover:text-[#034869] text-white"
                    >
                      Salvar Alterações
                    </Button>
                  )}
                </div>
              </ImovelForm.Root>
            </CardContent>
          </Card>
        </TabsContent>

        {/*Proprietários */}
        <TabsContent value="proprietarios" className="space-y-4 font-[Poppins-regular]">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Proprietários</h2>
            {(isAdmin ||
              user?.permissions.includes("ALL") ||
              user?.permissions.includes("DELETE_IMOVEL")
            ) && (

                <Button onClick={handlerNewProp} size={"sm"} 
                className="hover:bg-[#a9d9ef] hover:cursor-pointer bg-[#034869] hover:text-[#034869] text-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Proprietrário
                </Button>
              )}
            <Dialog open={openCli} onOpenChange={setOpenCli}>
              <DialogContent>
                <DialogHeader>
                  {!selPessoa && (
                    <>
                      <DialogTitle>Adicionar Novo Proprietário</DialogTitle>
                      <DialogDescription style={{color:"#034869"}}>
                        Preencha os detalhes da novo proprietário para este imóvel.
                      </DialogDescription>
                    </>
                  )}
                </DialogHeader>

                <form className="space-y-4" onSubmit={imovelProp.handleSubmit(handleSubmitProprietario)} style={{color:"#034869"}}>
                  {!selPessoa && (
                    <div className="grid grid-cols-1 gap-4 flex items-center">
                      <Button onClick={() => { handlerSelProp('proprietarios') }}
                        className="hover:bg-[#a9d9ef] hover:cursor-pointer bg-[#034869] hover:text-[#034869] text-white">
                        <Search className="mr-2 h-4 w-4" />
                        Proprietrários
                      </Button>

                      {(imovelPropers.fields.length > 0) && (
                        <div className="grid grid-cols-1 gap-4 flex items-center">
                          {imovelPropers.fields.map((field, index) => (
                            <div className='flex justify-between items-center gap-2 mt-2 border-solid border-2 border-gray-250 rounded p-1' key={field.id}>
                              <Label >{field.nome}</Label>
                              <button
                                className='border bg-zinc-200 hover:bg-zinc-400'
                                type="button"
                                onClick={() => {
                                  imovelProp.setValue('pessoaId', 0);
                                  imovelPropers.remove(index);
                                }}
                              >
                                <X className='px-1'></X>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {!!imovelProp?.formState?.errors?.pessoaId?.message && (
                        <span>{imovelProp?.formState?.errors?.pessoaId?.message}</span>
                      )}

                    </div>
                  )}
                  {selPessoa && (
                    <Card id='teste' className='h-full'>
                      <div className="flex  justify-end">
                        <Button onClick={() => { setSelPessoa(false) }}
                          className='w-4 h-8 rounded-full bg-transparent text-black bg-zinc-200 hover:bg-zinc-400 hover:cursor-pointer'>X</Button>
                      </div>
                      <CardHeader>
                        <DialogTitle className='flex items-center justify-center'>Selecionar o Proprietário</DialogTitle>
                      </CardHeader>
                      <CardContent className='mt-2 h-120'>
                        <ListarClientes limitView={1} txtVinc='Selecionar' exclude={imovel && imovel?.proprietarios ? imovel?.proprietarios?.map((porp) => { return porp.id }).toString() : ''} onSelectCliente={handleSelectProp} />
                      </CardContent>
                    </Card>
                  )}
                  {!selPessoa && (
                    <div>
                      <Label htmlFor="cotaImovel">Cota do Imóvel</Label>
                      <Input id="cotaImovel" type="number" step="any" placeholder="0.00"
                        {...imovelProp.register('cotaImovel')}
                        helperText={imovelProp.formState?.errors?.cotaImovel?.message}
                      />
                    </div>
                  )}
                  <DialogFooter>
                    <Button type="submit" className={(selPessoa ? "hidden hover:cursor-pointer hover:bg-gray-600" : "dblock hover:bg-[#a9d9ef] hover:cursor-pointer bg-[#034869] hover:text-[#034869] text-white")}
                    >Adicionar Proprietário</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className={(isPortrait ? "grid gap-4 grid-cols-3" : isTablet ? "grid gap-4 grid-cols-2" : isMobile ? "grid gap-4 grid-cols-1" : "grid gap-4 grid-cols-1")}>
            {imovel?.proprietarios?.map((proprietario) => (
              <Card key={proprietario.id} style={{color:"#034869"}}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{proprietario.pessoa?.nome}</span>
                    {/*<Badge variant="secondary" className='bg-[#a7d9f2]'>{proprietario.cotaImovel}</Badge>*/}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Label className="font-semibold">Cota do imóvel</Label>
                    <p>
                      % {proprietario.cotaImovel.toLocaleString('pt-BR')}
                    </p>
                  </div>

                  <Label className="font-semibold">Dados do Proprietário</Label>
                  <div className='grid grid-cols-10 flex justify-items-start'>
                    <div className=''>
                      <Mail className='text-gray-500' />
                    </div>
                    <div className='text-gray-500 col-span-9'>
                      {proprietario.pessoa?.email?.toString()}
                    </div>
                  </div>
                  <div className='grid grid-cols-10 flex justify-items-start'>
                    <Phone className='text-gray-500' />
                    <div className='text-gray-500 col-span-9'>
                      {proprietario.pessoa?.telefone?.toString()}
                    </div>

                  </div>
                  <div className="grid grid-cols-3 gap-4 flex items-end">
                    {(isAdmin ||
                      user?.permissions.includes("ALL") ||
                      user?.permissions.includes("VIEW_PROPRIETARIOS")
                    ) && (

                        <Button
                          className='mt-2 hover:bg-[#daeffa] hover:cursor-pointer bg-[#a7d9f2]'
                          variant="secondary"
                          size="sm"
                          onClick={() => { handlerDetailProp(proprietario.pessoaId) }}
                          style={
                            {
                              fontSize: '0.8rem',
                            }}
                        >
                          Ver detalhes
                        </Button>
                      )}
                  </div>
                  <hr className="border-t border-gray-300 mt-5" />
                </CardContent>
                <CardFooter className="flex justify-end space-x-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      {(isAdmin ||
                        user?.permissions.includes("ALL") ||
                        user?.permissions.includes("UPDATE_PROPRIETARIO")
                      ) && (

                          <Button variant="outline" size="sm"
                            onClick={() => { handlerEditProprietario(proprietario) }}
                            className='hover:cursor-pointer hover:bg-gray-300'
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </Button>
                        )}
                    </DialogTrigger>
                    <DialogContent className='font-[Poppins-regular]'>
                      <DialogHeader>
                        <DialogTitle>Alterar Proprietário</DialogTitle>
                        <DialogDescription>
                          Preencha os detalhes do proprietário para este imóvel.
                        </DialogDescription>
                      </DialogHeader>
                      <form className="space-y-4" onSubmit={imovelPropAlt.handleSubmit(handlerUpdateProprietario)}>
                        <div>
                          {!selPessoa && (
                            <div className="grid grid-cols-1 gap-4 flex items-center">
                              <Button onClick={() => { handlerSelProp('proprietarios') }}>
                                <Search className="mr-2 h-4 w-4" />
                                Proprietrários
                              </Button>

                              {(imovelPropers.fields.length > 0) && (
                                <div className="grid grid-cols-1 gap-4 flex items-center">
                                  {imovelPropers.fields.map((field, index) => (
                                    <div className='flex justify-between items-center gap-2 mt-2 border-solid border-2 border-gray-250 rounded p-1'>
                                      <Label >{field.nome}</Label>
                                      <button
                                        className='border bg-zinc-200 hover:bg-zinc-400'
                                        type="button"
                                        onClick={() => {
                                          imovelPropAlt.setValue('pessoaId', 0);
                                          imovelPropers.remove(index);
                                        }}
                                      >
                                        <X className='px-1'></X>
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {!!imovelPropAlt?.formState?.errors?.pessoaId?.message && (
                                <span>{imovelPropAlt?.formState?.errors?.pessoaId?.message}</span>
                              )}

                            </div>
                          )}
                          {selPessoa && (
                            <div>
                              <Card id='teste' className='h-full'>
                                <div className="flex  justify-end">
                                  <Button onClick={() => { handleSelectProp(undefined) }}
                                    className='w-8 h-8 rounded-full bg-transparent text-black bg-zinc-200 hover:bg-zinc-400'>X</Button>
                                </div>
                                <CardHeader>
                                  <DialogTitle className='flex items-center justify-center'>Selecionar o Proprietário</DialogTitle>
                                </CardHeader>
                                <CardContent className='mt-2 h-120'>
                                  <ListarClientes limitView={1} txtVinc='Vincular Propriedade' exclude={imovel && imovel?.proprietarios ? imovel?.proprietarios?.map((porp) => { return porp.id }).toString() : ''} onSelectCliente={handleSelectProp} />
                                </CardContent>
                              </Card>
                            </div>
                          )}
                        </div>
                        {!selPessoa && (
                          <>
                            <div>
                              <Label htmlFor="cotaImovel">Cota do Imóvel</Label>
                              <Input id="cotaImovel" type="number" placeholder="0.00"
                                {...imovelPropAlt.register('cotaImovel')}
                                helperText={imovelPropAlt.formState?.errors?.cotaImovel?.message}
                              />
                            </div>
                          </>
                        )}
                        <DialogFooter>
                          <Button type="submit"
                          >Salvar Alterações</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                  {(isAdmin ||
                    user?.permissions.includes("ALL") ||
                    user?.permissions.includes("DELETE_PROPRIETARIO")
                  ) && (

                      <Button variant="destructive" size="sm"
                        onClick={() => { handleDeleteProprietario(proprietario) }}
                        className='hover:cursor-pointer hover:bg-red-600'
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </Button>
                    )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Locações */}
        <TabsContent value="locacoes" className="space-y-4 font-[Poppins-regular]" style={{color:"#034869"}}>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[1.3rem]">Locações</h2>
            {/* <Button
              onClick={handlerNewLoc}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Locação
            </Button> */}
            <Dialog open={openLoc} onOpenChange={setOpenLoc}>
              <DialogTrigger asChild>
              </DialogTrigger>
              <DialogContent className='font-[Poppins-regular]'>
                <DialogHeader>
                  <DialogTitle>Adicionar Nova Locação</DialogTitle>
                  <DialogDescription>
                    Preencha os detalhes da nova locação para este cliente.
                  </DialogDescription>
                </DialogHeader>
                <form className="space-y-4" onSubmit={locacaoMethods.handleSubmit(handleSubmitLocacao)}>
                  <div style={{ display: (!selFiador ? 'block' : 'none') }}>
                    <div>
                      {!selPessoa && (
                        <div className="grid grid-cols-1 gap-4 flex items-center">
                          <Button onClick={() => { handlerSelProp('locacoes') }}>
                            <Search className="mr-2 h-4 w-4" />
                            Locatários
                          </Button>

                          {(imovelLocatarios.fields.length > 0) && (
                            <div className="grid grid-cols-1 gap-4 flex items-center">
                              {imovelLocatarios.fields.map((field, index) => (
                                <div className='flex justify-between items-center gap-2 mt-2 border-solid border-2 border-gray-250 rounded p-1'>
                                  <Label >{field.nome}</Label>
                                  <button
                                    className='border bg-zinc-200 hover:bg-zinc-400'
                                    type="button"
                                    onClick={() => {
                                      //locacaoMethods.setValue('pessoaId', 0);
                                      imovelLocatarios.remove(index);
                                    }}
                                  >
                                    <X className='px-1'></X>
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          {!!locacaoMethods?.formState?.errors?.locatarios?.message && (
                            <span>{locacaoMethods?.formState?.errors?.locatarios?.message}</span>
                          )}

                        </div>
                      )}

                      {/*Selecção de locatários */}
                      {selPessoa && (
                        <div>
                          <Card id='teste' className='h-full' style={{color:"#034869"}}>
                            <div className="flex  justify-end">
                              <Button onClick={() => { handleSelectProp(undefined) }}
                                className='w-8 h-8 rounded-full bg-transparent text-black bg-zinc-200 hover:bg-zinc-400'>X</Button>
                            </div>
                            <CardHeader>
                              <DialogTitle className='flex items-center justify-center'>Selecionar o Proprietário</DialogTitle>
                            </CardHeader>
                            <CardContent className='mt-2 h-120'>
                              <ListarClientes limitView={1} txtVinc='Vincular Locação' exclude={imovel && imovel?.locacoes ? imovel?.locacoes?.map((locacao) => { return locacao.locatarios?.map((locatario) => { return locatario.id }) }).toString() : ''} onSelectCliente={handleSelectProp} />
                            </CardContent>
                          </Card>
                        </div>
                      )}
                    </div>

                    {!selPessoa && (
                      <div>
                        <div className='mt-2'>
                          <Label htmlFor="valorAluguel">Valor do Aluguel</Label>
                          <Input type="number" placeholder="0.00"
                            {...locacaoMethods.register('valorAluguel')}
                            helperText={locacaoMethods.formState?.errors?.valorAluguel?.message}
                            onChange={(e) => { locacaoMethods.setValue('valorAluguel', parseFloat(e.target.value)) }}
                          />
                        </div>
                        <div className='mt-2'>
                          <Label htmlFor="dataInicio">Data de Início</Label>
                          <Input id="dataInicio" type="date"
                            {...locacaoMethods.register('dataInicio')}
                            helperText={locacaoMethods.formState?.errors?.dataInicio?.message}
                            onChange={(e) => { locacaoMethods.setValue('dataInicio', e.target.value) }}
                          />
                        </div>
                        <div className='mt-2'>
                          <Label htmlFor="dataFim">Data de Fim (opcional)</Label>
                          <Input id="dataFim" type="date"
                            {...locacaoMethods.register('dataFim')}
                            helperText={locacaoMethods.formState?.errors?.dataFim?.message}
                          />
                        </div>
                        <div className='mt-2'>
                          <Label htmlFor="diaVencto">Dia de Vencimento</Label>
                          <Input id="diaVencto" type="number"
                            {...locacaoMethods.register('diaVencimento')} placeholder='0'
                            helperText={locacaoMethods.formState?.errors?.diaVencimento?.message}
                            onChange={(e) => { locacaoMethods.setValue('diaVencimento', parseInt(e.target.value)) }}
                          />
                        </div>
                        <div className='mt-2'>
                          <Label htmlFor="observacoes">Observações</Label>
                          <Textarea id="observacoes" placeholder="Detalhes adicionais sobre a locação" />
                        </div>
                        <div className='mt-2'>
                          <Label htmlFor="Garantia">Tipo de Garantia</Label>
                          <Select
                            onValueChange={(e: GarantiaLocacao) => { handlerChangeGarantia(e) }
                            }>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a garantia" />
                            </SelectTrigger>
                            <SelectContent>
                              {GARANTIA_LOCACAO_OPTIONS.map((garantia) => (
                                <SelectItem key={garantia.label} value={garantia.value}>
                                  {garantia.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>

                  {!selPessoa && (
                    <div>
                      {(selGarantia === GarantiaLocacao.FIADOR && selFiador) && (
                        <div>
                          <Card>
                            <CardHeader>
                              <DialogTitle className='flex items-center'>Selecionar o Fiador</DialogTitle>
                            </CardHeader>
                            <CardContent className='mt-2 h-120'>
                              <ListarClientes limitView={1} txtVinc='Vincular Locação' onSelectCliente={handleSelectFiador} exclude='' />
                            </CardContent>
                          </Card>
                        </div>
                      )}

                      {(locacaoFiadores.fields.length > 0) && (
                        <div>
                          <div className="grid grid-cols-1 gap-2 items-center justify-between">
                            <Button onClick={() => { setSelFiador(true) }}>
                              <Search className="mr-2 h-4 w-4" />
                              Fiadores
                            </Button>
                          </div>

                          {locacaoFiadores.fields.map((field, index) => (
                            <div className='flex justify-between items-center gap-2 mt-2 border-solid border-2 border-gray-250 rounded p-1'>
                              <Label >{field.nome}</Label>
                              <button
                                className='border bg-zinc-200 hover:bg-zinc-400'
                                type="button"
                                onClick={() => locacaoFiadores.remove(index)}
                              >
                                <X className='px-1'></X>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {selGarantia === GarantiaLocacao.TITULO_CAPITALIZACAO && (
                        <div className='mt-2'>
                          <Label htmlFor="titulocap">Número do Título</Label>
                          <Input id="titulocap" type="number"
                            {...locacaoMethods.register('tituloCap.numeroTitulo')}
                            helperText={locacaoMethods.formState?.errors?.tituloCap?.numeroTitulo?.message}
                            onChange={(e) => { locacaoMethods.setValue('tituloCap.numeroTitulo', e.target.value) }}
                          />
                        </div>
                      )}

                      {selGarantia === GarantiaLocacao.SEGURO_FIANCA && (
                        <div className='mt-2'>
                          <Label htmlFor="numseguro">Número do Seguro</Label>
                          <Input id="numseguro" type="number"
                            {...locacaoMethods.register('seguroFianca.numeroSeguro')}
                            helperText={locacaoMethods.formState?.errors?.seguroFianca?.numeroSeguro?.message}
                            onChange={(e) => { locacaoMethods.setValue('seguroFianca.numeroSeguro', e.target.value) }}
                          />
                        </div>
                      )}

                      {selGarantia === GarantiaLocacao.DEPOSITO_CALCAO && (
                        <div>
                          <div className='mt-2'>
                            <Label htmlFor="valdepCalcao">Valor do depósito</Label>
                            <Input id="valdepCalcao" type="number" placeholder='0,00'
                              {...locacaoMethods.register('depCalcao.valorDeposito')}
                              helperText={locacaoMethods.formState?.errors?.depCalcao?.valorDeposito?.message}
                              onChange={(e) => { locacaoMethods.setValue('depCalcao.valorDeposito', parseFloat(e.target.value)) }}
                            />
                          </div>
                          <div className='mt-2'>
                            <Label htmlFor="qtddepCalcao">Quantidade de meses</Label>
                            <Input id="qtddepCalcao" type="number"
                              {...locacaoMethods.register('depCalcao.quantidadeMeses')}
                              helperText={locacaoMethods.formState?.errors?.depCalcao?.quantidadeMeses?.message}
                              onChange={(e) => { locacaoMethods.setValue('depCalcao.quantidadeMeses', parseFloat(e.target.value)) }}
                            />
                          </div>
                        </div>
                      )}

                      <div className='mt-2'>
                        <Label htmlFor="status">Situação da Locação</Label>
                        <Select
                          onValueChange={(e: LocacaoStatus) => {
                            locacaoMethods.setValue('status', e)
                          }
                          }>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a situação" />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_LOCACAO_OPTIONS.map((status) => (
                              <SelectItem key={status.label} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <DialogFooter className='mt-5'>
                        <Button type="submit">Adicionar Locação</Button>
                      </DialogFooter>

                    </div>
                  )}
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/*Lista de locações */}
          <div className={(isPortrait ? "grid gap-4 grid-cols-3" : isTablet ? "grid gap-4 grid-cols-2" : isMobile ? "grid gap-4 grid-cols-1" : "grid gap-4 grid-cols-1")}>
            {imovel?.locacoes?.map((locacao) => (
              <Card key={locacao.id} style={{color:"#034869"}}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{locacao.id}</span>
                    <Badge variant={locacao.status == LocacaoStatus.ENCERRADA ? "destructive" : "secondary"} className='bg-[#a7d9f2]'>{locacao.status}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 flex items-center mt-2">
                    <Label>Valor do Aluguel</Label>
                    <p className="font-semibold">
                      {usdFormatter.format(locacao.valorAluguel)}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 items-center mt-4">
                    <Label>Período</Label>
                    <p className="flex items-center text-[0.7rem] font-semibold">

                      {new Date(locacao.dataInicio).toLocaleDateString('pt-BR')} -
                      {locacao.dataFim
                        ? new Date(locacao.dataFim).toLocaleDateString('pt-BR')
                        : 'Atual'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 items-center mt-4">
                    <Label>Locatários</Label>
                    {locacao.locatarios?.map((locatario) => (
                      <div className='flex justify-start'>
                        <Button
                          className='hover:bg-[#daeffa] hover:cursor-pointer bg-[#a7d9f2]'
                          variant="secondary"
                          size="sm"
                          onClick={() => { handlerDetailPessoa(parseFloat(locatario.pessoaId.toString())) }}
                          style={
                            {
                              fontSize: (isPortrait ? '0.8rem' : isTablet ? '0.6rem' : isMobile ? '0.5rem' : '0.8rem'),
                              fontWeight: 'Bold'
                            }}
                        >
                          {locatario.pessoa?.nome}
                        </Button>
                      </div>
                    ))}

                  </div>
                  <div className="grid grid-cols-2 gap-4 items-center mt-4">
                    {locacao.garantiaLocacaoTipo === GarantiaLocacao.FIADOR && (
                      <>
                        <Label>Fiadores</Label>
                        {locacao.fiadores?.map((fiador) => (
                          <div className='flex justify-start'>
                            <Button
                              variant="secondary"
                              className='hover:bg-[#daeffa] hover:cursor-pointer bg-[#a7d9f2]'
                              size="sm"
                              onClick={() => { handlerDetailPessoa(parseFloat(fiador.pessoaId.toString())) }}
                              style={
                                {
                                  fontSize: (isPortrait ? '1rem' : isTablet ? '1rem' : isMobile ? '0.7rem' : '1.5rem'),
                                  fontWeight: 'Bold'
                                }}
                            >
                              {fiador.pessoa?.nome}
                            </Button>
                          </div>
                        ))}
                      </>
                    )}

                    {locacao.garantiaLocacaoTipo === GarantiaLocacao.SEGURO_FIANCA && (
                      <>
                        <Label>Seguro Fiança</Label>
                        <div className='flex justify-start font-semibold'>
                          <p>{locacao.garantiaSeguroFianca?.numeroSeguro}</p>
                        </div>
                      </>
                    )}
                    {locacao.garantiaLocacaoTipo === GarantiaLocacao.DEPOSITO_CALCAO && (
                      <>
                        <Label>Depósito Calção</Label>
                        <p>{usdFormatter.format(locacao.garantiaDepositoCalcao?.valorDeposito ? locacao.garantiaDepositoCalcao?.valorDeposito : 0)}</p>
                      </>
                    )}
                    {locacao.garantiaLocacaoTipo === GarantiaLocacao.TITULO_CAPITALIZACAO && (
                      <>
                        <Label>Título de Capitalização</Label>
                        <div className='flex justify-start font-semibold'>
                          <p>{locacao.garantiaTituloCapitalizacao?.numeroTitulo}</p>
                        </div>
                      </>
                    )}
                  </div>

                  {(isAdmin ||
                    user?.permissions.includes("ALL") ||
                    user?.permissions.includes("VIEW_PAGAMENTOS")
                  ) && (

                      <div className="grid grid-cols-2 gap-4 flex items-end mt-2">
                        <Button size={"sm"} variant="secondary" onClick={() => { handlerSelProp('locacoes') }}
                          className='col-start-2 hover:bg-[#daeffa] hover:cursor-pointer bg-[#a7d9f2]'>
                          <CircleDollarSign className="mr-2 h-4 w-4" />
                          Pagamentos
                        </Button>
                      </div>
                    )}

                  <hr className="border-t border-gray-300 mt-3" />
                </CardContent>
                <CardFooter className="flex justify-end space-x-2 font-[Poppins-regular]">
                  <Dialog>
                    <DialogTrigger asChild>
                      {(isAdmin ||
                        user?.permissions.includes("ALL") ||
                        user?.permissions.includes("UPDATE_LOCACAO")
                      ) && (


                          <Button variant="outline" size="sm"
                            onClick={() => { handlerEditLocacao(locacao) }}
                            className='hover:cursor-pointer hover:bg-gray-300'
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </Button>
                        )}
                    </DialogTrigger>
                    <DialogContent className='font-[Poppins-regular]'>
                      <DialogHeader>
                        <DialogTitle>Alterar Locação</DialogTitle>
                        <DialogDescription>
                          Preencha os detalhes da nova locação para este cliente.
                        </DialogDescription>
                      </DialogHeader>
                      <form className="space-y-4 font-[Poppins-regular]" onSubmit={locacaoMethodsAlt.handleSubmit(handlerUpdateLocacao)}>
                        <div style={{ display: (!selFiador ? 'block' : 'none') }}>
                          <div>
                            {!selPessoa && (
                              <div className="grid grid-cols-1 gap-4 flex items-center">
                                <Button onClick={() => { handlerSelProp('locacoes') }}>
                                  <Search className="mr-2 h-4 w-4" />
                                  Locatários
                                </Button>

                                {(imovelLocatarios.fields.length > 0) && (
                                  <div className="grid grid-cols-1 gap-4 flex items-center">
                                    {imovelLocatarios.fields.map((field, index) => (
                                      <div className='flex justify-between items-center gap-2 mt-2 border-solid border-2 border-gray-250 rounded p-1'>
                                        <Label >{field.nome}</Label>
                                        <button
                                          className='border bg-zinc-200 hover:bg-zinc-400'
                                          type="button"
                                          onClick={() => {
                                            //locacaoMethodsAlt.setValue('pessoaId', 0);
                                            imovelLocatarios.remove(index);
                                          }}
                                        >
                                          <X className='px-1'></X>
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {!!locacaoMethodsAlt?.formState?.errors?.locatarios?.message && (
                                  <span>{locacaoMethodsAlt?.formState?.errors?.locatarios?.message}</span>
                                )}

                              </div>
                            )}
                            {selPessoa && (
                              <div>
                                <Card id='teste' className='h-full'>
                                  <div className="flex  justify-end">
                                    <Button onClick={() => { handleSelectProp(undefined) }}
                                      className='w-8 h-8 rounded-full bg-transparent text-black bg-zinc-200 hover:bg-zinc-400'>X</Button>
                                  </div>
                                  <CardHeader>
                                    <DialogTitle className='flex items-center justify-center'>Selecionar o Proprietário</DialogTitle>
                                  </CardHeader>
                                  <CardContent className='mt-2 h-120'>
                                    <ListarClientes limitView={1} txtVinc='Vincular Locação' exclude={imovel && imovel?.locacoes ?
                                      imovel?.locacoes?.map((locacao) => { return locacao.locatarios?.map((locatario) => { return locatario.id }) }).toString()
                                      : ''} onSelectCliente={handleSelectProp} />
                                  </CardContent>
                                </Card>
                              </div>
                            )}
                          </div>

                          {!selPessoa && (
                            <div>
                              <div className='mt-2'>
                                <Label htmlFor="valorAluguel">Valor do Aluguel</Label>
                                <Input type="number" placeholder="0.00"
                                  {...locacaoMethodsAlt.register('valorAluguel')}
                                  helperText={locacaoMethodsAlt.formState?.errors?.valorAluguel?.message}
                                />
                              </div>
                              <div className='mt-2'>
                                <Label htmlFor="dataInicio">Data de Início</Label>
                                <Input type="date"
                                  {...locacaoMethodsAlt.register('dataInicio')}
                                  helperText={locacaoMethodsAlt.formState?.errors?.dataInicio?.message}
                                />
                              </div>
                              <div className='mt-2'>
                                <Label htmlFor="dataFim">Data de Fim (opcional)</Label>
                                <Input type="date"
                                  {...locacaoMethodsAlt.register('dataFim')}
                                  helperText={locacaoMethodsAlt.formState?.errors?.dataFim?.message}
                                />
                              </div>
                              <div className='mt-2'>
                                <Label htmlFor="diaVencto">Dia de Vencimento</Label>
                                <Input type="number"
                                  {...locacaoMethodsAlt.register('diaVencimento')} placeholder='0'
                                  helperText={locacaoMethodsAlt.formState?.errors?.diaVencimento?.message}
                                />
                              </div>
                              <div className='mt-2'>
                                <Label htmlFor="observacoes">Observações</Label>
                                <Textarea id="observacoes" placeholder="Detalhes adicionais sobre a locação" />
                              </div>
                              <div className='mt-2'>
                                <Label>
                                  Tipo de Garantia
                                  <div className="mt-2">
                                    <Controller
                                      name="garantiaLocacaoTipo"
                                      control={locacaoMethodsAlt.control}
                                      render={({ field }) => (
                                        <Select
                                          onValueChange={(value) => {
                                            field.onChange(value)
                                            locacaoMethodsAlt.setValue('garantiaLocacaoTipo', value);

                                          }}
                                          value={field.value?.toString()}
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Selecione a garantia" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {GARANTIA_LOCACAO_OPTIONS.map((garantia) => (
                                              <SelectItem value={garantia.value}>{garantia.label}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      )}
                                    />
                                    {!!locacaoMethodsAlt?.formState?.errors?.garantiaLocacaoTipo?.message && (
                                      <span>{locacaoMethodsAlt?.formState?.errors?.garantiaLocacaoTipo?.message}</span>
                                    )}
                                  </div>
                                </Label>
                              </div>
                            </div>
                          )}
                        </div>

                        {!selPessoa && (
                          <div>
                            {(selGarantia === GarantiaLocacao.FIADOR && selFiador) && (
                              <div>
                                <Card>
                                  <CardHeader>
                                    <DialogTitle className='flex items-center'>Selecionar o Fiador</DialogTitle>
                                  </CardHeader>
                                  <CardContent className='mt-2 h-120'>
                                    <ListarClientes limitView={1} txtVinc='Vincular Locação' onSelectCliente={handleSelectFiador} exclude='' />
                                  </CardContent>
                                </Card>
                              </div>
                            )}

                            {(locacaoFiadores.fields.length > 0) && (
                              <div>
                                <div className='flex justify-between items-center gap-2 mt-2 border-solid border-2 border-gray-250 rounded p-1'>
                                  <Label>Fiadores</Label>
                                  <button
                                    className='border bg-zinc-200 hover:bg-zinc-400 rounded'
                                    type="button"
                                    onClick={() => { setSelFiador(true) }}
                                  >
                                    Adicionar
                                  </button>
                                </div>
                                {locacaoFiadores.fields.map((field, index) => (
                                  <div className='flex items-center gap-2 mt-2'>
                                    <Label >{field.nome}</Label>
                                    <button
                                      className='border bg-zinc-200 hover:bg-zinc-400'
                                      type="button"
                                      onClick={() => locacaoFiadores.remove(index)}
                                    >
                                      <X className='px-1'></X>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            {selGarantia === GarantiaLocacao.TITULO_CAPITALIZACAO && (
                              <div className='mt-2'>
                                <Label htmlFor="tituloCap.numeroTitulo">Número do Título</Label>
                                <Input type="number"
                                  {...locacaoMethodsAlt.register('tituloCap.numeroTitulo')}
                                  helperText={locacaoMethodsAlt.formState?.errors?.tituloCap?.numeroTitulo?.message}
                                  onChange={(e) => { locacaoMethodsAlt.setValue('tituloCap.numeroTitulo', e.target.value) }}
                                />
                              </div>
                            )}

                            {selGarantia === GarantiaLocacao.SEGURO_FIANCA && (
                              <div className='mt-2'>
                                <Label htmlFor="seguroFianca.numeroSeguro">Número do Seguro</Label>
                                <Input type="number"
                                  {...locacaoMethodsAlt.register('seguroFianca.numeroSeguro')}
                                  helperText={locacaoMethodsAlt.formState?.errors?.seguroFianca?.numeroSeguro?.message}
                                  onChange={(e) => { locacaoMethodsAlt.setValue('seguroFianca.numeroSeguro', e.target.value) }}
                                />
                              </div>
                            )}

                            {selGarantia === GarantiaLocacao.DEPOSITO_CALCAO && (
                              <div>
                                <div className='mt-2'>
                                  <Label htmlFor="depCalcao.valorDeposito">Valor do depósito</Label>
                                  <Input type="number" placeholder='0,00'
                                    {...locacaoMethodsAlt.register('depCalcao.valorDeposito')}
                                    helperText={locacaoMethodsAlt.formState?.errors?.depCalcao?.valorDeposito?.message}
                                    onChange={(e) => { locacaoMethodsAlt.setValue('depCalcao.valorDeposito', parseFloat(e.target.value)) }}
                                  />
                                </div>
                                <div className='mt-2'>
                                  <Label htmlFor="depCalcao.quantidadeMeses">Quantidade de meses</Label>
                                  <Input type="number"
                                    {...locacaoMethodsAlt.register('depCalcao.quantidadeMeses')}
                                    helperText={locacaoMethodsAlt.formState?.errors?.depCalcao?.quantidadeMeses?.message}
                                  />
                                </div>
                              </div>
                            )}

                            <div className='mt-2'>
                              <Label>
                                Situação da Locação
                                <div className="mt-2">
                                  <Controller
                                    name="status"
                                    control={locacaoMethodsAlt.control}
                                    render={({ field }) => (
                                      <Select
                                        onValueChange={(value) => {
                                          field.onChange(value)
                                          locacaoMethodsAlt.setValue('status', value);

                                        }}
                                        value={field.value?.toString()}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Selecione a situação" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {STATUS_LOCACAO_OPTIONS.map((status) => (
                                            <SelectItem value={status.value}>{status.label}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    )}
                                  />
                                  {!!locacaoMethodsAlt?.formState?.errors?.status?.message && (
                                    <span>{locacaoMethodsAlt?.formState?.errors?.status?.message}</span>
                                  )}
                                </div>
                              </Label>
                            </div>

                            <DialogFooter className='mt-5'>
                              <Button type="submit">Adicionar Locação</Button>
                            </DialogFooter>

                          </div>
                        )}
                      </form>
                    </DialogContent>
                  </Dialog>
                  {(
                    (isAdmin ||
                      user?.permissions.includes("ALL") ||
                      user?.permissions.includes("DELETE_LOCACAO")
                    ) &&
                    (!locacao.status || locacao.status !== LocacaoStatus.ENCERRADA)
                  )
                    && (
                      <Button variant="destructive" size="sm"
                        onClick={() => { handleDeleteLocacao(locacao) }}
                        className='hover:cursor-pointer hover:bg-red-600'
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </Button>
                    )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Lançamentos */}
        <TabsContent value="lancamentos" className="space-y-4 font-[Poppins-regular]" style={{color:"#034869"}}>
          <div className="flex items-center justify-between">
            <div className=
              {(isPortrait || isTablet || isBigScreen)
                ? "grid grid-cols-3 gap-4 mb-2"
                : "grid grid-cols-1 gap-4 mb-2"}>
              <h1 className='flex items-center'>Período</h1>
              <div className="flex justify-between gap-2">
                <Label className="text-base flex items-center">
                  De</Label>
                <Input
                  type='date'
                  className="mt-2"
                  placeholder="Data de vencimento"
                  value={dataInicial}
                  onChange={(e) => setdataInicial(e.target.value)}
                />
              </div>
              <div className="flex justify-between gap-2">
                <Label className="text-base flex items-center">
                  Até
                </Label>
                <Input
                  type='date'
                  className="mt-2"
                  placeholder="Data de vencimento"
                  value={dataFinal}
                  onChange={(e) => setdataFinal(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Select onValueChange={(value) => { handlerChangeStatus(value) }}>
                  <SelectTrigger className="h-4 w-[160px]">
                    <SelectValue placeholder="Situação" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_LANCAMENTO_OPTIONS.map((status) => (
                      <SelectItem key={status.label} value={status.value} style={{color:"#034869"}}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* ... other filters ... */}
              </div>

            </div>
          </div>

          {/* lancamentos Grid */}
          <div className="mx-auto w-full rounded-md">
            <Card className='font-[Poppins-regular]' style={{color:"#034869"}}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <Label className="ml-1 mb-4 mt-8 font-bold">{
                    (imovel?.proprietarios && imovel?.proprietarios.length > 0 ? imovel?.proprietarios[0].pessoa?.nome + ' - ' : '') +
                    getEnderecoFormatado(imovel?.endereco)}
                  </Label>
                  <Dialog
                    open={isCreateDialogOpen}
                    onOpenChange={(value) => {
                      setIsCreateDialogOpen(value)
                      if (!value) {
                        setTitulo("Criar novo lançamento");
                        lancamentoMethods.reset(defaultValuesLan);
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      {(isAdmin ||
                        user?.permissions.includes("ALL") ||
                        user?.permissions.includes("CREATE_CONDOMINIO_LANCAMENTO")
                      ) && (

                          <Button size={'sm'}
                          className="hover:bg-[#a9d9ef] hover:cursor-pointer bg-[#034869] hover:text-[#034869] text-white">
                            <Plus className="mr-2 h-4 w-4" /> Lançamento
                          </Button>
                        )}
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{titulo}</DialogTitle>
                        <DialogDescription>{titulo.includes('novo') ? 'Preencha os dados do novo lançamento abaixo.' : ''}</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={lancamentoMethods.handleSubmit(onSubmitLancamentoDataLan)}>
                        <div className='mt-2 mr-5'>
                          <Label className='text-base font-[Poppins-Regular]'>
                            Tipo de Lançamento
                            <div className='mt-2 border rounded-md'>
                              <Controller
                                name="tipoId"
                                control={lancamentoMethods.control}

                                render={({ field }) => (
                                  <Select
                                    disabled={disabled}
                                    onValueChange={(value) => {
                                      field.onChange(value);
                                      handleChangeTipo(value);
                                    }}
                                    value={String(field.value)}
                                  >
                                    <SelectTrigger className='h-4'>
                                      <SelectValue placeholder="IPTU, CONDOMÍNIO,..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {tipolancamento?.data.map((tipo) => (
                                        <SelectItem key={tipo.id} value={tipo.id.toString()}>
                                          {tipo.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                              {lancamentoMethods.formState.errors.tipoId?.message &&
                                (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                                  {lancamentoMethods.formState.errors.tipoId.message}
                                </p>)}
                            </div>
                          </Label>
                        </div>

                        <div className='mt-2'>
                          <Label htmlFor="description">Código de Barras
                            <Input
                              type='text'
                              disabled={disabled}
                              placeholder="Código de barras "
                              {...lancamentoMethods.register('linhaDigitavel')}
                              onBlur={(e) => { handlerValidaLinhaDig(e.target.value) }}
                            />
                            {lancamentoMethods.formState?.errors?.linhaDigitavel?.message && <p style={{ color: 'red', fontSize: '0.8rem' }}>*{lancamentoMethods.formState?.errors?.linhaDigitavel?.message}</p>}
                          </Label>
                        </div>

                        <div className={(isPortrait ? "grid grid-cols-2 gap-4 mt-2" : "grid grid-cols-1 gap-4 mt-2")}>
                          <Label className="text-base">
                            Data do Lançamento
                            <Input
                              type='date'
                              className="mt-2"
                              disabled={disabled}
                              placeholder="Data do lançamento"
                              {...lancamentoMethods.register('dataLancamento')}
                            />
                            {lancamentoMethods.formState?.errors?.dataLancamento?.message && <p style={{ color: 'red', fontSize: '0.8rem' }}>*{lancamentoMethods.formState?.errors?.dataLancamento?.message}</p>}
                          </Label>

                          <Label className="text-base">
                            Data Vencimento
                            <Input
                              className="mt-2"
                              type="date"
                              disabled={disabled}
                              placeholder="Data Vencimento"
                              {...lancamentoMethods.register('vencimentoLancamento')}
                            />
                            {lancamentoMethods.formState?.errors?.vencimentoLancamento?.message && <p style={{ color: '#ed535d', fontSize: '0.8rem' }}>* {lancamentoMethods.formState?.errors?.vencimentoLancamento?.message}</p>}
                          </Label>
                        </div>

                        <div className={(isPortrait ? "grid grid-cols-2 gap-4 mt-3" : "grid grid-cols-1 gap-4 mt-3")}>
                          <Label className="text-base">
                            Valor do Lançamento
                            <Input
                              type="number"
                              step={'any'}
                              className="mt-1"
                              disabled={disabled}
                              placeholder="Valor do Lançamento"
                              {...lancamentoMethods.register('valorLancamento')}
                            />
                            {lancamentoMethods.formState?.errors?.valorLancamento?.message && <p style={{ color: '#f26871', fontSize: '0.8rem' }}>* {lancamentoMethods.formState?.errors?.valorLancamento?.message}</p>}
                          </Label>
                          <Label className="text-base">
                            Parcela do Lançamento
                            <Input
                              type="number"
                              className="mt-1"
                              disabled={true}
                              {...lancamentoMethods.register('parcela')}
                            />
                            {lancamentoMethods.formState?.errors?.parcela?.message && <p style={{ color: '#f26871', fontSize: '0.8rem' }}>* {lancamentoMethods.formState?.errors?.parcela?.message}</p>}
                          </Label>
                        </div>

                        <div className='mt-2'>
                          <Label htmlFor="description">Observação</Label>
                          <Textarea placeholder="Observação "
                            {...lancamentoMethods.register('observacao')}
                          />
                        </div>

                        <DialogFooter className='mt-2'>
                          <Button size={"sm"} type='submit'
                          className="hover:bg-[#a9d9ef] hover:cursor-pointer bg-[#034869] hover:text-[#034869] text-white"
                          >{titulo.includes('novo') ? 'Criar lançamento' : 'Confirmar Alteração'}</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(imovel?.lancamentos && imovel.lancamentos.length > 0) ? (
                  <div className=''>

                    <Label className='ml-2' style={{ 'fontSize': '1rem' }}> Lançamentos </Label>
                    <div className='rounded-md border'>
                      <div className='grid grid-cols-5 m-2 font-[Poppins-bold]' >
                        <Label className={!isMobile ? 'border-b pb-5' : 'border-b pb-5 col-span-2'} style={{ 'fontSize': '0.7rem' }}>Descrição</Label>
                        {!isMobile ? (<Label className='border-b pb-5' style={{ 'fontSize': '0.7rem' }}>Emissão</Label>) : (<></>)}
                        <Label className='border-b  pb-5' style={{ 'fontSize': '0.7rem' }}>Vencimento</Label>
                        <Label className='flex justify-end border-b pb-5' style={{ 'fontSize': '0.7rem' }}>Valor</Label>
                        <Label className='border-b pb-5' style={{ 'fontSize': '0.7rem' }}></Label>
                      </div>

                      <div className='grid grid-cols-5 m-2' >
                        {imovel.lancamentos?.map((lancamento) => (
                          <>
                            <Label className={!isMobile ? 'flex items-center' : 'flex items-center col-span-2'} style={{ 'fontSize': '0.7rem' }}>{lancamento.lancamentotipo.name}</Label>
                            {!isMobile ? (<Label className='flex items-center' style={{ 'fontSize': '0.7rem' }}>{moment.utc(lancamento.dataLancamento).format("DD/MM/YYYY")}</Label>) : (<></>)}
                            <Label className='flex items-center' style={{ 'fontSize': '0.7rem' }}>{moment.utc(lancamento.vencimentoLancamento).format("DD/MM/YYYY")}</Label>
                            <Label className='flex justify-end items-center' style={{ 'fontSize': '0.7rem' }}>{lancamento.valorLancamento}</Label>
                            <div className='flex justify-center'>
                              {((isAdmin ||
                                user?.permissions.includes("ALL") ||
                                user?.permissions.includes("UPDATE_CONDOMINIO_LANCAMENTO")
                              ) && lancamento.status === LancamentoStatus.ABERTO) && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleEditLancamento(lancamento);
                                        //setSelectedTipo(tipo)
                                        //setIsEditDialogOpen(true)
                                      }}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>

                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={(e) => {
                                          e.stopPropagation()
                                          //setSelectedTipo(tipo)
                                        }
                                        } title='Excluir Lançamento'>
                                          <Trash2 className="h-4 w-4" />

                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Isso excluir o lançamento da locação
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => { handleDeleteLancamento(lancamento.id) }}>
                                            Sim, excluir o lançamento.
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </>
                                )}
                            </div>
                          </>
                        ))}
                      </div>
                    </div>
                  </div>

                ) : (
                  <p className="text-center text-muted-foreground">
                    Nenhum lançamento para essa locação nesse período.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Boletos */}
        <TabsContent value="boletos" className="space-y-4 font-[Poppins-regular]">
          {/*<div className="flex items-center justify-between">
            <div className=
              {(isPortrait || isTablet || isBigScreen)
                ? "grid grid-cols-3 gap-4 mb-2"
                : "grid grid-cols-1 gap-4 mb-2"}>
              <h1 className='flex items-center'>Período</h1>
              <div className="flex justify-between gap-2">
                <Label className="text-base flex items-center">
                  De</Label>
                <Input
                  type='date'
                  className="mt-2"
                  placeholder="Data de vencimento"
                  value={dataInicial}
                  onChange={(e) => setdataInicial(e.target.value)}
                />
              </div>
              <div className="flex justify-between gap-2">
                <Label className="text-base flex items-center">
                  Até
                </Label>
                <Input
                  type='date'
                  className="mt-2"
                  placeholder="Data de vencimento"
                  value={dataFinal}
                  onChange={(e) => setdataFinal(e.target.value)}
                />

              </div>
            </div>
          </div>*/}

          {/* boletos Grid */}
          <div className="mx-auto w-full rounded-md">
            <Card className='font-[Poppins-regular]' style={{color:"#034869"}}>
              <CardContent>
                {(imovel?.boletos && imovel.boletos.length > 0) ? (
                  <div className=''>

                    <div className='mt-2'>
                      <div className='grid grid-cols-5 m-2 font-[Poppins-bold]' >
                        <Label className={!isMobile ? 'border-b pb-5' : 'border-b pb-5 col-span-2'} style={{ 'fontSize': '0.7rem' }}>Descrição</Label>
                        {!isMobile ? (<Label className='border-b pb-5' style={{ 'fontSize': '0.7rem' }}>Emissão</Label>) : (<></>)}
                        <Label className='border-b  pb-5' style={{ 'fontSize': '0.7rem' }}>Vencimento</Label>
                        <Label className='flex justify-end border-b pb-5' style={{ 'fontSize': '0.7rem' }}>Valor</Label>
                        <Label className='border-b pb-5' style={{ 'fontSize': '0.7rem' }}></Label>
                      </div>

                      <div className='grid grid-cols-5 m-2' >
                        {imovel.boletos?.map((boleto) => (
                          <>
                            <Label className={!isMobile ? 'flex items-center mt-2' : 'flex items-center col-span-2 mt-2'} style={{ 'fontSize': '0.7rem' }}>{boleto.observacao}</Label>
                            {!isMobile ? (<Label className='flex items-center mt-2' style={{ 'fontSize': '0.7rem' }}>{moment.utc(boleto.dataEmissao).format("DD/MM/YYYY")}</Label>) : (<></>)}
                            <Label className='flex items-center  mt-2' style={{ 'fontSize': '0.7rem' }}>{moment.utc(boleto.dataVencimento).format("DD/MM/YYYY")}</Label>
                            <Label className='flex justify-end items-center mt-2' style={{ 'fontSize': '0.7rem' }}>{usdFormatter.format(boleto.valorOriginal)}</Label>
                            <div className='flex justify-center mt-2'>
                              {((isAdmin ||
                                user?.permissions.includes("ALL") ||
                                user?.permissions.includes("UPDATE_LANCAMENTO_IMOVEL")
                              ) && boleto.status === BoletoStatus.PENDENTE) && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        //handleEditLancamento(boleto);
                                        //setSelectedTipo(tipo)
                                        //setIsEditDialogOpen(true)
                                      }}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>

                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={(e) => {
                                          e.stopPropagation()
                                          //setSelectedTipo(tipo)
                                        }
                                        } title='Excluir Boleto'>
                                          <Trash2 className="h-4 w-4" />

                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                          <AlertDialogDescription style={{color:"#034869"}}>
                                            Isso excluir o boleto da locação
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => { handleDeleteLancamento(boleto.id) }}
                                            className="hover:bg-[#a9d9ef] hover:cursor-pointer bg-[#034869] hover:text-[#034869] text-white">
                                            Sim, excluir o boleto.
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </>
                                )}
                            </div>
                          </>
                        ))}
                      </div>
                    </div>
                  </div>

                ) : (
                  <p className="text-center text-muted-foreground">
                    Nenhum boleto para essa locação nesse período.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div >
  )
}
