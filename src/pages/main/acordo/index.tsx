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
import { queryOptions, useQuery } from '@tanstack/react-query'
import { ArrowDownNarrowWide, ArrowDownWideNarrow, Download, IdCard, List, Mail, Plus, RefreshCcw, Search, Trash } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BasePaginationData } from '../imoveis/listarImoveis'
import { useMediaQuery } from 'react-responsive'
import { useGlobalParams } from '@/globals/GlobalParams'
import { generatePaginationLinks } from '@/components/ui/generate-pages'
import { Label } from '@/components/ui/label'
import moment from 'moment'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { BoletoStatus } from '@/enums/locacao/enums-locacao'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { STATUS_BOLETO_OPTIONS } from '@/constants/status-boletos'
import { useAuth } from '@/hooks/auth/use-auth'
import { Loader } from '@/components/ui/loader'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { Textarea } from '@/components/ui/textarea'
import axios from 'axios'
import { jobSchema, JobSchema } from '@/schemas/job.schema'
import { JobsStatus } from '@/enums/alertas/JobsStatus'
import { getAlertasPag } from '../alertas/requests'
import { Acordo } from '@/interfaces/acordo'

// Types
interface GetAcordosParams {
  search?: string
  page?: number
  limit?: number
  status?: string,
  exclude?: string
  dataInicial?: string
  dataFinal?: string
}

