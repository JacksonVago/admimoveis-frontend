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
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Edit, Mail, Phone, Plus,  Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMediaQuery } from 'react-responsive'

import { ROUTE } from '@/enums/routes.enum'
import { PageLoader } from '@/pages/assistant/page-loader'
import api from '@/services/axios/api'
import { queryClient } from '@/services/react-query/query-client'
import { transformNullToUndefined } from '@/utils/transform-null-to-undefined'
import { useNavigate, useParams } from 'react-router-dom'
import { CondominioForm } from '../criarcondominio/components/condominio-form'
import { useGlobalParams } from '@/globals/GlobalParams'
import { useAuth } from '@/hooks/auth/use-auth'
import { usdFormatter } from '@/utils/format-money'
import { Condominio } from '@/interfaces/condominio'
import React from 'react'
import { condominioSchema, CondominioSchema } from '@/schemas/condominio.schema'
import { ImovelStatus } from '@/enums/imovel/enums-imovel'
import { getCondominio } from '../requests'

//Funções de acesso ao banco de dados
//Consulta condominio
//Valores default do imóvel
export const getFormattedDefaultValues = (condominio: Condominio | undefined) => {
  return {
    name: condominio?.name || undefined,
    qtdUnidades: condominio?.qtdUnidades || undefined,
    formaRateio: condominio?.formaRateio || undefined,

    //address
    bairro: condominio?.endereco?.bairro || undefined,
    numero: condominio?.endereco?.numero || undefined,
    cep: condominio?.endereco?.cep || undefined,
    cidade: condominio?.endereco?.cidade || undefined,
    complemento: condominio?.endereco?.complemento || undefined,
    estado: condominio?.endereco?.estado || undefined,
    logradouro: condominio?.endereco?.logradouro || undefined
  }
}

