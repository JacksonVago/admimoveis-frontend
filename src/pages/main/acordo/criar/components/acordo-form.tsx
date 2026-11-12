import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Controller, FormProvider, useFieldArray, useForm, UseFormReturn } from 'react-hook-form'
import { Textarea } from '@/components/ui/textarea'
import { AcordoSchema, lancamentoAcordoSchema, LancamentoAcordoSchema } from '@/schemas/acordo.schema'
import { DocumentUpload } from '@/pages/main/imoveis/criarImovel/components/document-upload'
import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import ListarClientes from '@/pages/main/clientes'
import ListarImoveisLocacao from '@/pages/main/imoveis/listaimoveislocacao'
import { Info, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useGlobalParams } from '@/globals/GlobalParams'
import { useMediaQuery } from 'react-responsive'
import { Pessoa } from '@/interfaces/pessoa'
import { Imovel } from '@/interfaces/imovel'
import { getEnderecoFormatado } from '@/helpers/get-endereco-formatado'
import { Locacao } from '@/interfaces/locacao'
import ListarLocacoes from '@/pages/main/locacoes'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { zodResolver } from '@hookform/resolvers/zod'
import moment from 'moment'
import { useAuth } from '@/hooks/auth/use-auth'
import { toast } from '@/hooks/use-toast'
import axios from 'axios'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader } from '@/components/ui/alert-dialog'
import { AlertDialogContent, AlertDialogTitle, AlertDialogTrigger } from '@radix-ui/react-alert-dialog'
import { BoletoStatus } from '@/enums/locacao/enums-locacao'
import api from '@/services/axios/api'
import { Empresa } from '@/interfaces/empresa'
import { useQuery } from '@tanstack/react-query'
import { BoletoBancario } from '@/interfaces/boletobancario'
import ListarBoletosBancarios from '@/pages/main/boletosbancarios'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { STATUS_BOLETO_OPTIONS } from '@/constants/status-boletos'

export const AcordoFormRoot = ({
  children,
  createAcordoMethods,
  onSubmitAcordoData
}: {
  children: React.ReactNode
  createAcordoMethods: UseFormReturn<AcordoSchema>
  onSubmitAcordoData: (data: AcordoSchema) => void
}) => {
  return (
    <form onSubmit={createAcordoMethods.handleSubmit(onSubmitAcordoData)}>{children}</form>
  )
}

