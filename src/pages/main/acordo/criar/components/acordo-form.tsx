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
import { Controller, FormProvider, useFieldArray, UseFormReturn } from 'react-hook-form'
import { formatCpfCnpj, formatPhone } from '@/utils/format-cpfcnpj'
import { Textarea } from '@/components/ui/textarea'
import { AcordoSchema } from '@/schemas/acordo.schema'
import { DocumentUpload } from '@/pages/main/imoveis/criarImovel/components/document-upload'
import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import ListarClientes from '@/pages/main/clientes'
import ListarImoveisLocacao from '@/pages/main/imoveis/listaimoveislocacao'
import { Plus, Search, X } from 'lucide-react'
import { useGlobalParams } from '@/globals/GlobalParams'
import { useMediaQuery } from 'react-responsive'
import { Pessoa } from '@/interfaces/pessoa'
import { Imovel } from '@/interfaces/imovel'
import { getEnderecoFormatado } from '@/helpers/get-endereco-formatado'
import { Locacao } from '@/interfaces/locacao'
import ListarLocacoes from '@/pages/main/locacoes'

export const AcordoFormRoot = ({
  children,
  createAcordoMethods,
  onSubmitAcordoData
}: {
  createAcordoMethods: UseFormReturn<AcordoSchema>
  children: React.ReactNode
  onSubmitAcordoData: (data: AcordoSchema) => void
}) => {
  return (
    <form onSubmit={createAcordoMethods.handleSubmit(onSubmitAcordoData)}>{children}</form>
  )
}

