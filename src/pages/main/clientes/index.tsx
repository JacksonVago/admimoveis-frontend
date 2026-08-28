import { Badge } from '@/components/ui/badge'
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
import { queryOptions, useQuery } from '@tanstack/react-query'
import { IdCard, List, Plus, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BasePaginationData } from '../imoveis/listarImoveis'
import { Pessoa } from '@/interfaces/pessoa'
import { useMediaQuery } from 'react-responsive'
import { useGlobalParams } from '@/globals/GlobalParams'
import { generatePaginationLinks } from '@/components/ui/generate-pages'
import { useAuth } from '@/hooks/auth/use-auth'
import { Loader } from '@/components/ui/loader'
import { PessoaStatus } from '@/enums/pessoal/status-pesoa'

// Types
interface GetClientesParams {
  search?: string
  page?: number
  limit?: number,
  exclude?: string,
}

// API & Query Logic
export const getClientes = async (empresaId: number, { page, limit, search, exclude }: GetClientesParams) => {
  return await api.get<BasePaginationData<Pessoa>>('pessoas/' + empresaId.toString(), {
    params: {
      page,
      limit,
      search,
      exclude
    }
  })
}

export const useGetClientesQueryOptions = (empresaId: number, {
  search,
  page,
  limit,
  exclude,
  ...queryKeys
}: {
  search?: string
  type?: string
  rooms?: number
  price?: string
  page?: number
  limit?: number
  exclude?: string
} = {}) => {
  return queryOptions({
    queryKey: ['clientes', empresaId, { search, page, limit, exclude }, queryKeys],
    queryFn: () => getClientes(empresaId, { search, page, limit, exclude })
  })
}

