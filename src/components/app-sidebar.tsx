'use client'

import { Banknote, Building, Building2, CircleDollarSign, Cog, House, KeyRound, Lock, LogOut, ReceiptText, Shapes, Users } from 'lucide-react'
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
      title: 'Clientes',
      url: ROUTE.CLIENTES,
      icon: Users
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
    {
      title: 'Lancamentos Imóveis',
      url: ROUTE.LANCAMENTOS_IMOVEIS,
      icon: Banknote
    },
    {
      title: 'Lancamentos Locações',
      url: ROUTE.LANCAMENTOS,
      icon: Banknote
    },
    {
      title: 'Lancamentos Condomínios',
      url: ROUTE.LANCAMENTOS_CONDOMINIOS,
      icon: Banknote
    },
    {
      title: 'Boletos',
      url: ROUTE.PAGAMENTOS,
      icon: CircleDollarSign
    },
    {
      title: 'Relatório de Repasse',
      url: ROUTE.REPASSES,
      icon: ReceiptText
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
      if ((item.url === ROUTE.COLABORADORES || item.url === ROUTE.EMPRESA) && isAdmin) {
        return true
      }
      if (user?.permissions.includes('ALL')) {
        return true
      }
      if (item.url === ROUTE.IMOVEIS && user?.permissions.includes('VIEW_IMOVELS')) {
        return true
      }
      if (item.url === ROUTE.LOCACOES && user?.permissions.includes('VIEW_LOCACOES')) {
        return true
      }
      if (item.url === ROUTE.LANCAMENTOS && user?.permissions.includes('VIEW_LANCAMENTOS')) {
        return true
      }
      if ((item.url === ROUTE.PAGAMENTOS || item.url === ROUTE.REPASSES) && user?.permissions.includes('VIEW_PAGAMENTOS')) {
        return true
      }
      if (item.url === ROUTE.PROPRIETARIOS && user?.permissions.includes('VIEW_PROPRIETARIOS')) {
        return true
      }
      if (item.url === ROUTE.LOCATARIOS && user?.permissions.includes('VIEW_LOCATARIOS')) {
        return true
      }
      if (item.url === ROUTE.CLIENTES && user?.permissions.includes('VIEW_PESSOAS')) {
        return true
      }
      if (item.url === ROUTE.TIPOIMOVEL && user?.permissions.includes('VIEW_TIPOS')) {
        return true
      }
      if (item.url === ROUTE.LANCAMENTOS_CONDOMINIOS && user?.permissions.includes('VIEW_LANCAMENTOS_CONDOMINIOS')) {
        return true
      }
      if (item.url === ROUTE.LANCAMENTOS_IMOVEIS && user?.permissions.includes('VIEW_LANCAMENTOS_IMOVEIS')) {
        return true
      }
      return false
    })
  }, [user])


  return (
    <Sidebar className="border-r bg-white font-[Poppins-Regular]" variant="inset" {...props}>
      <SidebarHeader>        
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className='my-5 flex justify-center'>
              <Link to={ROUTE.HOME} className='h-auto'>
                <div className="flex justify-center rounded-lg">
                  <img
                    src={(glb_params.logo_url ? glb_params.logo_url : '')}
                    className="rounded-md object-contain h-26"
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
          className="flex h-7 min-w-0 -translate-x-px items-center gap-4 overflow-hidden rounded-md px-2 text-sidebar-foreground outline-none ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground font-[Poppins-Regular]"
          onClick={logout}
        >
          <LogOut />
          Log out
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
