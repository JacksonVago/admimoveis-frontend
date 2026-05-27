import { Card, CardContent } from '@/components/ui/card'
import { ROUTE } from '@/enums/routes.enum'
import { toast } from '@/hooks/use-toast'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useGlobalParams } from '@/globals/GlobalParams'
import { AlertaForm } from './components/alerta-form'
import { alertaSchema, AlertaSchema } from '@/schemas/alerta.schema'
import { useMutation } from '@tanstack/react-query'
import { createAlerta } from '../requests'
import { queryClient } from '@/services/react-query/query-client'
import axios from 'axios'


//TODO: create a interface for created imovel

export const CriarAlerta = () => {
  //Globals
  const glb_params = useGlobalParams();
  const navigate = useNavigate()

  const createAlertaMethods = useForm<AlertaSchema>({
    resolver: zodResolver(alertaSchema),
    defaultValues: {
      empresaId: glb_params.id_empresa ? Number(glb_params.id_empresa) : 0,
    },
    mode: 'all'
  })

  const createMutation = useMutation({
    mutationFn: (data: FormData) => createAlerta(data),
    //mutationFn: (data: FormData) => createAlerta(data),
    onSuccess: () => {
      ['alerta'].forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] })
      })
      toast({
        title: 'Alerta criado com sucesso',
      });
      navigate(ROUTE.ALERTAS);
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        // Check if there's a response and data within the error
        if (error.response && error.response.data) {
          console.error('Error message from server:', error.response.data);
          toast({
            title: 'Erro ao atualizar alrta',
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
  })


  //Validade dados do condomínio no caso de alteração
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

    if (data.dataInicio && data.dataInicio !== 'Invalid date') {
      form.append('dataInicio', data.dataInicio.toString())
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

    if (data.dataInicioEnvio && data.dataInicioEnvio !== 'Invalid date') {
      form.append('dataInicioEnvio', data.dataInicioEnvio.toString())
    }

    if (data.dataFinalEnvio && data.dataFinalEnvio !== 'Invalid date') {
      form.append('dataFinalEnvio', data.dataFinalEnvio.toString())
    }

    if (data.horarioFinal) {
      form.append('dataFinalEnvio', data.horarioFinal.toString())
    }

    form.append('alertaId', data.alertaId ? data.alertaId.toString() : '0');
    form.append('empresaId', glb_params.id_empresa ? glb_params.id_empresa : "0");

    const dataObject = Object.fromEntries(form.entries());
    const jsonData = JSON.stringify(dataObject);
    console.log(jsonData);

    createMutation.mutate(form)
  }

  console.log('alerta dados', createAlertaMethods.formState.errors);
  console.log('alerta dados', createAlertaMethods.formState.isDirty);
  console.log('alerta dados', createAlertaMethods.formState.isValid);

  return (
    <div className="scale mx-auto flex max-w-screen-xl transform flex-col items-center px-4 transition-transform">
      <div className="mb-8 flex w-full items-center justify-between">
      </div>
      <div className="mx-auto w-full rounded-md">
        <Card>
          <CardContent>
            <h2 className="mb-4 mt-8 text-xl font-bold">Criar um novo alerta</h2>
            {/* ======alerta====== */}
            <AlertaForm.Root
              createAlertaMethods={createAlertaMethods}
              onSubmitAlertaData={onSubmitAlertaData}
            >
              <AlertaForm.FormContent
                createAlertaMethods={createAlertaMethods}
              ></AlertaForm.FormContent>
              <AlertaForm.SubmitButton
                createAlertaMethods={createAlertaMethods}
              ></AlertaForm.SubmitButton>
            </AlertaForm.Root>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
