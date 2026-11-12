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
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ROUTE } from '@/enums/routes.enum'
import { toast } from '@/hooks/use-toast'
import axios from 'axios';
import api from '@/services/axios/api'
import { queryClient } from '@/services/react-query/query-client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Edit, Info, Pencil, Plus, Trash2, X } from 'lucide-react'
import * as React from 'react'
import { useFieldArray, useForm, UseFormReturn } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { useMediaQuery } from 'react-responsive';
import moment from 'moment';
import { useAuth } from '@/hooks/auth/use-auth'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useState } from 'react'
import { useGlobalParams } from '@/globals/GlobalParams'
import { TipoLancamento } from '@/interfaces/lancamentotipo'
import { BoletoStatus, LancamentoStatus } from '@/enums/locacao/enums-locacao'
import { LancamentoLocacao } from '@/interfaces/lancamentos'
import { PageLoader } from '@/pages/assistant/page-loader'
import { Acordo, LancamentoAcordo } from '@/interfaces/acordo'
import { acordoSchema, AcordoSchema, lancamentoAcordoSchema, LancamentoAcordoSchema } from '@/schemas/acordo.schema'
import { AcordoFormContent, AcordoFormRoot } from '../criar/components/acordo-form'
import { Input } from '@/components/ui/input'
import { Empresa } from '@/interfaces/empresa'
import { BoletoBancario } from '@/interfaces/boletobancario'
import ListarBoletosBancarios from '../../boletosbancarios'

// Types
export const getAcordo = async (acordoId: number) => {
  return await api.get<Acordo>('acordos/findbyid/' + acordoId);
}

//Leitura das imagens
const fetchDocumentos = async (documentos: Acordo['documentos']) => {
  if (!documentos) return []

  const documentoFilesPromises = documentos.map(async (image) => {
    try {

      console.log('link', import.meta.env.VITE_AZURE_BLOB_CONTAINER + image.url);
      const response = await fetch(
        import.meta.env.VITE_AZURE_BLOB_CONTAINER + image.url
      )
      console.log('response', response);
      if (!response.ok) {
        throw new Error(`Erro ao buscar imagem: ${image.url}, Status: ${response.status}`)
      }
      const blob = await response.blob()

      const file = new File([blob], image.url, { type: blob.type })
      //const file = new File([blob], image.url, { type: 'application/png' })
      console.log('blob', file);
      return {
        file,
        preview: URL.createObjectURL(file),
        id: image.id
      }
    } catch (error) {
      console.error('Erro ao processar documento:', error)
      return null
    }
  })
  const resolvedDocs = await Promise.all(documentoFilesPromises)
  return resolvedDocs.filter(Boolean)
}

