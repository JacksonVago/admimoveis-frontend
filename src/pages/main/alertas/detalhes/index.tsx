import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Edit } from 'lucide-react'
import { useEffect, useState } from 'react'

import { PageLoader } from '@/pages/assistant/page-loader'
import { queryClient } from '@/services/react-query/query-client'
import { transformNullToUndefined } from '@/utils/transform-null-to-undefined'
import { useParams } from 'react-router-dom'
import { useGlobalParams } from '@/globals/GlobalParams'
import { useAuth } from '@/hooks/auth/use-auth'
import axios from 'axios'
import moment from 'moment'
import { alertaSchema, AlertaSchema } from '@/schemas/alerta.schema'
import { ConfiguracaoAlerta } from '@/interfaces/configuracaoalerta'
import { getAlerta, updateAlerta } from '../requests'
import { AlertaForm } from '../criaralerta/components/alerta-form'
import { useForm } from 'react-hook-form'
import { TipoAgendamento } from '@/enums/alertas/TipoAgendamento'


//Valores default do imóvel
export const getFormattedDefaultValues = (configAlerta: ConfiguracaoAlerta | undefined) => {
  return {
    descricao: configAlerta?.descricao || undefined,
    ativo: configAlerta?.ativo || undefined,
    textoAlerta: configAlerta?.textoAlerta || undefined,
    tipoAgendamento: configAlerta?.tipoAgendamento || undefined,
    frequenciaEnvio: configAlerta?.frequenciaEnvio || undefined,
    dataInicio: configAlerta?.dataInicio ? moment(configAlerta.dataInicio).format("YYYY-MM-DD") : undefined,
    ocorreAcada: configAlerta?.ocorreAcada || undefined,
    grupoEnvio: configAlerta?.grupoEnvio || undefined,
    horarioEnvio: configAlerta?.horarioEnvio || undefined,
    tipoIntervaloEnvio: configAlerta?.tipoIntervaloEnvio || undefined,
    intervaloEnvio: configAlerta?.intervaloEnvio || undefined,
    horarioInicial: configAlerta?.horarioInicial || undefined,
    horarioFinal: configAlerta?.horarioFinal || undefined,
    dataInicioEnvio: configAlerta?.dataInicioEnvio ? moment(configAlerta.dataInicioEnvio).format("YYYY-MM-DD") : undefined,
    dataFinalEnvio: configAlerta?.dataFinalEnvio ? moment(configAlerta.dataFinalEnvio).format("YYYY-MM-DD") : undefined,

  }
}

export const DetalhesAlerta = () => {
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


  //Consulta alerta
  const {
    data: alerta,
    isLoading,
    isSuccess
  } = useQuery({
    queryKey: ['alerta', id],
    queryFn: () => getAlerta(id!)
  });

  const parsedData = transformNullToUndefined(alerta || {})
  console.log('parsedData', parsedData);

  //remove null values from object endereço
  const defaultValues = {
    ...parsedData,
    alertaId: alerta?.alertaId || undefined,
    empresaId: alerta?.empresaId,
  }

  console.log('defaultValues', defaultValues);

  //Altera alerta
  const updateMutation = useMutation({
    mutationFn: (data: FormData) => updateAlerta(id!, data),
    onSuccess: () => {
      ;['alerta', 'documentFiles', id].forEach((key) =>
        queryClient.invalidateQueries({
          queryKey: [key]
        })
      )
      toast({ title: 'Alerta atualizado com sucesso' })
      setIsEditingPersonalInfo(false)
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        // Check if there's a response and data within the error
        if (error.response && error.response.data) {
          console.error('Error message from server:', error.response.data);
          toast({
            title: 'Erro ao atualizar alerta',
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
  const alertaMethods = useForm<AlertaSchema>({
    resolver: zodResolver(alertaSchema),
    mode: 'all',
    defaultValues
  });

  useEffect(() => {
    //setProprietariosSearchQuery('');
    //setLocatariosSearchQuery('');
    glb_params.updTitle_form('Alertas');

    if (glb_params.pastaOrig === '') {
      glb_params.updPastaOrig('alerta-info');
    }
    else {
      //setActiveTab(glb_params.pastaOrig);
    }

  }, [])

  useEffect(() => {
    if (isSuccess) {
      alertaMethods.reset(defaultValues)
    }

  }, [id, alerta, isSuccess])

  useEffect(() => {
    console.log(glb_params.pastaOrig);
  }, [glb_params])

  //Validade dados do alerta no caso de alteração
  const onSubmitAlertaData = (data: AlertaSchema) => {

    //form data
    const form = new FormData()

    if (data.descricao) {
      form.append('descricao', data.descricao)
    }

    if (data.ativo) {
      form.append('ativo', data.ativo.toString());
    }

    if (data.textoAlerta) {
      form.append('textoAlerta', data.textoAlerta.toString())
    }

    if (data.tipoAgendamento) {
      form.append('tipoAgendamento', data.tipoAgendamento.toString())
    }

    if (data.frequenciaEnvio) {
      form.append('frequenciaEnvio', data.frequenciaEnvio.toString())
    }

    if (data.tipoAgendamento && data.tipoAgendamento === TipoAgendamento.UNICO) {
      if (data.tipoAgendamento === TipoAgendamento.UNICO) {
        if (data.dataInicio) {
          form.append('dataInicio', data.dataInicio.toString())
        }
      }

    }

    if (data.ocorreAcada) {
      form.append('ocorreAcada', data.ocorreAcada.toString())
    }

    if (data.grupoEnvio) {
      form.append('grupoEnvio', data.grupoEnvio.toString())
    }

    if (data.horarioEnvio) {
      form.append('horarioEnvio', data.horarioEnvio.toString())
    }

    if (data.tipoIntervaloEnvio) {
      form.append('tipoIntervaloEnvio', data.tipoIntervaloEnvio.toString())
    }

    if (data.intervaloEnvio) {
      form.append('intervaloEnvio', data.intervaloEnvio.toString())
    }

    if (data.horarioInicial) {
      form.append('horarioInicial', data.horarioInicial.toString())
    }

    if (data.horarioFinal) {
      form.append('horarioFinal', data.horarioFinal.toString())
    }

    if (data.dataInicioEnvio) {
      form.append('dataInicioEnvio', data.dataInicioEnvio.toString())
    }

    if (data.dataFinalEnvio) {
      form.append('dataFinalEnvio', data.dataFinalEnvio.toString())
    }

    form.append('alertaId', data.alertaId ? data.alertaId.toString() : '0');
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
              <AlertaForm.Root
                createAlertaMethods={alertaMethods}
                onSubmitAlertaData={onSubmitAlertaData}
              >
                <AlertaForm.FormContent
                  createAlertaMethods={alertaMethods}
                  disabled={!isEditingPersonalInfo}
                />
                <div className="mt-6">
                  {isEditingPersonalInfo && (
                    <Button
                      disabled={//!blocoMethods.formState.isDirty 
                        !alertaMethods.formState.isDirty || !alertaMethods.formState.isValid
                      }
                      type="submit"
                    >
                      Salvar Alterações
                    </Button>
                  )}
                </div>
              </AlertaForm.Root>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div >
  )
}
