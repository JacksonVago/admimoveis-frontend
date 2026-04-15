import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination'
import { ROUTE } from '@/enums/routes.enum'
import api from '@/services/axios/api'
import { queryOptions, useMutation, useQuery } from '@tanstack/react-query'
import { IdCard, List, Plus, Receipt, Search, Trash, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BasePaginationData } from '../imoveis/listarImoveis'
import { useMediaQuery } from 'react-responsive'
import { useGlobalParams } from '@/globals/GlobalParams'
import { generatePaginationLinks } from '@/components/ui/generate-pages'
import { Label } from '@/components/ui/label'
import moment from 'moment'
import { toast } from '@/hooks/use-toast'
import { queryClient } from '@/services/react-query/query-client'
import { Boleto } from '@/interfaces/boleto'
import { cn } from '@/lib/utils'
import { BoletoStatus } from '@/enums/locacao/enums-locacao'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { STATUS_BOLETO_OPTIONS } from '@/constants/status-boletos'
import { useAuth } from '@/hooks/auth/use-auth'
import { Loader } from '@/components/ui/loader'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { boletoSchema, BoletoSchema } from '@/schemas/boleto.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, FormProvider, useFieldArray, useForm } from 'react-hook-form'
import { DocumentUpload } from '../imoveis/criarImovel/components/document-upload'
import { Textarea } from '@/components/ui/textarea'
import ListarLocacoes from '../locacoes'
import { Locacao } from '@/interfaces/locacao'
import axios from 'axios'

