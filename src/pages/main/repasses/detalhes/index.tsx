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
import moment from "moment";
import { toast } from '@/hooks/use-toast'
import api from '@/services/axios/api'
import { queryClient } from '@/services/react-query/query-client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { CircleCheck, Pencil, Trash2 } from 'lucide-react'
import * as React from 'react'
import { useForm, Controller, FormProvider } from 'react-hook-form'
import { LancamentoStatus, BoletoStatus } from '@/enums/locacao/enums-locacao'
import { useGlobalParams } from '@/globals/GlobalParams';
//import { boolean } from 'zod';
import { useMediaQuery } from 'react-responsive';
import { getEnderecoFormatado } from '@/helpers/get-endereco-formatado'
import { TipoLancamento } from '@/interfaces/lancamentotipo'
import axios from 'axios'
import { useParams } from 'react-router-dom'
import { boletoSchema, BoletoSchema } from '@/schemas/boleto.schema'
import { Boleto } from '@/interfaces/boleto'
import { usdFormatter } from '@/utils/format-money'
import { STATUS_BOLETO_OPTIONS } from '@/constants/status-boletos'
import { DocumentUpload } from '../../imoveis/criarImovel/components/document-upload'

export const getTipos = async () => {
  return await api.get<TipoLancamento[]>('tipolancamento')
}

