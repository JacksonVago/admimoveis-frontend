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
import { Bath, Bed, Car, Edit, Pencil,  Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Controller,  useForm } from 'react-hook-form'
import { useMediaQuery } from 'react-responsive'

import { ROUTE } from '@/enums/routes.enum'
import { PageLoader } from '@/pages/assistant/page-loader'
import api from '@/services/axios/api'
import { queryClient } from '@/services/react-query/query-client'
import { transformNullToUndefined } from '@/utils/transform-null-to-undefined'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { LancamentoStatus } from '@/enums/locacao/enums-locacao'
import { Textarea } from '@/components/ui/textarea'
import { useGlobalParams } from '@/globals/GlobalParams'
import { useAuth } from '@/hooks/auth/use-auth'
import React from 'react'
import { BlocoForm } from '../criarbloco/components/bloco-form'
import { Bloco } from '@/interfaces/bloco'
import { blocoSchema, BlocoSchema } from '@/schemas/bloco.schema'
import axios from 'axios'
import { getEnderecoFormatado } from '@/helpers/get-endereco-formatado'
import { LancamentoCondominioSchema, lancCondominioSchema } from '@/schemas/lancamentos.schema'
import { LancamentoCondominio } from '@/interfaces/lancamentocondominio'
import { TipoLancamento } from '@/interfaces/lancamentotipo'
import moment from 'moment'

//Funções de acesso ao banco de dados

//Pega tipo de lançamento
export const getTipos = async (empresaId: number) => {
  return await api.get<TipoLancamento[]>('tipolancamento/' + empresaId)
}


//Consulta bloco
export const getBloco = async (id: number, dataInicial: string, dataFinal: string): Promise<Bloco> => {
  //const response = await api.get<Bloco>(`blocos/findbyid/${id}`)
  const response = await api.get<Bloco>(`/condominios/lancamentos/${id}?dataInicial=${dataInicial}&dataFinal=${dataFinal}`);
  return response.data
}

//Altera bloco
const updateBloco = async (id: number, data: FormData): Promise<Bloco> => {
  const response = await api.put<Bloco>(`blocos/${id}`, data)
  return response.data
}

//Valores default do imóvel
export const getFormattedDefaultValues = (bloco: Bloco | undefined) => {
  return {
    name: bloco?.name || undefined,
    qtdUnidades: bloco?.qtdUnidades || undefined,
    totalAndares: bloco?.totalAndares || undefined,
    possuiElevador: bloco?.possuiElevador || undefined,
    anoConstrucao: bloco?.anoConstrucao || undefined,
  }
}

const fetchDocumentFiles = async (documents: Bloco['documentos']) => {
  const documentFilesPromises =
    documents?.map(async (doc) => {
      try {
        console.log('link', import.meta.env.VITE_AZURE_BLOB_CONTAINER + doc.url);

        const response = await fetch(
          import.meta.env.VITE_AZURE_BLOB_CONTAINER + doc.url
        )
        console.log('response', response);

        if (!response.ok) {
          throw new Error('Erro ao buscar documento')
        }
        const blob = await response.blob()
        const file = new File([blob], doc?.name || 'documento', { type: doc?.type })
        return {
          file,
          preview: URL.createObjectURL(file),
          name: doc.name,
          type: doc.type,
          // size: doc?.size,
          id: doc.id,
          url: doc.url
        }
      } catch (error) {
        console.error(error)
        return null
      }
    }) || []
  const resolvedFiles = await Promise.all(documentFilesPromises)
  return resolvedFiles.filter(Boolean)
}

