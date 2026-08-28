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
import { Controller, FormProvider, UseFormReturn } from 'react-hook-form'
import { Textarea } from '@/components/ui/textarea'
import { DocumentUpload } from '@/pages/main/imoveis/criarImovel/components/document-upload'
import { BlocoSchema } from '@/schemas/bloco.schema'
import { getCondominiosEmp } from '@/pages/main/condominios/requests'
import { useQuery } from '@tanstack/react-query'

export const BlocoFormRoot = ({
  children,
  createBlocoMethods,
  onSubmitBlocoData
}: {
  createBlocoMethods: UseFormReturn<BlocoSchema>
  children: React.ReactNode
  onSubmitBlocoData: (data: BlocoSchema) => void
}) => {
  return <form onSubmit={createBlocoMethods.handleSubmit(onSubmitBlocoData)}>{children}</form>
}

export const BlocoFormContent = ({
  createBlocoMethods,
  disabled
}: {
  createBlocoMethods: UseFormReturn<BlocoSchema>
  disabled?: boolean
}) => {

  //const isPortrait = useMediaQuery({ query: '(min-width: 1224px)' })
  //const [selCondominio, setSelCondominio] = useState<boolean>(false);

  /*const handlerSelCondominio = () => {
    setSelCondominio(true);
  }*/

  //Carrega condomínios
    //Consulta bloco
    const {
      data: condominios,
    } = useQuery({
      queryKey: ['condominios', createBlocoMethods.getValues('empresaId')],
      queryFn: () => getCondominiosEmp(createBlocoMethods.getValues('empresaId'))
    });
  
  /*const handleSelectedCondominio = (condominio: Condominio | undefined) => {

    console.log(condominio);

    if (condominio) {
      if (blocoCondominios.fields.length === 0) {
        blocoCondominios.append({
          nome: condominio.name,
          id: condominio.id
        });
      }
      createBlocoMethods.setValue('condominioId', condominio.id,
        {
          shouldDirty: true,
          shouldValidate: true
        }
      );
    }
    else {
      createBlocoMethods.setValue('condominioId', 0,
        {
          shouldDirty: false,
          shouldValidate: false
        }
      );
    }

    setSelCondominio(false);
  }*/

  console.log('bloco dados', createBlocoMethods.formState.errors);
  console.log('bloco dados', createBlocoMethods.formState.isValid);
  console.log('bloco dados', createBlocoMethods.formState.isDirty);

  return (
    <div className="space-y-4">
      <div>
        <FormProvider {...createBlocoMethods}>
          <DocumentUpload disabled={disabled} downloadDocuments={true} />
          {/*<PropertyImageUpload disabled={disabled} />*/}
        </FormProvider>
      </div>

      <div className="space-y-4 font-[Poppins-Regular]">
        <Label className="text-base">
          Condomínio/Bloco
          <div className='mt-2'>
            <Controller
              name="condominioId"
              control={createBlocoMethods.control}
              render={({ field }) => (
                <Select
                  disabled={disabled}
                  onValueChange={(value) => field.onChange(value)}
                  value={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o condomínio" />
                  </SelectTrigger>
                  <SelectContent>
                    {condominios?.map((condominio) => (
                      <SelectItem key={condominio.id.toString()} value={condominio.id.toString()}>
                        {condominio.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {createBlocoMethods.formState?.errors?.condominioId?.message && (
              <span>{createBlocoMethods.formState?.errors?.condominioId?.message}</span>
            )}
          </div>
        </Label>

        <div className='mt-2'>
          <Label htmlFor="name">Descrição</Label>
          <Textarea placeholder="Descrição principal do bloco "
            {...createBlocoMethods.register('name')}
          />
        </div>

        <div className='mt-2'>
          <Label htmlFor="name">Observação</Label>
          <Input
            className="mt-2"
            type="text"
            disabled={disabled}
            placeholder="observação"
            {...createBlocoMethods.register('observacao')}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Label className='text-base font-[Poppins-Regular]'>
            Quantidade de Unidades
            <Input
              className="mt-2"
              type="number"
              disabled={disabled}
              placeholder="Quantidade de Unidades"
              {...createBlocoMethods.register('qtdUnidades')}
            />
            {createBlocoMethods.formState.errors.qtdUnidades?.message &&
              (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                {createBlocoMethods.formState.errors.qtdUnidades.message}
              </p>)}
          </Label>


          <Label className='text-base font-[Poppins-Regular]'>
            Total de andares
            <Input
              className="mt-2"
              type="number"
              disabled={disabled}
              placeholder="Total de andares"
              {...createBlocoMethods.register('totalAndares')}
            />
            {createBlocoMethods.formState.errors.totalAndares?.message &&
              (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                {createBlocoMethods.formState.errors.totalAndares.message}
              </p>)}
          </Label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Label className='text-base font-[Poppins-Regular]'>
            Possui elevador ?
            <div className='mt-2'>
              <Controller
                name="possuiElevador"
                control={createBlocoMethods.control}

                render={({ field }) => (
                  <Select
                    disabled={disabled}
                    onValueChange={(value) => field.onChange(value)}
                    value={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma opção" />
                    </SelectTrigger>
                    <SelectContent>
                      {['Sim', 'Não'].map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {createBlocoMethods.formState.errors.possuiElevador?.message &&
                (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                  {createBlocoMethods.formState.errors.possuiElevador.message}
                </p>)}
            </div>
          </Label>

          <Label className='text-base font-[Poppins-Regular]'>
            Ano de Construção
            <Input
              className="mt-2"
              type="number"
              disabled={disabled}
              placeholder="Ano de Construção"
              {...createBlocoMethods.register('anoConstrucao', { valueAsNumber: true })}
            />
            {createBlocoMethods.formState.errors.anoConstrucao?.message &&
              (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                {createBlocoMethods.formState.errors.anoConstrucao.message}
              </p>)}
          </Label>
        </div>
      </div>
    </div>
  )
}

export const BlocoFormSubmitButton = ({
  createBlocoMethods,
  disabled
}: {
  createBlocoMethods: UseFormReturn<BlocoSchema>
  disabled?: boolean
}) => {
  return (
    <div className="">
      <Button
        type="submit"
        size={"sm"}
        disabled={
          disabled
          ||
          !createBlocoMethods.formState.isDirty ||
          !createBlocoMethods.formState.isValid
        }
        className="mt-4 hover:bg-[#a9d9ef] hover:cursor-pointer bg-[#034869] hover:text-[#034869] text-white"
      >
        Criar Bloco
      </Button>
    </div>
  )
}

export const BlocoForm = {
  Root: BlocoFormRoot,
  FormContent: BlocoFormContent,
  SubmitButton: BlocoFormSubmitButton
}
