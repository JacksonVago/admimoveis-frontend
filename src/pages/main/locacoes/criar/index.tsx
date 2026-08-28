import { Card, CardContent } from '@/components/ui/card'
import { ROUTE } from '@/enums/routes.enum'
import { toast } from '@/hooks/use-toast'
import { Pessoa } from '@/interfaces/pessoa'
//import { clienteSchema, ClienteSchema } from '@/schemas/cliente.schema'
import axios from 'axios';
import api from '@/services/axios/api'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { LocacaoFormContent, LocacaoFormRoot, LocacaoFormSubmitButton } from '../components/locacao-form'
//import { PessoaStatus } from '@/enums/pessoal/status-pesoa'
import { useGlobalParams, usePessoa } from '@/globals/GlobalParams'
//import { useMediaQuery } from 'react-responsive'
import { LocacaoSchema, locacaoSchema } from '@/schemas/locacao.schema'
import { Locacao } from '@/interfaces/locacao'
import moment from 'moment';

const createLocacao = async (data: FormData): Promise<Locacao | any> => {
  return await api.post<Pessoa>('/locacoes', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export default function CriarLocacao (){
  //{ imovelId }:
    //{ imovelId: number | undefined }) {
  
  /*const isBigScreen = useMediaQuery({ query: '(min-width: 1824px)' })
  const isPortrait = useMediaQuery({ query: '(min-width: 1224px)' })
  const isTablet = useMediaQuery({ query: '(min-width: 746px)' })
  const isMobile = useMediaQuery({ query: '(min-width: 400px)' })*/

  //Globals
  const glb_params = useGlobalParams();
  const { addPessoa } = usePessoa();
  const navigate = useNavigate()

  const locacaoMethods = useForm<LocacaoSchema>({
    resolver: zodResolver(locacaoSchema),
    defaultValues: {
      empresaId: glb_params.id_empresa ? Number(glb_params.id_empresa) : 0,
    },
    mode: 'all'
  })

  /*useEffect(() => {
    locacaoMethods.setValue('imovelId', 0);
  }, [glb_params, pessoa]);*/

  /*
  const createLocacaoMutation = useMutation({
    mutationFn: async (data: FormData) => {
      data.forEach((item) => {
        console.log(item.toString());
      })

      return await api.post<Pessoa>('/pessoas', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    }
  });*/

  const createLocacaoMutation = useMutation({
    mutationFn: ({ data }: { data: FormData }) => createLocacao(data),
    onSuccess: ({ data: clienteData }) => {
      toast({ title: 'Locação criada com sucesso' });

      addPessoa(clienteData);

      if (glb_params.origin_url === 'imoveis') {
        navigate(`${ROUTE.IMOVEIS}/${glb_params.id_orig}`);
      }
      else {
        navigate(ROUTE.LOCACOES);
      }

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

  //locacaoMethods.setValue('imovelId', imovelId ? imovelId : 0);

  console.log('locacaoMethods errors', locacaoMethods.formState.errors)
  console.log('locacaoMethods dirtyFields', locacaoMethods.formState.isDirty)
  console.log('isvalid', locacaoMethods.formState.isValid)

  const onSubmitLocacaoData = async (data: LocacaoSchema) => {
    //try {
    const formData = new FormData()

    formData.append('dataInicio', moment(data.dataInicio).format('YYYY-MM-DD'));
    formData.append('dataFim', moment(data.dataFim).format('YYYY-MM-DD'));
    formData.append('valorAluguel', (data.valorAluguel ? data.valorAluguel.toString() : "0"));
    formData.append('status', data.status);
    formData.append('imovelId', (data.imovelId ? data.imovelId.toString() : '0'));
    formData.append('diaVencimento', (data.diaVencimento ? data.diaVencimento.toString() :"0"));
    formData.append('garantiaLocacaoTipo', data.garantiaLocacaoTipo);
    formData.append('fiador', (data.fiadores ? data.fiadores.map(x => { return x.id; }).toString() : ''));
    formData.append('numeroTitulo', (data.tituloCap?.numeroTitulo ? data.tituloCap?.numeroTitulo.toString() : '0'));
    formData.append('numeroSeguro', (data.seguroFianca?.numeroSeguro ? data.seguroFianca?.numeroSeguro.toString() : '0'));
    formData.append('valorDeposito', (data.depCalcao?.valorDeposito ? data.depCalcao?.valorDeposito.toString() : '0'));
    formData.append('quantidadeMeses', (data.depCalcao?.quantidadeMeses ? data.depCalcao?.quantidadeMeses.toString() : '0'));
    formData.append('localDeposito', (data.depCalcao?.localDeposito ? data.depCalcao?.localDeposito : ''));
    formData.append('numeroApolice', data.seguroIncendio.numeroApolice);
    formData.append('vigenciaInicio', moment(data.seguroIncendio.vigenciaInicio).format('YYYY-MM-DD'));
    formData.append('vigenciaFim', moment(data.seguroIncendio.vigenciaFim).format('YYYY-MM-DD'));
    formData.append('pessoaId', (data.locatarios ? data.locatarios.map(x => { return x.id; }).toString() : ''));
      if (data.empresaId) {
        formData.append('empresaId', data.empresaId.toString())
      }

    console.log(formData.values());


    const newDocuments = data?.documentos?.filter((doc) => !doc.id)
    newDocuments?.forEach((doc) => {
      formData.append('documentos', doc.file)
    })

    if (data?.documentosToDeleteIds?.length) {
      data.documentosToDeleteIds.forEach((docId) => {
        formData.append('documentosToDeleteIds[]', docId.toString())
      })
    }

    createLocacaoMutation.mutate({ data: formData });
  }
  return (
    <div className="mx-auto max-w-screen-xl">
      <Card className='py-10' style={{color:"#034869"}}>
        <CardContent>
          <h2 className="mb-4 mt-8 text-xl font-bold">Criar uma nova Locação</h2>
          <LocacaoFormRoot
            createLocacaoMethods={locacaoMethods}
            onSubmitLocacaoData={onSubmitLocacaoData}
          >
            <LocacaoFormContent createLocacaoMethods={locacaoMethods} />
            <LocacaoFormSubmitButton createLocacaoMethods={locacaoMethods} />
          </LocacaoFormRoot>
        </CardContent>
      </Card>
    </div>
  )
}