export const DetalhesBloco = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isPortrait = useMediaQuery({ query: '(min-width: 1224px)' })
  const isTablet = useMediaQuery({ query: '(min-width: 746px)' })
  const isMobile = useMediaQuery({ query: '(min-width: 400px)' })

  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
  const [isEditing, setIsEditing] = React.useState(false)
  const [titulo, setTitulo] = React.useState("Criar novo lançamento")
  const disabled = isEditing

  const navigate = useNavigate()
  const dataParams = useParams<{ id: string }>()
  const id = dataParams.id ? parseInt(dataParams.id) : undefined
  const [dataInicial, setdataInicial] = useState(moment(new Date()).format("YYYY-MM-DD"));
  const [dataFinal, setdataFinal] = useState(moment(new Date()).format("YYYY-MM-DD"));

  const [isEditingPersonalInfo, setIsEditingPersonalInfo] = useState(false)
  const [activeTab, setActiveTab] = useState('bloco-info')
  //const [proprietariosSearchQuery, setProprietariosSearchQuery] = useState('')
  //const [locatariosSearchQuery, setLocatariosSearchQuery] = useState('')
  //const [isCreateLocacaoOpen, setIsCreateLocacaoOpen] = useState(false)
  //const [selectedLocatario, setSelectedLocatario] = useState<Locatario | null>(null)
  const { toast } = useToast()


  //Globals
  const glb_params = useGlobalParams();


  //Consulta bloco
  const {
    data: bloco,
    isLoading,
    isSuccess
  } = useQuery({
    queryKey: ['bloco', id, dataInicial, dataFinal],
    queryFn: () => getBloco(id!, dataInicial, dataFinal)
  });

  const { data: documentFilesData = [], isSuccess: isSuccessDocuments } = useQuery({
    queryKey: ['documentFiles', id, bloco?.documentos],
    queryFn: () => fetchDocumentFiles(bloco?.documentos),
    enabled: !!bloco?.documentos?.length
  })

  const documentFiles = React.useMemo(() => documentFilesData, [isSuccessDocuments])


  //remove null values from object
  const parsedData = transformNullToUndefined(bloco || {})
  console.log('parsedData', parsedData);

  //remove null values from object endereço
  const defaultValues = {
    ...parsedData,
    condominioId: bloco?.condominioId.toString() || undefined,
    empresaId: bloco?.condominio?.empresaId,
    //condominios: [{ nome: bloco?.condominio.name, id: bloco?.condominio.id }],
  }


  //Mutations

  const createLancamento = useMutation({
    mutationFn: async (data: FormData) => {

      setdataInicial(moment(data.get('dataLancamento') as string).format("YYYY-MM-DD"));
      setdataFinal(moment(data.get('dataLancamento') as string).format("YYYY-MM-DD"));
      return await api.post<LancamentoCondominio>(`/lancamentosCondominios`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },
    onSuccess: () => {
      ['bloco', id].forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] })
      })
    }
  })

  const updateLancamento = useMutation({
    mutationFn: async (data: FormData) => {
      return await api.put<LancamentoCondominio>(`/lancamentosCondominios/${data.get('id')}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },
    onSuccess: () => {
      ['bloco', id].forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] })
      })
    }
  })

  const deleteLancamento = useMutation({
    mutationFn: async (idLancamento: number) => {
      return await api.delete(`/lancamentosCondominios/${idLancamento}`)
    },
    onSuccess: () => {
      ['bloco', id].forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] })
      })

      toast({
        title: 'Lançamento excluído com sucesso',
        description: `Lançamento excluído com sucesso`
      })
    }
  })

  //Excluir blocos
  const deleteBlocoMutation = useMutation({
    mutationFn: (id: number) => api.delete(`blocos/${id}`),
    onSuccess: () => {
      ;['bloco', 'documentFiles', id].forEach((key) =>
        queryClient.invalidateQueries({
          queryKey: [key]
        })
      )
      toast({ title: 'Bloco excluído com sucesso' })
      navigate(ROUTE.BLOCOS)
    },
    onError: () => {
      toast({ title: 'Erro ao excluir bloco', variant: 'destructive' })
    }
  });

  //Altera Bloco
  const updateMutation = useMutation({
    mutationFn: (data: FormData) => updateBloco(id!, data),
    onSuccess: () => {
      ;['bloco', 'documentFiles', id].forEach((key) =>
        queryClient.invalidateQueries({
          queryKey: [key]
        })
      )
      toast({ title: 'Bloco atualizado com sucesso' })
      setIsEditingPersonalInfo(false)
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        // Check if there's a response and data within the error
        if (error.response && error.response.data) {
          console.error('Error message from server:', error.response.data);
          toast({
            title: 'Erro ao atualizar bloco',
            description: error.response.data.message,
          })

          // You can also set this error message to a state to display it in your UI
        } else {
          console.error('Axios error without response data:', error.message);
        }
      } else {
        console.error('Non-Axios error:', error);
      }
    }
  });

  //Dados do condomínio schema de validação
  const blocoMethods = useForm<BlocoSchema>({
    resolver: zodResolver(blocoSchema),
    mode: 'all',
    defaultValues
  });

  useEffect(() => {
    //setProprietariosSearchQuery('');
    //setLocatariosSearchQuery('');
    glb_params.updTitle_form('Blocos');

    if (glb_params.pastaOrig === '') {
      glb_params.updPastaOrig('bloco-info');
    }
    else {
      //setActiveTab(glb_params.pastaOrig);
    }

  }, [])

  useEffect(() => {
    if (isSuccess) {
      blocoMethods.reset(defaultValues)
    }

  }, [id, bloco, documentFiles, isSuccess])

  useEffect(() => {
    console.log(glb_params.pastaOrig);
  }, [glb_params])

  //Validade dados do condomínio no caso de alteração
  const onSubmitBlocoData = (data: BlocoSchema) => {
    const documentosToDeleteIds = data?.documentosToDeleteIds;
    const newDocs = data?.documentos?.filter((doc: any) => !doc.id) || []

    //form data
    const form = new FormData()

    if (data.name) {
      form.append('name', data.name)
    }

    if (data.observacao) {
      form.append('observacao', data.observacao.toString());
    }

    if (data.qtdUnidades) {
      form.append('qtdUnidades', data.qtdUnidades.toString())
    }

    if (data.totalAndares) {
      form.append('totalAndares', data.totalAndares.toString())
    }

    if (data.possuiElevador) {
      form.append('possuiElevador', data.possuiElevador.toString())
    }

    if (data.anoConstrucao) {
      form.append('anoConstrucao', data.anoConstrucao.toString())
    }

    form.append('condominioId', data.condominioId ? data.condominioId.toString() : '0');
    form.append('empresaId', glb_params.id_empresa ? glb_params.id_empresa : "0");


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


  const handlerChangeFolder = async (folder: string) => {
    glb_params.updOrigin_url("blocos");
    glb_params.updId_orig((id! ? id : 0).toString());
    glb_params.updPastaOrig(folder);
    setActiveTab(folder);

    /*if (folder === 'lancamentos') {
      const { data } = await api.get<Bloco>(`/condominios/lancamentos/${id}?dataInicial=${dataInicial}&dataFinal=${dataFinal}`);
      blocoMethods.reset(data);      
    }*/
  }

  const handlerNewLancamento = () => {
    navigate(ROUTE.LANCAMENTOS_CONDOMINIOS_CRIAR.replace(':idBloco', id ? id.toString() : '0'));
  }

  const handlerDetailImovel = (id: number) => {
    navigate(`${ROUTE.IMOVEIS}/${id}`)
  }

  const onSubmitLancamentoData = async (data: LancamentoCondominioSchema) => {
    try {
      const form = new FormData()

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

      if (data?.rateia) {
        form.append('rateia', data.rateia)
      }

      if (data?.status) {
        form.append('status', data.status)
      }

      if (data?.tipoId) {
        form.append('tipoId', data.tipoId.toString())
      }

      if (data?.blocoId) {
        form.append('blocoId', data.blocoId.toString())
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

  //default values lancamentos
  const defaultValuesLanc = React.useMemo(
    () => ({
      id: 0,
      blocoId: bloco?.id,
      dataLancamento: moment.utc(new Date()).format("YYYY-MM-DD"),
      //vencimentoLancamento: moment.utc(calcVencimento()).format("YYYY-MM-DD"),
      parcela: 1,
      status: LancamentoStatus.ABERTO,
    }),
    [bloco]
  )

  React.useEffect(() => {
    //glb_params.updTitle_form(`Lancamentos - ${moment(dataInicial).format('DD/MM/YYYY')} à ${moment(dataFinal).format('DD/MM/YYYY')}`);
    if (localStorage) lancamentoMethods.reset(defaultValuesLanc)
  }, [defaultValuesLanc])

  //react hook form

  const lancamentoMethods = useForm<LancamentoCondominioSchema>({
    resolver: zodResolver(lancCondominioSchema),
    mode: 'onBlur',
    defaultValues: defaultValuesLanc,
  })

  React.useEffect(() => {
    if (bloco) {
      lancamentoMethods.reset(defaultValuesLanc) // seta os valores do formulário com os dados do proprietário
    }
  }, [bloco])

  const handleDeleteLancamento = (idLancamento: number) => {
    deleteLancamento.mutate(idLancamento);
  }

  //Consulta Tipo lanacmento
  const {
    data: tipolancamento
  } = useQuery({
    queryKey: ['tipolancamento'],
    queryFn: () => getTipos(glb_params.id_empresa ? Number(glb_params.id_empresa) : 0),
  });

  const handleEditLancamento = (lancamento: LancamentoCondominio) => {
    setTitulo("Alterar lançamento")
    setIsCreateDialogOpen(true);
    lancamentoMethods.setValue("id", lancamento.id);
    lancamentoMethods.setValue("dataLancamento", moment.utc(lancamento.dataLancamento).format("YYYY-MM-DD"));
    lancamentoMethods.setValue("vencimentoLancamento", moment.utc(lancamento.vencimentoLancamento).format("YYYY-MM-DD"));
    lancamentoMethods.setValue("valorLancamento", lancamento.valorLancamento);
    lancamentoMethods.setValue("observacao", lancamento.observacao);
    lancamentoMethods.setValue("rateia", lancamento.rateia);
    lancamentoMethods.setValue("status", lancamento.status);
    lancamentoMethods.setValue("tipoId", lancamento.tipoId);
    lancamentoMethods.setValue("blocoId", lancamento.blocoId);
    console.log(lancamentoMethods.getValues());
  }

  const handleChangeTipo = (value: string) => {
    let tipo = tipolancamento?.data.find(tipo => tipo.id === Number(value));
    lancamentoMethods.setValue('valorLancamento', Number(tipo?.valorFixo));
  }

  if (isLoading) return <PageLoader />

  return (
    <div className="container mx-auto space-y-6 p-4 font-[Poppins-regular]" style={{color: "#034869"}}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Detalhes</h1>
        {activeTab === 'bloco-info' && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              {(isAdmin ||
                user?.permissions.includes("ALL") ||
                user?.permissions.includes("DELETE_BLOCO")
              ) && (
                  <Button variant="destructive" className='h-full hover:cursor-pointer hover:bg-red-400'>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir Bloco
                  </Button>)}
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isso excluirá permanentemente o bloco e todos os
                  dados associados a ele.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    deleteBlocoMutation.mutate(id!)
                  }}
                >
                  Sim, excluir bloco
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(value) => { handlerChangeFolder(value) }}>
        <TabsList>
          <TabsTrigger value="bloco-info" style={{color: "#034869"}} className='text-[0.7rem] hover:cursor-pointer hover:bg-gray-200'>Dados do Bloco</TabsTrigger>
          <TabsTrigger value="imoveis" style={{color: "#034869"}} className='text-[0.7rem] hover:cursor-pointer hover:bg-gray-200'>Imóveis</TabsTrigger>
          <TabsTrigger value="lancamentos" style={{color: "#034869"}} className='text-[0.7rem] hover:cursor-pointer hover:bg-gray-200'>Lançamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="bloco-info" className="space-y-4 font-[Poppins-regular]">
          <Card style={{color: "#034869"}}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-1xl">
                <span>Informações do Bloco</span>
                {(isAdmin ||
                  user?.permissions.includes("ALL") ||
                  user?.permissions.includes("DELETE_BLOCO")
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
              <BlocoForm.Root
                createBlocoMethods={blocoMethods}
                onSubmitBlocoData={onSubmitBlocoData}
              >
                <BlocoForm.FormContent
                  createBlocoMethods={blocoMethods}
                  disabled={!isEditingPersonalInfo}
                />
                <div className="mt-6">
                  {isEditingPersonalInfo && (
                    <Button
                      disabled={//!blocoMethods.formState.isDirty 
                        !blocoMethods.formState.isDirty || !blocoMethods.formState.isValid
                      }
                      type="submit"
                      className="mt-4 hover:bg-[#a9d9ef] hover:cursor-pointer bg-[#034869] hover:text-[#034869] text-white"
                    >
                      Salvar Alterações
                    </Button>
                  )}
                </div>
              </BlocoForm.Root>
            </CardContent>
          </Card>
        </TabsContent>

        {/*Imóveis */}
        <TabsContent value="imoveis" className="space-y-4 font-[Poppins-regular]" style={{color: "#034869"}}>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Imóveis</h2>
            {/*(isAdmin ||
              user?.permissions.includes("ALL") ||
              user?.permissions.includes("UPDATE_PROPRIETARIO")
            ) && (
                <Button
                  size={"sm"}
                  onClick={handlerNewLancamento}
                  className='hover:cursor-pointer hover:bg-gray-400'>
                  <Plus className="mr-2 h-4 w-4" />
                  Propriedade
                </Button>
              )*/}
          </div>

          <div className={(isPortrait ? "grid gap-4 grid-cols-3" : isTablet ? "grid gap-4 grid-cols-2" : isMobile ? "grid gap-4 grid-cols-1" : "grid gap-4 grid-cols-1")}>
            {bloco?.imovels?.length === 0 && (
              <span>Nenhum imóvel cadastrado para este bloco.</span>
            )}
            {
              bloco?.imovels?.map((imovel) => (
                <Card key={imovel.id} style={{color: "#034869"}}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{imovel.description}</span>
                      <Badge variant="secondary" className='bg-[#a7d9f2]'>{imovel.status}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <Bed className='text-[#034869]' />
                      <p>
                        {imovel.quartos}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <Label className="font-semibold">Metragem</Label>
                      <div className='text-[#034869]'>
                        {imovel.metragem} m²
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                    <Bath className='text-[#034869]' />
                      <div className='text-[#034869]'>
                        {imovel.banheiros}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <Car className='text-[#034869]' />
                      <div className='text-[#034869] '>
                        {imovel.vagasEstacionamento}
                      </div>

                    </div>

                    <div className="grid grid-cols-3 gap-4 flex items-end">
                      {(isAdmin ||
                        user?.permissions.includes("ALL") ||
                        user?.permissions.includes("VIEW_IMOVELS")
                      ) && (

                          <Button
                            className='mt-2 hover:bg-[#daeffa] hover:cursor-pointer bg-[#a7d9f2]'
                            variant="secondary"
                            size="sm"
                            onClick={() => { handlerDetailImovel(imovel.id) }}
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
                  </CardFooter>
                </Card>
              ))}
          </div>
        </TabsContent>


        {/*Lançamentos */}
        <TabsContent value="lancamentos" className="space-y-4 font-[Poppins-regular]" style={{color: "#034869"}}>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Lançamentos</h2>
            {(isAdmin ||
              user?.permissions.includes("ALL") ||
              user?.permissions.includes("CREATE_CONDOMINIO_LANCAMENTO")
            ) && (
                <Button
                  size={"sm"}
                  onClick={handlerNewLancamento}
                  className="mt-4 hover:bg-[#a9d9ef] hover:cursor-pointer bg-[#034869] hover:text-[#034869] text-white"
                  >
                  <Plus className="mr-2 h-4 w-4" />
                  Lançamento
                </Button>
              )}
          </div>

          <div className={(isPortrait ? "grid gap-4 grid-cols-3" : isTablet ? "grid gap-4 grid-cols-2" : isMobile ? "grid gap-4 grid-cols-1" : "grid gap-4 grid-cols-1")}>
            {/*bloco?.lancamentosCondominios?.length === 0 && (
              <span>Nenhum lançamento cadastrado para este bloco.</span>
            )*/}
            {
              <div className="mx-auto w-full rounded-md">
                <Card className='font-[Poppins-regular]' style={{color: "#034869"}}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <Label className="ml-1 mb-4 mt-8 font-bold">{bloco?.condominio?.name + ' ' + bloco?.name + ' - ' + getEnderecoFormatado(bloco?.condominio?.endereco)}</Label>
                      <Dialog
                        open={isCreateDialogOpen}
                        onOpenChange={(value) => {
                          setIsCreateDialogOpen(value)
                          if (!value) {
                            setTitulo("Criar novo lançamento");
                            lancamentoMethods.reset(defaultValuesLanc);
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          {(isAdmin ||
                            user?.permissions.includes("ALL") ||
                            user?.permissions.includes("CREATE_CONDOMINIO_LANCAMENTO")
                          ) && (

                              <Button size={'sm'}
                              className="mt-4 hover:bg-[#a9d9ef] hover:cursor-pointer bg-[#034869] hover:text-[#034869] text-white"
                              >
                                <Plus className="mr-2 h-4 w-4" /> Lançamento
                              </Button>
                            )}
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{titulo}</DialogTitle>
                            <DialogDescription>{titulo.includes('novo') ? 'Preencha os dados do novo lançamento abaixo.' : ''}</DialogDescription>
                          </DialogHeader>
                          <form onSubmit={lancamentoMethods.handleSubmit(onSubmitLancamentoData)}>
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
                              <Label className='text-base font-[Poppins-Regular]'>
                                Rateia
                                <div className='mt-2 border rounded-md'>
                                  <Controller
                                    name="rateia"
                                    control={lancamentoMethods.control}

                                    render={({ field }) => (
                                      <Select
                                        disabled={disabled}
                                        onValueChange={(value) => {
                                          field.onChange(value);
                                        }}
                                        value={String(field.value)}
                                      >
                                        <SelectTrigger className='h-4'>
                                          <SelectValue placeholder="Sim/Não" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem key={'Sim'} value={'Sim'}>
                                            Sim
                                          </SelectItem>
                                          <SelectItem key={'Não'} value={'Não'}>
                                            Não
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    )}
                                  />
                                  {lancamentoMethods.formState.errors.rateia?.message &&
                                    (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                                      {lancamentoMethods.formState.errors.rateia.message}
                                    </p>)}
                                </div>
                              </Label>
                            </div>
                            <div className='mt-2'>
                              <Label htmlFor="description">Observação</Label>
                              <Textarea placeholder="Observação "
                                {...lancamentoMethods.register('observacao')}
                              />
                            </div>

                            <DialogFooter className='mt-2'>
                              <Button size={"sm"} type='submit'>{titulo.includes('novo') ? 'Criar lançamento' : 'Confirmar Alteração'}</Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(bloco?.lancamentosCondominios && bloco.lancamentosCondominios.length > 0) ? (
                      <div className=''>
                        <div className='rounded-md border'>
                          <div className='grid grid-cols-5 m-2 font-[Poppins-bold]' >
                            <Label className={!isMobile ? 'border-b pb-5' : 'border-b pb-5 col-span-2'} style={{ 'fontSize': '0.7rem' }}>Descrição</Label>
                            {!isMobile ? (<Label className='border-b pb-5' style={{ 'fontSize': '0.7rem' }}>Emissão</Label>) : (<></>)}
                            <Label className='border-b  pb-5' style={{ 'fontSize': '0.7rem' }}>Vencimento</Label>
                            <Label className='flex justify-end border-b pb-5' style={{ 'fontSize': '0.7rem' }}>Valor</Label>
                            <Label className='border-b pb-5' style={{ 'fontSize': '0.7rem' }}></Label>
                          </div>

                          <div className='grid grid-cols-5 m-2' >
                            {bloco.lancamentosCondominios?.map((lancamento) => (
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
            }
          </div>
        </TabsContent>
      </Tabs>
    </div >
  )
}