export const AcordoFormContent = ({
  createAcordoMethods,
  disabled
}: {
  createAcordoMethods: UseFormReturn<AcordoSchema>
  disabled?: boolean
}) => {
  //Globals
  const glb_params = useGlobalParams();

  //const isBigScreen = useMediaQuery({ query: '(min-width: 1824px)' })
  const isPortrait = useMediaQuery({ query: '(min-width: 1224px)' })
  //const isTablet = useMediaQuery({ query: '(min-width: 746px)' })
  //const isMobile = useMediaQuery({ query: '(min-width: 400px)' })

  const [selPessoa, setSelPessoa] = useState<boolean>(false);
  const [selImovel, setSelImovel] = useState<boolean>(false);
  const [selLocacao, setSelLocacao] = useState<boolean>(false);

  //Lista de imóveis
  const acordoImovel = useFieldArray({
    control: createAcordoMethods.control,
    name: 'imovel'
  });

  //Lista de pessoas
  const acordoPessoa = useFieldArray({
    control: createAcordoMethods.control,
    name: 'pessoa'
  });

  //Lista de locacoes
  const acordoLocacao = useFieldArray({
    control: createAcordoMethods.control,
    name: 'locacao'
  });

  const handlerSelImovel = (origin: string) => {

    glb_params.updOrigin_url("acordos");
    console.log('seleciona ' + origin);
    switch (origin) {
      case 'imoveis':
        if (acordoImovel.fields.length > 0) {
          acordoImovel.remove(0);
        }
        setSelImovel(true);
        setSelPessoa(false);
        setSelLocacao(false);
        break;

    }
  }

  const handlerSelLocacao = (origin: string) => {

    glb_params.updOrigin_url("acordos");
    console.log('seleciona ' + origin);
    switch (origin) {
      case 'locacoes':
        if (acordoLocacao.fields.length > 0) {
          acordoLocacao.remove(0);
        }
        setSelImovel(false);
        setSelPessoa(false);
        setSelLocacao(true);
        break;

    }
  }

  const handlerSelPessoa = (origin: string) => {

    glb_params.updOrigin_url("acordos");
    console.log('seleciona ' + origin);
    switch (origin) {
      case 'pessoa':
        if (acordoPessoa.fields.length > 0) {
          acordoPessoa.remove(0);
        }
        setSelImovel(false);
        setSelPessoa(true);
        setSelLocacao(false);
        break;
    }
  }

  //Retorno ao selecionar o propriétario/locatário/fiador
  const handleSelectedPessoa = (pessoa: Pessoa | undefined) => {

    console.log(pessoa);

    if (pessoa) {
      if (acordoPessoa.fields.length === 0) {
        acordoPessoa.append({
          nome: pessoa.nome,
          id: pessoa.id
        });
      }
    }


    setSelPessoa(false);
  }

  //Retorno ao selecionar o imóvel
  const handleSelectedImovel = (imovel: Imovel | undefined) => {

    console.log(imovel);

    if (imovel) {
      if (acordoImovel.fields.length === 0) {
        acordoImovel.append({
          nome: getEnderecoFormatado(imovel.endereco),
          id: imovel.id
        });
      }
      createAcordoMethods.setValue('imovelId', imovel.id,
        {
          shouldDirty: true,
          shouldValidate: true
        }
      );
    }
    else {
      createAcordoMethods.setValue('imovelId', 0,
        {
          shouldDirty: false,
          shouldValidate: false
        }
      );
    }
    console.log(createAcordoMethods.getValues('imovelId'));


    setSelImovel(false);
  }

  //Retorno ao selecionar o locação
  const handleSelectedLocacao = (locacao: Locacao | undefined) => {

    console.log(locacao);

    if (locacao) {
      if (acordoLocacao.fields.length === 0) {
        acordoLocacao.append({
          nome: getEnderecoFormatado(locacao.imovel?.endereco),
          id: locacao.id,
          locatarioId: locacao.locatarios ? locacao.locatarios[0].id : 0,
          imovelId: locacao.imovel ? locacao.imovel.id : 0,
        });
      }
      if (acordoImovel.fields.length === 0) {
        acordoImovel.append({
          nome: getEnderecoFormatado(locacao.imovel?.endereco),
          id: locacao.imovel ? locacao.imovel.id : 0,
        });
      }
      if (acordoPessoa.fields.length === 0) {
        acordoPessoa.append({
          nome: locacao.locatarios && locacao.locatarios.length > 0 && locacao.locatarios[0].pessoa ? locacao.locatarios[0].pessoa.nome : "",
          id: locacao.locatarios && locacao.locatarios.length > 0 && locacao.locatarios[0].pessoa ? locacao.locatarios[0].pessoa.id : 0,
        });
      }

      createAcordoMethods.setValue('locacaoId', locacao.id,
        {
          shouldDirty: true,
          shouldValidate: true
        }
      );
      createAcordoMethods.setValue('pessoaId', locacao.locatarios ? locacao.locatarios[0].id : 0,
        {
          shouldDirty: true,
          shouldValidate: true
        }
      );
      createAcordoMethods.setValue('imovelId', locacao.imovel ? locacao.imovel.id : 0,
        {
          shouldDirty: true,
          shouldValidate: true
        }
      );
    }
    else {
      createAcordoMethods.setValue('locacaoId', 0,
        {
          shouldDirty: false,
          shouldValidate: false
        }
      );
      createAcordoMethods.setValue('pessoaId', 0,
        {
          shouldDirty: false,
          shouldValidate: false
        }
      );
      createAcordoMethods.setValue('imovelId', 0,
        {
          shouldDirty: false,
          shouldValidate: false
        }
      );
    }
    console.log(createAcordoMethods.getValues('locacaoId'));


    setSelLocacao(false);
  }

  return (
    <>
      <div style={{ display: ((!selPessoa) ? 'block' : 'none') }}>
        <FormProvider {...createAcordoMethods}>
          <DocumentUpload disabled={disabled} downloadDocuments={disabled} />
        </FormProvider>
      </div >

      <div className="space-y-4 font-[Poppins-Regular]" >

        <div>
          {(!selPessoa && !selImovel && !selLocacao) && (
            <div>

              <div className='mt-3'>
                {(acordoLocacao.fields.length > 0) ? (
                  <>
                    <Label className='text-base' >Locacão</Label>
                    <div className={(isPortrait ? "grid grid-cols-2 gap-4 flex items-center" : "grid grid-cols-1 gap-4 flex items-center")}>
                      {acordoLocacao.fields.map((field, index) => (
                        <div className='flex justify-between items-center gap-2 mt-2 border-solid border-2 border-gray-250 rounded p-1'>
                          <Label >{field.nome}</Label>
                          <button disabled={disabled}
                            className='border bg-zinc-200 hover:bg-zinc-400'
                            type="button"
                            onClick={() => {
                              createAcordoMethods.setValue('locacaoId', 0, { shouldDirty: false, shouldValidate: false });
                              createAcordoMethods.setValue('imovelId', 0, { shouldDirty: false, shouldValidate: false });
                              createAcordoMethods.setValue('pessoaId', 0, { shouldDirty: false, shouldValidate: false });
                              acordoLocacao.remove(index);
                              acordoImovel.remove(index);
                              acordoPessoa.remove(index);
                            }}
                          >
                            <X className='px-1'></X>
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className={(isPortrait ? "grid grid-cols-2 gap-4 flex items-center" : "grid grid-cols-1 gap-4 flex items-center")}>
                    <Button type='button'
                      className="hover:bg-[#a9d9ef] hover:cursor-pointer bg-[#034869] hover:text-[#034869] text-white h-5"
                      onClick={() => {
                        handlerSelLocacao('locacoes')
                      }}
                    >Selecionar Locação</Button>
                  </div>
                )}
              </div>
              {!!createAcordoMethods?.formState?.errors?.locacaoId?.message && (
                createAcordoMethods.formState?.errors?.locacaoId?.message && <p style={{ color: '#ed535d', fontSize: '0.8rem' }}>* {createAcordoMethods.formState?.errors?.locacaoId?.message}</p>
              )}

              {acordoLocacao.fields.length === 0 && (
                <div className='mt-3'>
                  {(acordoImovel.fields.length > 0) ? (
                    <>
                      <Label className='text-base' >Imóvel</Label>
                      <div className={(isPortrait ? "grid grid-cols-2 gap-4 flex items-center" : "grid grid-cols-1 gap-4 flex items-center")}>
                        {acordoImovel.fields.map((field, index) => (
                          <div className='flex justify-between items-center gap-2 mt-2 border-solid border-2 border-gray-250 rounded p-1'>
                            <Label >{field.nome}</Label>
                            <button disabled={disabled}
                              className='border bg-zinc-200 hover:bg-zinc-400'
                              type="button"
                              onClick={() => {
                                createAcordoMethods.setValue('imovelId', 0, { shouldDirty: false, shouldValidate: false });
                                acordoImovel.remove(index);
                              }}
                            >

                              <X className='px-1'></X>
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className={(isPortrait ? "grid grid-cols-2 gap-4 flex items-center" : "grid grid-cols-1 gap-4 flex items-center")}>
                      <Button type='button'
                        className="hover:bg-[#a9d9ef] hover:cursor-pointer bg-[#034869] hover:text-[#034869] text-white h-5"
                        onClick={() => {
                          handlerSelImovel('imoveis')
                        }}
                      >Selecionar imóvel</Button>
                    </div>
                  )}
                </div>
              )}
              {!!createAcordoMethods?.formState?.errors?.imovelId?.message && (
                createAcordoMethods.formState?.errors?.imovelId?.message && <p style={{ color: '#ed535d', fontSize: '0.8rem' }}>* {createAcordoMethods.formState?.errors?.imovelId?.message}</p>
              )}

              <div className='mt-3'>
                {(acordoPessoa.fields.length > 0) ? (
                  <>
                    <Label className='text-base' >Locatário</Label>
                    <div className={(isPortrait ? "grid grid-cols-2 gap-4 flex items-center" : "grid grid-cols-1 gap-4 flex items-center")}>
                      {acordoPessoa.fields.map((field, index) => (
                        <div className='flex justify-between items-center gap-2 mt-2 border-solid border-2 border-gray-250 rounded p-1'>
                          <Label >{field.nome}</Label>
                          <button disabled={disabled}
                            className='border bg-zinc-200 hover:bg-zinc-400'
                            type="button"
                            onClick={() => {
                              createAcordoMethods.setValue('pessoaId', 0, { shouldDirty: false, shouldValidate: false });
                              acordoPessoa.remove(index);
                            }}
                          >
                            {(acordoLocacao.fields.length === 0) && (
                              <X className='px-1'></X>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className={(isPortrait ? "grid grid-cols-2 gap-4 flex items-center" : "grid grid-cols-1 gap-4 flex items-center")}>
                    <Button type='button'
                      className="hover:bg-[#a9d9ef] hover:cursor-pointer bg-[#034869] hover:text-[#034869] text-white h-5"
                      onClick={() => {
                        handlerSelPessoa('pessoa');
                      }}
                    >Selecionar Locatário</Button>
                  </div>
                )}
              </div>
              {!!createAcordoMethods?.formState?.errors?.pessoaId?.message && (
                createAcordoMethods.formState?.errors?.pessoaId?.message && <p style={{ color: '#ed535d', fontSize: '0.8rem' }}>* {createAcordoMethods.formState?.errors?.pessoaId?.message}</p>
              )}
            </div>
          )}

          {/*Seleção de imóveis */}
          {selImovel && (
            <Card id='teste' className='h-full' style={{ color: "#034869" }}>
              <div className="flex  justify-end">
                <Button onClick={() => { handleSelectedImovel(undefined) }}
                  className='w-4 h-8 -top-5 -right-5 relative rounded-full bg-transparent text-black bg-zinc-200 hover:bg-zinc-400'>X</Button>
              </div>
              <CardHeader>
                <h1 className='flex items-center justify-center font-bold'>Selecionar Imóvel</h1>
              </CardHeader>
              <CardContent className='mt-2 h-120'>
                <ListarImoveisLocacao limitView={1} exclude='' onSelectImovel={handleSelectedImovel} />
              </CardContent>
            </Card>
          )}

          {/*Seleção de locações */}
          {selLocacao && (
            <Card id='teste' className='h-full' style={{ color: "#034869" }}>
              <div className="flex  justify-end">
                <Button onClick={() => { handleSelectedLocacao(undefined) }}
                  className='w-4 h-8 -top-5 -right-5 relative rounded-full bg-transparent text-black bg-zinc-200 hover:bg-zinc-400'>X</Button>
              </div>
              <CardHeader>
                <h1 className='flex items-center justify-center font-bold'>Selecionar Locação</h1>
              </CardHeader>
              <CardContent className='mt-2 h-120'>
                <ListarLocacoes limitView={1} exclude='' txtVinc='Selecionar' onSelectLocacao={handleSelectedLocacao} />
              </CardContent>
            </Card>
          )}

          {/*Seleção de locatários */}
          {selPessoa && (
            <Card id='teste' className='h-full' style={{ color: "#034869" }}>
              <div className="flex  justify-end">
                <Button onClick={() => { handleSelectedPessoa(undefined) }}
                  className='w-4 h-8 -top-5 -right-5 relative rounded-full bg-transparent text-black bg-zinc-200 hover:bg-zinc-400'>X</Button>
              </div>
              <CardHeader>
                <h1 className='flex items-center justify-center font-bold'>Selecionar Locatário</h1>
              </CardHeader>
              <CardContent className='mt-2 h-120'>
                <ListarClientes limitView={1} txtVinc='Selecionar' exclude='' onSelectCliente={handleSelectedPessoa} />
              </CardContent>
            </Card>
          )}
        </div>


        <div className='mt-3'>
          <div className='grid grid-cols-2'>
            <Label className="text-base">Lançamentos</Label>
            <div className='flex justify-end mb-3'>
              <Button size={"sm"} 
                className="hover:bg-[#a9d9ef] hover:cursor-pointer bg-[#034869] hover:text-[#034869] text-white"
              >
                <Plus className="mr-2 h-4 w-4" /> Criar Acordo
              </Button>
            </div>
          </div>
          <hr />
        </div>
        <div>
          <Label className="text-base">
            Descrição do acordo
            <Textarea
              className="mt-1"
              disabled={disabled}
              placeholder="Descrição do acordo"
              {...createAcordoMethods.register('observacao')}
            />
          </Label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Label className="text-base">
            Valor Original
            <Input
              className="mt-1"
              type="text"
              disabled={disabled}
              step={'any'}
              placeholder="Valor Original"
              {...createAcordoMethods.register('valorOriginal')}
              helperText={createAcordoMethods.formState?.errors?.valorOriginal?.message}
            />
          </Label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Label className="text-base">
            Juros
            <Input
              className="mt-2"
              type="text"
              disabled={disabled}
              step={'any'}
              placeholder="Juros"
              {...createAcordoMethods.register('juros')}
              helperText={createAcordoMethods.formState?.errors?.juros?.message}
            />
          </Label>

          <Label className="text-base">
            Multa
            <Input
              className="mt-2"
              type="tel"
              disabled={disabled}
              step={'any'}
              placeholder="Multa"
              {...createAcordoMethods.register('multa')}
              helperText={createAcordoMethods.formState?.errors?.multa?.message}
            />
          </Label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Label className="text-base">
            Desconto
            <Input
              className="mt-2"
              type="tel"
              disabled={disabled}
              step={'any'}
              placeholder="Desconto"
              {...createAcordoMethods.register('desconto')}
              helperText={createAcordoMethods.formState?.errors?.desconto?.message}
            />
          </Label>
          <Label className="text-base">
            Valor Líquido
            <Input
              className="mt-2"
              type="string"
              disabled={disabled}
              step={'any'}
              placeholder="Valor Líquido"
              {...createAcordoMethods.register('valorLiquido')}
              helperText={createAcordoMethods.formState?.errors?.valorLiquido?.message}
            />
          </Label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Label className="text-base">
            Quantidade de Parcelas
            <Input
              className="mt-2"
              type="text"
              disabled={disabled}
              placeholder="qtd. parcelas"
              {...createAcordoMethods.register('qtdParcelas')}
              helperText={createAcordoMethods.formState?.errors?.qtdParcelas?.message}
            />
          </Label>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Label className="text-base">
            Data de emissão
            <Input
              className="mt-2"
              type="date"
              disabled={disabled}
              placeholder="Data de emissão"
              {...createAcordoMethods.register('dataEmissao')}
              helperText={createAcordoMethods.formState?.errors?.dataEmissao?.message}
            />
          </Label>

        </div>
        <div className="grid grid-cols-2 gap-4">
          <Label className="text-base">
            Data de vencimento
            <Input
              className="mt-2"
              type="date"
              disabled={disabled}
              placeholder="Data de vencimento"
              {...createAcordoMethods.register('dataVencimento')}
              helperText={createAcordoMethods.formState?.errors?.dataVencimento?.message}
            />
          </Label>
        </div>
      </div>
    </>
  )
}

export const AcordoFormSubmitButton = ({
  createAcordoMethods,
  disabled
}: {
  createAcordoMethods: UseFormReturn<AcordoSchema>
  disabled?: boolean
}) => {
  return (
    <div className='flex justify-end mt-4'>
      <Button
        type="submit"
        disabled={
          disabled ||
          !createAcordoMethods.formState.isDirty ||
          !createAcordoMethods.formState.isValid
        }
        className="hover:bg-[#a9d9ef] hover:cursor-pointer bg-[#034869] hover:text-[#034869] text-white"
      >
        Finalizar Acordo
      </Button>
    </div>
  )
}

export const LocatarioForm = {
  Root: AcordoFormRoot,
  Content: AcordoFormContent,
  SubmitButton: AcordoFormSubmitButton
}


