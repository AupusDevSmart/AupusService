import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { UsuarioDTO, Permissao, UsuarioRole } from '@/types/dtos/usuarios-dto';

type UserStoreState = {
  user: UsuarioDTO | null;
  acessivel: Permissao[];
  plantasVinculadas: string[];
  setUser: (newUser: UsuarioDTO) => void;
  updateUser: (partialUser: Partial<UsuarioDTO>) => void;
  clearUser: () => void;
  getUserRole: () => UsuarioRole | '';
  hasPermission: (...perms: Permissao[]) => boolean;
  isSuperAdmin: () => boolean;
  isAdmin: () => boolean;
};

/**
 * Nomes das permissoes, venham elas como for.
 *
 * O backend nao fala uma lingua so: `/auth/login` e `/auth/me` devolvem
 * `all_permissions` como array de STRINGS (`permissionNames`), enquanto
 * `PATCH /usuarios/:id` devolve array de OBJETOS (`{ id, name, guard_name }`).
 *
 * Guardar o array cru fazia o `hasPermission` comparar string com objeto e
 * devolver false para tudo — o usuario perdia o menu inteiro depois de salvar
 * o proprio perfil, e so voltava ao normal deslogando, porque o login grava a
 * forma certa.
 */
const nomesDePermissao = (valor: unknown): Permissao[] => {
  if (!Array.isArray(valor)) return [];
  return valor
    .map((p) => (typeof p === 'string' ? p : (p as { name?: string })?.name))
    .filter((n): n is string => typeof n === 'string' && n.length > 0) as Permissao[];
};

export const useUserStore = create(
  persist<UserStoreState>(
    (set, get) => ({
      user: null,
      acessivel: [],
      plantasVinculadas: [],

      setUser: (newUser: UsuarioDTO) =>
        set((state) => ({
          user: newUser,
          // Campo ausente NAO zera o que ja havia. Nem toda resposta que passa
          // por aqui e uma sessao: a de atualizar perfil traz o cadastro, sem
          // permissao nem plantas, e zerar deixaria o usuario preso na tela e
          // sem escopo de dados. Para revogar de fato existe o clearUser.
          acessivel:
            newUser.all_permissions === undefined
              ? state.acessivel
              : nomesDePermissao(newUser.all_permissions),
          plantasVinculadas:
            newUser.plantas_vinculadas === undefined
              ? state.plantasVinculadas
              : newUser.plantas_vinculadas,
        })),

      updateUser: (partialUser: Partial<UsuarioDTO>) =>
        set((state) => {
          if (!state.user) return { user: null, acessivel: [], plantasVinculadas: [] };
          const updatedUser = { ...state.user, ...partialUser };
          const acessivel =
            partialUser.all_permissions !== undefined
              ? nomesDePermissao(partialUser.all_permissions)
              : state.acessivel;
          const plantasVinculadas =
            partialUser.plantas_vinculadas !== undefined
              ? partialUser.plantas_vinculadas
              : state.plantasVinculadas;
          return { user: updatedUser, acessivel, plantasVinculadas };
        }),

      clearUser: () => set({ user: null, acessivel: [], plantasVinculadas: [] }),

      getUserRole: () => (get().user?.role ?? '') as UsuarioRole | '',

      hasPermission: (...perms: Permissao[]) => {
        if (perms.length === 0) return true;
        const acessivel = get().acessivel;
        return perms.some((p) => acessivel.includes(p));
      },

      isSuperAdmin: () => get().getUserRole() === 'super_admin',

      isAdmin: () => {
        const role = get().getUserRole();
        return role === 'admin' || role === 'super_admin';
      },
    }),
    {
      name: 'service-user-storage',
      version: 4,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
