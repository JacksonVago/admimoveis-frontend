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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ROUTE } from '@/enums/routes.enum'
import { toast } from '@/hooks/use-toast'
import axios from 'axios';
import api from '@/services/axios/api'
import { queryClient } from '@/services/react-query/query-client'
import { transformNullToUndefined } from '@/utils/transform-null-to-undefined'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Edit, Link2Off, Mail, Pencil, Phone, Plus, Search, Trash2, X } from 'lucide-react'
import * as React from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import {
  proprietarioSchema
} from '@/schemas/proprietario.schema'
import { locacaoSchema, LocacaoSchema } from '@/schemas/locacao.schema'
import { Locacao } from '@/interfaces/locacao'
import { LocacaoFormContent, LocacaoFormRoot } from '../components/locacao-form';
import { useMediaQuery } from 'react-responsive';
import moment from 'moment';
import { useAuth } from '@/hooks/auth/use-auth'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { moradorLocacaoSchema, MoradorLocacaoSchema } from '@/schemas/morador.schema'
import { useState } from 'react'
import { Morador } from '@/interfaces/morador'
import { useGlobalParams } from '@/globals/GlobalParams'
import ListarClientes from '../../clientes'
import { Pessoa } from '@/interfaces/pessoa'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TipoLancamento } from '@/interfaces/lancamentotipo'
import { lancamentoSchema, LancamentoSchema } from '@/schemas/lancamentos.schema'
import { BoletoStatus, LancamentoStatus } from '@/enums/locacao/enums-locacao'
import { getEnderecoFormatado } from '@/helpers/get-endereco-formatado'
import { LancamentoLocacao } from '@/interfaces/lancamentos'
import { Calc_DIG_Modulo } from '@/utils/pagseguro-ecrypt'
import { Textarea } from '@/components/ui/textarea'
import { STATUS_LANCAMENTO_OPTIONS } from '@/constants/status-lancamentos'
import { PageLoader } from '@/pages/assistant/page-loader'

// Types
export const getTipos = async (empresaId: number) => {
  return await api.get<TipoLancamento[]>('tipolancamento/' + empresaId)
}

export const getLocacao = async (locacaoId: number) => {
  return await api.get<Locacao>('locacoes/findbyid/' + locacaoId);
}

