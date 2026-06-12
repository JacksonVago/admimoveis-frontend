import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import {  Edit} from 'lucide-react'
import { useEffect, useState } from 'react'

import { PageLoader } from '@/pages/assistant/page-loader'
import { queryClient } from '@/services/react-query/query-client'
import { transformNullToUndefined } from '@/utils/transform-null-to-undefined'
import {  useParams } from 'react-router-dom'
import { useGlobalParams } from '@/globals/GlobalParams'
import { useAuth } from '@/hooks/auth/use-auth'
import axios from 'axios'
import { alertaSchema, AlertaSchema } from '@/schemas/alerta.schema'
import {  getContaCorrente, updateContaCorrente } from '../requests'
import { ContaCorrenteForm } from '../criarcontacorrente/components/contacorrente-form'
import { useForm } from 'react-hook-form'
import { ContaCorrente } from '@/interfaces/contacorrente'
import { contacorrenteSchema, ContaCorrenteSchema } from '@/schemas/contacorrente.schema'


//Valores default do imóvel
export const getFormattedDefaultValues = (contaCorrente: ContaCorrente | undefined) => {
  return {    
    agencia: contaCorrente?.agencia || undefined,
    conta: contaCorrente?.conta || undefined,
    digito: contaCorrente?.digito || undefined,
    descricao: contaCorrente?.descricao || undefined,
    usuarioBancoAPI: contaCorrente?.usuarioBancoAPI || undefined,
    senhaBancoAPI: contaCorrente?.senhaBancoAPI || undefined,
    chaveAppAPI: contaCorrente?.chaveAppAPI || undefined,
    urlPIX: contaCorrente?.urlPIX || undefined,
    urlBoleto: contaCorrente?.urlBoleto || undefined,
    urlWebhookPIX: contaCorrente?.urlWebhookPIX || undefined,
    urlWebhookBoleto: contaCorrente?.urlWebhookBoleto || undefined,
    status: contaCorrente?.status || undefined,
  }
}

