import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { profileService } from '@/services/profile.service';
import { AuthService } from '@/services/auth.service';
import { useUserStore } from '@/store/useUserStore';
import { formatApiError } from '@/utils/api-error';
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

const esquema = z
  .object({
    senhaAtual: z.string().min(1, 'Informe a senha provisória'),
    novaSenha: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
    confirmarSenha: z.string().min(1, 'Confirme a nova senha'),
  })
  .refine((d) => d.novaSenha === d.confirmarSenha, { message: 'As senhas não conferem', path: ['confirmarSenha'] })
  .refine((d) => d.novaSenha !== d.senhaAtual, { message: 'A nova senha precisa ser diferente da provisória', path: ['novaSenha'] });

type Dados = z.infer<typeof esquema>;

/**
 * Primeiro acesso, ou senha redefinida por outra pessoa (SN-34): antes de usar
 * o sistema a pessoa troca a senha provisória por uma que só ela sabe. O
 * backend recusa as outras rotas até isso acontecer.
 */
export function TrocarSenhaForm() {
  const navigate = useNavigate();
  const { user, updateUser, clearUser } = useUserStore();
  const [mostrar, setMostrar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Dados>({ resolver: zodResolver(esquema), defaultValues: { senhaAtual: '', novaSenha: '', confirmarSenha: '' } });

  const trocar = async (dados: Dados) => {
    if (!user?.id) return;
    setErro(null);
    try {
      await profileService.changePassword(user.id, { senhaAtual: dados.senhaAtual, novaSenha: dados.novaSenha });
      updateUser(await AuthService.getCurrentUser());
      navigate('/dashboard', { replace: true });
    } catch (e) {
      setErro(formatApiError(e));
    }
  };

  const campo = (nome: keyof Dados, rotulo: string, autoComplete: string) => (
    <div className="grid gap-2">
      <Label htmlFor={nome} className={ROTULO}>
        {rotulo}
      </Label>
      <div className="relative">
        <Input
          id={nome}
          type={mostrar ? 'text' : 'password'}
          autoComplete={autoComplete}
          disabled={isSubmitting}
          {...register(nome)}
          className={cn(CAMPO, nome === 'senhaAtual' && 'pr-10', errors[nome] && CAMPO_COM_ERRO)}
        />
        {nome === 'senhaAtual' && (
          <button
            type="button"
            onClick={() => setMostrar(!mostrar)}
            className={BOTAO_VER_SENHA}
            tabIndex={-1}
            aria-label={mostrar ? 'Ocultar senhas' : 'Mostrar senhas'}
          >
            {mostrar ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        )}
      </div>
      {errors[nome] && <p className={ERRO_CAMPO}>{errors[nome]?.message}</p>}
    </div>
  );

  return (
    <div className={CONTEINER_FORM}>
      <div className="space-y-1 text-center">
        <h1 className={TITULO}>Crie a sua senha</h1>
        <p className={SUBTITULO}>
          Você entrou com uma senha provisória. Antes de continuar, troque por uma que só você saiba.
        </p>
      </div>

      {erro && (
        <Alert variant="destructive" className={AVISO_ERRO}>
          <AlertDescription className="text-sm">{erro}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(trocar)} className="grid gap-4">
        {campo('senhaAtual', 'Senha provisória', 'current-password')}
        {campo('novaSenha', 'Nova senha', 'new-password')}
        {campo('confirmarSenha', 'Confirmar nova senha', 'new-password')}
        <Button type="submit" className={BOTAO_PRINCIPAL} disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
          {isSubmitting ? 'Salvando...' : 'Salvar e entrar'}
        </Button>
      </form>

      <div className="text-center">
        <button
          type="button"
          onClick={async () => {
            await AuthService.logout();
            clearUser();
            navigate('/login', { replace: true });
          }}
          className={LINK_DISCRETO}
        >
          Sair
        </button>
      </div>
    </div>
  );
}
