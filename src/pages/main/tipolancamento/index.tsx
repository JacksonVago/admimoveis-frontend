import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import api from '@/services/axios/api'
import { queryOptions, useMutation, useQuery } from '@tanstack/react-query'
import { Pencil, Plus, Recycle, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import React from 'react'
import { toast } from '@/hooks/use-toast'
import { queryClient } from '@/services/react-query/query-client'
import axios from 'axios'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { PessoaStatus } from '@/enums/pessoal/status-pesoa'
import { useGlobalParams } from '@/globals/GlobalParams'
import { TipoLancamento } from '@/interfaces/lancamentotipo'
import { lancamentoTipo } from '@/enums/locacao/enums-locacao'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TIPO_LANCAMENTO_OPTIONS } from '@/constants/lancamento-tipo'
import { Switch, Thumb } from '@radix-ui/react-switch'


// API & Query Logic
export const getTipos = async (empresaId: number) => {
  return await api.get<TipoLancamento[]>('tipolancamento/' + empresaId)
}

export const useGetTiposQueryOptions = (empresaId: number) => {
  return queryOptions({
    queryKey: ['tipolancamento',empresaId],
    queryFn: () => getTipos(empresaId)
  })
}

export const createTipo = ({
  name,
  tipo,
  automatico,
  parcelas,
  geraObservacao,
  valorFixo,
  empresaId,
}: {
  name: string,
  tipo: lancamentoTipo,
  automatico: string,
  parcelas: number,
  geraObservacao: string,
  valorFixo: number,
  empresaId: number,
}) => {
  return api.post('/tipolancamento', {
    name: name,
    tipo: tipo,
    automatico: automatico,
    parcelas: parcelas,
    geraObservacao: geraObservacao,
    valorFixo: valorFixo,
    empresaId: empresaId
  })
}

export const activeTipo = async (tipoData: {
  id: number
  status: PessoaStatus
}) => {
  const result = await api.patch(tipoData.status === PessoaStatus.CANCELADA ? `/tipolancamento/statusAtiva/${tipoData.id}` : `/tipolancamento/statusDesativa/${tipoData.id}`)
  return result.data;
}

export const putUpdateTipo = (tipoData: {
  id: number
  name: string
  tipo: lancamentoTipo
  automatico: string
  parcelas: number
  geraObservacao: string
  valorFixo: number
  empresaId: number
}) => {
  return api.put(`/tipolancamento/${tipoData.id}`,
    {
      name: tipoData.name,
      tipo: tipoData.tipo,
      automatico: tipoData.automatico,
      parcelas: tipoData.parcelas,
      geraObservacao: tipoData.geraObservacao,
      valorFixo: tipoData.valorFixo,
      empresaId: tipoData.empresaId
    })
}


