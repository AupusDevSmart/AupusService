import * as React from "react";
import { NavMain } from "@/features/navigation/components/Sidebar/nav-main";
import { NavUser } from "@/features/navigation/components/Sidebar/nav-user";
import { TeamSwitcher } from "@/features/navigation/components/Sidebar/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { FeedbackButton } from "./feedback-button";
import { LunaButton } from "./luna-button";
import { LunaPedidosPainel } from "@/features/luna-pedidos/luna-pedidos-painel";
import { LunaVigia } from "@/features/luna-pedidos/luna-vigia";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <>
    <Sidebar collapsible="icon" {...props} variant="sidebar">
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
      </SidebarContent>
      <SidebarFooter>
        <div className="flex flex-col gap-4">
          {/* SERV-8: pedido ao Luna (kanban da equipe), para a equipe interna. */}
          <LunaButton />
          <FeedbackButton />
          <NavUser />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
    {/* SERV-8: fora do Sidebar, que no celular é uma gaveta desmontada ao fechar. */}
    <LunaPedidosPainel />
    <LunaVigia />
    </>
  );
}