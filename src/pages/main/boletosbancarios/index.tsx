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
import { Download, IdCard, List, Mail, Plus, Receipt, Search, Trash, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BasePaginationData } from '../imoveis/listarImoveis'
import { useMediaQuery } from 'react-responsive'
import { useGlobalParams } from '@/globals/GlobalParams'
import { generatePaginationLinks } from '@/components/ui/generate-pages'
import { Label } from '@/components/ui/label'
import moment from 'moment'
import { toast } from '@/hooks/use-toast'
import { Boleto } from '@/interfaces/boleto'
import { cn } from '@/lib/utils'
import { BoletoStatus } from '@/enums/locacao/enums-locacao'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { STATUS_BOLETO_OPTIONS } from '@/constants/status-boletos'
import { useAuth } from '@/hooks/auth/use-auth'
import { Loader } from '@/components/ui/loader'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, FormProvider, useFieldArray, useForm } from 'react-hook-form'
import { DocumentUpload } from '../imoveis/criarImovel/components/document-upload'
import { Textarea } from '@/components/ui/textarea'
import ListarLocacoes from '../locacoes'
import axios from 'axios'
import { jobSchema, JobSchema } from '@/schemas/job.schema'
import { JobsStatus } from '@/enums/alertas/JobsStatus'
import { getAlertasPag } from '../alertas/requests'
import ListarImoveisLocacao from '../imoveis/listaimoveislocacao'
import { ContaCorrente } from '@/interfaces/contacorrente'
import { BoletosBancarioValidate } from '@/utils/boletos-bancario'
import { BoletoBancario } from '@/interfaces/boletobancario'

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
export const getBoletosBancario = async (empresaId: number, { page, limit, search, status, exclude, dataInicial, dataFinal }: GetBoletosParams) => {
  const result = await api.get<BasePaginationData<BoletoBancario>>('boleto-bancario/empresa/' + empresaId.toString(), {
    params: {
      page,
      limit,
      status,
      search,
      exclude,
      dataInicial,
      dataFinal
    }
  });
  console.log('result', result);
  return result;
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
    queryKey: ['boletosBancario', empresaId, { search, page, limit, status, exclude, dataInicial, dataFinal }, queryKeys],
    queryFn: () => getBoletosBancario(empresaId, { search, page, limit, status, exclude, dataInicial, dataFinal })
  })
}

