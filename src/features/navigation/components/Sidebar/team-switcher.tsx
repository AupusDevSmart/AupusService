import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";

/**
 * Topo do menu: icone do app e o nome ao lado. O logo por extenso fica no
 * breadcrumb.
 *
 * Caminho ABSOLUTO no src, com a barra inicial. Sem ela o navegador resolve o
 * src relativo a rota atual (/cadastros/brand/...), o servidor devolve o
 * index.html do SPA e a imagem quebra so em algumas paginas.
 */
export function TeamSwitcher() {
  const navigate = useNavigate();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" tooltip="Aupus Service" onClick={() => navigate('/')}>
          <img
            src="/brand/service-icone.svg"
            alt=""
            aria-hidden
            className="aspect-square size-8 shrink-0 rounded-lg group-data-[collapsible=icon]:size-11 group-data-[collapsible=icon]:rounded-xl"
          />
          <div className="ml-2 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="font-semibold">Aupus Service</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
