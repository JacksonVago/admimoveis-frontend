
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
import { ESTADOS } from '@/constants/estados'
import { ApiCep } from '@/interfaces/cep'
import api from '@/services/axios/api'
import { Controller,  UseFormReturn } from 'react-hook-form'
import { EmpresaSchema } from '@/schemas/empresa.schema'
import { formatCpfCnpj, formatPhone } from '@/utils/format-cpfcnpj'
import { Switch, Thumb } from "@radix-ui/react-switch"
import { useRef, useState } from 'react'
import { TipoLancamento } from '@/interfaces/lancamentotipo'
import { useQuery } from '@tanstack/react-query'
import { useGlobalParams } from '@/globals/GlobalParams'
import { Download, ImagePlus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export const getTipos = async (empresaId: number) => {
  return await api.get<TipoLancamento[]>('tipolancamento/' + empresaId)
}

export const EmpresaFormRoot = ({
  children,
  createEmpresaMethods,
  onSubmitEmpresaData
}: {
  createEmpresaMethods: UseFormReturn<EmpresaSchema>
  children: React.ReactNode
  onSubmitEmpresaData: (data: EmpresaSchema) => void
}) => {
  return (
    <form onSubmit={createEmpresaMethods.handleSubmit(onSubmitEmpresaData)}>{children}</form>
  )
}

export const EmpresaFormContent = ({
  createEmpresaMethods,
  disabled
}: {
  createEmpresaMethods: UseFormReturn<EmpresaSchema>
  disabled?: boolean
}) => {
  const [showBoleto, setShowBoleto] = useState(createEmpresaMethods.getValues("emiteBoleto") === "S" ? true : false);
  //Globals
  const glb_params = useGlobalParams();
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      createEmpresaMethods.setValue('logo', URL.createObjectURL(files[0]), {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true
      })
    }
  }

  //Consulta Tipo imóvel
  const {
    data: tipoLancamento
  } = useQuery({
    queryKey: ['tipolancamento'],
    queryFn: () => getTipos(Number(glb_params.id_empresa))
  });

  const handleAddImageClick = () => {
    fileInputRef.current?.click()
  }

  const downloadDocument = async (logo: any) => {
    try {
      const blobName = import.meta.env.VITE_AZURE_BLOB_CONTAINER + logo;
      const a = document.createElement('a');
      a.href = blobName;
      a.download = logo; // Desired filename for download
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  return (
    <>
      <div className="space-y-4 font-[Poppins-Regular]">
        <div className="grid grid-cols-2 gap-4">
          <Label className="text-base">
            Nome
            <Input
              className="mt-1"
              type="text"
              disabled={disabled}
              placeholder="Nome completo"
              {...createEmpresaMethods.register('nome')}
            />
            {createEmpresaMethods.formState.errors.nome?.message &&
              (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                {createEmpresaMethods.formState.errors.nome.message}
              </p>)}
          </Label>

          <Label className="text-base">
            CPF/CNPJ
            <Input
              className="mt-1"
              type="text"
              disabled={disabled}
              placeholder="Cpf/Cnpj"
              {...createEmpresaMethods.register('cnpj', {
                onChange: async (e) => {
                  const { value } = e.target;
                  e.target.value = formatCpfCnpj(value);
                }
              })}
            />
            {createEmpresaMethods.formState.errors.cnpj?.message &&
              (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                {createEmpresaMethods.formState.errors.cnpj.message}
              </p>)}
          </Label>

          <Label className="text-base">
            Email
            <Input
              className="mt-1"
              type="email"
              disabled={disabled}
              placeholder="Email"
              {...createEmpresaMethods.register('email')}
            />
            {createEmpresaMethods.formState.errors.email?.message &&
              (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                {createEmpresaMethods.formState.errors.email.message}
              </p>)}
          </Label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Label className="text-base">
            Telefone
            <Input
              className="mt-2"
              type="text"
              disabled={disabled}
              placeholder="Telefone"
              {...createEmpresaMethods.register('telefone', {
                onChange: async (e) => {
                  const { value } = e.target;
                  e.target.value = formatPhone(value);
                }
              })}
            />
            {createEmpresaMethods.formState.errors.telefone?.message &&
              (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                {createEmpresaMethods.formState.errors.telefone.message}
              </p>)}
          </Label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Label className="text-base">
            CEP
            <Input
              className="mt-2"
              type="text"
              disabled={disabled}
              placeholder="CEP"
              {...createEmpresaMethods.register('cep', {
                onChange: async (e) => {
                  let cep = e.target.value?.replace(/\D/g, '') // Remove caracteres não numéricos
                  const cleanedCep = cep
                  // Formata o CEP para o formato '#####-###'
                  if (cep.length > 5) {
                    cep = `${cep.slice(0, 5)}-${cep.slice(5, 8)}`
                    createEmpresaMethods.setValue('cep', cep)
                  }
                  if (cep?.replace(/\D/g, '')?.length === 8) {
                    try {
                      const response = await api.get<ApiCep>(`cep/${cleanedCep}`)
                      const data = response.data

                      if (data) {
                        // Preenche os campos com os dados retornados
                        createEmpresaMethods.setValue('logradouro', data.logradouro || '')
                        createEmpresaMethods.setValue('bairro', data.bairro || '')
                        createEmpresaMethods.setValue('cidade', data.localidade || '')
                        createEmpresaMethods.setValue('estado', data.estado || '')
                      } else {
                        // Caso o CEP seja inválido
                        createEmpresaMethods.setError('cep', {
                          type: 'manual',
                          message: 'CEP inválido'
                        })
                      }
                    } catch (error) {
                      createEmpresaMethods.setError('cep', {
                        type: 'manual',
                        message: 'Erro ao buscar o CEP'
                      })
                    }
                  }
                }
              })}
            />
            {createEmpresaMethods.formState.errors.cep?.message &&
              (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                {createEmpresaMethods.formState.errors.cep.message}
              </p>)}
          </Label>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Label className="text-base">
            Logradouro
            <Input
              className="mt-2"
              type="text"
              disabled={disabled}
              placeholder="Logradouro"
              {...createEmpresaMethods.register('logradouro')}
            />
            {createEmpresaMethods.formState.errors.logradouro?.message &&
              (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                {createEmpresaMethods.formState.errors.logradouro.message}
              </p>)}
          </Label>

        </div>

        <div className="grid grid-cols-2 gap-4">
          <Label className="text-base">
            Número
            <Input
              className="mt-2"
              type="text"
              disabled={disabled}
              placeholder="Número"
              {...createEmpresaMethods.register('numero')}
            />
            {createEmpresaMethods.formState.errors.numero?.message &&
              (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                {createEmpresaMethods.formState.errors.numero.message}
              </p>)}
          </Label>
          <Label className="text-base">
            Complemento
            <Input
              className="mt-2"
              type="text"
              disabled={disabled}
              placeholder="Complemento"
              {...createEmpresaMethods.register('complemento')}
            />
            {createEmpresaMethods.formState.errors.complemento?.message &&
              (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                {createEmpresaMethods.formState.errors.complemento.message}
              </p>)}
          </Label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Label className="text-base">
            Bairro
            <Input
              className="mt-2"
              type="text"
              disabled={disabled}
              placeholder="Bairro"
              {...createEmpresaMethods.register('bairro')}
            />
            {createEmpresaMethods.formState.errors.bairro?.message &&
              (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                {createEmpresaMethods.formState.errors.bairro.message}
              </p>)}
          </Label>
          <Label className="text-base">
            Cidade
            <Input
              className="mt-2"
              type="text"
              disabled={disabled}
              placeholder="Cidade"
              {...createEmpresaMethods.register('cidade')}
            />
            {createEmpresaMethods.formState.errors.cidade?.message &&
              (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                {createEmpresaMethods.formState.errors.cidade.message}
              </p>)}
          </Label>
        </div>

        <div className='mt-2'>
          <Label className="text-base">
            Estado
            <div className='mt-2'>
              <Controller
                name="estado"
                control={createEmpresaMethods.control}
                render={({ field }) => (
                  <Select
                    disabled={disabled}
                    onValueChange={(value) => field.onChange(value)}
                    value={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS.map((estado) => (
                        <SelectItem key={estado.sigla} value={estado.sigla}>
                          {estado.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            {createEmpresaMethods.formState.errors.estado?.message &&
              (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                {createEmpresaMethods.formState.errors.estado.message}
              </p>)}
          </Label>
        </div>

        <div className="flex justify-center font-[Poppins-ExtraLight]">
          <Label className='font-bold text-lg'>ALERTAS</Label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Label className="text-base">
            Reajuste de Locação
            <Input
              className="mt-2"
              type="number"
              disabled={disabled}
              placeholder="Dias"
              {...createEmpresaMethods.register('avisosReajusteLocacao')}
            />
            {createEmpresaMethods.formState.errors.avisosReajusteLocacao?.message &&
              (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                {createEmpresaMethods.formState.errors.avisosReajusteLocacao.message}
              </p>)}
          </Label>
          <Label className="text-base">
            Renovação de Contrato
            <Input
              className="mt-2"
              type="number"
              disabled={disabled}
              placeholder="Dias"
              {...createEmpresaMethods.register('avisosRenovacaoContrato')}
            />
            {createEmpresaMethods.formState.errors.avisosRenovacaoContrato?.message &&
              (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                {createEmpresaMethods.formState.errors.avisosRenovacaoContrato.message}
              </p>)}
          </Label>
          <Label className="text-base">
            Seguro Fiança
            <Input
              className="mt-2"
              type="number"
              disabled={disabled}
              placeholder="Dias"
              {...createEmpresaMethods.register('avisosSeguroFianca')}
            />
            {createEmpresaMethods.formState.errors.avisosSeguroFianca?.message &&
              (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                {createEmpresaMethods.formState.errors.avisosSeguroFianca.message}
              </p>)}
          </Label>
          <Label className="text-base">
            Seguro Incêndio
            <Input
              className="mt-2"
              type="number"
              disabled={disabled}
              placeholder="Dias"
              {...createEmpresaMethods.register('avisosSeguroIncendio')}
            />
            {createEmpresaMethods.formState.errors.avisosSeguroIncendio?.message &&
              (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                {createEmpresaMethods.formState.errors.avisosSeguroIncendio.message}
              </p>)}
          </Label>
          <Label className="text-base">
            Titulo de Capitalização
            <Input
              className="mt-2"
              type="number"
              disabled={disabled}
              placeholder="Dias"
              {...createEmpresaMethods.register('avisosTituloCapitalizacao')}
            />
            {createEmpresaMethods.formState.errors.avisosTituloCapitalizacao?.message &&
              (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                {createEmpresaMethods.formState.errors.avisosTituloCapitalizacao.message}
              </p>)}
          </Label>
          <Label className="text-base">
            Depósito Calcão
            <Input
              className="mt-2"
              type="number"
              disabled={disabled}
              placeholder="Dias"
              {...createEmpresaMethods.register('avisosDepositoCalcao')}
            />
            {createEmpresaMethods.formState.errors.avisosDepositoCalcao?.message &&
              (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                {createEmpresaMethods.formState.errors.avisosDepositoCalcao.message}
              </p>)}
          </Label>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Label className='col-span-2'>
            Porcentagem Comissão
            <Input
              className="mt-2"
              type="number"
              step="any"
              disabled={disabled}
              placeholder="Porcentagem comissão"
              {...createEmpresaMethods.register('porcentagemComissao', { valueAsNumber: true })}
            />
            {createEmpresaMethods.formState.errors.porcentagemComissao?.message &&
              (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                {createEmpresaMethods.formState.errors.porcentagemComissao.message}
              </p>)}
          </Label>

        </div>

        {/*Logo */}
        <div className="mb-6 w-full space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-2xlg font-semibold">Imagens do Imóvel</h3>
            {!disabled && (
              <Button onClick={handleAddImageClick} variant="outline" size="sm" type="button">
                <ImagePlus className="mr-2 h-4 w-4" />
                Adicionar Logo
              </Button>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            disabled={disabled}
            onChange={handleImageUpload}
          />
            <div className="p-1">
              <Card>
                <CardContent className="relative flex aspect-square items-center justify-center p-2">
                  <img
                    src={createEmpresaMethods.getValues("logo")}
                    className="h-full w-full rounded-md object-cover"
                  />
                  <Button
                    className="absolute left-98 top-7 h-6 w-2 opacity-0 hover:opacity-75"
                    onClick={() => downloadDocument("logo")}
                    type="button"
                  >
                    <Download />
                  </Button>
                </CardContent>
              </Card>
            </div>

        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          <label
            className="Label"
            htmlFor="airplane-mode"
            style={{ paddingRight: 15 }}
          >
            Boletos
          </label>
          <Switch className="SwitchRoot focus:outline-none" id="airplane-mode"
            checked={createEmpresaMethods.getValues("emiteBoleto") === "S" ? true : false}
            onCheckedChange={(checked) => { createEmpresaMethods.setValue("emiteBoleto", (checked ? "S" : "N")); setShowBoleto(!showBoleto); }}>
            <Thumb className="SwitchThumb" />
          </Switch>
        </div>

        {showBoleto && (
          <div className="mt-2 border p-2 rounded-md">
            <div className="grid grid-cols-1 gap-4">
              <Label className="text-base">
                Taxa de Boleto
                <Input
                  className="mt-2"
                  type="number"
                  step="any"
                  disabled={disabled}
                  placeholder="Taxa"
                  {...createEmpresaMethods.register('valorTaxaBoleto')}
                />
                {createEmpresaMethods.formState.errors.valorTaxaBoleto?.message &&
                  (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                    {createEmpresaMethods.formState.errors.valorTaxaBoleto.message}
                  </p>)}
              </Label>
              <div className='mt-2 mr-5'>
                <Label className='text-base font-[Poppins-Regular]'>
                  Tipo de Lançamento
                  <div className='mt-2 border rounded-md'>
                    <Controller
                      name="tipoId"
                      control={createEmpresaMethods.control}

                      render={({ field }) => (
                        <Select
                          disabled={disabled}
                          onValueChange={(value) => field.onChange(value)}
                          value={String(field.value)}
                        >
                          <SelectTrigger className='h-4'>
                            <SelectValue placeholder="Selecione o tipo de lançamento" />
                          </SelectTrigger>
                          <SelectContent>
                            {tipoLancamento?.data.map((tipo) => (
                              <SelectItem key={tipo.id} value={tipo.id.toString()}>
                                {tipo.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {createEmpresaMethods.formState.errors.tipoId?.message &&
                      (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                        {createEmpresaMethods.formState.errors.tipoId.message}
                      </p>)}
                  </div>
                </Label>
              </div>
              <Label className="text-base">
                Dias de antecedência para emissão de boletos
                <Input
                  className="mt-2"
                  type="number"
                  disabled={disabled}
                  placeholder="Dias"
                  {...createEmpresaMethods.register('emissaoBoletoAntecedencia')}
                />
                {createEmpresaMethods.formState.errors.emissaoBoletoAntecedencia?.message &&
                  (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                    {createEmpresaMethods.formState.errors.emissaoBoletoAntecedencia.message}
                  </p>)}
              </Label>

              <Label className="text-base">
                Porcentagem de Multa por atraso
                <Input
                  className="mt-2"
                  type="number"
                  disabled={disabled}
                  placeholder="Porcentagem de multa"
                  {...createEmpresaMethods.register('porcentagemMultaAtraso')}
                />
                {createEmpresaMethods.formState.errors.porcentagemMultaAtraso?.message &&
                  (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                    {createEmpresaMethods.formState.errors.porcentagemMultaAtraso.message}
                  </p>)}
              </Label>
              <Label className="text-base">
                Porcentagem de Juros por atraso
                <Input
                  className="mt-2"
                  type="number"
                  step="any"
                  disabled={disabled}
                  placeholder="Porcentagem de juros"
                  {...createEmpresaMethods.register('porcentagemJurosAtraso', { valueAsNumber: true })}
                />
                {createEmpresaMethods.formState.errors.porcentagemJurosAtraso?.message &&
                  (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                    {createEmpresaMethods.formState.errors.porcentagemJurosAtraso.message}
                  </p>)}
              </Label>
            </div>
          </div>
        )}

      </div>
    </>
  )
}

export const EmpresaFormSubmitButton = ({
  createEmpresaMethods,
  disabled
}: {
  createEmpresaMethods: UseFormReturn<EmpresaSchema>
  disabled?: boolean
}) => {
  return (
    <div className='flex justify-end mt-4'>
      <Button
        type="submit"
        disabled={
          disabled ||
          !createEmpresaMethods.formState.isDirty ||
          !createEmpresaMethods.formState.isValid
        }
      >
        Finalizar Cadastro
      </Button>
    </div>
  )
}

export const EmpresaForm = {
  Root: EmpresaFormRoot,
  Content: EmpresaFormContent,
  SubmitButton: EmpresaFormSubmitButton
}

// ;<h2 className="mb-4 text-2xl font-bold">Locatário</h2>
