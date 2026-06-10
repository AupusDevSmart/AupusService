import { AuthShell } from '@/features/login/components/AuthShell';
import { RedefinirSenhaForm } from '@/features/login/components/RedefinirSenhaForm';

/**
 * Página de redefinição de senha do Aupus Service (acessada pelo link do email).
 */
export function RedefinirSenhaPage() {
  return (
    <AuthShell>
      <RedefinirSenhaForm />
    </AuthShell>
  );
}
