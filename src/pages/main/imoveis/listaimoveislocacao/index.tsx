import { Badge } from '@/components/ui/badge'
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { ImovelTipo } from '@/enums/imovel/enums-imovel'
import { useGlobalParams } from '@/globals/GlobalParams'
import { getEnderecoFormatado } from '@/helpers/get-endereco-formatado'
import { Imovel } from '@/interfaces/imovel'
import { TipoImovel } from '@/interfaces/tipoimovel'
import { cn } from '@/lib/utils'
import api from '@/services/axios/api'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { useEffect } from 'react'
import { useMediaQuery } from 'react-responsive'
import { useNavigate, useSearchParams } from 'react-router-dom'

// Types
interface GetImoveisParams {
    search?: string
    type?: string
    rooms?: number
    price?: string
    page?: number
    limit?: number
    tipo?: string | undefined
    exclude?: string
}

export interface BasePaginationData<T> {
    data: T[]
    page: number
    pageSize: number
    totalPages: number
    currentPosition: number
}

export const getTipos = async (empresaId:number) => {
  return await api.get<TipoImovel[]>(`tipoimovel/${empresaId}`)
}


// API & Query Logic
export const getImoveis = async (empresaId:number, { page, limit, search, type, rooms, price, tipo, exclude }: GetImoveisParams) => {
    return await api.get<BasePaginationData<Imovel>>(`imoveis/locacao/${empresaId}`, {
        params: {
            page,
            limit,
            search,
            type,
            rooms,
            price,
            tipo,
            exclude
        }
    })
}

export const useGetImoveisQueryOptions = (empresaId:number, {
    search,
    type,
    rooms,
    price,
    page,
    limit,
    tipo,
    exclude,
    ...queryKeys
}: {
    search?: string
    type?: string
    rooms?: number
    price?: string
    page?: number
    limit?: number
    tipo?: string | undefined
    exclude?: string
} = {}) => {
    return queryOptions({
        queryKey: ['imoveis', empresaId, { search, type, rooms, price, page, limit, tipo, exclude }, queryKeys],
        queryFn: () => getImoveis(empresaId, { search, type, rooms, price, page, limit, tipo, exclude })
    })
}

/*const mockedImages = [
  'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8Y2FzYSUyMDIlMjBhbmFkcmVzfGVufDB8fDB8fHww',
  'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8Y2FzYSUyMDIlMjBhbmFkcmVzfGVufDB8fDB8fHww',
  'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8Y2FzYSUyMDIlMjBhbmFkcmVzfGVufDB8fDB8fHww',
  'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8Y2FzYSUyMDIlMjBhbmFkcmVzfGVufDB8fDB8fHww',
  'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8Y2FzYSUyMDIlMjBhbmFkcmVzfGVufDB8fDB8fHww',
  'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8Y2FzYSUyMDIlMjBhbmFkcmVzfGVufDB8fDB8fHww'
]*/

