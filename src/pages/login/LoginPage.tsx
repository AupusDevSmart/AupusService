import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LoginForm } from '@/features/login/components/LoginForm';
import { useUserStore } from '@/store/useUserStore';
import { useTheme } from '@/components/theme-provider';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Página de Login
 * Redireciona automaticamente se o usuário já estiver autenticado
 */
export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useUserStore();
  const { theme, setTheme } = useTheme();

  // Pegar redirectTo da URL ou usar /dashboard como padrão
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';

  // Se já estiver logado, redirecionar
  useEffect(() => {
    if (user?.id) {
      navigate(redirectTo, { replace: true });
    }
  }, [user, navigate, redirectTo]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="min-h-screen w-full bg-background relative">
      {/* Botão de toggle de tema - canto superior direito */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="absolute top-4 right-4 z-50 hover:bg-accent"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
      </Button>
      {/* Layout Mobile - Centralizado */}
      <div className="w-full lg:hidden min-h-screen flex flex-col items-center justify-center p-6">
        {/* Logo e Branding */}
        <div className="flex flex-col items-center mb-8 space-y-4">
          <div className="w-32 h-32 sm:w-40 sm:h-40 mb-2">
            <img
              src="/logoaupus.svg"
              alt="Aupus Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Aupus Service
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Sistema de Gestão de Manutenção
            </p>
          </div>
        </div>

        {/* Formulário */}
        <div className="w-full max-w-md">
          <LoginForm redirectTo={redirectTo} />
        </div>

        {/* Footer Mobile */}
        <div className="text-center mt-8">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500">
            © 2024 Aupus. Todos os direitos reservados.
          </p>
        </div>
      </div>

      {/* Layout Desktop - Duas Colunas */}
      <div className="hidden lg:grid lg:grid-cols-2 w-full min-h-screen">
        {/* Coluna Esquerda - Logo e Branding */}
        <div className="bg-[#0f0e1f] flex flex-col items-center justify-center p-12 border-r border-border/20">
          <div className="flex flex-col items-center space-y-8 max-w-lg">
            {/* Logo */}
            <div className="w-48 h-48 xl:w-64 xl:h-64">
              <img
                src="/logoaupus.svg"
                alt="Aupus Logo"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Título e Descrição */}
            <div className="text-center space-y-4">
              <h1 className="text-4xl xl:text-5xl font-semibold text-white">
                Aupus Service
              </h1>
              <p className="text-lg xl:text-xl text-white/70 leading-relaxed">
                Sistema de Gestão de Manutenção
              </p>
              <p className="text-base text-white/60 mt-6">
                Controle completo da manutenção dos seus equipamentos
              </p>
            </div>

            {/* Footer Desktop */}
            <div className="mt-12 text-center">
              <p className="text-sm text-white/50">
                © 2024 Aupus. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </div>

        {/* Coluna Direita - Formulário */}
        <div className="flex items-center justify-center p-12">
          <div className="w-full max-w-md xl:max-w-lg">
            <LoginForm redirectTo={redirectTo} />
          </div>
        </div>
      </div>
    </div>
  );
}
