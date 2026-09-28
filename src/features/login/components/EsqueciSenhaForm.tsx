import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import {
  esqueciSenhaSchema,
  EsqueciSenhaFormData,
} from '../schemas/esqueci-senha.schema';
import { useEsqueciSenha } from '../hooks/useEsqueciSenha';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, MailCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  BOTAO_PRINCIPAL,
  BOTAO_SECUNDARIO,
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
 * Formulário de "esqueci minha senha".
 * Solicita o email e, após o envio, exibe um estado de confirmação genérico.
 */
export function EsqueciSenhaForm() {
  const { solicitar, isLoading, enviado } = useEsqueciSenha();

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<EsqueciSenhaFormData>({
    resolver: zodResolver(esqueciSenhaSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: EsqueciSenhaFormData) => {
    await solicitar(data.email);
  };

  if (enviado) {
    return (
      <div className={CONTEINER_FORM}>
        <div className="flex flex-col items-center space-y-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
            <MailCheck className="h-6 w-6 text-service-verde" />
          </div>
          <h1 className={TITULO}>Verifique seu e-mail</h1>
          <p className={SUBTITULO}>
            Se <span className="font-medium text-white">{getValues('email')}</span> estiver
            cadastrado, enviamos um link para redefinir sua senha. O link expira em 60 minutos.
          </p>
        </div>
        <Button asChild variant="outline" className={BOTAO_SECUNDARIO}>
          <Link to="/login">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao login
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className={CONTEINER_FORM}>
      <div className="space-y-1 text-center">
        <h1 className={TITULO}>Esqueceu a senha?</h1>
        <p className={SUBTITULO}>
          Informe seu e-mail e enviaremos um link para redefinir sua senha
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
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

        <Button type="submit" className={BOTAO_PRINCIPAL} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              <span>Enviando...</span>
            </>
          ) : (
            'Enviar link de redefinição'
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
