import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Controller, UseFormReturn } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { getBanco, getCarteiraCobranca, getEspecieCobranca, getInstrucaoCobranca, getInstrucaoRecebimentos, getTipoAutorizacaoCobranca, getTipoDescontoCobranca, getTipoJurosCobranca, getTipoMultaCobranca } from '../../requests'
import { useMediaQuery } from 'react-responsive'
import { Eye, EyeOffIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ContaCorrenteSchema } from '@/schemas/contacorrente.schema'
import { STATUS_PESSOA_OPTIONS } from '@/constants/pessoas'
import { Switch, Thumb } from '@radix-ui/react-switch'
import { FORMA_ENVIO_OPTIONS } from '@/constants/forma-envio'
import { TIPO_DIVERG_COBRANCA_OPTIONS } from '@/constants/tipo-divergencia-cobranca'

export const ContaCorrenteFormRoot = ({
  children,
  createContaCorrenteMethods,
  onSubmitContaCorrenteData
}: {
  createContaCorrenteMethods: UseFormReturn<ContaCorrenteSchema>
  children: React.ReactNode
  onSubmitContaCorrenteData: (data: ContaCorrenteSchema) => void
}) => {
  return <form onSubmit={createContaCorrenteMethods.handleSubmit(onSubmitContaCorrenteData)}>{children}</form>
}

