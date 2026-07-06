import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination'
import { ROUTE } from '@/enums/routes.enum'
import api from '@/services/axios/api'
import { queryOptions, useMutation, useQuery } from '@tanstack/react-query'
import { IdCard, List, MapPin, Pencil, Receipt, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BasePaginationData } from '../imoveis/listarImoveis'
import { useMediaQuery } from 'react-responsive'
import { useGlobalParams } from '@/globals/GlobalParams'
import { generatePaginationLinks } from '@/components/ui/generate-pages'
import { LancamentoStatus } from '@/enums/locacao/enums-locacao'
import { getEnderecoFormatado, getEnderecoFormatMaps } from '@/helpers/get-endereco-formatado'
import { Locacao, LocacaoStatus } from '@/interfaces/locacao'
import { Endereco } from '@/interfaces/endereco'
import { Label } from '@/components/ui/label'
import moment from 'moment'
import { toast } from '@/hooks/use-toast'
import { queryClient } from '@/services/react-query/query-client'
import { usdFormatter } from '@/utils/format-money'
import { useAuth } from '@/hooks/auth/use-auth'
import { Loader } from '@/components/ui/loader'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { LancamentoLocacao } from '@/interfaces/lancamentos'

// Types
interface GetLancamentosParams {
  search?: string
  page?: number
  limit?: number
  status?: string,
  exclude?: string
  dataInicial?: string
  dataFinal?: string
}

// API & Query Logic
export const getLancamentos = async (empresaId: number, { page, limit, search, status, exclude, dataInicial, dataFinal }: GetLancamentosParams) => {
  return await api.get<BasePaginationData<Locacao>>('lancamentos/' + empresaId.toString(), {
    params: {
      page,
      limit,
      status,
      search,
      exclude,
      dataInicial,
      dataFinal
    }
  })
}

