import {
  LogOut,
  Sun,
  Moon,
  Laptop2,
  UserCog
} from "lucide-react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useUserStore } from "@/store/useUserStore"
import { getInitials } from "@/lib/getInitials"
import { getAvatarUrl } from "@/lib/getAvatarUrl"
import { useTheme } from "@/components/theme-provider"
import { useLocation, useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { COR_ATIVA } from "@/features/navigation/utils/menu-ativo"
import clsx from "clsx" // Para manipulação condicional de classes

export function NavUser() {
  const { isMobile } = useSidebar()
  const { user, clearUser } = useUserStore()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  // O perfil nao tem item no menu: quem marca a pagina e o proprio rodape.
  const noPerfil = pathname.startsWith("/configuracoes/")

  const logout = () => {
    clearUser();
    navigate('/login');
  }

  const editProfile = () => {
    navigate('/configuracoes/perfil');
  }

  const avatarUrl = getAvatarUrl(user?.avatar_url);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className={cn(
                "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
                noPerfil && cn(COR_ATIVA, "data-[state=open]:bg-service-verde/15 dark:data-[state=open]:bg-service-verde/25"),
              )}
            >
              <Avatar className="h-8 w-8 rounded-lg group-data-[collapsible=icon]:size-11 group-data-[collapsible=icon]:rounded-xl">
                {avatarUrl && (
                  <AvatarImage
                    src={avatarUrl}
                    alt={user?.nome || 'Usuário'}
                    className="object-contain"
                    onError={(e) => {
                      console.error('❌ [NAV-USER] Erro ao carregar imagem:', avatarUrl);
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                <AvatarFallback className="rounded-[inherit] bg-service-azul text-xs font-semibold text-white">
                  {getInitials(user?.nome || 'Usuário')}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold">{user?.nome || 'Usuário'}</span>
                <span className="truncate text-xs text-muted-foreground">{user?.email || ''}</span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg shadow-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-10 w-10 rounded-lg">
                  {avatarUrl && (
                    <AvatarImage
                      src={avatarUrl}
                      alt={user?.nome || 'Usuário'}
                      className="object-contain"
                      onError={(e) => {
                        console.error('❌ [NAV-USER] Erro ao carregar imagem:', avatarUrl);
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <AvatarFallback className="rounded-[inherit] bg-service-azul text-xs font-semibold text-white">
                    {getInitials(user?.nome || 'Usuário')}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user?.nome || 'Usuário'}</span>
                  <span className="truncate text-xs text-muted-foreground">{user?.email || ''}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {/* Botão de Editar Perfil */}
            <DropdownMenuItem onClick={editProfile} className="cursor-pointer">
              <UserCog className="mr-2 h-4 w-4" />
              Editar Perfil
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            {/* Seção de Preferências */}
            <DropdownMenuLabel className="text-xs text-muted-foreground px-2">Preferências</DropdownMenuLabel>
            <div className="flex flex-col px-2 gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">Tema</span>
                <div className="flex items-center gap-1 ml-auto">
                  <button 
                    onClick={() => setTheme("system")}
                    className={clsx("p-2 rounded-md flex items-center border", {
                      "bg-accent text-accent-foreground border-transparent": theme === "system",
                      "text-muted-foreground border-border hover:text-foreground": theme !== "system"
                    })}
                  >
                    <Laptop2 className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => setTheme("light")}
                    className={clsx("p-2 rounded-md flex items-center border", {
                      "bg-accent text-accent-foreground border-transparent": theme === "light",
                      "text-muted-foreground border-border hover:text-foreground": theme !== "light"
                    })}
                  >
                    <Sun className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => setTheme("dark")}
                    className={clsx("p-2 rounded-md flex items-center border", {
                      "bg-accent text-accent-foreground border-transparent": theme === "dark",
                      "text-muted-foreground border-border hover:text-foreground": theme !== "dark"
                    })}
                  >
                    <Moon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}