const updateAcordo = async (id: string, data: FormData): Promise<Acordo | any> => {
  return await api.put<Acordo>(`/acordos/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

//Cria lancamento
const createLancamento = async (data: FormData): Promise<void> => {
  await api.post<LancamentoAcordo>('acordo/lancamentos', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

//Excluir lançamento
const deleteLancamento = async (lancamentoId: number): Promise<void> => {
  await api.delete(`acordo/lancamentos/${lancamentoId}`)
}



export default function DetalhesAcordo() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isBigScreen = useMediaQuery({ query: '(min-width: 1824px)' })
  const isPortrait = useMediaQuery({ query: '(min-width: 1224px)' })
  const isTablet = useMediaQuery({ query: '(min-width: 746px)' })
  const isMobile = useMediaQuery({ query: '(min-width: 400px)' })

  //Globals
  const glb_params = useGlobalParams();


  const dataParams = useParams<{ id: string }>();
  const id = dataParams.id ? parseInt(dataParams.id) : undefined;

  const navigate = useNavigate()

  const [openCli, setOpenCli] = useState<boolean>(false);
  const [selPessoa, setSelPessoa] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState('dados-principal')
  const [dataInicial, setdataInicial] = useState(moment(new Date()).format("YYYY-MM-DD"));
  const [dataFinal, setdataFinal] = useState(moment(new Date()).format("YYYY-MM-DD"));
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
  const [isEditing, setIsEditing] = React.useState(false)
  const [titulo, setTitulo] = React.useState("Criar novo lançamento")

  const [isLanctoDialogOpen, setIsLanctoDialogOpen] = useState(false)
  const [isExcDialogOpen, setIsExcDialogOpen] = useState(false)
  const [selBoleto, setSelBoleto] = useState<boolean>(false);


  //Carrega dados da empresa
  const { data: empresa } = useQuery({
    queryKey: ['empresa', (glb_params.id_empresa ? glb_params.id_empresa : 0)],
    queryFn: async () => {
      try {
        const data = await api.get<Empresa>(`/empresas/${glb_params.id_empresa ? glb_params.id_empresa : 0}`)
        console.log(data.data.id ? data.data.id.toString() : 'test');
        glb_params.updId_empresa(data.data.id ? data.data.id.toString() : '0')
        return data.data;
      }
      catch (error) {
        if (axios.isAxiosError(error)) {
          // Check if there's a response and data within the error
          if (error.response && error.response.data) {
            console.error('Error message from server:', error.response.data);
            toast({
              title: 'Erro ao atualizar as configurações',
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
            description: error instanceof Error ? error.message : 'Ocorreu um erro ao atualizar as configurações. Tente novamente.',
            variant: 'destructive'
          })
        }
      }
    }
  });

  const { data: acordo, isLoading } = useQuery({
    queryKey: ['acordo', id],
    queryFn: async () => {
      try {
        const data = await api.get<Acordo>(`/acordos/findbyid/${id}`)
        return data.data;
      }
      catch (error) {
        console.error(error);
        throw error;
      }
    },
    enabled: !!id
  })

  console.log(id);
  console.log(acordo);

  const { data: documentFilesData = [], isSuccess: isSuccessDocuments } = useQuery({
    queryKey: ['documentFiles', id, acordo?.documentos],
    queryFn: () => fetchDocumentos(acordo?.documentos),
    enabled: !!acordo?.documentos?.length
  })

  const documentFiles = React.useMemo(() => documentFilesData, [isSuccessDocuments])

  console.log(acordo);
  //default values
  const defaultValues = React.useMemo(
    () => ({
      //...transformNullToUndefined(locacao || {}),
      empresaId: acordo?.empresaId,
      observacao: acordo?.observacao,
      tipoGeracaoBoleto: acordo?.tipoGeracaoBoleto,
      dataEmissao: moment.utc(acordo?.dataEmissao).format('YYYY-MM-DD'),
      dataVencimento: moment.utc(acordo?.dataVencimento).format('YYYY-MM-DD'),
      valorOriginal: acordo?.valorOriginal,
      valorParcela: acordo?.valorParcela,
      qtdParcelas: acordo?.qtdParcelas,
      valorLiquido: acordo?.valorLiquido,
      juros: acordo?.juros,
      desconto: acordo?.desconto,
      multa: acordo?.multa,
      status: acordo?.status || 'PENDENTE',
      documentos: documentFiles?.filter((doc) => doc !== null),
      imovelId: acordo?.imovelId,
      pessoaId: acordo?.pessoaId,
      locacaoId: acordo?.locacaoId,
      pessoa: acordo?.pessoa ? [{ nome: acordo.pessoa?.nome, id: acordo.pessoa?.id }] : undefined,
      imovel: [{ nome: (acordo?.imovel?.description && acordo?.imovel?.description.length > 0 ? acordo?.imovel?.description : acordo?.imovel?.endereco.complemento + ' ' + acordo?.imovel?.endereco.logradouro + ' ' + acordo?.imovel?.endereco.numero), id: acordo?.imovel?.id }],
      locacao: acordo?.locacao ? [{
        nome: `${(acordo?.pessoa ? acordo?.pessoa?.nome : '')} - ${acordo?.locacao?.imovel?.endereco.complemento} ${acordo?.locacao?.imovel?.condominio ? acordo?.locacao?.imovel?.condominio.name : ''}`,
        id: acordo?.locacao.locatarios && acordo?.locacao.locatarios.length > 0 && acordo?.locacao.locatarios[0].pessoa ? acordo?.locacao.locatarios[0].pessoa.id : 0,
        locatarioId: acordo?.locacao.locatarios && acordo?.locacao.locatarios.length > 0 ? acordo?.locacao.locatarios[0].id : 0,
        imovelId: acordo?.imovelId,
      }] : undefined,
      lancamentos: acordo?.lancamentos
    }),
    [acordo, documentFiles]
  );
  console.log(defaultValues);
  //default values
  const defaultValuesLan = React.useMemo(
    () => ({
      id: 0,
      locacaoId: acordo?.locacao?.id,
      dataLancamento: moment.utc(new Date()).format("YYYY-MM-DD"),
      vencimentoLancamento: moment.utc(new Date()).format("YYYY-MM-DD"),
      parcela: 1,
      status: LancamentoStatus.ABERTO,
    }),
    [acordo]
  )

  //react hook form
  const acordoMethods = useForm<AcordoSchema>({
    resolver: zodResolver(acordoSchema),
    defaultValues: defaultValues,
    mode: 'all'
  })
  console.log(acordoMethods.getValues("valorLiquido"));
  console.log(acordoMethods.getValues("valorOriginal"));
  console.log(acordoMethods.getValues("juros"));
  console.log(acordoMethods.getValues("multa"));

  //react hook form
  const lancamentoMethods = useForm<LancamentoAcordoSchema>({
    resolver: zodResolver(lancamentoAcordoSchema),
    defaultValues: defaultValuesLan,
    mode: 'all'
  });

  //Lista de lançamentos para alteração
  const lancamentoAcordo = useFieldArray({
    control: acordoMethods.control,
    name: 'lancamentostoUpdate'
  });

  const deleteAcordoMutation = useMutation({
    mutationFn: async () => {
      return await api.delete(`/acordos/${id}`)
    },
    onSuccess: () => {
      ;['acordo', 'documentFiles', id].forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] })
      })

      toast({
        title: 'Acordo excluído com sucesso',
        description: `Acordo excluído com sucesso`
      })

      navigate(ROUTE.ACORDOS);
    }
  })


  React.useEffect(() => {
    if (acordo) {
      acordoMethods.reset(defaultValues) // seta os valores do formulário com os dados do proprietário
    }
    lancamentoMethods.reset();
  }, [id, acordo, documentFiles])

  //boleto do lancamento
  const boletoLancamento = useFieldArray({
    control: lancamentoMethods.control,
    name: 'boleto'
  });

  const handleDeleteAcordo = () => {
    deleteAcordoMutation.mutate()
  }

  const updateacordo = useMutation({
    mutationFn: async (data: FormData) => updateAcordo(id ? id.toString() : '0', data),
    onSuccess: () => {
      ;['acordo', 'documentFiles', id].forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] })
      })
      toast({ title: 'Acordo alterado com sucesso' });
      navigate(ROUTE.ACORDOS);
    },
    onError: (error) => {
      // Access the Axios error object here
      if (axios.isAxiosError(error)) {
        // Check if there's a response and data within the error
        if (error.response && error.response.data) {
          console.error('Error message from server:', error.response.data);
          toast({
            title: 'Erro ao atualizar acordo',
            description: error.response.data.message,
          })
        } else {
          console.error('Axios error without response data:', error.message);
        }
      } else {
        console.error('Non-Axios error:', error);
      }
    }
  });

  const onSubmitAcordoData = async (data: AcordoSchema) => {
    console.log('Validar Data');
    const form = new FormData()

    if (data?.observacao) {
      form.append('observacao', data.observacao);
    }

    if (data?.valorOriginal) {
      form.append('valorOriginal', data.valorOriginal.toString());
    }

    if (data?.juros) {
      form.append('juros', data.juros.toString());
    }

    if (data?.multa) {
      form.append('multa', data.multa.toString());
    }

    if (data?.desconto) {
      form.append('desconto', data.desconto.toString());
    }

    if (data?.valorLiquido) {
      form.append('valorLiquido', data.valorLiquido.toString());
    }

    if (data?.qtdParcelas) {
      form.append('qtdParcelas', data.qtdParcelas.toString());
    }

    if (data?.valorParcela) {
      form.append('valorParcela', data.valorParcela.toString());
    }

    if (data?.tipoGeracaoBoleto) {
      form.append('tipoGeracaoBoleto', data.tipoGeracaoBoleto);
    }

    if (data?.dataEmissao) {
      form.append('dataEmissao', moment(data.dataEmissao).format('YYYY-MM-DD'));
    }

    if (data?.dataVencimento) {
      form.append('dataVencimento', moment(data.dataVencimento).format('YYYY-MM-DD'));
    }


    if (data?.locacaoId) {
      form.append('locacaoId', data.locacaoId.toString());
    }

    if (data?.imovelId) {
      form.append('imovelId', data.imovelId.toString());
    }
    form.append('pessoaId', data.pessoaId.toString());
    form.append('empresaId', glb_params.id_empresa ? glb_params.id_empresa : "0");

    if (data?.lancamentostoUpdate && data?.lancamentostoUpdate.length > 0) {
      form.append('lancamentostoUpdate', JSON.stringify(data?.lancamentostoUpdate))
    }

    if (data?.documentosToDeleteIds?.length) {
      data.documentosToDeleteIds.forEach((docId) => {
        form.append('documentosToDeleteIds[]', docId.toString())
      })
    }

    console.log(new Date());

    await updateacordo.mutateAsync(form)
  }

  const onSubmitLancamentoData = async (data: LancamentoAcordoSchema) => {
    try {
      const form = new FormData()
      let lan_aux: LancamentoAcordoSchema = {
        id: 0,
        descricao: '',
        valorOriginal: 0,
        juros: 0,
        multa: 0,
        desconto: 0,
        valorLancamento: 0,
        dataLancamento: moment.utc(new Date()).format("YYYY-MM-DD"),
        dataVencimento: moment.utc(new Date()).format("YYYY-MM-DD"),
        boletoBancarioId: 0
      };

      if (data?.descricao) {
        lan_aux.descricao = data.descricao;
      }


      if (data?.valorOriginal) {
        lan_aux.valorOriginal = data.valorOriginal;
      }

      if (data?.valorLancamento) {
        lan_aux.valorLancamento = data.valorLancamento;
      }

      if (data?.juros) {
        lan_aux.juros = data.juros;
      }

      if (data?.multa) {
        lan_aux.multa = data.multa;
      }

      if (data?.desconto) {
        lan_aux.desconto = data.desconto;
      }


      if (data?.dataLancamento) {
        lan_aux.dataLancamento = data.dataLancamento;
      }

      if (data?.dataVencimento) {
        lan_aux.dataVencimento = data.dataVencimento;
      }


      if (data?.boletoBancarioId) {
        lan_aux.boletoBancarioId = data.boletoBancarioId;
      }

      lancamentoAcordo.append(lan_aux);

      console.log('Lançamento adicionado');
      setIsLanctoDialogOpen(false);

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

  const handleEditLancamento = (lancamento: LancamentoAcordo) => {
    if (acordo?.status !== BoletoStatus.PENDENTE) {
      setTitulo("Visualizar lançamento");
    }
    else {
      setTitulo("Alterar lançamento");
    }

    setIsLanctoDialogOpen(true);
    lancamentoMethods.setValue("id", lancamento.id);
    lancamentoMethods.setValue("dataLancamento", moment.utc(lancamento.dataLancamento).format("YYYY-MM-DD"));
    lancamentoMethods.setValue("dataVencimento", moment.utc(lancamento.dataVencimento).format("YYYY-MM-DD"));
    lancamentoMethods.setValue("juros", lancamento.juros);
    lancamentoMethods.setValue("multa", lancamento.multa);
    lancamentoMethods.setValue("desconto", lancamento.desconto);
    lancamentoMethods.setValue("valorOriginal", lancamento.valorOriginal);
    lancamentoMethods.setValue("valorLancamento", lancamento.valorLancamento);
    lancamentoMethods.setValue("descricao", lancamento.descricao);
    lancamentoMethods.setValue("boletoBancarioId", lancamento.boletoBancario ? lancamento.boletoBancario.id : 0);
    console.log(lancamentoMethods.getValues());
  }

  const handlerChangeFolder = (folder: string) => {
    glb_params.updOrigin_url("acordos");
    glb_params.updId_orig((id! ? id : 0).toString());
    glb_params.updPastaOrig(folder);
    setActiveTab(folder);
  }

  const handlerDetailProp = (id: number) => {
    navigate(`${ROUTE.CLIENTES}/${id}`)
  }

  const createLancamento = useMutation({
    mutationFn: async (data: FormData) => {

      return await api.post<LancamentoAcordoSchema>(`acordo/lancamentos`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },
    onSuccess: () => {
      ['acordo', id].forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] })
      })
    }
  })

  const updateLancamento = useMutation({
    mutationFn: async (data: FormData) => {
      return await api.put<LancamentoLocacao>(`/lancamentos/${data.get('id')}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },
    onSuccess: () => {
      ['locacao', id].forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] })
      })
    }
  })

  const handleDeleteLancamento = (idLancamento: number) => {
    let lancamentos = acordoMethods.getValues('lancamentostoDeleteIds');
    acordoMethods.setValue(
      'lancamentostoDeleteIds',
      [...lancamentos || [], idLancamento],
      {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true
      }
    );

  }

  const deleteLancamento = useMutation({
    mutationFn: async (idLancamento: number) => {
      return await api.delete(`/lancamentos/${idLancamento}`)
    },
    onSuccess: () => {
      ['locacao', id].forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] })
      })

      toast({
        title: 'Lançamento excluído com sucesso',
        description: `Lançamento excluído com sucesso`
      })
    }
  });

  const handlerSelBoleto = () => {

    glb_params.updOrigin_url("acordos");
    if (boletoLancamento.fields.length > 0) {
      boletoLancamento.remove(0);
    }
    setSelBoleto(true);
  }

  const handlerCalculaJurosMulta = (valor: number, vencimento: Date, tipo: string) => {
    let result: number = 0;
    if (tipo === 'M') {
      result = valor * (empresa && empresa.porcentagemMultaAtraso ? empresa.porcentagemMultaAtraso / 100 : 0);
    }
    else {
      let hoje = new Date();
      // 2. Get the difference in milliseconds
      const diffInMs = Math.abs(hoje.getTime() - vencimento.getTime());
      // 3. Define milliseconds in a single day (1000ms * 60s * 60m * 24h)
      const msInDay = 1000 * 60 * 60 * 24;
      // 4. Calculate total days and round to handle daylight savings quirks
      const totalDays = Math.round(diffInMs / msInDay);

      let diasAtraso = totalDays;
      console.log(hoje.getDate());
      console.log(vencimento.getDate());
      result = ((valor * (empresa && empresa.porcentagemJurosAtraso ? empresa.porcentagemJurosAtraso / 100 : 0)) / 30) * diasAtraso;

    }
    return parseFloat(result.toFixed(2));
  }
  //Retorno ao o boleto
  const handleSelectedBoleto = (boleto: BoletoBancario | undefined) => {


    if (boleto) {
      if (boletoLancamento.fields.length === 0) {
        boletoLancamento.append({
          nome: boleto.linhaDigitavel,
          id: boleto.id
        });
      }

      lancamentoMethods.setValue('boletoBancarioId', boleto.id,
        {
          shouldDirty: true,
          shouldValidate: true
        }
      );
      lancamentoMethods.setValue('valorOriginal', boleto.valor,
        {
          shouldDirty: true,
          shouldValidate: true
        }
      );
      lancamentoMethods.setValue('dataVencimento', boleto.dataVencimento,
        {
          shouldDirty: true,
          shouldValidate: true
        }
      );
      let juros = handlerCalculaJurosMulta(boleto.valor, new Date(boleto.dataVencimento), "J");
      let multa = handlerCalculaJurosMulta(boleto.valor, new Date(boleto.dataVencimento), "M");
      //lancamentoMethods.setValue('juros', handlerCalculaJurosMulta(boleto.valor, new Date(moment.utc(boleto.dataVencimento).format("YYYY-MM-DD")), "J"),
      lancamentoMethods.setValue('juros', juros,
        {
          shouldDirty: true,
          shouldValidate: true
        }
      );
      lancamentoMethods.setValue('multa', multa,
        {
          shouldDirty: true,
          shouldValidate: true
        }
      );
      lancamentoMethods.setValue('valorLancamento', boleto.valor + juros + multa,
        {
          shouldDirty: true,
          shouldValidate: true
        }
      );

    }
    else {
      lancamentoMethods.setValue('boletoBancarioId', 0,
        {
          shouldDirty: false,
          shouldValidate: false
        }
      );
      lancamentoMethods.setValue('valorOriginal', 0,
        {
          shouldDirty: true,
          shouldValidate: true
        }
      );

      lancamentoMethods.setValue('juros', 0,
        {
          shouldDirty: true,
          shouldValidate: true
        }
      );
      lancamentoMethods.setValue('multa', 0,
        {
          shouldDirty: true,
          shouldValidate: true
        }
      );
      lancamentoMethods.setValue('valorLancamento', 0,
        {
          shouldDirty: true,
          shouldValidate: true
        }
      );
    }


    setSelBoleto(false);
  }

  const handlerValorLancamento = () => {
    let valorOriginal = Number(lancamentoMethods.getValues("valorOriginal"));
    let juros = Number(lancamentoMethods.getValues("juros"));
    let multa = Number(lancamentoMethods.getValues("multa"));
    let desconto = Number(lancamentoMethods.getValues("desconto"));

    let valorLancamento = valorOriginal + parseFloat((juros ? juros : 0).toString()) + parseFloat((multa ? multa : 0).toString()) - parseFloat((desconto ? desconto : 0).toString());
    lancamentoMethods.setValue("valorLancamento", valorLancamento, {
      shouldDirty: true,
      shouldValidate: true
    });
  }


  console.log(acordoMethods.formState.errors);
  console.log(acordoMethods.formState.isValid);

  if (isLoading) return <PageLoader />

  return (
    <div className="container mx-auto space-y-6 p-4 font-[Poppins-regular]">
      <div className="flex items-center justify-between">
        <span className="text-wrap"
          style={
            {
              fontSize: (isBigScreen ? '1.2rem' : isPortrait ? '1rem' : isTablet ? '0.8rem' : isMobile ? '1rem' : '1rem'),
            }}

        >{`${(acordo?.pessoa ? acordo?.pessoa?.nome : '')} - ${acordo?.locacao?.imovel?.endereco.complemento} ${acordo?.locacao?.imovel?.condominio ? acordo?.locacao?.imovel?.condominio.name : ''}`}</span>
        {activeTab === 'dados-principal' && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              {(isAdmin ||
                user?.permissions.includes("ALL") ||
                user?.permissions.includes("DELETE_ACORDO")
              ) && (

                  <Button variant="destructive" className='h-full hover:cursor-pointer hover:bg-red-400' size={"sm"}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir Acordo
                  </Button>
                )}
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isso excluirá permanentemente o acordo e todos
                  os dados associados a ele.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAcordo}>
                  Sim, excluir acordo
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
      <Tabs value={activeTab} onValueChange={(value) => { handlerChangeFolder(value) }}>
        <TabsList>
          <TabsTrigger value="dados-principal" style={{ color: "#034869" }} className='text-[0.8rem]'>Dados Principais</TabsTrigger>
          <TabsTrigger value="lancamentos" style={{ color: "#034869" }} className='text-[0.8rem]'>Lançamentos</TabsTrigger>
          <TabsTrigger value="boletos" style={{ color: "#034869" }} className='text-[0.8rem]'>Boletos</TabsTrigger>
        </TabsList>

        <TabsContent value="dados-principal" className="space-y-4">
          <Card style={{ color: "#034869" }}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-1xl">
                <span>
                  Informação do Acordo
                </span>
                {(isAdmin ||
                  user?.permissions.includes("ALL") ||
                  user?.permissions.includes("UPDATE_ACORDO")
                ) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      {isEditing ? 'Cancelar' : 'Editar'}
                    </Button>
                  )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AcordoFormRoot
                createAcordoMethods={acordoMethods}
                onSubmitAcordoData={onSubmitAcordoData}
              >
                <AcordoFormContent action='update' createAcordoMethods={acordoMethods} disabled={!isEditing} />
                <div className="mt-4">
                  {!isEditing && (
                    <Button
                      className={(isPortrait ? "hover:bg-[#a9d9ef] hover:cursor-pointer bg-[#034869] hover:text-[#034869] text-white" : "w-full hover:bg-[#a9d9ef] hover:cursor-pointer bg-[#034869] hover:text-[#034869] text-white")}
                      disabled={
                        !acordoMethods.formState.isDirty
                        //|| !acordoMethods.formState.isValid
                      }

                    >
                      Salvar Alterações
                    </Button>
                  )}
                </div>
              </AcordoFormRoot>
            </CardContent>
          </Card>
        </TabsContent>

        {/*Lançamento */}
        <TabsContent value="lancamentos" className="space-y-4">
          {(acordo?.lancamentos && acordo?.lancamentos.length > 0) ? (
            <div className=''>

              <div className='rounded-md border'>
                <div className='grid grid-cols-9 m-2 font-[Poppins-bold]' >
                  <Label className={!isMobile ? 'border-b pb-5' : 'border-b pb-5 col-span-2'} style={{ 'fontSize': '0.7rem' }}>Descrição</Label>
                  {!isMobile ? (<Label className='border-b pb-5' style={{ 'fontSize': '0.7rem' }}>Emissão</Label>) : (<></>)}
                  <Label className='border-b  pb-5' style={{ 'fontSize': '0.7rem' }}>Vencimento</Label>
                  <Label className='flex justify-end border-b pb-5' style={{ 'fontSize': '0.7rem' }}>Valor</Label>
                  <Label className='flex justify-end border-b pb-5' style={{ 'fontSize': '0.7rem' }}>Juros</Label>
                  <Label className='flex justify-end border-b pb-5' style={{ 'fontSize': '0.7rem' }}>Multa</Label>
                  <Label className='flex justify-end border-b pb-5' style={{ 'fontSize': '0.7rem' }}>Desconto</Label>
                  <Label className='flex justify-end border-b pb-5' style={{ 'fontSize': '0.7rem' }}>Valor a Pagar</Label>
                  <Label className='border-b pb-5' style={{ 'fontSize': '0.7rem' }}></Label>
                </div>

                <div className='grid grid-cols-9 m-2' >
                  {acordo?.lancamentos.map((lancamento) => (
                    <>
                      <Label className={!isMobile ? 'flex items-center' : 'flex items-center col-span-2'} style={{ 'fontSize': '0.7rem' }}>{lancamento.descricao}</Label>
                      {!isMobile ? (<Label className='flex items-center' style={{ 'fontSize': '0.7rem' }}>{moment.utc(lancamento.dataLancamento).format("DD/MM/YYYY")}</Label>) : (<></>)}
                      {!isMobile ? (<Label className='flex items-center' style={{ 'fontSize': '0.7rem' }}>{moment.utc(lancamento.dataVencimento).format("DD/MM/YYYY")}</Label>) : (<></>)}
                      <Label className='flex items-center justify-end' style={{ 'fontSize': '0.7rem' }}>{lancamento.valorOriginal.toLocaleString('pt-BR')}</Label>
                      <Label className='flex items-center justify-end' style={{ 'fontSize': '0.7rem' }}>{lancamento.juros ? lancamento.juros.toLocaleString('pt-BR') : 0}</Label>
                      <Label className='flex items-center justify-end' style={{ 'fontSize': '0.7rem' }}>{lancamento.multa ? lancamento.multa.toLocaleString('pt-BR') : 0}</Label>
                      <Label className='flex items-center justify-end' style={{ 'fontSize': '0.7rem' }}>{lancamento.desconto ? lancamento.desconto.toLocaleString('pt-BR') : 0}</Label>
                      <Label className='flex justify-end items-center' style={{ 'fontSize': '0.7rem' }}>{
                        (lancamento.valorOriginal +
                          (lancamento.juros ? lancamento.juros : 0) +
                          (lancamento.multa ? lancamento.multa : 0) -
                          (lancamento.desconto ? lancamento.desconto : 0)
                        ).toLocaleString('pt-BR')
                      }</Label>
                      <div className='flex justify-center'>
                        {((isAdmin ||
                          user?.permissions.includes("ALL") ||
                          user?.permissions.includes("UPDATE_LOCACAO_LANCAMENTO")
                        ) && (acordo?.status === BoletoStatus.PENDENTE)) && (
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

                              <Dialog
                                open={isExcDialogOpen}
                                onOpenChange={(value) => {
                                  setIsExcDialogOpen(value)
                                }}>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="icon" onClick={(e) => {
                                    e.stopPropagation()
                                    //setSelectedTipo(tipo)
                                  }
                                  } title='Excluir Lançamento'>
                                    <Trash2 className="h-4 w-4" />

                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Você tem certeza?</DialogTitle>
                                    <DialogDescription>
                                      Isso excluir o lançamento da locação
                                    </DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter>
                                    <Button onClick={() => { setIsExcDialogOpen(false) }}>Cancelar</Button>
                                    <Button onClick={() => { handleDeleteLancamento(lancamento.id) }}>
                                      Sim, excluir o lançamento.
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </>
                          )}
                        {(acordo?.status === BoletoStatus.CONFIRMADO) && (
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
                              <Info className="h-4 w-4" />
                            </Button>

                          </>
                        )}
                      </div>
                    </>
                  ))}
                </div>
              </div>

              {/*Tela de lançamentos */}
              <Dialog
                open={isLanctoDialogOpen}
                onOpenChange={(value) => {
                  setIsLanctoDialogOpen(value)
                  if (!value) {
                    setTitulo("Criar novo lançamento");
                    //lancamentoMethods.reset(defaultValues);
                  }
                }}
              >
                <DialogContent onInteractOutside={(e) => e.preventDefault()}>
                  <DialogHeader>
                    <DialogTitle>{titulo}</DialogTitle>
                    {!selBoleto && (
                      <DialogDescription>{titulo.includes('novo') ? 'Preencha os dados do novo lançamento abaixo.' : ''}</DialogDescription>
                    )}
                  </DialogHeader>
                  <form onSubmit={lancamentoMethods.handleSubmit(onSubmitLancamentoData)}>

                    {!selBoleto && (
                      <div className='mt-3'>
                        {(boletoLancamento.fields.length > 0) ? (
                          <>
                            <Label className='text-base' >Boleto</Label>
                            <div className="flex items-center">
                              {boletoLancamento.fields.map((field, index) => (
                                <div className='flex justify-between items-center gap-2 mt-2 border-solid border-2 border-gray-250 rounded p-1'>
                                  <Label >{field.nome}</Label>
                                  <button disabled={!isEditing}
                                    className='border bg-zinc-200 hover:bg-zinc-400'
                                    type="button"
                                    onClick={() => {
                                      lancamentoMethods.setValue('boletoBancarioId', 0, { shouldDirty: false, shouldValidate: false });
                                      boletoLancamento.remove(index);
                                    }}
                                  >

                                    <X className='px-1'></X>
                                  </button>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center">
                            <Button type='button'
                              className="hover:bg-[#a9d9ef] hover:cursor-pointer bg-[#034869] hover:text-[#034869] text-white h-5"
                              onClick={() => {
                                handlerSelBoleto()
                              }}
                            >Selecionar boletos</Button>
                          </div>
                        )}
                      </div>
                    )}
                    {(!selBoleto && !!acordoMethods?.formState?.errors?.imovelId?.message) && (
                      acordoMethods.formState?.errors?.imovelId?.message && <p style={{ color: '#ed535d', fontSize: '0.8rem' }}>* {acordoMethods.formState?.errors?.imovelId?.message}</p>
                    )}
                    {/*Seleção de boletos */}
                    {selBoleto && (
                      <div className='h-full border' style={{ color: "#034869" }}>
                        <div className="flex  justify-end">
                          <Button onClick={() => { handleSelectedBoleto(undefined) }}
                            className='w-4 h-8 -top-5 -right-5 relative rounded-full bg-transparent text-black bg-zinc-200 hover:bg-zinc-400'>X</Button>
                        </div>
                        <div>
                          <h1 className='flex items-center justify-center font-bold'>Selecionar Boleto</h1>
                        </div>
                        <div className='mt-2 h-120'>
                          <ListarBoletosBancarios limitView={1} exclude='' txtVinc='Selecionar' onSelectBoleto={handleSelectedBoleto} />
                        </div>
                      </div>
                    )}

                    {!selBoleto && (
                      <div>
                        <div className='mt-2'>
                          <Label htmlFor="description">Descrição
                            <Input
                              type='text'
                              disabled={!isEditing}
                              placeholder="Descrição"
                              {...lancamentoMethods.register('descricao')}
                            />
                            {lancamentoMethods.formState?.errors?.descricao?.message && <p style={{ color: 'red', fontSize: '0.8rem' }}>*{lancamentoMethods.formState?.errors?.descricao?.message}</p>}
                          </Label>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-3">
                          <Label className="text-base">
                            Valor do Boleto
                            <Input
                              type="number"
                              step={'any'}
                              className="mt-1"
                              disabled={!isEditing}
                              placeholder="Valor do Boleto"
                              {...lancamentoMethods.register('valorOriginal')}
                              onBlur={handlerValorLancamento}
                            />
                            {lancamentoMethods.formState?.errors?.valorOriginal?.message && <p style={{ color: '#f26871', fontSize: '0.8rem' }}>* {lancamentoMethods.formState?.errors?.valorOriginal?.message}</p>}
                          </Label>
                          <Label className="text-base">
                            Valor dos juros
                            <Input
                              type="number"
                              step={'any'}
                              className="mt-1"
                              disabled={!isEditing}
                              placeholder="Juros"
                              {...lancamentoMethods.register('juros')}
                              onBlur={handlerValorLancamento}
                            />
                            {lancamentoMethods.formState?.errors?.juros?.message && <p style={{ color: '#f26871', fontSize: '0.8rem' }}>* {lancamentoMethods.formState?.errors?.juros?.message}</p>}
                          </Label>
                          <Label className="text-base">
                            Valor da multa
                            <Input
                              type="number"
                              step={'any'}
                              className="mt-1"
                              disabled={!isEditing}
                              placeholder="Multa"
                              {...lancamentoMethods.register('multa')}
                              onBlur={handlerValorLancamento}
                            />
                            {lancamentoMethods.formState?.errors?.multa?.message && <p style={{ color: '#f26871', fontSize: '0.8rem' }}>* {lancamentoMethods.formState?.errors?.multa?.message}</p>}
                          </Label>
                          <Label className="text-base">
                            Valor do Desconto
                            <Input
                              type="number"
                              step={'any'}
                              className="mt-1"
                              disabled={!isEditing}
                              placeholder="Desconto"
                              {...lancamentoMethods.register('desconto')}
                              onBlur={handlerValorLancamento}
                            />
                            {lancamentoMethods.formState?.errors?.desconto?.message && <p style={{ color: '#f26871', fontSize: '0.8rem' }}>* {lancamentoMethods.formState?.errors?.desconto?.message}</p>}
                          </Label>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-2">
                          <Label className="text-base">
                            Valor do Lançamento
                            <Input
                              type="number"
                              step={'any'}
                              className="mt-1"
                              disabled={!isEditing}
                              placeholder="Valor do Lançamento"
                              {...lancamentoMethods.register('valorLancamento')}
                            />
                            {lancamentoMethods.formState?.errors?.valorLancamento?.message && <p style={{ color: '#f26871', fontSize: '0.8rem' }}>* {lancamentoMethods.formState?.errors?.valorLancamento?.message}</p>}
                          </Label>
                          <Label className="text-base">
                            Data do Lançamento
                            <Input
                              type='date'
                              className="mt-2"
                              disabled={!isEditing}
                              placeholder="Data do lançamento"
                              {...lancamentoMethods.register('dataLancamento')}
                            />
                            {lancamentoMethods.formState?.errors?.dataLancamento?.message && <p style={{ color: 'red', fontSize: '0.8rem' }}>*{lancamentoMethods.formState?.errors?.dataLancamento?.message}</p>}
                          </Label>
                        </div>

                        <DialogFooter className='mt-2'>
                          {(isEditing || titulo.includes('novo')) && (
                            <Button size={"sm"} type='submit'
                              disabled={!lancamentoMethods.formState.isDirty ||
                                !lancamentoMethods.formState.isValid}
                              className="hover:bg-[#a9d9ef] hover:cursor-pointer bg-[#034869] hover:text-[#034869] text-white">
                              {titulo.includes('novo') ? 'Criar lançamento' : 'Confirmar Alteração'}</Button>
                          )}
                        </DialogFooter>
                      </div>
                    )}
                  </form>
                </DialogContent>
              </Dialog>

            </div>

          ) : (
            <p className="text-center text-muted-foreground">
              Nenhum lançamento para essa locação nesse período.
            </p>
          )}
        </TabsContent>

        {/* Boletos */}
        <TabsContent value="boletos" className="space-y-4">
          {(acordo?.lancamentos && acordo?.lancamentos.length > 0) ? (
            <div className=''>
              <div className='rounded-md border'>
                <div className='grid grid-cols-9 m-2 font-[Poppins-bold]' >
                  <Label className={!isMobile ? 'border-b pb-5' : 'border-b pb-5 col-span-2'} style={{ 'fontSize': '0.7rem' }}>Descrição</Label>
                  {!isMobile ? (<Label className='border-b pb-5' style={{ 'fontSize': '0.7rem' }}>Emissão</Label>) : (<></>)}
                  <Label className='border-b  pb-5' style={{ 'fontSize': '0.7rem' }}>Vencimento</Label>
                  <Label className='flex justify-end border-b pb-5' style={{ 'fontSize': '0.7rem' }}>Valor</Label>
                  <Label className='flex justify-end border-b pb-5' style={{ 'fontSize': '0.7rem' }}>Juros</Label>
                  <Label className='flex justify-end border-b pb-5' style={{ 'fontSize': '0.7rem' }}>Multa</Label>
                  <Label className='flex justify-end border-b pb-5' style={{ 'fontSize': '0.7rem' }}>Desconto</Label>
                  <Label className='flex justify-end border-b pb-5' style={{ 'fontSize': '0.7rem' }}>Valor a Pagar</Label>
                  <Label className='border-b pb-5' style={{ 'fontSize': '0.7rem' }}></Label>
                </div>

                <div className='grid grid-cols-9 m-2' >
                  {acordo?.lancamentos.map((lancamento) => (
                    <>
                      <Label className={!isMobile ? 'flex items-center' : 'flex items-center col-span-2'} style={{ 'fontSize': '0.7rem' }}>{lancamento.descricao}</Label>
                      {!isMobile ? (<Label className='flex items-center' style={{ 'fontSize': '0.7rem' }}>{moment.utc(lancamento.dataLancamento).format("DD/MM/YYYY")}</Label>) : (<></>)}
                      {!isMobile ? (<Label className='flex items-center' style={{ 'fontSize': '0.7rem' }}>{moment.utc(lancamento.dataVencimento).format("DD/MM/YYYY")}</Label>) : (<></>)}
                      <Label className='flex items-center justify-end' style={{ 'fontSize': '0.7rem' }}>{lancamento.valorOriginal.toLocaleString('pt-BR')}</Label>
                      <Label className='flex items-center justify-end' style={{ 'fontSize': '0.7rem' }}>{lancamento.juros ? lancamento.juros.toLocaleString('pt-BR') : 0}</Label>
                      <Label className='flex items-center justify-end' style={{ 'fontSize': '0.7rem' }}>{lancamento.multa ? lancamento.multa.toLocaleString('pt-BR') : 0}</Label>
                      <Label className='flex items-center justify-end' style={{ 'fontSize': '0.7rem' }}>{lancamento.desconto ? lancamento.desconto.toLocaleString('pt-BR') : 0}</Label>
                      <Label className='flex justify-end items-center' style={{ 'fontSize': '0.7rem' }}>{
                        (lancamento.valorOriginal +
                          (lancamento.juros ? lancamento.juros : 0) +
                          (lancamento.multa ? lancamento.multa : 0) -
                          (lancamento.desconto ? lancamento.desconto : 0)
                        ).toLocaleString('pt-BR')
                      }</Label>
                      <div className='flex justify-center'>
                        {(isAdmin ||
                          user?.permissions.includes("ALL") ||
                          user?.permissions.includes("UPDATE_LOCACAO_LANCAMENTO")
                        ) && (
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

                              <Dialog
                                open={isExcDialogOpen}
                                onOpenChange={(value) => {
                                  setIsExcDialogOpen(value)
                                }}>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="icon" onClick={(e) => {
                                    e.stopPropagation()
                                    //setSelectedTipo(tipo)
                                  }
                                  } title='Excluir Lançamento'>
                                    <Trash2 className="h-4 w-4" />

                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Você tem certeza?</DialogTitle>
                                    <DialogDescription>
                                      Isso excluir o lançamento da locação
                                    </DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter>
                                    <Button onClick={() => { setIsExcDialogOpen(false) }}>Cancelar</Button>
                                    <Button onClick={() => { handleDeleteLancamento(lancamento.id) }}>
                                      Sim, excluir o lançamento.
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </>
                          )}
                        {(acordo?.status === BoletoStatus.CONFIRMADO) && (
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
                              <Info className="h-4 w-4" />
                            </Button>

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
        </TabsContent>
      </Tabs>
    </div>
  )
}
function watch(arg0: string) {
  throw new Error('Function not implemented.')
}

