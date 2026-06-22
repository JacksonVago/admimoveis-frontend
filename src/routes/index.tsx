import { AppSidebar } from '@/components/app-sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { ROUTE } from '@/enums/routes.enum'
import { useAuth } from '@/hooks/auth/use-auth'
import { Permission } from '@/interfaces/user'
import { Login } from '@/pages/auth/login'
import { ListarColaboradores } from '@/pages/main/colaboradores'
import { CriarImovel } from '@/pages/main/imoveis/criarImovel'
import { DetalhesImovel } from '@/pages/main/imoveis/detalhes'
import ListarImoveis from '@/pages/main/imoveis/listarImoveis'
import ListarLocatarios from '@/pages/main/locatarios'
import { CriarLocatario } from '@/pages/main/locatarios/criar'
import DetalhesLocatario from '@/pages/main/locatarios/detalhes'
import ListarProprietarios from '@/pages/main/proprietarios'
import { CriarProprietario } from '@/pages/main/proprietarios/criar'
import DetalhesProprietario from '@/pages/main/proprietarios/detalhes'
import { Outlet, Route, useNavigate } from 'react-router-dom'
import SlideRoutes from 'react-slide-routes';
import { AuthenticatedRoutesGuard } from './guards/authenticated-routes-guard'
import { UnauthenticatedRoutesGuard } from './guards/unauthenticated-routes-guard'
import DetalhesCliente from '@/pages/main/clientes/detalhes'
import { CriarCliente } from '@/pages/main/clientes/criar'
import ListarClientes from '@/pages/main/clientes'
import { Label } from '@radix-ui/react-label'
import { useEffect, useState } from 'react'
import { useGlobalParams } from '@/globals/GlobalParams'
import ListarLocacoes from '@/pages/main/locacoes'
import DetalhesLocacao from '@/pages/main/locacoes/detalhes'
import CriarLocacao from '@/pages/main/locacoes/criar'
import ListarTipos from '@/pages/main/tipoImovel'
import DetalhesEmpresa from '@/pages/main/empresas/detalhes'
import ListarLancamentos from '@/pages/main/lancamentos'
import ListarTiposLancamento from '@/pages/main/tipolancamento'
import { DetalhesLancamento } from '@/pages/main/lancamentos/detalhes'
import { DetalhesBoleto } from '@/pages/main/boletos/detalhes'
import ListarBoletos from '@/pages/main/boletos'
import ListarRepasses from '@/pages/main/relatoriorepasse'
import { Adesao } from '@/pages/main/adesao'
import { Planos } from '@/pages/main/adesao/planos'
import { PlanoTipo } from '@/pages/main/adesao/planos/tipoplano'
import { MeioPagamento } from '@/pages/main/adesao/planos/meiopagamento'
import { CriarCondominio } from '@/pages/main/condominios/criarcondominio'
import ListarCondominios from '@/pages/main/condominios/listarcondominios'
import { DetalhesCondominio } from '@/pages/main/condominios/detalhes'
import { CriarBloco } from '@/pages/main/blocos/criarbloco'
import { DetalhesBloco } from '@/pages/main/blocos/detalhes'
import ListarBlocos from '@/pages/main/blocos/listarblocos'
import ListarLancamentosCondominios from '@/pages/main/lancamentoscondominio'
import { DetalhesLancamentoCondominio } from '@/pages/main/lancamentoscondominio/detalhes'
import { CircleArrowLeft } from 'lucide-react'
import { Home } from '@/pages/main/home'
import ListarLancamentosImoveis from '@/pages/main/lancamentosimoveis'
import { DetalhesLancamentoImovel } from '@/pages/main/lancamentosimoveis/detalhes'
import { CriarAlerta } from '@/pages/main/alertas/criaralerta'
import { DetalhesAlerta } from '@/pages/main/alertas/detalhes'
import ListarAlertas from '@/pages/main/alertas/listaralertas'
import { CriarContaCorrente } from '@/pages/main/contascorrente/criarcontacorrente'
import { DetalhesContaCorrente } from '@/pages/main/contascorrente/detalhes'
import ListarContasCorrentes from '@/pages/main/contascorrente/listarcontascorrente'

export interface ProtectedRouteProps {
  permission: Permission
  children: React.ReactNode
}