export const ContaCorrenteFormContent = ({
  createContaCorrenteMethods,
  disabled
}: {
  createContaCorrenteMethods: UseFormReturn<ContaCorrenteSchema>
  disabled?: boolean
}) => {

  const isMobile = useMediaQuery({ query: '(max-width: 420px)' })
  const [pagParcial, setPagParcial] = useState(false);
  const [selBanco, setSelBanco] = useState<number>(0);
  const [showPassword, setShowPassword] = useState(false);

  //const isPortrait = useMediaQuery({ query: '(min-width: 1224px)' })
  //const [selCondominio, setSelCondominio] = useState<boolean>(false);

  /*const handlerSelCondominio = () => {
    setSelCondominio(true);
  }*/

  //Consulta bancos
  const {
    data: bancos
  } = useQuery({
    queryKey: ['bancos'],
    queryFn: () => getBanco(0),
  });

  //Consulta Tipo de Juros
  const {
    data: tipoJuros
  } = useQuery({
    queryKey: ['tipoJuros', selBanco],
    queryFn: () => getTipoJurosCobranca(selBanco),
  });

  //Consulta Tipo de Multa
  const {
    data: tipoMultas
  } = useQuery({
    queryKey: ['tipoMultas', selBanco],
    queryFn: () => getTipoMultaCobranca(selBanco),
  });

  //Consulta Tipo de desconto
  const {
    data: tipoDescontos
  } = useQuery({
    queryKey: ['tipoDescontos', selBanco],
    queryFn: () => getTipoDescontoCobranca(selBanco),
  });

  //Consulta Tipo de autorizacao
  const {
    data: tipoAutorizacao
  } = useQuery({
    queryKey: ['tipoAutorizacao', selBanco],
    queryFn: () => getTipoAutorizacaoCobranca(selBanco),
  });

  //Consulta Instrução de cobrança
  const {
    data: instrucaoCobranca
  } = useQuery({
    queryKey: ['instrucaoCobranca', selBanco],
    queryFn: () => getInstrucaoCobranca(selBanco),
  });


  //Consulta Instrução de recebimentos
  const {
    data: instrucaoRecebimentos
  } = useQuery({
    queryKey: ['instrucaoRecebimentos', selBanco],
    queryFn: () => getInstrucaoRecebimentos(selBanco),
  });

  //Consulta Carteira de cobranca
  const {
    data: carteiraCobranca
  } = useQuery({
    queryKey: ['carteiraCobranca', selBanco],
    queryFn: () => getCarteiraCobranca(selBanco),
  });

  //Consulta Espécie de cobranca
  const {
    data: especieCobranca
  } = useQuery({
    queryKey: ['especieCobranca', selBanco],
    queryFn: () => getEspecieCobranca(selBanco),
  });

  const handlerChangeBanco = (value: string) => {
    setSelBanco(Number(value));
    console.log(selBanco)
  }

  useEffect(() => {
    handlerChangeBanco(createContaCorrenteMethods.getValues("bancoId"));
  }, [])

  /*console.log('conta dados', createContaCorrenteMethods.formState.errors);
  console.log('conta dados', createContaCorrenteMethods.formState.isDirty);
  console.log('conta dados', createContaCorrenteMethods.formState.isValid);*/

  return (
    <div className="space-y-4">
      <div className="space-y-4 font-[Poppins-Regular]">

        <div className='mt-2'>
          <Label className='text-base font-[Poppins-Regular]'>
            Banco
            <div className="mt-2 border rounded-md pr-6">
              <Controller
                name="bancoId"
                control={createContaCorrenteMethods.control}
                render={({ field }) => (
                  <Select
                    disabled={disabled}
                    onValueChange={(value) => {
                      field.onChange(value);
                      handlerChangeBanco(value);
                    }
                    }
                    value={field.value}
                  >
                    <SelectTrigger className='h-6'>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {bancos && bancos.map((banco) => (
                        <SelectItem value={banco.id.toString()}>{banco.codigo + ' - ' + banco.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {/*!!createContaCorrenteMethods?.formState?.errors?.tipoAgendamento?.message && (
                <span>{createContaCorrenteMethods?.formState?.errors?.tipoAgendamento?.message}</span>
              )*/}
            </div>
          </Label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Label className='text-base font-[Poppins-Regular]'>
            Número da agência
            <Input
              className="mt-2"
              type="number"
              disabled={disabled}
              placeholder="Agência"
              {...createContaCorrenteMethods.register('agencia')}
            />
            {createContaCorrenteMethods.formState.errors.agencia?.message &&
              (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                {createContaCorrenteMethods.formState.errors.agencia.message}
              </p>)}
          </Label>


          <div className='grid grid-cols-4 gap-4'>
            <Label className='col-span-3 text-base font-[Poppins-Regular]'>
              Número da Conta
              <Input
                className="mt-2"
                type="number"
                disabled={disabled}
                placeholder="Conta corrente"
                {...createContaCorrenteMethods.register('conta')}
              />
              {createContaCorrenteMethods.formState.errors.conta?.message &&
                (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                  {createContaCorrenteMethods.formState.errors.conta.message}
                </p>)}
            </Label>

            <Label className='text-base font-[Poppins-Regular]'>
              Dígito
              <Input
                className="mt-2"
                type="number"
                disabled={disabled}
                placeholder="Dígito"
                {...createContaCorrenteMethods.register('digito')}
              />
              {createContaCorrenteMethods.formState.errors.digito?.message &&
                (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                  {createContaCorrenteMethods.formState.errors.digito.message}
                </p>)}
            </Label>

          </div>
        </div>

        <div className='mt-2'>
          <Label htmlFor="name">Descrição</Label>
          <Input
            className="mt-2"
            type="text"
            disabled={disabled}
            placeholder="Descrição"
            {...createContaCorrenteMethods.register('descricao')}
          />
        </div>

        <div className='mt-2'>
          <Label className='text-base font-[Poppins-Regular]'>
            Situacao
            <div className="mt-2 border rounded-md pr-6">
              <Controller
                name="status"
                control={createContaCorrenteMethods.control}
                render={({ field }) => (
                  <Select
                    disabled={disabled}
                    onValueChange={(value) => field.onChange(value)}
                    value={field.value}
                  >
                    <SelectTrigger className='h-6'>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_PESSOA_OPTIONS.map((status) => (
                        <SelectItem className='text-base' key={status.label} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {/*!!createContaCorrenteMethods?.formState?.errors?.tipoAgendamento?.message && (
                <span>{createContaCorrenteMethods?.formState?.errors?.tipoAgendamento?.message}</span>
              )*/}
            </div>
          </Label>
        </div>

        <fieldset className="rounded-lg border-2 border-indigo-500 p-6 mt-2">
          <legend className="ml-4 px-2 text-indigo-600 font-bold">Dados de acesso à API</legend>
          <div className='mt-2 grid grid-cols-2 gap-4'>
            <div>
              <Label htmlFor="name">Usuário API
                <Input
                  className="mt-2"
                  type="text"
                  disabled={disabled}
                  placeholder="Usuário API"
                  {...createContaCorrenteMethods.register('usuarioBancoAPI')}
                />
              </Label>
            </div>

            <div >
              <Label className="text-base">
                Senha API
                <Input
                  className="mt-2"
                  type={showPassword ? 'text' : 'password'}
                  disabled={disabled}
                  placeholder="Senha API"
                  {...createContaCorrenteMethods.register('senhaBancoAPI')}
                />
                {/*createContaCorrenteMethods.formState.errors.senhaBancoAPI?.message &&
                (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                  {createContaCorrenteMethods.formState.errors.senhaBancoAPI.message}
                </p>)*/}
              </Label>
              <div className='bg-white relative -top-8 left-[90%] p-0 w-[24px]' onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <Eye color='black'></Eye> : <EyeOffIcon color='black'></EyeOffIcon>}
              </div>
            </div>
          </div>

          <div className='mt-2'>
            <Label htmlFor="name">Chave APP</Label>
            <Input
              className="mt-2"
              type="text"
              disabled={disabled}
              placeholder="Chave APP"
              {...createContaCorrenteMethods.register('chaveAppAPI')}
            />
          </div>

          <div className='mt-2'>
            <Label htmlFor="name">URL PIX</Label>
            <Input
              className="mt-2"
              type="text"
              disabled={disabled}
              placeholder="URL PIX"
              {...createContaCorrenteMethods.register('urlPIX')}
            />
          </div>

          <div className='mt-2'>
            <Label htmlFor="name">Url Boleto</Label>
            <Input
              className="mt-2"
              type="text"
              disabled={disabled}
              placeholder="Url Boleto"
              {...createContaCorrenteMethods.register('urlBoleto')}
            />
          </div>

          <div className='mt-2'>
            <Label htmlFor="name">Url WeebHook PIX</Label>
            <Input
              className="mt-2"
              type="text"
              disabled={disabled}
              placeholder="Url WeebHook PIX"
              {...createContaCorrenteMethods.register('urlWebhookPIX')}
            />
          </div>

          <div className='mt-2'>
            <Label htmlFor="name">Url WeebHook Boleto</Label>
            <Input
              className="mt-2"
              type="text"
              disabled={disabled}
              placeholder="Url WeebHook Boleto"
              {...createContaCorrenteMethods.register('urlWebhookBoleto')}
            />
          </div>

        </fieldset>

        <fieldset className="rounded-lg border-2 border-indigo-500 p-6 mt-2">
          <legend className="ml-4 px-2 text-indigo-600 font-bold">Dados de Cobrança</legend>

          <div className='grid grid-cols-2'>
            <div className={isMobile ? 'flex items-center justify-start align-middle mt-7' : 'flex items-center justify-start align-middle mt-7'}>
              <label
                className="Label"
                htmlFor="boletos"
                style={{ paddingRight: 15 }}
              >
                Pagamento parcial
              </label>
              <Switch className="SwitchRoot focus:outline-none" id="boletos"
                checked={createContaCorrenteMethods.getValues("pagtoParcial")}
                onCheckedChange={(checked) => { createContaCorrenteMethods.setValue("pagtoParcial", checked); setPagParcial(checked); }}>
                <Thumb className="SwitchThumb" />
              </Switch>
            </div>

            {pagParcial && (
              <div className='mt-2'>
                <Label htmlFor="name">Quantidade máxima de parcial</Label>
                <Input
                  className="mt-2"
                  type="number"
                  disabled={disabled}
                  placeholder="Quantidade"
                  {...createContaCorrenteMethods.register('qtdeMaxParcial')}
                />
              </div>
            )}
          </div>

          <div className='mt-2'>
            <Label className='text-base font-[Poppins-Regular]'>
              Forma de envio
              <div className="mt-2 border rounded-md pr-6">
                <Controller
                  name="formaEnvio"
                  control={createContaCorrenteMethods.control}
                  render={({ field }) => (
                    <Select
                      disabled={disabled}
                      onValueChange={(value) => field.onChange(value)}
                      value={field.value}
                    >
                      <SelectTrigger className='h-6'>
                        <SelectValue placeholder="Selecione a forma" />
                      </SelectTrigger>
                      <SelectContent>
                        {FORMA_ENVIO_OPTIONS.map((forma) => (
                          <SelectItem className='text-base' key={forma.label} value={forma.value}>
                            {forma.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {/*!!createContaCorrenteMethods?.formState?.errors?.tipoAgendamento?.message && (
                <span>{createContaCorrenteMethods?.formState?.errors?.tipoAgendamento?.message}</span>
              )*/}
              </div>
            </Label>
          </div>

          <fieldset className="rounded-lg border-2 border-indigo-500 p-6 mt-2">
            <legend className="ml-4 px-2 text-indigo-600 font-bold">Dados E-mail</legend>

            <div className='mt-2'>
              <Label htmlFor="name">Assunto E-mail</Label>
              <Input
                className="mt-2"
                type="text"
                disabled={disabled}
                placeholder="Assunto e-mail"
                {...createContaCorrenteMethods.register('assuntoEmail')}
              />
            </div>

            <div className='mt-2'>
              <Label htmlFor="name">Mensagem 1</Label>
              <Input
                className="mt-2"
                type="text"
                disabled={disabled}
                placeholder="Mensagem.."
                {...createContaCorrenteMethods.register('mensagemEmail1')}
              />
            </div>

            <div className='mt-2'>
              <Label htmlFor="name">Mensagem 2</Label>
              <Input
                className="mt-2"
                type="text"
                disabled={disabled}
                placeholder="Mensagem.."
                {...createContaCorrenteMethods.register('mensagemEmail2')}
              />
            </div>

            <div className='mt-2'>
              <Label htmlFor="name">Mensagem 3</Label>
              <Input
                className="mt-2"
                type="text"
                disabled={disabled}
                placeholder="Mensagem.."
                {...createContaCorrenteMethods.register('mensagemEmail3')}
              />
            </div>
          </fieldset>

          <fieldset className="rounded-lg border-2 border-indigo-500 p-6 mt-2">
            <legend className="ml-4 px-2 text-indigo-600 font-bold">Tipo de Juros</legend>
            <div className='mt-2'>
              <Label className='text-base font-[Poppins-Regular]'>
                Tipo
                <div className="mt-2 border rounded-md pr-6">
                  <Controller
                    name="tipoJurosCobId"
                    control={createContaCorrenteMethods.control}
                    render={({ field }) => (
                      <Select
                        disabled={disabled}
                        onValueChange={(value) => field.onChange(value)}
                        value={field.value}
                      >
                        <SelectTrigger className='h-6'>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {tipoJuros && tipoJuros.map((juros) => (
                            <SelectItem value={juros.id.toString()}>{juros.descricao}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </Label>
            </div>

            <div className='mt-2'>
              <Label htmlFor="name">Valor Juros</Label>
              <Input
                className="mt-2"
                type="number"
                disabled={disabled}
                placeholder="Valor Juros."
                {...createContaCorrenteMethods.register('valorJuros')}
              />
            </div>

            <div className='mt-2'>
              <Label htmlFor="name">Percentual Juros</Label>
              <Input
                className="mt-2"
                type="number"
                step='0.01'
                disabled={disabled}
                placeholder="Mensagem.."
                {...createContaCorrenteMethods.register('percJuros')}
              />
            </div>

            <div className='mt-2'>
              <Label htmlFor="name">Dias</Label>
              <Input
                className="mt-2"
                type="number"
                disabled={disabled}
                placeholder="Mensagem.."
                {...createContaCorrenteMethods.register('diasInicioJuros')}
              />
            </div>


          </fieldset>

          <fieldset className="rounded-lg border-2 border-indigo-500 p-6 mt-2">
            <legend className="ml-4 px-2 text-indigo-600 font-bold">Tipo de Multa</legend>
            <div className='mt-2'>
              <Label className='text-base font-[Poppins-Regular]'>
                Tipo
                <div className="mt-2 border rounded-md pr-6">
                  <Controller
                    name="tipoMultaCobId"
                    control={createContaCorrenteMethods.control}
                    render={({ field }) => (
                      <Select
                        disabled={disabled}
                        onValueChange={(value) => field.onChange(value)}
                        value={field.value}
                      >
                        <SelectTrigger className='h-6'>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {tipoMultas && tipoMultas.map((multa) => (
                            <SelectItem value={multa.id.toString()}>{multa.descricao}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </Label>
            </div>


            <div className='mt-2'>
              <Label htmlFor="name">Valor Multa</Label>
              <Input
                className="mt-2"
                type="number"
                disabled={disabled}
                placeholder="Valor Juros."
                {...createContaCorrenteMethods.register('valorMulta')}
              />
            </div>

            <div className='mt-2'>
              <Label htmlFor="name">Percentual Multa</Label>
              <Input
                className="mt-2"
                type="number"
                step='0.01'
                disabled={disabled}
                placeholder="Perc. multa"
                {...createContaCorrenteMethods.register('percMulta')}
              />
            </div>

            <div className='mt-2'>
              <Label htmlFor="name">Dias</Label>
              <Input
                className="mt-2"
                type="number"
                disabled={disabled}
                placeholder="Mensagem.."
                {...createContaCorrenteMethods.register('diasInicioMulta')}
              />
            </div>
          </fieldset>

          <fieldset className="rounded-lg border-2 border-indigo-500 p-6 mt-2">
            <legend className="ml-4 px-2 text-indigo-600 font-bold">Tipo de Desconto</legend>
            <div className='mt-2'>
              <Label className='text-base font-[Poppins-Regular]'>
                Tipo Desconto
                <div className="mt-2 border rounded-md pr-6">
                  <Controller
                    name="tipoDescontoCobId"
                    control={createContaCorrenteMethods.control}
                    render={({ field }) => (
                      <Select
                        disabled={disabled}
                        onValueChange={(value) => field.onChange(value)}
                        value={field.value}
                      >
                        <SelectTrigger className='h-6'>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {tipoDescontos && tipoDescontos.map((desconto) => (
                            <SelectItem value={desconto.id.toString()}>{desconto.descricao}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </Label>
            </div>




            <div className='mt-2'>
              <Label htmlFor="name">Valor Desconto</Label>
              <Input
                className="mt-2"
                type="number"
                disabled={disabled}
                placeholder="Valor desconto"
                {...createContaCorrenteMethods.register('valorDesconto')}
              />
            </div>

            <div className='mt-2'>
              <Label htmlFor="name">Percentual Desconto</Label>
              <Input
                className="mt-2"
                type="number"
                step='0.01'
                disabled={disabled}
                placeholder="Perc. desconto"
                {...createContaCorrenteMethods.register('percDesconto')}
              />
            </div>

            <div className='mt-2'>
              <Label htmlFor="name">Dias</Label>
              <Input
                className="mt-2"
                type="number"
                disabled={disabled}
                placeholder=""
                {...createContaCorrenteMethods.register('diasInicioDesconto')}
              />
            </div>
          </fieldset>

          <fieldset className="rounded-lg border-2 border-indigo-500 p-6 mt-2">
            <legend className="ml-4 px-2 text-indigo-600 font-bold">Instruções de Cobrança</legend>

            <div className='mt-2'>
              <Label className='text-base font-[Poppins-Regular]'>
                Instrução 1
                <div className="mt-2 border rounded-md pr-6">
                  <Controller
                    name="instrucaoCobId1"
                    control={createContaCorrenteMethods.control}
                    render={({ field }) => (
                      <Select
                        disabled={disabled}
                        onValueChange={(value) => field.onChange(value)}
                        value={field.value}
                      >
                        <SelectTrigger className='h-6'>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {instrucaoCobranca && instrucaoCobranca.map((instrucao) => (
                            <SelectItem value={instrucao.id.toString()}>{instrucao.descricao}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {/*!!createContaCorrenteMethods?.formState?.errors?.tipoAgendamento?.message && (
                <span>{createContaCorrenteMethods?.formState?.errors?.tipoAgendamento?.message}</span>
              )*/}
                </div>
              </Label>
            </div>

            <div className='mt-2'>
              <Label className='text-base font-[Poppins-Regular]'>
                Instrução 2
                <div className="mt-2 border rounded-md pr-6">
                  <Controller
                    name="instrucaoCobId2"
                    control={createContaCorrenteMethods.control}
                    render={({ field }) => (
                      <Select
                        disabled={disabled}
                        onValueChange={(value) => field.onChange(value)}
                        value={field.value}
                      >
                        <SelectTrigger className='h-6'>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {instrucaoCobranca && instrucaoCobranca.map((instrucao) => (
                            <SelectItem value={instrucao.id.toString()}>{instrucao.descricao}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {/*!!createContaCorrenteMethods?.formState?.errors?.tipoAgendamento?.message && (
                <span>{createContaCorrenteMethods?.formState?.errors?.tipoAgendamento?.message}</span>
              )*/}
                </div>
              </Label>
            </div>
            <div className='mt-2'>
              <Label className='text-base font-[Poppins-Regular]'>
                Instrução 3
                <div className="mt-2 border rounded-md pr-6">
                  <Controller
                    name="instrucaoCobId3"
                    control={createContaCorrenteMethods.control}
                    render={({ field }) => (
                      <Select
                        disabled={disabled}
                        onValueChange={(value) => field.onChange(value)}
                        value={field.value}
                      >
                        <SelectTrigger className='h-6'>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {instrucaoCobranca && instrucaoCobranca.map((instrucao) => (
                            <SelectItem value={instrucao.id.toString()}>{instrucao.descricao}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {/*!!createContaCorrenteMethods?.formState?.errors?.tipoAgendamento?.message && (
                <span>{createContaCorrenteMethods?.formState?.errors?.tipoAgendamento?.message}</span>
              )*/}
                </div>
              </Label>
            </div>

            <div className='mt-2'>
              <Label htmlFor="name">Dias Após Vencimento</Label>
              <Input
                className="mt-2"
                type="number"
                disabled={disabled}
                placeholder=""
                {...createContaCorrenteMethods.register('qtdeDiasAposVencto')}
              />
            </div>

            <div className={isMobile ? 'flex items-center justify-start align-middle mt-7' : 'flex items-center justify-start align-middle mt-7'}>
              <label
                className="Label"
                htmlFor="diautil"
                style={{ paddingRight: 15 }}
              >
                Somente dia útil
              </label>
              <Switch className="SwitchRoot focus:outline-none" id="diautil"
                checked={createContaCorrenteMethods.getValues("cobrancaDiaUtil")}
                onCheckedChange={(checked) => { createContaCorrenteMethods.setValue("cobrancaDiaUtil", checked); setPagParcial(checked); }}>
                <Thumb className="SwitchThumb" />
              </Switch>
            </div>
          </fieldset>

          <fieldset className="rounded-lg border-2 border-indigo-500 p-6 mt-2">
            <legend className="ml-4 px-2 text-indigo-600 font-bold">Instruções de Recebimentos</legend>

            <div className='mt-2'>
              <Label className='text-base font-[Poppins-Regular]'>
                Instrução 1
                <div className="mt-2 border rounded-md pr-6">
                  <Controller
                    name="instrucaoRecId1"
                    control={createContaCorrenteMethods.control}
                    render={({ field }) => (
                      <Select
                        disabled={disabled}
                        onValueChange={(value) => field.onChange(value)}
                        value={field.value}
                      >
                        <SelectTrigger className='h-6'>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {instrucaoRecebimentos && instrucaoRecebimentos.map((instrucao) => (
                            <SelectItem value={instrucao.id.toString()}>{instrucao.descricao}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {/*!!createContaCorrenteMethods?.formState?.errors?.tipoAgendamento?.message && (
                <span>{createContaCorrenteMethods?.formState?.errors?.tipoAgendamento?.message}</span>
              )*/}
                </div>
              </Label>
            </div>

            <div className='mt-2'>
              <Label className='text-base font-[Poppins-Regular]'>
                Instrução 2
                <div className="mt-2 border rounded-md pr-6">
                  <Controller
                    name="instrucaoRecId2"
                    control={createContaCorrenteMethods.control}
                    render={({ field }) => (
                      <Select
                        disabled={disabled}
                        onValueChange={(value) => field.onChange(value)}
                        value={field.value}
                      >
                        <SelectTrigger className='h-6'>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {instrucaoRecebimentos && instrucaoRecebimentos.map((instrucao) => (
                            <SelectItem value={instrucao.id.toString()}>{instrucao.descricao}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {/*!!createContaCorrenteMethods?.formState?.errors?.tipoAgendamento?.message && (
                <span>{createContaCorrenteMethods?.formState?.errors?.tipoAgendamento?.message}</span>
              )*/}
                </div>
              </Label>
            </div>
            <div className='mt-2'>
              <Label className='text-base font-[Poppins-Regular]'>
                Instrução 3
                <div className="mt-2 border rounded-md pr-6">
                  <Controller
                    name="instrucaoRecId3"
                    control={createContaCorrenteMethods.control}
                    render={({ field }) => (
                      <Select
                        disabled={disabled}
                        onValueChange={(value) => field.onChange(value)}
                        value={field.value}
                      >
                        <SelectTrigger className='h-6'>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {instrucaoRecebimentos && instrucaoRecebimentos.map((instrucao) => (
                            <SelectItem value={instrucao.id.toString()}>{instrucao.descricao}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {/*!!createContaCorrenteMethods?.formState?.errors?.tipoAgendamento?.message && (
                <span>{createContaCorrenteMethods?.formState?.errors?.tipoAgendamento?.message}</span>
              )*/}
                </div>
              </Label>
            </div>
            <div className='mt-2'>
              <Label className='text-base font-[Poppins-Regular]'>
                Instrução 4
                <div className="mt-2 border rounded-md pr-6">
                  <Controller
                    name="instrucaoRecId4"
                    control={createContaCorrenteMethods.control}
                    render={({ field }) => (
                      <Select
                        disabled={disabled}
                        onValueChange={(value) => field.onChange(value)}
                        value={field.value}
                      >
                        <SelectTrigger className='h-6'>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {instrucaoRecebimentos && instrucaoRecebimentos.map((instrucao) => (
                            <SelectItem value={instrucao.id.toString()}>{instrucao.descricao}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {/*!!createContaCorrenteMethods?.formState?.errors?.tipoAgendamento?.message && (
                <span>{createContaCorrenteMethods?.formState?.errors?.tipoAgendamento?.message}</span>
              )*/}
                </div>
              </Label>
            </div>
          </fieldset>

          <fieldset className="rounded-lg border-2 border-indigo-500 p-6 mt-2">
            <legend className="ml-4 px-2 text-indigo-600 font-bold">Tipo de Autorização de divergência de cobrança</legend>
            <div className='mt-2'>
              <Label className='text-base font-[Poppins-Regular]'>
                Tipo de Autorização
                <div className="mt-2 border rounded-md pr-6">
                  <Controller
                    name="tipoAutorizacaoCobId"
                    control={createContaCorrenteMethods.control}
                    render={({ field }) => (
                      <Select
                        disabled={disabled}
                        onValueChange={(value) => field.onChange(value)}
                        value={field.value}
                      >
                        <SelectTrigger className='h-6'>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {tipoAutorizacao && tipoAutorizacao.map((autorizacao) => (
                            <SelectItem value={autorizacao.id.toString()}>{autorizacao.descricao}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </Label>
            </div>

            <div className='mt-2'>
              <Label className='text-base font-[Poppins-Regular]'>
                Tipo de Divergência
                <div className="mt-2 border rounded-md pr-6">
                  <Controller
                    name="status"
                    control={createContaCorrenteMethods.control}
                    render={({ field }) => (
                      <Select
                        disabled={disabled}
                        onValueChange={(value) => field.onChange(value)}
                        value={field.value}
                      >
                        <SelectTrigger className='h-6'>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPO_DIVERG_COBRANCA_OPTIONS.map((tipo) => (
                            <SelectItem className='text-base' key={tipo.label} value={tipo.value}>
                              {tipo.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {/*!!createContaCorrenteMethods?.formState?.errors?.tipoAgendamento?.message && (
                <span>{createContaCorrenteMethods?.formState?.errors?.tipoAgendamento?.message}</span>
              )*/}
                </div>
              </Label>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div className='mt-2'>
                <Label htmlFor="name">Valor Mínimo</Label>
                <Input
                  className="mt-2"
                  type="number"
                  step='0.01'
                  disabled={disabled}
                  placeholder="Valor mínimo"
                  {...createContaCorrenteMethods.register('valorMinDiverg')}
                />
              </div>

              <div className='mt-2'>
                <Label htmlFor="name">Valor máximo</Label>
                <Input
                  className="mt-2"
                  type="number"
                  step='0.01'
                  disabled={disabled}
                  placeholder="Valor máximo"
                  {...createContaCorrenteMethods.register('valorMaxDiverg')}
                />
              </div>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div className='mt-2'>
                <Label htmlFor="name">Percentual Mínimo</Label>
                <Input
                  className="mt-2"
                  type="number"
                  step='0.01'
                  disabled={disabled}
                  placeholder="Percentual mínimo"
                  {...createContaCorrenteMethods.register('percMinDiverg')}
                />
              </div>

              <div className='mt-2'>
                <Label htmlFor="name">Percentual máximo</Label>
                <Input
                  className="mt-2"
                  type="number"
                  step='0.01'
                  disabled={disabled}
                  placeholder="Percentual máximo"
                  {...createContaCorrenteMethods.register('percMaxDiverg')}
                />
              </div>
            </div>
          </fieldset>


          <div className='mt-2'>
            <Label className='text-base font-[Poppins-Regular]'>
              Carteira de Cobrança
              <div className="mt-2 border rounded-md pr-6">
                <Controller
                  name="carteiraId"
                  control={createContaCorrenteMethods.control}
                  render={({ field }) => (
                    <Select
                      disabled={disabled}
                      onValueChange={(value) => field.onChange(value)}
                      value={field.value}
                    >
                      <SelectTrigger className='h-6'>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {carteiraCobranca && carteiraCobranca.map((carteira) => (
                          <SelectItem value={carteira.id.toString()}>{carteira.descricao}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {/*!!createContaCorrenteMethods?.formState?.errors?.tipoAgendamento?.message && (
                <span>{createContaCorrenteMethods?.formState?.errors?.tipoAgendamento?.message}</span>
              )*/}
              </div>
            </Label>
          </div>

          <div className='mt-2'>
            <Label className='text-base font-[Poppins-Regular]'>
              Espécie de Cobrança
              <div className="mt-2 border rounded-md pr-6">
                <Controller
                  name="especieId"
                  control={createContaCorrenteMethods.control}
                  render={({ field }) => (
                    <Select
                      disabled={disabled}
                      onValueChange={(value) => field.onChange(value)}
                      value={field.value}
                    >
                      <SelectTrigger className='h-6'>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {especieCobranca && especieCobranca.map((especie) => (
                          <SelectItem value={especie.id.toString()}>{especie.descricao}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {/*!!createContaCorrenteMethods?.formState?.errors?.tipoAgendamento?.message && (
                <span>{createContaCorrenteMethods?.formState?.errors?.tipoAgendamento?.message}</span>
              )*/}
              </div>
            </Label>
          </div>
        </fieldset>

      </div>
    </div >
  )
}

export const ContaCorrenteFormSubmitButton = ({
  createContaCorrenteMethods,
  disabled
}: {
  createContaCorrenteMethods: UseFormReturn<ContaCorrenteSchema>
  disabled?: boolean
}) => {
  return (
    <div className="">
      <Button
        type="submit"
        className="mt-4"
        size={"sm"}
        disabled={
          disabled
          ||
          !createContaCorrenteMethods.formState.isDirty ||
          !createContaCorrenteMethods.formState.isValid
        }
      >
        Criar Conta Corrente
      </Button>
    </div>
  )
}

export const ContaCorrenteForm = {
  Root: ContaCorrenteFormRoot,
  FormContent: ContaCorrenteFormContent,
  SubmitButton: ContaCorrenteFormSubmitButton
}

