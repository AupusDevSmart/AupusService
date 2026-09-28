import { LoginLayout } from '@/features/login/components/LoginLayout';
import { EsqueciSenhaForm } from '@/features/login/components/EsqueciSenhaForm';

/**
 * Página "Esqueci minha senha" do Aupus Service.
 */
export function EsqueciSenhaPage() {
  return (
    <LoginLayout>
      <EsqueciSenhaForm />
    </LoginLayout>
  );
}
