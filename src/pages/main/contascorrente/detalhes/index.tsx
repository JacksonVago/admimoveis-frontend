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
  
  //remove null values from object endereço
  const defaultValues = {
    
    ...parsedData,

    tipoJurosCobId : contaCorrente?.tipoJurosCobId ? contaCorrente?.tipoJurosCobId.toString() : undefined,
    tipoMultaCobId : contaCorrente?.tipoMultaCobId ? contaCorrente?.tipoMultaCobId.toString() : undefined,
    tipoDescontoCobId : contaCorrente?.tipoDescontoCobId ? contaCorrente?.tipoDescontoCobId.toString() : undefined,
    tipoAutorizacaoCobId : contaCorrente?.tipoAutorizacaoCobId ? contaCorrente?.tipoAutorizacaoCobId.toString() : undefined,

    bancoId: contaCorrente?.bancoId.toString() || undefined,
    instrucaoCobId1: contaCorrente?.instrucaoCobId1 ? contaCorrente?.instrucaoCobId1.toString() : undefined,
    instrucaoCobId2: contaCorrente?.instrucaoCobId2 ? contaCorrente?.instrucaoCobId2.toString() : undefined,
    instrucaoCobId3: contaCorrente?.instrucaoCobId3 ? contaCorrente?.instrucaoCobId3.toString() : undefined,

    instrucaoRecId1: contaCorrente?.instrucaoRecId1 ? contaCorrente?.instrucaoRecId1.toString() : undefined,
    instrucaoRecId2: contaCorrente?.instrucaoRecId2 ? contaCorrente?.instrucaoRecId2.toString() : undefined,
    instrucaoRecId3: contaCorrente?.instrucaoRecId3 ? contaCorrente?.instrucaoRecId3.toString() : undefined,
    instrucaoRecId4: contaCorrente?.instrucaoRecId4 ? contaCorrente?.instrucaoRecId4.toString() : undefined,

    carteiraId: contaCorrente?.carteiraId ? contaCorrente?.carteiraId.toString() : undefined,
    especieId: contaCorrente?.especieId ? contaCorrente?.especieId.toString() : undefined,
    pessoaId: contaCorrente?.pessoaId ? contaCorrente?.pessoaId.toString() : undefined,
    empresaId: contaCorrente?.empresaId,
  }

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

    if (data.cooperativa) {
      form.append('cooperativa', data.cooperativa.toString())
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
    if (data.convenio) {
      form.append('convenio', data.convenio.toString())
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

    form.append('bancoId', data.bancoId.toString());
    form.append('empresaId', glb_params.id_empresa ? glb_params.id_empresa : "0");

    const dataObject = Object.fromEntries(form.entries());
    const jsonData = JSON.stringify(dataObject);
    console.log(jsonData);

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
