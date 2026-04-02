import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
/*import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination'*/
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { ROUTE } from '@/enums/routes.enum'
import api from '@/services/axios/api'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { IdCard, List, Plus, Search, Table } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BasePaginationData } from '../imoveis/listarImoveis'
//import { Pessoa } from '@/interfaces/pessoa'
import { useMediaQuery } from 'react-responsive'
import { useGlobalParams } from '@/globals/GlobalParams'
import { generatePaginationLinks } from '@/components/ui/generate-pages'
import { Locacao } from '@/interfaces/locacao'
import { STATUS_LOCACAO_OPTIONS } from '@/constants/status-locacao'
import { LocacaoStatus } from '@/enums/locacao/enums-locacao'
import { useAuth } from '@/hooks/auth/use-auth'
import { Loader } from '@/components/ui/loader'
import { usdFormatter } from '@/utils/format-money'
import moment from 'moment'

// Types
interface GetLocacoesParams {
  search?: string
  page?: number
  limit?: number,
  status?: string | undefined,
  exclude?: string,
}

// API & Query Logic
export const getLocacoes = async (empresaId: number, { page, limit, search, status, exclude }: GetLocacoesParams) => {
  return await api.get<BasePaginationData<Locacao>>('locacoes/' + empresaId.toString(), {
    params: {
      page,
      limit,
      search,
      status,
      exclude
    }
  })
}

export const useGetLocacoesQueryOptions = (empresaId: number, {
  search,
  page,
  limit,
  status,
  exclude,
  ...queryKeys
}: {
  search?: string
  type?: string
  rooms?: number
  price?: string
  page?: number
  limit?: number
  status?: string | undefined
  exclude?: string
} = {}) => {
  return queryOptions({
    queryKey: ['locacoes', empresaId, { search, page, limit, status, exclude }, queryKeys],
    queryFn: () => getLocacoes(empresaId, { search, page, limit, status, exclude })
  })
}