export const MainLayout = () => {
  const glb_params = useGlobalParams();
  const [nameUser, setNameUser] = useState(false);
  const navigate = useNavigate();

  const { firstName } = useAuth()

  useEffect(() => { }, [glb_params]);

  const handlerBackNav = () => {
    glb_params.updPastaOrig("");
    navigate(`${glb_params.origin_url}`);
  }

  console.log('pastaOrig:', glb_params.pastaOrig);
  return (

    <SidebarProvider className='font-[Poppins-Regular]'>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 bg-gray-100">
          <SidebarTrigger className="ml-5 hover:cursor-pointer" />
          <div className="flex w-full items-center justify-between gap-2 px-8">                        
            {glb_params.pastaOrig !== "" ? 
              <CircleArrowLeft
                className='hover:cursor-pointer hover:text-gray-500'
                onClick={handlerBackNav}
              ></CircleArrowLeft>

              : <div></div>
            }
            <Label>{glb_params.title_form}</Label>
            <Avatar className={nameUser ? 'w-1/3' : 'w-10'}>
              <AvatarImage src="http://localhost:3000/assets/images/avatar.jpg" />
              <AvatarFallback className="bg-gray-200 hover:cursor-pointer hover:bg-gray-300" onClick={() => { setNameUser(!nameUser) }}>
                {nameUser ? firstName : firstName?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>
        <div className="flex flex-1 flex-col pt-0">
          <div className="grid auto-rows-min gap-4 md:grid-cols-3"></div>
          <div className="min-h-[100vh] flex-1 bg-muted md:min-h-min">
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
export const ProtectedRoute = ({ children, permission }: ProtectedRouteProps) => {
  const { user } = useAuth()
  const userPermissions = user?.permissions || []

  // Check if user has permission to access
  const canAccess =
    permission && (userPermissions.includes('ALL') || userPermissions.includes(permission))

  if (canAccess) {
    return <>{children}</>
  }

  return <div>Unauthorized</div>
}

export const RoutesComponent = () => {
  const { user } = useAuth()
  const glb_params = useGlobalParams();

  useEffect(() => { }, [glb_params]);

  return (
    <SlideRoutes>
      {/*Bem vindo */}
      <Route path={ROUTE.BEMVINDO} element={<Adesao />} />
      <Route path={ROUTE.PLANOS} element={<Planos />} />
      <Route path={ROUTE.PLANO_TIPO} element={<PlanoTipo />} />
      <Route path={ROUTE.PLANO_PAGAMENTO} element={<MeioPagamento />} />

      <Route element={<UnauthenticatedRoutesGuard />}>
        <Route path={ROUTE.LOGIN} element={<Login />} />
      </Route>
      <Route element={<AuthenticatedRoutesGuard />}>
        <Route element={<MainLayout />}>
          <Route
            path={ROUTE.COLABORADORES}
            element={user?.role === 'ADMIN' ? <ListarColaboradores /> : <UnauthorizedPage />}
          />

          <Route path={ROUTE.HOME} element={<Home/>} />

          {/* Empresas */}
          <Route
            path={ROUTE.EMPRESA_DETALHES}
            element={
              <ProtectedRoute permission="VIEW_EMPRESAS">
                <DetalhesEmpresa />
              </ProtectedRoute>
            }
          />

          {/* Alertas */}
          <Route
            path={ROUTE.ALERTAS_CRIAR}
            element={
              <ProtectedRoute permission="CREATE_ALERTA">
                <CriarAlerta />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTE.ALERTAS_DETALHES}
            element={
              <ProtectedRoute permission="VIEW_ALERTAS">
                <DetalhesAlerta />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTE.ALERTAS}
            element={
              <ProtectedRoute permission="VIEW_ALERTAS">
                <ListarAlertas limitView={3} exclude='' onSelectAlerta={undefined} />
              </ProtectedRoute>
            }
          />

          {/* Contas corrente */}
          <Route
            path={ROUTE.CONTA_CORRENTE_CRIAR}
            element={
              <ProtectedRoute permission="CREATE_CONTA_CORRENTE">
                <CriarContaCorrente />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTE.CONTA_CORRENTE_DETALHES}
            element={
              <ProtectedRoute permission="VIEW_CONTAS_CORRENTE">
                <DetalhesContaCorrente />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTE.CONTA_CORRENTE}
            element={
              <ProtectedRoute permission="VIEW_CONTAS_CORRENTE">
                <ListarContasCorrentes limitView={3} exclude='' onSelectContaCorrente={undefined} />
              </ProtectedRoute>
            }
          />

          {/* Tipo de Lançamentos */}
          <Route
            path={ROUTE.TIPOLANCAMENTO}
            element={
              <ProtectedRoute permission="VIEW_TIPOS_LANC">
                <ListarTiposLancamento />
              </ProtectedRoute>
            }
          />

          {/* Tipo de Imóveis */}
          <Route
            path={ROUTE.TIPOIMOVEL}
            element={
              <ProtectedRoute permission="VIEW_TIPOS">
                <ListarTipos />
              </ProtectedRoute>
            }
          />


          {/* Condomínios */}
          <Route
            path={ROUTE.CONDOMINIOS_CRIAR}
            element={
              <ProtectedRoute permission="CREATE_CONDOMINIO">
                <CriarCondominio />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTE.CONDOMINIOS_DETALHES}
            element={
              <ProtectedRoute permission="VIEW_CONDOMINIOS">
                <DetalhesCondominio />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTE.CONDOMINIOS}
            element={
              <ProtectedRoute permission="VIEW_CONDOMINIOS">
                <ListarCondominios limitView={3} exclude='' onSelectCondominio={undefined} />
              </ProtectedRoute>
            }
          />

          {/* Blocos */}
          <Route
            path={ROUTE.BLOCOS_CRIAR}
            element={
              <ProtectedRoute permission="CREATE_BLOCO">
                <CriarBloco />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTE.BLOCOS_DETALHES}
            element={
              <ProtectedRoute permission="VIEW_BLOCOS">
                <DetalhesBloco />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTE.BLOCOS}
            element={
              <ProtectedRoute permission="VIEW_BLOCOS">
                <ListarBlocos limitView={3} exclude='' onSelectBloco={undefined} />
              </ProtectedRoute>
            }
          />

          {/* Imóveis */}
          <Route
            path={ROUTE.IMOVEIS_CRIAR}
            element={
              <ProtectedRoute permission="CREATE_IMOVEL">
                <CriarImovel />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTE.IMOVEIS_DETALHES}
            element={
              <ProtectedRoute permission="VIEW_IMOVELS">
                <DetalhesImovel />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTE.IMOVEIS}
            element={
              <ProtectedRoute permission="VIEW_IMOVELS">
                <ListarImoveis limitView={3} exclude='' onSelectImovel={undefined} />
              </ProtectedRoute>
            }
          />

          {/* Locações */}
          <Route
            path={ROUTE.LOCACOES}
            element={
              <ProtectedRoute permission="VIEW_LOCACOES">
                <ListarLocacoes exclude='' limitView={3} txtVinc='' onSelectLocacao={undefined} />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTE.LOCACOES_CRIAR}
            element={
              <ProtectedRoute permission="CREATE_LOCACAO">
                <CriarLocacao />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTE.LOCACOES_DETALHES}
            element={
              <ProtectedRoute permission="VIEW_LOCACOES">
                <DetalhesLocacao />
              </ProtectedRoute>
            }
          />

          {/* Lançamentos Imóveis */}
          <Route
            path={ROUTE.LANCAMENTOS_IMOVEIS}
            element={
              <ProtectedRoute permission="VIEW_LANCAMENTOS_IMOVEIS">
                <ListarLancamentosImoveis exclude='' limitView={3} onSelectLancamento={undefined} />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTE.LANCAMENTOS_IMOVEIS_DETALHES}
            element={
              <ProtectedRoute permission="VIEW_LANCAMENTOS_IMOVEIS">
                <DetalhesLancamentoImovel />
              </ProtectedRoute>
            }
          />

          {/* Lançamentos Condomínios */}
          <Route
            path={ROUTE.LANCAMENTOS_CONDOMINIOS}
            element={
              <ProtectedRoute permission="VIEW_CONDOMINIO_LANCAMENTOS">
                <ListarLancamentosCondominios exclude='' limitView={3} onSelectLancamento={undefined} />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTE.LANCAMENTOS_CONDOMINIOS_DETALHES}
            element={
              <ProtectedRoute permission="UPDATE_CONDOMINIO_LANCAMENTO">
                <DetalhesLancamentoCondominio />
              </ProtectedRoute>
            }
          />

          {/* Lançamentos */}
          <Route
            path={ROUTE.LANCAMENTOS}
            element={
              <ProtectedRoute permission="VIEW_LOCACAO_LANCAMENTOS">
                <ListarLancamentos exclude='' limitView={3} onSelectLancamento={undefined} />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTE.LANCAMENTOS_DETALHES}
            element={
              <ProtectedRoute permission="UPDATE_LOCACAO_LANCAMENTO">
                <DetalhesLancamento />
              </ProtectedRoute>
            }
          />

          {/* Pagamentos */}
          <Route
            path={ROUTE.PAGAMENTOS}
            element={
              <ProtectedRoute permission="VIEW_PAGAMENTOS">
                <ListarBoletos exclude='' limitView={3} />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTE.PAGAMENTOS_DETALHES}
            element={
              <ProtectedRoute permission="VIEW_PAGAMENTOS">
                <DetalhesBoleto />
              </ProtectedRoute>
            }
          />

          {/* Repasses */}
          <Route
            path={ROUTE.REPASSES}
            element={
              <ProtectedRoute permission="VIEW_PAGAMENTOS">
                <ListarRepasses exclude='' limitView={3} />
              </ProtectedRoute>
            }
          />

          {/* propriterios */}
          <Route
            path={ROUTE.PROPRIETARIOS}
            element={
              <ProtectedRoute permission="VIEW_PROPRIETARIOS">
                <ListarProprietarios />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTE.PROPRIETARIOS_CRIAR}
            element={
              <ProtectedRoute permission="CREATE_PROPRIETARIO">
                <CriarProprietario />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTE.PROPRIETARIOS_DETALHES}
            element={
              <ProtectedRoute permission="VIEW_PROPRIETARIOS">
                <DetalhesProprietario />
              </ProtectedRoute>
            }
          />

          {/* locatarios */}
          <Route
            path={ROUTE.LOCATARIOS}
            element={
              <ProtectedRoute permission="VIEW_LOCATARIOS">
                <ListarLocatarios onSelectLocatario={() => { }} />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTE.LOCATARIOS_DETALHES}
            element={
              <ProtectedRoute permission="VIEW_LOCATARIOS">
                <DetalhesLocatario defaultId={{ id: "" }} />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTE.LOCATARIOS_CRIAR}
            element={
              <ProtectedRoute permission="CREATE_LOCATARIO">
                <CriarLocatario />
              </ProtectedRoute>
            }
          />

          {/* clientes */}
          <Route
            path={ROUTE.CLIENTES}
            element={
              <ProtectedRoute permission="VIEW_PESSOAS">
                <ListarClientes exclude='' limitView={3} txtVinc='' onSelectCliente={undefined} />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTE.CLIENTES_DETALHES}
            element={
              <ProtectedRoute permission="VIEW_PESSOAS">
                <DetalhesCliente />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTE.CLIENTES_CRIAR}
            element={
              <ProtectedRoute permission="CREATE_PESSOA">
                <CriarCliente />
              </ProtectedRoute>
            }
          />

          {/* <Route path={ROUTE.IMOVEIS_DETALHES} element={<DetalhesImovel />} />
          <Route path={ROUTE.IMOVEIS_CRIAR} element={<CriarImovel />} />
          <Route path={ROUTE.PROPRIETARIOS} element={<ListarProprietarios />} />
          <Route path={ROUTE.PROPRIETARIOS_CRIAR} element={<CriarProprietario />} />
          <Route path={ROUTE.PROPRIETARIOS_DETALHES} element={<DetalhesProprietario />} />
          <Route path={ROUTE.LOCATARIOS} element={<ListarLocatarios />} />
          <Route path={ROUTE.LOCATARIOS_DETALHES} element={<DetalhesLocatario />} /> */}
        </Route>
      </Route>
      <Route path={ROUTE.UNAUTHORIZED} element={<UnauthorizedPage />} />
      <Route path="*" element={<div>404</div>} />
    </SlideRoutes>
  )
}
export const UnauthorizedPage = () => {
  return (
    <div>
      <h1>Unauthorized</h1>
    </div>
  )
}
export const GerenciarColaboradores = () => {
  return (
    <div>
      <h1>Gerenciar Colaboradores</h1>
    </div>
  )
}
