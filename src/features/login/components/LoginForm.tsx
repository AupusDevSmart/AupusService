import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData } from '../schemas/login.schema';
import { useLogin } from '../hooks/useLogin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface LoginFormProps {
  redirectTo?: string;
}

/**
 * Componente de formulário de login
 * Inclui validação com Zod, feedback de erros e toggle de senha
 */
export function LoginForm({ redirectTo = '/dashboard' }: LoginFormProps) {
  const { login, isLoading, error } = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      senha: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    await login(data, redirectTo);
  };

  return (
    <Card className="w-full shadow-lg border border-border bg-card">
      <CardHeader className="space-y-1 pb-6 px-6 lg:px-8 pt-8 lg:pt-10">
        <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-semibold text-center text-foreground">
          Entrar
        </CardTitle>
        <CardDescription className="text-center text-sm lg:text-base text-muted-foreground">
          Digite suas credenciais para acessar o sistema
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-5 lg:space-y-6 px-6 lg:px-8 pb-2">
          {/* Alerta de erro global */}
          {error && (
            <Alert variant="destructive" className="text-sm">
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          {/* Campo de Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm lg:text-base font-medium text-gray-700 dark:text-gray-300">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="seuemail@exemplo.com"
              autoComplete="email"
              disabled={isLoading}
              {...register('email')}
              className={`h-11 lg:h-12 text-base ${
                errors.email ? 'border-destructive focus-visible:ring-destructive' : ''
              }`}
            />
            {errors.email && (
              <p className="text-sm text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Campo de Senha */}
          <div className="space-y-2">
            <Label htmlFor="senha" className="text-sm lg:text-base font-medium text-gray-700 dark:text-gray-300">
              Senha
            </Label>
            <div className="relative">
              <Input
                id="senha"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={isLoading}
                {...register('senha')}
                className={`h-11 lg:h-12 text-base pr-10 ${
                  errors.senha ? 'border-destructive focus-visible:ring-destructive' : ''
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                tabIndex={-1}
                disabled={isLoading}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.senha && (
              <p className="text-sm text-destructive">
                {errors.senha.message}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="px-6 lg:px-8 pb-8 lg:pb-10 pt-4">
          <Button
            type="submit"
            className="w-full h-11 lg:h-12 text-base font-medium bg-foreground text-background hover:bg-foreground/90"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                <span>Entrando...</span>
              </>
            ) : (
              'Entrar'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