const fetchDocumentFiles = async (documents: Boleto['documentos']) => {
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


export const DetalhesBoleto = () => {
  const isPortrait = useMediaQuery({ query: '(max-width: 1224px)' })
  const isMobile = useMediaQuery({ query: '(max-width: 420px)' })

  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)

  const [isEditing, setIsEditing] = React.useState(false)
  const [titulo, setTitulo] = React.useState("Dados Pagamento")
  const disabled = isEditing

  const dataParams = useParams<{ id: string }>();
  const id = dataParams.id ? parseInt(dataParams.id) : undefined;

  //Globals
  const glb_params = useGlobalParams();

  const { data: boleto } = useQuery({
    queryKey: ['boleto', id],
    queryFn: async () => {
      const { data } = await api.get<Boleto>(`/pagamentos/${id}`)
      return data
    },
    enabled: !!id
  })


  const { data: documentFilesData = [], isSuccess: isSuccessDocuments } = useQuery({
    queryKey: ['documentFiles', id, boleto?.documentos],
    queryFn: () => fetchDocumentFiles(boleto?.documentos),
    enabled: !!boleto?.documentos?.length
  })

  const documentFiles = React.useMemo(() => documentFilesData, [isSuccessDocuments])

  const updateBoleto = useMutation({
    mutationFn: async (data: FormData) => {
      return await api.put<Boleto>(`/Pagamentos/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },
    onSuccess: () => {
      ['boleto','documentFiles', id].forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] })
      })
    }
  })

  const deleteBoleto = useMutation({
    mutationFn: async (boletoId: number) => {
      return await api.delete(`/pagamentos/${boletoId}`)
    },
    onSuccess: () => {
      ['boleto', id].forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] })
      })

      toast({
        title: 'Boleto excluído com sucesso',
        description: `Boleto excluído com sucesso`
      })
    }
  })

  const onSubmitBoletoData = async (data: BoletoSchema) => {
    try {
      const form = new FormData()

      if (data?.dataPagamento) {
        form.append('dataPagamento', data.dataPagamento)
      }

      if (data?.dataEmissao) {
        form.append('dataEmissao', data.dataEmissao)
      }

      if (data?.dataVencimento) {
        form.append('dataVencimento', data.dataVencimento)
      }

      if (data?.valorOriginal) {
        form.append('valorOriginal', data.valorOriginal.toString())
      }

      if (data?.valorPago) {
        form.append('valorPago', data.valorPago.toString())
      }

      form.append('status', BoletoStatus.PAGO);
      form.append('dataPagamento', moment(new Date()).format("YYYY-MM-DD"));

      if (data?.locatarioId) {
        form.append('locatarioId', data.locatarioId.toString())
      }

      if (data?.locacaoId) {
        form.append('locacaoId', data.locacaoId.toString())
      }

      form.append('id', data.id ? data.id.toString() : '')

      const newDocuments = data?.documentos?.filter((doc:any) => !doc.id)
      newDocuments?.forEach((doc:any) => {
        form.append('documentos', doc.file)
      })

      if (data?.documentosToDeleteIds?.length) {
        data.documentosToDeleteIds.forEach((docId:any) => {
          form.append('documentosToDeleteIds[]', docId.toString())
        })
      }

      await updateBoleto.mutateAsync(form)
      setIsEditing(false);
      /*
      if (titulo === "Criar novo pagamento") {
        await createPagamento.mutateAsync(form)
      }
      else {
        await updatePagamento.mutateAsync(form)
      }*/

      toast({
        title: 'Pagamento atualizado com sucesso',
        description: `Pagamento atualizado com sucesso`

      });
      setIsCreateDialogOpen(false);

    } catch (error) {

      if (axios.isAxiosError(error)) {
        // Check if there's a response and data within the error
        if (error.response && error.response.data) {
          console.error('Error message from server:', error.response.data);
          toast({
            title: 'Erro ao atualizar os pagamentos',
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
          description: error instanceof Error ? error.message : 'Ocorreu um erro ao tentar atualizar o pagamento. Tente novamente.',
          variant: 'destructive'
        })
      }
    }
  }

  //default values
  const defaultValues = React.useMemo(
    () => ({
      id: 0,
      locacaoId: boleto?.locacaoId,
      dataEmissao: moment.utc(boleto?.dataEmissao).format("YYYY-MM-DD"),
      dataPagamento: moment.utc(boleto?.dataPagamento).format("YYYY-MM-DD"),
      vencimentoPagamento: moment.utc(boleto?.dataVencimento).format("YYYY-MM-DD"),
      valorOriginal: boleto?.valorOriginal || 0,
      valorPago: boleto?.valorPago || 0,
      locatarioId: boleto?.locatario?.id || 0,
      status: boleto?.status || BoletoStatus.PENDENTE,
      documentos: documentFiles?.filter((doc) => doc !== null),
    }),
    [boleto, documentFiles]
  )

  React.useEffect(() => {
    glb_params.updTitle_form('Boletos');
    if (localStorage) boletoMethods.reset(defaultValues)
  }, [boleto, documentFiles])

  //react hook form

  const boletoMethods = useForm<BoletoSchema>({
    resolver: zodResolver(boletoSchema),
    defaultValues,
    mode: 'onBlur'
  })

  React.useEffect(() => {
    if (boleto) {
      boletoMethods.reset(defaultValues) // seta os valores do formulário com os dados do proprietário
    }
  }, [id, boleto])

  const handleDeletePagamento = (idBoleto: number) => {
    deleteBoleto.mutate(idBoleto);
  }

  return (
    <div className="scale mx-auto flex max-w-screen-xl transform flex-col items-center px-4 transition-transform">
      <div className="mx-auto w-full rounded-md">
        <Card className='font-[Poppins-regular]'>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className='grid grid-cols-1 font-bold'>
                <div className='flex flex-direction-row'>
                  <Label className="font-bold">Locatário : &nbsp;</Label>
                  <Label className="font-normal">{(boleto?.locatario ? boleto?.locatario.pessoa?.nome : '')}</Label>
                </div>
                <div className='flex flex-direction-row'>
                  <Label className="font-bold mt-2">Imóvel : &nbsp;</Label>
                  <Label className="font-normal mt-2">{getEnderecoFormatado(boleto?.locacao?.imovel?.endereco)}</Label>
                </div>


              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(boleto?.lanctoCondominio && boleto.lanctoCondominio.length > 0) ? (
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
                    {boleto.lanctoCondominio?.map((lancamento) => (
                      <>
                        <Label className={!isMobile ? 'flex items-center mb-1' : 'flex items-center col-span-2 mb-1'} style={{ 'fontSize': '0.7rem' }}>{lancamento.lancamentotipo.name}</Label>
                        {!isMobile ? (<Label className='flex items-center' style={{ 'fontSize': '0.7rem' }}>{moment.utc(lancamento.dataLancamento).format("DD/MM/YYYY")}</Label>) : (<></>)}
                        <Label className='flex items-center' style={{ 'fontSize': '0.7rem' }}>{moment.utc(lancamento.vencimentoLancamento).format("DD/MM/YYYY")}</Label>
                        <Label className='flex justify-end items-center' style={{ 'fontSize': '0.7rem' }}>{usdFormatter.format(lancamento.valorLancamento)}</Label>
                        <div className='flex justify-center'>
                          {lancamento.status === LancamentoStatus.ABERTO && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  //handleEditPagamento(lancamento);
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
                                    <AlertDialogAction onClick={() => { handleDeletePagamento(lancamento.id) }}>
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
                  <div className='grid grid-cols-5 m-2' >
                    <Label className={!isMobile ? 'flex items-center mb-1' : 'flex items-center col-span-2 mb-1'} style={{ 'fontSize': '0.7rem' }}>Aluguel</Label>
                    {!isMobile ? (<Label className='flex items-center' style={{ 'fontSize': '0.7rem' }}></Label>) : (<></>)}
                    <Label className='flex items-center' style={{ 'fontSize': '0.7rem' }}></Label>
                    <Label className='flex justify-end items-center' style={{ 'fontSize': '0.7rem' }}>{usdFormatter.format(boleto.locacao ? boleto.locacao?.valorAluguel : 0)}</Label>
                  </div>
                </div>

                <div className='grid grid-cols-5 m-2' >
                  <Label className={!isMobile ? 'flex items-center mb-1 font-bold' : 'flex items-center col-span-2 mb-1 font-bold'} style={{ 'fontSize': '0.7rem' }}>Valor do Pagamento</Label>
                  {!isMobile ? (<Label className='flex items-center' style={{ 'fontSize': '0.7rem' }}></Label>) : (<></>)}
                  <Label className='flex items-center font-bold' style={{ 'fontSize': '0.7rem' }}>{moment.utc(boleto.dataVencimento).format('DD/MM/YYYY')}</Label>
                  <Label className='flex justify-end items-center font-bold' style={{ 'fontSize': '0.7rem' }}>{usdFormatter.format(boleto.valorOriginal)}</Label>
                </div>

              </div>

            ) : (
              <p className="text-center text-muted-foreground">
                Nenhum lançamento para esse pagamento nesse período.
              </p>
            )}
          </CardContent>
          <CardFooter>
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={(value) => {
                setIsCreateDialogOpen(value)
                if (!value) {
                  setTitulo("Detalhes pagamento");
                  boletoMethods.reset(defaultValues);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button size={'sm'}>
                  <CircleCheck className="mr-2 h-4 w-4" /> Pagamento
                </Button>
              </DialogTrigger>
              <DialogContent className=' font-[Poppins-regular]'>
                <DialogHeader>
                  <DialogTitle>{titulo}</DialogTitle>
                  <DialogDescription>{titulo.includes('novo') ? 'Preencha os dados do novo lançamento abaixo.' : ''}</DialogDescription>
                </DialogHeader>
                <FormProvider {...boletoMethods}>
                  <DocumentUpload disabled={disabled} downloadDocuments={disabled} />
                </FormProvider>
                <form onSubmit={boletoMethods.handleSubmit(onSubmitBoletoData)}>
                  <div className={(isPortrait ? "grid grid-cols-2 gap-4 mt-2" : "grid grid-cols-1 gap-4 mt-2")}>
                    <Label className="text-base">
                      Data Vencimento
                      <Input
                        className="mt-2"
                        type="date"
                        disabled={disabled}
                        placeholder="Data Vencimento"
                        {...boletoMethods.register('dataVencimento')}
                      />
                      {boletoMethods.formState?.errors?.dataVencimento?.message && <p style={{ color: '#ed535d', fontSize: '0.8rem' }}>* {boletoMethods.formState?.errors?.dataVencimento?.message}</p>}
                    </Label>
                    <Label className="text-base">
                      Data do Pagamento
                      <Input
                        type='date'
                        className="mt-2"
                        disabled={true}
                        placeholder="Data do pagamento"
                        {...boletoMethods.register('dataPagamento')}
                      />
                      {boletoMethods.formState?.errors?.dataPagamento?.message && <p style={{ color: 'red', fontSize: '0.8rem' }}>*{boletoMethods.formState?.errors?.dataPagamento?.message}</p>}
                    </Label>
                  </div>

                  <div className={(isPortrait ? "grid grid-cols-2 gap-4 mt-3" : "grid grid-cols-1 gap-4 mt-3")}>
                    <Label className="text-base">
                      Valor do Lançamento
                      <Input
                        type="number"
                        step={'any'}
                        className="mt-1"
                        disabled={true}
                        placeholder="Valor do boleto"
                        {...boletoMethods.register('valorOriginal')}
                      />
                      {boletoMethods.formState?.errors?.valorOriginal?.message && <p style={{ color: '#f26871', fontSize: '0.8rem' }}>* {boletoMethods.formState?.errors?.valorOriginal?.message}</p>}
                    </Label>
                  </div>

                  <div className='mt-2 mr-5'>
                    <Label className='text-base font-[Poppins-Regular]'>
                      Situação do Pagamento
                      <div className='mt-2 border rounded-md pr-4'>
                        <Controller
                          name="status"
                          control={boletoMethods.control}
                          disabled={disabled}
                          render={({ field }) => (
                            <Select
                              disabled={true}
                              onValueChange={(value) => field.onChange(value)}
                              value={String(field.value)}
                            >
                              <SelectTrigger className='h-4'>
                                <SelectValue placeholder="" />
                              </SelectTrigger>
                              <SelectContent>
                                {STATUS_BOLETO_OPTIONS.map((status) => (
                                  <SelectItem key={status.label} value={status.value}>
                                    {status.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {boletoMethods.formState.errors.status?.message &&
                          (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                            {boletoMethods.formState.errors.status.message}
                          </p>)}
                      </div>
                    </Label>
                  </div>

                  <DialogFooter className='mt-2'>
                    <Button size={"sm"} type='submit'>Confirmar Pagamento</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}