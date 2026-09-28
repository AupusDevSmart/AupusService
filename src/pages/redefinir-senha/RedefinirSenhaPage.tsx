import { LoginLayout } from '@/features/login/components/LoginLayout';
import { RedefinirSenhaForm } from '@/features/login/components/RedefinirSenhaForm';

/**
 * Página de redefinição de senha do Aupus Service (acessada pelo link do email).
 */
export function RedefinirSenhaPage() {
  return (
    <LoginLayout>
      <RedefinirSenhaForm />
    </LoginLayout>
  );
}
