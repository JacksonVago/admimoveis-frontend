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
import { getEnderecoFormatado } from '@/helpers/get-endereco-formatado'
import { useAuth } from '@/hooks/auth/use-auth'
import { Bloco } from '@/interfaces/bloco'
import api from '@/services/axios/api'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { IdCard, List, Plus, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useMediaQuery } from 'react-responsive'
import { useNavigate, useSearchParams } from 'react-router-dom'

// Types
interface GetBlocosParams {
  search?: string
  page?: number
  limit?: number
  exclude?: string
}

export interface BasePaginationData<T> {
  data: T[]
  page: number
  pageSize: number
  totalPages: number
  currentPosition: number
}

/*export const getTipos = async () => {
  return await api.get<TipoImovel[]>('tipoimovel')
}*/


// API & Query Logic
export const getBlocos = async (empresaId:number, { page, limit, search, exclude }: GetBlocosParams) => {
  return await api.get<BasePaginationData<Bloco>>('blocos/' + empresaId.toString(), {
    params: {
      page,
      limit,
      search,
      exclude
    }
  })
}

export const useGetBlocosQueryOptions = (empresaId:number, {
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
    queryKey: ['blocos', empresaId, { search, page, limit, exclude }, queryKeys],
    queryFn: () => getBlocos(empresaId, { search, page, limit, exclude })
  })
}

// Component
export default function ListarBlocos({
  limitView,
  exclude,
  onSelectBloco
}: {
  limitView: number
  exclude: string
  onSelectBloco: ((bloco: Bloco) => void) | undefined
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

  const [showcard, setShowCard] = useState(!!onSelectBloco);

  const [searchParams, setSearchTerm] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1
  const limit = ((isPortrait || isTablet || isBigScreen) && limitView > 1 ? 3 : (isMobile && limitView > 2) ? 1 : limitView > 0 ? limitView : limitView || Number(searchParams.get('limit')) || 3);
  const search = searchParams.get('search') || ''

  const { data, isLoading } = useQuery(
    useGetBlocosQueryOptions(glb_params.id_empresa ? Number(glb_params.id_empresa) : 0,{
      page,
      limit,
      search,
      exclude,
    })
  )

  console.log(data?.data?.data);
  const blocos = data?.data?.data || []
  const totalPages = data?.data?.totalPages
  //const googleMaps = "https://www.google.com/maps/place/R.+Jo%C3%A3o+Kopke,+236+-+Bom+Retiro,+S%C3%A3o+Paulo+-+SP,+01124-030";
  //const googleMaps = "https://www.google.com/maps/place/";

  //const hasTotalPages = !!totalPages
  //const canGoToNextPage = hasTotalPages && page < totalPages
  //const canGoToPreviousPage = hasTotalPages && page > totalPages


  //Leitura das imagens
  /*const LoadImage = async (id: number, url: string) => {

    const response = await fetch(
      'https://jrseqfittadsxfbmlwvz.supabase.co/storage/v1/object/public/' + url
    )
    if (!response.ok) {
      throw new Error(`Erro ao buscar imagem: ${url}, Status: ${response.status}`)
    }
    const blob = await response.blob()
    const file = new File([blob], url, { type: blob.type })
    return {
      file,
      preview: URL.createObjectURL(file),
      id: id
    }
  }*/

  //always that we go to out of the total pages, we will go to the first page
  useEffect(() => {
    if (onSelectBloco === undefined) {
      glb_params.updTitle_form('Blocos');
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

  const handleClickCreateBloco = () => {
    navigate(ROUTE.BLOCOS_CRIAR)
  }
  // UI Logic
  const hasSearchResults = Boolean(!isLoading && search && blocos?.length === 0)

  const handleClickVerDetalhes = (id: string) => {
    navigate(`${ROUTE.BLOCOS}/${id}`)
  }

  
  return (
    <div className="container mx-auto space-y-4 p-4 font-[Poppins-regular]">
      {/* Search & Filters */}
      <div className="flex flex-row items-start justify-between gap-2 sm:flex-row sm:items-center">
        {!onSelectBloco && (
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
          user?.permissions.includes("CREATE_BLOCO")
        ) && !onSelectBloco) && (
            <Button size={"sm"} onClick={handleClickCreateBloco}
            className='hover:bg-gray-500 hover:cursor-pointer'>
              <Plus className="mr-2 h-4 w-4" /> Criar bloco
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
            placeholder="Buscar blocos"
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
        {hasSearchResults && (
          <p className="text-center text-muted-foreground">Nenhum bloco encontrado</p>
        )}

        {/* Blocos Cards */}

        {isLoading ? (
          <div className="bg-transparent flex justify-center items-center col-span-full">
            <Loader />
          </div>
        ) :
        
          (
            showcard ?
              (
                <>
                  {blocos?.map((bloco) => (
                    <Card key={bloco.id} className="">
                      <CardHeader className="flex flex-row justify-between">
                        <CardTitle className="line-clamp-1" style={{ fontSize: '1rem' }}>{bloco?.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className='font-[Poppins-bold]'>{bloco.condominio.name}</p>
                        <p className="line-clamp-2 flex gap-1 text-sm text-muted-foreground">
                          {getEnderecoFormatado(bloco?.condominio.endereco)}
                        </p>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <div className='grid grid-cols-2 gap-10'>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleClickVerDetalhes(bloco?.id.toString())}
                            className='hover:bg-gray-200 hover:cursor-pointer'
                          >
                            Ver detalhes
                          </Button>
                          {onSelectBloco && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                onSelectBloco(bloco);
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
                      {blocos?.map((bloco) => (
                        <tr key={bloco.id} className="hover:bg-gray-300">
                          <td className="border-b p-2">
                            {bloco?.name}
                          </td>
                          <td className="border-b p-2">
                            <p className='font-[Poppins-bold]'>{bloco.condominio.name}</p>
                            {getEnderecoFormatado(bloco?.condominio.endereco)}
                          </td>
                          <td className="border-b p-2">
                            <div className="flex space-x-2 justify-end">
                              <Button
                                size="sm"
                                onClick={() => handleClickVerDetalhes(bloco?.id.toString())}
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