// Component
export default function ListarClientes({
  txtVinc,
  limitView,
  exclude,
  onSelectCliente
}: {
  txtVinc: string
  limitView: number
  exclude: string
  onSelectCliente: ((cliente: Pessoa) => void) | undefined
}) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const isBigScreen = useMediaQuery({ query: '(min-width: 1824px)' })
  const isPortrait = useMediaQuery({ query: '(min-width: 1224px)' })
  const isTablet = useMediaQuery({ query: '(min-width: 746px)' })
  const isMobile = useMediaQuery({ query: '(max-width: 450px)' })
  //const isRetina = useMediaQuery({ query: '(min-resolution: 2dppx)' })
  const [showcard, setShowCard] = useState((txtVinc != '' ? false : true) || (isMobile ? false : true));

  const navigate = useNavigate()

  //Globals
  const glb_params = useGlobalParams();

  const [searchParams, setSearchTerm] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  //const limit = ((isPortrait || isTablet || isBigScreen) && limitView > 1 ? 3 : isMobile ? 1 : limitView > 0 ? limitView : limitView || Number(searchParams.get('limit')) || 3);
  const limit = ((isPortrait || isTablet || isBigScreen) && limitView > 1 ? 100 : isMobile ? 1 : limitView > 0 ? limitView : limitView || Number(searchParams.get('limit')) || 3);
  const search = searchParams.get('search') || '';

  const { data, isLoading } = useQuery(
    useGetClientesQueryOptions(glb_params.id_empresa ? Number(glb_params.id_empresa) : 0, {
      page,
      limit,
      search,
      exclude,
    })
  )

  const clientes = data?.data?.data || []
  const totalPages = data?.data?.totalPages

  // const hasTotalPages = !!totalPages
  // const canGoToNextPage = hasTotalPages && page < totalPages
  // const canGoToPreviousPage = hasTotalPages && page > totalPages
  //always that we go to out of the total pages, we will go to the first page

  useEffect(() => {
    if (!onSelectCliente) {
      glb_params.updTitle_form('Clientes');
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
  const handleClickCreateCliente = () => {
    navigate(ROUTE.CLIENTES_CRIAR)
  }

  const handleClickVerDetalhes = (id: number) => () => {
    navigate(`${ROUTE.CLIENTES}/${id}`)
  }
  // UI Logic
  const hasSearchResults = Boolean(!isLoading && search && clientes?.length === 0)

  console.log('url',glb_params.origin_url);

  return (
    <div className="container mx-auto space-y-6 p-4 font-[Poppins-regular]"  style={{color: "#034869"}}>
      {/* Search & Filters */}
      {/* <div className="grid grid-cols-2 flex flex-col justify-end items-start gap-4 sm:flex-row sm:items-center"> */}
      <div className="flex flex-row items-start justify-end gap-2 sm:flex-row sm:items-center">
        {glb_params.origin_url.indexOf('lista') > -1 && (
          <h1 className="text-2xl font-bold">Clientes</h1>
        )}
        <div className='grid grid-cols-3'>
          {(txtVinc === '' ?
            (showcard ?
              (<List onClick={() => { setShowCard(!showcard) }} color='#034869' className='hover:cursor-pointer hover:bg-gray-300' />) :
              (<IdCard onClick={() => { setShowCard(!showcard) }} color='#034869' className='hover:cursor-pointer hover:bg-gray-300' />)
            ) : (<></>))
          }
        </div>
        {(isAdmin ||
          user?.permissions.includes("ALL") ||
          user?.permissions.includes("CREATE_PESSOA")
        ) && (
            <Button onClick={handleClickCreateCliente} size={"sm"} 
            className="hover:bg-[#a9d9ef] hover:cursor-pointer bg-[#034869] hover:text-[#034869] text-white"
            >
              <Plus className="h-4 w-4" />Criar Cliente
            </Button>
          )}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" style={{ color: "#034869" }}/>
          <Input
            onChange={handleSearchChange}
            value={search}
            placeholder="Buscar clientes"
            className="pl-8"
          />
        </div>
      </div>

      {/* Clientes Grid */}
      <div className={limit === 1 ? "grid gap-6 grid-cols-1" : "grid gap-6 sm:grid-cols-1 lg:grid-cols-3"}>
        {/* Search Results & No Results Message */}
        {hasSearchResults && (
          <p className="text-center text-muted-foreground">
            Nenhum cliente encontrado para a busca atual.
          </p>
        )}

        {/* Clientes Cards */}
        {isLoading ? (
          <div className="bg-transparent flex justify-center items-center col-span-full">
            <Loader />
          </div>
        ) :
          (
            showcard ?
              (
                <>
                  {clientes?.map((cliente) => (
                    <Card key={cliente.id} className="flex flex-col"  style={{color: "#034869"}}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span className="truncate"
                            style={
                              {
                                fontSize: (isBigScreen ? '1.2rem' : isPortrait ? '1rem' : isTablet ? '0.8rem' : isMobile ? '1rem' : '1rem'),
                              }}

                          >{cliente?.nome}</span>
                          <Badge variant="secondary" className='bg-[#a7d9f2]'>
                            {(cliente?.locatarios?.length && cliente?.locatarios?.length > 0
                              ? 'Locatário'
                              : (cliente?.proprietarios?.length && cliente?.proprietarios?.length > 0
                                ? 'Proprietário'
                                : (cliente?.fiador
                                  ? 'Fiador'
                                  : 'Cliente')))}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <dl className="grid grid-cols-2 gap-1 text-sm">
                          <dt className="font-semibold">CPF/CNPJ:</dt>
                          <dd className="truncate">{cliente?.documento}</dd>
                          <dt className="font-semibold">Profissão:</dt>
                          <dd className="truncate">{cliente?.profissao || 'N/A'}</dd>
                          <dt className="font-semibold">Estado Civil:</dt>
                          <dd>{cliente?.estadoCivil || 'N/A'}</dd>
                          <dt className="font-semibold">Email:</dt>
                          <dd className="truncate">{cliente?.email || 'N/A'}</dd>
                          <dt className="font-semibold">Telefone:</dt>
                          <dd>{cliente?.telefone || 'N/A'}</dd>
                        </dl>
                      </CardContent>
                      <CardFooter>
                        <div className="grid grid-cols-2 gap-10">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="w-full hover:bg-[#daeffa] hover:cursor-pointer bg-[#a7d9f2]"
                            onClick={handleClickVerDetalhes(cliente.id)}
                            style={
                              {
                                fontSize: (isBigScreen ? '1.2rem' : isPortrait ? '1rem' : isTablet ? '0.8rem' : isMobile ? '0.8rem' : '0.3rem'),
                              }}
                          >
                            Ver detalhes
                          </Button>
                          {(txtVinc !== '' && onSelectCliente) && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                onSelectCliente(cliente);
                              }}
                              style={{
                                fontSize: (isBigScreen ? '1.2rem' : isPortrait ? '1rem' : isTablet ? '0.8rem' : isMobile ? '0.8rem' : '0.3rem'),
                                textWrap: 'inherit'
                              }}
                              className='hover:cursor-pointer hover:bg-gray-200'
                            >
                              {txtVinc}
                            </Button>
                          )}
                        </div>
                      </CardFooter>
                    </Card>
                  ))
                  }
                </>
              ) :
              (
                <div className='col-span-3'>
                  <table className="w-full table-fixed">
                    <thead className="sticky top-0">
                      <tr>
                        <th className="border-b p-2 text-left">Cliente</th>
                        <th className="border-b p-2 text-left">Telefone</th>
                        <th className="border-b p-2 text-left">Documento</th>
                        <th className="border-b p-2 text-left">Email</th>
                        <th className="border-b p-2 text-left"></th>
                      </tr>
                    </thead>
                  </table>
                  <div className='h-[450px] flex-1 overflow-y-auto'>
                    <table className='w-full table-fixed'>
                      <tbody>
                        {clientes?.map((cliente) => (
                          <tr key={cliente.id} className="hover:bg-gray-300">
                            <td className={cliente.status === PessoaStatus.CANCELADA ? "border-b p-2 text-red-600" : "border-b p-2"}>
                              {cliente.nome}
                            </td>
                            <td className={cliente.status === PessoaStatus.CANCELADA ? "border-b p-2 text-red-600" : "border-b p-2"}>
                              {cliente.telefone}
                            </td>
                            <td className={cliente.status === PessoaStatus.CANCELADA ? "border-b p-2 text-red-600" : "border-b p-2"}>
                              <div>
                                {cliente.documento}
                              </div>
                            </td>
                            <td className={cliente.status === PessoaStatus.CANCELADA ? "border-b p-2 text-red-600" : "border-b p-2"}>
                              <div>
                                {cliente.email}
                              </div>
                            </td>
                            <td className="border-b p-2 flex justify-end">
                              <div className="flex space-x-2 ">
                                <Button
                                  size="sm"
                                  onClick={handleClickVerDetalhes(cliente.id)}
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
          )}
      </div>

      {/* Pagination */}
      <Pagination>
        <PaginationContent>
          {/* Previous & Next Buttons */}
          <PaginationItem key={"prev"}>
            <PaginationPrevious onClick={() => handlePageChange(page - 1)} className='hover:cursor-pointer hover:bg-gray-200' />
          </PaginationItem>
          {generatePaginationLinks(page, !totalPages ? 1 : totalPages, (limit === 1 ? 1 : isBigScreen ? 10 : isPortrait ? 10 : isTablet ? 5 : 2), handlePageChange)}
          <PaginationItem key={"next"}>
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
