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
import { Label } from '@/components/ui/label'
import moment from "moment";
import { toast } from '@/hooks/use-toast'
import api from '@/services/axios/api'
import { queryClient } from '@/services/react-query/query-client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Pencil, Trash2 } from 'lucide-react'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { BoletoStatus } from '@/enums/locacao/enums-locacao'
import { useGlobalParams } from '@/globals/GlobalParams';
import { useMediaQuery } from 'react-responsive';
import { useParams } from 'react-router-dom'
import { usdFormatter } from '@/utils/format-money'
import { Acordo } from '@/interfaces/acordo';
import { acordoSchema, AcordoSchema } from '@/schemas/acordo.schema';
import { DocumentUpload } from '../../imoveis/criarImovel/components/document-upload';

const fetchDocumentFiles = async (documents: Acordo['documentos']) => {
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


export const DetalhesAcordo = () => {
  const isMobile = useMediaQuery({ query: '(max-width: 420px)' })

  const dataParams = useParams<{ id: string }>();
  const id = dataParams.id ? parseInt(dataParams.id) : undefined;

  //Globals
  const glb_params = useGlobalParams();
  //const navigate = useNavigate();

  const { data: acordo } = useQuery({
    queryKey: ['acordo', id],
    queryFn: async () => {
      const { data } = await api.get<Acordo>(`/acordos/findbyid/${id}`)
      return data
    },
    enabled: !!id
  })


  console.log('acordo detalhes:', acordo);


  const { data: documentFilesData = [], isSuccess: isSuccessDocuments } = useQuery({
    queryKey: ['documentFiles', id, acordo?.documentos],
    queryFn: () => fetchDocumentFiles(acordo?.documentos),
    enabled: !!acordo?.documentos?.length
  })

  const documentFiles = React.useMemo(() => documentFilesData, [isSuccessDocuments])

  const deleteAcordo = useMutation({
    mutationFn: async (acordoId: number) => {
      return await api.delete(`/acordos/${acordoId}`)
    },
    onSuccess: () => {
      ['acordo','documentFiles', id].forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] })
      })

      toast({
        title: 'Acordo excluído com sucesso',
        description: `Acordo excluído com sucesso`
      })
    }
  })

  /*const onSubmitBoletoData = async (data: BoletoSchema) => {
    try {
      
      const form = new FormData()

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

      if (data?.observacao) {
        form.append('observacao', data.observacao)
      }

      if (data?.linhaDigitavel) {
        form.append('linhaDigitavel', data.linhaDigitavel)
      }


      form.append('status', BoletoStatus.PAGO);
      if (data?.dataPagamento) {
        if (data.dataPagamento !== '' && moment(data.dataPagamento).isValid()) {
          boletoMethods.clearErrors('dataPagamento');
          form.append('dataPagamento', moment(data.dataPagamento).format("YYYY-MM-DD"));
        }
        else {
          boletoMethods.setError('dataPagamento', {
            type: 'manual',
            message: 'Data de pagamento é obrigatória'
          });
          return;
        }
      }
      else {
        boletoMethods.setError('dataPagamento', {
          type: 'manual',
          message: 'Data de pagamento é obrigatória'
        });
        return;
      }

      if (data?.locatarioId) {
        form.append('locatarioId', data.locatarioId.toString())
      }

      if (data?.locacaoId) {
        form.append('locacaoId', data.locacaoId.toString())
      }

      form.append('id', data.id ? data.id.toString() : '')
      form.append('empresaId', data.empresaId ? data.empresaId.toString() : '')

      const newDocuments = data?.documentos?.filter((doc: any) => !doc.id)
      newDocuments?.forEach((doc: any) => {
        form.append('documentos', doc.file)
      })

      if (data?.documentosToDeleteIds?.length) {
        data.documentosToDeleteIds.forEach((docId: any) => {
          form.append('documentosToDeleteIds[]', docId.toString())
        })
      }

      await updateBoleto.mutateAsync(form)
      setIsEditing(false);
      
      //if (titulo === "Criar novo pagamento") {
      //  await createPagamento.mutateAsync(form)
      //}
      //else {
      //  await updatePagamento.mutateAsync(form)
      }

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
  }*/

  //default values
  const defaultValues = React.useMemo(
    () => ({
      id: 0,
      locacaoId: acordo?.locacaoId,
      imovelId: acordo?.imovelId,
      pessoaId: acordo?.imovelId,
      dataEmissao: moment.utc(acordo?.dataEmissao).format("YYYY-MM-DD"),
      dataVencimento: moment.utc(acordo?.dataVencimento).format("YYYY-MM-DD"),
      valorOriginal: acordo?.valorOriginal || 0,
      juros: acordo?.juros || 0,
      multa: acordo?.juros || 0,
      desconto: acordo?.juros || 0,
      status: acordo?.status || BoletoStatus.PENDENTE,
      documentos: documentFiles?.filter((doc) => doc !== null),
      empresaId: acordo?.empresaId
    }),
    [acordo, documentFiles]
  );


  React.useEffect(() => {
    glb_params.updTitle_form('Acordos');
    if (glb_params.pastaOrig === '') {
      glb_params.updPastaOrig('acordo-info');
    }

    if (localStorage) acordoMethods.reset(defaultValues)
  }, [acordo])

  //react hook form

  const acordoMethods = useForm<AcordoSchema>({
    resolver: zodResolver(acordoSchema),
    defaultValues,
    mode: 'onBlur'
  })

  console.log('defaultValues:', acordoMethods.getValues());

  React.useEffect(() => {
    if (acordo) {
      acordoMethods.reset(defaultValues) // seta os valores do formulário com os dados do proprietário
    }
  }, [id, acordo, documentFiles])

  const handleDeleteAcordo = (idAcordo: number) => {
    deleteAcordo.mutate(idAcordo);
  }

  
  console.log(acordoMethods.formState.errors);

  return (
    <div className="scale mx-auto flex max-w-screen-xl transform flex-col items-center px-4 transition-transform">
      <div className="mx-auto w-full rounded-md">
        <Card className='font-[Poppins-regular]' style={{color:"#034869"}}>
          <CardHeader>
            {/*<CircleArrowLeft
              className='mb-5 hover:cursor-pointer hover:text-gray-500'
              onClick={handlerBackNav}
            ></CircleArrowLeft>*/}
            <CardTitle className="flex items-center justify-between">
              <div className='font-bold w-full'>
                <div className='flex flex-direction-row'>
                  <Label className="font-bold">Acordo : &nbsp;</Label>
                  <Label className="font-normal">{acordo?.id}</Label>
                </div>                
                
                {(acordo?.locacao !== null ? (
                  <div className='flex flex-direction-row'>
                    <Label className="font-bold mt-2">Locatário : &nbsp;</Label>
                    <Label className="font-normal mt-2">
                      {acordo?.locacao?.locatarios ? acordo?.locacao.locatarios[0].pessoa?.nome + ' - ' : ''}
                      {acordo?.locacao?.imovel?.endereco.complemento}
                      {acordo?.locacao?.imovel?.condominio ? ' - ' + acordo?.locacao.imovel.condominio.name : ''}
                    </Label>
                  </div>
                ) : (
                  <div className='flex flex-direction-row'>
                    <Label className="font-bold mt-2">Proprietário : &nbsp;</Label>
                    <Label className="font-normal mt-2">
                      {acordo?.imovel && acordo.imovel.proprietarios && acordo.imovel.proprietarios.length > 0 ? acordo.imovel.proprietarios[0]?.pessoa?.nome : ''}
                      {acordo?.imovel?.endereco.complemento ? ' - ' + acordo?.imovel?.endereco.complemento : ''}
                      {acordo?.imovel?.condominio && acordo?.imovel.condominio.name ? ' - ' + acordo?.imovel.condominio.name : ''}
                    </Label>
                  </div>
                ))}


                <div className='grid grid-cols-3'>
                  <div className='flex flex-direction-row'>
                    <Label className="font-bold mt-2">Emissão : &nbsp;</Label>
                    <Label className="font-normal mt-2">{moment.utc(acordo?.dataEmissao).format("DD/MM/YYYY")}</Label>
                  </div>
                  <div className='flex flex-direction-row'>
                    <Label className="font-bold mt-2">Vencimento : &nbsp;</Label>
                    <Label className="font-normal mt-2">{moment.utc(acordo?.dataVencimento).format("DD/MM/YYYY")}</Label>
                  </div>
                </div>

                <div className='grid grid-cols-3'>
                  <div className='flex flex-direction-row'>
                    <Label className="font-bold mt-2">Valor Original : &nbsp;</Label>
                    <Label className="font-normal mt-2">{acordo?.valorOriginal ? acordo.valorOriginal.toLocaleString('pt-BR') : 'R$ 0.00'}</Label>
                  </div>
                  <div className='flex flex-direction-row'>
                    <Label className="font-bold mt-2">Juros : &nbsp;</Label>
                    <Label className="font-normal mt-2">{acordo?.juros ? acordo.juros.toLocaleString('pt-BR') : 'R$ 0.00'}</Label>
                  </div>
                  <div className='flex flex-direction-row'>
                    <Label className="font-bold mt-2">Multa : &nbsp;</Label>
                    <Label className="font-normal mt-2">{acordo?.multa ? acordo.multa.toLocaleString('pt-BR') : 'R$ 0.00'}</Label>
                  </div>
                  <div className='flex flex-direction-row'>
                    <Label className="font-bold mt-2">Desconto : &nbsp;</Label>
                    <Label className="font-normal mt-2">{acordo?.desconto ? acordo.desconto.toLocaleString('pt-BR') : 'R$ 0.00'}</Label>
                  </div>
                  <div className='flex flex-direction-row'>
                    <Label className="font-bold mt-2">Valor Líquido : &nbsp;</Label>
                    <Label className="font-normal mt-2">{acordo?.valorLiquido ? acordo.valorLiquido.toLocaleString('pt-BR') : 'R$ 0.00'}</Label>
                  </div>
                </div>

                <div className='grid grid-cols-1'>
                  <div className='flex flex-direction-row'>
                    <Label className="font-bold mt-2">Observação : &nbsp;</Label>
                    <Label className="font-normal mt-2">{acordo?.observacao}</Label>
                  </div>
                </div>

              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(acordo?.lancamentos !== null ?
              (acordo?.lancamentos && acordo?.lancamentos.length > 0) ? (
                <div className=''>

                  <Label className='ml-2' style={{ 'fontSize': '1rem' }}> Lançamentos </Label>
                  <div className='rounded-md border'>
                    <div className='grid grid-cols-5 m-2 font-[Poppins-bold]' >
                      <Label className={!isMobile ? 'border-b pb-5' : 'border-b pb-5 col-span-2'} style={{ 'fontSize': '0.7rem' }}>Descrição</Label>
                      {!isMobile ? (<Label className='border-b pb-5' style={{ 'fontSize': '0.7rem' }}>Emissão</Label>) : (<></>)}                      
                      <Label className='flex justify-end border-b pb-5' style={{ 'fontSize': '0.7rem' }}>Valor Original</Label>
                      <Label className='flex justify-end border-b pb-5' style={{ 'fontSize': '0.7rem' }}>Juros</Label>
                      <Label className='flex justify-end border-b pb-5' style={{ 'fontSize': '0.7rem' }}>Multa</Label>
                      <Label className='flex justify-end border-b pb-5' style={{ 'fontSize': '0.7rem' }}>Desconto</Label>
                      <Label className='flex justify-end border-b pb-5' style={{ 'fontSize': '0.7rem' }}>Valor Líquido</Label>
                      <Label className='border-b pb-5' style={{ 'fontSize': '0.7rem' }}></Label>
                    </div>

                    <div className='grid grid-cols-5 m-2' >
                      {acordo?.lancamentos?.map((lancamento) => (
                        <>
                          <Label className={!isMobile ? 'flex items-center mb-1' : 'flex items-center col-span-2 mb-1'} style={{ 'fontSize': '0.7rem' }}>{lancamento.descricao}</Label>
                          {!isMobile ? (<Label className='flex items-center' style={{ 'fontSize': '0.7rem' }}>{moment.utc(lancamento.dataLancamento).format("DD/MM/YYYY")}</Label>) : (<></>)}
                          <Label className='flex justify-end items-center' style={{ 'fontSize': '0.7rem' }}>{lancamento.valorOriginal.toLocaleString('pt-BR')}</Label>
                          <Label className='flex justify-end items-center' style={{ 'fontSize': '0.7rem' }}>{lancamento.juros.toLocaleString('pt-BR')}</Label>
                          <Label className='flex justify-end items-center' style={{ 'fontSize': '0.7rem' }}>{lancamento.multa.toLocaleString('pt-BR')}</Label>
                          <Label className='flex justify-end items-center' style={{ 'fontSize': '0.7rem' }}>{lancamento.desconto.toLocaleString('pt-BR')}</Label>
                          <Label className='flex justify-end items-center' style={{ 'fontSize': '0.7rem' }}>{(lancamento.valorOriginal + lancamento.juros + lancamento.multa - lancamento.desconto).toLocaleString('pt-BR')}</Label>
                          <div className='flex justify-center'>
                            {acordo.status === BoletoStatus.PENDENTE && (
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
                                        Isso excluir o lançamento do acordo
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => { handleDeleteAcordo(lancamento.id) }}>
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
                      <Label className='flex justify-end items-center' style={{ 'fontSize': '0.7rem' }}>{usdFormatter.format(acordo?.locacao ? acordo?.locacao?.valorAluguel : 0)}</Label>
                    </div>
                  </div>

                  <div className='grid grid-cols-5 m-2' >
                    <Label className={!isMobile ? 'flex items-center mb-1 font-bold' : 'flex items-center col-span-2 mb-1 font-bold'} style={{ 'fontSize': '0.7rem' }}>Valor do Pagamento</Label>
                    {!isMobile ? (<Label className='flex items-center' style={{ 'fontSize': '0.7rem' }}></Label>) : (<></>)}
                    <Label className='flex items-center font-bold' style={{ 'fontSize': '0.7rem' }}>{moment.utc(acordo?.dataVencimento).format('DD/MM/YYYY')}</Label>
                    <Label className='flex justify-end items-center font-bold' style={{ 'fontSize': '0.7rem' }}>{usdFormatter.format(acordo?.valorOriginal)}</Label>
                  </div>
                </div>

              ) : (
                <p className="text-center text-muted-foreground">
                  Nenhum lançamento para esse acordo nesse período.
                </p>
              )
              : (
                <p className="text-center text-muted-foreground">
                  Nenhum lançamento para esse acordo.
                </p>
              ))
            }
          </CardContent>
          <CardFooter>
            {/*boleto?.status !== BoletoStatus.PAGO && (
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
                          disabled={true}
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
                          disabled={disabled}
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

                    <div className={(isPortrait ? "grid grid-cols-2 gap-4 mt-3" : "grid grid-cols-1 gap-4 mt-3")}>
                      <Label className="text-base">
                        Valor Pago
                        <Input
                          type="number"
                          step={'any'}
                          className="mt-1"
                          disabled={disabled}
                          placeholder="Valor pago"
                          {...boletoMethods.register('valorPago')}
                        />
                        {boletoMethods.formState?.errors?.valorPago?.message && <p style={{ color: '#f26871', fontSize: '0.8rem' }}>* {boletoMethods.formState?.errors?.valorPago?.message}</p>}
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
                                disabled={disabled}
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
            )*/}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}