//Lista de boletos
export default function ListarBoletosBancarios({
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
  const [selBoleto, setSelBoleto] = useState<Boleto>();

  const navigate = useNavigate();

  //Globals
  const glb_params = useGlobalParams();

  const [searchParams, setSearchTerm] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  //const limit = ((isPortrait || isTablet || isBigScreen) && limitView > 1 ? 3 : isMobile ? 1 : limitView > 0 ? limitView : limitView || Number(searchParams.get('limit')) || 3);
  const limit = ((isPortrait || isTablet || isBigScreen) && limitView > 1 ? 100 : isMobile ? 1 : limitView > 0 ? limitView : limitView || Number(searchParams.get('limit')) || 3);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const [dataInicial, setdataInicial] = useState(searchParams.get('dataInicial') || moment.utc(new Date()).format("YYYY-MM-DD"));
  const [dataFinal, setdataFinal] = useState(searchParams.get('dataFinal') || moment.utc(new Date()).format("YYYY-MM-DD"));
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)
  const [isBancoDialogOpen, setIsBancoDialogOpen] = useState(false)

  //Consulta alertas configurados
  const {
    data: alertas
  } = useQuery({
    queryKey: ['alertas'],
    queryFn: () => getAlertasPag(glb_params.id_empresa ? Number(glb_params.id_empresa) : 0, {}),
  });


  const { data, isLoading } = useQuery(
    useGetBoletosQueryOptions(glb_params.id_empresa ? Number(glb_params.id_empresa) : 0, {
      page,
      limit,
      search,
      status,
      exclude,
      dataInicial,
      dataFinal
    })
  )

  const boletosBancario = data?.data?.data || []
  const totalPages = data?.data?.totalPages

  console.log(boletosBancario);


  const jobMethods = useForm<JobSchema>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      empresaId: glb_params.id_empresa ? Number(glb_params.id_empresa) : 0,
      str_start_date: new Date().toISOString(),
      str_end_date: new Date().toISOString(),
      str_start_time: new Date().toISOString(),
      str_end_time: new Date().toISOString(),
      status: JobsStatus.WAITING_TO_START,
      userId: user?.id
    },
    mode: 'all'
  })

  // const hasTotalPages = !!totalPages
  // const canGoToNextPage = hasTotalPages && page < totalPages
  // const canGoToPreviousPage = hasTotalPages && page > totalPages
  //always that we go to out of the total pages, we will go to the first page

  useEffect(() => {
    glb_params.updTitle_form('Boletos Bancário');
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


  // Event Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const search = e.target.value
    setSearchTerm({ search })
  }

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
    navigate(`${ROUTE.BOLETO_BANCARIO}/${id}`)
  }

  const handleClickVerComprovante = (boleto: Boleto) => {
    if (boleto.documentos && boleto.documentos.length > 0) {
      const documento = boleto.documentos[0]; // Assuming you want to view the first document
      const url = import.meta.env.VITE_AZURE_BLOB_CONTAINER + documento.url;
      window.open(url, '_blank');
    } else {
      toast({ title: 'Nenhum comprovante disponível.', variant: 'destructive' });
    }
  }

  // UI Logic
  const hasSearchResults = Boolean(!isLoading && search && boletosBancario?.length === 0)

  const usdFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  const handlerEnviaEmail = (boleto: Boleto | undefined) => {
    setSelBoleto(boleto);
    if (boleto?.imovelId && boleto?.imovelId > 0) {
      if (boleto.imovel?.proprietarios) {
        jobMethods.setValue('str_email', boleto.imovel.proprietarios[0].pessoa ? boleto.imovel.proprietarios.map(loc => loc.pessoa ? loc.pessoa.email : "").join(";") : "");
      }
    }
    else {
      if (boleto?.locacaoId && boleto?.locacaoId > 0) {
        if (boleto.locacao?.locatarios) {
          jobMethods.setValue('str_email', boleto.locacao.locatarios[0].pessoa ? boleto.locacao.locatarios.map(loc => loc.pessoa ? loc.pessoa.email : "").join(";") : "");
        }
      }
    }
    setIsEmailDialogOpen(true);
  }

  const handleSubmitEmail = (data: JobSchema) => {
    const formData = new FormData();

    if (data.empresaId) {
      formData.append('empresaId', data.empresaId.toString())
    }
    if (data.alertaId) {
      formData.append('alertaId', data.alertaId.toString())
    }
    if (data.descAlerta) {
      formData.append('descAlerta', data.descAlerta);
    }

    if (data.str_message) {
      formData.append('str_message', data.str_message.toString());
    }

    //createBoletoMutation.mutate({ data: formData });

  }

  const handlerSendMail = async () => {
    try {
      const result = await api.post<string>('/emails/send-email/' + selBoleto?.empresaId,
        {
          email: jobMethods.getValues("str_email"),
          subject: jobMethods.getValues("descAlerta"),
          text: jobMethods.getValues("str_message")
        }, {
        //headers: { 'Content-Type': 'multipart/form-data' }
      });
      console.log(result);
      toast({ title: 'Email enviado com sucesso.' });
    }
    catch (error) {
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


  }

  const handlerDownloadBoleto = async (boletoBancarioId: number) => {

    /*if (selBoleto && selConta) {
      const banco = "Validar" + selConta.banco.codigo;
      const msg = BoletosBancarioValidate[banco as keyof typeof BoletosBancarioValidate](selConta);
    }*/




    try {
      console.log(boletoBancarioId);
      if (boletoBancarioId) {
        api.get('/boleto-bancario/download/' + boletoBancarioId)
          .then(result => {
            console.log(result.data);
            console.log(result.data.data);

            const rawData: ArrayBuffer = result.data.data;
            const typedArray = new Uint8Array(rawData);


            const blob = new Blob([typedArray], { type: 'application/pdf' });

            const downloadUrl: string = window.URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = downloadUrl;
            anchor.download = 'testeBoleto.pdf';

            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
            window.URL.revokeObjectURL(downloadUrl);
          });

      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  }

  const handlerBoletoNossoNumero = async (boleto: Boleto) => {

    try {
      console.log(boleto);
      if (boleto.boletosBancarios) {
        api.get('/boleto-bancario/nossonumero/' + boleto.boletosBancarios[0].id)
          .then(result => {
            console.log(result.data);
            console.log(result.data.data);

          });

      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  }

  const handlerBaixarBoleto = async (boletoBancarioId: number) => {

    try {
      console.log(boletoBancarioId);
      if (boletoBancarioId) {
        api.patch('/boleto-bancario/baixar/' + boletoBancarioId)
          .then(result => {
            console.log(result.data);
            console.log(result.data.data);

          });

      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  }

  const handlerChangeTipo = (tipo: string) => {
    navigate({
      search: `?page=1&limit=${limit}&search=${search}&status=${tipo}`
    })
  }

  return (
    <div className="container mx-auto space-y-6 p-4 font-[Poppins-regular]">
      {/* Search & Filters */}
      {/* <div className="grid grid-cols-2 flex flex-col justify-end items-start gap-4 sm:flex-row sm:items-center"> */}
      <div className="flex flex-row items-start justify-end gap-2 sm:flex-row sm:items-center">
        {glb_params.origin_url.indexOf('lista') > -1 && (
          <h1 className="text-2xl font-bold">Boletos bancário</h1>
        )}
        <div className='grid grid-cols-3'>
          {
            showcard ?
              (<List onClick={() => { setShowCard(!showcard) }} color='black' className='hover:cursor-pointer hover:bg-gray-300' />) :
              (<IdCard onClick={() => { setShowCard(!showcard) }} color='black' className='hover:cursor-pointer hover:bg-gray-300' />)
          }
        </div>
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
            Nenhum boleto encontrado para a busca atual.
          </p>
        )}

        {/*Card das locações/pagamentos */}
        {(boletosBancario.length === 0 && !hasSearchResults) && (
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
                {boletosBancario.map((boleto) => (
                  <Card key={boleto.id} className="">
                    <CardHeader className="flex flex-row justify-between">
                      <CardTitle className="line-clamp-1" style={{ fontSize: '1rem' }}>
                        <div className='grid grid-cols-2'>
                          {((boleto.boleto && boleto.boleto.locacao) ? (
                            <p className="line-clamp-2 flex gap-1 text-sm text-muted-foreground">
                              {boleto.boleto.locatario ? boleto.boleto.locatario.pessoa?.nome : ''} -
                              {boleto.boleto.locacao?.imovel?.endereco.complemento} -
                              {boleto.boleto.locacao?.imovel?.condominio ? boleto.boleto.locacao.imovel.condominio.name : ''}
                            </p>)
                            :
                            (<p className="line-clamp-2 flex gap-1 text-sm text-muted-foreground">
                              {(boleto.boleto && boleto.boleto.imovel && boleto.boleto.imovel.proprietarios && boleto.boleto.imovel.proprietarios.length > 0) ?
                                boleto.boleto.imovel.proprietarios[0]?.pessoa?.nome : ''}
                              {boleto.boleto ? ' - ' + boleto.boleto.imovel?.endereco.complemento : ''}
                              {boleto.boleto && boleto.boleto.imovel?.condominio ? ' - ' + boleto.boleto.imovel.condominio.name : ''}
                            </p>)
                          )}

                          <div className='flex justify-end'>
                            <Badge
                              variant="secondary"
                              className='mt-2 bg-blue-50 text-blue-800'>
                              {boleto.boleto && boleto.boleto.locacao ? 'LOCAÇÃO' : 'IMÓVEL'}
                            </Badge>
                          </div>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent >
                      <Label className="font-bold flex justify-start" style={{ fontSize: '0.7rem' }}>
                        Boleto :  {boleto.id}
                      </Label>
                      <div className='grid grid-cols-2 gap-4 mt-2'>
                        <Label className="font-bold flex justify-start" style={{ fontSize: '0.7rem' }}>
                          Emissão :  {moment.utc(boleto.dataBoleto).format("DD/MM/YYYY")}
                        </Label>
                        <Label className="font-bold flex justify-end" style={{ fontSize: '0.7rem' }}>
                          Vencimento :  {moment.utc(boleto.dataVencimento).format("DD/MM/YYYY")}
                        </Label>
                      </div>
                      <div className='grid grid-cols-2 gap-4 mt-2'>
                        <Label className="font-bold flex justify-start" style={{ fontSize: '0.7rem' }}>
                          Valor Original {usdFormatter.format(boleto.valor)}
                        </Label>
                        <Label className="font-bold flex justify-end" style={{ fontSize: '0.7rem' }}>
                          Valor Pago {usdFormatter.format(boleto.valorPago)}
                        </Label>
                      </div>
                      <Label className="font-bold flex justify-start mt-2" style={{ fontSize: '0.7rem' }}>
                        Situação :  {boleto.status}
                      </Label>
                      <Label className="font-bold flex justify-start mt-2" style={{ fontSize: '0.7rem' }}>
                        Linha Digitável :  {boleto.linhaDigitavel}
                      </Label>                      
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
                                onClick={() => handlerBaixarBoleto(boleto.id)}
                                size={"sm"}>
                                <Trash className="h-4 w-4" />Baixar do banco
                              </Button>
                            </>
                          )}
                        {((isAdmin ||
                          user?.permissions.includes("ALL") ||
                          user?.permissions.includes("VIEW_BOLETO_BANCARIO")
                        )) && (
                            <>
                              <Button variant="secondary"
                                onClick={() => handlerDownloadBoleto(boleto.id)}
                                size={"sm"}>
                                <Download className="h-4 w-4" />Download Boleto
                              </Button>
                            </>
                          )}
                        {boleto.status === BoletoStatus.CONFIRMADO && (
                          <Button variant="secondary"
                            className='hover:cursor-pointer hover:bg-gray-200'
                            onClick={() => handlerEnviaEmail(boleto.boleto)}
                            size={"sm"}>
                            <Mail></Mail>
                          </Button>
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
                      <th className="border-b p-2 text-left">Locação/Imóvel</th>
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
                      {boletosBancario?.map((boleto) => (
                        <tr key={boleto.id} className="hover:bg-gray-300">
                          {(boleto.boleto && boleto.boleto.locacao ? (
                            <td className={boleto.boleto.status === BoletoStatus.ATRASADO ? "border-b p-2 text-red-600" : "border-b p-2"}>
                              {boleto.boleto && boleto.boleto.locatario ? boleto.boleto.locatario.pessoa?.nome : ''}
                              {boleto.boleto && boleto.boleto.locacao ? ' - ' + boleto.boleto.locacao?.imovel?.endereco.complemento : ''}
                              {boleto.boleto && boleto.boleto.locacao && boleto.boleto.locacao?.imovel?.condominio ? ' - ' + boleto.boleto.locacao.imovel.condominio.name : ''}
                            </td>
                          )
                            :
                            (<td className={boleto.status === BoletoStatus.ATRASADO ? "border-b p-2 text-red-600" : "border-b p-2"}>
                              {boleto.boleto && boleto.boleto.imovel && boleto.boleto.imovel.proprietarios && boleto.boleto.imovel.proprietarios.length > 0 ? 
                              boleto.boleto.imovel.proprietarios[0]?.pessoa?.nome : ''}
                              {boleto.boleto && boleto.boleto.imovel ? ' - ' + boleto.boleto.imovel?.endereco.complemento : ''}
                              {boleto.boleto && boleto.boleto.imovel && boleto.boleto.imovel?.condominio ? ' - ' + boleto.boleto.imovel.condominio.name : ''}
                            </td>)
                          )}
                          <td className={boleto.status === BoletoStatus.ATRASADO ? "border-b p-2 text-red-600" : "border-b p-2"}>
                            <div>
                              {moment.utc(boleto.dataVencimento).format("DD/MM/YYYY")}
                            </div>
                          </td>
                          <td className={boleto.status === BoletoStatus.ATRASADO ? "border-b p-2 text-red-600" : "border-b p-2"}>
                            {boleto.valor.toLocaleString('pt-BR')}
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

        {/**Dialog de email */}
        <Dialog
          open={isEmailDialogOpen}
          onOpenChange={(value) => {
            setIsEmailDialogOpen(value)
          }}
        >
          <DialogContent>
            <DialogHeader className='font-[Poppins-Regular]'>
              <DialogTitle>Envio de e-mail</DialogTitle>
              <DialogDescription>Preencha os dados para envio do alerta.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-2">
              <form className="space-y-4 font-[Poppins-Regular]" onSubmit={jobMethods.handleSubmit(handleSubmitEmail)}>
                <div className="grid grid-cols-1 items-center gap-4">
                  <Label className='text-base font-[Poppins-Regular]'>
                    Tipo de Alerta
                    <div className='mt-2 border rounded-md pr-6'>
                      <Controller
                        name="alertaId"
                        control={jobMethods.control}

                        render={({ field }) => (
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              //handlerChangeAlerta(value);
                            }}
                            value={String(field.value)}
                          >
                            <SelectTrigger className='h-6'>
                              <SelectValue placeholder="Tipo agendamento" />
                            </SelectTrigger>
                            <SelectContent>
                              {alertas?.data.map((alerta) => (
                                <SelectItem key={alerta.id} value={alerta.id.toString()}>
                                  {alerta.descricao}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {jobMethods.formState.errors.alertaId?.message &&
                        (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                          {jobMethods.formState.errors.alertaId.message}
                        </p>)}
                    </div>
                  </Label>

                  <Label className="text-base font-[Poppins-Regular]">
                    Destinatário
                    <Input
                      type='text'
                      className="mt-2"
                      placeholder="Destinatário"
                      {...jobMethods.register('str_email')}
                    />
                    {jobMethods.formState?.errors?.str_email?.message &&
                      <p style={{ color: 'red', fontSize: '0.8rem' }}>
                        *{jobMethods.formState?.errors?.str_email?.message}
                      </p>}
                  </Label>

                  <Label className="text-base font-[Poppins-Regular]">
                    Mensagem
                    <Textarea
                      rows={10}
                      className="mt-2"
                      placeholder="Mensagem de envio"
                      {...jobMethods.register('str_message')}
                    />
                    {jobMethods.formState?.errors?.str_message?.message &&
                      <p style={{ color: 'red', fontSize: '0.8rem' }}>
                        *{jobMethods.formState?.errors?.str_message?.message}
                      </p>}
                  </Label>
                </div>
                <DialogFooter>
                  <Button size="sm" type='submit' className='hover:cursor-pointer hover:bg-gray-600'
                    onClick={() => handlerSendMail()}>
                    Enviar email</Button>
                </DialogFooter>
              </form>
            </div>
          </DialogContent>
        </Dialog>

        {/**Dialog de envio de boleto ao banco */}
        <Dialog
          open={isBancoDialogOpen}
          onOpenChange={(value) => {
            setIsBancoDialogOpen(value)
          }}
        >
          <DialogContent>
            <DialogHeader className='font-[Poppins-Regular]'>
              <DialogTitle>Geração de Boletos/Envio ao banco</DialogTitle>
              <DialogDescription>Preencha os dados para confirmação do boleto.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-2">
              <form className="space-y-4 font-[Poppins-Regular]" onSubmit={jobMethods.handleSubmit(handleSubmitEmail)}>
                <div className="grid grid-cols-1 items-center gap-4">
                  
                </div>
                <DialogFooter>
                  <Button size="sm" type='submit' className='hover:cursor-pointer hover:bg-gray-600'
                    onClick={() => //handlerEmitirBoleto()
                      console.log('teste')
                      }>
                    Emitir Boleto</Button>
                </DialogFooter>
              </form>
            </div>
          </DialogContent>
        </Dialog>

      </div>

      {/* Pagination */}
      <Pagination>
        <PaginationContent className={boletosBancario.length > 0 ? "" : "hidden"}>
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