// Component
export default function ListarTiposLancamento() {


  const [selectedTipo, setSelectedTipo] = React.useState<TipoLancamento | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [newTipo, setNewTipo] = React.useState(
    {
      name: '',
      tipo: lancamentoTipo.DEBITO,
      automatico: 'N',
      parcelas: 0,
      geraObservacao: 'N',
      valorFixo: 0,
      empresaId: 0,
    }
  )
  //Globals
  const glb_params = useGlobalParams();

  const { data, isLoading } = useQuery(
    useGetTiposQueryOptions(Number(glb_params.id_empresa))
  )

  const tipos = data?.data;

  const createTipoMutation = useMutation({
    mutationFn: createTipo,
    onSuccess: () => {
      ;['tipolancamento'].forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey: [queryKey] })
      });
      toast({
        title: 'Tipo de lançamento criado',
        description: 'O novo tipo de lançamento foi criado com sucesso.',        
      })
      setIsCreateDialogOpen(false)
      setNewTipo({
        name: '',
        tipo: lancamentoTipo.DEBITO,
        automatico: 'N',
        parcelas: 0,
        geraObservacao: 'N',
        valorFixo: 0,
        empresaId: Number(glb_params.id_empresa)
      }
      )
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        // Check if there's a response and data within the error
        if (error.response && error.response.data) {
          console.error('Error message from server:', error.response.data);
          toast({
            title: 'Erro ao criar tipo de lançamento',
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
          description: error instanceof Error ? error.message : 'Ocorreu um erro ao criar o tipo de lançamento. Tente novamente.',
          variant: 'destructive'
        })
      }

    }
  });

  const activeTipoMutation = useMutation({
    mutationFn: activeTipo,
    onSuccess: () => {
      ;['tipolancamento'].forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey: [queryKey] })
      });
      toast({
        title: `Tipo de lançamento ${selectedTipo?.status === PessoaStatus.CANCELADA ? 'reativado' : 'desativado'}`,
        description: `O tipo de lançamento foi ${selectedTipo?.status === PessoaStatus.CANCELADA ? 'reativado' : 'desativado'} com sucesso.`,
        variant: selectedTipo?.status === PessoaStatus.CANCELADA ? 'default' : 'destructive'
      })
      setSelectedTipo(null)
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: `Ocorreu um erro ao ${selectedTipo?.status === PessoaStatus.CANCELADA ? 'reativado' : 'desativado'} o tipo de lançamento. Tente novamente.`,
        variant: 'destructive'
      })
    }
  })

  React.useEffect(() => {
    glb_params.updTitle_form('Tipos de lançamento');
  }, [])

  const updateTipoMutation = useMutation({
    mutationFn: putUpdateTipo,
    onSuccess: () => {
      toast({
        title: 'Tipo de lançamento atualizado',
        description: 'As informações do tipo de lançamento foram atualizadas com sucesso.'
      })
      setIsEditDialogOpen(false)
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao atualizar o tipo de lançamento. Tente novamente.',
        variant: 'destructive'
      })
    }
  })


  const handleCreateTipo = () => {

    console.log(newTipo);
    if (newTipo.name.trim() !== '') {
      createTipoMutation.mutate({
        name: newTipo.name,
        tipo: newTipo.tipo,
        automatico: newTipo.automatico,
        parcelas: newTipo.parcelas,
        geraObservacao: newTipo.geraObservacao,
        valorFixo: newTipo.valorFixo,
        empresaId: Number(glb_params.id_empresa),
      });
    }
    else {
      toast({
        title: 'Erro ao criar tipo de lançamento',
        description: "O nome do tipo de lançamento não pode estar vazio.",
        variant: 'destructive'
      });
    }

  }

  const handleDeleteTipo = () => {
    if (selectedTipo) {
      activeTipoMutation.mutate({ id: selectedTipo.id, status: selectedTipo.status })
      //deleteTipoMutation.mutate(selectedTipo.id.toString())
    }
  }

  const handleUpdateTipo = () => {
    if (selectedTipo) {
      updateTipoMutation.mutate({
        id: selectedTipo.id,
        name: selectedTipo.name,
        tipo: selectedTipo.tipo,
        automatico: selectedTipo.automatico,
        parcelas: selectedTipo.parcelas,
        geraObservacao: selectedTipo.geraObservacao,
        valorFixo: selectedTipo.valorFixo,
        empresaId: Number(glb_params.id_empresa),
      })
    }
  }

  console.log(selectedTipo);

  return (
    <div className="container mx-auto p-4 font-[Poppins-regular]">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <Dialog
          open={isCreateDialogOpen}
          onOpenChange={(value) => {
            setIsCreateDialogOpen(value)
            setNewTipo({
              name: '',
              tipo: lancamentoTipo.DEBITO,
              automatico: 'N',
              parcelas: 0,
              geraObservacao: 'N',
              valorFixo: 0,
              empresaId: Number(glb_params.id_empresa),
            }
            )
          }}
        >
          <DialogTrigger asChild>
            <Button size={"sm"} className='hover:cursor-pointer hover:bg-gray-600'>
              <Plus className="mr-2 h-4 w-4 font-[Poppins-regular]" /> Criar Tipo de Lançamento
            </Button>
          </DialogTrigger>
          <DialogContent className='font-[Poppins-regular]'>
            <DialogHeader>
              <DialogTitle>Criar novo Tipo de Lançamento</DialogTitle>
              <DialogDescription>Preencha os dados do novo Tipo de Lançamento abaixo.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 font-[Poppins-regular]">
              <div className="grid grid-cols-1 items-center gap-4">
                <Label className='text-base'>
                  Descrição
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Iptu, condomínio, etc..."
                  value={newTipo.name}
                  onChange={(e) => setNewTipo({ ...newTipo, name: e.target.value.toUpperCase() })}
                />
              </div>
            </div>
            <div className='text-base'>
              <Label className='text-base'>Tipo de lançamento</Label>
              <div className='mt-2 mr-5 w-32'>
                <Select
                  onValueChange={(value: lancamentoTipo) => setNewTipo({ ...newTipo, tipo: value })}
                >
                  <SelectTrigger className='h-4'>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPO_LANCAMENTO_OPTIONS.map((lancto) => (
                      <SelectItem className='text-base' key={lancto.label} value={lancto.value}>
                        {lancto.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center" }}>
              <label
                className="Label"
                htmlFor="airplane-mode"
                style={{ paddingRight: 15 }}
              >
                Automático
              </label>
              <Switch className="SwitchRoot focus:outline-none" id="airplane-mode"
                checked={newTipo.automatico === "S" ? true : false}
                onCheckedChange={(checked) => setNewTipo({ ...newTipo, automatico: (checked ? "S" : "N") })}>
                <Thumb className="SwitchThumb" />
              </Switch>
            </div>

            <div className="grid gap-4 py-4 font-[Poppins-regular]">
              <div className="grid grid-cols-1 items-center gap-4">
                <Label className='text-base'>
                  Parcelas
                </Label>
                <Input
                  id="name"
                  type="number"
                  placeholder="Parcelas"
                  value={newTipo.parcelas}
                  onChange={(e) => setNewTipo({ ...newTipo, parcelas: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid gap-4 py-4 font-[Poppins-regular]">
              <div className="grid grid-cols-1 items-center gap-4">
                <Label className='text-base'>
                  Valor Fixo
                </Label>
                <Input
                  id="name"
                  type="number"
                  placeholder="Valor Fixo"
                  value={newTipo.valorFixo}
                  onChange={(e) => setNewTipo({ ...newTipo, valorFixo: Number(e.target.value) })}
                />
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center" }}>
              <label
                className="Label"
                htmlFor="airplane-mode"
                style={{ paddingRight: 15 }}
              >
                Gera Observação
              </label>
              <Switch className="SwitchRoot focus:outline-none" id="airplane-mode"
                checked={newTipo.geraObservacao === "S" ? true : false}
                onCheckedChange={(checked) => setNewTipo({ ...newTipo, geraObservacao: (checked ? "S" : "N") })}>
                <Thumb className="SwitchThumb" />
              </Switch>
            </div>

            <DialogFooter>
              <Button onClick={handleCreateTipo} className='hover:cursor-pointer hover:bg-gray-600'>Criar Tipo</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {tipos && tipos.length === 0 && !isLoading && (
        <p className="text-center text-muted-foreground mt-2">
          Nenhum tipo de lançamento encontrado.
        </p>
      )}
      {tipos && tipos.length > 0 && !isLoading && (
        <table className="w-full">
          <thead>
            <tr>
              <th className="border-b p-2 text-left">Nome</th>
              <th className="border-b p-2 text-left">Tipo</th>
              <th className="border-b p-2 text-left">Automático</th>
              <th className="border-b p-2 text-left"></th>
            </tr>
          </thead>
          <tbody>
            {tipos.map((tipo) => (
              <tr key={tipo.id} className="hover:bg-gray-100">
                <td className={tipo.status === PessoaStatus.CANCELADA ? "border-b p-2 text-red-600" : "border-b p-2"}>{tipo.name}</td>
                <td className={tipo.status === PessoaStatus.CANCELADA ? "border-b p-2 text-red-600" : "border-b p-2"}>{tipo.tipo}</td>
                <td className={tipo.status === PessoaStatus.CANCELADA ? "border-b p-2 text-red-600" : "border-b p-2"}>{tipo.automatico}</td>
                <td className="border-b p-2">
                  <div className="flex space-x-2">
                    {tipo.status === PessoaStatus.ATIVA && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedTipo(tipo)
                          setIsEditDialogOpen(true)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={(e) => {
                          e.stopPropagation()
                          setSelectedTipo(tipo)
                        }
                        } title='Cancelar Tipo de Lançamento'>
                          {tipo.status === PessoaStatus.CANCELADA ? <Recycle className="h-4 w-4" color='red' /> : <Trash2 className="h-4 w-4" />}

                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription>
                            {tipo.status === PessoaStatus.CANCELADA ? 'Isso reativará o tipo de lançamento.' : 'Isso deixará o tipo de lançamento desativado.'}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteTipo}>
                            {tipo.status === PessoaStatus.CANCELADA ? 'Sim, reativar o tipo de lançamento.' : 'Sim, desativar o tipo de lançamento.'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(value) => {
          setIsEditDialogOpen(value)
        }}
      >
        <DialogContent className='font-[Poppins-regular]'>
          <DialogHeader>
            <DialogTitle>Editar Tipo de Lançamento</DialogTitle>
            <DialogDescription>Edite os dados do Lançamento abaixo.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-1 items-center gap-4">
              <Label className="text-base">
                Descrição
              </Label>
              <Input
                id="edit-name"
                value={selectedTipo?.name || ''}
                onChange={(e) => setSelectedTipo((prev) => ({ ...prev!, name: e.target.value.toUpperCase() }))}
                className="col-span-3"
              />
            </div>

            <div className='mt-2 text-base'>
              <Label className='text-base'>Tipo de lançamento</Label>
              <div className='mt-2 w-52'>
                <Select
                  onValueChange={(value: lancamentoTipo) => setSelectedTipo((prev) => ({ ...prev!, tipo: value }))}
                  value={selectedTipo?.tipo}
                >
                  <SelectTrigger className='h-4'>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPO_LANCAMENTO_OPTIONS.map((lancto) => (
                      <SelectItem className='text-base' key={lancto.label} value={lancto.value}>
                        {lancto.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center" }}>
              <label
                className="Label"
                htmlFor="airplane-mode"
                style={{ paddingRight: 15 }}
              >
                Automático
              </label>
              <Switch className="SwitchRoot focus:outline-none" id="airplane-mode"
                checked={selectedTipo?.automatico === "S" ? true : false}
                onCheckedChange={(checked) => setSelectedTipo((prev) => ({ ...prev!, automatico: (checked ? "S" : "N") }))}>
                <Thumb className="SwitchThumb" />
              </Switch>
            </div>

            <div className="grid gap-4 py-4 font-[Poppins-regular]">
              <div className="grid grid-cols-1 items-center gap-4">
                <Label className='text-base'>
                  Parcelas
                </Label>
                <Input
                  id="name"
                  type="number"
                  placeholder="Parcelas"
                  value={selectedTipo?.parcelas}
                  onChange={(e) => setSelectedTipo((prev) => ({ ...prev!, parcelas: Number(e.target.value)}))}
                />
              </div>
            </div>

            <div className="grid gap-4 py-4 font-[Poppins-regular]">
              <div className="grid grid-cols-1 items-center gap-4">
                <Label className='text-base'>
                  Valor Fixo
                </Label>
                <Input
                  id="name"
                  type="number"
                  placeholder="Valor Fixo"
                  value={selectedTipo?.valorFixo}
                  onChange={(e) => setSelectedTipo((prev) => ({ ...prev!, valorFixo: Number(e.target.value)}))}
                />
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center" }}>
              <label
                className="Label"
                htmlFor="airplane-mode"
                style={{ paddingRight: 15 }}
              >
                Gera Observação
              </label>
              <Switch className="SwitchRoot focus:outline-none" id="airplane-mode"
                checked={selectedTipo?.geraObservacao === "S" ? true : false}
                onCheckedChange={(checked) => setSelectedTipo((prev) => ({ ...prev!, geraObservacao: (checked ? "S" : "N") }))}>
                <Thumb className="SwitchThumb" />
              </Switch>
            </div>

          </div>
          <DialogFooter>
            <Button onClick={handleUpdateTipo}>Salvar alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
