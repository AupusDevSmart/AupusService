import { useUserStore } from '@/store/useUserStore';
import { Permissao } from '@/types/dtos/usuarios-dto';
import { type ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

type FeatureWrapperProps = {
  feature: Permissao;
  children: ReactNode;
  fallbackPath?: string;
};

/**
 * Protege uma rota exigindo que o usuario tenha a permissao `feature`.
 * Redireciona para `fallbackPath` (ou /dashboard) caso nao tenha.
 */
export function FeatureWrapper({ feature, children, fallbackPath = '/dashboard' }: FeatureWrapperProps) {
  const navigate = useNavigate();
  const { acessivel, user } = useUserStore();

  const allowed = acessivel.includes(feature);

  useEffect(() => {
    if (!user) return;
    if (!allowed) {
      navigate(fallbackPath, { replace: true });
    }
  }, [allowed, feature, navigate, fallbackPath, user]);

  if (!allowed) return null;
  return <>{children}</>;
}
