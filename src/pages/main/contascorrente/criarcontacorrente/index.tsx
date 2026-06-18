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
      form.append('agencia', data.agencia.toString())
    }

    if (data.conta) {
      form.append('conta', data.conta.toString())
    }

    if (data.digito) {
      form.append('digito', data.digito.toString())
    }

    if (data.descricao) {
      form.append('descricao', data.descricao.toString())
    }

    if (data.usuarioBancoAPI) {
      form.append('usuarioBancoAPI', data.usuarioBancoAPI.toString());
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


    if (data.pagtoParcial){
      form.append('pagtoParcial', data.pagtoParcial.toString());
    }
    if (data.qtdeMaxParcial){
      form.append('qtdeMaxParcial', data.qtdeMaxParcial.toString());
    }
    if (data.formaEnvio){
      form.append('formaEnvio', data.formaEnvio.toString());
    }
    if (data.assuntoEmail){
      form.append('assuntoEmail', data.assuntoEmail.toString());
    }
    if (data.mensagemEmail1){
      form.append('mensagemEmail1', data.mensagemEmail1.toString());
    }
    if (data.mensagemEmail2){
      form.append('mensagemEmail2', data.mensagemEmail2.toString());
    }
    if (data.mensagemEmail3){
      form.append('mensagemEmail3', data.mensagemEmail3.toString());
    }

    if (data.tipoJurosCobId){
      form.append('tipoJurosCobId', data.tipoJurosCobId.toString());
    }
    if (data.valorJuros){
      form.append('valorJuros', data.valorJuros.toString());
    }
    if (data.percJuros){
      form.append('percJuros', data.percJuros.toString());
    }
    if (data.diasInicioJuros){
      form.append('diasInicioJuros', data.diasInicioJuros.toString());
    }
  
    if (data.tipoMultaCobId){
      form.append('tipoMultaCobId', data.tipoMultaCobId.toString());
    }
    if (data.valorMulta){
      form.append('valorMulta', data.valorMulta.toString());
    }
    if (data.percMulta){
      form.append('percMulta', data.percMulta.toString());
    }
    if (data.diasInicioMulta){
      form.append('diasInicioMulta', data.diasInicioMulta.toString());
    }

    if (data.tipoDescontoCobId){
      form.append('tipoDescontoCobId', data.tipoDescontoCobId.toString());
    }
    if (data.valorDesconto){
      form.append('valorDesconto', data.valorDesconto.toString());
    }
    if (data.percDesconto){
      form.append('percDesconto', data.percDesconto.toString());
    }
    if (data.diasInicioDesconto){
      form.append('diasInicioDesconto', data.diasInicioDesconto.toString());
    }

    if (data.tipoAutorizacaoCobId){
      form.append('tipoAutorizacaoCobId', data.tipoAutorizacaoCobId.toString());
    }
    if (data.tipoRecebimentoDiv){
      form.append('tipoRecebimentoDiv', data.tipoRecebimentoDiv.toString());
    }
    if (data.valorMinDiverg){
      form.append('valorMinDiverg', data.valorMinDiverg.toString());
    }
    if (data.valorMaxDiverg){
      form.append('valorMaxDiverg', data.valorMaxDiverg.toString());
    }
    if (data.percMinDiverg){
      form.append('percMinDiverg', data.percMinDiverg.toString());
    }
    if (data.percMaxDiverg){
      form.append('percMaxDiverg', data.percMaxDiverg.toString());
    }

    if (data.protestar){
      form.append('protestar', data.protestar.toString());
    }
    if (data.qtdeDiasProtesto){
      form.append('qtdeDiasProtesto', data.qtdeDiasProtesto.toString());
    }
    if (data.negativar){
      form.append('negativar', data.negativar.toString());
    }
    if (data.qtdeDiasNegativar){
      form.append('qtdeDiasNegativar', data.qtdeDiasNegativar.toString());
    }

    form.append('bancoId', data.bancoId.toString());

    if (data.instrucaoCobId1) {
      form.append('instrucaoCobId1', data.instrucaoCobId1.toString());
    }
    if (data.instrucaoCobId2) {
      form.append('instrucaoCobId2', data.instrucaoCobId2.toString());
    }

    if (data.instrucaoCobId3) {
      form.append('instrucaoCobId3', data.instrucaoCobId3.toString());
    }
    if (data.qtdeDiasAposVencto) {
      form.append('qtdeDiasAposVencto', data.qtdeDiasAposVencto.toString());
    }
    if (data.cobrancaDiaUtil) {
      form.append('cobrancaDiaUtil', data.cobrancaDiaUtil.toString());
    }

    if (data.instrucaoRecId1) {
      form.append('instrucaoRecId1', data.instrucaoRecId1.toString());
    }
    if (data.instrucaoRecId2) {
      form.append('instrucaoRecId2', data.instrucaoRecId2.toString());
    }
    if (data.instrucaoRecId3) {
      form.append('instrucaoRecId3', data.instrucaoRecId3.toString());
    }
    
    if (data.instrucaoRecId4) {
      form.append('instrucaoRecId4', data.instrucaoRecId4.toString());
    }

    if (data.carteiraId) {
      form.append('carteiraId', data.carteiraId.toString());
    }
    if (data.especieId) {
      form.append('especieId', data.especieId.toString());
    }

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