const createBoleto = async (data: FormData): Promise<Boleto | any> => {

  const dataObject = Object.fromEntries(data.entries());
  const jsonData = JSON.stringify(dataObject);
  console.log(jsonData);

  return await api.post<Boleto>('/pagamentos', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// Types
interface GetBoletosParams {
  search?: string
  page?: number
  limit?: number
  status?: string,
  exclude?: string
  dataInicial?: string
  dataFinal?: string
}

// API & Query Logic
export const getBoletos = async (empresaId: number, { page, limit, search, status, exclude, dataInicial, dataFinal }: GetBoletosParams) => {
  return await api.get<BasePaginationData<Boleto>>('pagamentos/' + empresaId.toString(), {
    params: {
      page,
      limit,
      status,
      search,
      exclude,
      dataInicial,
      dataFinal
    }
  })
}

export const useGetBoletosQueryOptions = (empresaId: number, {
  search,
  page,
  limit,
  status,
  exclude,
  dataInicial,
  dataFinal,
  ...queryKeys
}: {
  search?: string
  page?: number
  limit?: number
  status?: string,
  exclude?: string
  dataInicial?: string
  dataFinal?: string
} = {}) => {
  return queryOptions({
    queryKey: ['boletos', empresaId, { search, page, limit, status, exclude, dataInicial, dataFinal }, queryKeys],
    queryFn: () => getBoletos(empresaId,{ search, page, limit, status, exclude, dataInicial, dataFinal })
  })
}

//Lista de boletos
export default function ListarBoletos({
  limitView,
  exclude,
  //onSelectBoleto
}: {
  limitView: number
  exclude: string
  //onSelectBoleto: ((pagamento: Boleto) => void) | undefined
}) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isBigScreen = useMediaQuery({ query: '(min-width: 1824px)' })
  const isPortrait = useMediaQuery({ query: '(min-width: 1224px)' })
  const isTablet = useMediaQuery({ query: '(min-width: 746px)' })
  const isMobile = useMediaQuery({ query: '(max-width: 420px)' })
  //const isRetina = useMediaQuery({ query: '(min-resolution: 2dppx)' })
  const [showcard, setShowCard] = useState((isMobile ? false : true));

  const navigate = useNavigate();

  //Globals
  const glb_params = useGlobalParams();

  const [selLocacao, setSelLocacao] = useState<boolean>(false);
  const [searchParams, setSearchTerm] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  //const limit = ((isPortrait || isTablet || isBigScreen) && limitView > 1 ? 3 : isMobile ? 1 : limitView > 0 ? limitView : limitView || Number(searchParams.get('limit')) || 3);
  const limit = ((isPortrait || isTablet || isBigScreen) && limitView > 1 ? 100 : isMobile ? 1 : limitView > 0 ? limitView : limitView || Number(searchParams.get('limit')) || 3);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const [dataInicial, setdataInicial] = useState(searchParams.get('dataInicial') || moment.utc(new Date()).format("YYYY-MM-DD"));
  const [dataFinal, setdataFinal] = useState(searchParams.get('dataFinal') || moment.utc(new Date()).format("YYYY-MM-DD"));
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  //const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const boletoMethods = useForm<BoletoSchema>({
    resolver: zodResolver(boletoSchema),
    defaultValues: {
      dataEmissao: new Date().toISOString(),
      dataVencimento: new Date().toISOString(),
      status: BoletoStatus.PENDENTE,
      valorOriginal: 0,
      valorPago: 0,
      locacaoId: 0,
      locatarioId: 0,
      empresaId: glb_params.id_empresa ? Number(glb_params.id_empresa) : 0,
    },
    mode: 'all'
  })

  const { data, isLoading } = useQuery(
    useGetBoletosQueryOptions(glb_params.id_empresa ? Number(glb_params.id_empresa) : 0,{
      page,
      limit,
      search,
      status,
      exclude,
      dataInicial,
      dataFinal
    })
  )

  const boletos = data?.data?.data || []
  const totalPages = data?.data?.totalPages

  console.log(boletos);

  const createBoletoMutation = useMutation({
    mutationFn: ({ data }: { data: FormData }) => createBoleto(data),
    onSuccess: ({ data: clienteData }) => {
      toast({ title: `Boleto ${clienteData.id} criada com sucesso.` });

      navigate(ROUTE.PAGAMENTOS);
      /*if (glb_params.origin_url === 'imoveis') {
        navigate(`${ROUTE.IMOVEIS}/${glb_params.id_orig}`);
      }
      else {
        navigate(ROUTE.LOCACOES);
      }*/

    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        // Check if there's a response and data within the error
        if (error.response && error.response.data) {
          console.error('Error message from server:', error.response.data);
          toast({
            title: 'Erro ao atualizar locacao',
            description: error.response.data.message,
          })

          // You can also set this error message to a state to display it in your UI
        } else {
          console.error('Axios error without response data:', error.message);
        }
      } else {
        console.error('Non-Axios error:', error);
      }
    }
  });

  const confirmarBoleto = useMutation({
    mutationFn: async (boleto: Boleto) => {
      return await api.put(`/pagamentos/statusPagamento/${boleto.id}`, boleto)
    },
    onSuccess: () => {
      ['boletos'].forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] })
      });

      toast({
        title: 'Emissão de Boleto',
        description: `Boleto gerado com sucesso`
      });
    }
  });

  const deleteBoleto = useMutation({
    mutationFn: async (boletoId: number) => {
      return await api.delete(`/pagamentos/${boletoId}`);
    },
    onSuccess: () => {
      ['boletos'].forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] })
      });

      toast({
        title: 'Exclusão de Boleto',
        description: `Boleto excluído com sucesso`
      });
    }
  });

  // const hasTotalPages = !!totalPages
  // const canGoToNextPage = hasTotalPages && page < totalPages
  // const canGoToPreviousPage = hasTotalPages && page > totalPages
  //always that we go to out of the total pages, we will go to the first page

  useEffect(() => {
    glb_params.updTitle_form('Boletos');
    if (totalPages && page > totalPages) {
      navigate({
        search: `?page=1&limit=${limit}&search=${search}&status=${(status !== null ? status : '')}`
      })
    }
  }, [totalPages, page, navigate, limit, search])

  useEffect(() => {
    if (isMobile) {
      setShowCard(true);
    }
  }, [isMobile])


  //Lista de locações
  const locacao = useFieldArray({
    control: boletoMethods.control,
    name: 'locacao'
  });

  // Event Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const search = e.target.value
    setSearchTerm({ search })
  }

  // const methods = useForm({})

  const handlePageChange = (newpage: number) => {
    // Check if the new page is within the total pages
    // const canGoNext = !!totalPages && newpage <= totalPages ||

    const canChangePage = !!totalPages && newpage > 0 && newpage <= totalPages

    if (!canChangePage) return
    navigate({
      search: `?page=${newpage}&limit=${limit}&search=${search}`
    })
  }

  const handleClickVerDetalhes = (id: number) => {
    glb_params.updData_inicial(dataInicial);
    glb_params.updData_final(dataFinal);
    navigate(`${ROUTE.PAGAMENTOS}/${id}`)
  }
  // UI Logic
  const hasSearchResults = Boolean(!isLoading && search && boletos?.length === 0)

  /*const googleMaps = "https://www.google.com/maps/place/";
  const handlerClickMaps = (endereco: Endereco | undefined) => {
    if (endereco) {
      const urlGoogleMaps = googleMaps + getEnderecoFormatMaps(endereco);
      window.open(urlGoogleMaps);
    }
  }*/

  const usdFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  const handleConfirmarBoleto = async (boleto: Boleto) => {
    try {
      boleto.status = BoletoStatus.CONFIRMADO;
      confirmarBoleto.mutateAsync(boleto);
    } catch (error) {
      toast({ title: 'Erro ao gerar boletos.', variant: 'destructive' });
    }
  }

  const handleExcluirBoleto = async (boletoId: number) => {
    try {
      deleteBoleto.mutateAsync(boletoId);
    } catch (error) {
      toast({ title: 'Erro ao excluir boleto.', variant: 'destructive' });
    }
  }
  const handlerChangeTipo = (tipo: string) => {
    navigate({
      search: `?page=1&limit=${limit}&search=${search}&status=${tipo}`
    })
  }

  //Validação dos dados do boleto
  function handleSubmitBoleto(data: BoletoSchema) {

    const formData = new FormData();

    console.log('data', data);
    if (locacao.fields.length === 0) {
      boletoMethods.setValue('locacaoId', 0);
      return false;
    }
    else {
      boletoMethods.setValue('locacaoId', locacao.fields[0].id);
      boletoMethods.setValue('locatarioId', locacao.fields[0].locatarioId);
    }

    formData.append('locacaoId', data.locacaoId.toString());
    formData.append('locatarioId', data.locatarioId.toString());
    formData.append('status', data.status);
    formData.append('dataEmissao', moment(data.dataEmissao).format('YYYY-MM-DD'));
    formData.append('dataVencimento', moment(data.dataVencimento).format('YYYY-MM-DD'));
    formData.append('dataPagamento', (data.dataPagamento ? moment(data.dataPagamento).format('YYYY-MM-DD') : ""));
    formData.append('valorOriginal', (data.valorOriginal ? data.valorOriginal.toString() : "0"));
    formData.append('valorPago', (data.valorPago ? data.valorPago.toString() : "0"));
    formData.append('observacao', data.observacao ? data.observacao : "");
    if (data.empresaId) {
      formData.append('empresaId', data.empresaId.toString())
    }

    const newDocuments = data?.documentos?.filter((doc) => !doc.id)
    newDocuments?.forEach((doc) => {
      formData.append('documentos', doc.file)
    })

    if (data?.documentosToDeleteIds?.length) {
      data.documentosToDeleteIds.forEach((docId) => {
        formData.append('documentosToDeleteIds[]', docId.toString())
      })
    }

    createBoletoMutation.mutate({ data: formData });
  }

  //Retorno ao selecionar a locação
  const handleSelectedLocacao = (locacaoSel: Locacao | undefined) => {


    if (locacaoSel) {
      if (locacao.fields.length === 0) {
        locacao.append({
          nome: locacaoSel.imovel ? (locacaoSel.locatarios ? locacaoSel.locatarios[0].pessoa?.nome : '') + ' - ' + locacaoSel.imovel.endereco.complemento + ' - ' + locacaoSel.imovel.condominio.name : "",
          id: locacaoSel.id,
          locatarioId: locacaoSel.locatarios ? locacaoSel.locatarios[0].id : 0
        });
      }
      boletoMethods.setValue('locacaoId', locacaoSel.id,
        {
          shouldDirty: true,
          shouldValidate: true
        }
      );
      boletoMethods.setValue('locatarioId', locacaoSel.locatarios ? locacaoSel.locatarios[0].id : 0,
        {
          shouldDirty: true,
          shouldValidate: true
        }
      );
      /*boletoMethods.setValue('valorAluguel', (imovel.valorAluguel ? imovel.valorAluguel : 0), {
        shouldDirty: true,
        shouldValidate: true
      }
      );*/
    }
    else {
      boletoMethods.setValue('locacaoId', 0,
        {
          shouldDirty: false,
          shouldValidate: false
        }
      );
      /*boletoMethods.setValue('valorAluguel', 0, {
        shouldDirty: false,
        shouldValidate: false
      }
      );*/
    }


    setSelLocacao(false);
  }

  const handlerNewBoleto = () => {
    console.log('novo boleto');
    boletoMethods.reset();
    if (locacao.fields.length > 0) {
      locacao.remove(0);
    }
    setIsCreateDialogOpen(!isCreateDialogOpen);

  }
  return (
    <div className="container mx-auto space-y-6 p-4 font-[Poppins-regular]">
      {/* Search & Filters */}
      {/* <div className="grid grid-cols-2 flex flex-col justify-end items-start gap-4 sm:flex-row sm:items-center"> */}
      <div className="flex flex-row items-start justify-end gap-2 sm:flex-row sm:items-center">
        {glb_params.origin_url.indexOf('lista') > -1 && (
          <h1 className="text-2xl font-bold">Pagamentos</h1>
        )}
        <div className='grid grid-cols-3'>
          {
            showcard ?
              (<List onClick={() => { setShowCard(!showcard) }} color='black' className='hover:cursor-pointer hover:bg-gray-300' />) :
              (<IdCard onClick={() => { setShowCard(!showcard) }} color='black' className='hover:cursor-pointer hover:bg-gray-300' />)
          }
        </div>
        {(isAdmin ||
          user?.permissions.includes("ALL") ||
          user?.permissions.includes("CREATE_PAGAMENTO")
        ) && (
            <Button size={"sm"} className='hover:cursor-pointer hover:bg-gray-600'
             onClick={() => { handlerNewBoleto(); }}>
              <Plus className="mr-2 h-4 w-4" /> Criar Boleto
            </Button>
          )}
        <Dialog
          open={isCreateDialogOpen}
          onOpenChange={(value) => {
            setIsCreateDialogOpen(value)
          }}
        >
          <DialogContent>
            <DialogHeader className='font-[Poppins-Regular]'>
              <DialogTitle>Criar novo Boleto</DialogTitle>
              <DialogDescription>Preencha os dados do novo Boleto abaixo.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <FormProvider {...boletoMethods}>
                <DocumentUpload disabled={false} downloadDocuments={true} />
              </FormProvider>

              <form className="space-y-4 font-[Poppins-Regular]" onSubmit={boletoMethods.handleSubmit(handleSubmitBoleto)}>
                <div className="grid grid-cols-2 items-center gap-4">

                  {(!selLocacao) && (
                    <div className='col-span-2'>
                      {(locacao.fields.length > 0) ? (
                        <>
                          <Label className='text-base' >Locação</Label>
                          <div className="grid grid-cols-1 gap-4 flex items-center">
                            {locacao.fields.map((field, index) => (
                              <div className='flex justify-between items-center gap-2 mt-2 border-solid border-2 border-gray-250 rounded p-1'>
                                <Label >{field.nome}</Label>
                                <button
                                  className='border bg-zinc-200 hover:bg-zinc-400'
                                  type="button"
                                  onClick={() => {
                                    boletoMethods.setValue('locacaoId', 0, { shouldDirty: false, shouldValidate: false });
                                    locacao.remove(index);
                                  }}
                                >
                                  <X className='px-1'></X>
                                </button>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className={(isPortrait ? "grid grid-cols-2 gap-4 flex items-center" : "grid grid-cols-1 gap-4 flex items-center")}>
                          <Button type='button'
                            onClick={() => {
                              setSelLocacao(true);
                            }}
                          >Adicionar locação</Button>
                        </div>
                      )}
                      {!!boletoMethods?.formState?.errors?.locacaoId?.message && (
                        boletoMethods.formState?.errors?.locacaoId?.message && <p style={{ color: '#ed535d', fontSize: '0.8rem' }}>* {boletoMethods.formState?.errors?.locacaoId?.message}</p>
                      )}

                    </div>
                  )}

                  {/*Seleção de locacao */}
                  {selLocacao && (
                    <Card id='teste' className='h-full col-span-2'>
                      <div className="flex  justify-end">
                        <Button onClick={() => { handleSelectedLocacao(undefined) }}
                          className='w-4 h-8 -top-5 -right-5 relative rounded-full bg-transparent text-black bg-zinc-200 hover:bg-zinc-400'>X</Button>
                      </div>
                      <CardHeader>
                        <h1 className='flex items-center justify-center font-bold'>Selecionar Imóvel</h1>
                      </CardHeader>
                      <CardContent className='mt-2 h-120'>
                        <ListarLocacoes limitView={1} txtVinc='Selecionar' exclude='' onSelectLocacao={handleSelectedLocacao} />
                      </CardContent>
                    </Card>
                  )}

                  {!selLocacao && (
                    <>
                      <div>
                        <Label htmlFor="cotaImovel">Data de Emissão</Label>
                        <Input id="dataEmissao" type="date" placeholder="0.00"
                          {...boletoMethods.register('dataEmissao')}
                        />
                        {boletoMethods.formState?.errors?.dataEmissao?.message && <p style={{ color: '#ed535d', fontSize: '0.8rem' }}>* {boletoMethods.formState?.errors?.dataEmissao?.message}</p>}
                      </div>

                      <div>
                        <Label htmlFor="cotaImovel">Data de Vencimento</Label>
                        <Input id="dataVencimento" type="date" placeholder="0.00"
                          {...boletoMethods.register('dataVencimento')}
                        />
                        {boletoMethods.formState?.errors?.dataVencimento?.message && <p style={{ color: '#ed535d', fontSize: '0.8rem' }}>* {boletoMethods.formState?.errors?.dataEmissao?.message}</p>}
                      </div>

                      <div>
                        <Label htmlFor="cotaImovel">Valor</Label>
                        <Input id="valorOriginal" type="number" step="0.01" placeholder="0.00"
                          {...boletoMethods.register('valorOriginal')}
                        />
                        {boletoMethods.formState?.errors?.valorOriginal?.message && <p style={{ color: '#ed535d', fontSize: '0.8rem' }}>* {boletoMethods.formState?.errors?.valorOriginal?.message}</p>}
                      </div>

                      <div>
                        <Label htmlFor="cotaImovel">Valor Pago</Label>
                        <Input id="valorPago" type="number" step="0.01" placeholder="0.00"
                          {...boletoMethods.register('valorPago')}
                        />
                        {boletoMethods.formState?.errors?.valorPago?.message && <p style={{ color: '#ed535d', fontSize: '0.8rem' }}>* {boletoMethods.formState?.errors?.valorOriginal?.message}</p>}
                      </div>

                      <div>
                        <Label htmlFor="cotaImovel">Data de Pagamento</Label>
                        <Input id="dataPagamento" type="date" placeholder=""
                          {...boletoMethods.register('dataPagamento')}
                        />
                        {boletoMethods.formState?.errors?.dataPagamento?.message && <p style={{ color: '#ed535d', fontSize: '0.8rem' }}>* {boletoMethods.formState?.errors?.dataEmissao?.message}</p>}
                      </div>


                      <div className='mt-2 text-base'>
                        <Label className='text-base'>Situação do boleto</Label>
                        <div className='mt-2 mr-5'>
                          <Controller
                            name="status"
                            control={boletoMethods.control}

                            render={({ field }) => (
                              <Select
                                onValueChange={(value: BoletoStatus) => field.onChange(value)}
                                value={field.value}
                              >
                                <SelectTrigger className='h-4'>
                                  <SelectValue placeholder="Selecione a situação" />
                                </SelectTrigger>
                                <SelectContent>
                                  {STATUS_BOLETO_OPTIONS.map((status) => (
                                    <SelectItem className='text-base' key={status.label} value={status.value}>
                                      {status.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                          <span>{boletoMethods?.formState?.errors?.status?.message}</span>
                        </div>
                      </div>


                      <div className='mt-2 col-span-2'>
                        <Label htmlFor="observacoes">Observações</Label>
                        <Textarea id="observacoes" placeholder="Detalhes adicionais sobre po boleto"
                          {...boletoMethods.register('observacao')}
                        />
                        {boletoMethods.formState?.errors?.observacao?.message && <p style={{ color: '#ed535d', fontSize: '0.8rem' }}>* {boletoMethods.formState?.errors?.observacao?.message}</p>}
                      </div>
                    </>
                  )}
                </div>
                <DialogFooter>
                  <Button type='submit' className='hover:cursor-pointer hover:bg-gray-600'>Criar Boleto</Button>
                </DialogFooter>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className=
        {(isPortrait || isTablet || isBigScreen)
          ? "grid grid-cols-2 gap-4 sm:flex-row sm:items-center sm:justify-between border-b"
          : "grid grid-cols-1 gap-4 sm:flex-row sm:items-center sm:justify-between border-b"}
      >
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            onChange={handleSearchChange}
            value={search}
            placeholder="Buscar pagamentos"
            className="pl-8"
          />
        </div>
        <div className=
          {(isPortrait || isTablet || isBigScreen)
            ? "grid grid-cols-3 gap-4 mb-2"
            : "grid grid-cols-1 gap-4 mb-2"}>
          <h1 className='flex items-center'>Período</h1>
          <div className="flex justify-between gap-2">
            <Label className="text-base flex items-center">
              De</Label>
            <Input
              type='date'
              className="mt-2"
              placeholder="Data de vencimento"
              value={dataInicial}
              onChange={(e) => setdataInicial(e.target.value)}
            />
          </div>
          <div className="flex justify-between gap-2">
            <Label className="text-base flex items-center">
              Até
            </Label>
            <Input
              type='date'
              className="mt-2"
              placeholder="Data de vencimento"
              value={dataFinal}
              onChange={(e) => setdataFinal(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Select onValueChange={(value) => { handlerChangeTipo(value) }}>
            <SelectTrigger className="h-4 w-[160px]">
              <SelectValue placeholder="Situação" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_BOLETO_OPTIONS.map((value) => (
                <SelectItem key={value.label} value={value.value}>
                  {value.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* pagamentos Grid */}
      <div className={limit === 1 ? "grid gap-6 grid-cols-1" : "grid gap-6 sm:grid-cols-1 lg:grid-cols-3"}>
        {/* Search Results & No Results Message */}
        {hasSearchResults && (
          <p className="text-center text-muted-foreground">
            Nenhum pagamento encontrado para a busca atual.
          </p>
        )}

        {/*Card das locações/pagamentos */}
        {(boletos.length === 0 && !hasSearchResults) && (
          <div className="col-span-3 flex flex-col items-center justify-center w-full">
            <p className="text-center text-muted-foreground">
              Nenhum boleto disponível para este período.
            </p>
          </div>
        )}
        {isLoading ?
          (
            <div className="bg-transparent flex justify-center items-center col-span-full">
              <Loader />
            </div>
          ) :
          (showcard ?
            (
              <>
                {boletos.map((boleto) => (
                  <Card key={boleto.id} className="">
                    <CardHeader className="flex flex-row justify-between">

                      <CardTitle className="line-clamp-1" style={{ fontSize: '1rem' }}>
                        <p className="line-clamp-2 flex gap-1 text-sm text-muted-foreground">
                          {boleto.locatario ? boleto.locatario.pessoa?.nome : ''} -
                          {boleto.locacao?.imovel?.endereco.complemento} -
                          {boleto.locacao?.imovel?.condominio ? boleto.locacao.imovel.condominio.name : ''}
                        </p>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Label className="font-bold flex justify-start">
                        Boleto :  {boleto.id}
                      </Label>
                      <div className='grid grid-cols-2 gap-4 mt-2'>
                        <Label className="font-bold flex justify-start">
                          Emissão :  {moment.utc(boleto.dataEmissao).format("DD/MM/YYYY")}
                        </Label>
                        <Label className="font-bold flex justify-end">
                          Vencimento :  {moment.utc(boleto.dataVencimento).format("DD/MM/YYYY")}
                        </Label>
                      </div>
                      <div className='grid grid-cols-2 gap-4 mt-2'>
                        <Label className="font-bold flex justify-start">
                          Valor Original {usdFormatter.format(boleto.valorOriginal)}
                        </Label>
                        <Label className="font-bold flex justify-end">
                          Valor Pago {usdFormatter.format(boleto.valorPago)}
                        </Label>
                      </div>
                      <Label className="font-bold flex justify-start mt-2">
                        Situação :  {boleto.status}
                      </Label>
                      {(boleto.lanctoLocacao && boleto.lanctoLocacao?.length > 0) ? (
                        <>
                          <Label style={{ 'fontSize': '0.7rem' }}> Lançamentos </Label>
                          <div className='rounded-md border'>
                            <div className='grid grid-cols-5 m-2 font-[Poppins-bold]' >
                              <Label className='col-span-2' style={{ 'fontSize': '0.7rem' }}>Descrição</Label>
                              {!isMobile ? (
                                <Label style={{ 'fontSize': '0.7rem' }}>Emissão</Label>)
                                : (<></>)
                              }
                              <Label style={{ 'fontSize': '0.7rem' }}>Vencimento</Label>
                              <Label className={!isMobile ? 'flex justify-end' : 'flex justify-end col-span-2'} style={{ 'fontSize': '0.7rem' }}>Valor</Label>
                            </div>

                            <div className='grid grid-cols-5 m-2 gap-1' >
                              {boleto.lanctoLocacao?.map((lancamento) => (
                                <>
                                  <Label className={boleto.status === BoletoStatus.PENDENTE ? 'col-span-2 text-green-600' : 'col-span-2'} style={{ 'fontSize': '0.7rem' }}>{lancamento.lancamentotipo.name}</Label>
                                  {!isMobile ? (<Label className={boleto.status === BoletoStatus.PENDENTE ? 'text-green-600' : ''} style={{ 'fontSize': '0.7rem' }}>{moment.utc(lancamento.dataLancamento).format("DD/MM/YYYY")}</Label>)
                                    : (<></>)
                                  }
                                  <Label className={boleto.status === BoletoStatus.PENDENTE ? (!isMobile ? 'text-green-600' : 'text-green-600 col-span-2') : (!isMobile ? '' : 'col-span-2')} style={{ 'fontSize': '0.7rem' }}>{moment.utc(lancamento.vencimentoLancamento).format("DD/MM/YYYY")}</Label>
                                  <Label className={boleto.status === BoletoStatus.PENDENTE ? 'flex justify-end text-green-600' : 'flex justify-end'} style={{ 'fontSize': '0.7rem' }}>{usdFormatter.format(lancamento.valorLancamento)}</Label>
                                </>
                              ))}
                            </div>
                          </div>
                          <div className='grid grid-cols-2 font-[Poppins-bold] mt-5 '>
                            <Label className={boleto.status === BoletoStatus.PENDENTE ? 'flex justify-start text-green-600' : 'flex justify-start'} style={{ 'fontSize': '0.7rem' }}>Total </Label>
                            <Label className={boleto.status === BoletoStatus.PENDENTE ? 'flex justify-end text-green-600' : 'flex justify-end'} style={{ 'fontSize': '0.7rem' }}>
                              {usdFormatter.format((boleto.locacao ? boleto.locacao.valorAluguel : 0) +
                                boleto.lanctoLocacao.reduce((total, lancamento) => {
                                  return total + lancamento.valorLancamento;
                                }, 0))}
                            </Label>
                          </div>
                          <div className='flex justify-end'>
                            <Badge
                              variant="secondary"
                              className={cn('mt-2 text-xs', {
                                'bg-green-50 text-green-800': boleto.status === BoletoStatus.PENDENTE,
                                'bg-red-50 text-red-800': boleto.status === BoletoStatus.ATRASADO,
                                'bg-blue-50 text-blue-800': boleto.status === BoletoStatus.PAGO
                              })}
                            >
                              {boleto.status}
                            </Badge>
                          </div>

                        </>
                      )
                        : (<p className="text-center text-muted-foreground mt-5">
                          Não há lançamentos para esse boleto
                        </p>
                        )
                      }
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <div className=
                        {cn('grid gap-10', {
                          'grid-cols-3': boleto.status === BoletoStatus.PENDENTE,
                          'grid-cols-2': boleto.status === BoletoStatus.ATRASADO || boleto.status === BoletoStatus.PAGO,
                        })}
                      >
                        {(isAdmin ||
                          user?.permissions.includes("ALL") ||
                          user?.permissions.includes("UPDATE_PAGAMENTO")
                        ) && (

                            <Button variant="secondary"
                              className='hover:cursor-pointer hover:bg-gray-200'
                              onClick={() => handleClickVerDetalhes(boleto.id ? boleto.id : 0)}
                              size={"sm"}>
                              Detalhes
                            </Button>
                          )}
                        {((isAdmin ||
                          user?.permissions.includes("ALL") ||
                          user?.permissions.includes("DELETE_PAGAMENTO")
                        ) && (boleto.status === BoletoStatus.PENDENTE)) && (
                            <>
                              <Button variant="destructive"
                                onClick={() => handleExcluirBoleto(boleto.id)}
                                size={"sm"}>
                                <Trash className="h-4 w-4" />Excluir
                              </Button>
                              <Button variant="secondary"
                                onClick={() => handleConfirmarBoleto(boleto)}
                                size={"sm"}>
                                <Receipt className="h-4 w-4" />Emitir Boleto
                              </Button>
                            </>
                          )}
                      </div>
                    </CardFooter>
                  </Card>
                ))
                }
              </>
            ) :
            (
              <div className='col-span-3'>
                <table className="w-full table-fixed">
                  <thead className="sticky top-0">
                    <tr>
                      <th className="border-b p-2 text-left">Locação</th>
                      <th className="border-b p-2 text-left">Vencimento</th>
                      <th className="border-b p-2 text-left">Valor</th>
                      <th className="border-b p-2 text-left">Situacao</th>
                      <th className="border-b p-2 text-left"></th>
                    </tr>
                  </thead>
                </table>
                <div className='h-[400px] flex-1 overflow-y-auto'>
                  <table className='w-full table-fixed'>
                    <tbody>
                      {boletos?.map((boleto) => (
                        <tr key={boleto.id} className="hover:bg-gray-300">
                          <td className={boleto.status === BoletoStatus.ATRASADO ? "border-b p-2 text-red-600" : "border-b p-2"}>
                            {boleto.locatario ? boleto.locatario.pessoa?.nome : ''} -
                            {boleto.locacao?.imovel?.endereco.complemento} -
                            {boleto.locacao?.imovel?.condominio ? boleto.locacao.imovel.condominio.name : ''}
                          </td>
                          <td className={boleto.status === BoletoStatus.ATRASADO ? "border-b p-2 text-red-600" : "border-b p-2"}>
                            <div>
                              {moment.utc(boleto.dataVencimento).format("DD/MM/YYYY")}
                            </div>
                          </td>
                          <td className={boleto.status === BoletoStatus.ATRASADO ? "border-b p-2 text-red-600" : "border-b p-2"}>
                            {boleto.valorOriginal.toLocaleString('pt-BR')}
                          </td>
                          <td className={boleto.status === BoletoStatus.ATRASADO ? "border-b p-2 text-red-600" : "border-b p-2"}>
                            {boleto.status}
                          </td>
                          <td className="border-b p-2">
                            <div className="flex space-x-2 ">
                              <Button
                                size="sm"
                                onClick={() => handleClickVerDetalhes(boleto.id)}
                                className='hover:cursor-pointer hover:bg-gray-700'
                              >
                                Ver detalhes
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )

          )}
      </div>

      {/* Pagination */}
      <Pagination>
        <PaginationContent className={boletos.length > 0 ? "" : "hidden"}>
          {/* Previous & Next Buttons */}
          <PaginationItem>
            <PaginationPrevious onClick={() => handlePageChange(page - 1)} />
          </PaginationItem>
          {generatePaginationLinks(page, !totalPages ? 1 : totalPages, (limit === 1 ? 1 : isBigScreen ? 10 : isPortrait ? 10 : isTablet ? 5 : 2), handlePageChange)}
          <PaginationItem>
            <PaginationNext
              onClick={() => handlePageChange(page + 1)}
              aria-disabled={(page > (!totalPages ? 1 : totalPages - 1) ? "true" : "false")}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

    </div>
  )
}

