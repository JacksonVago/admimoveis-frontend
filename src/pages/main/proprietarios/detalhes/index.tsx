/*import {
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
import { Button } from '@/components/ui/button'*/
import { Card } from '@/components/ui/card'
//import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
/*import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ROUTE } from '@/enums/routes.enum'
import { getEnderecoFormatado } from '@/helpers/get-endereco-formatado'
import { toast } from '@/hooks/use-toast'*/
import { Proprietario } from '@/interfaces/proprietario'
//import { ProprietarioSchema, proprietarioSchema } from '@/schemas/proprietario.schema'
import api from '@/services/axios/api'
/*import { transformNullToUndefined } from '@/utils/transform-null-to-undefined'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Edit, Link2Off, Trash2 } from 'lucide-react'
import * as React from 'react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { ProprietarioForm } from '../components/proprietario-form'*/

export const putProprietario = async (id: number, data: FormData) => {
  return await api.put<Proprietario>(`/proprietarios/${id}`, data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
export const deleteProprietario = async (id: number) => {
  return await api.delete(`/proprietarios/${id}`)
}

export const useGetProprietarioQueryOptions = ({
  id,
  enabled
}: {
  id?: number
  enabled: boolean
}) => {
  return {
    queryKey: ['proprietario', id],
    enabled,
    queryFn: async () => {
      const { data } = await api.get<Proprietario>(`/proprietarios/${id}`)
      return data
    }
  }
}

//break in components: 1 page component, form component

export const DetalhesProprietarioForm = ({
  //id,
  //desvincularProprietarioImovel
}: {
  //id: number
  //disabled?: boolean
  //desvincularProprietarioImovel?: () => void
}) => {
  //const navigate = useNavigate()

  // Get the initial data from the API
  /*const { data: proprietario, isLoading } = useQuery(
    useGetProprietarioQueryOptions({
      enabled: !!id,
      id: id
    })
  )*/

  /*const { data: documentFilesData = [], isSuccess: isSuccessDocuments } = useQuery({
    queryKey: ['documentFiles', id, proprietario?.documentos],
    queryFn: () => fetchDocumentFiles(proprietario?.documentos),
    enabled: !!proprietario?.documentos?.length
  })

  const documentFiles = React.useMemo(() => documentFilesData, [isSuccessDocuments])

  const fetchDocumentFiles = async (documents: Proprietario['documentos']) => {
    const documentFilesPromises =
      documents?.map(async (doc) => {
        try {
          const response = await fetch(
            'https://jrseqfittadsxfbmlwvz.supabase.co/storage/v1/object/public/' + doc.url
          )
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
            id: doc.id
          }
        } catch (error) {
          console.error(error)
          return null
        }
      }) || []
    const resolvedFiles = await Promise.all(documentFilesPromises)
    return resolvedFiles.filter(Boolean)
  }

  // transform null values to undefined

  const enderecoData = transformNullToUndefined(proprietario?.endereco || {})
  const parsedData = transformNullToUndefined(proprietario || {})

  const defaultValues = {
    ...parsedData,
    logradouro: enderecoData?.logradouro,
    numero: enderecoData?.numero ? parseInt(enderecoData.numero) : undefined,
    complemento: enderecoData?.complemento,
    bairro: enderecoData?.bairro,
    cidade: enderecoData?.cidade,
    cep: enderecoData?.cep,
    estado: enderecoData?.estado,
    //TODO: handle documents
    documentos: documentFiles?.filter((doc) => doc !== null)
  }

  const proprietarioMethods = useForm<ProprietarioSchema>({
    resolver: zodResolver(proprietarioSchema),
    defaultValues,
    mode: 'onBlur'
  })

  const [isEditingPersonalInfo, setIsEditingPersonalInfo] = React.useState(false)

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: FormData }) => {
      if (!id) {
        toast({ title: 'Erro ao atualizar o proprietário', variant: 'destructive' })
      }

      return await putProprietario(id, data)
    },
    onSuccess: () => {
      toast({ title: 'Proprietário atualizado com sucesso' })
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar o proprietário', variant: 'destructive' })
    }
  })

  const { mutateAsync: deleteProprietarioMutation } = useMutation({
    mutationFn: async (id: number) => {
      return await deleteProprietario(id)
    }
  })

  const handleClickDeleteProprietario = async () => {
    try {
      await deleteProprietarioMutation(proprietario!.id)
      navigate(ROUTE.PROPRIETARIOS)
    } catch (e) {
      alert('Erro ao excluir o proprietário (adicionar toast)')
    }
  }

  useEffect(() => {
    if (proprietario) {
      proprietarioMethods.reset(defaultValues) // seta os valores do formulário com os dados do proprietário
    }
  }, [id, proprietario, documentFiles])

  if (!isLoading && !proprietario) {
    //TODO: improve this message
    return <div>Proprietário não encontrado</div>
  }

  const onSubmitProprietarioData = async (data: ProprietarioSchema) => {
    const form = new FormData()
    if (data.nome) {
      form.append('nome', data.nome)
    }
    if (data.documento) {
      form.append('documento', data.documento)
    }
    if (data.email) {
      form.append('email', data.email)
    }
    if (data.telefone) {
      form.append('telefone', data.telefone)
    }
    if (data.profissao) {
      form.append('profissao', data.profissao)
    }
    if (data.estadoCivil) {
      form.append('estadoCivil', data.estadoCivil)
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

    const newDocuments = data?.documentos?.filter((doc) => !doc.id)
    newDocuments?.forEach((doc) => {
      form.append('documentos', doc.file)
    })

    if (data?.documentosToDeleteIds?.length) {
      data.documentosToDeleteIds.forEach((docId) => {
        form.append('documentosToDeleteIds[]', docId.toString())
      })
    }

    // const array = [imovelId ? imovelId : '']

    // array?.forEach((id) => {
    //   form.append('vincularImoveisIds[]', id.toString()) // Crucial!
    // })

    updateMutation.mutate({
      id: proprietario!.id,
      data: form
    })
  }

  const handleClickDesvincular = async () =>
    // proprietarioId: number, imovelId: string
    {
      // try {
      //   await updateMutation.mutateAsync({
      //     id: proprietarioId,
      //     data: {
      //       desvincularImoveisIds: [imovelId]
      //     }
      //   })
      // } catch (error) {
      //   console.log(error)
      //   alert('Erro ao desvincular o imóvel (adicionar toast)')
      // }
    }

  const handleClickVincularImoveis = () => {
    alert('Vincular imóveis')
  }

  const disabled = isEditingPersonalInfo*/

  return(
    <Card></Card>

  )
  /*return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>
            {desvincularProprietarioImovel && (
              <Button variant="destructive" type="button" onClick={desvincularProprietarioImovel}>
                <Link2Off className="mr-2 h-4 w-4" />
                Desvincular proprietário
              </Button>
            )}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditingPersonalInfo(!isEditingPersonalInfo)}
          >
            <Edit className="mr-2 h-4 w-4" />
            {isEditingPersonalInfo ? 'Cancelar' : 'Editar'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ProprietarioForm.Root
          onSubmitProprietarioData={onSubmitProprietarioData}
          proprietarioMethods={proprietarioMethods}
        >
          <ProprietarioForm.FormContent
            proprietarioMethods={proprietarioMethods}
            disabled={!disabled}
          />
          <div className="mt-6">
            {disabled && (
              <Button
                disabled={
                  !proprietarioMethods.formState.isDirty || !proprietarioMethods.formState.isValid
                }
                type="submit"
                className="w-full"
              >
                Salvar Alterações
              </Button>
            )}
          </div>
        </ProprietarioForm.Root>
      </CardContent>
    </Card>
  )*/
}

export default function DetalhesProprietario() {
//export default function DetalhesProprietario({ defaultId }: { defaultId: { id: string } }) {

  //const { id } = defaultId ? defaultId : useParams<{ id: string }>()

  // Get the initial data from the API
  /*const { data: proprietario, isLoading } = useQuery(
    useGetProprietarioQueryOptions({
      enabled: !!id,
      id: parseInt(id!)
    })
  )*/

  /*const { data: documentFilesData = [], isSuccess: isSuccessDocuments } = useQuery({
    queryKey: ['documentFiles', id, proprietario?.documentos],
    queryFn: () => fetchDocumentFiles(proprietario?.documentos),
    enabled: !!proprietario?.documentos?.length
  })

  const documentFiles = React.useMemo(() => documentFilesData, [isSuccessDocuments])

  const fetchDocumentFiles = async (documents: Proprietario['documentos']) => {
    const documentFilesPromises =
      documents?.map(async (doc) => {
        try {
          const response = await fetch(
            'https://jrseqfittadsxfbmlwvz.supabase.co/storage/v1/object/public/' + doc.url
          )
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
            id: doc.id
          }
        } catch (error) {
          console.error(error)
          return null
        }
      }) || []
    const resolvedFiles = await Promise.all(documentFilesPromises)
    return resolvedFiles.filter(Boolean)
  }

  // transform null values to undefined

  const enderecoData = transformNullToUndefined(proprietario?.endereco || {})
  const parsedData = transformNullToUndefined(proprietario || {})

  const defaultValues = {
    ...parsedData,
    logradouro: enderecoData?.logradouro,
    numero: enderecoData?.numero ? parseInt(enderecoData.numero) : undefined,
    complemento: enderecoData?.complemento,
    bairro: enderecoData?.bairro,
    cidade: enderecoData?.cidade,
    cep: enderecoData?.cep,
    estado: enderecoData?.estado,
    //TODO: handle documents
    documentos: documentFiles?.filter((doc) => doc !== null)
  }

  const proprietarioMethods = useForm<ProprietarioSchema>({
    resolver: zodResolver(proprietarioSchema),
    defaultValues,
    mode: 'onBlur'
  })

  const { mutateAsync: deleteProprietarioMutation } = useMutation({
    mutationFn: async (id: number) => {
      return await deleteProprietario(id)
    }
  })

  const handleClickDeleteProprietario = async () => {
    try {
      await deleteProprietarioMutation(proprietario!.id)
      navigate(ROUTE.PROPRIETARIOS)
    } catch (e) {
      alert('Erro ao excluir o proprietário (adicionar toast)')
    }
  }

  useEffect(() => {
    if (proprietario) {
      proprietarioMethods.reset(defaultValues) // seta os valores do formulário com os dados do proprietário
    }
  }, [id, proprietario, documentFiles])

  if (!isLoading && !proprietario) {
    //TODO: improve this message
    return <div>Proprietário não encontrado</div>
  }

  const handleClickDesvincular = async () =>
    // proprietarioId: number, imovelId: string
    {
      // try {
      //   await updateMutation.mutateAsync({
      //     id: proprietarioId,
      //     data: {
      //       desvincularImoveisIds: [imovelId]
      //     }
      //   })
      // } catch (error) {
      //   console.log(error)
      //   alert('Erro ao desvincular o imóvel (adicionar toast)')
      // }
    }

  const handleClickVincularImoveis = () => {
    alert('Vincular imóveis')
  }

  return (
    <div className="container mx-auto space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Detalhes do Proprietário</h1>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir Proprietário
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso excluirá permanentemente o proprietário e
                todos os dados associados a ele.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleClickDeleteProprietario}>
                Sim, excluir proprietário
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <Tabs defaultValue="personal-info">
        <div className="flex justify-between">
          <TabsList>
            <TabsTrigger value="personal-info">Informações Pessoais</TabsTrigger>
            <TabsTrigger value="properties">Imóveis</TabsTrigger>
          </TabsList>

          <Button onClick={handleClickVincularImoveis} variant="outline">
            Vincular Imóvel
          </Button>
        </div>

        <TabsContent value="personal-info" className="space-y-4">
          <DetalhesProprietarioForm id={parseInt(id!)} />
        </TabsContent>

        <TabsContent value="properties" className="space-y-4">
          {proprietario?.imovel && (
            //TODO: create a component for no data
            <div className="text-center">Nenhum imóvel vinculado a este proprietário.</div>
          )}
          {proprietario?.imoveis?.map((imovel) => (
            <Card key={imovel.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <Badge>{imovel.status}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo</Label>
                    <p>{imovel.tipo}</p>
                  </div>
                  <div>
                    <Label>Valor do Aluguel</Label>
                    <p className="font-semibold">
                      R$ {imovel?.valor_aluguel?.toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div>
                    <Label>Valor do Condomínio</Label>
                    <p>R$ {imovel?.valor_condominio?.toLocaleString('pt-BR')}</p>
                  </div>
                  <div>
                    <Label>Valor do IPTU</Label>
                    <p>R$ {imovel?.valor_iptu?.toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="col-span-2">
                    <Label>Endereço</Label>
                    <p>{getEnderecoFormatado(imovel?.endereco)}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button variant="outline" size="sm">
                  Ver detalhes
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Link2Off className="mr-2 h-4 w-4" />
                      Desvincular
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Desvincular Imóvel</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza de que deseja desvincular este imóvel do proprietário?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                      // onClick={() => handleClickDesvincular(proprietario.id, imovel.id)}
                      >
                        Desvincular
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )*/
 return(
  <Card></Card>
 )
}

{
  /* <div className="items-center justify-between"> */
}
{
  /* <div>
  <h2 className="text-2xl font-bold">Imóveis</h2>
  <Button>
    <Plus className="mr-2 h-4 w-4" />
    Novo Imóvel
  </Button>
</div> */
}
{
  /* <DialogContent onInteractOutside={(e) => e.preventDefault()}>
      <DialogHeader>
        <DialogTitle>Adicionar Novo Imóvel</DialogTitle>
        <DialogDescription>
          Preencha os detalhes do novo imóvel para este proprietário.
        </DialogDescription>
      </DialogHeader> */
}
{
  /* <div> */
}
{
  /* <ImovelForm methods={methodsCriarImovel} onSubmit={handleSubmitCriarImovel} /> */
}
{
  /* </div> */
}

{
  /* Dialog para Criar Novo Imóvel */
}

{
  /* <form onSubmit={methodsCriarImovel.handleSubmit(handleSubmitCriarImovel)}>
  <h2 className="mb-4 text-2xl font-bold">Imóvel</h2>
  <div className="space-y-4">
    <div className="grid gap-4">
      <Label>
        Nome do imóvel
        <Input type="text" placeholder="Nome do imóvel" {...methodsCriarImovel.register('nome')} />
      </Label>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <Label>
        Logradouro
        <Input
          type="text"
          placeholder="Logradouro"
          {...methodsCriarImovel.register('endereco.logradouro')}
        />
      </Label>
      <Label>
        Número
        <Input
          type="text"
          placeholder="Número"
          {...methodsCriarImovel.register('endereco.numero')}
        />
      </Label>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <Label>
        Bairro
        <Input
          type="text"
          placeholder="Bairro"
          {...methodsCriarImovel.register('endereco.bairro')}
        />
      </Label>
      <Label>
        Cidade
        <Input
          type="text"
          placeholder="Cidade"
          {...methodsCriarImovel.register('endereco.cidade')}
        />
      </Label>

      <Label>
        CEP
        <Input
          type="text"
          placeholder="CEP"
          {...methodsCriarImovel.register('endereco.cep')}
        />
      </Label>
      <Label>
        Complemento
        <Input
          type="text"
          placeholder="Complemento"
          {...methodsCriarImovel.register('endereco.complemento')}
        />
      </Label>
    </div>
    <Label>
      Estado
      <Controller
        name="endereco.estado"
        control={methodsCriarImovel.control}
        render={({ field }) => (
          <Select onValueChange={(value) => field.onChange(value)} value={field.value}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o estado" />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS.map((estado) => (
                <SelectItem key={estado.sigla} value={estado.sigla}>
                  {estado.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </Label>
    <div className="grid grid-cols-2 gap-4">
      <Label>
        Valor do aluguel
        <Input type="number" placeholder="Valor do aluguel" {...methodsCriarImovel.register('valor_aluguel')} />
      </Label>
      <Label>
        Valor da água
        <Input
          type="number"
          placeholder="Valor da água"
          {...methodsCriarImovel.register('valorAgua')}
        />
      </Label>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <Label>
        Valor do condomínio
        <Input
          type="number"
          placeholder="Valor do condomínio"
          {...methodsCriarImovel.register('valorCondominio')}
        />
      </Label>
      <Label>
        Valor do IPTU
        <Input
          type="number"
          placeholder="Valor do IPTU"
          {...methodsCriarImovel.register('valorIptu')}
        />
      </Label>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <Label>
        Valor da taxa de lixo
        <Input
          type="number"
          placeholder="Valor da taxa de lixo"
          {...methodsCriarImovel.register('valorTaxaLixo')}
        />
      </Label>
    </div>
  </div>
  <Button type="submit" className="mt-4">
    Salvar e Continuar
  </Button>
</form> */
}

{
  /* Fim do Dialog */
}
{
  /* </div> */
}
