import { Card, CardContent } from '@/components/ui/card'
import { ROUTE } from '@/enums/routes.enum'
import { toast } from '@/hooks/use-toast'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useGlobalParams } from '@/globals/GlobalParams'
import { ContaCorrenteForm } from './components/contacorrente-form'
import { useMutation } from '@tanstack/react-query'
import { createContaCorrente } from '../requests'
import { queryClient } from '@/services/react-query/query-client'
import axios from 'axios'
import { contacorrenteSchema, ContaCorrenteSchema } from '@/schemas/contacorrente.schema'


//TODO: create a interface for created imovel

export const CriarContaCorrente = () => {
  //Globals
  const glb_params = useGlobalParams();
  const navigate = useNavigate()

  const createContaCorrenteMethods = useForm<ContaCorrenteSchema>({
    resolver: zodResolver(contacorrenteSchema),
    defaultValues: {
      empresaId: glb_params.id_empresa ? Number(glb_params.id_empresa) : 0,
    },
    mode: 'all'
  })

  const createMutation = useMutation({
    mutationFn: (data: FormData) => createContaCorrente(data),
    //mutationFn: (data: FormData) => createAlerta(data),
    onSuccess: () => {
      ['contacorrente'].forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] })
      })
      toast({
        title: 'Conta Corrente criada com sucesso',
      });
      navigate(ROUTE.CONTA_CORRENTE);
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        // Check if there's a response and data within the error
        if (error.response && error.response.data) {
          console.error('Error message from server:', error.response.data);
          toast({
            title: 'Erro ao criar conta corrente',
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

    const dataObject = Object.fromEntries(form.entries());
    const jsonData = JSON.stringify(dataObject);
    console.log(jsonData);

    createMutation.mutate(form)
  }

  console.log('contacorrente dados', createContaCorrenteMethods.formState.errors);
  console.log('contacorrente dados', createContaCorrenteMethods.formState.isDirty);
  console.log('contacorrente dados', createContaCorrenteMethods.formState.isValid);

  return (
    <div className="scale mx-auto flex max-w-screen-xl transform flex-col items-center px-4 transition-transform">
      <div className="mb-8 flex w-full items-center justify-between">
      </div>
      <div className="mx-auto w-full rounded-md">
        <Card>
          <CardContent>
            <h2 className="mb-4 mt-8 text-xl font-bold">Criar um nova conta corrente</h2>
            {/* ======contacorrente====== */}
            <ContaCorrenteForm.Root
              createContaCorrenteMethods={createContaCorrenteMethods}
              onSubmitContaCorrenteData={onSubmitContaCorrenteData}
            >
              <ContaCorrenteForm.FormContent
                createContaCorrenteMethods={createContaCorrenteMethods}
              ></ContaCorrenteForm.FormContent>
              <ContaCorrenteForm.SubmitButton
                createContaCorrenteMethods={createContaCorrenteMethods}
              ></ContaCorrenteForm.SubmitButton>
            </ContaCorrenteForm.Root>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
