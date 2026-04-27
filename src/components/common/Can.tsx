import { useUserStore } from '@/store/useUserStore';
import { Permissao } from '@/types/dtos/usuarios-dto';
import { type ReactNode } from 'react';

type CanProps = {
  /** Uma ou mais permissoes. Acesso concedido se o usuario tem ao menos uma. */
  permission: Permissao | Permissao[];
  /** Conteudo renderizado quando autorizado. */
  children: ReactNode;
  /** Conteudo alternativo quando nao autorizado (default: nada). */
  fallback?: ReactNode;
};

/**
 * Condicional de UI baseada em permissoes.
 *
 * <Can permission="plantas.manage">
 *   <Button>Editar planta</Button>
 * </Can>
 */
export function Can({ permission, children, fallback = null }: CanProps) {
  const hasPermission = useUserStore((s) => s.hasPermission);
  const perms = Array.isArray(permission) ? permission : [permission];
  if (!hasPermission(...perms)) return <>{fallback}</>;
  return <>{children}</>;
}

/**
 * Hook conveniente para checar uma permissao.
 */
export function usePermission(...perms: Permissao[]): boolean {
  return useUserStore((s) => s.hasPermission(...perms));
}
