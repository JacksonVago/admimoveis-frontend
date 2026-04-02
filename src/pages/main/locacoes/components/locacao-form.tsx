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
/*import { ESTADO_CIVIL_OPTIONS } from '@/constants/estado-civil'
import { ESTADOS } from '@/constants/estados'
import { ApiCep } from '@/interfaces/cep'
import api from '@/services/axios/api'*/
import { Controller, FormProvider, useFieldArray, UseFormReturn } from 'react-hook-form'
import { DocumentUpload } from '../../imoveis/criarImovel/components/document-upload'
import { LocacaoSchema } from '@/schemas/locacao.schema'
import { Search, X } from 'lucide-react'
import { useGlobalParams } from '@/globals/GlobalParams'
import { useEffect, useState } from 'react'
import { useMediaQuery } from 'react-responsive'
import { GarantiaLocacao, LocacaoStatus } from '@/enums/locacao/enums-locacao'
import { GARANTIA_LOCACAO_OPTIONS } from '@/constants/garantia-locacao'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
//import { DialogTitle } from '@radix-ui/react-dialog'
import ListarClientes from '../../clientes'
import { Pessoa } from '@/interfaces/pessoa'
import { LOCAL_DEPOSITO_OPTIONS, STATUS_LOCACAO_OPTIONS } from '@/constants/status-locacao'
import { Imovel } from '@/interfaces/imovel'
import { getEnderecoFormatado } from '@/helpers/get-endereco-formatado'
import ListarImoveisLocacao from '../../imoveis/listaimoveislocacao'
import { LocalDeposito } from '@/interfaces/locacao'
//import { useQuery } from '@tanstack/react-query'
//import { getImovel } from '../../imoveis/detalhes'

export const LocacaoFormRoot = ({
  children,
  createLocacaoMethods,
  onSubmitLocacaoData
}: {
  createLocacaoMethods: UseFormReturn<LocacaoSchema>
  children: React.ReactNode
  onSubmitLocacaoData: (data: LocacaoSchema) => void
}) => {
  return (
    <form onSubmit={createLocacaoMethods.handleSubmit(onSubmitLocacaoData)}>{children}</form>
  )
}

