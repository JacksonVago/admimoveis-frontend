//import { createClient } from '@supabase/supabase-js';
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
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import moment from "moment";
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import api from '@/services/axios/api'
import { queryClient } from '@/services/react-query/query-client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import * as React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { LancamentoStatus } from '@/enums/locacao/enums-locacao'
import { useGlobalParams } from '@/globals/GlobalParams';
//import { boolean } from 'zod';
import { useMediaQuery } from 'react-responsive';
import { LancamentoCondominioSchema, lancCondominioSchema } from '@/schemas/lancamentos.schema'
import { getEnderecoFormatado } from '@/helpers/get-endereco-formatado'
import { TipoLancamento } from '@/interfaces/lancamentotipo'
import axios from 'axios'
import { useParams } from 'react-router-dom'
import { useAuth } from '@/hooks/auth/use-auth'
import { Loader } from '@/components/ui/loader'
import { LancamentoCondominio } from '@/interfaces/lancamentocondominio'
import { Bloco } from '@/interfaces/bloco'
import { useState } from 'react'
import { Calc_DIG_Modulo } from '@/utils/pagseguro-ecrypt'

export const getTipos = async (empresaId:number) => {
  return await api.get<TipoLancamento[]>('tipolancamento/' + empresaId)
}

export const DetalhesLancamentoCondominio = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isPortrait = useMediaQuery({ query: '(max-width: 1224px)' })
  const isMobile = useMediaQuery({ query: '(max-width: 420px)' })

  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)

  const [isEditing, setIsEditing] = React.useState(false)
  const [titulo, setTitulo] = React.useState("Criar novo lançamento")
  const disabled = isEditing

  const dataParams = useParams<{ id: string }>();
  const id = dataParams.id ? parseInt(dataParams.id) : undefined;
  const [dataInicial, setdataInicial] = useState(moment(new Date()).format("YYYY-MM-DD"));
  const [dataFinal, setdataFinal] = useState(moment(new Date()).format("YYYY-MM-DD"));


  //Globals
  const glb_params = useGlobalParams();

  const { data: bloco, isLoading } = useQuery({
    queryKey: ['bloco', id],
    queryFn: async () => {
      const { data } = await api.get<Bloco>(`/condominios/lancamentos/${id}?dataInicial=${dataInicial}&dataFinal=${dataFinal}`)
      setdataInicial(moment.utc(dataInicial).format("YYYY-MM-DD"));
      setdataFinal(moment.utc(dataInicial).format("YYYY-MM-DD"));
      return data
    },
    enabled: !!id
  })

  console.log(bloco);
  const createLancamento = useMutation({
    mutationFn: async (data: FormData) => {

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

  const onSubmitLancamentoData = async (data: LancamentoCondominioSchema) => {
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

  //Calcula data de vencimento
  /*function calcVencimento() {
    let dt_hoje = new Date();
    let dt_vencto = new Date();
    let int_ano = dt_hoje.getFullYear();
    let int_mes = dt_hoje.getMonth() + 1;

    if (condominio) {
      console.log(int_ano);
      console.log(int_mes);
      console.log(locacao.diaVencimento);
      console.log(dt_hoje);
      console.log(dt_hoje.getDate());

      if (locacao.diaVencimento < dt_hoje.getDate()) {
        if (int_mes === 12) {
          dt_vencto = new Date((int_ano + 1).toString() + '-01-' + (locacao.diaVencimento < 10 ? '0' + locacao.diaVencimento.toString() : locacao.diaVencimento.toString()) + ' 00:00:00');
        }
        else {
          dt_vencto = new Date(int_ano.toString() + '-' + ((int_mes + 1) < 10 ? '0' + (int_mes + 1).toString() : (int_mes + 1).toString()) + '-' + (locacao.diaVencimento < 10 ? '0' + locacao.diaVencimento.toString() : locacao.diaVencimento.toString()) + ' 00:00:00');
        }
      }
      else {
        console.log(int_ano.toString() + '-' + (int_mes < 10 ? '0' + int_mes.toString() : int_mes.toString()) + '-' + (locacao.diaVencimento < 10 ? '0' + locacao.diaVencimento.toString() : locacao.diaVencimento.toString()) + ' 00:00:00');
        dt_vencto = new Date(int_ano.toString() + '-' + (int_mes < 10 ? '0' + int_mes.toString() : int_mes.toString()) + '-' + (locacao.diaVencimento < 10 ? '0' + locacao.diaVencimento.toString() : locacao.diaVencimento.toString()) + ' 00:00:00');
      }
    }

    return dt_vencto;
  }*/

  //default values
  const defaultValues = React.useMemo(
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
    glb_params.updTitle_form(`Lancamentos - ${moment(dataInicial).format('DD/MM/YYYY')} à ${moment(dataFinal).format('DD/MM/YYYY')}`);
    if (glb_params.pastaOrig === '') {
      glb_params.updPastaOrig('personal-info');
    }
    if (localStorage) lancamentoMethods.reset(defaultValues)
  }, [defaultValues])

  //react hook form

  const lancamentoMethods = useForm<LancamentoCondominioSchema>({
    resolver: zodResolver(lancCondominioSchema),
    defaultValues,
    mode: 'onBlur'
  })

  React.useEffect(() => {
    if (bloco) {
      lancamentoMethods.reset(defaultValues) // seta os valores do formulário com os dados do proprietário
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

  const handlerValidaLinhaDig = (value: string) => {
    if (value) {
      // Remove espaços e traços
      const linhaDigitavelDig = value.replace(/\s/g, '').replace(/-/g, '');
      const linhaDigitavel = linhaDigitavelDig.substring(0,11) + linhaDigitavelDig.substring(12,23) + linhaDigitavelDig.substring(24,35) + linhaDigitavelDig.substring(36,47);
      console.log(linhaDigitavel);
      // Verifica se a linha digitável tem 44 ou 48 dígitos
      if (linhaDigitavel.length === 44 || linhaDigitavel.length === 48) {
        // Verifica se todos os caracteres são dígitos
        if (/^\d+$/.test(linhaDigitavel)) {
          // Aqui você pode implementar a lógica de validação do dígito verificador, se necessário
          var dbl_valor = 0;
          var int_dig = 0;
          var int_modulo = (linhaDigitavel.substring(2,1) === '6' ? 11 : 10)
          var str_vencimento = '';

          //Validar digitos
          //Bloco 1
          int_dig = Calc_DIG_Modulo(linhaDigitavel.substring(0,11), int_modulo);
          if (int_dig === parseInt(linhaDigitavelDig.substring(12, 1))) {
            return true;
          }

          //Bloco 2
          int_dig = Calc_DIG_Modulo(linhaDigitavel.substring(12,11), int_modulo);
          if (int_dig === parseInt(linhaDigitavelDig.substring(23, 1))) {
            return true;
          }

          //Bloco 3
          int_dig = Calc_DIG_Modulo(linhaDigitavel.substring(24,11), int_modulo);
          if (int_dig === parseInt(linhaDigitavelDig.substring(35, 1))) {
            return true;
          }

          //Bloco 4
          int_dig = Calc_DIG_Modulo(linhaDigitavel.substring(36,11), int_modulo);
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

  console.log(lancamentoMethods.formState.errors);
  //if (isLoading) return <PageLoader />
  if (isLoading) return <Loader />

  return (
    <div className="scale mx-auto flex max-w-screen-xl transform flex-col items-center px-4 transition-transform">
      <div className="mx-auto w-full rounded-md">
        <Card className='font-[Poppins-regular]'>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <Label className="ml-1 mb-4 mt-8 font-bold">{bloco?.condominio?.name + ' ' + bloco?.name + ' - '+ getEnderecoFormatado(bloco?.condominio?.endereco)}</Label>
              <Dialog
                open={isCreateDialogOpen}
                onOpenChange={(value) => {
                  setIsCreateDialogOpen(value)
                  if (!value) {
                    setTitulo("Criar novo lançamento");
                    lancamentoMethods.reset(defaultValues);
                  }
                }}
              >
                <DialogTrigger asChild>
                  {(isAdmin ||
                    user?.permissions.includes("ALL") ||
                    user?.permissions.includes("CREATE_LANCAMENTO")
                  ) && (

                      <Button size={'sm'}>
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
                    {bloco.lancamentosCondominios?.map((lancamento) => (
                      <>
                        <Label className={!isMobile ? 'flex items-center' : 'flex items-center col-span-2'} style={{ 'fontSize': '0.7rem' }}>{lancamento.lancamentotipo.name}</Label>
                        {!isMobile ? (<Label className='flex items-center' style={{ 'fontSize': '0.7rem' }}>{moment.utc(lancamento.dataLancamento).format("DD/MM/YYYY")}</Label>) : (<></>)}
                        <Label className='flex items-center' style={{ 'fontSize': '0.7rem' }}>{moment.utc(lancamento.vencimentoLancamento).format("DD/MM/YYYY")}</Label>
                        <Label className='flex justify-end items-center' style={{ 'fontSize': '0.7rem' }}>{lancamento.valorLancamento}</Label>
                        <div className='flex justify-center'>
                          {((isAdmin ||
                            user?.permissions.includes("ALL") ||
                            user?.permissions.includes("UPDATE_LANCAMENTO")
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
    </div>
  )
}