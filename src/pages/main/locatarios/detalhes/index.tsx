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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { ROUTE } from '@/enums/routes.enum'
import { toast } from '@/hooks/use-toast'
import { Locatario } from '@/interfaces/locatario'
import { LocatarioSchema } from '@/schemas/locatario.schema'
import { proprietarioSchema } from '@/schemas/proprietario.schema'
import api from '@/services/axios/api'
import { queryClient } from '@/services/react-query/query-client'
import { transformNullToUndefined } from '@/utils/transform-null-to-undefined'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Calendar, Edit, Link2Off, Plus, Trash2 } from 'lucide-react'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { LocatarioForm } from '../components/locatario-form'
import { Imovel } from '@/interfaces/imovel'
//import { ImovelTipo } from '@/enums/imovel/tipo-imovel'
import { ImovelStatus } from '@/enums/imovel/enums-imovel'
import { Pessoa } from '@/interfaces/pessoa'
// Mock data for demonstration
/*const locatario = {
  id: 'loc001',
  nome: 'Ana Oliveira',
  documento: '123.456.789-00',
  profissao: 'Professora',
  estadoCivil: 'CASADO',
  email: 'ana.oliveira@email.com',
  telefone: '(11) 98765-4321',
  endereco: {
    rua: 'Rua das Flores',
    numero: '123',
    complemento: 'Apto 45',
    bairro: 'Jardim Primavera',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01234-567'
  },
  locacoes: [
    {
      id: 'rent001',
      imovel: 'Apartamento Centro',
      valorAluguel: 1500,
      dataInicio: '2023-01-01',
      dataFim: '2024-01-01',
      status: 'Ativo'
    },
    {
      id: 'rent002',
      imovel: 'Casa de Praia',
      valorAluguel: 2000,
      dataInicio: '2023-06-01',
      dataFim: null,
      status: 'Ativo'
    },
    {
      id: 'rent003',
      imovel: 'Kitnet Universitária',
      valorAluguel: 800,
      dataInicio: '2022-03-01',
      dataFim: '2023-02-28',
      status: 'Encerrado'
    }
  ]
}*/