const fetchDocumentFiles = async (documents: Locacao['documentos']) => {
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

const updateLocacao = async (id: string, data: FormData): Promise<Locacao | any> => {
  return await api.put<Locacao>(`/locacoes/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

//Cria morador da locacao
const createMorador = async (data: FormData): Promise<void> => {
  await api.post<Morador>('/moradores', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

//Excluir morador da locacao
const deleteMorador = async (moradorId: number): Promise<void> => {
  await api.delete(`moradores/${moradorId}`)
}



export const DetalhesLocacaoForm = ({
  //id,
  desvincularlocacaoImovel
}: {
  //id: number
  disabled?: boolean
  desvincularlocacaoImovel?: () => void
}) => {

  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const isPortrait = useMediaQuery({ query: '(min-width: 1224px)' })

  const [isEditingPersonalInfo, setIsEditingPersonalInfo] = React.useState(false)
  const disabled = isEditingPersonalInfo

  const dataParams = useParams<{ id: string }>();
  const id = dataParams.id ? parseInt(dataParams.id) : undefined;
  //const params = useParams();

  //Globals
  const glb_params = useGlobalParams();

  const { data: locacao } = useQuery({
    queryKey: ['locacao', id],
    queryFn: async () => {
      //const { data } = await api.get<Locacao>(`/locacoes/findbyid/${id}`)
      const { data } = await getLocacao(id!);
      return data
    },
    enabled: !!id
  })

  console.log(locacao);

  const { data: documentFilesData = [], isSuccess: isSuccessDocuments } = useQuery({
    queryKey: ['documentFiles', id, locacao?.documentos],
    queryFn: () => fetchDocumentFiles(locacao?.documentos),
    enabled: !!locacao?.documentos?.length
  })

  const documentFiles = React.useMemo(() => documentFilesData, [isSuccessDocuments])

  const updatelocacao = useMutation({
    mutationFn: async (data: FormData) => updateLocacao(id ? id.toString() : '0', data),
    onSuccess: () => {
      ;['locacao', 'documentFiles', id].forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] })
      })
      toast({ title: 'Locação alterada com sucesso' });
      navigate(ROUTE.LOCACOES);
    },
    onError: (error) => {
      // Access the Axios error object here
      if (axios.isAxiosError(error)) {
        // Check if there's a response and data within the error
        if (error.response && error.response.data) {
          console.error('Error message from server:', error.response.data);
          toast({
            title: 'Erro ao atualizar locacao',
            description: error.response.data.message,
          })
        } else {
          console.error('Axios error without response data:', error.message);
        }
      } else {
        console.error('Non-Axios error:', error);
      }
    }
  })

  const onSubmitLocacaoData = async (data: LocacaoSchema) => {
    const formData = new FormData()

    formData.append('dataInicio', moment(data.dataInicio).format('YYYY-MM-DD'));
    formData.append('dataFim', moment(data.dataFim).format('YYYY-MM-DD'));
    formData.append('valorAluguel', (data.valorAluguel ? data.valorAluguel.toString() : '0'));
    formData.append('status', data.status);
    formData.append('imovelId', (data.imovelId ? data.imovelId.toString() : '0'));
    formData.append('diaVencimento', (data.diaVencimento ? data.diaVencimento.toString() : "0"));
    formData.append('garantiaLocacaoTipo', data.garantiaLocacaoTipo);
    formData.append('fiador', (data.fiadores ? data.fiadores.map(x => { return x.id; }).toString() : ''));
    formData.append('numeroTitulo', (data.tituloCap?.numeroTitulo ? data.tituloCap?.numeroTitulo.toString() : '0'));
    formData.append('numeroSeguro', (data.seguroFianca?.numeroSeguro ? data.seguroFianca?.numeroSeguro.toString() : '0'));
    formData.append('valorDeposito', (data.depCalcao?.valorDeposito ? data.depCalcao?.valorDeposito.toString() : '0'));
    formData.append('quantidadeMeses', (data.depCalcao?.quantidadeMeses ? data.depCalcao?.quantidadeMeses.toString() : '0'));
    formData.append('localDeposito', (data.depCalcao?.localDeposito ? data.depCalcao?.localDeposito : ''));
    formData.append('numeroApolice', (data.seguroIncendio?.numeroApolice ? data.seguroIncendio?.numeroApolice.toString() : '0'));
    formData.append('vigenciaInicio', (data.seguroIncendio?.vigenciaInicio ? moment(data.seguroIncendio?.vigenciaInicio).format('YYYY-MM-DD') : ''));
    formData.append('vigenciaFim', (data.seguroIncendio?.vigenciaFim ? moment(data.seguroIncendio?.vigenciaFim).format('YYYY-MM-DD') : ''));
    formData.append('empresaId', data.empresaId ? data.empresaId.toString() : '0');

    const newDocuments = data?.documentos?.filter((doc) => !doc.id)
    newDocuments?.forEach((doc) => {
      formData.append('documentos', doc.file)
    })

    if (data?.documentosToDeleteIds?.length) {
      data.documentosToDeleteIds.forEach((docId) => {
        formData.append('documentosToDeleteIds[]', docId.toString())
      })
    }

    formData.append('pessoaId', (data.locatarios ? data.locatarios.map(x => { return x.id; }).toString() : ''));

    console.log(new Date());

    await updatelocacao.mutateAsync(formData)
  }

  //default values
  //const enderecoData = transformNullToUndefined(locacao?.imovel?.endereco || {})
  const defaultValues = React.useMemo(
    () => ({
      //...transformNullToUndefined(locacao || {}),
      empresaId: locacao?.empresaId,
      dataInicio: moment.utc(locacao?.dataInicio).format('YYYY-MM-DD'),
      dataFim: moment.utc(locacao?.dataFim).format('YYYY-MM-DD'),
      valorAluguel: locacao?.valorAluguel,
      diaVencimento: locacao?.diaVencimento,
      status: locacao?.status || 'ATIVA',
      documentos: documentFiles?.filter((doc) => doc !== null),
      garantiaLocacaoTipo: locacao?.garantiaLocacaoTipo,
      imovelId: locacao?.imovelId,
      locatarios: locacao?.locatarios ? locacao?.locatarios?.map((locatario) => {
        return { nome: locatario.pessoa?.nome, id: locatario.pessoa?.id }
      }) : undefined,
      fiadores: locacao?.fiadores ? locacao?.fiadores?.map((fiador) => {
        return { nome: fiador.pessoa?.nome, id: fiador.pessoa?.id }
      }) : undefined,
      imoveis: [{ nome: locacao?.imovel?.description, id: locacao?.imovel?.id }],
      tituloCap: (locacao?.garantiaTituloCapitalizacao ? { numeroTitulo: locacao?.garantiaTituloCapitalizacao?.numeroTitulo } : undefined),
      seguroFianca: locacao?.garantiaSeguroFianca ? { numeroSeguro: locacao?.garantiaSeguroFianca?.numeroSeguro } : undefined,
      depCalcao: locacao?.garantiaDepositoCalcao ? { valorDeposito: locacao?.garantiaDepositoCalcao?.quantidadeMeses, quantidadeMeses: locacao?.garantiaDepositoCalcao?.valorDeposito, localDeposito: locacao?.garantiaDepositoCalcao.localDeposito } : undefined,
      seguroIncendio: locacao?.seguroIncendio ? { numeroApolice: locacao?.seguroIncendio?.numeroApolice, vigenciaInicio: moment.utc(locacao?.seguroIncendio?.vigenciaInicio).format('YYYY-MM-DD'), vigenciaFim: moment.utc(locacao?.seguroIncendio?.vigenciaFim).format('YYYY-MM-DD') } : undefined,
    }),
    [locacao, documentFiles]
  )

  //react hook form

  const locacaoMethods = useForm<LocacaoSchema>({
    resolver: zodResolver(locacaoSchema),
    defaultValues,
    mode: 'onBlur'
  })

  React.useEffect(() => {
    if (glb_params.pastaOrig === '') {
      glb_params.updPastaOrig('personal-info');
    }

    if (locacao) {
      locacaoMethods.reset(defaultValues) // seta os valores do formulário com os dados do proprietário
    }
    console.log(defaultValues);
  }, [id, locacao, documentFiles])


  const result = locacaoSchema.safeParse(defaultValues)
  console.log(result)
  const hasLocatario = !!locacao?.locatarios?.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-1xl">
          <span>
            Informação da Locação
            {desvincularlocacaoImovel && hasLocatario && (
              <Button variant="destructive" type="button" onClick={desvincularlocacaoImovel}>
                <Link2Off className="mr-2 h-4 w-4" />
                Desvincular Propriedade
              </Button>
            )}
          </span>
          {(isAdmin ||
            user?.permissions.includes("ALL") ||
            user?.permissions.includes("UPDATE_LOCACAO")
          ) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingPersonalInfo(!isEditingPersonalInfo)}
              >
                <Edit className="mr-2 h-4 w-4" />
                {isEditingPersonalInfo ? 'Cancelar' : 'Editar'}
              </Button>
            )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <LocacaoFormRoot
          createLocacaoMethods={locacaoMethods}
          onSubmitLocacaoData={onSubmitLocacaoData}
        >
          <LocacaoFormContent createLocacaoMethods={locacaoMethods} disabled={!disabled} />
          <div className="mt-4">
            {disabled && (
              <Button

                className={(isPortrait ? "" : "w-full")}
                disabled={
                  !locacaoMethods.formState.isDirty
                  //|| !locacaoMethods.formState.isValid
                }
              >
                Salvar Alterações
              </Button>
            )}
          </div>
        </LocacaoFormRoot>
      </CardContent>
    </Card>
  )
}

export default function DetalhesLocacao() {
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
  const [activeTab, setActiveTab] = useState('personal-info')
  const [dataInicial, setdataInicial] = useState(moment(new Date()).format("YYYY-MM-DD"));
  const [dataFinal, setdataFinal] = useState(moment(new Date()).format("YYYY-MM-DD"));
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
  const [isEditing, setIsEditing] = React.useState(false)
  const [titulo, setTitulo] = React.useState("Criar novo lançamento")
  const disabled = isEditing


  const { data: locacao, isLoading } = useQuery({
    queryKey: ['locacao', id],
    queryFn: async () => {
      try {
      const  data = await api.get<Locacao>(`/locacoes/findbyid/${id}`)
      return data.data;
      }
      catch (error) {
        console.error(error);
        throw error;
      }
    },
    enabled: !!id
  })

  //Consulta Tipo lanacmento
  const {
    data: tipolancamento
  } = useQuery({
    queryKey: ['tipolancamento'],
    queryFn: () => getTipos(glb_params.id_empresa ? Number(glb_params.id_empresa) : 0),
  });

  console.log(id);
  console.log(locacao);

  //Dados do proprietário schema de validação
  const locacaoMorador = useForm<MoradorLocacaoSchema>({
    resolver: zodResolver(moradorLocacaoSchema),
  });

  //Morador lista 
  const {
    control: CTLmoradorLocacao,
  } = locacaoMorador;

  const moradoresLocacao = useFieldArray({
    control: CTLmoradorLocacao,
    name: 'moradores'
  });

  const { data: documentFilesData = [], isSuccess: isSuccessDocuments } = useQuery({
    queryKey: ['documentFiles', id, locacao?.documentos],
    queryFn: () => fetchDocumentFiles(locacao?.documentos),
    enabled: !!locacao?.documentos?.length
  })

  const documentFiles = React.useMemo(() => documentFilesData, [isSuccessDocuments])

  //default values
  const enderecoData = transformNullToUndefined(locacao?.imovel?.endereco || {})
  const defaultValues = React.useMemo(
    () => ({
      ...transformNullToUndefined(locacao || {}),
      logradouro: enderecoData?.logradouro,
      numero: enderecoData?.numero ? parseInt(enderecoData.numero) : undefined,
      complemento: enderecoData?.complemento,
      bairro: enderecoData?.bairro,
      cidade: enderecoData?.cidade,
      cep: enderecoData?.cep,
      estado: enderecoData?.estado,
      documentos: documentFiles?.filter((doc) => doc !== null),
      dataInicial: moment.utc(locacao?.dataInicio).format("YYYY-MM-DD")
    }),
    [locacao, documentFiles]
  )

  //default values
  const defaultValuesLan = React.useMemo(
    () => ({
      id: 0,
      locacaoId: locacao?.id,
      dataLancamento: moment.utc(new Date()).format("YYYY-MM-DD"),
      vencimentoLancamento: moment.utc(calcVencimento()).format("YYYY-MM-DD"),
      parcela: 1,
      status: LancamentoStatus.ABERTO,
    }),
    [locacao]
  )

  //Calcula data de vencimento
  function calcVencimento() {
    let dt_hoje = new Date();
    let dt_vencto = new Date();
    let int_ano = dt_hoje.getFullYear();
    let int_mes = dt_hoje.getMonth() + 1;

    if (locacao) {
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
  }
  //react hook form
  const locacaoMethods = useForm<LocacaoSchema>({
    resolver: zodResolver(proprietarioSchema),
    defaultValues,
    mode: 'onBlur'
  })

  //react hook form
  const lancamentoMethods = useForm<LancamentoSchema>({
    resolver: zodResolver(lancamentoSchema),
    defaultValues: defaultValuesLan,
    mode: 'all'
  });
  
  const moradorLocacao = useForm<MoradorLocacaoSchema>({
    resolver: zodResolver(moradorLocacaoSchema),
  });

  const deletelocacaoMutation = useMutation({
    mutationFn: async () => {
      return await api.delete(`/locacoes/${id}`)
    },
    onSuccess: () => {
      ;['locacao', 'documentFiles', id].forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] })
      })

      toast({
        title: 'locacao excluída com sucesso',
        description: `locacao excluída com sucesso`
      })

      navigate(ROUTE.LOCACOES);
    }
  })

  //Criar morador
  const linkMoradorMutation = useMutation({
    mutationFn: ({ data }: { data: FormData }) => createMorador(data),
    onSuccess: () => {
      ;['locacao', id].forEach((key) =>
        queryClient.invalidateQueries({
          queryKey: [key]
        })
      );
      toast({ title: 'Morador vinculado com sucesso' });
      setOpenCli(false);
    },
    onError: () => {
      toast({ title: 'Erro ao vincular morador', variant: 'destructive' })
    }
  })

  //Excluir morador
  const unlinkMoradorMutation = useMutation({
    mutationFn: (moradorId: number) => deleteMorador(moradorId),
    onSuccess: () => {
      ['locacao', id].forEach((key) =>
        queryClient.invalidateQueries({
          queryKey: [key]
        })
      );
      toast({ title: 'Morador desvinculado com sucesso' })
    },
    onError: () => {
      toast({ title: 'Erro ao desvincular morador', variant: 'destructive' })
    }
  })

  React.useEffect(() => {
    if (locacao) {
      locacaoMethods.reset(defaultValues) // seta os valores do formulário com os dados do proprietário
    }
    moradorLocacao.reset();
  }, [id, locacao, documentFiles])

  const handleDeleteLocacao = () => {
    deletelocacaoMutation.mutate()
  }

  const handlerDetailLocatario = (id: number) => {
    navigate(`${ROUTE.CLIENTES}/${id}`)
  }

  //Novo proprietário
  const handlerNewMorador = () => {
    moradorLocacao.reset();
    moradorLocacao.setValue('locacaoId', id!);
    if (moradoresLocacao.fields.length > 0) {
      moradoresLocacao.remove(0);
    }
    setOpenCli(!openCli);
  }

  //Validação dos dados do morador
  function handleSubmitMorador(data: MoradorLocacaoSchema) {
    console.log(data);

    const formData = new FormData();

    if (moradoresLocacao.fields.length === 0) {
      moradorLocacao.setValue('pessoaId', 0);
      return false;
    }
    else {
      moradorLocacao.setValue('pessoaId', moradoresLocacao.fields[0].id);
    }

    formData.append('locacaoId', (id!! ? id.toString() : '0'));
    formData.append('pessoaId', (data.pessoaId ? data.pessoaId.toString() : ""));

    linkMoradorMutation.mutate({ data: formData });
  }

  //Exclusão de morador
  const handleDeleteMorador = (morador: Morador) => {
    unlinkMoradorMutation.mutate(morador.id);
  }

  const handlerSelProp = (origin: string) => {

    glb_params.updOrigin_url("imoveis");
    console.log('seleciona ' + origin);
    switch (origin) {
      case 'moradores':
        if (moradoresLocacao.fields.length > 0) {
          moradoresLocacao.remove(0);
        }
        break;

      /*case 'locacoes':
        if (imovelLocatarios.fields.length > 0) {
          imovelLocatarios.remove(0);
        }
        break;*/
    }
    setSelPessoa(true);

  }

  //Retorno ao selecionar o morador
  const handleSelectMorador = (morador: Pessoa | undefined) => {

    if (morador) {
      console.log(glb_params.pastaOrig);

      switch (glb_params.pastaOrig) {
        case 'moradores':
          if (moradoresLocacao.fields.length === 0) {
            moradoresLocacao.append({
              nome: morador.nome,
              id: morador.id
            });
            moradoresLocacao.fields.map((item, index) => {
              console.log(item.nome);
              console.log(index);
            });
            console.log(morador);
            moradorLocacao.setValue('pessoaId', morador.id);
            moradorLocacao.setValue('locacaoId', id!);
          }
          if (glb_params.origin_url === 'locacoes') {
            setOpenCli(true);
          }
          break;

        /*case 'locacoes':

          if (imovelLocatarios.fields.length === 0) {
            imovelLocatarios.append({
              nome: proprietario.nome,
              id: proprietario.id
            });
            imovelLocatarios.fields.map((item, index) => {
              console.log(item.nome);
              console.log(index);
            })

            locacaoMethods.setValue('status', LocacaoStatus.AGUARDANDO_DOCUMENTOS);
            locacaoMethods.setValue('imovelId', (id! ? id : 0));
            locacaoMethods.setValue('valorAluguel', (imovel?.valorAluguel ? imovel?.valorAluguel : 0))
            //locacaoMethods.setValue('pessoaId', proprietario.id);
            locacaoMethods.setValue('imovelId', id!);
          }
          if (glb_params.origin_url === 'imoveis') {
            setOpenLoc(true);
          }
          break;*/
      }
      setActiveTab(glb_params.pastaOrig);
    }


    setSelPessoa(false);
  }

  const handlerChangeFolder = (folder: string) => {
    glb_params.updOrigin_url("locacoes");
    glb_params.updId_orig((id! ? id : 0).toString());
    glb_params.updPastaOrig(folder);
    setActiveTab(folder);
  }

  const handlerDetailProp = (id: number) => {
    navigate(`${ROUTE.CLIENTES}/${id}`)
  }

  console.log(moradorLocacao.formState.errors);

  const createLancamento = useMutation({
    mutationFn: async (data: FormData) => {

      return await api.post<LancamentoLocacao>(`/lancamentos`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },
    onSuccess: () => {
      ['locacao', id].forEach((key) => {
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
    deleteLancamento.mutate(idLancamento);
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

  const onSubmitLancamentoDataLan = async (data: LancamentoSchema) => {
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

      if (data?.status) {
        form.append('status', data.status)
      }

      if (data?.tipoId) {
        form.append('tipoId', data.tipoId.toString())
      }

      if (data?.locacaoId) {
        form.append('locacaoId', data.locacaoId.toString())
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

  const handleChangeTipo = (value: string) => {
    let tipo = tipolancamento?.data.find(tipo => tipo.id === Number(value));
    lancamentoMethods.setValue('valorLancamento', Number(tipo?.valorFixo));
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

  const handleEditLancamento = (lancamento: LancamentoLocacao) => {
    setTitulo("Alterar lançamento")
    setIsCreateDialogOpen(true);
    lancamentoMethods.setValue("id", lancamento.id);
    lancamentoMethods.setValue("dataLancamento", moment.utc(lancamento.dataLancamento).format("YYYY-MM-DD"));
    lancamentoMethods.setValue("vencimentoLancamento", moment.utc(lancamento.vencimentoLancamento).format("YYYY-MM-DD"));
    lancamentoMethods.setValue("valorLancamento", lancamento.valorLancamento);
    lancamentoMethods.setValue("observacao", lancamento.observacao);
    lancamentoMethods.setValue("status", lancamento.status);
    lancamentoMethods.setValue("tipoId", lancamento.tipoId);
    lancamentoMethods.setValue("locacaoId", lancamento.locacaoId);
    console.log(lancamentoMethods.getValues());
  }

  const handlerChangeStatus = (status: string) => {
    navigate({
      search: `?status=${status}`
    })
  }

  const usdFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  if (isLoading) return <PageLoader />

  return (
    <div className="container mx-auto space-y-6 p-4 font-[Poppins-regular]">
      <div className="flex items-center justify-between">
        <span className="text-wrap"
          style={
            {
              fontSize: (isBigScreen ? '1.2rem' : isPortrait ? '1rem' : isTablet ? '0.8rem' : isMobile ? '1rem' : '1rem'),
            }}

        >{`${(locacao?.locatarios ? locacao?.locatarios[0]?.pessoa?.nome : '')} - ${locacao?.imovel?.endereco.complemento} ${locacao?.imovel?.condominio.name}`}</span>
        {activeTab === 'personal-info' && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              {(isAdmin ||
                user?.permissions.includes("ALL") ||
                user?.permissions.includes("DELETE_LOCACAO")
              ) && (

                  <Button variant="destructive" className='h-full hover:cursor-pointer hover:bg-red-400' size={"sm"}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir Locação
                  </Button>
                )}
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isso excluirá permanentemente o locacao e todos
                  os dados associados a ele.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteLocacao}>
                  Sim, excluir locacao
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
      <Tabs value={activeTab} onValueChange={(value) => { handlerChangeFolder(value) }}>
        <TabsList>
          <TabsTrigger value="personal-info" className='text-[0.8rem]'>Dados Locação</TabsTrigger>
          <TabsTrigger value="locatarios" className='text-[0.8rem]'>Locatários</TabsTrigger>
          <TabsTrigger value="fiadores" className='text-[0.8rem]'>Fiadores</TabsTrigger>
          <TabsTrigger value="moradores" className='text-[0.8rem]'>Moradores</TabsTrigger>
          <TabsTrigger value="lancamentos" className='text-[0.8rem]'>Lançamentos</TabsTrigger>
          <TabsTrigger value="boletos" className='text-[0.8rem]'>Boletos</TabsTrigger>
        </TabsList>

        <TabsContent value="personal-info" className="space-y-4">
          <DetalhesLocacaoForm />
        </TabsContent>

        {/*locatários */}
        <TabsContent value="locatarios" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Locatários</h2>
          </div>

          <div className={(isPortrait ? "grid gap-4 grid-cols-3" : isTablet ? "grid gap-4 grid-cols-2" : isMobile ? "grid gap-4 grid-cols-1" : "grid gap-4 grid-cols-1")}>
            {locacao?.locatarios?.map((locatario) => (
              <Card key={locatario.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{locatario.pessoa?.nome}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Label className="font-semibold">Dados do Locatário</Label>
                  <div className='grid grid-cols-10 flex justify-items-start'>
                    <div className=''>
                      <Mail className='text-gray-500' />
                    </div>
                    <div className='text-gray-500'>
                      {locatario.pessoa?.email?.toString()}
                    </div>
                  </div>
                  <div className='grid grid-cols-10 flex justify-items-start'>
                    <Phone className='text-gray-500' />
                    <div className='text-gray-500'>
                      {locatario.pessoa?.telefone?.toString()}
                    </div>

                  </div>
                  {(isAdmin ||
                    user?.permissions.includes("ALL") ||
                    user?.permissions.includes("VIEW_PESSOAS")
                  ) && (
                      <div className="grid grid-cols-2 gap-3 flex items-end mt-2">
                        <Button
                          className='col-start-3'
                          variant="secondary"
                          size="sm"
                          onClick={() => { handlerDetailLocatario(locatario.pessoa?.id ? locatario.pessoa?.id : 0) }}
                          style={
                            {
                              fontSize: '0.8rem',
                            }}
                        >
                          Ver detalhes
                        </Button>
                      </div>
                    )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Fiadores */}
        <TabsContent value="fiadores" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[1.3rem]">Fiadores</h2>
          </div>

          {locacao?.fiadores?.map((fiador) => (
            <Card key={fiador.pessoaId}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{fiador.pessoa?.nome}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Label className="font-semibold">Dados do Locatário</Label>
                <div className='grid grid-cols-10 flex justify-items-start'>
                  <div className=''>
                    <Mail className='text-gray-500' />
                  </div>
                  <div className='text-gray-500'>
                    {fiador.pessoa?.email?.toString()}
                  </div>
                </div>
                <div className='grid grid-cols-10 flex justify-items-start'>
                  <Phone className='text-gray-500' />
                  <div className='text-gray-500'>
                    {fiador.pessoa?.telefone?.toString()}
                  </div>

                </div>
                <div className="grid grid-cols-3 gap-4 flex items-end mt-2">
                  <Button
                    className='col-start-3'
                    variant="secondary"
                    size="sm"
                    onClick={() => { handlerDetailLocatario(fiador.pessoaId ? fiador.pessoaId : 0) }}
                    style={
                      {
                        fontSize: '0.8rem',
                      }}
                  >
                    Ver detalhes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Moradores */}
        <TabsContent value="moradores" className="space-y-4 font-[Poppins-regular]">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Moradores</h2>
            {(isAdmin ||
              user?.permissions.includes("ALL") ||
              user?.permissions.includes("DELETE_IMOVEL")
            ) && (

                <Button onClick={handlerNewMorador} size={"sm"}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Morador
                </Button>
              )}
            <Dialog open={openCli} onOpenChange={setOpenCli}>
              <DialogContent>
                <DialogHeader>
                  {!selPessoa && (
                    <>
                      <DialogTitle>Adicionar Novo Morador</DialogTitle>
                      <DialogDescription>
                        Preencha os detalhes do novo morador para esta locação.
                      </DialogDescription>
                    </>
                  )}
                </DialogHeader>

                <form className="space-y-4" onSubmit={moradorLocacao.handleSubmit(handleSubmitMorador)}>
                  {!selPessoa && (
                    <div className="grid grid-cols-1 gap-4 flex items-center">
                      <Button onClick={() => { handlerSelProp('proprietarios') }}>
                        <Search className="mr-2 h-4 w-4" />
                        Moradores
                      </Button>

                      {(
                        moradoresLocacao.fields.length > 0) && (
                          <div className="grid grid-cols-1 gap-4 flex items-center">
                            {moradoresLocacao.fields.map((field, index) => (
                              <div className='flex justify-between items-center gap-2 mt-2 border-solid border-2 border-gray-250 rounded p-1' key={field.id}>
                                <Label >{field.nome}</Label>
                                <button
                                  className='border bg-zinc-200 hover:bg-zinc-400'
                                  type="button"
                                  onClick={() => {
                                    moradorLocacao.setValue('pessoaId', 0);
                                    moradoresLocacao.remove(index);
                                  }}
                                >
                                  <X className='px-1'></X>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      {!!moradorLocacao?.formState?.errors?.pessoaId?.message && (
                        <span>{moradorLocacao?.formState?.errors?.pessoaId?.message}</span>
                      )}

                    </div>
                  )}
                  {selPessoa && (
                    <Card id='teste' className='h-full'>
                      <div className="flex  justify-end">
                        <Button onClick={() => { setSelPessoa(false) }}
                          className='w-8 h-8 rounded-full bg-transparent text-black bg-zinc-200 hover:bg-zinc-400'>X</Button>
                      </div>
                      <CardHeader>
                        <DialogTitle className='flex items-center justify-center'>Selecionar o Morador</DialogTitle>
                      </CardHeader>
                      <CardContent className='mt-2 h-120'>
                        <ListarClientes limitView={1} txtVinc='Selecionar' exclude={locacao && locacao?.moradores ? locacao?.moradores?.map((morador) => { return morador.id }).toString() : ''} onSelectCliente={handleSelectMorador} />
                      </CardContent>
                    </Card>
                  )}
                  <DialogFooter>
                    <Button type="submit" className={(selPessoa ? "hidden" : "dblock")}>Adicionar Morador</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className={(isPortrait ? "grid gap-4 grid-cols-3" : isTablet ? "grid gap-4 grid-cols-2" : isMobile ? "grid gap-4 grid-cols-1" : "grid gap-4 grid-cols-1")}>
            {locacao?.moradores?.map((morador) => (
              <Card key={morador.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{morador.pessoa?.nome}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>

                  <Label className="font-semibold">Dados do Morador</Label>
                  <div className='grid grid-cols-10 flex justify-items-start'>
                    <div className=''>
                      <Mail className='text-gray-500' />
                    </div>
                    <div className='text-gray-500 col-span-9'>
                      {morador.pessoa?.email?.toString()}
                    </div>
                  </div>
                  <div className='grid grid-cols-10 flex justify-items-start'>
                    <Phone className='text-gray-500' />
                    <div className='text-gray-500 col-span-9'>
                      {morador.pessoa?.telefone?.toString()}
                    </div>

                  </div>
                  <div className="grid grid-cols-3 gap-4 flex items-end">
                    {(isAdmin ||
                      user?.permissions.includes("ALL") ||
                      user?.permissions.includes("VIEW_MORADORES")
                    ) && (

                        <Button
                          className='mt-2'
                          variant="secondary"
                          size="sm"
                          onClick={() => { handlerDetailProp(morador.pessoaId) }}
                          style={
                            {
                              fontSize: '0.8rem',
                            }}
                        >
                          Ver detalhes
                        </Button>
                      )}
                  </div>
                  <hr className="border-t border-gray-300 mt-5" />
                </CardContent>
                <CardFooter className="flex justify-end space-x-2">
                  {(isAdmin ||
                    user?.permissions.includes("ALL") ||
                    user?.permissions.includes("DELETE_MORADOR")
                  ) && (

                      <Button variant="destructive" size="sm"
                        onClick={() => { handleDeleteMorador(morador) }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </Button>
                    )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Lançamentos */}
        <TabsContent value="lancamentos" className="space-y-4 font-[Poppins-regular]">
          <div className="flex items-center justify-between">
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

              <div className="flex gap-2">
                <Select onValueChange={(value) => { handlerChangeStatus(value) }}>
                  <SelectTrigger className="h-4 w-[160px]">
                    <SelectValue placeholder="Situação" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_LANCAMENTO_OPTIONS.map((status) => (
                      <SelectItem key={status.label} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* ... other filters ... */}
              </div>

            </div>
          </div>

          {/* lancamentos Grid */}
          <div className="mx-auto w-full rounded-md">
            <Card className='font-[Poppins-regular]'>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <Label className="ml-1 mb-4 mt-8 font-bold">{(locacao?.locatarios ? locacao?.locatarios[0].pessoa?.nome + ' - ' : '') + getEnderecoFormatado(locacao?.imovel?.endereco)}</Label>
                  <Dialog
                    open={isCreateDialogOpen}
                    onOpenChange={(value) => {
                      setIsCreateDialogOpen(value)
                      if (!value) {
                        setTitulo("Criar novo lançamento");
                        lancamentoMethods.reset(defaultValuesLan);
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
                      <form onSubmit={lancamentoMethods.handleSubmit(onSubmitLancamentoDataLan)}>
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
                {(locacao?.lancamentos && locacao.lancamentos.length > 0) ? (
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
                        {locacao.lancamentos?.map((lancamento) => (
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
        </TabsContent>

        {/* Boletos */}
        <TabsContent value="boletos" className="space-y-4 font-[Poppins-regular]">
          {/*<div className="flex items-center justify-between">
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
          </div>*/}

          {/* boletos Grid */}
          <div className="mx-auto w-full rounded-md">
            <Card className='font-[Poppins-regular]'>
              <CardContent>
                {(locacao?.boletos && locacao.boletos.length > 0) ? (
                  <div className=''>

                    <div className='mt-2'>
                      <div className='grid grid-cols-5 m-2 font-[Poppins-bold]' >
                        <Label className={!isMobile ? 'border-b pb-5' : 'border-b pb-5 col-span-2'} style={{ 'fontSize': '0.7rem' }}>Descrição</Label>
                        {!isMobile ? (<Label className='border-b pb-5' style={{ 'fontSize': '0.7rem' }}>Emissão</Label>) : (<></>)}
                        <Label className='border-b  pb-5' style={{ 'fontSize': '0.7rem' }}>Vencimento</Label>
                        <Label className='flex justify-end border-b pb-5' style={{ 'fontSize': '0.7rem' }}>Valor</Label>
                        <Label className='border-b pb-5' style={{ 'fontSize': '0.7rem' }}></Label>
                      </div>

                      <div className='grid grid-cols-5 m-2' >
                        {locacao.boletos?.map((boleto) => (
                          <>
                            <Label className={!isMobile ? 'flex items-center mt-2' : 'flex items-center col-span-2 mt-2'} style={{ 'fontSize': '0.7rem' }}>{boleto.observacao}</Label>
                            {!isMobile ? (<Label className='flex items-center mt-2' style={{ 'fontSize': '0.7rem' }}>{moment.utc(boleto.dataEmissao).format("DD/MM/YYYY")}</Label>) : (<></>)}
                            <Label className='flex items-center  mt-2' style={{ 'fontSize': '0.7rem' }}>{moment.utc(boleto.dataVencimento).format("DD/MM/YYYY")}</Label>
                            <Label className='flex justify-end items-center mt-2' style={{ 'fontSize': '0.7rem' }}>{usdFormatter.format(boleto.valorOriginal)}</Label>
                            <div className='flex justify-center mt-2'>
                              {((isAdmin ||
                                user?.permissions.includes("ALL") ||
                                user?.permissions.includes("UPDATE_LANCAMENTO")
                              ) && boleto.status === BoletoStatus.PENDENTE) && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        //handleEditLancamento(boleto);
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
                                        } title='Excluir Boleto'>
                                          <Trash2 className="h-4 w-4" />

                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Isso excluir o boleto da locação
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => { handleDeleteLancamento(boleto.id) }}>
                                            Sim, excluir o boleto.
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
                    Nenhum boleto para essa locação nesse período.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
