import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { generatePaginationLinks } from '@/components/ui/generate-pages'
import { Input } from '@/components/ui/input'
import { Loader } from '@/components/ui/loader'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination'
import { ROUTE } from '@/enums/routes.enum'
import { useGlobalParams, usePessoa } from '@/globals/GlobalParams'
import { useAuth } from '@/hooks/auth/use-auth'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { IdCard, List, Plus, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useMediaQuery } from 'react-responsive'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getAlertasPag } from '../requests'
import { ConfiguracaoAlerta } from '@/interfaces/configuracaoalerta'

/*export const getTipos = async () => {
  return await api.get<TipoImovel[]>('tipoimovel')
}*/


// API & Query Logic
export const useGetAlertasQueryOptions = (empresaId:number, {
  search,
  page,
  limit,
  exclude,
  ...queryKeys
}: {
  search?: string
  page?: number
  limit?: number
  exclude?: string
} = {}) => {
  return queryOptions({
    queryKey: ['alertas', empresaId, { search, page, limit, exclude }, queryKeys],
    queryFn: () => getAlertasPag(empresaId, { search, page, limit, exclude })
  })
}

// Component
export default function ListarAlertas({
  limitView,
  exclude,
  onSelectAlerta
}: {
  limitView: number
  exclude: string
  onSelectAlerta: ((alerta: ConfiguracaoAlerta) => void) | undefined
}) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isBigScreen = useMediaQuery({ query: '(min-width: 1824px)' })
  const isPortrait = useMediaQuery({ query: '(min-width: 1224px)' })
  const isTablet = useMediaQuery({ query: '(min-width: 746px)' })
  const isMobile = useMediaQuery({ query: '(min-width: 200px)' })

  const navigate = useNavigate()
  //Globals
  const glb_params = useGlobalParams();
  const { resetStatePessoa } = usePessoa();

  const [showcard, setShowCard] = useState(!!onSelectAlerta);

  const [searchParams, setSearchTerm] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1
  const limit = ((isPortrait || isTablet || isBigScreen) && limitView > 1 ? 3 : (isMobile && limitView > 2) ? 1 : limitView > 0 ? limitView : limitView || Number(searchParams.get('limit')) || 3);
  const search = searchParams.get('search') || ''

  const { data, isLoading } = useQuery(
    useGetAlertasQueryOptions(glb_params.id_empresa ? Number(glb_params.id_empresa) : 0,{
      page,
      limit,
      search,
      exclude,
    })
  )

  console.log(data);
  console.log(data?.data);
  const alertas = data?.data || []
  //const totalPages = data?.data?.totalPages
  const totalPages = 0
  //always that we go to out of the total pages, we will go to the first page
  useEffect(() => {
    if (onSelectAlerta === undefined) {
      glb_params.updTitle_form('Alertas');
      resetStatePessoa();
    }


    if (totalPages && page > totalPages) {
      navigate({
        search: `?page=1&limit=${limit}&search=${search}`
      })
    }
  }, [totalPages, page, limit, search])

  useEffect(() => {
    if (isMobile){
      setShowCard(true);
    }
  }, [isMobile])

  // Event Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const search = e.target.value
    setSearchTerm({ search })
  }

  const handlePageChange = (newpage: number) => {
    // Check if the new page is within the total pages
    // const canGoNext = !!totalPages && newpage <= totalPages ||

    const canChangePage = !!totalPages && newpage > 0 && newpage <= totalPages

    console.log(search);
    if (!canChangePage) return
    navigate({
      search: `?page=${newpage}&limit=${limit}&search=${search}`
    })
  }

  const handleClickCreateAlerta = () => {
    navigate(ROUTE.ALERTAS_CRIAR)
  }
  // UI Logic
  //const hasSearchResults = Boolean(!isLoading && search && alertas?.length === 0)

  const handleClickVerDetalhes = (id: string) => {
    navigate(`${ROUTE.ALERTAS}/${id}`)
  }

  
  return (
    <div className="container mx-auto space-y-4 p-4 font-[Poppins-regular]">
      {/* Search & Filters */}
      <div className="flex flex-row items-start justify-between gap-2 sm:flex-row sm:items-center">
        {!onSelectAlerta && (
          <div className='grid grid-cols-3'>
            {showcard ?
              (<List onClick={() => { setShowCard(!showcard) }} color='black' className='hover:cursor-pointer '/>) :
              (<IdCard onClick={() => { setShowCard(!showcard) }} color='black' className='hover:cursor-pointer '/>)
            }
            {/* <h1 className="col-span-2 text-2xl font-bold">Imoveis</h1> 
          <Button className='flex justify-center' style={{ 'backgroundColor': 'transparent'}}
            onClick={() => { setShowCard(!showcard) }}>
              {showcard ? (<Table color='black' />) : (<IdCard color='black' />)}
            
          </Button>*/}
          </div>
        )}
        {((isAdmin ||
          user?.permissions.includes("ALL") ||
          user?.permissions.includes("CREATE_ALERTA")
        ) && !onSelectAlerta) && (
            <Button size={"sm"} onClick={handleClickCreateAlerta}
            className='hover:bg-gray-500 hover:cursor-pointer'>
              <Plus className="mr-2 h-4 w-4" /> Criar alerta
            </Button>
          )
        }
      </div>
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            onChange={handleSearchChange}
            value={search}
            placeholder="Buscar alertas"
            className="pl-8"
          />
        </div>
        {/* Filter Selects */}
        <div className="flex gap-2">
          {/* ... other filters ... */}
        </div>
      </div>

      {/* Imoveis Grid */}
      <div className={(isBigScreen ? "grid gap-4 grid-cols-3" : isPortrait ? "grid gap-4 grid-cols-3" : isTablet ? "grid gap-4 grid-cols-2" : isMobile ? "grid gap-4 grid-cols-1" : "grid gap-4 grid-cols-1")}>
        {/* Search Results & No Results Message */}
        {/*hasSearchResults && (
          <p className="text-center text-muted-foreground">Nenhum alerta encontrado</p>
        )*/}
        <p className="text-center text-muted-foreground">Nenhum alerta encontrado</p>
        {/* Alertas Cards */}

        {isLoading ? (
          <div className="bg-transparent flex justify-center items-center col-span-full">
            <Loader />
          </div>
        ) :
        
          (
            showcard ?
              (
                <>
                  {alertas?.map((alerta) => (
                    <Card key={alerta.id} className="">
                      <CardHeader className="flex flex-row justify-between">
                        <CardTitle className="line-clamp-1" style={{ fontSize: '1rem' }}>{alerta?.descricao}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className='font-[Poppins-bold]'>{alerta.dataInicioEnvio}</p>
                        <p className="line-clamp-2 flex gap-1 text-sm text-muted-foreground">
                          {alerta.dataFinalEnvio}
                        </p>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <div className='grid grid-cols-2 gap-10'>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleClickVerDetalhes(alerta.id.toString())}
                            className='hover:bg-gray-200 hover:cursor-pointer'
                          >
                            Ver detalhes
                          </Button>
                          {onSelectAlerta && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                onSelectAlerta(alerta);
                              }}
                              style={{
                                fontSize: (isBigScreen ? '1.2rem' : isPortrait ? '1rem' : isTablet ? '0.8rem' : isMobile ? '0.8rem' : '0.3rem'),
                                textWrap: 'inherit'
                              }}

                            >
                              Selecionar
                            </Button>
                          )}
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </>
              ) :
              (
                <div className='col-span-3'>
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="border-b p-2 text-left">Nome</th>
                        <th className="border-b p-2 text-left">Condominio</th>
                        <th className="border-b p-2 text-left"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {alertas?.map((alerta) => (
                        <tr key={alerta.id} className="hover:bg-gray-300">
                          <td className="border-b p-2">
                            {alerta.descricao}
                          </td>
                          <td className="border-b p-2">
                            <p className='font-[Poppins-bold]'>{alerta.dataInicio}</p>
                            {alerta.dataFinalEnvio}
                          </td>
                          <td className="border-b p-2">
                            <div className="flex space-x-2 justify-end">
                              <Button
                                size="sm"
                                onClick={() => handleClickVerDetalhes(alerta.id.toString())}
                                className="hover:bg-gray-500 hover:cursor-pointer"
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
              className='hover:bg-gray-200 hover:cursor-pointer'/>
          </PaginationItem>
          {generatePaginationLinks(page, !totalPages ? 1 : totalPages, (limit === 1 ? limit : isBigScreen ? 10 : isPortrait ? 10 : isTablet ? 5 : 1), handlePageChange)}
          <PaginationItem>
            <PaginationNext onClick={() => handlePageChange(page + 1)} 
              className='hover:bg-gray-200 hover:cursor-pointer'/>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
