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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowLeft, Loader2, MailCheck } from 'lucide-react';

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
      <Card className="w-full shadow-lg border border-border bg-card">
        <CardHeader className="space-y-3 pb-6 px-6 lg:px-8 pt-8 lg:pt-10 items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <MailCheck className="h-6 w-6 text-foreground" />
          </div>
          <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-semibold text-foreground">
            Verifique seu email
          </CardTitle>
          <CardDescription className="text-sm lg:text-base text-muted-foreground">
            Se <span className="font-medium text-foreground">{getValues('email')}</span> estiver
            cadastrado, enviamos um link para redefinir sua senha. O link expira em 60 minutos.
          </CardDescription>
        </CardHeader>
        <CardFooter className="px-6 lg:px-8 pb-8 lg:pb-10 pt-4">
          <Button asChild variant="outline" className="w-full h-11 lg:h-12 text-base">
            <Link to="/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao login
            </Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-lg border border-border bg-card">
      <CardHeader className="space-y-1 pb-6 px-6 lg:px-8 pt-8 lg:pt-10">
        <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-semibold text-center text-foreground">
          Esqueceu a senha?
        </CardTitle>
        <CardDescription className="text-center text-sm lg:text-base text-muted-foreground">
          Informe seu email e enviaremos um link para redefinir sua senha
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-5 lg:space-y-6 px-6 lg:px-8 pb-2">
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-sm lg:text-base font-medium text-gray-700 dark:text-gray-300"
            >
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
              <p className="text-sm text-destructive">{errors.email.message}</p>
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
                <span>Enviando...</span>
              </>
            ) : (
              'Enviar link de redefinição'
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
