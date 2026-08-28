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
import { GrupoFluxoCaixa } from '@/interfaces/grupo-fluxo-caixa'
import { Controller, useForm } from 'react-hook-form'
import { tipolancamentoSchema, TipoLancamentoSchema } from '@/schemas/tipolancamento.schema'
import { zodResolver } from '@hookform/resolvers/zod'


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

export const getTipos = async (empresaId: number) => {
  return await api.get<TipoLancamento[]>('tipolancamento/' + empresaId)
}

export const useGetTiposQueryOptions = (empresaId: number) => {
  return queryOptions({
    queryKey: ['tipolancamento', empresaId],
    queryFn: () => getTipos(empresaId)
  })
}

export const createTipo = async (data: FormData) => {
  return await api.post('/tipolancamento', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

export const activeTipo = async (tipoData: {
  id: number
  status: PessoaStatus
}) => {
  const result = await api.patch(tipoData.status === PessoaStatus.CANCELADA ? `/tipolancamento/statusAtiva/${tipoData.id}` : `/tipolancamento/statusDesativa/${tipoData.id}`)
  return result.data;
}

export const putUpdateTipo = async (data: FormData) => {
  return api.put(`/tipolancamento/${data.get('id')}`, data
    , {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
}


// Component
export default function ListarTiposLancamento() {
  //Globals
  const glb_params = useGlobalParams();

  const [titulo, setTitulo] = React.useState("Criar Tipo de Lançamento")
  const [selectedTipo, setSelectedTipo] = React.useState<TipoLancamento | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)

  //default values
  const defaultValues = React.useMemo(
    () => ({
      id: 0,
      name: '',
      tipo: lancamentoTipo.DEBITO,
      automatico: 'N',
      parcelas: 0,
      geraObservacao: 'N',
      valorFixo: 0,
      grupofluxoId: 0,
      empresaId: glb_params.id_empresa ? Number(glb_params.id_empresa) : 0,
    }),
    [glb_params.id_empresa]
  )

  const tipoMethods = useForm<TipoLancamentoSchema>({
    resolver: zodResolver(tipolancamentoSchema),
    defaultValues,
    mode: 'all'
  });

  const [chkAutom, setChkAutom] = React.useState(tipoMethods.getValues("automatico") === "S" ? true : false);
  const [chkGeraObs, setChkGeraObs] = React.useState(tipoMethods.getValues("geraObservacao") === "S" ? true : false);

  const { data: dataGrp } = useQuery(
    useGetGruposQueryOptions(Number(glb_params.id_empresa))
  )

  const grupos = dataGrp?.data;

  const { data, isLoading } = useQuery(
    useGetTiposQueryOptions(Number(glb_params.id_empresa))
  )

  const tipos = data?.data;
  console.log("tipos: ", tipos);

  const createTipoMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await createTipo(data);
    },
    onSuccess: () => {
      ;['tipolancamento'].forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey: [queryKey] })
      });
      toast({
        title: 'Tipo de lançamento criado',
        description: 'O novo tipo de lançamento foi criado com sucesso.',
      })
      setIsCreateDialogOpen(false);
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
      ['tipolancamento'].forEach((queryKey) => {
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
    mutationFn: async (data: FormData) => {
      return await putUpdateTipo(data);
    },
    onSuccess: () => {
      ['tipolancamento'].forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey: [queryKey] })
      });

      toast({
        title: 'Tipo de lançamento atualizado',
        description: 'As informações do tipo de lançamento foram atualizadas com sucesso.'
      })
      setIsCreateDialogOpen(false)
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao atualizar o tipo de lançamento. Tente novamente.',
        variant: 'destructive'
      })
    }
  })



  const handleDeleteTipo = () => {
    if (selectedTipo) {
      activeTipoMutation.mutate({ id: selectedTipo.id, status: selectedTipo.status })
      //deleteTipoMutation.mutate(selectedTipo.id.toString())
    }
  }

  const handlerChkAutom = (checked: boolean) => {
    tipoMethods.setValue("automatico", checked ? "S" : "N");
    setChkAutom(checked);
  };

  const handlerChkGeraObs = (checked: boolean) => {
    tipoMethods.setValue("geraObservacao", checked ? "S" : "N");
    setChkGeraObs(checked);
  };

  const onSubmitTipoLancamentoData = async (data: TipoLancamentoSchema) => {
    try {
      const form = new FormData()

      if (data?.name) {
        form.append('name', data.name)
      }


      if (data?.tipo) {
        form.append('tipo', data.tipo)
      }

      if (data?.automatico) {
        form.append('automatico', data.automatico)
      }

      if (data?.parcelas) {
        form.append('parcelas', data.parcelas.toString())
      }
      else {
        form.append('parcelas', '0')
      }

      if (data?.geraObservacao) {
        form.append('geraObservacao', data.geraObservacao)
      }

      if (data?.valorFixo) {
        form.append('valorFixo', data.valorFixo.toString())
      }
      else {
        form.append('valorFixo', "0")
      }


      if (data?.grupofluxoId) {
        form.append('grupofluxoId', data.grupofluxoId.toString())
      }

      if (data?.id) {
        form.append('id', data.id.toString())
      }

      form.append('id', data.id.toString())

      if (data.empresaId) {
        form.append('empresaId', data.empresaId.toString())
      }

      if (titulo === "Criar Tipo de Lançamento") {
        await createTipoMutation.mutate(form);
      }
      else {
        await updateTipoMutation.mutate(form)
      }

      setIsCreateDialogOpen(false);
      //setIsEditing(false);

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

  const handleEditTipoLancamento = (tipo: TipoLancamento) => {
    setSelectedTipo(tipo)
    setTitulo("Alterar tipo de lançamento")
    setIsCreateDialogOpen(true);
    tipoMethods.setValue("id", tipo.id);
    tipoMethods.setValue("name", tipo.name);
    tipoMethods.setValue("tipo", tipo.tipo);
    tipoMethods.setValue("automatico", tipo.automatico === "S" ? "S" : "N");
    tipoMethods.setValue("geraObservacao", tipo.geraObservacao === "S" ? "S" : "N");
    tipoMethods.setValue("parcelas", tipo.parcelas);
    tipoMethods.setValue("valorFixo", tipo.valorFixo);
    tipoMethods.setValue("grupofluxoId", tipo.grupofluxoId);
    tipoMethods.setValue("empresaId", tipo.empresaId);
    console.log(tipoMethods.getValues());
  }

  return (
    <div className="container mx-auto p-4 font-[Poppins-regular] " style={{ color: "#034869" }}>
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <Dialog
          open={isCreateDialogOpen}
          onOpenChange={(value) => {
            setIsCreateDialogOpen(value)
            if (!value) {
              setTitulo("Criar Tipo de Lançamento");
              tipoMethods.reset(defaultValues);
            }

          }}
        >
          <DialogTrigger asChild>
            <div className='flex justify-end w-full'>
              <Button size={"sm"}
                className="hover:bg-[#a9d9ef] hover:cursor-pointer bg-[#034869] hover:text-[#034869] text-white"
              >
                <Plus className="mr-2 h-4 w-4 font-[Poppins-regular]" /> Criar Tipo de Lançamento
              </Button>
            </div>
          </DialogTrigger>
          <DialogContent className='font-[Poppins-regular]'>
            <DialogHeader>
              <DialogTitle>{titulo}</DialogTitle>
              <DialogDescription style={{ color: '#034869' }}>{titulo.includes('novo') ? 'Preencha os dados do novo lançamento abaixo.' : ''}</DialogDescription>
            </DialogHeader>
            <form onSubmit={tipoMethods.handleSubmit(onSubmitTipoLancamentoData)}>
              <div className="grid gap-4 font-[Poppins-regular]">
                <div className="grid grid-cols-1 items-center">
                  <Label className='text-base'>
                    Descrição
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Iptu, condomínio, etc..."
                    {...tipoMethods.register('name')}
                  />
                  {tipoMethods.formState.errors.name?.message &&
                    (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                      {tipoMethods.formState.errors.name.message}
                    </p>)}

                </div>
              </div>

              <div className='mt-2'>
                <Label className="text-base">
                  Tipo de Lançamento
                  <div className='mt-2'>
                    <Controller
                      name="tipo"
                      control={tipoMethods.control}
                      render={({ field }) => (
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                          }}
                          value={String(field.value)}
                        >
                          <SelectTrigger className='col-start-1 row-start-1 appearance-none border-blue-50 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full'>
                            <SelectValue placeholder="Selecione o condomínio" />
                          </SelectTrigger>
                          <SelectContent>
                            {TIPO_LANCAMENTO_OPTIONS.map((lancto) => (
                              <SelectItem className='text-base' key={lancto.label} value={lancto.value}>
                                {lancto.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {tipoMethods.formState?.errors?.tipo?.message && (
                      <span>{tipoMethods.formState?.errors?.tipo?.message}</span>
                    )}
                  </div>
                </Label>
              </div>

              <div style={{ display: "flex", alignItems: "center" }}>
                <label
                  className="Label"
                  htmlFor="airplane-mode"
                  style={{ paddingRight: 15, color: '#034869' }}

                >
                  Automático
                </label>
                <Switch className="SwitchRoot focus:outline-none" id="airplane-mode"
                  checked={chkAutom}
                  onCheckedChange={handlerChkAutom}>
                  <Thumb className="SwitchThumb" />
                </Switch>
              </div>

              <div className="grid gap-4 font-[Poppins-regular]">
                <div className="grid grid-cols-1 items-center gap-4">
                  <Label className='text-base'>
                    Parcelas
                  </Label>
                  <Input
                    id="name"
                    type="number"
                    placeholder="Parcelas"
                    {...tipoMethods.register('parcelas')}
                  />
                  {tipoMethods.formState.errors.parcelas?.message &&
                    (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                      {tipoMethods.formState.errors.parcelas.message}
                    </p>)}
                </div>
              </div>

              <div className="grid gap-4 font-[Poppins-regular]">
                <div className="grid grid-cols-1 items-center gap-4">
                  <Label className='text-base'>
                    Valor Fixo
                  </Label>
                  <Input
                    id="name"
                    type="number"
                    placeholder="Valor Fixo"
                    {...tipoMethods.register('valorFixo')}
                  />
                  {tipoMethods.formState.errors.valorFixo?.message &&
                    (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                      {tipoMethods.formState.errors.valorFixo.message}
                    </p>)}
                </div>
              </div>

              <div className='mt-2'>
                <Label className="text-base">
                  Grupo Fluxo de caixa
                  <div className='mt-2'>
                    <Controller
                      name="grupofluxoId"
                      control={tipoMethods.control}
                      render={({ field }) => (
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                          }}
                          value={String(field.value)}
                        >
                          <SelectTrigger className='col-start-1 row-start-1 appearance-none border-blue-50 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full'>
                            <SelectValue placeholder="Selecione o condomínio" />
                          </SelectTrigger>
                          <SelectContent>
                            {grupos?.map((grupo) => (
                              <SelectItem key={grupo.id} value={grupo.id.toString()}>
                                {grupo.descricao}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {tipoMethods.formState?.errors?.grupofluxoId?.message && (
                      <span>{tipoMethods.formState?.errors?.grupofluxoId?.message}</span>
                    )}
                  </div>
                </Label>
              </div>

              <div style={{ display: "flex", alignItems: "center" }}>
                <label
                  className="Label"
                  htmlFor="airplane-mode"
                  style={{ paddingRight: 15, color: '#034869' }}
                >
                  Gera Observação
                </label>
                <Switch className="SwitchRoot focus:outline-none" id="airplane-mode"
                  checked={chkGeraObs}
                  onCheckedChange={handlerChkGeraObs}>
                  <Thumb className="SwitchThumb" />
                </Switch>
              </div>

              <DialogFooter>
                <Button type='submit'
                  className="hover:bg-[#a9d9ef] hover:cursor-pointer bg-[#034869] hover:text-[#034869] text-white">
                  {titulo.includes('Criar') ? 'Criar Tipo' : 'Confirmar Alteração'}</Button>
              </DialogFooter>
            </form>
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
              <th className="border-b p-2 text-left">Grupo Fluxo</th>
              <th className="border-b p-2 text-left"></th>
            </tr>
          </thead>
          <tbody>
            {tipos.map((tipo) => (
              <tr key={tipo.id} className="hover:bg-gray-100">
                <td className={tipo.status === PessoaStatus.CANCELADA ? "border-b p-2 text-red-600" : "border-b p-2"}>{tipo.name}</td>
                <td className={tipo.status === PessoaStatus.CANCELADA ? "border-b p-2 text-red-600" : "border-b p-2"}>{tipo.tipo}</td>
                <td className={tipo.status === PessoaStatus.CANCELADA ? "border-b p-2 text-red-600" : "border-b p-2"}>{tipo.automatico}</td>
                <td className={tipo.status === PessoaStatus.CANCELADA ? "border-b p-2 text-red-600" : "border-b p-2"}>{tipo.grupofluxo ? tipo.grupofluxo.descricao : ""}</td>
                <td className="border-b p-2">
                  <div className="flex space-x-2">
                    {tipo.status === PessoaStatus.ATIVA && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditTipoLancamento(tipo);
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

    </div>
  )
}
