import { LoginLayout } from '@/features/login/components/LoginLayout';
import { TrocarSenhaForm } from '@/features/login/components/TrocarSenhaForm';

/** Troca obrigatória da senha provisória (primeiro acesso ou senha redefinida). */
export function TrocarSenhaPage() {
  return (
    <LoginLayout>
      <TrocarSenhaForm />
    </LoginLayout>
  );
}