const fetchDocumentFiles = async (documents: Condominio['documentos']) => {
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

export const DetalhesCondominio = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isPortrait = useMediaQuery({ query: '(min-width: 1224px)' })
  const isTablet = useMediaQuery({ query: '(min-width: 746px)' })
  const isMobile = useMediaQuery({ query: '(min-width: 400px)' })

  const navigate = useNavigate()
  const dataParams = useParams<{ id: string }>()
  const id = dataParams.id ? parseInt(dataParams.id) : undefined
  const [isEditingPersonalInfo, setIsEditingPersonalInfo] = useState(false)
  const [activeTab, setActiveTab] = useState('cond-info')
  //const [proprietariosSearchQuery, setProprietariosSearchQuery] = useState('')
  //const [locatariosSearchQuery, setLocatariosSearchQuery] = useState('')
  //const [isCreateLocacaoOpen, setIsCreateLocacaoOpen] = useState(false)
  //const [selectedLocatario, setSelectedLocatario] = useState<Locatario | null>(null)
  const { toast } = useToast()

  //Globals
  const glb_params = useGlobalParams();


  //Consulta condomínio
  const {
    data: condominio,
    isLoading,
    isSuccess
  } = useQuery({
    queryKey: ['condominio', id],
    queryFn: () => getCondominio(id!)
  });

  const { data: documentFilesData = [], isSuccess: isSuccessDocuments } = useQuery({
    queryKey: ['documentFiles', id, condominio?.documentos],
    queryFn: () => fetchDocumentFiles(condominio?.documentos),
    enabled: !!condominio?.documentos?.length
  })

  const documentFiles = React.useMemo(() => documentFilesData, [isSuccessDocuments])


  //remove null values from object
  const parsedData = transformNullToUndefined(condominio || {})
  console.log('parsedData', parsedData);

  //remove null values from object endereço
  const enderecoData = transformNullToUndefined(condominio?.endereco || {})
  const defaultValues = {
    ...parsedData,
    //tipoId: imovel?.tipo.name,
    logradouro: enderecoData?.logradouro,
    numero: enderecoData?.numero ? enderecoData.numero : undefined,
    complemento: enderecoData?.complemento,
    bairro: enderecoData?.bairro,
    cidade: enderecoData?.cidade,
    cep: enderecoData?.cep,
    estado: enderecoData?.estado,
  }


  //Mutations
  //Excluir condomínios
  const deleteCondominioMutation = useMutation({
    mutationFn: (id: number) => api.delete(`condominios/${id}`),
    onSuccess: () => {
      ;['condominio', 'documentFiles', id].forEach((key) =>
        queryClient.invalidateQueries({
          queryKey: [key]
        })
      )
      toast({ title: 'Condomínio excluído com sucesso' })
      navigate(ROUTE.CONDOMINIOS)
    },
    onError: () => {
      toast({ title: 'Erro ao excluir condomínio', variant: 'destructive' })
    }
  });

  //Altera Condomínio
  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await api.put<Condominio>(`/condominios/${data.get('id')}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },
    onSuccess: () => {
      ['condominio', 'documentFiles', id].forEach((key) =>
        queryClient.invalidateQueries({
          queryKey: [key]
        })
      )
      toast({ title: 'Condomínio atualizado com sucesso' })
      setIsEditingPersonalInfo(false)
    }
  })


  //Dados do condomínio schema de validação
  const condominioMethods = useForm<CondominioSchema>({
    resolver: zodResolver(condominioSchema),
    mode: 'all',
    defaultValues
  });

  useEffect(() => {
    //setProprietariosSearchQuery('');
    //setLocatariosSearchQuery('');
    glb_params.updTitle_form('Condomínios');

    if (glb_params.pastaOrig === '') {
      glb_params.updPastaOrig('cond-info');
    }
    else {
      //setActiveTab(glb_params.pastaOrig);
    }

  }, [])

  useEffect(() => {
    if (isSuccess) {
      condominioMethods.reset(defaultValues)
    }

  }, [id, condominio, documentFiles, isSuccess])

  useEffect(() => {
    console.log(glb_params.pastaOrig);
  }, [glb_params])

  //Validade dados do condomínio no caso de alteração
  const onSubmitCondominioData = (data: CondominioSchema) => {
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

    if (data.formaRateio) {
      form.append('formaRateio', data.formaRateio)
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


  const handlerChangeFolder = (folder: string) => {
    glb_params.updOrigin_url("condominios");
    glb_params.updId_orig((id! ? id : 0).toString());
    glb_params.updPastaOrig(folder);
    setActiveTab(folder);
  }

  const handlerNewBloco = () => { 
    navigate(ROUTE.BLOCOS_CRIAR.replace(':idCondominio', id ? id.toString() : '0'));
  }

  if (isLoading) return <PageLoader />

  return (
    <div className="container mx-auto space-y-6 p-4 font-[Poppins-regular]">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Detalhes</h1>
        {activeTab === 'cond-info' && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              {(isAdmin ||
                user?.permissions.includes("ALL") ||
                user?.permissions.includes("DELETE_CONDOMINIO")
              ) && (
                  <Button variant="destructive" className='h-full hover:cursor-pointer hover:bg-red-400'>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir Condomínio
                  </Button>)}
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isso excluirá permanentemente o condomínio e todos os
                  dados associados a ele.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    deleteCondominioMutation.mutate(id!)
                  }}
                >
                  Sim, excluir condomínio
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(value) => { handlerChangeFolder(value) }}>
        <TabsList>
          <TabsTrigger value="cond-info" className=' hover:cursor-pointer hover:bg-gray-200'>Dados do Condomínio</TabsTrigger>
          <TabsTrigger value="blocos" className=' hover:cursor-pointer hover:bg-gray-200'>Blocos</TabsTrigger>
          <TabsTrigger value="imoveis" className=' hover:cursor-pointer hover:bg-gray-200'>Imóveis</TabsTrigger>
        </TabsList>

        <TabsContent value="cond-info" className="space-y-4 font-[Poppins-regular]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-1xl">
                <span>Informações do Condomínio</span>
                {(isAdmin ||
                  user?.permissions.includes("ALL") ||
                  user?.permissions.includes("DELETE_CONDOMINIO")
                ) && (

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingPersonalInfo(!isEditingPersonalInfo)}
                      className=' hover:cursor-pointer hover:bg-gray-200'
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      {isEditingPersonalInfo ? 'Cancelar' : 'Editar'}
                    </Button>
                  )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CondominioForm.Root
                createCondominioMethods={condominioMethods}
                onSubmitCondominioData={onSubmitCondominioData}
              >
                <CondominioForm.FormContent
                  createCondominioMethods={condominioMethods}
                  disabled={!isEditingPersonalInfo}
                />
                <div className="mt-6">
                  {isEditingPersonalInfo && (
                    <Button
                      disabled={//!condominioMethods.formState.isDirty 
                        !condominioMethods.formState.isDirty || !condominioMethods.formState.isValid
                      }
                      type="submit"
                      className="mt-4 hover:cursor-pointer hover:bg-gray-600"
                    >
                      Salvar Alterações
                    </Button>
                  )}
                </div>
              </CondominioForm.Root>
            </CardContent>
          </Card>
        </TabsContent>

        {/*Blocos */}
        <TabsContent value="blocos" className="space-y-4 font-[Poppins-regular]">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Blocos</h2>
            {(isAdmin ||
              user?.permissions.includes("ALL") ||
              user?.permissions.includes("UPDATE_PROPRIETARIO")
            ) && (
                <Button
                  className="hover:cursor-pointer hover:bg-gray-600"
                  size={"sm"}
                  onClick={handlerNewBloco}>
                  <Plus className="mr-2 h-4 w-4" />
                  Bloco
                </Button>
              )}
          </div>

          <div className={(isPortrait ? "grid gap-4 grid-cols-3" : isTablet ? "grid gap-4 grid-cols-2" : isMobile ? "grid gap-4 grid-cols-1" : "grid gap-4 grid-cols-1")}>
            {condominio?.blocos?.length === 0 && (
              <span>Nenhum bloco cadastrado para este condomínio.</span>
            )}
            {
              condominio?.blocos?.map((bloco) => (
                <Card key={bloco.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{bloco.name}</span>
                      <Badge variant="default">{bloco.anoConstrucao}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <Label className="font-semibold">Quantidade de Imóveis</Label>
                      <p>
                        {bloco.qtdUnidades}
                      </p>
                    </div>

                    <Label className="font-semibold">Total de andares</Label>
                    <div className='grid grid-cols-10 flex justify-items-start'>
                      <div className=''>
                        <Mail className='text-gray-500' />
                      </div>
                      <div className='text-gray-500 col-span-9'>
                        {bloco.totalAndares}
                      </div>
                    </div>
                    <Label className="font-semibold">Possui elevador</Label>
                    <div className='grid grid-cols-10 flex justify-items-start'>
                      <Phone className='text-gray-500' />
                      <div className='text-gray-500 col-span-9'>
                        {bloco.possuiElevador === "S" ? 'Sim' : 'Não'}
                      </div>

                    </div>
                    <div className="grid grid-cols-3 gap-4 flex items-end">
                      {(isAdmin ||
                        user?.permissions.includes("ALL") ||
                        user?.permissions.includes("VIEW_BLOCOS")
                      ) && (

                          <Button
                            className="mt-2 hover:cursor-pointer hover:bg-gray-200"
                            variant="secondary"
                            size="sm"
                            onClick={() => { /*handlerDetailProp(proprietario.pessoaId)*/ }}
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

        {/* Imoveis */}
        <TabsContent value="imoveis" className="space-y-4 font-[Poppins-regular]">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[1.3rem]">Imóveis</h2>
          </div>

          {/*Lista de imoveis do condomínio */}
          <div className={(isPortrait ? "grid gap-4 grid-cols-3" : isTablet ? "grid gap-4 grid-cols-2" : isMobile ? "grid gap-4 grid-cols-1" : "grid gap-4 grid-cols-1")}>
            {condominio?.imovels?.length === 0 && (
              <span>Nenhum imóvel cadastrado para este condomínio.</span>
            )}
            {
              condominio?.imovels?.map((imovel) => (
                <Card key={imovel.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{imovel.description}</span>
                      <Badge variant={imovel.status == ImovelStatus.INDISPONIVEL ? "destructive" : "default"} >{imovel.status}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 flex items-center mt-2">
                      <Label>Valor do Aluguel</Label>
                      <p className="font-semibold">
                        {usdFormatter.format(imovel.valorAluguel ? imovel.valorAluguel : 0)}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 flex items-center mt-2">
                      <Label>Quartos</Label>
                      <p className="font-semibold">
                        {imovel.quartos ? imovel.quartos : 'N/A'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 flex items-center mt-2">
                      <Label>Banheiros</Label>
                      <p className="font-semibold">
                        {imovel.banheiros ? imovel.banheiros : 'N/A'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 flex items-center mt-2">
                      <Label>Vagas de Estacionamento</Label>
                      <p className="font-semibold">
                        {imovel.vagasEstacionamento ? imovel.vagasEstacionamento : 'N/A'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 flex items-center mt-2">
                      <Label>Metragem</Label>
                      <p className="font-semibold">
                        {imovel.metragem ? imovel.metragem : 'N/A'}
                      </p>
                    </div>

                    <hr className="border-t border-gray-300 mt-3" />
                  </CardContent>
                  <CardFooter className="flex justify-end space-x-2 font-[Poppins-regular]">    
                                          {(isAdmin ||
                        user?.permissions.includes("ALL") ||
                        user?.permissions.includes("VIEW_BLOCOS")
                      ) && (

                          <Button
                            className="mt-2 hover:cursor-pointer hover:bg-gray-200"
                            variant="secondary"
                            size="sm"
                            onClick={() => { /*handlerDetailProp(proprietario.pessoaId)*/ }}
                            style={
                              {
                                fontSize: '0.8rem',
                              }}
                          >
                            Ver detalhes
                          </Button>
                        )}
                
                  </CardFooter>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div >
  )
}


