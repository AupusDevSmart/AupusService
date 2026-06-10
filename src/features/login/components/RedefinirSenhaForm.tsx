import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import {
  redefinirSenhaSchema,
  RedefinirSenhaFormData,
} from '../schemas/redefinir-senha.schema';
import { useRedefinirSenha } from '../hooks/useRedefinirSenha';
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

/**
 * Formulário de redefinição de senha.
 * Lê token e email da query string e define a nova senha.
 */
export function RedefinirSenhaForm() {
  const [searchParams] = useSearchParams();
  const token = (searchParams.get('token') || '').trim();
  const email = (searchParams.get('email') || '').trim();

  const { redefinir, isLoading, error } = useRedefinirSenha();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RedefinirSenhaFormData>({
    resolver: zodResolver(redefinirSenhaSchema),
    defaultValues: { novaSenha: '', confirmarSenha: '' },
  });

  const onSubmit = async (data: RedefinirSenhaFormData) => {
    await redefinir({
      email,
      token,
      novaSenha: data.novaSenha,
      confirmarSenha: data.confirmarSenha,
    });
  };

  // Link inválido: faltam token ou email na URL.
  if (!token || !email) {
    return (
      <Card className="w-full shadow-lg border border-border bg-card">
        <CardHeader className="space-y-1 pb-6 px-6 lg:px-8 pt-8 lg:pt-10">
          <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-semibold text-center text-foreground">
            Link inválido
          </CardTitle>
          <CardDescription className="text-center text-sm lg:text-base text-muted-foreground">
            Este link de redefinição é inválido ou está incompleto. Solicite um novo.
          </CardDescription>
        </CardHeader>
        <CardFooter className="px-6 lg:px-8 pb-8 lg:pb-10 pt-4">
          <Button
            asChild
            className="w-full h-11 lg:h-12 text-base font-medium bg-foreground text-background hover:bg-foreground/90"
          >
            <Link to="/esqueci-senha">Solicitar novo link</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-lg border border-border bg-card">
      <CardHeader className="space-y-1 pb-6 px-6 lg:px-8 pt-8 lg:pt-10">
        <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-semibold text-center text-foreground">
          Redefinir senha
        </CardTitle>
        <CardDescription className="text-center text-sm lg:text-base text-muted-foreground">
          Defina uma nova senha para{' '}
          <span className="font-medium text-foreground">{email}</span>
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-5 lg:space-y-6 px-6 lg:px-8 pb-2">
          {error && (
            <Alert variant="destructive" className="text-sm">
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label
              htmlFor="novaSenha"
              className="text-sm lg:text-base font-medium text-gray-700 dark:text-gray-300"
            >
              Nova senha
            </Label>
            <div className="relative">
              <Input
                id="novaSenha"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="new-password"
                disabled={isLoading}
                {...register('novaSenha')}
                className={`h-11 lg:h-12 text-base pr-10 ${
                  errors.novaSenha ? 'border-destructive focus-visible:ring-destructive' : ''
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
            {errors.novaSenha && (
              <p className="text-sm text-destructive">{errors.novaSenha.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="confirmarSenha"
              className="text-sm lg:text-base font-medium text-gray-700 dark:text-gray-300"
            >
              Confirmar nova senha
            </Label>
            <Input
              id="confirmarSenha"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={isLoading}
              {...register('confirmarSenha')}
              className={`h-11 lg:h-12 text-base ${
                errors.confirmarSenha ? 'border-destructive focus-visible:ring-destructive' : ''
              }`}
            />
            {errors.confirmarSenha && (
              <p className="text-sm text-destructive">{errors.confirmarSenha.message}</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex-col space-y-4 px-6 lg:px-8 pb-8 lg:pb-10 pt-4">
          <Button
            type="submit"
            className="w-full h-11 lg:h-12 text-base font-medium bg-foreground text-background hover:bg-foreground/90"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                <span>Redefinindo...</span>
              </>
            ) : (
              'Redefinir senha'
            )}
          </Button>

          <Link
            to="/login"
            className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
          >
            Voltar ao login
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
