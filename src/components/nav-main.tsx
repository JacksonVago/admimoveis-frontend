'use client'

import { ChevronRight, type LucideIcon } from 'lucide-react'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  SidebarGroup,
  //SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { Link } from 'react-router-dom'
import { useGlobalParams } from '@/globals/GlobalParams'
import { useMediaQuery } from 'react-responsive'

export function NavMain({
  items
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  //Globals
  const glb_params = useGlobalParams();
  const isMobile = useMediaQuery({ query: '(max-width: 420px)' })

  const handlerNavItemClick = (url: string) => {
    glb_params.updOrigin_url(url);
    glb_params.updPastaOrig("");
    console.log('pastaOrig:', glb_params.pastaOrig);
    console.log('origin_url:', glb_params.origin_url);
  }
  
  return (
    <SidebarGroup className='font-[Poppins-Regular]'>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible key={item.title} asChild defaultOpen={item.isActive}>
            <SidebarMenuItem onClick={useSidebar().toggleSidebar}>
              <SidebarMenuButton className={isMobile ? "py-5" : "py-3"} asChild tooltip={item.title} onClick={()=>{handlerNavItemClick(item.url)}}>
                <Link to={item.url}>
                  <item.icon />
                  <span style={{ "fontSize": isMobile ? ".80rem" : "0.80rem" }}>{item.title}</span>
                </Link>
              </SidebarMenuButton>
              {item.items?.length ? (
                <>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuAction className="data-[state=open]:rotate-90">
                      <ChevronRight />
                      <span className="sr-only">Toggle</span>
                    </SidebarMenuAction>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            <Link to={subItem.url}>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </>
              ) : null}
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
