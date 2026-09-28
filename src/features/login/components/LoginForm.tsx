import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { loginSchema, LoginFormData } from '../schemas/login.schema';
import { useLogin } from '../hooks/useLogin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  AVISO_ERRO,
  BOTAO_PRINCIPAL,
  BOTAO_VER_SENHA,
  CAMPO,
  CAMPO_COM_ERRO,
  CONTEINER_FORM,
  ERRO_CAMPO,
  LINK_DISCRETO,
  ROTULO,
  SUBTITULO,
  TITULO,
} from '@/features/login/utils/estilo-entrada';

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
    <div className={CONTEINER_FORM}>
      <div className="space-y-1 text-center">
        <h1 className={TITULO}>Faça login na sua conta</h1>
        <p className={SUBTITULO}>Entre com seu e-mail e senha para logar</p>
      </div>

      {/* Alerta de erro global */}
      {error && (
        <Alert variant="destructive" className={AVISO_ERRO}>
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
        {/* Campo de Email */}
        <div className="grid gap-2">
          <Label htmlFor="email" className={ROTULO}>
            E-mail
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="seuemail@exemplo.com"
            autoComplete="email"
            disabled={isLoading}
            {...register('email')}
            className={cn(CAMPO, errors.email && CAMPO_COM_ERRO)}
          />
          {errors.email && <p className={ERRO_CAMPO}>{errors.email.message}</p>}
        </div>

        {/* Campo de Senha */}
        <div className="grid gap-2">
          <Label htmlFor="senha" className={ROTULO}>
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
              className={cn(CAMPO, 'pr-10', errors.senha && CAMPO_COM_ERRO)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={BOTAO_VER_SENHA}
              tabIndex={-1}
              disabled={isLoading}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.senha && <p className={ERRO_CAMPO}>{errors.senha.message}</p>}
        </div>

        <Button type="submit" className={BOTAO_PRINCIPAL} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              <span>Entrando...</span>
            </>
          ) : (
            'Entrar'
          )}
        </Button>
      </form>

      <div className="text-center">
        <Link to="/esqueci-senha" className={LINK_DISCRETO}>
          Esqueceu sua senha?
        </Link>
      </div>
    </div>
  );
}
