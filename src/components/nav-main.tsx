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
import { useState } from 'react'

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
      icon: LucideIcon
      isActive?: boolean
    }[]
  }[]
}) {
  //Globals
  const glb_params = useGlobalParams();
  const isMobile = useMediaQuery({ query: '(max-width: 420px)' });
  const [activeItem, setActiveItem] = useState('');

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
            <SidebarMenuItem onClick={item.items && item.items?.length > 0 ? undefined : useSidebar().toggleSidebar}>
              <SidebarMenuButton className={isMobile ? "py-5" : "py-3"} asChild tooltip={item.title} onClick={() => { handlerNavItemClick(item.url) }}>
                <Link to={item.url}
                  onClick={() => setActiveItem(item.title)}
                  style={activeItem === item.title ? {
                    backgroundColor: "#f7941e",
                    fontWeight: "bold",
                  } : {}}
                >
                  <item.icon style={{ color: "#034869" }} />
                  <span style={{ "fontSize": isMobile ? "0.70rem" : "0.75rem", color: "#034869" }}>{item.title}</span>
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
                        <SidebarMenuSubItem key={subItem.title} onClick={useSidebar().toggleSidebar}>
                          <SidebarMenuSubButton asChild>
                            <Link to={subItem.url}
                              onClick={() => setActiveItem(subItem.title)}
                              style={activeItem === subItem.title ? {
                                backgroundColor: "#f7941e",
                                fontWeight: "bold",
                              } : {}}

                            >
                              <subItem.icon style={{ color: "#034869" }} />
                              <span style={{ "fontSize": isMobile ? "0.70rem" : "0.75rem", color: "#034869" }}>{subItem.title}</span>
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
