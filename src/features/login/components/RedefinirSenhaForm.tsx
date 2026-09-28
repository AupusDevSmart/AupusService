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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
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
      <div className={CONTEINER_FORM}>
        <div className="space-y-1 text-center">
          <h1 className={TITULO}>Link inválido</h1>
          <p className={SUBTITULO}>
            Este link de redefinição é inválido ou está incompleto. Solicite um novo.
          </p>
        </div>
        <Button asChild className={BOTAO_PRINCIPAL}>
          <Link to="/esqueci-senha">Solicitar novo link</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className={CONTEINER_FORM}>
      <div className="space-y-1 text-center">
        <h1 className={TITULO}>Redefinir senha</h1>
        <p className={SUBTITULO}>
          Defina uma nova senha para <span className="font-medium text-white">{email}</span>
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className={AVISO_ERRO}>
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="novaSenha" className={ROTULO}>
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
              className={cn(CAMPO, 'pr-10', errors.novaSenha && CAMPO_COM_ERRO)}
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
          {errors.novaSenha && <p className={ERRO_CAMPO}>{errors.novaSenha.message}</p>}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="confirmarSenha" className={ROTULO}>
            Confirmar nova senha
          </Label>
          <Input
            id="confirmarSenha"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            autoComplete="new-password"
            disabled={isLoading}
            {...register('confirmarSenha')}
            className={cn(CAMPO, errors.confirmarSenha && CAMPO_COM_ERRO)}
          />
          {errors.confirmarSenha && (
            <p className={ERRO_CAMPO}>{errors.confirmarSenha.message}</p>
          )}
        </div>

        <Button type="submit" className={BOTAO_PRINCIPAL} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              <span>Redefinindo...</span>
            </>
          ) : (
            'Redefinir senha'
          )}
        </Button>
      </form>

      <div className="text-center">
        <Link to="/login" className={LINK_DISCRETO}>
          Voltar ao login
        </Link>
      </div>
    </div>
  );
}
