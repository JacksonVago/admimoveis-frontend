import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import api from '@/services/axios/api'
import { queryOptions, useMutation, useQuery } from '@tanstack/react-query'
import { Pencil, Plus, Recycle, Trash2 } from 'lucide-react'
import { TipoImovel } from '@/interfaces/tipoimovel'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import React from 'react'
import { toast } from '@/hooks/use-toast'
import { queryClient } from '@/services/react-query/query-client'
import axios from 'axios'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { PessoaStatus } from '@/enums/pessoal/status-pesoa'
import { useGlobalParams } from '@/globals/GlobalParams'

// Types
/*interface GetTipoParams {
  search?: string
  page?: number
  limit?: number,
  status?: string | undefined,
  exclude?: string,
}*/

// API & Query Logic
export const getTipos = async (empresaId: number) => {
  return await api.get<TipoImovel[]>('tipoimovel/' + empresaId)
}

export const useGetTiposQueryOptions = (empresaId: number) => {
  return queryOptions({
    queryKey: ['tipoimovel', empresaId],
    queryFn: () => getTipos(empresaId)
  })
}

export const createTipo = ({
  name,
  empresaId,
}: {
  name: string
  empresaId: number
}) => {
  return api.post('/tipoimovel', {
    name: name,
    empresaId: empresaId
  })
}

export const activeTipo = async (tipoData: {
  id: number
  status: PessoaStatus
}) => {
  const result = await api.patch(tipoData.status === PessoaStatus.CANCELADA ? `/tipoimovel/statusAtiva/${tipoData.id}` : `/tipoimovel/statusDesativa/${tipoData.id}`)
  return result.data;
}

export const putUpdateTipo = (tipoData: {
  id: number
  name: string
}) => {
  return api.put(`/tipoimovel/${tipoData.id}`, { name: tipoData.name })
}