export const DetalhesContaCorrente = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  
  const dataParams = useParams<{ id: string }>()
  const id = dataParams.id ? parseInt(dataParams.id) : undefined

  const [isEditingPersonalInfo, setIsEditingPersonalInfo] = useState(false)
  const [activeTab, setActiveTab] = useState('alerta-info')
  //const [proprietariosSearchQuery, setProprietariosSearchQuery] = useState('')
  //const [locatariosSearchQuery, setLocatariosSearchQuery] = useState('')
  //const [isCreateLocacaoOpen, setIsCreateLocacaoOpen] = useState(false)
  //const [selectedLocatario, setSelectedLocatario] = useState<Locatario | null>(null)
  const { toast } = useToast()


  //Globals
  const glb_params = useGlobalParams();


  //Consulta conta corrente
  const {
    data: contaCorrente,
    isLoading,
    isSuccess
  } = useQuery({
    queryKey: ['contacorrente', id],
    queryFn: () => getContaCorrente(id!)
  });

  const parsedData = transformNullToUndefined(contaCorrente || {})
  console.log('parsedData', parsedData);

  //remove null values from object endereço
  const defaultValues = {
    
    ...parsedData,
    bancoId: contaCorrente?.bancoId.toString() || undefined,
    instrucaoCobId: contaCorrente?.instrucaoCobId.toString() || undefined,
    instrucaoRecId: contaCorrente?.instrucaoRecId.toString() || undefined,
    carteiraId: contaCorrente?.carteiraId.toString() || undefined,
    especieId: contaCorrente?.especieId.toString() || undefined,
    pessoaId: contaCorrente?.pessoaId.toString() || undefined,
    empresaId: contaCorrente?.empresaId,
  }

  console.log('defaultValues', defaultValues);

  //Altera alerta
  const updateMutation = useMutation({
    mutationFn: (data: FormData) => updateContaCorrente(id!, data),
    onSuccess: () => {
      ;['contacorrente', id].forEach((key) =>
        queryClient.invalidateQueries({
          queryKey: [key]
        })
      )
      toast({ title: 'Conta Corrente atualizada com sucesso' })
      setIsEditingPersonalInfo(false)
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        // Check if there's a response and data within the error
        if (error.response && error.response.data) {
          console.error('Error message from server:', error.response.data);
          toast({
            title: 'Erro ao atualizar conta corrente',
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

  //Dados do condomínio schema de validação
  const contaCorrenteMethods = useForm<ContaCorrenteSchema>({
    resolver: zodResolver(contacorrenteSchema),
    mode: 'all',
    defaultValues
  });

  useEffect(() => {
    //setProprietariosSearchQuery('');
    //setLocatariosSearchQuery('');
    glb_params.updTitle_form('Contas Corrente');

    if (glb_params.pastaOrig === '') {
      glb_params.updPastaOrig('alerta-info');
    }
    else {
      //setActiveTab(glb_params.pastaOrig);
    }

  }, [])

  useEffect(() => {
    if (isSuccess) {
      contaCorrenteMethods.reset(defaultValues)
    }

  }, [id, contaCorrente, isSuccess])

  useEffect(() => {
    console.log(glb_params.pastaOrig);
  }, [glb_params])

  //Validade dados do alerta no caso de alteração
  const onSubmitContaCorrenteData = (data: ContaCorrenteSchema) => {

    //form data
    const form = new FormData()

    if (data.agencia) {
      form.append('agencia', data.agencia)
    }

    if (data.conta) {
      form.append('conta', data.conta)
    }

    if (data.digito) {
      form.append('digito', data.digito)
    }

    if (data.descricao) {
      form.append('descricao', data.descricao)
    }

    if (data.usuarioBancoAPI) {
      form.append('usuarioBancoAPI', data.usuarioBancoAPI);
    }

    if (data.senhaBancoAPI) {
      form.append('senhaBancoAPI', data.senhaBancoAPI)
    }

    if (data.chaveAppAPI) {
      form.append('chaveAppAPI', data.chaveAppAPI)
    }

    if (data.urlPIX) {
      form.append('urlPIX', data.urlPIX)
    }

    if (data.urlBoleto) {
      form.append('urlBoleto', data.urlBoleto)
    }

    if (data.urlWebhookPIX) {
      form.append('urlWebhookPIX', data.urlWebhookPIX)
    }

    if (data.urlWebhookBoleto) {
      form.append('urlWebhookBoleto', data.urlWebhookBoleto)
    }

    if (data.status) {
      form.append('status', data.status.toString())
    }

    form.append('bancoId', data.bancoId.toString());
    form.append('instrucaoCobId', data.instrucaoCobId.toString());
    form.append('instrucaoRecId', data.instrucaoRecId.toString());
    form.append('carteiraId', data.carteiraId.toString());
    form.append('especieId', data.especieId.toString());
    form.append('empresaId', glb_params.id_empresa ? glb_params.id_empresa : "0");

    updateMutation.mutate(form)
  }


  const handlerChangeFolder = async (folder: string) => {
    glb_params.updOrigin_url("alertas");
    glb_params.updId_orig((id! ? id : 0).toString());
    glb_params.updPastaOrig(folder);
    setActiveTab(folder);

  }

  if (isLoading) return <PageLoader />

  return (
    <div className="container mx-auto space-y-6 p-4 font-[Poppins-regular]">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Detalhes</h1>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => { handlerChangeFolder(value) }}>
        <TabsList>
          <TabsTrigger value="alerta-info" className='text-[0.7rem] hover:cursor-pointer hover:bg-gray-200'>Dados do alerta</TabsTrigger>
          {/*<TabsTrigger value="imoveis" className='text-[0.7rem] hover:cursor-pointer hover:bg-gray-200'>Imóveis</TabsTrigger>
          <TabsTrigger value="lancamentos" className='text-[0.7rem] hover:cursor-pointer hover:bg-gray-200'>Lançamentos</TabsTrigger>*/}
        </TabsList>

        <TabsContent value="alerta-info" className="space-y-4 font-[Poppins-regular]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-1xl">
                <span>Informações do Alerta</span>
                {(isAdmin ||
                  user?.permissions.includes("ALL") ||
                  user?.permissions.includes("UPDATE_ALERTA")
                ) && (

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingPersonalInfo(!isEditingPersonalInfo)}
                      className='hover:cursor-pointer hover:bg-gray-200'
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      {isEditingPersonalInfo ? 'Cancelar' : 'Editar'}
                    </Button>
                  )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ContaCorrenteForm.Root
                createContaCorrenteMethods={contaCorrenteMethods}
                onSubmitContaCorrenteData={onSubmitContaCorrenteData}
              >
                <ContaCorrenteForm.FormContent
                  createContaCorrenteMethods={contaCorrenteMethods}
                  disabled={!isEditingPersonalInfo}
                />
                <div className="mt-6">
                  {isEditingPersonalInfo && (
                    <Button
                      disabled={//!blocoMethods.formState.isDirty 
                        !contaCorrenteMethods.formState.isDirty || !contaCorrenteMethods.formState.isValid
                      }
                      type="submit"
                    >
                      Salvar Alterações
                    </Button>
                  )}
                </div>
              </ContaCorrenteForm.Root>
            </CardContent>
          </Card>
        </TabsContent>        
      </Tabs>
    </div >
  )
}
