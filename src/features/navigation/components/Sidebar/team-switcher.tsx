import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";

/**
 * Topo do menu: logo por extenso; recolhido o menu, so o simbolo "S". Claro e
 * negativo trocam por tema so com CSS.
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
          <img src="/brand/service-logo.png" alt="Aupus Service" className="ml-1 h-6 w-auto dark:hidden group-data-[collapsible=icon]:hidden" />
          <img src="/brand/service-logo-negativo.png" alt="Aupus Service" className="ml-1 hidden h-6 w-auto dark:block group-data-[collapsible=icon]:!hidden" />
          <img src="/brand/service-simbolo.png" alt="Aupus Service" className="mx-auto hidden h-7 w-auto group-data-[collapsible=icon]:block dark:group-data-[collapsible=icon]:hidden" />
          <img src="/brand/service-simbolo-negativo.png" alt="Aupus Service" className="mx-auto hidden h-7 w-auto dark:group-data-[collapsible=icon]:block" />
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
