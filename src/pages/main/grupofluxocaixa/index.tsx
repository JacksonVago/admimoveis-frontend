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
import { lancamentoTipo } from '@/enums/locacao/enums-locacao'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TIPO_LANCAMENTO_OPTIONS } from '@/constants/lancamento-tipo'
import { Switch, Thumb } from '@radix-ui/react-switch'
import { GrupoFluxoCaixa } from '@/interfaces/grupo-fluxo-caixa'


// API & Query Logic
export const getGrupos = async (empresaId: number) => {
  return await api.get<GrupoFluxoCaixa[]>('grupo-fluxo-caixa/' + empresaId)
}

export const useGetGruposQueryOptions = (empresaId: number) => {
  return queryOptions({
    queryKey: ['grupos', empresaId],
    queryFn: () => getGrupos(empresaId)
  })
}

export const createGrupo = ({
  descricao,
  cor,
  status,
  empresaId,
}: {
  descricao: string,
  cor: string,
  status: PessoaStatus,
  empresaId: number,
}) => {
  return api.post('/grupo-fluxo-caixa', {
    descricao: descricao,
    cor: cor,
    status: status,
    empresaId: empresaId
  })
}


export const activeGrupo = async (grupoData: {
  id: number
  status: PessoaStatus
}) => {
  const result = await api.patch(grupoData.status === PessoaStatus.CANCELADA ? `/grupo-fluxo-caixa/statusAtiva/${grupoData.id}` : `/grupo-fluxo-caixa/statusDesativa/${grupoData.id}`)
  return result.data;
}

export const putUpdateGrupo = (grupoData: {
  id: number
  descricao: string
  cor: string
  status: PessoaStatus
  empresaId: number
}) => {
  return api.put(`/grupo-fluxo-caixa/${grupoData.id}`,
    {
      descricao: grupoData.descricao,
      cor: grupoData.cor,
      status: grupoData.status,
      empresaId: grupoData.empresaId
    }
  )
}

