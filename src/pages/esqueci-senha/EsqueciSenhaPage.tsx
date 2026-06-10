import { AuthShell } from '@/features/login/components/AuthShell';
import { EsqueciSenhaForm } from '@/features/login/components/EsqueciSenhaForm';

/**
 * Página "Esqueci minha senha" do Aupus Service.
 */
export function EsqueciSenhaPage() {
  return (
    <AuthShell>
      <EsqueciSenhaForm />
    </AuthShell>
  );
}