const fetchDocumentFiles = async (documents: Pessoa['documentos']) => {
  const documentFilesPromises =
    documents?.map(async (doc:any) => {
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

export const DetalhesLocatarioForm = ({
  id,
  desvincularLocatarioImovel
}: {
  id: number
  disabled?: boolean
  desvincularLocatarioImovel?: () => void
}) => {
  const [isEditingPersonalInfo, setIsEditingPersonalInfo] = React.useState(false)
  const disabled = isEditingPersonalInfo

  //const navigate = useNavigate()
  //const params = useParams()

  const { data: locatario } = useQuery({
    queryKey: ['locatario', id],
    queryFn: async () => {
      const { data } = await api.get<Locatario>(`/locatarios/${id}`)
      return data
    },
    enabled: !!id
  })

  const { data: documentFilesData = [], isSuccess: isSuccessDocuments } = useQuery({
    queryKey: ['documentFiles', id, locatario?.pessoa?.documentos],
    queryFn: () => fetchDocumentFiles(locatario?.pessoa?.documentos),
    enabled: !!locatario?.pessoa?.documentos?.length
  })

  const documentFiles = React.useMemo(() => documentFilesData, [isSuccessDocuments])

  const updateLocatario = useMutation({
    mutationFn: async (data: FormData) => {
      return await api.put<Locatario>(`/locatarios/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },
    onSuccess: () => {
      ;['locatario', 'documentFiles', id].forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] })
      })
    }
  })

  /*const deleteLocatarioMutation = useMutation({
    mutationFn: async () => {
      return await api.delete(`/locatarios/${id}`)
    },
    onSuccess: () => {
      ;['locatario', 'documentFiles', id].forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] })
      })

      toast({
        title: 'Locatário excluído com sucesso',
        description: `Locatário excluído com sucesso`
      })

      navigate(ROUTE.LOCATARIOS)
    }
  })*/

  const onSubmitLocatarioData = async (data: LocatarioSchema) => {
    try {
      const form = new FormData()

      if (data?.nome) {
        form.append('nome', data.nome)
      }

      if (data?.documento) {
        form.append('documento', data.documento)
      }

      if (data?.email) {
        form.append('email', data.email)
      }

      if (data?.telefone) {
        form.append('telefone', data.telefone)
      }

      if (data?.profissao) {
        form.append('profissao', data.profissao)
      }

      if (data?.estadoCivil) {
        form.append('estadoCivil', data.estadoCivil)
      }

      if (data?.logradouro) {
        form.append('logradouro', data.logradouro)
      }

      if (data?.numero) {
        form.append('numero', data.numero.toString())
      }

      if (data?.complemento) {
        form.append('complemento', data.complemento)
      }

      if (data?.bairro) {
        form.append('bairro', data.bairro)
      }

      if (data?.cidade) {
        form.append('cidade', data.cidade)
      }

      if (data?.cep) {
        form.append('cep', data.cep)
      }

      if (data?.estado) {
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

      await updateLocatario.mutateAsync(form)

      toast({
        title: 'Locatário atualizado com sucesso',
        description: `Locatário atualizado com sucesso`
      })
    } catch (error) {
      toast({
        title: 'Erro ao atualizar locatário',
        description: 'Ocorreu um erro ao tentar atualizar o locatário. Tente novamente.'
      })
    }
  }

  console.log(locatario)

  //default values
  const enderecoData = transformNullToUndefined(locatario?.pessoa?.endereco || {})
  const defaultValues = React.useMemo(
    () => ({
      ...transformNullToUndefined(locatario || {}),
      logradouro: enderecoData?.logradouro,
      numero: enderecoData?.numero ? parseInt(enderecoData.numero) : undefined,
      complemento: enderecoData?.complemento,
      bairro: enderecoData?.bairro,
      cidade: enderecoData?.cidade,
      cep: enderecoData?.cep,
      estado: enderecoData?.estado,
      //documentos: documentFiles?.filter((doc) => doc !== null)
    }),
    [locatario]
  )

  React.useEffect(() => {
    if (locatario) locatarioMethods.reset(defaultValues)
  }, [defaultValues])

  //react hook form

  const locatarioMethods = useForm<LocatarioSchema>({
    resolver: zodResolver(proprietarioSchema),
    defaultValues,
    mode: 'onBlur'
  })

  React.useEffect(() => {
    if (locatario) {
      locatarioMethods.reset(defaultValues) // seta os valores do formulário com os dados do proprietário
    }
  }, [id, locatario, documentFiles])

  /*const handleDeleteProprietario = () => {
    deleteLocatarioMutation.mutate()
  }*/

  const hasLocatario = !!locatario

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>
            {desvincularLocatarioImovel && hasLocatario && (
              <Button variant="destructive" type="button" onClick={desvincularLocatarioImovel}>
                <Link2Off className="mr-2 h-4 w-4" />
                Desvincular locatário
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
        <LocatarioForm.Root
          createLocatarioMethods={locatarioMethods}
          onSubmitLocatarioData={onSubmitLocatarioData}
        >
          <LocatarioForm.Content createLocatarioMethods={locatarioMethods} disabled={!disabled} />
          <div className="mt-4">
            {disabled && (
              <Button
                className="w-full"
                disabled={
                  !locatarioMethods.formState.isDirty || !locatarioMethods.formState.isValid
                }
              >
                Salvar Alterações
              </Button>
            )}
          </div>
        </LocatarioForm.Root>
      </CardContent>
    </Card>
  )
}

export default function DetalhesLocatario({ defaultId }: { defaultId: { id: string } }) {
  const navigate = useNavigate()
  //const params = useParams()
  const { id } = defaultId ? defaultId : useParams<{ id: string }>()

  //const [isEditingPersonalInfo, setIsEditingPersonalInfo] = React.useState(false)
  //const [formInitialized, setFormInitialized] = React.useState(false) // Controle de inicialização

  const { data: locatario } = useQuery({
    queryKey: ['locatario', id],
    queryFn: async () => {
      const { data } = await api.get<Locatario>(`/locatarios/${id}`)
      return data
    },
    enabled: !!id
  })

  let imovelStatus = ImovelStatus.DISPONIVEL;

  const { data: imoveisLocacao } = useQuery({
    queryKey: ['locacoes', imovelStatus],
    queryFn: async () => {
      const { data } = await api.get<Imovel[]>(`/imoveis/locacao/?imovelStatu=${imovelStatus}`)
      return data
    },
  })

  const { data: documentFilesData = [], isSuccess: isSuccessDocuments } = useQuery({
    queryKey: ['documentFiles', id, locatario?.pessoa?.documentos],
    queryFn: () => fetchDocumentFiles(locatario?.pessoa?.documentos),
    enabled: !!locatario?.pessoa?.documentos?.length
  })

  const documentFiles = React.useMemo(() => documentFilesData, [isSuccessDocuments])

  /*const updateLocatario = useMutation({
    mutationFn: async (data: FormData) => {
      return await api.put<Locatario>(`/locatarios/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },
    onSuccess: () => {
      ;['locatario', 'documentFiles', id].forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] })
      })
    }
  })*/

  const deleteLocatarioMutation = useMutation({
    mutationFn: async () => {
      return await api.delete(`/locatarios/${id}`)
    },
    onSuccess: () => {
      ;['locatario', 'documentFiles', id].forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] })
      })

      toast({
        title: 'Locatário excluído com sucesso',
        description: `Locatário excluído com sucesso`
      })

      navigate(ROUTE.LOCATARIOS)
    }
  })

  //default values
  const enderecoData = transformNullToUndefined(locatario?.pessoa?.endereco || {})
  const defaultValues = React.useMemo(
    () => ({
      ...transformNullToUndefined(locatario || {}),
      logradouro: enderecoData?.logradouro,
      numero: enderecoData?.numero ? parseInt(enderecoData.numero) : undefined,
      complemento: enderecoData?.complemento,
      bairro: enderecoData?.bairro,
      cidade: enderecoData?.cidade,
      cep: enderecoData?.cep,
      estado: enderecoData?.estado,
      documentos: documentFiles?.filter((doc:any) => doc !== null)
    }),
    [locatario, documentFiles]
  )

  React.useEffect(() => {
    //if (locatario) locatarioMethods.reset(defaultValues)
  }, [defaultValues])

  //react hook form

  /*const locatarioMethods = useForm<LocatarioSchema>({
    resolver: zodResolver(proprietarioSchema),
    //defaultValues,
    mode: 'onBlur'
  })*/

  React.useEffect(() => {
    if (locatario) {
      //locatarioMethods.reset(defaultValues) // seta os valores do formulário com os dados do proprietário
    }
  }, [id, locatario, documentFiles])

  const handleDeleteProprietario = () => {
    deleteLocatarioMutation.mutate()
  }
  
  return (
    <div className="container mx-auto space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Detalhes do Locatário</h1>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir Locatário
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso excluirá permanentemente o locatário e todos
                os dados associados a ele.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteProprietario}>
                Sim, excluir locatário
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <Tabs defaultValue="personal-info">
        <TabsList>
          <TabsTrigger value="personal-info">Informações Pessoais</TabsTrigger>
          <TabsTrigger value="rentals">Locações</TabsTrigger>
        </TabsList>

        <TabsContent value="personal-info" className="space-y-4">
          <DetalhesLocatarioForm id={parseInt(id!)} />
        </TabsContent>

        <TabsContent value="rentals" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Locações</h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Locação
                </Button>
              </DialogTrigger>
              <DialogContent onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                  <DialogTitle>Adicionar Nova Locação</DialogTitle>
                  <DialogDescription>
                    Preencha os detalhes da nova locação para este locatário.
                  </DialogDescription>
                </DialogHeader>
                <form className="space-y-4">
                  <div>
                    <Label htmlFor="imovel">Imóvel</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o imóvel" />
                      </SelectTrigger>
                      <SelectContent>
                        {imoveisLocacao?.map((locacao)=>(
                          <SelectItem value={locacao.id.toString()}>{locacao.tipo.toString() + ", " + locacao.endereco.logradouro.toString() + " " + locacao.endereco.bairro +  " " + locacao.endereco.cidade}</SelectItem>
                        ))}
                        {/* <SelectItem value="apt1">Apartamento Centro</SelectItem>
                        <SelectItem value="casa1">Casa de Praia</SelectItem>
                        <SelectItem value="kitnet1">Kitnet Universitária</SelectItem> */}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="valorAluguel">Valor do Aluguel</Label>
                    <Input id="valorAluguel" type="number" placeholder="0.00" />
                  </div>
                  <div>
                    <Label htmlFor="dataInicio">Data de Início</Label>
                    <Input id="dataInicio" type="date" />
                  </div>
                  <div>
                    <Label htmlFor="dataFim">Data de Fim (opcional)</Label>
                    <Input id="dataFim" type="date" />
                  </div>
                  <div>
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea id="observacoes" placeholder="Detalhes adicionais sobre a locação" />
                  </div>
                </form>
                <DialogFooter>
                  <Button type="submit">Adicionar Locação</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {locatario?.locacoes?.map((locacao) => (
            <Card key={locacao.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{locacao.id}</span>
                  <Badge variant="default">{locacao.status}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Valor do Aluguel</Label>
                    <p className="font-semibold">
                      R$ {locacao.valorAluguel.toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div>
                    <Label>Período</Label>
                    <p className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      {new Date(locacao.dataInicio).toLocaleDateString('pt-BR')} -
                      {locacao.dataFim
                        ? new Date(locacao.dataFim).toLocaleDateString('pt-BR')
                        : 'Atual'}
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                  </DialogTrigger>
                  <DialogContent onInteractOutside={(e) => e.preventDefault()}>
                    <DialogHeader>
                      <DialogTitle>Alterar Locação</DialogTitle>
                      <DialogDescription>
                        Preencha os detalhes da nova locação para este locatário.
                      </DialogDescription>
                    </DialogHeader>
                    <form className="space-y-4">
                      <div>
                        <Label htmlFor="imovel">Imóvel</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o imóvel" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="apt1">Apartamento Centro</SelectItem>
                            <SelectItem value="casa1">Casa de Praia</SelectItem>
                            <SelectItem value="kitnet1">Kitnet Universitária</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="valorAluguel">Valor do Aluguel</Label>
                        <Input id="valorAluguel" type="number" placeholder="0.00" />
                      </div>
                      <div>
                        <Label htmlFor="dataInicio">Data de Início</Label>
                        <Input id="dataInicio" type="date" />
                      </div>
                      <div>
                        <Label htmlFor="dataFim">Data de Fim (opcional)</Label>
                        <Input id="dataFim" type="date" />
                      </div>
                      <div>
                        <Label htmlFor="observacoes">Observações</Label>
                        <Textarea id="observacoes" placeholder="Detalhes adicionais sobre a locação" />
                      </div>
                    </form>
                    <DialogFooter>
                      <Button type="submit">Adicionar Locação</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                {/* <Button variant="outline" size="sm">
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Button> */}
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </Button>
              </CardFooter>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// <form className="space-y-4">
// <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
//   <div>
//     <Label htmlFor="nome">Nome</Label>
//     <Input
//       id="nome"
//       defaultValue={locatario.nome}
//       readOnly={!isEditingPersonalInfo}
//     />
//   </div>
//   <div>
//     <Label htmlFor="documento">CPF/CNPJ</Label>
//     <Input
//       id="documento"
//       defaultValue={locatario.documento}
//       readOnly={!isEditingPersonalInfo}
//     />
//   </div>
//   <div>
//     <Label htmlFor="profissao">Profissão</Label>
//     <Input
//       id="profissao"
//       defaultValue={locatario.profissao}
//       readOnly={!isEditingPersonalInfo}
//     />
//   </div>
//   <div>
//     <Label htmlFor="estadoCivil">Estado Civil</Label>
//     <Select disabled={!isEditingPersonalInfo}>
//       <SelectTrigger>
//         <SelectValue placeholder={locatario.estadoCivil} />
//       </SelectTrigger>
//       <SelectContent>
//         <SelectItem value="SOLTEIRO">Solteiro</SelectItem>
//         <SelectItem value="CASADO">Casado</SelectItem>
//         <SelectItem value="DIVORCIADO">Divorciado</SelectItem>
//         <SelectItem value="VIUVO">Viúvo</SelectItem>
//       </SelectContent>
//     </Select>
//   </div>
//   <div>
//     <Label htmlFor="email">Email</Label>
//     <Input
//       id="email"
//       type="email"
//       defaultValue={locatario.email}
//       readOnly={!isEditingPersonalInfo}
//     />
//   </div>
//   <div>
//     <Label htmlFor="telefone">Telefone</Label>
//     <Input
//       id="telefone"
//       defaultValue={locatario.telefone}
//       readOnly={!isEditingPersonalInfo}
//     />
//   </div>
// </div>

// <Separator />

// <div>
//   <h3 className="mb-2 text-lg font-semibold">Endereço</h3>
//   <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
//     <div>
//       <Label htmlFor="rua">Rua</Label>
//       <Input
//         id="rua"
//         defaultValue={locatario.endereco.rua}
//         readOnly={!isEditingPersonalInfo}
//       />
//     </div>
//     <div>
//       <L>
//       <Label htmlFor="complemento">Complemento</Label>
//       <Input
//         id="complemento"
//         defaultValue={locatario.endereco.complemento}
//         readOnly={!isEditingPersonalInfo}
//       />
//     </div>
//     <div>
//       <Label htmlFor="bairro">Bairro</Label>
//       <Input
//         id="bairro"
//         defaultValue={locatario.endereco.bairro}
//         readOnly={!isEditingPersonalInfo}
//       />
//     </div>
//     <div>
//       <Label htmlFor="cidade">Cidade</Label>
//       <Input
//         id="cidade"
//         defaultValue={locatario.endereco.cidade}
//         readOnly={!isEditingPersonalInfo}
//       />
//     </div>
//     <div>
//       <Label htmlFor="estado">Estado</Label>
//       <Input
//         id="estado"
//         defaultValue={locatario.endereco.estado}
//         readOnly={!isEditingPersonalInfo}
//       />
//     </div>
//     <div>
//       <Label htmlFor="cep">CEP</Label>
//       <Input
//         id="cep"
//         defaultValue={locatario.endereco.cep}
//         readOnly={!isEditingPersonalInfo}
//       />
//     </div>
//   </div>
// </div>
// </form>abel htmlFor="numero">Número</Label>
//       <Input
//         id="numero"
//         defaultValue={locatario.endereco.numero}
//         readOnly={!isEditingPersonalInfo}
//       />
//     </div>
//     <div