// Component
export default function ListarGruposFluxoCaixa() {


  const [selectedGrupo, setSelectedGrupo] = React.useState<GrupoFluxoCaixa | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [newGrupo, setNewGrupo] = React.useState(
    {
      descricao: '',
      cor: '',
      status: PessoaStatus.ATIVA,
      empresaId: 0,
    }
  )
  //Globals
  const glb_params = useGlobalParams();

  const { data, isLoading } = useQuery(
    useGetGruposQueryOptions(Number(glb_params.id_empresa))
  )

  const grupos = data?.data;

  const createGrupoMutation = useMutation({
    mutationFn: createGrupo,
    onSuccess: () => {
      ;['grupos'].forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey: [queryKey] })
      });
      toast({
        title: 'Grupo de fluxo de caixa criado',
        description: 'O novo grupo de fluxo de caixa foi criado com sucesso.',
      })
      setIsCreateDialogOpen(false)
      setNewGrupo({
        descricao: '',
        cor: '',
        status: PessoaStatus.ATIVA,
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
            title: 'Erro ao criar grupo de fluxo de caixa',
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
          description: error instanceof Error ? error.message : 'Ocorreu um erro ao criar o grupo de fluxo de caixa. Tente novamente.',
          variant: 'destructive'
        })
      }

    }
  });

  const activeGrupoMutation = useMutation({
    mutationFn: activeGrupo,
    onSuccess: () => {
      ;['grupos'].forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey: [queryKey] })
      });
      toast({
        title: `Grupo de fluxo de caixa ${selectedGrupo?.status === PessoaStatus.CANCELADA ? 'reativado' : 'desativado'}`,
        description: `O grupo de fluxo de caixa foi ${selectedGrupo?.status === PessoaStatus.CANCELADA ? 'reativado' : 'desativado'} com sucesso.`,
        variant: selectedGrupo?.status === PessoaStatus.CANCELADA ? 'default' : 'destructive'
      })
      setSelectedGrupo(null)
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: `Ocorreu um erro ao ${selectedGrupo?.status === PessoaStatus.CANCELADA ? 'reativado' : 'desativado'} o grupo de fluxo de caixa. Tente novamente.`,
        variant: 'destructive'
      })
    }
  })

  React.useEffect(() => {
    glb_params.updTitle_form('Grupos de fluxo de caixa');
  }, [])

  const updateTipoMutation = useMutation({
    mutationFn: putUpdateGrupo,
    onSuccess: () => {
      toast({
        title: 'Grupo de fluxo de caixa atualizado',
        description: 'As informações do grupo de fluxo de caixa foram atualizadas com sucesso.'
      })
      setIsEditDialogOpen(false)
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao atualizar o grupo de fluxo de caixa. Tente novamente.',
        variant: 'destructive'
      })
    }
  })


  const handleCreateGrupo = () => {

    console.log(newGrupo);
    if (newGrupo.descricao.trim() !== '') {
      createGrupoMutation.mutate({
        descricao: newGrupo.descricao,
        cor: newGrupo.cor,
        status: newGrupo.status,
        empresaId: Number(glb_params.id_empresa),
      });
    }
    else {
      toast({
        title: 'Erro ao criar grupo de fluxo de caixa',
        description: "O nome do grupo de fluxo de caixa não pode estar vazio.",
        variant: 'destructive'
      });
    }

  }

  const handleDeleteGrupo = () => {
    if (selectedGrupo) {
      activeGrupoMutation.mutate({ id: selectedGrupo.id, status: selectedGrupo.status })
      //deleteTipoMutation.mutate(selectedGrupo.id.toString())
    }
  }

  const handleUpdateGrupo = () => {
    if (selectedGrupo) {
      updateTipoMutation.mutate({
        id: selectedGrupo.id,
        descricao: selectedGrupo.descricao,
        cor: selectedGrupo.cor,
        status: selectedGrupo.status,
        empresaId: Number(glb_params.id_empresa),
      })
    }
  }

  console.log(selectedGrupo);

  return (
    <div className="container mx-auto p-4 font-[Poppins-regular] " style={{ color: "#034869" }}>
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <Dialog
          open={isCreateDialogOpen}
          onOpenChange={(value) => {
            setIsCreateDialogOpen(value)
            setNewGrupo({
              descricao: '',
              cor: '',
              status: PessoaStatus.ATIVA,
              empresaId: Number(glb_params.id_empresa),
            }
            )
          }}
        >
          <DialogTrigger asChild>
            <div className='flex justify-end w-full'>
              <Button size={"sm"}
                className="hover:bg-[#a9d9ef] hover:cursor-pointer bg-[#034869] hover:text-[#034869] text-white"
              >
                <Plus className="mr-2 h-4 w-4 font-[Poppins-regular]" /> Criar Grupo
              </Button>
            </div>
          </DialogTrigger>
          <DialogContent className='font-[Poppins-regular]'>
            <DialogHeader>
              <DialogTitle>Criar novo Grupo de Fluxo de Caixa</DialogTitle>
              <DialogDescription style={{ color: '#034869' }}>Preencha os dados do novo Grupo de Fluxo de Caixa abaixo.</DialogDescription>
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
                  value={newGrupo.descricao}
                  onChange={(e) => setNewGrupo({ ...newGrupo, descricao: e.target.value.toUpperCase() })}
                />
              </div>
            </div>
            <div className='text-base'>
              <Label className='text-base'>Cor</Label>
              <div className="grid grid-cols-6 items-center gap-4">
                <Input
                  id="cor"
                  type="color"
                  value={newGrupo.cor}
                  onChange={(e) => setNewGrupo({ ...newGrupo, cor: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleCreateGrupo}
                className="hover:bg-[#a9d9ef] hover:cursor-pointer bg-[#034869] hover:text-[#034869] text-white">
                Criar Grupo</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {grupos && grupos.length === 0 && !isLoading && (
        <p className="text-center text-muted-foreground mt-2">
          Nenhum grupo de fluxo de caixa encontrado.
        </p>
      )}
      {grupos && grupos.length > 0 && !isLoading && (
        <table className="w-full">
          <thead>
            <tr>
              <th className="border-b p-2 text-left">Descrição</th>
              <th className="border-b p-2 text-left">Cor</th>
              <th className="border-b p-2 text-left"></th>
            </tr>
          </thead>
          <tbody>
            {grupos.map((grupo) => (
              <tr key={grupo.id} className="hover:bg-gray-100">
                <td className={grupo.status === PessoaStatus.CANCELADA ? "border-b p-2 text-red-600" : "border-b p-2"}>{grupo.descricao}</td>
                <td className={grupo.status === PessoaStatus.CANCELADA ? "border-b p-2 text-red-600" : "border-b p-2"}>
                  <div className="grid grid-cols-2 items-center gap-2">
                    {grupo.cor}
                    <div style={{ backgroundColor: grupo.cor }} className="w-6 h-6 rounded-full ml-2"></div>
                  </div>
                </td>
                <td className="border-b p-2">
                  <div className="flex space-x-2">
                    {grupo.status === PessoaStatus.ATIVA && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedGrupo(grupo)
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
                          setSelectedGrupo(grupo)
                        }
                        } title='Cancelar Grupo de Fluxo de Caixa'>
                          {grupo.status === PessoaStatus.CANCELADA ? <Recycle className="h-4 w-4" color='red' /> : <Trash2 className="h-4 w-4" />}

                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription>
                            {grupo.status === PessoaStatus.CANCELADA ? 'Isso reativará o grupo de fluxo de caixa.' : 'Isso deixará o grupo de fluxo de caixa desativado.'}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteGrupo}>
                            {grupo.status === PessoaStatus.CANCELADA ? 'Sim, reativar o grupo de fluxo de caixa.' : 'Sim, desativar o grupo de fluxo de caixa.'}
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
            <DialogTitle>Editar Grupo de Fluxo de Caixa</DialogTitle>
            <DialogDescription>Edite os dados do Grupo de Fluxo de Caixa abaixo.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-1 items-center gap-4">
              <Label className="text-base">
                Descrição
              </Label>
              <Input
                id="edit-name"
                value={selectedGrupo?.descricao || ''}
                onChange={(e) => setSelectedGrupo((prev) => ({ ...prev!, descricao: e.target.value.toUpperCase() }))}
                className="col-span-3"
              />
            </div>

            <div className='mt-2 text-base'>
              <Label className='text-base'>Cor</Label>
              <div className="grid grid-cols-6 items-center gap-4">
                <Input
                  id="edit-cor"
                  type="color"
                  value={selectedGrupo?.cor || ''}
                  onChange={(e) => setSelectedGrupo((prev) => ({ ...prev!, cor: e.target.value.toUpperCase() }))}
                />
              </div>
            </div>

          </div>
          <DialogFooter>
            <Button onClick={handleUpdateGrupo}>Salvar alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