// API & Query Logic
export const getAcordosBancario = async (empresaId: number, { page, limit, search, status, exclude, dataInicial, dataFinal }: GetAcordosParams) => {
  const result = await api.get<BasePaginationData<Acordo>>('acordos/' + empresaId.toString(), {
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
  return result;
}

export const useGetAcordosQueryOptions = (empresaId: number, {
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
    queryKey: ['acordos', empresaId, { search, page, limit, status, exclude, dataInicial, dataFinal }, queryKeys],
    queryFn: () => getAcordosBancario(empresaId, { search, page, limit, status, exclude, dataInicial, dataFinal })
  })
}

//Lista de boletos
export default function ListarAcordos({
  limitView,
  exclude,
}: {
  limitView: number
  exclude: string
}) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isBigScreen = useMediaQuery({ query: '(min-width: 1824px)' })
  const isPortrait = useMediaQuery({ query: '(min-width: 1224px)' })
  const isTablet = useMediaQuery({ query: '(min-width: 746px)' })
  const isMobile = useMediaQuery({ query: '(max-width: 420px)' })
  //const isRetina = useMediaQuery({ query: '(min-resolution: 2dppx)' })
  const [showcard, setShowCard] = useState((isMobile ? false : true));
  const [selAcordo, setSelAcordo] = useState<Acordo>();
  //const [selAlerta, setSelAlerta] = useState<ConfiguracaoAlerta>();

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

  const [sortField, setSortField] = useState<string>("id");
  const [order, setOrder] = useState<string>("");

  //Consulta alertas configurados
  const {
    data: alertas
  } = useQuery({
    queryKey: ['alertas'],
    queryFn: () => getAlertasPag(glb_params.id_empresa ? Number(glb_params.id_empresa) : 0, {}),
  });

  const { data, isLoading, refetch } = useQuery(
    useGetAcordosQueryOptions(glb_params.id_empresa ? Number(glb_params.id_empresa) : 0, {
      page,
      limit,
      search,
      status,
      exclude,
      dataInicial,
      dataFinal
    })
  )

  const acordos = data?.data?.data || []
  const totalPages = data?.data?.totalPages

  console.log(acordos);

  const jobMethods = useForm<JobSchema>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      empresaId: glb_params.id_empresa ? Number(glb_params.id_empresa) : 0,
      str_start_date: new Date().toISOString(),
      str_end_date: new Date().toISOString(),
      str_start_time: new Date().toISOString(),
      str_end_time: new Date().toISOString(),
      status: JobsStatus.WAITING_TO_START,
      str_email: '',
      str_email_cc: '',
      userId: user?.id
    },
    mode: 'all'
  })


  // const hasTotalPages = !!totalPages
  // const canGoToNextPage = hasTotalPages && page < totalPages
  // const canGoToPreviousPage = hasTotalPages && page > totalPages
  //always that we go to out of the total pages, we will go to the first page

  useEffect(() => {
    glb_params.updTitle_form('Acordos');
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

  const handleClickCreateAcordo = () => {
    navigate(ROUTE.ACORDO_CRIAR)
  }

  const handleClickVerDetalhes = (id: number) => {
    glb_params.updData_inicial(dataInicial);
    glb_params.updData_final(dataFinal);
    navigate(`${ROUTE.ACORDOS}/${id}`)
  }

  // UI Logic
  const hasSearchResults = Boolean(!isLoading && search && acordos?.length === 0)

  const handlerEnviaEmail = (acordo: Acordo | undefined) => {
    setSelAcordo(acordo);
    if (acordo?.imovel && acordo?.imovel?.id > 0) {
    }
    else {
      if (acordo?.locacao && acordo?.locacao.id > 0) {
        if (acordo?.locacao?.locatarios) {
          //jobMethods.setValue('str_email', acordo?.acordo.locacao.locatarios[0].pessoa ? acordo?.acordo.locacao.locatarios.map(loc => loc.pessoa ? loc.pessoa.email : "").join(";") : "");
        }
      }
    }
    setIsEmailDialogOpen(true);
  }

  const handleSubmitEmail = async (data: JobSchema) => {
    try {
      if (data) {
        console.log('handleSubmitEmail data:', data);
      }
      const formData = new FormData();

      if (selAcordo?.id) {
        console.log(selAcordo?.id);
        //const const_pdf = await DownloadPdf(Number(selAcordo.id), false);

        api.get('/boleto-bancario/download/' + selAcordo?.id)
          .then(result => {
            console.log(result.data);
            console.log(result.data.data);

            const rawData: ArrayBuffer = result.data.data;
            const typedArray = new Uint8Array(rawData);


            const blob = new Blob([typedArray], { type: 'application/pdf' });

            formData.append('email', jobMethods.getValues("str_email"))
            if (data.str_email_cc) {
              formData.append('email_cc', data.str_email_cc)
            }
            formData.append('subject', jobMethods.getValues("descAlerta"))
            formData.append('text', jobMethods.getValues("str_message"));
            formData.append('pdf', blob, 'boleto.pdf');


            const result_email = api.post<string>('/emails/sendpdf-email/' + selAcordo?.empresaId,
              formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
            console.log(result_email);
            toast({ title: 'Email enviado com sucesso.' });
          });

        /*DownloadPdf(Number(selAcordo.id), false).then((const_pdf) => {
          console.log('const_pdf', const_pdf);
          formData.append('email', jobMethods.getValues("str_email"))
          formData.append('subject', jobMethods.getValues("descAlerta"))
          formData.append('text', jobMethods.getValues("str_message"));
          formData.append('pdf', const_pdf, 'boleto.pdf');


          const result = api.post<string>('/emails/sendpdf-email/' + selAcordo?.boleto?.empresaId,
            formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          console.log(result);
          toast({ title: 'Email enviado com sucesso.' });
        });*/
      }
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

    try {
      console.log(boletoBancarioId);
      if (boletoBancarioId) {
        try {
          console.log('Antes de ir')
          const resp = await DownloadPdf(boletoBancarioId, true);
          if (resp) {
            console.log('DownloadPdf response:', resp);
          }
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
        /*
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
            anchor.download = selAcordo?.id + '.pdf';

            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
            window.URL.revokeObjectURL(downloadUrl);
          });
        */
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

  /*const handlerChangeAlerta = (value: string) => {
    let alerta = alertas?.data.filter(x => x.id === Number(value));
    //setSelAlerta(alerta && alerta.length > 0 ? alerta[0] : undefined);

    jobMethods.setValue("descAlerta", alerta ? alerta[0].alerta.descricao : "");
    jobMethods.setValue("str_email_cc", alerta ? alerta[0].emailCopia : "");

    let descAlerta = alerta ? alerta[0].alerta.descricao : "";
    let textoAlerta = alerta ? alerta[0].textoAlerta : "";
    let int_pos: number = 0;
    let int_tam: number = 0;
    let str_campo: string = "";

    if (textoAlerta.length > 0) {
      while (textoAlerta.indexOf('<', int_pos) > -1) {
        int_pos = textoAlerta.indexOf('<', int_pos);
        int_tam = textoAlerta.indexOf('>', int_pos);
        str_campo = textoAlerta.substring(int_pos, int_tam + 1);


        //Troca campo por dados do boleto

        console.log(str_campo);
        switch (descAlerta) {
          case "Aviso reajuste Locação":
            break;

          case "Aviso renovação contrato":
            break;

          case "Aviso seguro incêndio":
            break;

          case "Aviso vencimento boleto":
            if (selAcordo) {
              switch (str_campo) {
                case "<mes>":
                  moment.locale('pt', {
                    months: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
                  });
                  console.log(moment(selAcordo.dataVencimento).locale('pt').format("MMMM"));
                  console.log(moment(selAcordo.dataVencimento).format("MMMM"));

                  textoAlerta = textoAlerta.replace(str_campo, moment.utc(selAcordo.dataVencimento).format("MMMM"));
                  break;

                case "<Data de Emissão>":
                  textoAlerta = textoAlerta.replace(str_campo, moment.utc(selAcordo.dataEmissao).format("DD/MM/YYYY"));
                  break;

                case "<Data de Vencimento>":
                  textoAlerta = textoAlerta.replace(str_campo, moment.utc(selAcordo.dataVencimento).format("DD/MM/YYYY"));
                  break;

                case "<Valor Original>":
                  textoAlerta = textoAlerta.replace(str_campo, selAcordo.valorOriginal.toLocaleString('pt-BR'));
                  break;

                case "<Email>":
                  let str_mail = ((selAcordo.boleto?.locatario && selAcordo.boleto?.locatario.pessoa) ? selAcordo.boleto?.locatario.pessoa.email : ((selAcordo.boleto?.imovel && selAcordo.boleto?.imovel.proprietarios && selAcordo.boleto?.imovel.proprietarios.length > 0 && selAcordo.boleto?.imovel.proprietarios[0].pessoa) ? selAcordo.boleto?.imovel.proprietarios[0].pessoa.email : '')) || '';
                  textoAlerta = textoAlerta.replace(str_campo, str_mail);
                  break;

                case "<Link do Documento>":
                  if (selAcordo.boleto?.documentos && selAcordo.boleto?.documentos.length > 0) {
                    textoAlerta = textoAlerta.replace(str_campo, selAcordo.boleto?.documentos.map(doc => doc.url ? import.meta.env.VITE_AZURE_BLOB_CONTAINER + doc.url : "").join("\n"));
                  }
                  break;

                case "<Link do Boleto>":
                  if (selAcordo.boleto?.documentos && selAcordo.boleto?.documentos.length > 0) {
                    textoAlerta = textoAlerta.replace(str_campo, selAcordo.boleto?.documentos.map(doc => doc.url ? import.meta.env.VITE_AZURE_BLOB_CONTAINER + doc.url : "").join("\n"));
                  }
                  break;

                case "<Linha Digitável Boleto>":
                  textoAlerta = textoAlerta.replace(str_campo, selAcordo.linhaDigitavel && selAcordo.linhaDigitavel.length > 0 ? selAcordo.linhaDigitavel : '');
                  break;

                case "<Linha Digitável Lançamento>":
                  if (selAcordo.boleto?.lancamentoImovels && selAcordo.boleto?.lancamentoImovels.length > 0) {
                    textoAlerta = textoAlerta.replace(str_campo, selAcordo.boleto?.lancamentoImovels.map(lan => lan.linhaDigitavel ? lan.linhaDigitavel : "").join("\n"));
                  }
                  else {
                    if (selAcordo.boleto?.lanctoCondominio && selAcordo.boleto?.lanctoCondominio.length > 0) {
                      textoAlerta = textoAlerta.replace(str_campo, selAcordo.boleto?.lanctoCondominio.map(lan => lan.linhaDigitavel ? lan.linhaDigitavel : "").join("\n"));
                    }
                    else {
                      if (selAcordo.boleto?.lanctoLocacao && selAcordo.boleto?.lanctoLocacao.length > 0) {
                        textoAlerta = textoAlerta.replace(str_campo, selAcordo.boleto?.lanctoLocacao.map(lan => lan.linhaDigitavel ? lan.linhaDigitavel : "").join("\n"));
                      }
                      else {
                        textoAlerta = textoAlerta.replace(str_campo, "");
                      }
                    }
                  }
                  break;
              }
            }
            break;

          case "Aviso boleto atrasado":
            break;

          default:
            break;
        }

        int_pos++;
      }
      jobMethods.setValue("str_message", textoAlerta);
    }

  }*/

  const DownloadPdf = async (boletoBancarioId: number, download: boolean): Promise<any> => {
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

            if (download) {
              const downloadUrl: string = window.URL.createObjectURL(blob);
              const anchor = document.createElement('a');
              anchor.href = downloadUrl;
              anchor.download = selAcordo?.id + '.pdf';

              document.body.appendChild(anchor);
              anchor.click();
              document.body.removeChild(anchor);
              window.URL.revokeObjectURL(downloadUrl);
            }
            return blob;
          })
          .catch(error => {
            if (axios.isAxiosError(error)) {
              // Check if there's a response and data within the error
              if (error.response && error.response.data) {
                console.error('Error message from server:', error.response.data);
                toast({
                  title: 'Erro Download',
                  description: error.response.data.message,
                })

                // You can also set this error message to a state to display it in your UI
              } else {
                console.error('Axios error without response data:', error.message);
              }
            } else {
              console.error('Non-Axios error:', error);
            }
          });
      }

    } catch (error) {
      console.log('Error down');
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

  const handlerValidarBoleto = (boletoBancarioId: number) => {
    try {
      console.log(boletoBancarioId);
      if (boletoBancarioId) {
        api.get('/boleto-bancario/nossonumero/' + boletoBancarioId)
          .then(result => {

            if (result.status === 200) {
              console.log(result.status);
            }

            toast({
              title: 'Atualização',
              description: "Atualização efetuada com sucesso!",
            });
            refetch();

          }).catch(error => {
            if (axios.isAxiosError(error)) {
              // Check if there's a response and data within the error
              if (error.response && error.response.data) {
                console.error('Error message from server:', error.response.data);
                toast({
                  title: 'Erro Atualização',
                  description: error.response.data.message,
                });

                // You can also set this error message to a state to display it in your UI
              } else {
                console.error('Axios error without response data:', error.message);
              }
            } else {
              console.error('Non-Axios error:', error);
            }
          });

      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  }

  const handleOrderbyChange = (column_sel: string) => {
    console.log('column_sel:', column_sel);
    const sortOrder = sortField === column_sel && order === "asc" ? "desc" : "asc";
    setSortField(column_sel);
    setOrder(sortOrder);
  }

  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  };

  const sortedData = useMemo(() => {
    if (!sortField) return acordos;

    return [...acordos].sort((a, b) => {
      // Resolve the nested values safely
      const valA = getNestedValue(a, sortField);
      const valB = getNestedValue(b, sortField);

      // Handle undefined or null values gracefully
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;
      if (valA === valB) return 0;

      if (typeof valA === 'string' && typeof valB === 'string') {
        return order === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }

      if (valA < valB) return order === 'asc' ? -1 : 1;
      return order === 'asc' ? 1 : -1;
    });
  }, [acordos, sortField, order]);

  return (
    <div className="container mx-auto space-y-6 p-4 font-[Poppins-regular]" style={{ color: "#034869" }}>
      {/* Search & Filters */}
      {/* <div className="grid grid-cols-2 flex flex-col justify-end items-start gap-4 sm:flex-row sm:items-center"> */}
      <div className="flex flex-row items-start justify-end gap-2 sm:flex-row sm:items-center">
        <div className='grid grid-cols-3'>
          {
            showcard ?
              (<List onClick={() => { setShowCard(!showcard) }} color='#034869' className='hover:cursor-pointer hover:bg-gray-300' />) :
              (<IdCard onClick={() => { setShowCard(!showcard) }} color='#034869' className='hover:cursor-pointer hover:bg-gray-300' />)
          }
        </div>
        {(isAdmin ||
          user?.permissions.includes("ALL") ||
          user?.permissions.includes("CREATE_IMOVEL")
        ) && (
            <div>
              <Button size={"sm"} onClick={handleClickCreateAcordo}
                className="hover:bg-[#a9d9ef] hover:cursor-pointer bg-[#034869] hover:text-[#034869] text-white"
              >
                <Plus className="mr-2 h-4 w-4" /> Criar Acordo
              </Button>
            </div>
          )
        }
      </div>

      <div className=
        {(isPortrait || isTablet || isBigScreen)
          ? "grid grid-cols-2 gap-4 sm:flex-row sm:items-center sm:justify-between border-b"
          : "grid grid-cols-1 gap-4 sm:flex-row sm:items-center sm:justify-between border-b"}
      >
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4" />
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
                <SelectItem key={value.label} value={value.value}
                  style={{ color: "#034869" }}>
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
        {(acordos.length === 0 && !hasSearchResults) && (
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
                {sortedData.map((boleto) => (
                  <Card key={boleto.id} className="" style={{ color: "#034869" }}>
                    <CardHeader className="flex flex-row justify-between">
                      <CardTitle className="line-clamp-1" style={{ fontSize: '1rem' }}>
                        <div className='grid grid-cols-2'>
                          {((boleto.locacao) ? (
                            <p className="line-clamp-2 flex gap-1 text-sm ">
                              {boleto.locacao && boleto.locacao.locatarios ? boleto.locacao.locatarios[0]?.pessoa?.nome : ''} -
                              {boleto.locacao?.imovel?.endereco.complemento} -
                              {boleto.locacao?.imovel?.condominio ? boleto.locacao.imovel.condominio.name : ''}
                            </p>)
                            :
                            (<p className="line-clamp-2 flex gap-1 text-sm ">
                              {(boleto.imovel && boleto.imovel.proprietarios && boleto.imovel.proprietarios.length > 0) ?
                                boleto.imovel.proprietarios[0]?.pessoa?.nome : ''}
                              {boleto.imovel ? ' - ' + boleto.imovel?.endereco.complemento : ''}
                              {boleto.imovel && boleto.imovel?.condominio ? ' - ' + boleto.imovel.condominio.name : ''}
                            </p>)
                          )}

                          <div className='flex justify-end'>
                            <Badge
                              variant="secondary"
                              className='mt-2 bg-blue-50 text-blue-800'>
                              {boleto.locacao ? 'LOCAÇÃO' : 'IMÓVEL'}
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
                          Emissão :  {moment.utc(boleto.dataEmissao).format("DD/MM/YYYY")}
                        </Label>
                        <Label className="font-bold flex justify-end" style={{ fontSize: '0.7rem' }}>
                          Vencimento :  {moment.utc(boleto.dataVencimento).format("DD/MM/YYYY")}
                        </Label>
                      </div>
                      <div className='grid grid-cols-2 gap-4 mt-2'>
                        <Label className="font-bold flex justify-start" style={{ fontSize: '0.7rem' }}>
                          Valor Original {boleto.valorOriginal.toLocaleString('pt-BR')}
                        </Label>
                      </div>
                      <Label className="font-bold flex justify-start mt-2" style={{ fontSize: '0.7rem' }}>
                        Situação :  {boleto.status}
                      </Label>
                      {/*<Label className="font-bold flex justify-start mt-2" style={{ fontSize: '0.7rem' }}>
                        Obs :  {boleto.linhaDigitavel}
                      </Label>*/}
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <div className=
                        {cn('grid gap-10', {
                          'grid-cols-3': boleto.status === BoletoStatus.PENDENTE || boleto.status === 'REGISTRADO',
                          'grid-cols-2': boleto.status === BoletoStatus.ATRASADO || boleto.status === BoletoStatus.PAGO,
                        })}
                      >
                        {(isAdmin ||
                          user?.permissions.includes("ALL") ||
                          user?.permissions.includes("UPDATE_PAGAMENTO")
                        ) && (

                            <Button variant="secondary"
                              className='hover:bg-[#daeffa] hover:cursor-pointer bg-[#a7d9f2]'
                              onClick={() => handleClickVerDetalhes(boleto.id ? boleto.id : 0)}
                              size={"sm"}
                              style={{ fontSize: "0.7rem" }}>
                              Detalhes
                            </Button>
                          )}
                        {((isAdmin ||
                          user?.permissions.includes("ALL") ||
                          user?.permissions.includes("DELETE_PAGAMENTO")
                        ) && (boleto.status === 'REGISTRADO')) && (
                            <>
                              <Button variant="secondary"
                                onClick={() => handlerBaixarBoleto(boleto.id)}
                                size={"sm"}
                                className='hover:bg-[#daeffa] hover:cursor-pointer bg-[#a7d9f2]'
                                style={{ fontSize: "0.7rem" }}
                              >
                                <Trash className="h-4 w-4" />Baixar do banco
                              </Button>
                            </>
                          )}
                        {((isAdmin ||
                          user?.permissions.includes("ALL") ||
                          user?.permissions.includes("DELETE_PAGAMENTO")
                        ) && (boleto.status === "REGISTRADO")) && (
                            <>
                              <Button variant="secondary"
                                onClick={() => handlerValidarBoleto(boleto.id)}
                                size={"sm"}
                                className='hover:bg-[#daeffa] hover:cursor-pointer bg-[#a7d9f2]'
                                style={{ fontSize: "0.7rem" }}
                              >
                                <RefreshCcw className="h-4 w-4" />Atualizar Boleto
                              </Button>
                            </>
                          )}
                        {((isAdmin ||
                          user?.permissions.includes("ALL") ||
                          user?.permissions.includes("VIEW_BOLETO_BANCARIO")
                        ) && (boleto.status === BoletoStatus.CONFIRMADO ||
                          boleto.status === "REGISTRADO"
                          )) && (
                            <>
                              <Button variant="secondary"
                                onClick={() => handlerDownloadBoleto(boleto.id)}
                                size={"sm"}
                                className='hover:bg-[#daeffa] hover:cursor-pointer bg-[#a7d9f2]'
                                style={{ fontSize: "0.7rem" }}

                              >
                                <Download className="h-4 w-4" />Download Boleto
                              </Button>
                            </>
                          )}
                        {(boleto.status === BoletoStatus.CONFIRMADO || boleto.status === "REGISTRADO") && (
                          <Button variant="secondary"
                            className='hover:cursor-pointer hover:bg-gray-200'
                            onClick={() => handlerEnviaEmail(boleto)}
                            size={"sm"}
                            style={{ fontSize: "0.7rem" }}>
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
                      <th className="border-b p-2 text-left hover:cursor-pointer hover:bg-gray-200"
                        onClick={() => handleOrderbyChange("boleto.locatario.pessoa.nome")}
                      >
                        <div className="flex items-center">
                          <span>Locação/Imóvel&nbsp;&nbsp;</span> {sortField === "boleto.locatario.pessoa.nome" ? (order === "asc" ? <ArrowDownNarrowWide size={"16"} /> : <ArrowDownWideNarrow size={"16"} />) : <></>}
                        </div>
                      </th>

                      <th className="border-b p-2 text-left hover:cursor-pointer hover:bg-gray-200"
                        onClick={() => handleOrderbyChange("dataVencimento")}
                      >
                        <div className="flex items-center">
                          <span>Vencimento&nbsp;&nbsp;</span> {sortField === "dataVencimento" ? (order === "asc" ? <ArrowDownNarrowWide size={"16"} /> : <ArrowDownWideNarrow size={"16"} />) : <></>}
                        </div>
                      </th>
                      <th className="border-b p-2 text-left hover:cursor-pointer hover:bg-gray-200"
                        onClick={() => handleOrderbyChange("valor")}
                      >
                        <div className="flex items-center">
                          <span>Valor&nbsp;&nbsp;</span> {sortField === "valor" ? (order === "asc" ? <ArrowDownNarrowWide size={"16"} /> : <ArrowDownWideNarrow size={"16"} />) : <></>}
                        </div>
                      </th>
                      <th className="border-b p-2 text-left hover:cursor-pointer hover:bg-gray-200"
                        onClick={() => handleOrderbyChange("status")}
                      >
                        <div className="flex items-center">
                          <span>Situacao&nbsp;&nbsp;</span> {sortField === "status" ? (order === "asc" ? <ArrowDownNarrowWide size={"16"} /> : <ArrowDownWideNarrow size={"16"} />) : <></>}
                        </div>
                      </th>
                      <th className="border-b p-2 text-left"></th>
                    </tr>
                  </thead>
                </table>
                <div className='h-[400px] flex-1 overflow-y-auto'>
                  <table className='w-full table-fixed'>
                    <tbody>
                      {sortedData?.map((boleto) => (
                        <tr key={boleto.id} className="hover:bg-gray-300">
                          {(boleto.locacao ? (
                            <td className={boleto.status === BoletoStatus.ATRASADO ? "border-b p-2 text-red-600" : "border-b p-2"}>
                              {boleto.locacao.locatarios ? boleto.locacao.locatarios[0].pessoa?.nome : ''}
                              {boleto.imovel ? ' - ' + boleto.imovel?.endereco.complemento : ''}
                              {boleto.locacao?.imovel?.condominio ? ' - ' + boleto.locacao.imovel.condominio.name : ''}
                            </td>
                          )
                            :
                            (<td className={boleto.status === BoletoStatus.ATRASADO ? "border-b p-2 text-red-600" : "border-b p-2"}>
                              {boleto.imovel && boleto.imovel.proprietarios && boleto.imovel.proprietarios.length > 0 ?
                                boleto.imovel.proprietarios[0]?.pessoa?.nome : ''}
                              {boleto.imovel ? ' - ' + boleto.imovel?.endereco.complemento : ''}
                              {boleto.imovel && boleto.imovel?.condominio ? ' - ' + boleto.imovel.condominio.name : ''}
                            </td>)
                          )}
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
                                className="hover:bg-[#a9d9ef] hover:cursor-pointer bg-[#034869] hover:text-[#034869] text-white"
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
            jobMethods.reset();
            setIsEmailDialogOpen(value)
          }}
        >
          <DialogContent onInteractOutside={(e) => e.preventDefault()}>
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
                    Cópia
                    <Input
                      type='text'
                      className="mt-2"
                      placeholder="Cópia"
                      {...jobMethods.register('str_email_cc')}
                    />
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
                  {/*<Button size="sm" type='submit'
                    className="hover:bg-[#a9d9ef] hover:cursor-pointer bg-[#034869] hover:text-[#034869] text-white"
                    onClick={() => handlerSendMail()}
                    >
                    Enviar email</Button>*/}

                  <Button size="sm" type='submit'
                    className="hover:bg-[#a9d9ef] hover:cursor-pointer bg-[#034869] hover:text-[#034869] text-white"
                  >
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
          <DialogContent onInteractOutside={(e) => e.preventDefault()}>
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
        <PaginationContent className={acordos.length > 0 ? "" : "hidden"}>
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

