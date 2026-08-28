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
import { Controller, FormProvider, UseFormReturn } from 'react-hook-form'
import { Textarea } from '@/components/ui/textarea'
import { CondominioSchema } from '@/schemas/condominio.schema'
import { DocumentUpload } from '@/pages/main/imoveis/criarImovel/components/document-upload'
import { FORMA_RATEIO_OPTIONS } from '@/constants/formarateio'

export const CondominioFormRoot = ({
  children,
  createCondominioMethods,
  onSubmitCondominioData
}: {
  createCondominioMethods: UseFormReturn<CondominioSchema>
  children: React.ReactNode
  onSubmitCondominioData: (data: CondominioSchema) => void
}) => {
  return <form onSubmit={createCondominioMethods.handleSubmit(onSubmitCondominioData)}>{children}</form>
}

export const CondominioFormContent = ({
  createCondominioMethods,
  disabled
}: {
  createCondominioMethods: UseFormReturn<CondominioSchema>
  disabled?: boolean
}) => {

  return (
    <div className="space-y-4">
      <div>
        <FormProvider {...createCondominioMethods}>
          <DocumentUpload disabled={disabled} downloadDocuments={true} />
          {/*<PropertyImageUpload disabled={disabled} />*/}
        </FormProvider>
      </div>
      <div className="space-y-4 font-[Poppins-Regular]">
        <div className='mt-2'>
          <Label htmlFor="name">Descrição</Label>
          <Textarea placeholder="Descrição principal do condomínio "
            {...createCondominioMethods.register('name')}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Label className='text-base font-[Poppins-Regular]'>
            CEP
            <Input
              className="mt-2"
              type="text"
              disabled={disabled}
              placeholder="CEP"
              {...createCondominioMethods.register('cep', {
                onChange: async (e) => {
                  let cep = e.target.value?.replace(/\D/g, '') // Remove caracteres não numéricos
                  const cleanedCep = cep
                  // Formata o CEP para o formato '#####-###'
                  console.log('first cep', cep)
                  if (cep.length > 5) {
                    cep = `${cep.slice(0, 5)}-${cep.slice(5, 8)}`
                    createCondominioMethods.setValue('cep', cep)
                  }
                  if (cep?.replace(/\D/g, '')?.length === 8) {
                    try {
                      console.log(cep)
                      const response = await api.get<ApiCep>(`cep/${cleanedCep}`)
                      const data = response.data

                      if (data) {
                        // Preenche os campos com os dados retornados
                        createCondominioMethods.setValue('logradouro', data.logradouro || '')
                        createCondominioMethods.setValue('bairro', data.bairro || '')
                        createCondominioMethods.setValue('cidade', data.localidade || '')
                        createCondominioMethods.setValue('estado', data.estado || '')
                      } else {
                        // Caso o CEP seja inválido
                        createCondominioMethods.setError('cep', {
                          type: 'manual',
                          message: 'CEP inválido'
                        })
                      }
                    } catch (error) {
                      createCondominioMethods.setError('cep', {
                        type: 'manual',
                        message: 'Erro ao buscar o CEP'
                      })
                    }
                  }
                }
              })}
            />
            {createCondominioMethods.formState.errors.cep?.message &&
              (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                {createCondominioMethods.formState.errors.cep.message}
              </p>)}
          </Label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Label className='text-base font-[Poppins-Regular]'>
            Logradouro
            <Input
              className="mt-2"
              type="text"
              disabled={disabled}
              placeholder="Logradouro"
              {...createCondominioMethods.register('logradouro')}
            />
            {createCondominioMethods.formState.errors.logradouro?.message &&
              (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                {createCondominioMethods.formState.errors.logradouro.message}
              </p>)}
          </Label>

          <Label className='text-base font-[Poppins-Regular]'>
            Número
            <Input
              className="mt-2"
              type="text"
              disabled={disabled}
              placeholder="Número"
              {...createCondominioMethods.register('numero')}
            />
            {createCondominioMethods.formState.errors.numero?.message &&
              (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                {createCondominioMethods.formState.errors.numero.message}
              </p>)}
          </Label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Label className='text-base font-[Poppins-Regular]'>
            Bairro
            <Input
              className="mt-2"
              type="text"
              disabled={disabled}
              placeholder="Bairro"
              {...createCondominioMethods.register('bairro')}
            />
            {createCondominioMethods.formState.errors.bairro?.message &&
              (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                {createCondominioMethods.formState.errors.bairro.message}
              </p>)}
          </Label>
          <Label className='text-base font-[Poppins-Regular]'>
            Cidade
            <Input
              className="mt-2"
              type="text"
              disabled={disabled}
              placeholder="Cidade"
              {...createCondominioMethods.register('cidade')}
            />
            {createCondominioMethods.formState.errors.cidade?.message &&
              (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                {createCondominioMethods.formState.errors.cidade.message}
              </p>)}
          </Label>

          <Label className='text-base font-[Poppins-Regular]'>
            Complemento
            <Input
              className="mt-2"
              type="text"
              disabled={disabled}
              placeholder="Complemento"
              {...createCondominioMethods.register('complemento')}
            />
            {createCondominioMethods.formState.errors.complemento?.message &&
              (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                {createCondominioMethods.formState.errors.complemento.message}
              </p>)}
          </Label>
        </div>


        <div className='mt-2 mr-5'>
          <Label className='text-base font-[Poppins-Regular]'>
            Estado
            <div className='mt-2'>
              <Controller
                name="estado"
                control={createCondominioMethods.control}

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
              {createCondominioMethods.formState.errors.estado?.message &&
                (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                  {createCondominioMethods.formState.errors.estado.message}
                </p>)}
            </div>
          </Label>
        </div>

        <div className='mt-2 mr-5'>
          <Label className='text-base font-[Poppins-Regular]'>
            Forma de Rateio
            <div className='mt-2'>
              <Controller
                name="formaRateio"
                control={createCondominioMethods.control}
                render={({ field }) => (
                  <Select
                    disabled={disabled}
                    aria-label={field.value}
                    onValueChange={(value) => field.onChange(value)}
                    value={field.value}                    
                  >
                    <SelectTrigger value={field.value}>
                      <SelectValue placeholder="Selecione a forma de rateio" style={{color: "#034869"}}/>
                    </SelectTrigger>
                    <SelectContent>
                      {FORMA_RATEIO_OPTIONS.map((value) => (
                        <SelectItem key={value.label} value={value.value} style={{color: "#034869"}}>
                          {value.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {createCondominioMethods.formState.errors.formaRateio?.message &&
                (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                  {createCondominioMethods.formState.errors.formaRateio.message}
                </p>)}
            </div>
          </Label>
        </div>
      </div>
    </div>
  )
}

export const CondominioFormSubmitButton = ({
  createCondominioMethods,
  disabled
}: {
  createCondominioMethods: UseFormReturn<CondominioSchema>
  disabled?: boolean
}) => {
  return (
    <div className="">
      <Button
        type="submit"
        className="mt-4 hover:bg-[#066c9f] hover:cursor-pointer bg-[#034869]"
        size={"sm"}
        disabled={
          disabled
          ||
          !createCondominioMethods.formState.isDirty ||
          !createCondominioMethods.formState.isValid
        }                
      >
        Criar Condomínio
      </Button>
    </div>
  )
}

export const CondominioForm = {
  Root: CondominioFormRoot,
  FormContent: CondominioFormContent,
  SubmitButton: CondominioFormSubmitButton
}