export const useGetLancamentosQueryOptions = (empresaId: number, {
  search,
  page,
  limit,
  status,
  exclude,
  dataInicial,
  dataFinal,
  ...queryKeys
}: {
  search?: string
  page?: number
  limit?: number
  status?: string,
  exclude?: string
  dataInicial?: string
  dataFinal?: string
} = {}) => {
  return queryOptions({
    queryKey: ['lancamentos', empresaId, { search, page, limit, status, exclude, dataInicial, dataFinal }, queryKeys],
    queryFn: () => getLancamentos(empresaId, { search, page, limit, status, exclude, dataInicial, dataFinal })
  })
}
//lancamentos
export default function ListarLancamentos({
  limitView,
  exclude,
  onSelectLancamento
}: {
  limitView: number
  exclude: string
  onSelectLancamento: ((lancamento: LancamentoLocacao) => void) | undefined
}) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const isBigScreen = useMediaQuery({ query: '(min-width: 1824px)' })
  const isPortrait = useMediaQuery({ query: '(min-width: 1224px)' })
  const isTablet = useMediaQuery({ query: '(min-width: 746px)' })
  const isMobile = useMediaQuery({ query: '(max-width: 420px)' })
  //const isRetina = useMediaQuery({ query: '(min-resolution: 2dppx)' })
  const [showcard, setShowCard] = useState((isMobile ? false : true));
  const [isOpenCobrancao, setIsOpenCobrancao] = useState(false)

  const navigate = useNavigate()

  //Globals
  const glb_params = useGlobalParams();

  const [searchParams, setSearchTerm] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  //const limit = ((isPortrait || isTablet || isBigScreen) && limitView > 1 ? 3 : isMobile ? 1 : limitView > 0 ? limitView : limitView || Number(searchParams.get('limit')) || 3);
  const limit = ((isPortrait || isTablet || isBigScreen) && limitView > 1 ? 100 : isMobile ? 1 : limitView > 0 ? limitView : limitView || Number(searchParams.get('limit')) || 3);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const [dataInicial, setdataInicial] = useState(moment(new Date()).format("YYYY-MM-DD"));
  const [dataFinal, setdataFinal] = useState(moment(new Date()).format("YYYY-MM-DD"));

  const { data, isLoading } = useQuery(
    useGetLancamentosQueryOptions(glb_params.id_empresa ? Number(glb_params.id_empresa) : 0, {
      page,
      limit,
      search,
      status,
      exclude,
      dataInicial,
      dataFinal
    })
  )

  const locacoes = data?.data?.data || []
  const totalPages = data?.data?.totalPages

  console.log(locacoes);

  const gerarBoleto = useMutation({
    mutationFn: async (locacao: Locacao) => {
      return await api.post('/lancamentos/gerar-boleto', locacao)
    },
    onSuccess: () => {
      ['lancamentos'].forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] })
      })

      toast({
        title: 'Geração de Cobrança',
        description: `Cobrança gerada com sucesso`
      })
    }
  });


  // const hasTotalPages = !!totalPages
  // const canGoToNextPage = hasTotalPages && page < totalPages
  // const canGoToPreviousPage = hasTotalPages && page > totalPages
  //always that we go to out of the total pages, we will go to the first page

  useEffect(() => {
    if (!onSelectLancamento) {
      glb_params.updTitle_form('Lançamentos de Locações');
    }
    if (totalPages && page > totalPages) {
      navigate({
        search: `?page=1&limit=${limit}&search=${search}`
      })
    }
  }, [totalPages, page, navigate, limit, search])

  useEffect(() => {
    if (isMobile) {
      setShowCard(true);
    }
  }, [isMobile])


  // Event Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const search = e.target.value
    setSearchTerm({ search })
  }

  // const methods = useForm({})

  const handlePageChange = (newpage: number) => {
    // Check if the new page is within the total pages
    // const canGoNext = !!totalPages && newpage <= totalPages ||

    const canChangePage = !!totalPages && newpage > 0 && newpage <= totalPages

    if (!canChangePage) return
    navigate({
      search: `?page=${newpage}&limit=${limit}&search=${search}`
    })
  }

  const handleClickVerDetalhes = (id: number) => {
    navigate(`${ROUTE.LANCAMENTOS}/${id}?dataInicial=${dataInicial}&dataFinal=${dataFinal}`)
  }
  // UI Logic
  const hasSearchResults = Boolean(!isLoading && search && locacoes?.length === 0)

  const googleMaps = "https://www.google.com/maps/place/";
  const handlerClickMaps = (endereco: Endereco | undefined) => {
    if (endereco) {
      const urlGoogleMaps = googleMaps + getEnderecoFormatMaps(endereco);
      window.open(urlGoogleMaps);
    }
  }

  const handleGerarCobranca = async (locacao: Locacao) => {
    try {
      gerarBoleto.mutateAsync(locacao);
    } catch (error) {
      toast({ title: 'Erro ao gerar boleto.', variant: 'destructive' });
    }
  }

  return (
    <div className="container mx-auto space-y-6 p-4 font-[Poppins-regular]">
      {/* Search & Filters */}
      {/* <div className="grid grid-cols-2 flex flex-col justify-end items-start gap-4 sm:flex-row sm:items-center"> */}
      <div className="flex flex-row items-start justify-end gap-2 sm:flex-row sm:items-center">
        {glb_params.origin_url.indexOf('lista') > -1 && (
          <h1 className="text-2xl font-bold">Lançamentos de Locações</h1>
        )}
      </div>
      <div className='grid grid-cols-3'>
        {showcard ?
          (<List onClick={() => { setShowCard(!showcard) }} color='black' className='hover:cursor-pointer hover:bg-gray-300' />) :
          (<IdCard onClick={() => { setShowCard(!showcard) }} color='black' className='hover:cursor-pointer hover:bg-gray-300' />)
        }
      </div>

      <div className=
        {(isPortrait || isTablet || isBigScreen)
          ? "grid grid-cols-2 gap-4 sm:flex-row sm:items-center sm:justify-between border-b"
          : "grid grid-cols-1 gap-4 sm:flex-row sm:items-center sm:justify-between border-b"}
      >
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            onChange={handleSearchChange}
            value={search}
            placeholder="Buscar lançamentos"
            className="pl-8"
          />
        </div>
        <div className=
          {(isPortrait || isTablet || isBigScreen)
            ? "grid grid-cols-3 gap-4 mb-2"
            : "grid grid-cols-1 gap-4 mb-2"}>
          <h1 className='flex items-center'>Período</h1>
          <div className="flex justify-between gap-2">
            <Label className="text-base flex items-center">
              De</Label>
            <Input
              type='date'
              className="mt-2"
              placeholder="Data de vencimento"
              value={dataInicial}
              onChange={(e) => setdataInicial(e.target.value)}
            />
          </div>
          <div className="flex justify-between gap-2">
            <Label className="text-base flex items-center">
              Até
            </Label>
            <Input
              type='date'
              className="mt-2"
              placeholder="Data de vencimento"
              value={dataFinal}
              onChange={(e) => setdataFinal(e.target.value)}
            />

          </div>
        </div>
      </div>

      {/* lancamentos Grid */}
      <div className={limit === 1 ? "grid gap-6 grid-cols-1" : "grid gap-6 sm:grid-cols-1 lg:grid-cols-3"}>
        {/* Search Results & No Results Message */}
        {hasSearchResults && (
          <p className="text-center text-muted-foreground">
            Nenhum lançamento encontrado para a busca atual.
          </p>
        )}

        {/*Card das locações/lançamentos */}

        {isLoading ? (
          <div className="bg-transparent flex justify-center items-center col-span-full">
            <Loader />
          </div>
        ) :
          (
            showcard ?
              (
                <>
                  {locacoes.map((locacao) => (
                    <Card key={locacao.id} className="">
                      <CardHeader className="flex flex-row justify-between">
                        <CardTitle className="line-clamp-1" style={{ fontSize: '1rem' }}>
                          <p className="line-clamp-2 flex gap-1 text-sm text-muted-foreground">
                            <MapPin className="inline-block h-4 w-4 cursor-pointer"
                              onClick={() => { handlerClickMaps(locacao.imovel?.endereco) }}
                              color='green'
                            />
                            {(locacao.locatarios && locacao.locatarios.length > 0 && locacao.locatarios[0].pessoa) ? locacao.locatarios[0].pessoa.nome + ' - ' : ''}
                            {getEnderecoFormatado(locacao.imovel?.endereco)}
                            {locacao.imovel?.endereco?.complemento ? ' - ' + locacao.imovel.endereco.complemento : ''}
                          </p>

                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Label className="font-bold flex justify-end">
                          Aluguel R$ {locacao.valorAluguel?.toLocaleString('pt-BR')}
                        </Label>
                        {(locacao.lancamentos && locacao.lancamentos?.length > 0) ? (
                          <>
                            <Label style={{ 'fontSize': '0.7rem' }}> Lançamentos </Label>
                            <div className='rounded-md border'>
                              <div className='grid grid-cols-5 m-2 font-[Poppins-bold]' >
                                <Label className='col-span-2' style={{ 'fontSize': '0.7rem' }}>Descrição</Label>
                                {!isMobile ? (
                                  <Label style={{ 'fontSize': '0.7rem' }}>Emissão</Label>)
                                  : (<></>)
                                }
                                <Label style={{ 'fontSize': '0.7rem' }}>Vencimento</Label>
                                <Label className={!isMobile ? 'flex justify-end' : 'flex justify-end col-span-2'} style={{ 'fontSize': '0.7rem' }}>Valor</Label>
                              </div>

                              <div className='grid grid-cols-5 m-2 gap-1' >
                                {locacao.lancamentos?.map((lancamento) => (
                                  <>
                                    <Label className={lancamento.status === LancamentoStatus.ABERTO ? 'col-span-2 text-red-600' : 'col-span-2'} style={{ 'fontSize': '0.7rem' }}>{lancamento.lancamentotipo.name}</Label>
                                    {!isMobile ? (<Label className={lancamento.status === LancamentoStatus.ABERTO ? 'text-red-600' : ''} style={{ 'fontSize': '0.7rem' }}>{moment.utc(lancamento.dataLancamento).format("DD/MM/YYYY")}</Label>)
                                      : (<></>)
                                    }
                                    <Label className={lancamento.status === LancamentoStatus.ABERTO ? (!isMobile ? 'text-red-600' : 'text-red-600 col-span-2') : (!isMobile ? '' : 'col-span-2')} style={{ 'fontSize': '0.7rem' }}>{moment.utc(lancamento.vencimentoLancamento).format("DD/MM/YYYY")}</Label>
                                    <Label className={lancamento.status === LancamentoStatus.ABERTO ? 'flex justify-end text-red-600' : 'flex justify-end'} style={{ 'fontSize': '0.7rem' }}>{usdFormatter.format(lancamento.valorLancamento)}</Label>
                                  </>
                                ))}
                              </div>
                            </div>
                            <div className='grid grid-cols-2 font-[Poppins-bold] mt-5 '>
                              <Label className={locacao.lancamentos && locacao.lancamentos[0].status === LancamentoStatus.ABERTO ? 'flex justify-start text-red-600' : 'flex justify-start'} style={{ 'fontSize': '0.7rem' }}>Total</Label>
                              <Label className={locacao.lancamentos && locacao.lancamentos[0].status === LancamentoStatus.ABERTO ? 'flex justify-end text-red-600' : 'flex justify-end'} style={{ 'fontSize': '0.7rem' }}>
                                {usdFormatter.format(locacao.valorAluguel +
                                  locacao.lancamentos.reduce((total, lancamento) => {
                                    return total + lancamento.valorLancamento;
                                  }, 0))}
                              </Label>
                            </div>
                          </>
                        )
                          : (<p className="text-center text-muted-foreground mt-5">
                            Não há lançamentos para essa locação
                          </p>
                          )
                        }
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <div className='grid grid-cols-2 gap-10'>
                          <div>
                            {((isAdmin ||
                              user?.permissions.includes("ALL") ||
                              user?.permissions.includes("UPDATE_LOCACAO_LANCAMENTO"))) && (

                                <Button variant="secondary"
                                  onClick={() => handleClickVerDetalhes(locacao?.id)}
                                  size={"sm"}>
                                  <Pencil className='h4 w4' /> Lançamentos
                                </Button>
                              )}
                          </div>
                          <div>
                            {((isAdmin ||
                              user?.permissions.includes("ALL") ||
                              user?.permissions.includes("CREATE_PAGAMENTO")) &&
                              (locacao.lancamentos && locacao.lancamentos?.length > 0 && locacao.lancamentos[0].status === LancamentoStatus.ABERTO)) && (

                                <>
                                  <Button variant="secondary"
                                    onClick={() => setIsOpenCobrancao(true)}
                                    size={"sm"}>
                                    <Receipt className="h-4 w-4" />Gerar Cobrança
                                  </Button>
                                </>
                              )}
                          </div>
                          <AlertDialog
                            open={isOpenCobrancao}
                            onOpenChange={(value) => {
                              setIsOpenCobrancao(value)
                            }}
                          >
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  'Isso irá confirmar os lançamentos para geração da cobrança.'
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleGerarCobranca(locacao)}>
                                  'Sim, confirmar cobrança.'
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardFooter>
                    </Card>
                  )
                  )
                  }
                </>
              ) :
              (
                <div className='col-span-3'>
                  <table className="w-full table-fixed">
                    <thead className="sticky top-0">
                      <tr>
                        <th className="border-b p-2 text-left">Locacao</th>
                        <th className="border-b p-2 text-left">Telefone</th>
                        <th className="border-b p-2 text-left">Documento</th>
                        <th className="border-b p-2 text-left">Email</th>
                        <th className="border-b p-2 text-left"></th>
                      </tr>
                    </thead>
                  </table>
                  <div className='h-[500px] flex-1 overflow-y-auto'>
                    <table className='w-full table-fixed'>
                      <tbody>
                        {locacoes?.map((locacao) => (
                          <tr key={locacao.id} className="hover:bg-gray-300">
                            <td className={locacao.status === LocacaoStatus.ENCERRADA ? "border-b p-2 text-red-600" : "border-b p-2"}>
                              {(locacao.locatarios && locacao.locatarios.length > 0 ? (locacao.locatarios[0].pessoa ? locacao.locatarios[0].pessoa.nome : 'Sem locatário') : 'Sem locatário')
                                + ' - ' + (locacao.imovel?.endereco ? getEnderecoFormatado(locacao.imovel.endereco) : 'Sem endereço')}
                            </td>
                            <td className={locacao.status === LocacaoStatus.ENCERRADA ? "border-b p-2 text-red-600" : "border-b p-2"}>
                              {locacao.locatarios && locacao.locatarios.length > 0 ? (locacao.locatarios[0].pessoa ? locacao.locatarios[0].pessoa.telefone : 'Sem telefone') : 'Sem telefone'}
                            </td>
                            <td className={locacao.status === LocacaoStatus.ENCERRADA ? "border-b p-2 text-red-600" : "border-b p-2"}>
                              <div>
                                {locacao.locatarios && locacao.locatarios.length > 0 ? (locacao.locatarios[0].pessoa ? locacao.locatarios[0].pessoa.documento : 'Sem documento') : 'Sem documento'}
                              </div>
                            </td>
                            <td className={locacao.status === LocacaoStatus.ENCERRADA ? "border-b p-2 text-red-600" : "border-b p-2"}>
                              <div>
                                {locacao.locatarios && locacao.locatarios.length > 0 ? (locacao.locatarios[0].pessoa ? locacao.locatarios[0].pessoa.email : 'Sem email') : 'Sem email'}
                              </div>
                            </td>
                            <td className="border-b p-2">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => { handleClickVerDetalhes(locacao.id) }}
                                  className='hover:cursor-pointer hover:bg-gray-700'
                                >
                                  Ver detalhes
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
          )
        }
      </div>

      {/* Pagination */}
      <Pagination>
        <PaginationContent>
          {/* Previous & Next Buttons */}
          <PaginationItem>
            <PaginationPrevious onClick={() => handlePageChange(page - 1)}
              className='hover:cursor-pointer hover:bg-gray-200' />
          </PaginationItem>
          {generatePaginationLinks(page, !totalPages ? 1 : totalPages, (limit === 1 ? 1 : isBigScreen ? 10 : isPortrait ? 10 : isTablet ? 5 : 2), handlePageChange)}
          <PaginationItem>
            <PaginationNext
              onClick={() => handlePageChange(page + 1)}
              aria-disabled={(page > (!totalPages ? 1 : totalPages - 1) ? "true" : "false")}
              className='hover:cursor-pointer hover:bg-gray-200'
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
