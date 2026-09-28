import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LoginForm } from '@/features/login/components/LoginForm';
import { LoginLayout } from '@/features/login/components/LoginLayout';
import { useUserStore } from '@/store/useUserStore';

/**
 * Página de Login
 * Redireciona automaticamente se o usuário já estiver autenticado
 */
export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useUserStore();

  // Pegar redirectTo da URL ou usar /dashboard como padrão
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';

  // Se já estiver logado, redirecionar
  useEffect(() => {
    if (user?.id) {
      navigate(redirectTo, { replace: true });
    }
  }, [user, navigate, redirectTo]);

  return (
    <LoginLayout>
      <LoginForm redirectTo={redirectTo} />
    </LoginLayout>
  );
}