// Component
export default function ListarTipos() {


  /*const isBigScreen = useMediaQuery({ query: '(min-width: 1824px)' })
  const isPortrait = useMediaQuery({ query: '(min-width: 1224px)' })
  const isTablet = useMediaQuery({ query: '(min-width: 746px)' })
  const isMobile = useMediaQuery({ query: '(min-width: 200px)' })
  const isRetina = useMediaQuery({ query: '(min-resolution: 2dppx)' })*/

  //const navigate = useNavigate()

  const [selectedTipo, setSelectedTipo] = React.useState<TipoImovel | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [newTipo, setNewTipo] = React.useState({ name: '', empresaId: 0 })
  //Globals
  const glb_params = useGlobalParams();

  //const [searchParams, setSearchTerm] = useSearchParams();
  //const page = Number(searchParams.get('page')) || 1;
  //const limit = 3;

  const { data, isLoading } = useQuery(
    useGetTiposQueryOptions(Number(glb_params.id_empresa))
  )

  const tipos = data?.data;  

  const createTipoMutation = useMutation({
    mutationFn: createTipo,
    onSuccess: () => {
      ;['tipoimovel'].forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey: [queryKey] })
      });
      toast({
        title: 'Tipo de imóvel criado',
        description: 'O novo tipo de imóvel foi criado com sucesso.',                
      })
      setIsCreateDialogOpen(false)
      setNewTipo({ name: '', empresaId: Number(glb_params.id_empresa) })
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        // Check if there's a response and data within the error
        if (error.response && error.response.data) {
          console.error('Error message from server:', error.response.data);
          toast({
            title: 'Erro ao criar tipo de imóvel',
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
          description: error instanceof Error ? error.message : 'Ocorreu um erro ao criar o tipo de imóvel. Tente novamente.',
          variant: 'destructive'
        })
      }

    }
  });

  const activeTipoMutation = useMutation({
    mutationFn: activeTipo,
    onSuccess: () => {
      ;['tipoimovel'].forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey: [queryKey] })
      });
      toast({
        title: `Tipo de imóvel ${selectedTipo?.status === PessoaStatus.CANCELADA ? 'reativado' : 'desativado'}`,
        description: `O tipo de imóvel foi ${selectedTipo?.status === PessoaStatus.CANCELADA ? 'reativado' : 'desativado'} com sucesso.`,
        variant: selectedTipo?.status === PessoaStatus.CANCELADA ? 'default' : 'destructive'
      })
      setSelectedTipo(null)
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: `Ocorreu um erro ao ${selectedTipo?.status === PessoaStatus.CANCELADA ? 'reativado' : 'desativado'} o tipo de imóvel. Tente novamente.`,
        variant: 'destructive'
      })
    }
  })

  React.useEffect(() => {
    glb_params.updTitle_form('Tipos de imóvel');
  }, [])

  const updateTipoMutation = useMutation({
    mutationFn: putUpdateTipo,
    onSuccess: () => {
      toast({
        title: 'Tipo de imóvel atualizado',
        description: 'As informações do tipo de imóvel foram atualizadas com sucesso.'
      })
      setIsEditDialogOpen(false)
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao atualizar o tipo de imóvel. Tente novamente.',
        variant: 'destructive'
      })
    }
  })


  const handleCreateTipo = () => {

    if (newTipo.name.trim() !== '') {
      createTipoMutation.mutate({
        name: newTipo.name,
        empresaId: Number(glb_params.id_empresa),
      });
    }
    else {
      toast({
        title: 'Erro ao criar tipo de imóvel',
        description: "O nome do tipo de imóvel não pode estar vazio.",
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
      })
    }
  }


  return (
    <div className="container mx-auto space-y-4 p-4 font-[Poppins-regular]">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        {/* <h1 className="text-2xl font-bold">Cadastro de Tipo de Imóvel</h1> */}
        <Dialog
          open={isCreateDialogOpen}
          onOpenChange={(value) => {
            setIsCreateDialogOpen(value)
            setNewTipo({ name: '', empresaId: Number(glb_params.id_empresa)})
          }}
        >
          <DialogTrigger asChild>
            <Button size={"sm"} className='hover:cursor-pointer hover:bg-gray-600'>
              <Plus className="mr-2 h-4 w-4" /> Criar Tipo de Imóvel
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar novo Tipo de Imóvel</DialogTitle>
              <DialogDescription>Preencha os dados do novo Tipo de Imóvel abaixo.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Descrição
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Apartamento, Casa, etc"
                  value={newTipo.name}
                  onChange={(e) => setNewTipo({ ...newTipo, name: e.target.value.toUpperCase() })}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateTipo} className='hover:cursor-pointer hover:bg-gray-600'>Criar Tipo</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {tipos && tipos.length === 0 && !isLoading && (
        <p className="text-center text-muted-foreground">
          Nenhum tipo de imóvel encontrado.
        </p>
      )}
      {tipos && tipos.length > 0 && !isLoading && (
        <table className="w-full">
          <thead>
            <tr>
              <th className="border-b p-2 text-left">Nome</th>
              <th className="border-b p-2 text-left"></th>
            </tr>
          </thead>
          <tbody>
            {tipos.map((tipo) => (
              <tr key={tipo.id} className="hover:bg-gray-100">
                <td className={tipo.status === PessoaStatus.CANCELADA ? "border-b p-2 text-red-600" : "border-b p-2"}>{tipo.name}</td>
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
                        className='hover:cursor-pointer hover:bg-gray-200'
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
                        } title='Cancelar Tipo de Imóvel'>
                          {tipo.status === PessoaStatus.CANCELADA ? <Recycle className="h-4 w-4" color='red' /> : <Trash2 className="h-4 w-4" />}

                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription>
                            {tipo.status === PessoaStatus.CANCELADA ? 'Isso reativará o tipo de imóvel.' : 'Isso deixará o tipo de imóvel desativado.'}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteTipo}>
                            {tipo.status === PessoaStatus.CANCELADA ? 'Sim, reativar o tipo de imóvel.' : 'Sim, desativar o tipo de imóvel.'}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Tipo de Imóvel</DialogTitle>
            <DialogDescription>Edite os dados do colaborador abaixo.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Descrição
              </Label>
              <Input
                id="edit-name"
                value={selectedTipo?.name || ''}
                onChange={(e) => setSelectedTipo((prev) => ({ ...prev!, name: e.target.value.toUpperCase() }))}
                className="col-span-3"
              />
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
