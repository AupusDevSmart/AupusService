import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { type ReactNode } from 'react';
import { useUserStore } from '@/store/useUserStore';
import type { Permissao } from '@/types/dtos/usuarios-dto';

type FeatureWrapperProps = {
  /** Uma ou mais permissões; qualquer uma basta (como o @Permissions do backend). */
  feature: Permissao | Permissao[];
  children: ReactNode;
};

/**
 * Protege uma rota pela permissão. Sem ela, a tela diz que existe e que não
 * abre para este usuário — antes, a pessoa era devolvida ao painel sem
 * explicação e achava que o link estava quebrado. O backend recusa do mesmo
 * jeito; isto só evita a tela vazia.
 */
export function FeatureWrapper({ feature, children }: FeatureWrapperProps) {
  const hasPermission = useUserStore((s) => s.hasPermission);
  const permissoes = Array.isArray(feature) ? feature : [feature];

  if (!hasPermission(...permissoes)) return <SemAcesso />;
  return <>{children}</>;
}

function SemAcesso() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md space-y-3 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Lock className="h-5 w-5 text-muted-foreground" />
        </div>
        <h1 className="text-lg font-semibold">Sem acesso a esta tela</h1>
        <p className="text-sm text-muted-foreground">
          O seu tipo de usuário não tem permissão para abrir esta tela. Se precisar dela, fale com quem administra os
          usuários.
        </p>
        <Link to="/dashboard" className="btn-minimal-outline inline-flex">
          Voltar ao painel
        </Link>
      </div>
    </div>
  );
}