// Component
export default function ListarLocacoes({
  txtVinc,
  limitView,
  exclude,
  onSelectLocacao
}: {
  txtVinc: string
  limitView: number
  exclude: string
  onSelectLocacao: ((locacao: Locacao) => void) | undefined
}) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const isBigScreen = useMediaQuery({ query: '(min-width: 1824px)' })
  const isPortrait = useMediaQuery({ query: '(min-width: 1224px)' })
  const isTablet = useMediaQuery({ query: '(min-width: 746px)' })
  const isMobile = useMediaQuery({ query: '(min-width: 200px)' })
  //const isRetina = useMediaQuery({ query: '(min-resolution: 2dppx)' })
  const [showcard, setShowCard] = useState(false);

  const navigate = useNavigate()

  //Globals
  const glb_params = useGlobalParams();

  const [searchParams, setSearchTerm] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const limit = ((isPortrait || isTablet || isBigScreen) && limitView > 1 ? 100 : (isMobile && limitView > 2) ? 2 : limitView > 0 ? limitView : limitView || Number(searchParams.get('limit')) || 3);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || undefined

  const { data, isLoading } = useQuery(
    useGetLocacoesQueryOptions(glb_params.id_empresa ? Number(glb_params.id_empresa) : 0, {
      page,
      limit,
      search,
      status,
      exclude,
    })
  )

  const locacoes = data?.data?.data || []
  const totalPages = data?.data?.totalPages

  console.log(totalPages)
  // const hasTotalPages = !!totalPages
  // const canGoToNextPage = hasTotalPages && page < totalPages
  // const canGoToPreviousPage = hasTotalPages && page > totalPages
  //always that we go to out of the total pages, we will go to the first page
  useEffect(() => {
    glb_params.updTitle_form('Locações');
    if (totalPages && page > totalPages) {
      navigate({
        search: `?page=1&limit=${limit}&search=${search}&status=${(status !== null ? status : '')}`
      })
    }
  }, [totalPages, page, navigate, limit, search])

  // Event Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const search = e.target.value
    setSearchTerm({ search })
  }

  const handlePageChange = (newpage: number) => {
    // Check if the new page is within the total pages
    // const canGoNext = !!totalPages && newpage <= totalPages ||

    const canChangePage = !!totalPages && newpage > 0 && newpage <= totalPages

    if (!canChangePage) return
    navigate({
      search: `?page=${newpage}&limit=${limit}&search=${search}&status=${(status !== null ? status : '')}`
    })
  }
  const handleClickCreateLocacao = () => {
    navigate(ROUTE.LOCACOES_CRIAR)
  }

  const handleClickVerDetalhes = (id: number) => () => {
    console.log(id);
    console.log(`${ROUTE.LOCACOES}/${id}`);
    navigate(`${ROUTE.LOCACOES}/${id}`)
  }
  // UI Logic
  const hasSearchResults = Boolean(!isLoading && search && locacoes?.length === 0)

  const handlerChangeStatus = (tipo: string) => {
    let tipo_aux: LocacaoStatus | null;

    switch (tipo.toUpperCase()) {
      case "ATIVA":
        tipo_aux = LocacaoStatus.ATIVA;
        break;
      case "AGUARDANDO DOCUMENTOS":
        tipo_aux = LocacaoStatus.AGUARDANDO_DOCUMENTOS;
        break;
      case "ENCERRADA":
        tipo_aux = LocacaoStatus.ENCERRADA;
        break;

      default:
        tipo_aux = LocacaoStatus.ATIVA;
    }
    navigate({
      search: `?page=1&limit=${limit}&search=${search}&status=${(tipo_aux !== null ? tipo_aux : '')}`
    })
  }

  console.log(locacoes);
  return (
    <div className="container mx-auto space-y-4 p-4 font-[Poppins-regular]">
      {/* Search & Filters */}
      <div className="flex flex-row items-start justify-end gap-2 sm:flex-row sm:items-center">
        <div className='grid grid-cols-3'>
          {showcard ?
            (<List onClick={() => { setShowCard(!showcard) }} color='black' />) :
            (<IdCard onClick={() => { setShowCard(!showcard) }} color='black' />)
          }
        </div>
        {(isAdmin ||
          user?.permissions.includes("ALL") ||
          user?.permissions.includes("CREATE_LOCACAO")
        ) && (
            <Button onClick={handleClickCreateLocacao} size={"sm"} className='hover:cursor-pointer hover:bg-gray-700'>
              <Plus className="h-4 w-4" />Criar Locação
            </Button>
          )}
      </div>

      <div className={isTablet ? 'grid grid-cols-6 gap-4' : 'grid grid-cols-1 gap-4'}>
        <div className="col-span-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              onChange={handleSearchChange}
              value={search}
              placeholder="Buscar locações"
              className="pl-8"
            />
          </div>
        </div>
        <div>
          <Select onValueChange={(value) => { handlerChangeStatus(value) }}>
            <SelectTrigger className="w-[160px] h-6 hover:cursor-pointer hover:outline">
              <SelectValue placeholder="Situação" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_LOCACAO_OPTIONS.map((value) => (
                <SelectItem key={value.label} value={value.label}>
                  {value.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Locações Grid */}
      <div className={limit === 1 ? "grid gap-6 grid-cols-1" : "grid gap-6 sm:grid-cols-1 lg:grid-cols-3"}>
        {/* Search Results & No Results Message */}
        {hasSearchResults && (
          <p className="text-center text-muted-foreground">
            Nenhuma locação encontrado para a busca atual.
          </p>
        )}

        {/* locações Cards */}
        {isLoading ?
          (
            <div className="bg-transparent flex justify-center items-center col-span-full">
              <Loader />
            </div>
          ) :

          (
            showcard ?
              (
                <>
                  {locacoes?.map((locacao) => (
                    <Card key={locacao.id} className="flex flex-col">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span className="text-wrap"
                            style={
                              {
                                fontSize: (isBigScreen ? '1.2rem' : isPortrait ? '1rem' : isTablet ? '0.8rem' : isMobile ? '1rem' : '1rem'),
                              }}

                          >{(locacao?.locatarios ? locacao?.locatarios[0].pessoa?.nome : '') + ' - ' + locacao?.imovel?.condominio.name + ' - ' + locacao?.imovel?.endereco?.complemento}</span>
                          <Badge variant="secondary">
                            {locacao?.locatarios?.length}
                            {locacao?.locatarios?.length && locacao?.locatarios?.length > 1
                              ? ' locatários'
                              : ' locatário'}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <dl className="grid grid-cols-2 gap-1 text-sm">
                          <dt className="font-semibold">Valor do Aluguel:</dt>
                          <dd className="truncate">{usdFormatter.format(locacao?.valorAluguel)}</dd>
                          <dt className="font-semibold">Dia de vencimento:</dt>
                          <dd className="truncate">{locacao?.diaVencimento || 'N/A'}</dd>
                          <dt className="font-semibold">Situacao:</dt>
                          <dd style={{
                            fontSize: (isTablet ? '0.6rem' : isMobile ? '0.8rem' : '0.3rem'),
                          }}>{locacao?.status || 'N/A'}</dd>
                        </dl>
                      </CardContent>
                      <CardFooter>
                        <div className="grid grid-cols-2 gap-4">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="w-full hover:cursor-pointer hover:bg-gray-200"
                            onClick={handleClickVerDetalhes(locacao.id)}
                            style={
                              {
                                fontSize: (isBigScreen ? '1.2rem' : isPortrait ? '1rem' : isTablet ? '0.8rem' : isMobile ? '0.8rem' : '0.3rem'),
                              }}
                          >
                            Ver detalhes
                          </Button>
                          {onSelectLocacao !== undefined && (
                            <Button
                              variant="secondary"
                              size="sm"
                              className="w-full"
                              onClick={() => {
                                onSelectLocacao(locacao);
                              }}
                              style={{
                                fontSize: (isBigScreen ? '1.2rem' : isPortrait ? '1rem' : isTablet ? '0.8rem' : isMobile ? '0.8rem' : '0.3rem'),
                                textWrap: 'inherit'
                              }}

                            >
                              {txtVinc !== '' ? txtVinc : 'Vincular Imóvel'}
                            </Button>
                          )}
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
                        <th className="border-b p-2 text-left">Locação</th>
                        <th className="border-b p-2 text-left">Período</th>
                        <th className="border-b p-2 text-left">Valor Aluguel</th>
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
                              {(locacao.locatarios ? locacao?.locatarios[0].pessoa?.nome : '') + ' - ' + locacao?.imovel?.condominio.name + ' - ' + locacao?.imovel?.endereco?.complemento}
                            </td>
                            <td className={locacao.status === LocacaoStatus.ENCERRADA ? "border-b p-2 text-red-600" : "border-b p-2"}>
                              <div>
                                {moment.utc(locacao.dataInicio).format("DD/MM/YYYY") + ' - ' + (locacao.dataFim ? moment.utc(locacao.dataFim).format("DD/MM/YYYY") : "")}
                              </div>
                            </td>
                            <td className={locacao.status === LocacaoStatus.ENCERRADA ? "border-b p-2 text-red-600" : "border-b p-2"}>
                              {locacao.valorAluguel}
                            </td>
                            <td className="border-b p-2">
                              <div className="flex space-x-2 ">
                                <Button
                                  size="sm"
                                  onClick={handleClickVerDetalhes(locacao.id)}
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

      {/* Pagination 
      <Pagination>
        <PaginationContent>
          <PaginationItem key='previous'>
            <PaginationPrevious onClick={() => handlePageChange(page - 1)} className='hover:cursor-pointer hover:bg-gray-200' />
          </PaginationItem>
          {generatePaginationLinks(page, !totalPages ? 1 : totalPages, (limit === 1 ? 2 : isBigScreen ? 10 : isPortrait ? 10 : isTablet ? 5 : 2), handlePageChange)}
          <PaginationItem key='next'>
            <PaginationNext
              onClick={() => handlePageChange(page + 1)}
              aria-disabled={(page > (!totalPages ? 1 : totalPages - 1) ? "true" : "false")}
              className='hover:cursor-pointer hover:bg-gray-200'
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>*/}
    </div>
  )
}