export const LocacaoFormContent = ({
  createLocacaoMethods,
  disabled
}: {
  createLocacaoMethods: UseFormReturn<LocacaoSchema>
  disabled?: boolean
}) => {
  //const isBigScreen = useMediaQuery({ query: '(min-width: 1824px)' })
  const isPortrait = useMediaQuery({ query: '(min-width: 1224px)' })
  //const isTablet = useMediaQuery({ query: '(min-width: 746px)' })
  //const isMobile = useMediaQuery({ query: '(min-width: 400px)' })


  //Globals
  const glb_params = useGlobalParams();

  const [selLocatario, setSelLocatario] = useState<boolean>(false);
  const [selImovel, setSelImovel] = useState<boolean>(false);
  const [selGarantia, setSelGarantia] = useState<GarantiaLocacao>();
  const [selFiador, setSelFiador] = useState<boolean>(false);

  useEffect(() => {
    if (createLocacaoMethods.getValues('garantiaLocacaoTipo')) {
      const sel: GarantiaLocacao = GarantiaLocacao[createLocacaoMethods.getValues('garantiaLocacaoTipo') as keyof typeof GarantiaLocacao];
      setSelGarantia(sel);
    }
  }, []);

  //Lista de imóveis
  const locacaoImoveis = useFieldArray({
    control: createLocacaoMethods.control,
    name: 'imoveis'
  });

  //Lista de locatários
  const locacaoLocatarios = useFieldArray({
    control: createLocacaoMethods.control,
    name: 'locatarios'
  });

  //Lista de fiadores
  const locacaoFiadores = useFieldArray({
    control: createLocacaoMethods.control,
    name: 'fiadores'
  });

  //Pega imóvel quando informado
  //Consulta imóvel
  /*const {
    data: imovel,
  } = useQuery({
    queryKey: ['imovel', createLocacaoMethods.getValues('imovelId')],
    queryFn: async () => {
      const { data } = await api.get<Imovel>(`imoveis/findbyid/${createLocacaoMethods.getValues('imovelId')}`)      
      console.log(data);
      if (data){
        //Carrgea array de imóvel
        handleSelectedImovel(data);
      }
      return data
    }
      //getImovel(createLocacaoMethods.getValues('imovelId'))
  });*/

  const handlerSelProp = (origin: string) => {

    glb_params.updOrigin_url("locacoes");
    console.log('seleciona ' + origin);
    switch (origin) {
      case 'fiadores':
        if (locacaoFiadores.fields.length > 0) {
          locacaoFiadores.remove(0);
        }
        setSelImovel(false);
        setSelFiador(true);
        setSelLocatario(false);
        break;

      case 'locatarios':
        setSelImovel(false);
        setSelFiador(false);
        setSelLocatario(true);
        if (locacaoLocatarios.fields.length > 0) {
          locacaoLocatarios.remove(0);
        }
        break;
    }

  }

  const handlerSelImovel = (origin: string) => {

    glb_params.updOrigin_url("locacoes");
    console.log('seleciona ' + origin);
    switch (origin) {
      case 'imoveis':
        if (locacaoImoveis.fields.length > 0) {
          locacaoImoveis.remove(0);
        }
        setSelImovel(true);
        setSelFiador(false);
        setSelLocatario(false);
        break;

    }
  }

  const handlerChangeGarantia = (e: GarantiaLocacao) => {
    let bol_limpa = {
      fiador: true,
      calcao: true,
      seguro: true,
      titulo: true,
    };

    setSelGarantia(e);
    console.log(e);

    createLocacaoMethods.setValue('garantiaLocacaoTipo', e);

    switch (e) {
      case GarantiaLocacao.DEPOSITO_CALCAO:
        bol_limpa.calcao = false;
        bol_limpa.fiador = true;
        bol_limpa.seguro = true;
        bol_limpa.titulo = true;
        break;

      case GarantiaLocacao.FIADOR:
        bol_limpa.calcao = true;
        bol_limpa.fiador = false;
        bol_limpa.seguro = true;
        bol_limpa.titulo = true;
        break;

      case GarantiaLocacao.SEGURO_FIANCA:
        bol_limpa.calcao = true;
        bol_limpa.fiador = true;
        bol_limpa.seguro = false;
        bol_limpa.titulo = true;
        break;

      case GarantiaLocacao.TITULO_CAPITALIZACAO:
        bol_limpa.calcao = true;
        bol_limpa.fiador = true;
        bol_limpa.seguro = true;
        bol_limpa.titulo = false;
        break;
    }

    //limpa fiador
    if (bol_limpa.fiador) {
      if (locacaoFiadores.fields.length > 0) {
        for (let i = 0; i < locacaoFiadores.fields.length; i++) {
          locacaoFiadores.remove(i);
        }
      }
      setSelFiador(false);
    }
    else {
      setSelFiador(true);
    }

    if (bol_limpa.calcao) {
      createLocacaoMethods.setValue('depCalcao.valorDeposito', undefined);
      createLocacaoMethods.setValue('depCalcao.quantidadeMeses', undefined);
    }

    if (bol_limpa.seguro) {
      createLocacaoMethods.setValue('seguroFianca.numeroSeguro', undefined);
    }

    if (bol_limpa.titulo) {
      createLocacaoMethods.setValue('tituloCap.numeroTitulo', undefined);
    }

  }

  //Retorno ao selecionar o propriétario/locatário/fiador
  const handleSelectedProp = (locatario: Pessoa | undefined) => {

    console.log(locatario);

    if (locatario) {
      if (locacaoLocatarios.fields.length === 0) {
        locacaoLocatarios.append({
          nome: locatario.nome,
          id: locatario.id
        });

        createLocacaoMethods.setValue('status', LocacaoStatus.AGUARDANDO_DOCUMENTOS);
      }
    }


    setSelLocatario(false);
  }

  //Retorno ao selecionar o imóvel
  const handleSelectedImovel = (imovel: Imovel | undefined) => {

    console.log(imovel);

    if (imovel) {
      if (locacaoImoveis.fields.length === 0) {
        locacaoImoveis.append({
          nome: getEnderecoFormatado(imovel.endereco),
          id: imovel.id
        });
      }
      createLocacaoMethods.setValue('imovelId', imovel.id,
        {
          shouldDirty: true,
          shouldValidate: true
        }
      );
      createLocacaoMethods.setValue('valorAluguel', (imovel.valorAluguel ? imovel.valorAluguel : 0), {
        shouldDirty: true,
        shouldValidate: true
      }
      );
    }
    else {
      createLocacaoMethods.setValue('imovelId', 0,
        {
          shouldDirty: false,
          shouldValidate: false
        }
      );
      createLocacaoMethods.setValue('valorAluguel', 0, {
        shouldDirty: false,
        shouldValidate: false
      }
      )
    }
    console.log(createLocacaoMethods.getValues('imovelId'));


    setSelImovel(false);
  }

  const handleSelectFiador = (fiador: Pessoa | undefined) => {
    //let fiador: Pessoa[] = fiadores?.filter((x: any) => x.id === fiadorId)
    if (fiador) {
      setSelFiador(false);
      locacaoFiadores.append({
        nome: fiador.nome,
        id: fiador.id
      });
    }
  }

  return (
    <>
      <div style={{ display: ((!selLocatario && !selImovel && !selFiador) ? 'block' : 'none') }}>
        <FormProvider {...createLocacaoMethods}>
          <DocumentUpload disabled={disabled} downloadDocuments={disabled} />
        </FormProvider>
      </div>
      <div className="space-y-4 font-[Poppins-Regular]">
        <div style={{ display: (!selFiador ? 'block' : 'none') }}>
          <div>
            {(!selLocatario && !selImovel && !selFiador) && (
              <div>
                {(locacaoImoveis.fields.length > 0) ? (
                  <>
                    <Label className='text-base' >Imóvel</Label>
                    <div className={(isPortrait ? "grid grid-cols-2 gap-4 flex items-center" : "grid grid-cols-1 gap-4 flex items-center")}>
                      {locacaoImoveis.fields.map((field, index) => (
                        <div className='flex justify-between items-center gap-2 mt-2 border-solid border-2 border-gray-250 rounded p-1'>
                          <Label >{field.nome}</Label>
                          <button disabled={disabled}
                            className='border bg-zinc-200 hover:bg-zinc-400'
                            type="button"
                            onClick={() => {
                              createLocacaoMethods.setValue('imovelId', 0, { shouldDirty: false, shouldValidate: false });
                              locacaoImoveis.remove(index);
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
                      onClick={() => {
                        handlerSelImovel('imoveis')
                      }}
                    >Adicionar imóvel</Button>
                  </div>
                )}
                {!!createLocacaoMethods?.formState?.errors?.imovelId?.message && (
                  createLocacaoMethods.formState?.errors?.imovelId?.message && <p style={{ color: '#ed535d', fontSize: '0.8rem' }}>* {createLocacaoMethods.formState?.errors?.imovelId?.message}</p>
                )}

                <div className='mt-3'>
                  <Label className='mt-2 text-base'>Locatário</Label>
                  {(locacaoLocatarios.fields.length > 0) ? (
                    <div className={(isPortrait ? "grid grid-cols-2 gap-4 flex items-center" : "grid grid-cols-1 gap-4 flex items-center")}>
                      {locacaoLocatarios.fields.map((field, index) => (
                        <div className='flex justify-between items-center gap-2 mt-2 border-solid border-2 border-gray-250 rounded p-1'>
                          <Label >{field.nome}</Label>
                          <button disabled={disabled}
                            className='border bg-zinc-200 hover:bg-zinc-400'
                            type="button"
                            onClick={() => {
                              locacaoLocatarios.remove(index);
                            }}
                          >
                            <X className='px-1'></X>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={(isPortrait ? "grid grid-cols-2 gap-4 flex items-center" : "grid grid-cols-1 gap-4 flex items-center")}>
                      <div className='flex justify-end items-center gap-2 mt-2 border-solid border-2 border-gray-250 rounded p-1'>
                        <button disabled={disabled}
                          className='border bg-zinc-200 hover:bg-zinc-400'
                          type="button"
                          onClick={() => {
                            handlerSelProp('locatarios');
                          }}
                        >
                          <Search className='px-1'></Search>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {!!createLocacaoMethods?.formState?.errors?.locatarios && (
                  <p style={{ color: '#ed535d', fontSize: '0.8rem' }}>* {createLocacaoMethods.formState?.errors?.locatarios.message}</p>
                )}
              </div>
            )}

            {/*Seleção de imóveis */}
            {selImovel && (
              <Card id='teste' className='h-full'>
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

            {/*Seleção de locatários */}
            {selLocatario && (
              <Card id='teste' className='h-full'>
                <div className="flex  justify-end">
                  <Button onClick={() => { handleSelectedProp(undefined) }}
                    className='w-4 h-8 -top-5 -right-5 relative rounded-full bg-transparent text-black bg-zinc-200 hover:bg-zinc-400'>X</Button>
                </div>
                <CardHeader>
                  <h1 className='flex items-center justify-center font-bold'>Selecionar Locatário</h1>
                </CardHeader>
                <CardContent className='mt-2 h-120'>
                  <ListarClientes limitView={1} txtVinc='Selecionar' exclude='' onSelectCliente={handleSelectedProp} />
                </CardContent>
              </Card>
            )}
          </div>

          {(!selLocatario && !selImovel && !selFiador) && (
            <>
              <div className={(isPortrait ? "grid grid-cols-2 gap-4 mt-3" : "grid grid-cols-1 gap-4 mt-3")}>
                <Label className="text-base">
                  Valor do Aluguel
                  <Input
                    type="number"
                    className="mt-1"
                    disabled={disabled}
                    placeholder="Valor do Aluguel"
                    {...createLocacaoMethods.register('valorAluguel')}
                  />
                  {createLocacaoMethods.formState?.errors?.valorAluguel?.message && <p style={{ color: '#f26871', fontSize: '0.8rem' }}>* {createLocacaoMethods.formState?.errors?.valorAluguel?.message}</p>}
                </Label>
              </div>
              <div className={(isPortrait ? "grid grid-cols-2 gap-4" : "grid grid-cols-1 gap-4")}>
                <Label className="text-base">
                  Data de Início
                  <Input
                    type='date'
                    className="mt-2"
                    disabled={disabled}
                    placeholder="Data de Início"
                    {...createLocacaoMethods.register('dataInicio')}
                  />
                  {createLocacaoMethods.formState?.errors?.dataInicio?.message && <p style={{ color: 'red', fontSize: '0.8rem' }}>*{createLocacaoMethods.formState?.errors?.dataInicio?.message}</p>}
                </Label>

                <Label className="text-base">
                  Data Fim
                  <Input
                    className="mt-2"
                    type="date"
                    disabled={disabled}
                    placeholder="Data Fim"
                    {...createLocacaoMethods.register('dataFim')}
                  />
                  {createLocacaoMethods.formState?.errors?.dataFim?.message && <p style={{ color: '#ed535d', fontSize: '0.8rem' }}>* {createLocacaoMethods.formState?.errors?.dataFim?.message}</p>}
                </Label>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <Label className="text-base">
                  Dia de Vencimento
                  <Input
                    className="mt-2"
                    type="number"
                    disabled={disabled}
                    placeholder="Dia de vencimento"
                    {...createLocacaoMethods.register('diaVencimento')}
                  />
                  {createLocacaoMethods.formState?.errors?.diaVencimento?.message && <p style={{ color: '#ed535d', fontSize: '0.8rem' }}>* {createLocacaoMethods.formState?.errors?.diaVencimento?.message}</p>}
                </Label>
              </div>

              <div className="mt-2 flex justify-center">
                <h1>Seguro Incêndio</h1>
              </div>
              <div className={(isPortrait ? "grid grid-cols-2 gap-4 mt-3" : "grid grid-cols-1 gap-4 mt-3")}>
                <Label className="text-base">
                  Apólice
                  <Input
                    type="text"
                    className="mt-1"
                    disabled={disabled}
                    placeholder="Nº apólice"
                    {...createLocacaoMethods.register('seguroIncendio.numeroApolice')}
                  />
                  {createLocacaoMethods.formState?.errors?.seguroIncendio?.numeroApolice?.message && <p style={{ color: '#f26871', fontSize: '0.8rem' }}>* {createLocacaoMethods.formState?.errors?.seguroIncendio?.numeroApolice?.message}</p>}
                </Label>
              </div>

              <div className={(isPortrait ? "grid grid-cols-2 gap-4" : "grid grid-cols-1 gap-4")}>
                <Label className="text-base">
                  Data de Início
                  <Input
                    type='date'
                    className="mt-2"
                    disabled={disabled}
                    placeholder="Data de Início"
                    {...createLocacaoMethods.register('seguroIncendio.vigenciaInicio')}
                  />
                  {createLocacaoMethods.formState?.errors?.seguroIncendio?.vigenciaInicio?.message && <p style={{ color: 'red', fontSize: '0.8rem' }}>*{createLocacaoMethods.formState?.errors?.seguroIncendio?.vigenciaInicio?.message}</p>}
                </Label>

                <Label className="text-base">
                  Data Fim
                  <Input
                    className="mt-2"
                    type="date"
                    disabled={disabled}
                    placeholder="Data Fim"
                    {...createLocacaoMethods.register('seguroIncendio.vigenciaFim')}
                  />
                  {createLocacaoMethods.formState?.errors?.seguroIncendio?.vigenciaFim?.message && <p style={{ color: '#ed535d', fontSize: '0.8rem' }}>* {createLocacaoMethods.formState?.errors?.seguroIncendio?.vigenciaFim?.message}</p>}
                </Label>
              </div>

              {/* <div className='mt-2'>
                <Label className='text-base' htmlFor="observacoes">Observações</Label>
                <Textarea id="observacoes" placeholder="Detalhes adicionais sobre a locação" />
              </div> */}

              <div className='mt-2'>
                <Label className='text-base'>Tipo de Garantia</Label>
                <div className='mt-2 mr-5'>
                  <Controller
                    name="garantiaLocacaoTipo"
                    control={createLocacaoMethods.control}

                    render={({ field }) => (
                      <Select
                        disabled={disabled}
                        onValueChange={(value: GarantiaLocacao) => { field.onChange(value); handlerChangeGarantia(value) }}
                        value={field.value}
                      >
                        <SelectTrigger className='h-4'>
                          <SelectValue placeholder="Selecione a garantia" />
                        </SelectTrigger>
                        <SelectContent>
                          {GARANTIA_LOCACAO_OPTIONS.map((garantia) => (
                            <SelectItem key={garantia.label} value={garantia.value}>
                              {garantia.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {createLocacaoMethods.formState?.errors?.garantiaLocacaoTipo?.message && <p style={{ color: '#ed535d', fontSize: '0.8rem' }}>* {createLocacaoMethods.formState?.errors?.garantiaLocacaoTipo?.message}</p>}
                </div>

              </div>
            </>
          )}
        </div>

        {(!selLocatario && !selImovel) && (
          <div>
            {(selGarantia === GarantiaLocacao.FIADOR && selFiador) && (
              <div>
                <Card id='teste' className='h-full'>
                  <div className="flex  justify-end">
                    <Button onClick={() => { handleSelectFiador(undefined) }}
                      className='w-4 h-8 -top-5 -right-5 relative rounded-full bg-transparent text-black bg-zinc-200 hover:bg-zinc-400'>X</Button>
                  </div>
                  <CardHeader>
                    <h1 className='flex items-center justify-center font-bold'>Selecionar Fiador</h1>
                  </CardHeader>
                  <CardContent className='mt-2 h-120'>
                    <ListarClientes limitView={1} txtVinc='Selecionar' exclude='' onSelectCliente={handleSelectFiador} />
                  </CardContent>
                </Card>
              </div>
            )}

            {(selGarantia === GarantiaLocacao.FIADOR && !selFiador) && (
              (locacaoFiadores.fields.length > 0) ? (
                <div>
                  <Label className='text-base'>Fiador</Label>
                  <div className={(isPortrait ? "grid grid-cols-2 gap-4 flex items-center" : "grid grid-cols-1 gap-4 flex items-center")}>
                    {locacaoFiadores.fields.map((field, index) => (
                      <div className='flex justify-between items-center gap-2 mt-2 border-solid border-2 border-gray-250 rounded p-1'>
                        <Label >{field.nome}</Label>
                        <button disabled={disabled}
                          className='border bg-zinc-200 hover:bg-zinc-400'
                          type="button"
                          onClick={() => locacaoFiadores.remove(index)}
                        >
                          <X className='px-1'></X>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) :
                (
                  <div>
                    <Label className='text-base'>Fiador</Label>
                    <div className={(isPortrait ? "grid grid-cols-2 gap-4 flex items-center" : "grid grid-cols-1 gap-4 flex items-center")}>
                      <div className='flex justify-end items-center gap-2 mt-2 border-solid border-2 border-gray-250 rounded p-1'>
                        <button disabled={disabled}
                          className='border bg-zinc-200 hover:bg-zinc-400'
                          type="button"
                          onClick={() => handlerSelProp('fiadores')}
                        >
                          <Search className='px-1'></Search>
                        </button>
                      </div>
                    </div>
                  </div>
                )
            )
            }

            {selGarantia === GarantiaLocacao.TITULO_CAPITALIZACAO && (
              <div className='mt-2 text-base'>
                <Label>Número do Título</Label>
                <Input id="titulocap" type="number" disabled={disabled}
                  {...createLocacaoMethods.register('tituloCap.numeroTitulo')}
                  onChange={(e) => { createLocacaoMethods.setValue('tituloCap.numeroTitulo', e.target.value) }}
                />
                {createLocacaoMethods.formState?.errors?.tituloCap?.numeroTitulo?.message && <p style={{ color: '#ed535d', fontSize: '0.8rem' }}>* {createLocacaoMethods.formState?.errors?.tituloCap?.numeroTitulo?.message}</p>}
              </div>
            )}

            {selGarantia === GarantiaLocacao.SEGURO_FIANCA && (
              <div className='mt-2 text-base'>
                <Label>Número do Seguro</Label>
                <Input type="text" disabled={disabled}
                  {...createLocacaoMethods.register('seguroFianca.numeroSeguro')}
                />
                {createLocacaoMethods.formState?.errors?.seguroFianca?.numeroSeguro?.message && <p style={{ color: '#ed535d', fontSize: '0.8rem' }}>* {createLocacaoMethods.formState?.errors?.seguroFianca?.numeroSeguro?.message}</p>}
              </div>
            )}

            {selGarantia === GarantiaLocacao.DEPOSITO_CALCAO && (
              <div>
                <div className='mt-2 text-base'>
                  <Label>Valor do depósito</Label>
                  <Input type="number" placeholder='0,00' disabled={disabled}
                    {...createLocacaoMethods.register('depCalcao.valorDeposito')}
                  />
                  {createLocacaoMethods.formState?.errors?.depCalcao?.valorDeposito?.message && <p style={{ color: '#ed535d', fontSize: '0.8rem' }}>* {createLocacaoMethods.formState?.errors?.depCalcao?.valorDeposito?.message}</p>}
                </div>
                <div className='mt-2 text-base'>
                  <Label>Quantidade de meses</Label>
                  <Input type="number" disabled={disabled}
                    {...createLocacaoMethods.register('depCalcao.quantidadeMeses')}
                  />
                  {createLocacaoMethods.formState?.errors?.depCalcao?.quantidadeMeses?.message && <p style={{ color: '#ed535d', fontSize: '0.8rem' }}>* {createLocacaoMethods.formState?.errors?.depCalcao?.quantidadeMeses?.message}</p>}
                </div>
                <div className='mt-2 text-base'>
                  <Label className='text-base'>Locao depósito</Label>
                  <div className='mt-2 mr-5'>
                    <Controller
                      name="depCalcao.localDeposito"
                      control={createLocacaoMethods.control}

                      render={({ field }) => (
                        <Select
                          disabled={disabled}
                          onValueChange={(value: LocalDeposito) => field.onChange(value)}
                          value={field.value}
                        >
                          <SelectTrigger className='h-4'>
                            <SelectValue placeholder="Selecione a garantia" />
                          </SelectTrigger>
                          <SelectContent>
                            {LOCAL_DEPOSITO_OPTIONS.map((local) => (
                              <SelectItem className='text-base' key={local.label} value={local.value}>
                                {local.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <span>{createLocacaoMethods?.formState?.errors?.garantiaLocacaoTipo?.message}</span>
                  </div>
                </div>
              </div>
            )}

            <div className='mt-2 text-base'>
              <Label className='text-base'>Situação da Locação</Label>
              <div className='mt-2 mr-5'>
                <Controller
                  name="status"
                  control={createLocacaoMethods.control}

                  render={({ field }) => (
                    <Select
                      disabled={disabled}
                      onValueChange={(value: LocacaoStatus) => field.onChange(value)}
                      value={field.value}
                    >
                      <SelectTrigger className='h-4'>
                        <SelectValue placeholder="Selecione a garantia" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_LOCACAO_OPTIONS.map((status) => (
                          <SelectItem className='text-base' key={status.label} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <span>{createLocacaoMethods?.formState?.errors?.garantiaLocacaoTipo?.message}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export const LocacaoFormSubmitButton = ({
  createLocacaoMethods,
  disabled
}: {
  createLocacaoMethods: UseFormReturn<LocacaoSchema>
  disabled?: boolean
}) => {
  return (
    <div className='flex justify-end mt-4'>
      <Button
        type="submit"
        disabled={
          disabled
          ||
          !createLocacaoMethods.formState.isDirty
          || !createLocacaoMethods.formState.isValid
        }
      >
        Criar Locação
      </Button>
    </div>
  )
}

export const LocatarioForm = {
  Root: LocacaoFormRoot,
  Content: LocacaoFormContent,
  SubmitButton: LocacaoFormSubmitButton
}