export const AcordoFormContent = ({
  action,
  createAcordoMethods,
  disabled
}: {
  action: string
  createAcordoMethods: UseFormReturn<AcordoSchema>
  disabled?: boolean
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  //Globals
  const glb_params = useGlobalParams();

  //const isBigScreen = useMediaQuery({ query: '(min-width: 1824px)' })
  const isPortrait = useMediaQuery({ query: '(max-width: 1224px)' })
  //const isTablet = useMediaQuery({ query: '(min-width: 746px)' })
  const isMobile = useMediaQuery({ query: '(max-width: 400px)' })

  const [selPessoa, setSelPessoa] = useState<boolean>(false);
  const [selImovel, setSelImovel] = useState<boolean>(false);
  const [selBoleto, setSelBoleto] = useState<boolean>(false);
  const [selLocacao, setSelLocacao] = useState<boolean>(false);
  const [isLanctoDialogOpen, setIsLanctoDialogOpen] = useState(false)
  const [isExcDialogOpen, setIsExcDialogOpen] = useState(false)
  const [titulo, setTitulo] = useState("Criar novo lançamento")

  //Carrega dados da empresa
  const { data: empresa } = useQuery({
    queryKey: ['empresa', (glb_params.id_empresa ? glb_params.id_empresa : 0)],
    queryFn: async () => {
      try {
        const data = await api.get<Empresa>(`/empresas/${glb_params.id_empresa ? glb_params.id_empresa : 0}`)
        console.log(data.data.id ? data.data.id.toString() : 'test');
        glb_params.updId_empresa(data.data.id ? data.data.id.toString() : '0')
        return data.data;
      }
      catch (error) {
        if (axios.isAxiosError(error)) {
          // Check if there's a response and data within the error
          if (error.response && error.response.data) {
            console.error('Error message from server:', error.response.data);
            toast({
              title: 'Erro ao atualizar as configurações',
              description: error.response.data.message,
            })

            // You can also set this error message to a state to display it in your UI
          } else {
            console.error('Axios error without response data:', error.message);
          }
        } else {
          console.error('Non-Axios error:', error);
          toast({
            title: 'Erro',
            description: error instanceof Error ? error.message : 'Ocorreu um erro ao atualizar as configurações. Tente novamente.',
            variant: 'destructive'
          })
        }
      }
    }
  });


  //default values
  const defaultValuesLancto = useMemo(
    () => ({
      id: 0,
      descricao: '',
      valorOriginal: 0,
      juros: 0,
      multa: 0,
      desconto: 0,
      valorLancamento: 0,
      dataLancamento: moment.utc(new Date()).format("YYYY-MM-DD"),
      dataVencimento: undefined,
      boletoBancarioId: 0,
      lancamentos: []

    }),
    []
  )

  const lancamentoMethods = useForm<LancamentoAcordoSchema>({
    resolver: zodResolver(lancamentoAcordoSchema),
    defaultValues: defaultValuesLancto,
    mode: 'all'
  });

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

  //Lista de lançamentos
  const lancamentoAcordo = useFieldArray({
    control: createAcordoMethods.control,
    name: 'lancamentos'
  });

  //boleto do lancamento
  const boletoLancamento = useFieldArray({
    control: lancamentoMethods.control,
    name: 'boleto'
  });

  useEffect(() => {
    lancamentoMethods.reset(defaultValuesLancto);
  }, [])

  /*useEffect(() => {
    handlerSomaLancamentos();
  }, [lancamentoAcordo])*/

  const handlerSelImovel = () => {

    glb_params.updOrigin_url("acordos");
    if (acordoImovel.fields.length > 0) {
      acordoImovel.remove(0);
    }
    setSelImovel(true);
    setSelPessoa(false);
    setSelLocacao(false);
  }

  const handlerSelBoleto = () => {

    glb_params.updOrigin_url("acordos");
    if (boletoLancamento.fields.length > 0) {
      boletoLancamento.remove(0);
    }
    setSelBoleto(true);
  }

  const handlerSelLocacao = () => {

    glb_params.updOrigin_url("acordos");
    if (acordoLocacao.fields.length > 0) {
      acordoLocacao.remove(0);
    }
    setSelImovel(false);
    setSelPessoa(false);
    setSelLocacao(true);
  }

  const handlerSelPessoa = () => {

    glb_params.updOrigin_url("acordos");
    if (acordoPessoa.fields.length > 0) {
      acordoPessoa.remove(0);
    }
    setSelImovel(false);
    setSelPessoa(true);
    setSelLocacao(false);
  }

  //Retorno ao o boleto
  const handleSelectedBoleto = (boleto: BoletoBancario | undefined) => {


    if (boleto) {
      if (boletoLancamento.fields.length === 0) {
        boletoLancamento.append({
          nome: boleto.linhaDigitavel,
          id: boleto.id
        });
      }

      lancamentoMethods.setValue('boletoBancarioId', boleto.id,
        {
          shouldDirty: true,
          shouldValidate: true
        }
      );
      lancamentoMethods.setValue('valorOriginal', boleto.valor,
        {
          shouldDirty: true,
          shouldValidate: true
        }
      );
      lancamentoMethods.setValue('dataVencimento', boleto.dataVencimento,
        {
          shouldDirty: true,
          shouldValidate: true
        }
      );
      let juros = handlerCalculaJurosMulta(boleto.valor, new Date(boleto.dataVencimento), "J");
      let multa = handlerCalculaJurosMulta(boleto.valor, new Date(boleto.dataVencimento), "M");
      //lancamentoMethods.setValue('juros', handlerCalculaJurosMulta(boleto.valor, new Date(moment.utc(boleto.dataVencimento).format("YYYY-MM-DD")), "J"),
      lancamentoMethods.setValue('juros', juros,
        {
          shouldDirty: true,
          shouldValidate: true
        }
      );
      lancamentoMethods.setValue('multa', multa,
        {
          shouldDirty: true,
          shouldValidate: true
        }
      );
      lancamentoMethods.setValue('valorLancamento', boleto.valor + juros + multa,
        {
          shouldDirty: true,
          shouldValidate: true
        }
      );

    }
    else {
      lancamentoMethods.setValue('boletoBancarioId', 0,
        {
          shouldDirty: false,
          shouldValidate: false
        }
      );
      lancamentoMethods.setValue('valorOriginal', 0,
        {
          shouldDirty: true,
          shouldValidate: true
        }
      );

      lancamentoMethods.setValue('juros', 0,
        {
          shouldDirty: true,
          shouldValidate: true
        }
      );
      lancamentoMethods.setValue('multa', 0,
        {
          shouldDirty: true,
          shouldValidate: true
        }
      );
      lancamentoMethods.setValue('valorLancamento', 0,
        {
          shouldDirty: true,
          shouldValidate: true
        }
      );
    }


    setSelBoleto(false);
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
      createAcordoMethods.setValue('pessoaId', pessoa.id,
        {
          shouldDirty: true,
          shouldValidate: true
        }
      );

    }
    else {
      createAcordoMethods.setValue('pessoaId', 0,
        {
          shouldDirty: false,
          shouldValidate: false
        }
      );
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

  const onSubmitLancamentoData = async (data: LancamentoAcordoSchema) => {
    try {
      const form = new FormData()
      let lan_aux: LancamentoAcordoSchema = {
        id: 0,
        descricao: '',
        valorOriginal: 0,
        juros: 0,
        multa: 0,
        desconto: 0,
        valorLancamento: 0,
        dataLancamento: moment.utc(new Date()).format("YYYY-MM-DD"),
        dataVencimento: moment.utc(new Date()).format("YYYY-MM-DD"),
        boletoBancarioId: 0
      };

      if (data?.descricao) {
        lan_aux.descricao = data.descricao;
      }


      if (data?.valorOriginal) {
        lan_aux.valorOriginal = data.valorOriginal;
      }

      if (data?.valorLancamento) {
        lan_aux.valorLancamento = data.valorLancamento;
      }

      if (data?.juros) {
        lan_aux.juros = data.juros;
      }

      if (data?.multa) {
        lan_aux.multa = data.multa;
      }

      if (data?.desconto) {
        lan_aux.desconto = data.desconto;
      }


      if (data?.dataLancamento) {
        lan_aux.dataLancamento = data.dataLancamento;
      }

      if (data?.dataVencimento) {
        lan_aux.dataVencimento = data.dataVencimento;
      }


      if (data?.boletoBancarioId) {
        lan_aux.boletoBancarioId = data.boletoBancarioId;
      }

      lancamentoAcordo.append(lan_aux);

      /*toast({
        title: 'Lancamento atualizado com sucesso',
        description: `Lancamento atualizado com sucesso`

      });*/
      console.log('Lançamento adicionado');
      setIsLanctoDialogOpen(false);

    } catch (error) {

      if (axios.isAxiosError(error)) {
        // Check if there's a response and data within the error
        if (error.response && error.response.data) {
          console.error('Error message from server:', error.response.data);
          toast({
            title: 'Erro ao atualizar os lançamentos',
            description: error.response.data.message,
          })

          // You can also set this error message to a state to display it in your UI
        } else {
          console.error('Axios error without response data:', error.message);
        }
      } else {
        console.error('Non-Axios error:', error);
        toast({
          title: 'Erro',
          description: error instanceof Error ? error.message : 'Ocorreu um erro ao tentar atualizar o lançamento. Tente novamente.',
          variant: 'destructive'
        })
      }
    }
  }

  const handleEditLancamento = (lancamento: LancamentoAcordoSchema) => {
    if (createAcordoMethods.getValues("status") === BoletoStatus.PENDENTE) {
      setTitulo("Visualizar lançamento");
    }
    else {
      setTitulo("Alterar lançamento");
    }

    setIsLanctoDialogOpen(true);
    lancamentoMethods.setValue("id", lancamento.id);
    lancamentoMethods.setValue("dataLancamento", moment.utc(lancamento.dataLancamento).format("YYYY-MM-DD"));
    lancamentoMethods.setValue("dataVencimento", moment.utc(lancamento.dataVencimento).format("YYYY-MM-DD"));
    lancamentoMethods.setValue("juros", lancamento.juros);
    lancamentoMethods.setValue("multa", lancamento.multa);
    lancamentoMethods.setValue("desconto", lancamento.desconto);
    lancamentoMethods.setValue("valorOriginal", lancamento.valorOriginal);
    lancamentoMethods.setValue("valorLancamento", lancamento.valorLancamento);
    lancamentoMethods.setValue("descricao", lancamento.descricao);
    lancamentoMethods.setValue("boletoBancarioId", lancamento.boletoBancarioId);
    console.log(lancamentoMethods.getValues());
  }

  const handleDeleteLancamento = (idLancamento: number) => {
    lancamentoAcordo.remove(idLancamento);
    setIsExcDialogOpen(false);
  }

  const handlerCalculaJurosMulta = (valor: number, vencimento: Date, tipo: string) => {
    let result: number = 0;
    if (tipo === 'M') {
      result = valor * (empresa && empresa.porcentagemMultaAtraso ? empresa.porcentagemMultaAtraso / 100 : 0);
    }
    else {
      let hoje = new Date();
      // 2. Get the difference in milliseconds
      const diffInMs = Math.abs(hoje.getTime() - vencimento.getTime());
      // 3. Define milliseconds in a single day (1000ms * 60s * 60m * 24h)
      const msInDay = 1000 * 60 * 60 * 24;
      // 4. Calculate total days and round to handle daylight savings quirks
      const totalDays = Math.round(diffInMs / msInDay);

      let diasAtraso = totalDays;
      console.log(hoje.getDate());
      console.log(vencimento.getDate());
      result = ((valor * (empresa && empresa.porcentagemJurosAtraso ? empresa.porcentagemJurosAtraso / 100 : 0)) / 30) * diasAtraso;

    }
    return parseFloat(result.toFixed(2));
  }

  const handlerValorLancamento = () => {
    let valorOriginal = Number(lancamentoMethods.getValues("valorOriginal"));
    let juros = Number(lancamentoMethods.getValues("juros"));
    let multa = Number(lancamentoMethods.getValues("multa"));
    let desconto = Number(lancamentoMethods.getValues("desconto"));

    let valorLancamento = valorOriginal + parseFloat((juros ? juros : 0).toString()) + parseFloat((multa ? multa : 0).toString()) - parseFloat((desconto ? desconto : 0).toString());
    lancamentoMethods.setValue("valorLancamento", valorLancamento, {
      shouldDirty: true,
      shouldValidate: true
    });
  }

  const handlerSomaLancamentos = () => {
    console.log('lanctos ', lancamentoAcordo)
    if (lancamentoAcordo.fields.length > 0) {

      const totals = lancamentoAcordo.fields.reduce((acc, current) => {
        acc.valorOriginal += current.valorOriginal;
        acc.juros += current.juros ? current.juros : 0;
        acc.multa += current.multa ? current.multa : 0;
        acc.desconto += current.desconto ? current.desconto : 0;
        acc.valorLancamento += current.valorLancamento ? current.valorLancamento : 0;
        return acc;
      }, { valorOriginal: 0, juros: 0, multa: 0, desconto: 0, valorLancamento: 0 }); // Initial values set to 0

      console.log(totals);

      createAcordoMethods.setValue("valorOriginal", totals.valorOriginal);
      createAcordoMethods.setValue("juros", totals.juros);
      createAcordoMethods.setValue("multa", totals.multa);
      if (totals.desconto > 0) {
        createAcordoMethods.setValue("desconto", totals.desconto);
      }
      if (totals.valorLancamento > 0) {
        createAcordoMethods.setValue("valorLiquido", totals.valorLancamento);
      }
      handlerCalculaTotais();
    }
    else {
      createAcordoMethods.setValue("valorOriginal", 0);
      createAcordoMethods.setValue("juros", 0);
      createAcordoMethods.setValue("multa", 0);
      createAcordoMethods.setValue("desconto", 0);
      createAcordoMethods.setValue("valorLiquido", 0);
      console.log('sem valores');
    }
  }

  const handlerCalculaTotais = () => {
    let valor = Number(createAcordoMethods.getValues("valorOriginal"));
    let juros = Number(createAcordoMethods.getValues("juros") !== undefined ? createAcordoMethods.getValues("juros") : 0);
    let multa = Number(createAcordoMethods.getValues("multa") !== undefined ? createAcordoMethods.getValues("multa") : 0);
    let desconto = Number(createAcordoMethods.getValues("desconto") !== undefined ? createAcordoMethods.getValues("desconto") : 0);
    let total = valor + (juros ? juros : 0) + (multa ? multa : 0) - (desconto ? desconto : 0)
    console.log(total);
    createAcordoMethods.setValue("valorLiquido", total);

  }

  const handlerCalculaParcelas = () => {
    let valorLiquido = (createAcordoMethods.getValues("valorLiquido") !== undefined ? createAcordoMethods.getValues("valorLiquido") : 0);
    if (valorLiquido && valorLiquido > 0) {
      let valParcela = valorLiquido / createAcordoMethods.getValues("qtdParcelas");
      createAcordoMethods.setValue("valorParcela", Number(valParcela.toFixed(2)));
    }
  }

  console.log(createAcordoMethods.formState.errors);
  console.log(createAcordoMethods.getValues());
  console.log(acordoLocacao);
  console.log(acordoPessoa);

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
                    <div className="grid grid-cols-2 gap-4 flex items-center">
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
                  <div className="grid grid-cols-2 gap-4 flex items-center">
                    <Button type='button'
                      className="hover:bg-[#a9d9ef] hover:cursor-pointer bg-[#034869] hover:text-[#034869] text-white h-5"
                      onClick={() => {
                        handlerSelLocacao()
                      }}
                    >Selecionar Locação</Button>
                  </div>
                )}
              </div>
              {!!createAcordoMethods?.formState?.errors?.locacaoId?.message && (
                createAcordoMethods.formState?.errors?.locacaoId?.message && <p style={{ color: '#ed535d', fontSize: '0.8rem' }}>* {createAcordoMethods.formState?.errors?.locacaoId?.message}</p>
              )}

              {acordoImovel.fields.length === 0 && (
                <div className='mt-3'>
                  {(acordoImovel.fields.length > 0) ? (
                    <>
                      <Label className='text-base' >Imóvel</Label>
                      <div className="grid grid-cols-2 gap-4 flex items-center">
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
                    <div className="grid grid-cols-2 gap-4 flex items-center">
                      <Button type='button'
                        className="hover:bg-[#a9d9ef] hover:cursor-pointer bg-[#034869] hover:text-[#034869] text-white h-5"
                        onClick={() => {
                          handlerSelImovel()
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
                    <div className="grid grid-cols-2 gap-4 flex items-center">
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
                  <div className="grid grid-cols-2 gap-4 flex items-center">
                    <Button type='button'
                      className="hover:bg-[#a9d9ef] hover:cursor-pointer bg-[#034869] hover:text-[#034869] text-white h-5"
                      onClick={() => {
                        handlerSelPessoa();
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

        {(action === "create") && (
          <>
            <div className='mt-3'>
              <div className='grid grid-cols-2'>
                <Label className="text-base flex items-center">Lançamentos</Label>


                {/*<div className='flex justify-end mb-3'>
              <Button size={"sm"}
                className="hover:bg-[#a9d9ef] hover:cursor-pointer bg-[#034869] hover:text-[#034869] text-white"
              >
                <Plus className="mr-2 h-4 w-4" /> Lançamentos
              </Button>
            </div>*/}

                {/*Tela de lançamentos */}
                <Dialog
                  open={isLanctoDialogOpen}
                  onOpenChange={(value) => {
                    setIsLanctoDialogOpen(value)
                    if (!value) {
                      setTitulo("Criar novo lançamento");
                      //lancamentoMethods.reset(defaultValues);
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    {(isAdmin ||
                      user?.permissions.includes("ALL") ||
                      user?.permissions.includes("CREATE_LOCACAO_LANCAMENTO")
                    ) && (
                        <div className='grid grid-cols-4'>
                          <Button size={'sm'}
                            type='button'
                            className="hover:bg-[#a9d9ef] hover:cursor-pointer bg-[#034869] hover:text-[#034869] text-white mb-3 col-start-4 col-end-4">
                            <Plus className="mr-2 h-4 w-4" /> Lançamento
                          </Button>
                        </div>
                      )}
                  </DialogTrigger>
                  <DialogContent onInteractOutside={(e) => e.preventDefault()}>
                    <DialogHeader>
                      <DialogTitle>{titulo}</DialogTitle>
                      {!selBoleto && (
                        <DialogDescription>{titulo.includes('novo') ? 'Preencha os dados do novo lançamento abaixo.' : ''}</DialogDescription>
                      )}
                    </DialogHeader>
                    <form onSubmit={lancamentoMethods.handleSubmit(onSubmitLancamentoData)}>

                      {!selBoleto && (
                        <div className='mt-3'>
                          {(boletoLancamento.fields.length > 0) ? (
                            <>
                              <Label className='text-base' >Boleto</Label>
                              <div className="flex items-center">
                                {boletoLancamento.fields.map((field, index) => (
                                  <div className='flex justify-between items-center gap-2 mt-2 border-solid border-2 border-gray-250 rounded p-1'>
                                    <Label >{field.nome}</Label>
                                    <button disabled={disabled}
                                      className='border bg-zinc-200 hover:bg-zinc-400'
                                      type="button"
                                      onClick={() => {
                                        lancamentoMethods.setValue('boletoBancarioId', 0, { shouldDirty: false, shouldValidate: false });
                                        boletoLancamento.remove(index);
                                      }}
                                    >

                                      <X className='px-1'></X>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </>
                          ) : (
                            <div className="flex items-center">
                              <Button type='button'
                                className="hover:bg-[#a9d9ef] hover:cursor-pointer bg-[#034869] hover:text-[#034869] text-white h-5"
                                onClick={() => {
                                  handlerSelBoleto()
                                }}
                              >Selecionar boletos</Button>
                            </div>
                          )}
                        </div>
                      )}
                      {(!selBoleto && !!createAcordoMethods?.formState?.errors?.imovelId?.message) && (
                        createAcordoMethods.formState?.errors?.imovelId?.message && <p style={{ color: '#ed535d', fontSize: '0.8rem' }}>* {createAcordoMethods.formState?.errors?.imovelId?.message}</p>
                      )}
                      {/*Seleção de boletos */}
                      {selBoleto && (
                        <div className='h-full border' style={{ color: "#034869" }}>
                          <div className="flex  justify-end">
                            <Button onClick={() => { handleSelectedBoleto(undefined) }}
                              className='w-4 h-8 -top-5 -right-5 relative rounded-full bg-transparent text-black bg-zinc-200 hover:bg-zinc-400'>X</Button>
                          </div>
                          <div>
                            <h1 className='flex items-center justify-center font-bold'>Selecionar Boleto</h1>
                          </div>
                          <div className='mt-2 h-120'>
                            <ListarBoletosBancarios limitView={1} exclude='' txtVinc='Selecionar' onSelectBoleto={handleSelectedBoleto} />
                          </div>
                        </div>
                        /*
                        <Card id='teste' className='h-full' style={{ color: "#034869" }}>
                          <div className="flex  justify-end">
                            <Button onClick={() => { handleSelectedBoleto(undefined) }}
                              className='w-4 h-8 -top-5 -right-5 relative rounded-full bg-transparent text-black bg-zinc-200 hover:bg-zinc-400'>X</Button>
                          </div>
                          <CardHeader>
                            <h2 className='flex items-center justify-center font-bold'>Selecionar Boleto</h2>
                          </CardHeader>
                          <CardContent className='mt-2 h-120'>
                            <ListarBoletosBancarios limitView={1} exclude='' txtVinc='Selecionar' onSelectBoleto={handleSelectedBoleto} />
                          </CardContent>
                        </Card>*/
                      )}

                      {!selBoleto && (
                        <div>
                          <div className='mt-2'>
                            <Label htmlFor="description">Descrição
                              <Input
                                type='text'
                                disabled={disabled}
                                placeholder="Descrição"
                                {...lancamentoMethods.register('descricao')}
                              />
                              {lancamentoMethods.formState?.errors?.descricao?.message && <p style={{ color: 'red', fontSize: '0.8rem' }}>*{lancamentoMethods.formState?.errors?.descricao?.message}</p>}
                            </Label>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mt-3">
                            <Label className="text-base">
                              Valor do Boleto
                              <Input
                                type="number"
                                step={'any'}
                                className="mt-1"
                                disabled={disabled}
                                placeholder="Valor do Boleto"
                                {...lancamentoMethods.register('valorOriginal')}
                                onBlur={handlerValorLancamento}
                              />
                              {lancamentoMethods.formState?.errors?.valorOriginal?.message && <p style={{ color: '#f26871', fontSize: '0.8rem' }}>* {lancamentoMethods.formState?.errors?.valorOriginal?.message}</p>}
                            </Label>
                            <Label className="text-base">
                              Valor dos juros
                              <Input
                                type="number"
                                step={'any'}
                                className="mt-1"
                                disabled={disabled}
                                placeholder="Juros"
                                {...lancamentoMethods.register('juros')}
                                onBlur={handlerValorLancamento}
                              />
                              {lancamentoMethods.formState?.errors?.juros?.message && <p style={{ color: '#f26871', fontSize: '0.8rem' }}>* {lancamentoMethods.formState?.errors?.juros?.message}</p>}
                            </Label>
                            <Label className="text-base">
                              Valor da multa
                              <Input
                                type="number"
                                step={'any'}
                                className="mt-1"
                                disabled={disabled}
                                placeholder="Multa"
                                {...lancamentoMethods.register('multa')}
                                onBlur={handlerValorLancamento}
                              />
                              {lancamentoMethods.formState?.errors?.multa?.message && <p style={{ color: '#f26871', fontSize: '0.8rem' }}>* {lancamentoMethods.formState?.errors?.multa?.message}</p>}
                            </Label>
                            <Label className="text-base">
                              Valor do Desconto
                              <Input
                                type="number"
                                step={'any'}
                                className="mt-1"
                                disabled={disabled}
                                placeholder="Desconto"
                                {...lancamentoMethods.register('desconto')}
                                onBlur={handlerValorLancamento}
                              />
                              {lancamentoMethods.formState?.errors?.desconto?.message && <p style={{ color: '#f26871', fontSize: '0.8rem' }}>* {lancamentoMethods.formState?.errors?.desconto?.message}</p>}
                            </Label>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mt-2">
                            <Label className="text-base">
                              Valor do Lançamento
                              <Input
                                type="number"
                                step={'any'}
                                className="mt-1"
                                disabled={disabled}
                                placeholder="Valor do Lançamento"
                                {...lancamentoMethods.register('valorLancamento')}
                              />
                              {lancamentoMethods.formState?.errors?.valorLancamento?.message && <p style={{ color: '#f26871', fontSize: '0.8rem' }}>* {lancamentoMethods.formState?.errors?.valorLancamento?.message}</p>}
                            </Label>
                            <Label className="text-base">
                              Data do Lançamento
                              <Input
                                type='date'
                                className="mt-2"
                                disabled={disabled}
                                placeholder="Data do lançamento"
                                {...lancamentoMethods.register('dataLancamento')}
                              />
                              {lancamentoMethods.formState?.errors?.dataLancamento?.message && <p style={{ color: 'red', fontSize: '0.8rem' }}>*{lancamentoMethods.formState?.errors?.dataLancamento?.message}</p>}
                            </Label>
                          </div>

                          <DialogFooter className='mt-2'>
                            {(disabled || titulo.includes('novo')) && (
                              <Button size={"sm"} type='submit'
                                className="hover:bg-[#a9d9ef] hover:cursor-pointer bg-[#034869] hover:text-[#034869] text-white">
                                {titulo.includes('novo') ? 'Criar lançamento' : 'Confirmar Alteração'}</Button>
                            )}
                          </DialogFooter>
                        </div>
                      )}
                    </form>
                  </DialogContent>
                </Dialog>

              </div>
              <hr />
            </div>

            {(lancamentoAcordo.fields.length > 0) ? (
              <div className=''>

                <Label className='ml-2' style={{ 'fontSize': '1rem' }}> Lançamentos </Label>
                <div className='rounded-md border'>
                  <div className='grid grid-cols-9 m-2 font-[Poppins-bold]' >
                    <Label className={!isMobile ? 'border-b pb-5' : 'border-b pb-5 col-span-2'} style={{ 'fontSize': '0.7rem' }}>Descrição</Label>
                    {!isMobile ? (<Label className='border-b pb-5' style={{ 'fontSize': '0.7rem' }}>Emissão</Label>) : (<></>)}
                    <Label className='border-b  pb-5' style={{ 'fontSize': '0.7rem' }}>Vencimento</Label>
                    <Label className='flex justify-end border-b pb-5' style={{ 'fontSize': '0.7rem' }}>Valor</Label>
                    <Label className='flex justify-end border-b pb-5' style={{ 'fontSize': '0.7rem' }}>Juros</Label>
                    <Label className='flex justify-end border-b pb-5' style={{ 'fontSize': '0.7rem' }}>Multa</Label>
                    <Label className='flex justify-end border-b pb-5' style={{ 'fontSize': '0.7rem' }}>Desconto</Label>
                    <Label className='flex justify-end border-b pb-5' style={{ 'fontSize': '0.7rem' }}>Valor a Pagar</Label>
                    <Label className='border-b pb-5' style={{ 'fontSize': '0.7rem' }}></Label>
                  </div>

                  <div className='grid grid-cols-9 m-2' >
                    {lancamentoAcordo.fields.map((lancamento) => (
                      <>
                        <Label className={!isMobile ? 'flex items-center' : 'flex items-center col-span-2'} style={{ 'fontSize': '0.7rem' }}>{lancamento.descricao}</Label>
                        {!isMobile ? (<Label className='flex items-center' style={{ 'fontSize': '0.7rem' }}>{moment.utc(lancamento.dataLancamento).format("DD/MM/YYYY")}</Label>) : (<></>)}
                        {!isMobile ? (<Label className='flex items-center' style={{ 'fontSize': '0.7rem' }}>{moment.utc(lancamento.dataVencimento).format("DD/MM/YYYY")}</Label>) : (<></>)}
                        <Label className='flex items-center justify-end' style={{ 'fontSize': '0.7rem' }}>{lancamento.valorOriginal.toLocaleString('pt-BR')}</Label>
                        <Label className='flex items-center justify-end' style={{ 'fontSize': '0.7rem' }}>{lancamento.juros ? lancamento.juros.toLocaleString('pt-BR') : 0}</Label>
                        <Label className='flex items-center justify-end' style={{ 'fontSize': '0.7rem' }}>{lancamento.multa ? lancamento.multa.toLocaleString('pt-BR') : 0}</Label>
                        <Label className='flex items-center justify-end' style={{ 'fontSize': '0.7rem' }}>{lancamento.desconto ? lancamento.desconto.toLocaleString('pt-BR') : 0}</Label>
                        <Label className='flex justify-end items-center' style={{ 'fontSize': '0.7rem' }}>{
                          (lancamento.valorOriginal +
                            (lancamento.juros ? lancamento.juros : 0) +
                            (lancamento.multa ? lancamento.multa : 0) -
                            (lancamento.desconto ? lancamento.desconto : 0)
                          ).toLocaleString('pt-BR')
                        }</Label>
                        <div className='flex justify-center'>
                          {(isAdmin ||
                            user?.permissions.includes("ALL") ||
                            user?.permissions.includes("UPDATE_LOCACAO_LANCAMENTO")
                          ) && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEditLancamento(lancamento);
                                    //setSelectedTipo(tipo)
                                    //setIsEditDialogOpen(true)
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>

                                <Dialog
                                  open={isExcDialogOpen}
                                  onOpenChange={(value) => {
                                    setIsExcDialogOpen(value)
                                  }}>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={(e) => {
                                      e.stopPropagation()
                                      //setSelectedTipo(tipo)
                                    }
                                    } title='Excluir Lançamento'>
                                      <Trash2 className="h-4 w-4" />

                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Você tem certeza?</DialogTitle>
                                      <DialogDescription>
                                        Isso excluir o lançamento da locação
                                      </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                      <Button onClick={() => { setIsExcDialogOpen(false) }}>Cancelar</Button>
                                      <Button onClick={() => { handleDeleteLancamento(lancamento.id) }}>
                                        Sim, excluir o lançamento.
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              </>
                            )}
                          {(createAcordoMethods.getValues("status") === BoletoStatus.CONFIRMADO) && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditLancamento(lancamento);
                                  //setSelectedTipo(tipo)
                                  //setIsEditDialogOpen(true)
                                }}
                              >
                                <Info className="h-4 w-4" />
                              </Button>

                            </>
                          )}
                        </div>
                      </>
                    ))}
                  </div>
                </div>
              </div>

            ) : (
              <p className="text-center text-muted-foreground">
                Nenhum lançamento para essa locação nesse período.
              </p>
            )}
          </>
        )}

        <div className="grid grid-cols-5 gap-4">
          <Label className="text-base">
            Valor Original
            <Input
              className="mt-1"
              type="text"
              disabled={true}
              step={'any'}
              placeholder="Valor Original"
              {...createAcordoMethods.register('valorOriginal')}
              helperText={createAcordoMethods.formState?.errors?.valorOriginal?.message}
            />
          </Label>

          <Label className="text-base">
            Juros
            <Input
              className="mt-2"
              type="text"
              disabled={true}
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
              disabled={true}
              step={'any'}
              placeholder="Multa"
              {...createAcordoMethods.register('multa')}
              helperText={createAcordoMethods.formState?.errors?.multa?.message}
            />
          </Label>

          <Label className="text-base">
            Desconto
            <Input
              className="mt-2"
              type="tel"
              disabled={disabled}
              step={'any'}
              placeholder="Desconto"
              {...createAcordoMethods.register('desconto')}
              onBlur={handlerCalculaTotais}
              helperText={createAcordoMethods.formState?.errors?.desconto?.message}
            />
          </Label>
          <Label className="text-base">
            Valor Líquido
            <Input
              className="mt-2"
              type="string"
              disabled={true}
              step={'any'}
              placeholder="Valor Líquido"
              {...createAcordoMethods.register('valorLiquido')}
              helperText={createAcordoMethods.formState?.errors?.valorLiquido?.message}
            />
          </Label>
        </div>

        <div className="grid grid-cols-2 gap-4">

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
              onBlur={handlerCalculaParcelas}
            />
            {createAcordoMethods.formState?.errors?.qtdParcelas?.message && <p style={{ color: '#f26871', fontSize: '0.8rem' }}>* {createAcordoMethods.formState?.errors?.qtdParcelas?.message}</p>}
          </Label>

          <Label className="text-base">
            Valor da Parcela
            <Input
              className="mt-2"
              type="text"
              disabled={disabled}
              placeholder="valor parcela"
              {...createAcordoMethods.register('valorParcela')}
              helperText={createAcordoMethods.formState?.errors?.valorParcela?.message}
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

        <div className='mt-2'>
          <Label className='text-base'>Situação</Label>
          <div className='mt-2 mr-5'>
            <Controller
              name="status"
              control={createAcordoMethods.control}

              render={({ field }) => (
                <Select
                  disabled={disabled}
                  onValueChange={(value: BoletoStatus) => { field.onChange(value) }}
                  value={field.value}
                >
                  <SelectTrigger className='h-4'>
                    <SelectValue placeholder="Selecione a garantia" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_BOLETO_OPTIONS.map((status) => (
                      <SelectItem key={status.label} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {createAcordoMethods.formState?.errors?.status?.message && <p style={{ color: '#ed535d', fontSize: '0.8rem' }}>* {createAcordoMethods.formState?.errors?.status?.message}</p>}
          </div>

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


