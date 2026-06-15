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
import { IdCard, List, Mail, Plus, Receipt, Search, Trash, X } from 'lucide-react'
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
import { Calc_DIG_Modulo } from '@/utils/pagseguro-ecrypt'
import { jobSchema, JobSchema } from '@/schemas/job.schema'
import { JobsStatus } from '@/enums/alertas/JobsStatus'
import { getAlertasPag } from '../alertas/requests'
import { Imovel } from '@/interfaces/imovel'
import ListarImoveisLocacao from '../imoveis/listaimoveislocacao'

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
  const result = await api.get<BasePaginationData<Boleto>>('pagamentos/' + empresaId.toString(), {
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
    queryKey: ['boletos', empresaId, { search, page, limit, status, exclude, dataInicial, dataFinal }, queryKeys],
    queryFn: () => getBoletos(empresaId, { search, page, limit, status, exclude, dataInicial, dataFinal })
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
  const [selBoleto, setSelBoleto] = useState<Boleto>();

  const navigate = useNavigate();

  //Globals
  const glb_params = useGlobalParams();

  const [selLocacao, setSelLocacao] = useState<boolean>(false);
  const [selImovel, setSelImovel] = useState<boolean>(false);
  const [searchParams, setSearchTerm] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  //const limit = ((isPortrait || isTablet || isBigScreen) && limitView > 1 ? 3 : isMobile ? 1 : limitView > 0 ? limitView : limitView || Number(searchParams.get('limit')) || 3);
  const limit = ((isPortrait || isTablet || isBigScreen) && limitView > 1 ? 100 : isMobile ? 1 : limitView > 0 ? limitView : limitView || Number(searchParams.get('limit')) || 3);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const [dataInicial, setdataInicial] = useState(searchParams.get('dataInicial') || moment.utc(new Date()).format("YYYY-MM-DD"));
  const [dataFinal, setdataFinal] = useState(searchParams.get('dataFinal') || moment.utc(new Date()).format("YYYY-MM-DD"));
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)
  //const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  //Consulta alertas configurados
  const {
    data: alertas
  } = useQuery({
    queryKey: ['alertas'],
    queryFn: () => getAlertasPag(glb_params.id_empresa ? Number(glb_params.id_empresa) : 0, {}),
  });


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
      imovelId: 0,
      empresaId: glb_params.id_empresa ? Number(glb_params.id_empresa) : 0,
    },
    mode: 'all'
  })


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
      console.log(boleto);
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

  //Lista de imoveis
  const imovel = useFieldArray({
    control: boletoMethods.control,
    name: 'imovel'
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
      boleto.documentos = [];
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

    if (locacao.fields.length === 0) {
      boletoMethods.setValue('locacaoId', 0);

      if (imovel.fields.length === 0) {
        boletoMethods.setValue('imovelId', 0);
        return false;
      }
      else {
        boletoMethods.setValue('imovelId', imovel.fields[0].id);
      }
    }
    else {
      boletoMethods.setValue('locacaoId', locacao.fields[0].id);
      boletoMethods.setValue('locatarioId', locacao.fields[0].locatarioId);
    }

    if (data.locacaoId) {
      formData.append('locacaoId', data.locacaoId.toString());
    }
    else {
      if (data.imovelId) {
        formData.append('imovelId', data.imovelId.toString());
      }
    }
    if (data.locatarioId) {
      formData.append('locatarioId', data.locatarioId.toString());
    }
    formData.append('status', data.status);
    formData.append('dataEmissao', moment(data.dataEmissao).format('YYYY-MM-DD'));
    formData.append('dataVencimento', moment(data.dataVencimento).format('YYYY-MM-DD'));
    if (data.dataPagamento && data.dataPagamento !== 'Invalid date') {
      formData.append('dataPagamento', moment(data.dataPagamento).format('YYYY-MM-DD'));
    }
    formData.append('valorOriginal', (data.valorOriginal ? data.valorOriginal.toString() : "0"));
    formData.append('valorPago', (data.valorPago ? data.valorPago.toString() : "0"));
    formData.append('observacao', data.observacao ? data.observacao : "");
    if (data?.linhaDigitavel) {
      formData.append('linhaDigitavel', data.linhaDigitavel)
    }

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

  //Retorno ao selecionar a imovel
  const handleSelectedImovel = (imovelSel: Imovel | undefined) => {

    console.log(imovelSel);
    if (imovelSel) {
      if (imovel.fields.length === 0) {
        imovel.append({
          nome: imovelSel ? (imovelSel.proprietarios ? imovelSel.proprietarios[0].pessoa?.nome + ' - ' : '') + imovelSel.endereco.complemento + ' - ' + imovelSel.condominio.name : "",
          id: imovelSel.id,
        });
      }
      boletoMethods.setValue('imovelId', imovelSel.id,
        {
          shouldDirty: true,
          shouldValidate: true
        }
      );
    }
    else {
      boletoMethods.setValue('imovelId', 0,
        {
          shouldDirty: false,
          shouldValidate: false
        }
      );
    }
    setSelImovel(false);
  }

  const handlerNewBoleto = () => {
    console.log('novo boleto');
    boletoMethods.reset();
    if (locacao.fields.length > 0) {
      locacao.remove(0);
    }
    if (imovel.fields.length > 0) {
      imovel.remove(0);
    }
    setIsCreateDialogOpen(!isCreateDialogOpen);

  }

  const handlerValidaLinhaDig = (value: string) => {
    if (value) {
      // Remove espaços e traços
      const linhaDigitavelDig = value.replace(/\s/g, '').replace(/-/g, '');
      const linhaDigitavel = linhaDigitavelDig.substring(0, 11) + linhaDigitavelDig.substring(12, 23) + linhaDigitavelDig.substring(24, 35) + linhaDigitavelDig.substring(36, 47);
      console.log(linhaDigitavel);
      // Verifica se a linha digitável tem 44 ou 48 dígitos
      if (linhaDigitavel.length === 44 || linhaDigitavel.length === 48) {
        // Verifica se todos os caracteres são dígitos
        if (/^\d+$/.test(linhaDigitavel)) {
          // Aqui você pode implementar a lógica de validação do dígito verificador, se necessário
          var dbl_valor = 0;
          var int_dig = 0;
          var int_modulo = (linhaDigitavel.substring(2, 1) === '6' ? 11 : 10)
          var str_vencimento = '';

          //Validar digitos
          //Bloco 1
          int_dig = Calc_DIG_Modulo(linhaDigitavel.substring(0, 11), int_modulo);
          if (int_dig === parseInt(linhaDigitavelDig.substring(12, 1))) {
            return true;
          }

          //Bloco 2
          int_dig = Calc_DIG_Modulo(linhaDigitavel.substring(12, 11), int_modulo);
          if (int_dig === parseInt(linhaDigitavelDig.substring(23, 1))) {
            return true;
          }

          //Bloco 3
          int_dig = Calc_DIG_Modulo(linhaDigitavel.substring(24, 11), int_modulo);
          if (int_dig === parseInt(linhaDigitavelDig.substring(35, 1))) {
            return true;
          }

          //Bloco 4
          int_dig = Calc_DIG_Modulo(linhaDigitavel.substring(36, 11), int_modulo);
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

          boletoMethods.setValue('valorOriginal', dbl_valor);

          //Vencimento
          str_vencimento = linhaDigitavel.substring(19, 27);
          console.log(str_vencimento);
          boletoMethods.setValue('dataVencimento', moment.utc(str_vencimento, 'YYYYMMDD').format("YYYY-MM-DD"));


        } else {
        }
      } else {
      }
    } else {
    }
  }

  const handlerEnviaEmail = (boleto: Boleto) => {
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

    if (selBoleto?.imovelId && selBoleto?.imovelId > 0) {
      if (selBoleto.imovel?.proprietarios) {
        formData.append('pessoaId', selBoleto.imovel.proprietarios[0].pessoaId.toString());
        formData.append('str_email', selBoleto.imovel.proprietarios[0].pessoa ? selBoleto.imovel.proprietarios.map(loc => loc.pessoa ? loc.pessoa.email : "").join(";") : "");
      }
    }
    else {
      if (selBoleto?.locacaoId && selBoleto?.locacaoId > 0) {
        if (selBoleto.locacao?.locatarios) {
          formData.append('pessoaId', selBoleto.locacao.locatarios[0].pessoaId.toString());
          formData.append('str_email', selBoleto.locacao.locatarios[0].pessoa ? selBoleto.locacao.locatarios.map(loc => loc.pessoa ? loc.pessoa.email : "").join(";") : "");
        }
      }
    }

    if (data.imovelId) {
      formData.append('imovelId', data.imovelId.toString());
    }
    if (data.locacaoId) {
      formData.append('locacaoId', data.locacaoId.toString());
    }

    if (data.str_message) {
      formData.append('str_message', data.str_message.toString());
    }

    if (locacao.fields.length === 0) {
      boletoMethods.setValue('locacaoId', 0);
      if (imovel.fields.length === 0) {
        boletoMethods.setValue('imovelId', 0);
        return false;
      }
      else {
        boletoMethods.setValue('imovelId', imovel.fields[0].id);
      }
    }
    else {
      boletoMethods.setValue('locacaoId', locacao.fields[0].id);
      boletoMethods.setValue('locatarioId', locacao.fields[0].locatarioId);
    }



    /*const newDocuments = data?.documentos?.filter((doc) => !doc.id)
    newDocuments?.forEach((doc) => {
      formData.append('documentos', doc.file)
    })*/


    //createBoletoMutation.mutate({ data: formData });

  }

  console.log(alertas);
  const handlerChangeAlerta = (value: string) => {
    let alerta = alertas?.data.filter(x => x.id === Number(value));
    jobMethods.setValue("descAlerta", alerta ? alerta[0].alerta.descricao : "");
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
            if (selBoleto) {
              switch (str_campo) {
                case "<Data de Emissão>":
                  textoAlerta = textoAlerta.replace(str_campo, moment.utc(selBoleto.dataEmissao).format("DD/MM/YYYY"));
                  break;

                case "<Data de Vencimento>":
                  textoAlerta = textoAlerta.replace(str_campo, moment.utc(selBoleto.dataEmissao).format("DD/MM/YYYY"));
                  break;

                case "<Valor Original>":
                  textoAlerta = textoAlerta.replace(str_campo, selBoleto.valorOriginal.toLocaleString('pt-BR'));
                  break;

                case "<Email>":
                  textoAlerta = textoAlerta.replace(str_campo, moment.utc(selBoleto.locatario?.pessoa?.email).format("DD/MM/YYYY"));
                  break;

                case "<Link do Documento>":
                  if (selBoleto.documentos && selBoleto.documentos.length > 0) {
                    textoAlerta = textoAlerta.replace(str_campo, selBoleto.documentos.map(doc => doc.url ? import.meta.env.VITE_AZURE_BLOB_CONTAINER + doc.url : "").join("\n"));
                  }
                  break;

                case "<Linha Digitável Boleto>":
                  textoAlerta = textoAlerta.replace(str_campo, selBoleto.linhaDigitavel);
                  break;

                case "<Linha Digitável Lançamento>":
                  if (selBoleto.lancamentoImovels && selBoleto.lancamentoImovels.length > 0) {
                    textoAlerta = textoAlerta.replace(str_campo, selBoleto.lancamentoImovels.map(lan => lan.linhaDigitavel ? lan.linhaDigitavel : "").join("\n"));
                  }
                  else {
                    if (selBoleto.lanctoCondominio && selBoleto.lanctoCondominio.length > 0) {
                      textoAlerta = textoAlerta.replace(str_campo, selBoleto.lanctoCondominio.map(lan => lan.linhaDigitavel ? lan.linhaDigitavel : "").join("\n"));
                    }
                    else {
                      if (selBoleto.lanctoLocacao && selBoleto.lanctoLocacao.length > 0) {
                        textoAlerta = textoAlerta.replace(str_campo, selBoleto.lanctoLocacao.map(lan => lan.linhaDigitavel ? lan.linhaDigitavel : "").join("\n"));
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
            /*arr_campos = [
              { check: false, campo: "dataEmissao", descricao: "Data de Emissão" },
              { check: false, campo: "dataVencimento", descricao: "Data de Vencimento" },
              { check: false, campo: "valorOriginal", descricao: "Valor Original" },
              { check: false, campo: "email", descricao: "Email" },
              { check: false, campo: "linkDocumento", descricao: "Link do Documento" },
              { check: false, campo: "linhaDigitavelBol", descricao: "Linha Digitável Boleto" },
              { check: false, campo: "linhaDigitavelLan", descricao: "Linha Digitável Lançamento" },
            ]*/
            break;

          default:
            break;
        }

        int_pos++;
      }
      jobMethods.setValue("str_message", textoAlerta);
    }

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
              <Plus className="mr-2" /> Criar Boleto
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
            <div>
              <FormProvider {...boletoMethods}>
                <DocumentUpload disabled={false} downloadDocuments={true} />
              </FormProvider>

              <form className="space-y-4 font-[Poppins-Regular]" onSubmit={boletoMethods.handleSubmit(handleSubmitBoleto)}>
                <div className="grid grid-cols-2 items-center gap-2">

                  {/*seleção de imovel */}
                  {(!selImovel && (!selLocacao && locacao.fields.length === 0)) && (
                    <div className='col-span-2'>
                      {(imovel.fields.length > 0) ? (
                        <>
                          <Label className='text-base' >Imóvel</Label>
                          <div className="grid grid-cols-1 gap-4 flex items-center">
                            {imovel.fields.map((field, index) => (
                              <div className='flex justify-between items-center gap-2 mt-2 border-solid border-2 border-gray-250 rounded p-1'>
                                <Label >{field.nome}</Label>
                                <button
                                  className='border bg-zinc-200 hover:bg-zinc-400'
                                  type="button"
                                  onClick={() => {
                                    boletoMethods.setValue('locacaoId', 0, { shouldDirty: false, shouldValidate: false });
                                    imovel.remove(index);
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
                          <Button type='button' size={"sm"} className='hover:cursor-pointer hover:bg-gray-600'
                            onClick={() => {
                              setSelImovel(true);
                            }}
                          >Adicionar imóvel</Button>
                        </div>
                      )}
                      {!!boletoMethods?.formState?.errors?.imovelId?.message && (
                        boletoMethods.formState?.errors?.imovelId?.message && <p style={{ color: '#ed535d', fontSize: '0.8rem' }}>* {boletoMethods.formState?.errors?.imovelId?.message}</p>
                      )}

                    </div>
                  )}

                  {/*Seleção de imóveis */}
                  {selImovel && (
                    <Card id='teste' className='h-full col-span-2'>
                      <div className="flex  justify-end">
                        <Button onClick={() => { handleSelectedImovel(undefined) }}
                          className='w-4 h-8 -top-5 -right-5 relative rounded-full bg-transparent text-black bg-zinc-200 hover:bg-zinc-400'>X</Button>
                      </div>
                      <CardHeader>
                        <h1 className='flex items-center justify-center font-bold'>Selecionar Imóvel</h1>
                      </CardHeader>
                      <CardContent className='mt-2 h-120'>
                        <ListarImoveisLocacao limitView={1} exclude='' onSelectImovel={handleSelectedImovel} />
                      </CardContent>
                    </Card>
                  )}

                  {/*seleção de locação */}
                  {((!selImovel && imovel.fields.length === 0) && !selLocacao) && (
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
                          <Button type='button' size={"sm"} className='hover:cursor-pointer hover:bg-gray-600'
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

                  {(!selImovel && !selLocacao) && (
                    <>
                      <div className='mt-2 col-span-2'>
                        <div className="grid grid-cols-1 gap-4 mt-2">
                          <Label htmlFor="description">Código de Barras
                            <Input className='mt-2'
                              type='text'
                              placeholder="Código de barras "
                              {...boletoMethods.register('linhaDigitavel')}
                              onBlur={(e) => { handlerValidaLinhaDig(e.target.value) }}
                            />
                            {boletoMethods.formState?.errors?.linhaDigitavel?.message && <p style={{ color: 'red', fontSize: '0.8rem' }}>*{boletoMethods.formState?.errors?.linhaDigitavel?.message}</p>}
                          </Label>
                        </div>
                      </div>

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
                  <Button size="sm" type='submit' className='hover:cursor-pointer hover:bg-gray-600'>Criar Boleto</Button>
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
                        <div className='grid grid-cols-2'>
                          {(boleto.locacao !== null ? (
                            <p className="line-clamp-2 flex gap-1 text-sm text-muted-foreground">
                              {boleto.locatario ? boleto.locatario.pessoa?.nome : ''} -
                              {boleto.locacao?.imovel?.endereco.complemento} -
                              {boleto.locacao?.imovel?.condominio ? boleto.locacao.imovel.condominio.name : ''}
                            </p>)
                            :
                            (<p className="line-clamp-2 flex gap-1 text-sm text-muted-foreground">
                              {boleto.imovel && boleto.imovel.proprietarios && boleto.imovel.proprietarios.length > 0 ? boleto.imovel.proprietarios[0]?.pessoa?.nome : ''} -
                              {boleto.imovel?.endereco.complemento} -
                              {boleto.imovel?.condominio ? boleto.imovel.condominio.name : ''}
                            </p>)
                          )}

                          <div className='flex justify-end'>
                            <Badge
                              variant="secondary"
                              className='mt-2 bg-blue-50 text-blue-800'>
                              {boleto.locacao !== null ? 'LOCAÇÃO' : 'IMÓVEL'}
                            </Badge>
                          </div>
                        </div>
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
                      {(boleto.locacao !== null ?
                        (boleto.lanctoLocacao && boleto.lanctoLocacao?.length > 0) ? (
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
                        :
                        (boleto.lancamentoImovels && boleto.lancamentoImovels?.length > 0) ? (
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
                                {boleto.lancamentoImovels?.map((lancamento) => (
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
                                {usdFormatter.format(
                                  boleto.lancamentoImovels.reduce((total, lancamento) => {
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
                        {(boleto.documentos && boleto.documentos.length > 0) && (
                          <Button variant="secondary"
                            className='hover:cursor-pointer hover:bg-gray-200'
                            onClick={() => handleClickVerComprovante(boleto)}
                            size={"sm"}>
                            Comprovante
                          </Button>
                        )}
                        {boleto.status === BoletoStatus.CONFIRMADO && (
                          <Button variant="secondary"
                            className='hover:cursor-pointer hover:bg-gray-200'
                            onClick={() => handlerEnviaEmail(boleto)}
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
                      {boletos?.map((boleto) => (
                        <tr key={boleto.id} className="hover:bg-gray-300">
                          {(boleto.locacao !== null ? (
                            <td className={boleto.status === BoletoStatus.ATRASADO ? "border-b p-2 text-red-600" : "border-b p-2"}>
                              {boleto.locatario ? boleto.locatario.pessoa?.nome : ''} -
                              {boleto.locacao?.imovel?.endereco.complemento} -
                              {boleto.locacao?.imovel?.condominio ? boleto.locacao.imovel.condominio.name : ''}
                            </td>
                          )
                            :
                            (<td className={boleto.status === BoletoStatus.ATRASADO ? "border-b p-2 text-red-600" : "border-b p-2"}>
                              {boleto.imovel && boleto.imovel.proprietarios && boleto.imovel.proprietarios.length > 0 ? boleto.imovel.proprietarios[0]?.pessoa?.nome : ''} -
                              {boleto.imovel?.endereco.complemento} -
                              {boleto.imovel?.condominio ? boleto.imovel.condominio.name : ''}
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
                              handlerChangeAlerta(value);
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

