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
import { ImovelSchema } from '@/schemas/imovel.schema'
import api from '@/services/axios/api'
import { Controller, FormProvider, UseFormReturn } from 'react-hook-form'
import { IMOVEL_STATUS } from '../../constants/imovel'
import { PropertyImageUpload } from './multi-images-upload'
import { DocumentUpload } from './document-upload'
import { Textarea } from '@/components/ui/textarea'
import { useQuery } from '@tanstack/react-query'
import { TipoImovel } from '@/interfaces/tipoimovel'
import { useMediaQuery } from 'react-responsive'
import { getCondominiosEmp } from '@/pages/main/condominios/requests'
import { useGlobalParams } from '@/globals/GlobalParams'

export const getTipos = async (empresaId: number) => {
  return await api.get<TipoImovel[]>(`tipoimovel/${empresaId}`)
}

export const ImovelFormRoot = ({
  children,
  createImovelMethods,
  onSubmitImovelData
}: {
  createImovelMethods: UseFormReturn<ImovelSchema>
  children: React.ReactNode
  onSubmitImovelData: (data: ImovelSchema) => void
}) => {
  return <form onSubmit={createImovelMethods.handleSubmit(onSubmitImovelData)}>{children}</form>
}

export const ImovelFormContent = ({
  createImovelMethods,
  disabled
}: {
  createImovelMethods: UseFormReturn<ImovelSchema>
  disabled?: boolean
}) => {
  //Globals
  const glb_params = useGlobalParams();

  //const isPortrait = useMediaQuery({ query: '(min-width: 1224px)' })
  //const isTablet = useMediaQuery({ query: '(min-width: 746px)' })
  const isMobile = useMediaQuery({ query: '(max-width: 380px)' })

  //Consulta Tipo imóvel
  const {
    data: imovelTipo
  } = useQuery({
    queryKey: ['imovelTipo'],
    queryFn: () => getTipos(glb_params.id_empresa ? Number(glb_params.id_empresa) : 0)
  });

  //Carrega condomínios
  //Consulta bloco
  const {
    data: condominios,
  } = useQuery({
    queryKey: ['condominios', createImovelMethods.getValues('empresaId')],
    queryFn: () => getCondominiosEmp(createImovelMethods.getValues('empresaId'))
  });

  const handleChangeCondominio = async (value: string) => {
    const cond = condominios?.filter(c => c.id.toString() === value.split(';')[0])[0];
    if (cond) {
      const bloco = cond.blocos?.filter(b => b.id.toString() === value.split(';')[1])[0];
      if (bloco) {
        createImovelMethods.setValue('condominioId', Number(cond.id));
        createImovelMethods.setValue('blocoId', Number(bloco.id));
        createImovelMethods.setValue('cep', cond.endereco.cep);
        createImovelMethods.setValue('numero', Number(cond.endereco.numero));
        createImovelMethods.setValue('complemento', bloco.name);

        let cep = cond.endereco.cep.replace(/\D/g, '') // Remove caracteres não numéricos
        const cleanedCep = cep
        // Formata o CEP para o formato '#####-###'
        if (cep.length > 5) {
          cep = `${cep.slice(0, 5)}-${cep.slice(5, 8)}`
          createImovelMethods.setValue('cep', cep)
        }
        if (cep?.replace(/\D/g, '')?.length === 8) {
          try {
            console.log(cep)
            const response = await api.get<ApiCep>(`cep/${cleanedCep}`)
            const data = response.data

            if (data) {
              // Preenche os campos com os dados retornados
              createImovelMethods.setValue('logradouro', data.logradouro || '')
              createImovelMethods.setValue('bairro', data.bairro || '')
              createImovelMethods.setValue('cidade', data.localidade || '')
              createImovelMethods.setValue('estado', data.estado || '')
            } else {
              // Caso o CEP seja inválido
              createImovelMethods.setError('cep', {
                type: 'manual',
                message: 'CEP inválido'
              })
            }
          } catch (error) {
            createImovelMethods.setError('cep', {
              type: 'manual',
              message: 'Erro ao buscar o CEP'
            })
          }
        }
      }
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <FormProvider {...createImovelMethods}>
          <DocumentUpload disabled={disabled} downloadDocuments={true} />
          <PropertyImageUpload disabled={disabled} />
        </FormProvider>
      </div>
      <div className="space-y-4 font-[Poppins-Regular]">

        <div className='mt-2'>
          <Label className="text-base">
            Condomínio/Bloco
            <div className='mt-2'>
              <Controller
                name="condominioBloco"
                control={createImovelMethods.control}
                render={({ field }) => (
                  <Select 
                    disabled={disabled}
                    onValueChange={(value) => {
                      handleChangeCondominio(value);
                      field.onChange(value);
                    }}
                    value={field.value}
                  >
                    <SelectTrigger className='col-start-1 row-start-1 appearance-none border-blue-50 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full'>
                      <SelectValue placeholder="Selecione o condomínio" />
                    </SelectTrigger>
                    <SelectContent>
                      {condominios?.map((condominio) => (
                        condominio.blocos ? (
                          condominio.blocos.map((bloco) => (
                            <SelectItem key={condominio.id.toString() + ';' + bloco.id.toString()} value={condominio.id.toString() + ';' + bloco.id.toString()}>
                              {condominio.name + ' - ' + bloco.name}
                            </SelectItem>))
                        ) : (
                          <SelectItem key={condominio.id.toString()} value={condominio.id.toString()}>
                            {condominio.name}
                          </SelectItem>
                        )
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {createImovelMethods.formState?.errors?.condominioBloco?.message && (
                <span>{createImovelMethods.formState?.errors?.condominioBloco?.message}</span>
              )}
            </div>
          </Label>
        </div>
        <div className='mt-2'>
          <Label htmlFor="description">Descrição</Label>
          <Textarea placeholder="Descrição principal do imóvel "
            disabled={disabled}
            {...createImovelMethods.register('description')}
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
              {...createImovelMethods.register('cep', {
                onChange: async (e) => {
                  let cep = e.target.value?.replace(/\D/g, '') // Remove caracteres não numéricos
                  const cleanedCep = cep
                  // Formata o CEP para o formato '#####-###'
                  console.log('first cep', cep)
                  if (cep.length > 5) {
                    cep = `${cep.slice(0, 5)}-${cep.slice(5, 8)}`
                    createImovelMethods.setValue('cep', cep)
                  }
                  if (cep?.replace(/\D/g, '')?.length === 8) {
                    try {
                      console.log(cep)
                      const response = await api.get<ApiCep>(`cep/${cleanedCep}`)
                      const data = response.data

                      if (data) {
                        // Preenche os campos com os dados retornados
                        createImovelMethods.setValue('logradouro', data.logradouro || '')
                        createImovelMethods.setValue('bairro', data.bairro || '')
                        createImovelMethods.setValue('cidade', data.localidade || '')
                        createImovelMethods.setValue('estado', data.estado || '')
                      } else {
                        // Caso o CEP seja inválido
                        createImovelMethods.setError('cep', {
                          type: 'manual',
                          message: 'CEP inválido'
                        })
                      }
                    } catch (error) {
                      createImovelMethods.setError('cep', {
                        type: 'manual',
                        message: 'Erro ao buscar o CEP'
                      })
                    }
                  }
                }
              })}
            />
            {createImovelMethods.formState.errors.cep?.message &&
              (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                {createImovelMethods.formState.errors.cep.message}
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
              {...createImovelMethods.register('logradouro')}
            />
            {createImovelMethods.formState.errors.logradouro?.message &&
              (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                {createImovelMethods.formState.errors.logradouro.message}
              </p>)}
          </Label>

          <Label className='text-base font-[Poppins-Regular]'>
            Número
            <Input
              className="mt-2"
              type="text"
              disabled={disabled}
              placeholder="Número"
              {...createImovelMethods.register('numero')}
            />
            {createImovelMethods.formState.errors.numero?.message &&
              (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                {createImovelMethods.formState.errors.numero.message}
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
              {...createImovelMethods.register('bairro')}
            />
            {createImovelMethods.formState.errors.bairro?.message &&
              (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                {createImovelMethods.formState.errors.bairro.message}
              </p>)}
          </Label>
          <Label className='text-base font-[Poppins-Regular]'>
            Cidade
            <Input
              className="mt-2"
              type="text"
              disabled={disabled}
              placeholder="Cidade"
              {...createImovelMethods.register('cidade')}
            />
            {createImovelMethods.formState.errors.cidade?.message &&
              (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                {createImovelMethods.formState.errors.cidade.message}
              </p>)}
          </Label>

          <Label className='text-base font-[Poppins-Regular]'>
            Complemento
            <Input
              className="mt-2"
              type="text"
              disabled={disabled}
              placeholder="Complemento"
              {...createImovelMethods.register('complemento')}
            />
            {createImovelMethods.formState.errors.complemento?.message &&
              (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                {createImovelMethods.formState.errors.complemento.message}
              </p>)}
          </Label>
        </div>


        <div className='mt-2 mr-5'>
          <Label className='text-base font-[Poppins-Regular]'>
            Estado
            <div className='mt-2'>
              <Controller
                name="estado"
                control={createImovelMethods.control}

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
              {createImovelMethods.formState.errors.estado?.message &&
                (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                  {createImovelMethods.formState.errors.estado.message}
                </p>)}
            </div>
          </Label>
        </div>

        <div className='mt-2 mr-5'>
          <Label className='text-base font-[Poppins-Regular]'>
            Status do imóvel
            <div className='mt-2'>
              <Controller
                name="status"
                control={createImovelMethods.control}
                render={({ field }) => (
                  <Select
                    disabled={disabled}
                    aria-label={field.value}
                    onValueChange={(value) => field.onChange(value)}
                    value={field.value}
                  >
                    <SelectTrigger value={field.value}>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      {IMOVEL_STATUS.map((value) => (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {createImovelMethods.formState.errors.status?.message &&
                (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                  {createImovelMethods.formState.errors.status.message}
                </p>)}
            </div>
          </Label>
        </div>

        <div className='mt-2 mr-5'>
          <Label className='text-base font-[Poppins-Regular]'>
            Tipo do imóvel
            <div className='mt-2'>
              <Controller
                name="tipoId"
                control={createImovelMethods.control}
                render={({ field }) => (
                  <Select
                    disabled={disabled}
                    aria-label={field.value}
                    onValueChange={(value) => {
                      field.onChange(value)
                      //handleChange(value);
                    }}
                    value={String(field.value)}
                  >
                    <SelectTrigger >
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {imovelTipo?.data.map((value) => (
                        <SelectItem key={value.id} value={value.id.toString()}>
                          {value.name}
                        </SelectItem>

                      ))}
                      {/*IMOVEL_TIPO.map((value) => (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      ))*/}
                    </SelectContent>
                  </Select>
                )}
              />
              {createImovelMethods.formState.errors.tipoId?.message &&
                (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                  {createImovelMethods.formState.errors.tipoId.message}
                </p>)}
            </div>
          </Label>
        </div>

        <div className={(isMobile ? "grid gap-4 grid-cols-1" : "grid gap-4 grid-cols-2")}>
          <Label>
            Metragem (m²)
            <Input
              className="mt-2"
              type="number"
              step="any"
              disabled={disabled}
              placeholder="Metragem do imóvel"
              {...createImovelMethods.register('metragem')}
            />
            {createImovelMethods.formState.errors.metragem?.message &&
              (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                {createImovelMethods.formState.errors.metragem.message}
              </p>)}
          </Label>
          <Label>
            Quartos
            <Input
              className="mt-2"
              type="number"
              disabled={disabled}
              placeholder="Número de quartos"
              {...createImovelMethods.register('quartos')}
            />
            {createImovelMethods.formState.errors.quartos?.message &&
              (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                {createImovelMethods.formState.errors.quartos.message}
              </p>)}
          </Label>
        </div>

        <div className={(isMobile ? "grid gap-4 grid-cols-1" : "grid gap-4 grid-cols-2")}>
          <Label>
            Banheiros
            <Input
              className="mt-2"
              type="number"
              step="any"
              disabled={disabled}
              placeholder="Número de banheiros"
              {...createImovelMethods.register('banheiros')}
            />
            {createImovelMethods.formState.errors.banheiros?.message &&
              (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                {createImovelMethods.formState.errors.banheiros.message}
              </p>)}
          </Label>
          <Label>
            Vagas Garagem
            <Input
              className="mt-2"
              type="number"
              disabled={disabled}
              placeholder="Número de vagas de estacionamento"
              {...createImovelMethods.register('vagasEstacionamento')}
            />
            {createImovelMethods.formState.errors.vagasEstacionamento?.message &&
              (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                {createImovelMethods.formState.errors.vagasEstacionamento.message}
              </p>)}
          </Label>
        </div>

        <div className={(isMobile ? "grid gap-4 grid-cols-1" : "grid gap-4 grid-cols-2")}>
          <Label>
            Andar
            <Input
              className="mt-2"
              type="number"
              step="any"
              disabled={disabled}
              placeholder="Número do andar"
              {...createImovelMethods.register('andar')}
            />
            {createImovelMethods.formState.errors.andar?.message &&
              (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                {createImovelMethods.formState.errors.andar.message}
              </p>)}
          </Label>
        </div>

        {/* VALORES */}
        <div className="flex justify-center font-[Poppins-ExtraLight]">
          <Label className='font-bold text-lg'>VALORES DO IMÓVEL</Label>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Label className='col-span-2'>
            Taxa Administrativa
            <Input
              className="mt-2"
              type="number"
              step="any"
              disabled={disabled}
              placeholder="Taxa Administrativa"
              {...createImovelMethods.register('porcentagemLucroImobiliaria')}
            />
            {createImovelMethods.formState.errors.porcentagemLucroImobiliaria?.message &&
              (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                {createImovelMethods.formState.errors.porcentagemLucroImobiliaria.message}
              </p>)}
          </Label>

        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* TODO: fix float values */}
          <Label className='text-base font-[Poppins-Regular]'>
            Aluguel
            <Label className='text-[0.7rem]'> (opcional)</Label>
            <Input
              className="mt-2"
              type="number"
              disabled={disabled}
              placeholder="Valor do aluguel"
              {...createImovelMethods.register('valorAluguel')}
            />
            {createImovelMethods.formState.errors.valorAluguel?.message &&
              (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                {createImovelMethods.formState.errors.valorAluguel.message}
              </p>)}
          </Label>
        </div>
      </div>
    </div>
  )
}

export const ImovelFormSubmitButton = ({
  createImovelMethods,
  disabled
}: {
  createImovelMethods: UseFormReturn<ImovelSchema>
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
          !createImovelMethods.formState.isDirty ||
          !createImovelMethods.formState.isValid
        }
      >
        Criar Imóvel
      </Button>
    </div>
  )
}

export const ImovelForm = {
  Root: ImovelFormRoot,
  FormContent: ImovelFormContent,
  SubmitButton: ImovelFormSubmitButton
}
