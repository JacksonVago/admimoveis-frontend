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
import { transformNullToUndefined } from '@/utils/transform-null-to-undefined'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Edit, Link2Off, Mail, Phone, Trash2 } from 'lucide-react'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
//import { PessoaStatus } from '@/enums/pessoal/status-pesoa'
//import { Pessoa } from '@/interfaces/pessoa'
import {
  PropImovelSchema, propImoveSchema,
  //ProprietarioSchema, 
  proprietarioSchema
} from '@/schemas/proprietario.schema'
/*import { ImovelStatus } from '@/enums/imovel/enums-imovel'
import { Imovel } from '@/interfaces/imovel'
import { Proprietario } from '@/interfaces/proprietario'
import { GarantiaLocacao, LocacaoStatus } from '@/enums/locacao/enums-locacao'*/
import { locacaoSchema, LocacaoSchema } from '@/schemas/locacao.schema'
import { Locacao } from '@/interfaces/locacao'
import { LocacaoFormContent, LocacaoFormRoot } from '../components/tipo-form';
import { useMediaQuery } from 'react-responsive';
import moment from 'moment';
//import { Locatario } from '@/interfaces/locatario';

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

export const DetalhesLocacaoForm = ({
  //id,
  desvincularlocacaoImovel
}: {
  //id: number
  disabled?: boolean
  desvincularlocacaoImovel?: () => void
}) => {

  const navigate = useNavigate()

  const isPortrait = useMediaQuery({ query: '(min-width: 1224px)' })
  /*const isBigScreen = useMediaQuery({ query: '(min-width: 1824px)' })
  const isTablet = useMediaQuery({ query: '(min-width: 746px)' })
  const isMobile = useMediaQuery({ query: '(min-width: 400px)' })*/

  const [isEditingPersonalInfo, setIsEditingPersonalInfo] = React.useState(false)
  const disabled = isEditingPersonalInfo

  const dataParams = useParams<{ id: string }>();
  const id = dataParams.id ? parseInt(dataParams.id) : undefined;
  //const params = useParams();

  const { data: locacao } = useQuery({
    queryKey: ['locacao', id],
    queryFn: async () => {
      const { data } = await api.get<Locacao>(`/locacoes/${id}`)
      return data
    },
    enabled: !!id
  })

  const { data: documentFilesData = [], isSuccess: isSuccessDocuments } = useQuery({
    queryKey: ['documentFiles', id, locacao?.documentos],
    queryFn: () => fetchDocumentFiles(locacao?.documentos),
    enabled: !!locacao?.documentos?.length
  })

  const documentFiles = React.useMemo(() => documentFilesData, [isSuccessDocuments])

  /*const createlocacao = useMutation({
    mutationFn: async (data: FormData) => {
      return await api.post<Locacao>(`/locacoes`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },
    onSuccess: () => {
      ;['locacao', 'documentFiles', id].forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] })
      })
    }
  })*/

  /*const updatelocacao = useMutation({
    mutationFn: async (data: FormData) => {
      const dataObject = Object.fromEntries(data.entries());
      const jsonData = JSON.stringify(dataObject);
      console.log(jsonData);
      return await api.put<Locacao>(`/locacoes/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },
    onSuccess: () => {
      ;['locacao', 'documentFiles', id].forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] })
      })
    },
    onError: (error) => {
      // Access the Axios error object here
      if (axios.isAxiosError(error)) {
        // Check if there's a response and data within the error
        if (error.response && error.response.data) {
          console.error('Error message from server:', error.response.data);
          // You can also set this error message to a state to display it in your UI
        } else {
          console.error('Axios error without response data:', error.message);
        }
      } else {
        console.error('Non-Axios error:', error);
      }
    }
  })

  const deletelocacaoMutation = useMutation({
    mutationFn: async () => {
      return await api.delete(`/locacoes/${id}`)
    },
    onSuccess: () => {
      ;['locacao', 'documentFiles', id].forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] })
      })

      toast({
        title: 'locacao excluído com sucesso',
        description: `locacao excluído com sucesso`
      })

      navigate(ROUTE.LOCACOES)
    }
  });*/

  const onSubmitLocacaoData = async (data: LocacaoSchema) => {
    console.log(new Date());

    try {      
      console.log(data);
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
      formData.append('pessoaId', (data.locatarios ? data.locatarios.map(x => { return x.id; }).toString() : ''));

      console.log(new Date());

      //await updatelocacao.mutateAsync(formData)
      console.log(new Date());

      toast({
        title: 'locacao atualizado com sucesso'
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Check if there's a response and data within the error
        if (error.response && error.response.data) {
          const data = error.response.data as { message: string };
          if (data.message.toLowerCase().includes("unauthorized")) {
            navigate(ROUTE.LOGIN);
          }

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

  //default values
  //const enderecoData = transformNullToUndefined(locacao?.imovel?.endereco || {})
  const defaultValues = React.useMemo(
    () => ({
      //...transformNullToUndefined(locacao || {}),
      dataInicio: moment(locacao?.dataInicio).format('YYYY-MM-DD'),
      dataFim: moment(locacao?.dataFim).format('YYYY-MM-DD'),
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
      imoveis: [{ nome: (locacao?.imovel?.description && locacao?.imovel?.description.length > 0 ? locacao?.imovel?.description : locacao?.imovel?.endereco.complemento + ' ' + locacao?.imovel?.endereco.logradouro + ' ' + locacao?.imovel?.endereco.numero), id: locacao?.imovel?.id }],
      tituloCap: (locacao?.garantiaTituloCapitalizacao ? { numeroTitulo: locacao?.garantiaTituloCapitalizacao?.numeroTitulo } : undefined),
      seguroFianca: locacao?.garantiaSeguroFianca ? { numeroSeguro: locacao?.garantiaSeguroFianca?.numeroSeguro } : undefined,
      depCalcao: locacao?.garantiaDepositoCalcao ? { valorDeposito: locacao?.garantiaDepositoCalcao?.quantidadeMeses, quantidadeMeses: locacao?.garantiaDepositoCalcao?.valorDeposito } : undefined,
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
    if (locacao) {
      locacaoMethods.reset(defaultValues) // seta os valores do formulário com os dados do proprietário
    }
    console.log(defaultValues);
  }, [id, locacao, documentFiles])

  /*const handleDeleteProprietario = () => {
    deletelocacaoMutation.mutate()
  }*/

    const result = locacaoSchema.safeParse(defaultValues)
    console.log(result)
  const hasLocatario = !!locacao?.locatarios?.length;

  console.log(locacaoMethods.getValues());
  console.log(locacaoMethods.formState.errors.diaVencimento);

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
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditingPersonalInfo(!isEditingPersonalInfo)}
          >
            <Edit className="mr-2 h-4 w-4" />
            {isEditingPersonalInfo ? 'Cancelar' : 'Editar'}
          </Button>
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
  const navigate = useNavigate()
  //const [formInitialized, setFormInitialized] = React.useState(false) // Controle de inicialização
  const dataParams = useParams<{ id: string }>();
  const id = dataParams.id ? parseInt(dataParams.id) : undefined;
  /*const [proImovelId, setPropImovelId] = React.useState<number>(0);
  const [cotaImovel, setCotaImovel] = React.useState<number>(0);
  const [selImovel, setSelImovel] = React.useState('');
  const [proImovelIdAlt, setPropImovelIdAlt] = React.useState<number>(0);
  const [cotaImovelAlt, setCotaImovelAlt] = React.useState<number>(0);
  const [selImovelAlt, setSelImovelAlt] = React.useState('');
  const [propEdit, setPropEdit] = React.useState<Proprietario>();
  const [locEdit, setLocEdit] = React.useState<Locacao>();
  const [selGarantia, setSelGarantia] = React.useState<GarantiaLocacao>();
  const [selFiador, setSelFiador] = React.useState<boolean>(false);*/

  const { data: locacao } = useQuery({
    queryKey: ['locacao', id],
    queryFn: async () => {
      const { data } = await api.get<Locacao>(`/locacoes/${id}`)
      return data
    },
    enabled: !!id
  })

  console.log(id);
  console.log(locacao);

  /*let imovelStatus = ImovelStatus.DISPONIVEL;

  const { data: imoveisLocacao } = useQuery({
    queryKey: ['locacoes', imovelStatus],
    queryFn: async () => {
      const { data } = await api.get<Imovel[]>(`/imoveis/locacao/?imovelStatus=${imovelStatus}`)
      return data
    },
  })

  const { data } = useQuery({
    queryKey: [],
    queryFn: async () => {
      const response = await api.get<Locacao[]>(`/locacoes`)
      return response.data;
    },
  });*/

  //const fiadores = data?.data || [];

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
      documentos: documentFiles?.filter((doc) => doc !== null)
    }),
    [locacao, documentFiles]
  )

  /*const updatelocacao = useMutation({
    mutationFn: async (data: FormData) => {
      return await api.put<Locacao>(`/locacoes/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },
    onSuccess: () => {
      ;['locacao', 'documentFiles', id].forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] })
      })
    }
  })*/

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

  //react hook form
  const locacaoMethods = useForm<LocacaoSchema>({
    resolver: zodResolver(proprietarioSchema),
    defaultValues,
    mode: 'onBlur'
  })

  const locacaoProp = useForm<PropImovelSchema>({
    resolver: zodResolver(propImoveSchema),
  });

  const locacaoPropAlt = useForm<PropImovelSchema>({
    resolver: zodResolver(propImoveSchema),
  });

  //Lista de imóveis
  /*const locacaoImoveis = useFieldArray({
    control: locacaoMethods.control,
    name: 'imoveis'
  });

  //Lista de locatários
  const locacaoLocatarios = useFieldArray({
    control: locacaoMethods.control,
    name: 'locatarios'
  });

  const locacaoFiadores = useFieldArray({
    control: locacaoMethods.control,
    name: 'fiadores'
  });

  const imovelLocAlt = useForm<LocacaoSchema>({
    resolver: zodResolver(locacaoSchema),
    mode: "onBlur"
  });*/

  React.useEffect(() => {
    if (locacao) {
      locacaoMethods.reset(defaultValues) // seta os valores do formulário com os dados do proprietário
    }
    locacaoProp.reset();
    locacaoPropAlt.reset();
  }, [id, locacao, documentFiles])

  const handleDeleteProprietario = () => {
    deletelocacaoMutation.mutate()
  }

  
  const handlerDetailLocatario = (id: number) => {
    navigate(`${ROUTE.CLIENTES}/${id}`)
  }

  return (
    <div className="container mx-auto space-y-6 p-4 font-[Poppins-regular]">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{locacao?.imovel?.endereco.logradouro}</h1>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className=''>
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir Locação
            </Button>
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
              <AlertDialogAction onClick={handleDeleteProprietario}>
                Sim, excluir locacao
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <Tabs defaultValue="personal-info">
        <TabsList>
          <TabsTrigger value="personal-info" className='text-[0.8rem]'>Dados Locação</TabsTrigger>
          <TabsTrigger value="locatarios" className='text-[0.8rem]'>Locatários</TabsTrigger>
          <TabsTrigger value="fiadores" className='text-[0.8rem]'>Fiadores</TabsTrigger>
        </TabsList>

        <TabsContent value="personal-info" className="space-y-4">
          <DetalhesLocacaoForm />
        </TabsContent>

        {/*locatários */}
        <TabsContent value="locatarios" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Locatários</h2>
          </div>

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
              </CardContent>
            </Card>
          ))}
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
      </Tabs>
    </div>
  )
}