// Component
export default function ListarImoveisLocacao({
    limitView,
    exclude,
    onSelectImovel
}: {
    limitView: number
    exclude: string
    //onSelectImovel: (imovel: Imovel | undefined) => void
    onSelectImovel: ((imovel: Imovel) => void) | undefined
}) {
    const isBigScreen = useMediaQuery({ query: '(min-width: 1824px)' })
    const isPortrait = useMediaQuery({ query: '(min-width: 1224px)' })
    const isTablet = useMediaQuery({ query: '(min-width: 746px)' })
    const isMobile = useMediaQuery({ query: '(min-width: 200px)' })

    const navigate = useNavigate()
    //Globals
    const glb_params = useGlobalParams();

    const [searchParams, setSearchTerm] = useSearchParams();
    const page = Number(searchParams.get('page')) || 1
    const limit = ((isPortrait || isTablet || isBigScreen) && limitView > 1 ? 3 : (isMobile && limitView > 2) ? 1 : limitView > 0 ? limitView : limitView || Number(searchParams.get('limit')) || 3);
    const search = searchParams.get('search') || ''
    const tipo = searchParams.get('tipo') || undefined

    //Consulta Tipo imóvel
    const {
        data: imovelTipo
    } = useQuery({
        queryKey: ['imovelTipo'],
        queryFn: () => getTipos(glb_params.id_empresa ? Number(glb_params.id_empresa) : 0)
    });

    const { data, isLoading } = useQuery(
        useGetImoveisQueryOptions(glb_params.id_empresa ? Number(glb_params.id_empresa) : 0,{
            page,
            limit,
            search,
            tipo,
            exclude,
        })
    )

    console.log(data?.data?.data);
    const imoveis = data?.data?.data || []
    const totalPages = data?.data?.totalPages


    //always that we go to out of the total pages, we will go to the first page
    useEffect(() => {
        if (onSelectImovel === undefined) {
            glb_params.updTitle_form('Imóveis');
            glb_params.updPastaOrig('personal-info');
        }


        if (totalPages && page > totalPages) {
            navigate({
                search: `?page=1&limit=${limit}&search=${search}&tipo=${(tipo !== null ? tipo : '')}`
            })
        }
    }, [totalPages, page, limit, search, tipo])

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
            search: `?page=${newpage}&limit=${limit}&search=${search}&tipo=${(tipo !== null && tipo !== undefined ? tipo : '')}`
        })
    }

    const handlerChangeTipo = (tipo: string) => {
        navigate({
            search: `?page=1&limit=${limit}&search=${search}&tipo=${tipo}`
        })
    }

    // UI Logic
    const hasSearchResults = Boolean(!isLoading && search && imoveis?.length === 0)

    return (
        <div className="container mx-auto space-y-4 p-4 font-[Poppins-regular]">
            {/* Search & Filters */}
            <div className="flex flex-row items-start justify-between gap-2 sm:flex-row sm:items-center">
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        onChange={handleSearchChange}
                        value={search}
                        placeholder="Buscar imóveis"
                        className="pl-8"
                    />
                </div>
                {/* Filter Selects */}
                <div className="flex gap-2">
                    <Select onValueChange={(value) => { handlerChangeTipo(value) }}>
                        <SelectTrigger className="h-4 w-[160px]">
                            <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                        <SelectContent>
                            {imovelTipo?.data.map((value) => (
                                <SelectItem key={value.id} value={value.id.toString()}>
                                    {value.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {/* ... other filters ... */}
                </div>
            </div>

            <div className={(isBigScreen ? "grid gap-4 grid-cols-3" : isPortrait ? "grid gap-4 grid-cols-3" : isTablet ? "grid gap-4 grid-cols-2" : isMobile ? "grid gap-4 grid-cols-1" : "grid gap-4 grid-cols-1")}>
                {/* Search Results & No Results Message */}
                {hasSearchResults && (
                    <p className="text-center text-muted-foreground">Nenhum imóvel</p>
                )}

                {isLoading ?
                    (
                        <div className="bg-transparent flex justify-center items-center col-span-full">
                            <Loader />
                        </div>
                    ) :
                    (imoveis?.map((imovel) => (
                        <Card key={imovel.id} className="">
                            <CardHeader className="flex flex-row justify-between">
                                <CardTitle className="line-clamp-1" style={{ fontSize: '1rem' }}>{imovel?.description}</CardTitle>
                                <Badge
                                    variant="secondary"
                                    className={cn('mt-2', {
                                        'bg-blue-50 text-blue-800': imovel?.tipo.name === ImovelTipo.APARTAMENTO,
                                        'bg-yellow-50 text-yellow-800': imovel?.tipo.name === ImovelTipo.TERRENO,
                                        'bg-green-50 text-green-800': imovel?.tipo.name === ImovelTipo.CASA
                                    })}
                                >
                                    {imovel?.tipo.name}
                                </Badge>
                            </CardHeader>
                            <CardContent>
                                <p className="line-clamp-2 flex gap-1 text-sm text-muted-foreground">
                                    {getEnderecoFormatado(imovel?.endereco)}
                                </p>
                                <span className="text-lg font-bold">
                                    Aluguel R$ {imovel?.valorAluguel?.toLocaleString('pt-BR')}
                                </span>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <div className='grid grid-cols-2 gap-10'>
                                    {onSelectImovel && (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => {
                                                onSelectImovel(imovel);
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
                    )
                    )
                    )
                }
            </div>

            {/* Pagination */}
            <Pagination>
                <PaginationContent>
                    {/* Previous & Next Buttons */}
                    <PaginationItem>
                        <PaginationPrevious onClick={() => handlePageChange(page - 1)} />
                    </PaginationItem>
                    {generatePaginationLinks(page, !totalPages ? 1 : totalPages, (limit === 1 ? limit : isBigScreen ? 10 : isPortrait ? 10 : isTablet ? 5 : 1), handlePageChange)}
                    <PaginationItem>
                        <PaginationNext onClick={() => handlePageChange(page + 1)} />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        </div>
    )
}
