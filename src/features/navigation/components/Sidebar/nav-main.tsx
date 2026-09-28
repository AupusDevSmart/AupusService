"use client"

import { useEffect, useState } from "react"
import { ChevronRight } from "lucide-react"
import { useNavigate, useLocation } from "react-router-dom"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { useFilteredNavigationLinks } from "@/features/navigation/utils/useFilteredNavigationLinks"
import type { NavigationLink } from "@/features/navigation/utils/navigation-links"
import { acharAtivo, contemAtivo, COR_ATIVA, COR_INATIVA } from "@/features/navigation/utils/menu-ativo"
import { usePainelFlutuante } from "@/features/navigation/hooks/usePainelFlutuante"
import { PainelFlutuante } from "./painel-flutuante"

/**
 * `data-[state=open]:hover:` vem do botao base e pesa mais que o `hover:` da
 * cor ativa: sem repetir aqui, o grupo aberto e ativo perdia o verde no hover.
 */
const COR_ATIVA_GRUPO_ABERTO =
  "data-[state=open]:hover:bg-service-verde/20 data-[state=open]:hover:text-service-link-claro " +
  "dark:data-[state=open]:hover:bg-service-verde/35 dark:data-[state=open]:hover:text-service-verde"

function classesBotao(ativo: boolean, recolhido: boolean) {
  return cn(
    "relative h-10 px-3 rounded-lg select-none flex items-center gap-3 transition-colors duration-200",
    recolhido && "justify-center gap-0 rounded-xl",
    ativo ? cn(COR_ATIVA, COR_ATIVA_GRUPO_ABERTO, "font-semibold") : COR_INATIVA,
  )
}

function classesIcone(recolhido: boolean) {
  return cn("shrink-0", recolhido ? "!size-[22px]" : "!size-5")
}

/** Barra verde na borda do menu, alinhada ao botao do item ativo. */
function MarcadorAtivo({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "absolute -left-2 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-service-verde",
        className,
      )}
    />
  )
}

function useMenuRecolhido() {
  const { state, isMobile } = useSidebar()
  return state === "collapsed" && !isMobile
}

function useNavegarPeloMenu() {
  const navigate = useNavigate()
  const { isMobile, setOpenMobile } = useSidebar()
  return (path: string) => {
    navigate(path)
    if (isMobile) setOpenMobile(false)
  }
}

function ItemMenu({ item, ativo }: { item: NavigationLink; ativo: boolean }) {
  const recolhido = useMenuRecolhido()
  const navegar = useNavegarPeloMenu()

  return (
    <SidebarMenuItem className="my-1">
      {ativo && <MarcadorAtivo />}
      <SidebarMenuButton
        tooltip={item.label}
        onClick={() => navegar(item.path)}
        className={classesBotao(ativo, recolhido)}
      >
        <item.icon className={classesIcone(recolhido)} />
        {!recolhido && <span className="text-sm flex-1">{item.label}</span>}
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function GrupoMenu({ item, ativoKey }: { item: NavigationLink; ativoKey: string | null }) {
  const recolhido = useMenuRecolhido()
  const navegar = useNavegarPeloMenu()
  const { setOpen } = useSidebar()
  const temAtivo = contemAtivo(item, ativoKey)
  const subitens = item.links ?? []

  // Abre sozinho quando a pagina atual pertence a um subitem.
  const [aberto, setAberto] = useState(temAtivo)
  useEffect(() => {
    if (temAtivo) setAberto(true)
  }, [temAtivo])

  const painel = usePainelFlutuante(recolhido, subitens.length)

  const abrirMenu = () => {
    painel.fechar()
    setAberto(true)
    setOpen(true)
  }

  return (
    <Collapsible open={aberto} onOpenChange={setAberto} asChild className="group/collapsible">
      <SidebarMenuItem
        ref={painel.refItem}
        className="my-1"
        onMouseEnter={painel.abrir}
        onMouseLeave={painel.agendarFechar}
      >
        {/* Aberto, o item cresce com os subitens: o marcador fica preso ao
            botao (h-10, centro em 20px), nao ao meio do grupo. */}
        {temAtivo && <MarcadorAtivo className={recolhido ? undefined : "top-5"} />}
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            onClick={(event) => {
              if (!recolhido) return
              // Recolhido, o clique expande o menu com o grupo aberto. Sem o
              // preventDefault o Collapsible alternaria logo depois e fecharia
              // um grupo que ja estava aberto.
              event.preventDefault()
              abrirMenu()
            }}
            className={classesBotao(temAtivo, recolhido)}
          >
            <item.icon className={classesIcone(recolhido)} />
            {!recolhido && (
              <>
                <span className="text-sm flex-1">{item.label}</span>
                <ChevronRight className="w-4 h-4 shrink-0 opacity-60 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </>
            )}
          </SidebarMenuButton>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <SidebarMenuSub className="pl-4 mt-1">
            {subitens.map((sub) => {
              const subAtivo = sub.key === ativoKey
              return (
                <SidebarMenuSubItem key={sub.key}>
                  <SidebarMenuSubButton
                    onClick={() => navegar(sub.path)}
                    className={cn(
                      "cursor-pointer h-9 px-3 rounded-lg select-none flex items-center gap-3 transition-colors duration-200 [&>svg]:text-current",
                      subAtivo ? cn(COR_ATIVA, "font-semibold") : COR_INATIVA,
                    )}
                  >
                    <sub.icon className="w-4 h-4 shrink-0" />
                    <span className="text-sm flex-1">{sub.label}</span>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              )
            })}
          </SidebarMenuSub>
        </CollapsibleContent>

        {recolhido && painel.posicao && (
          <PainelFlutuante
            grupo={item}
            ativoKey={ativoKey}
            posicao={painel.posicao}
            onMouseEnter={painel.cancelarFechar}
            onMouseLeave={painel.agendarFechar}
            onNavegar={(path) => {
              painel.fechar()
              navegar(path)
            }}
            onAbrirMenu={abrirMenu}
          />
        )}
      </SidebarMenuItem>
    </Collapsible>
  )
}

export function NavMain() {
  const location = useLocation()
  const navigationLinks = useFilteredNavigationLinks()
  // Calculado uma vez para o menu inteiro: item e grupo so comparam a chave.
  const ativoKey = acharAtivo(navigationLinks, location.pathname)

  return (
    <SidebarGroup>
      <SidebarMenu>
        {navigationLinks.map((item) =>
          item.links?.length ? (
            <GrupoMenu key={item.key} item={item} ativoKey={ativoKey} />
          ) : (
            <ItemMenu key={item.key} item={item} ativo={item.key === ativoKey} />
          ),
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}
