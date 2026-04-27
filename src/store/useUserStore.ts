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

export const useUserStore = create(
  persist<UserStoreState>(
    (set, get) => ({
      user: null,
      acessivel: [],
      plantasVinculadas: [],

      setUser: (newUser: UsuarioDTO) =>
        set({
          user: newUser,
          acessivel: (newUser.all_permissions || []) as Permissao[],
          plantasVinculadas: newUser.plantas_vinculadas || [],
        }),

      updateUser: (partialUser: Partial<UsuarioDTO>) =>
        set((state) => {
          if (!state.user) return { user: null, acessivel: [], plantasVinculadas: [] };
          const updatedUser = { ...state.user, ...partialUser };
          const acessivel =
            partialUser.all_permissions !== undefined
              ? (partialUser.all_permissions as Permissao[])
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
