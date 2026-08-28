'use client'

import { Boxes, Building, Building2, CircleDollarSign, Cog, HandCoins, House, KeyRound, Landmark, Lock, LogOut, Notebook, NotebookPen, OctagonAlert, ReceiptText, Shapes, Users, Wallet } from 'lucide-react'
import * as React from 'react'
//import logo  from '../assets/logo-molina.png';

import { NavMain } from '@/components/nav-main'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar'
import { ROUTE } from '@/enums/routes.enum'
import { useAuth } from '@/hooks/auth/use-auth'
import { Link } from 'react-router-dom'
import { useGlobalParams } from '@/globals/GlobalParams';

const data = {
  navMain: [
    {
      title: 'Configurações',
      url: ROUTE.EMPRESA + "/0",
      icon: Cog
    },
    {
      title: 'Cadastros',
      url: '',
      icon: Notebook,
      items: [
        {
          title: 'Alertas',
          url: ROUTE.ALERTAS,
          icon: OctagonAlert
        },
        {
          title: 'Conta Corrente',
          url: ROUTE.CONTA_CORRENTE,
          icon: Landmark
        },
        {
          title: 'Clientes',
          url: ROUTE.CLIENTES,
          icon: Users
        },
        {
          title: 'Grupo Fluxo de Caixa',
          url: ROUTE.GRUPO_FLUXO_CAIXA,
          icon: Boxes,
        },
        {
          title: 'Tipo de Lançamento',
          url: ROUTE.TIPOLANCAMENTO,
          icon: Shapes
        },
        {
          title: 'Tipo de Imóvel',
          url: ROUTE.TIPOIMOVEL,
          icon: Shapes
        },
        {
          title: 'Condomínios',
          url: ROUTE.CONDOMINIOS,
          icon: Building2
        },
        {
          title: 'Blocos',
          url: ROUTE.BLOCOS,
          icon: Building
        },
        {
          title: 'Imoveis',
          url: ROUTE.IMOVEIS,
          icon: House
        },
        {
          title: 'Locações',
          url: ROUTE.LOCACOES,
          icon: KeyRound
        },
      ]
    },
    {
      title: 'Lancamentos',
      url: '',
      icon: NotebookPen,
      items: [
        {
          title: 'Imóveis',
          url: ROUTE.LANCAMENTOS_IMOVEIS,
          icon: House
        },
        {
          title: 'Locações',
          url: ROUTE.LANCAMENTOS,
          icon: KeyRound
        },
        {
          title: 'Condomínios',
          url: ROUTE.LANCAMENTOS_CONDOMINIOS,
          icon: Building2
        },

      ]

    },
    {
      title: 'Cobrança',
      url: '',
      icon: Wallet,
      items: [
        {
          title: 'Previsões',
          url: ROUTE.PAGAMENTOS,
          icon: HandCoins
        },
        {
          title: 'Boletos Bancários',
          url: ROUTE.BOLETO_BANCARIO,
          icon: CircleDollarSign
        },
      ]
    },
    {
      title: 'Relatórios',
      url: '',
      icon: ReceiptText,
      items: [
        {
          title: 'Repasses',
          url: ROUTE.REPASSES,
          icon: ReceiptText
        },
        {
          title: 'Fluxo de Caixa',
          url: ROUTE.REPASSES,
          icon: ReceiptText
        },
      ]
    },
    /*{
      title: 'Proprietários',
      url: ROUTE.PROPRIETARIOS,
      icon: User
    },
    {
      title: 'Locatários',
      url: ROUTE.LOCATARIOS,
      icon: Users
    },*/
    {
      title: 'Permissões/Colaboradores',
      url: ROUTE.COLABORADORES,
      icon: Lock
    },
  ]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  //const { user, logout, isAdmin } = useAuth()
  const { user, logout } = useAuth()
  const glb_params = useGlobalParams();

  const navMainData = React.useMemo(() => {
    return data.navMain.filter((item) => {
      const isAdmin = user?.role === 'ADMIN';

      console.log('item : ', item);

      if ((item.url === ROUTE.COLABORADORES || item.url === ROUTE.EMPRESA) && isAdmin) {
        console.log('colaborador/empresa');
        return true
      }
      if (user?.permissions.includes('ALL')) {
        console.log('todos');
        return true
      }
      if (item.url === ROUTE.IMOVEIS && user?.permissions.includes('VIEW_IMOVELS')) {
        console.log('imoveis');
        return true
      }
      if (item.url === ROUTE.LOCACOES && user?.permissions.includes('VIEW_LOCACOES')) {
        console.log('locações');
        return true
      }
      if (item.url === ROUTE.LANCAMENTOS && user?.permissions.includes('VIEW_LOCACAO_LANCAMENTOS')) {
        console.log('lancamentos');
        return true
      }
      if ((item.url === ROUTE.PAGAMENTOS || item.url === ROUTE.REPASSES) && user?.permissions.includes('VIEW_PAGAMENTOS')) {
        console.log('pagamentos');
        return true
      }
      if (item.url === ROUTE.PROPRIETARIOS && user?.permissions.includes('VIEW_PROPRIETARIOS')) {
        console.log('proprietarios');
        return true
      }
      if (item.url === ROUTE.LOCATARIOS && user?.permissions.includes('VIEW_LOCATARIOS')) {
        console.log('locatarios');
        return true
      }
      if (item.url === ROUTE.CLIENTES && user?.permissions.includes('VIEW_PESSOAS')) {
        console.log('clientes');
        return true
      }
      if (item.url === ROUTE.TIPOIMOVEL && user?.permissions.includes('VIEW_TIPOS')) {
        console.log('tipos imovel');
        return true
      }
      if (item.url === ROUTE.LANCAMENTOS_CONDOMINIOS && user?.permissions.includes('VIEW_CONDOMINIO_LANCAMENTOS')) {
        console.log('lancamentos condominios');
        return true
      }
      if (item.url === ROUTE.LANCAMENTOS_IMOVEIS && user?.permissions.includes('VIEW_LANCAMENTOS_IMOVEIS')) {
        console.log('lancamentos imóveis');
        return true
      }
      if (item.url === ROUTE.CONTA_CORRENTE && user?.permissions.includes('VIEW_CONTAS_CORRENTE')) {
        console.log('conta');
        return true
      }

      //Verifica se tem submenus
      if (item.items && item.items.length > 0) {
        const hasVisibleSubItems = item.items.some((subItem) => {        
          if ((subItem.url === ROUTE.COLABORADORES || subItem.url === ROUTE.EMPRESA) && isAdmin) {
            console.log('colaborador/empresa');
            return true
          }
          if (user?.permissions.includes('ALL')) {
            console.log('todos');
            return true
          }
          if (subItem.url === ROUTE.IMOVEIS && user?.permissions.includes('VIEW_IMOVELS')) {
            console.log('imoveis');
            return true
          }
          if (subItem.url === ROUTE.LOCACOES && user?.permissions.includes('VIEW_LOCACOES')) {
            console.log('locações');
            return true
          }
          if (subItem.url === ROUTE.LANCAMENTOS && user?.permissions.includes('VIEW_LOCACAO_LANCAMENTOS')) {
            console.log('lancamentos');
            return true
          }
          if ((subItem.url === ROUTE.PAGAMENTOS || subItem.url === ROUTE.REPASSES) && user?.permissions.includes('VIEW_PAGAMENTOS')) {
            console.log('pagamentos');
            return true
          }
          if (subItem.url === ROUTE.PROPRIETARIOS && user?.permissions.includes('VIEW_PROPRIETARIOS')) {
            console.log('proprietarios');
            return true
          }
          if (subItem.url === ROUTE.LOCATARIOS && user?.permissions.includes('VIEW_LOCATARIOS')) {
            console.log('locatarios');
            return true
          }
          if (subItem.url === ROUTE.CLIENTES && user?.permissions.includes('VIEW_PESSOAS')) {
            console.log('clientes');
            return true
          }
          if (subItem.url === ROUTE.TIPOIMOVEL && user?.permissions.includes('VIEW_TIPOS')) {
            console.log('tipos imovel');
            return true
          }
          if (subItem.url === ROUTE.LANCAMENTOS_CONDOMINIOS && user?.permissions.includes('VIEW_CONDOMINIO_LANCAMENTOS')) {
            console.log('lancamentos condominios');
            return true
          }
          if (subItem.url === ROUTE.LANCAMENTOS_IMOVEIS && user?.permissions.includes('VIEW_LANCAMENTOS_IMOVEIS')) {
            console.log('lancamentos imóveis');
            return true
          }
          if (subItem.url === ROUTE.CONTA_CORRENTE && user?.permissions.includes('VIEW_CONTAS_CORRENTE')) {
            console.log('conta');
            return true
          }
        });
        return hasVisibleSubItems;
      }

      console.log('user : ', user);
      console.log('sem permissoes');
      return false
    })
  }, [user])


  return (
    <Sidebar className="border-r bg-white font-[Poppins-Regular]" variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className='flex justify-center'>
              <Link to={ROUTE.HOME} className='h-auto'>
                <div className="flex justify-center rounded-lg">
                  <img
                    src={(glb_params.logo_url ? glb_params.logo_url : '')}
                    className="rounded-md object-contain h-20"
                  />
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainData} />
      </SidebarContent>
      <SidebarFooter>
        <div
          className="flex h-5 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground outline-none ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground font-[Poppins-Regular]"
          onClick={logout}
        >
          <LogOut size='sm' />
          Log out
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
