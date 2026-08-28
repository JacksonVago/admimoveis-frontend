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
import { ESTADO_CIVIL_OPTIONS } from '@/constants/estado-civil'
import { ESTADOS } from '@/constants/estados'
import { ApiCep } from '@/interfaces/cep'
import api from '@/services/axios/api'
import { Controller, FormProvider, UseFormReturn } from 'react-hook-form'
import { DocumentUpload } from '../../imoveis/criarImovel/components/document-upload'
import { ClienteSchema } from '@/schemas/cliente.schema'
import { formatCpfCnpj, formatPhone } from '@/utils/format-cpfcnpj'

export const ClienteFormRoot = ({
  children,
  createClienteMethods,
  onSubmitClienteData
}: {
  createClienteMethods: UseFormReturn<ClienteSchema>
  children: React.ReactNode
  onSubmitClienteData: (data: ClienteSchema) => void
}) => {
  return (
    <form onSubmit={createClienteMethods.handleSubmit(onSubmitClienteData)}>{children}</form>
  )
}

export const ClienteFormContent = ({
  createClienteMethods,
  disabled
}: {
  createClienteMethods: UseFormReturn<ClienteSchema>
  disabled?: boolean
}) => {
  return (
    <>
      <FormProvider {...createClienteMethods}>
        <DocumentUpload disabled={disabled} downloadDocuments={disabled} />
      </FormProvider>
      <div className="space-y-4 font-[Poppins-Regular]" >
        <div className="grid grid-cols-2 gap-4">
          <Label className="text-base">
            Nome
            <Input
              className="mt-1"
              type="text"
              disabled={disabled}
              placeholder="Nome completo"
              {...createClienteMethods.register('nome')}
              helperText={createClienteMethods.formState?.errors?.nome?.message}
            />
          </Label>
          <Label className="text-base">
            Email
            <Input
              className="mt-1"
              type="email"
              disabled={disabled}
              placeholder="Email"
              {...createClienteMethods.register('email')}
              helperText={createClienteMethods.formState?.errors?.email?.message}
            />
          </Label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Label className="text-base">
            Documento
            <Input
              className="mt-2"
              type="text"
              disabled={disabled}
              placeholder="CPF ou CNPJ"
              {...createClienteMethods.register('documento',
                {
                  onChange: async (e) => {
                    const { value } = e.target;
                    e.target.value = formatCpfCnpj(value);
                  }
                }
              )}
              helperText={createClienteMethods.formState?.errors?.documento?.message}
            />
          </Label>

          <Label className="text-base">
            Telefone
            <Input
              className="mt-2"
              type="tel"
              disabled={disabled}
              placeholder="Telefone"
              {...createClienteMethods.register('telefone',
                {
                  onChange: async (e) => {
                    const { value } = e.target;
                    e.target.value = formatPhone(value);
                  }
                }
              )}
              helperText={createClienteMethods.formState?.errors?.telefone?.message}
            />
          </Label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Label className="text-base">
            Estado Civil
            <div className="mt-2 mr-6">
              <Controller
                name="estadoCivil"
                control={createClienteMethods.control}
                render={({ field }) => (
                  <Select
                    disabled={disabled}
                    onValueChange={(value) => field.onChange(value)}
                    value={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Estado civil" />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADO_CIVIL_OPTIONS.map((estadoCivil) => (
                        <SelectItem key={estadoCivil.label} value={estadoCivil.value}>
                          {estadoCivil.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {!!createClienteMethods?.formState?.errors?.estado?.message && (
                <span>{createClienteMethods?.formState?.errors?.estado?.message}</span>
              )}
            </div>
          </Label>
          <Label className="text-base">
            Profissão
            <Input
              className="mt-2"
              type="string"
              disabled={disabled}
              placeholder="Profissão"
              {...createClienteMethods.register('profissao')}
              helperText={createClienteMethods.formState?.errors?.profissao?.message}
            />
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
              {...createClienteMethods.register('cep', {
                onChange: async (e) => {
                  let cep = e.target.value?.replace(/\D/g, '') // Remove caracteres não numéricos
                  const cleanedCep = cep
                  // Formata o CEP para o formato '#####-###'
                  console.log('first cep', cep)
                  if (cep.length > 5) {
                    cep = `${cep.slice(0, 5)}-${cep.slice(5, 8)}`
                    createClienteMethods.setValue('cep', cep)
                  }
                  if (cep?.replace(/\D/g, '')?.length === 8) {
                    try {
                      console.log(cep)
                      const response = await api.get<ApiCep>(`cep/${cleanedCep}`)
                      const data = response.data

                      if (data) {
                        // Preenche os campos com os dados retornados
                        createClienteMethods.setValue('logradouro', data.logradouro || '')
                        createClienteMethods.setValue('bairro', data.bairro || '')
                        createClienteMethods.setValue('cidade', data.localidade || '')
                        createClienteMethods.setValue('estado', data.estado || '')
                      } else {
                        // Caso o CEP seja inválido
                        createClienteMethods.setError('cep', {
                          type: 'manual',
                          message: 'CEP inválido'
                        })
                      }
                    } catch (error) {
                      createClienteMethods.setError('cep', {
                        type: 'manual',
                        message: 'Erro ao buscar o CEP'
                      })
                    }
                  }
                }
              })}
              helperText={createClienteMethods.formState?.errors?.cep?.message}
            />
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
              {...createClienteMethods.register('logradouro')}
              helperText={createClienteMethods.formState?.errors?.logradouro?.message}
            />
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
              {...createClienteMethods.register('numero')}
              helperText={createClienteMethods.formState?.errors?.numero?.message}
            />
          </Label>
          <Label className="text-base">
            Complemento
            <Input
              className="mt-2"
              type="text"
              disabled={disabled}
              placeholder="Complemento"
              {...createClienteMethods.register('complemento')}
              helperText={createClienteMethods.formState?.errors?.complemento?.message}
            />
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
              {...createClienteMethods.register('bairro')}
              helperText={createClienteMethods.formState?.errors?.bairro?.message}
            />
          </Label>
          <Label className="text-base">
            Cidade
            <Input
              className="mt-2"
              type="text"
              disabled={disabled}
              placeholder="Cidade"
              {...createClienteMethods.register('cidade')}
              helperText={createClienteMethods.formState?.errors?.cidade?.message}
            />
          </Label>
        </div>

        <div className='mt-2'>
          <Label className="text-base">
            Estado
            <div className='mt-2'>
              <Controller
                name="estado"
                control={createClienteMethods.control}
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
              {createClienteMethods.formState?.errors?.estado?.message && (
                <span>{createClienteMethods.formState?.errors?.estado?.message}</span>
              )}
            </div>
          </Label>
        </div>
      </div>
      {/* <h2 className="mb-4 text-xl font-semibold">informações de locação</h2> */}

      {/* data inicio and valor aluguel */}
      {/* <div className="grid grid-cols-2 gap-4">
        <Label className="text-base">
          Data de início da locação
          <Input
            type="date"
            placeholder="Data de início"
            {...createLocatarioMethods.register('dataInicio')}
            helperText={createLocatarioMethods.formState?.errors?.dataInicio?.message}
          />
        </Label>

        <Label className="text-base">
          Data de término da locação
          <Input
            type="date"
            placeholder="Data de término"
            {...createLocatarioMethods.register('dataFim')}
            helperText={createLocatarioMethods.formState?.errors?.dataFim?.message}
          />
        </Label>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Label className="text-base">
          Dia de vencimento do pagamento
          <Input
            type="number"
            placeholder="Dia de vencimento"
            min={1}
            max={28}
            {...createLocatarioMethods.register('diaVencimentoPagamento')}
            helperText={createLocatarioMethods.formState?.errors?.diaVencimentoPagamento?.message}
          />
        </Label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Label className="text-base">
          Escolha o tipo de garantia de locação
          <Controller
            name="garantiaLocacaoTipo"
            control={createLocatarioMethods.control}
            render={({ field }) => (
              <Select onValueChange={(value) => field.onChange(value)} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de garantia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fiador">Fiador</SelectItem>
                  <SelectItem value="titulo-capitalizacao">Título de Capitalização</SelectItem>
                  <SelectItem value="seguro-fianca">Seguro Fiança</SelectItem>
                  <SelectItem value="deposito-calcao">Depósito Caução</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {createLocatarioMethods.formState?.errors?.garantiaLocacaoTipo?.message && (
            <span>{createLocatarioMethods.formState?.errors?.garantiaLocacaoTipo?.message}</span>
          )}
        </Label>

        {createLocatarioMethods.watch('garantiaLocacaoTipo') === 'fiador' && (
          <div className="grid grid-cols-2 gap-4">
            <Label className="text-base">
              Nome do fiador
              <Input
                type="text"
                placeholder="Nome do fiador"
                {...createLocatarioMethods.register('fiadorNome')}
                helperText={createLocatarioMethods.formState?.errors?.fiadorNome?.message}
              />
            </Label>
            <Label className="text-base">
              CPF do fiador
              <Input
                type="text"
                placeholder="CPF do fiador"
                {...createLocatarioMethods.register('fiadorDocumento')}
                helperText={createLocatarioMethods.formState?.errors?.fiadorDocumento?.message}
              />
            </Label>
          </div>
        )}

        {createLocatarioMethods.watch('garantiaLocacaoTipo') === 'titulo-capitalizacao' && (
          <div className="grid grid-cols-1 gap-4">
            <Label className="text-base">
              Número do Título de Capitalização
              <Input
                type="text"
                placeholder="Número do Título"
                {...createLocatarioMethods.register('tituloCaptalizacaoNumero')}
                helperText={
                  createLocatarioMethods.formState?.errors?.tituloCaptalizacaoNumero?.message
                }
              />
            </Label>
          </div>
        )}

        {createLocatarioMethods.watch('garantiaLocacaoTipo') === 'seguro-fianca' && (
          <div className="grid grid-cols-1 gap-4">
            <Label className="text-base">
              Número do Seguro Fiança
              <Input
                type="text"
                placeholder="Número do Seguro"
                {...createLocatarioMethods.register('seguroFiancaNumero')}
                helperText={createLocatarioMethods.formState?.errors?.seguroFiancaNumero?.message}
              />
            </Label>
          </div>
        )}

        {createLocatarioMethods.watch('garantiaLocacaoTipo') === 'deposito-calcao' && (
          <div className="grid grid-cols-2 gap-4">
            <Label className="text-base">
              Valor do Depósito Caução
              <Input
                type="number"
                placeholder="Valor do Depósito"
                {...createLocatarioMethods.register('depositoCalcaoValor', {
                  valueAsNumber: true
                })}
                helperText={createLocatarioMethods.formState?.errors?.depositoCalcaoValor?.message}
              />
            </Label>
            <Label className="text-base">
              Tipo de Depósito
              <Controller
                name="depositoCalcaoTipo"
                control={createLocatarioMethods.control}
                render={({ field }) => (
                  <Select onValueChange={(value) => field.onChange(value)} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de depósito" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="imobiliaria">Imobiliária</SelectItem>
                      <SelectItem value="proprietario">Proprietário</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {createLocatarioMethods.formState?.errors?.depositoCalcaoTipo?.message && (
                <span>{createLocatarioMethods.formState?.errors?.depositoCalcaoTipo?.message}</span>
              )}
            </Label>
          </div>
        )}
      </div> */}
    </>
  )
}

export const ClienteFormSubmitButton = ({
  createClienteMethods,
  disabled
}: {
  createClienteMethods: UseFormReturn<ClienteSchema>
  disabled?: boolean
}) => {
  return (
    <div className='flex justify-end mt-4'>
      <Button
        type="submit"
        disabled={
          disabled ||
          !createClienteMethods.formState.isDirty ||
          !createClienteMethods.formState.isValid
        }
        className="hover:bg-[#a9d9ef] hover:cursor-pointer bg-[#034869] hover:text-[#034869] text-white"
      >
        Finalizar Cadastro
      </Button>
    </div>
  )
}

export const LocatarioForm = {
  Root: ClienteFormRoot,
  Content: ClienteFormContent,
  SubmitButton: ClienteFormSubmitButton
}

// ;<h2 className="mb-4 text-2xl font-bold">Locatário</h2>
