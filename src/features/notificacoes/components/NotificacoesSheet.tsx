import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Loader2, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { Notificacao } from '@/services/notificacoes.services';
import { useContagemDeNaoLidas, useListaDeNotificacoes, useMarcarNotificacoes } from '../hooks/useNotificacoes';
import { quandoFoi } from '../utils/quando';

type Aba = 'nao-lidas' | 'todas';

const numeroDoSino = (n: number) => (n > 99 ? '99+' : String(n));

/** Só caminho desta aplicação: "//outro.com" no navigate viraria saída para outro site. */
const linkInterno = (link: string | null): link is string => !!link && link.startsWith('/') && !link.startsWith('//');

function rotuloDoSino(naoLidas: number, falhou: boolean): string {
  const quantas = naoLidas > 0 ? `: ${naoLidas} ${naoLidas === 1 ? 'não lida' : 'não lidas'}` : '';
  return `Notificações${quantas}${falhou ? ' (não foi possível atualizar o número)' : ''}`;
}

/**
 * O sininho do cabeçalho (SN-47): quantas não lidas, e a lista do que mudou de
 * status nas programações, OS e origens. Clicar abre o registro e marca como
 * lida. A falha do contador marca o sino (e a dica diz o quê); a da lista
 * aparece dentro do sheet.
 */
export function NotificacoesSheet() {
  const [aberto, setAberto] = useState(false);
  const [aba, setAba] = useState<Aba>('nao-lidas');
  const navigate = useNavigate();
  const contagem = useContagemDeNaoLidas();
  const lista = useListaDeNotificacoes(aba === 'nao-lidas', aberto);
  const { umaLida, todasLidas } = useMarcarNotificacoes();

  // Saindo para outra tela, o foco não volta ao sino: voltaria com a dica
  // aberta por cima do sheet que o link acabou de abrir
  const saindo = useRef(false);

  // Contador fora do ar: o número que a lista trouxe ainda vale para a aba e o "Marcar todas"
  const naoLidas = contagem.data ?? lista.data?.pages[0]?.naoLidas ?? 0;
  const itens = lista.data?.pages.flatMap((p) => p.data) ?? [];
  const rotulo = rotuloDoSino(naoLidas, contagem.isError);

  const abrir = (n: Notificacao) => {
    if (!n.lida) umaLida.mutate(n.id);
    if (linkInterno(n.link)) {
      saindo.current = true;
      setAberto(false);
      navigate(n.link);
    }
  };

  const irParaPreferencias = () => {
    saindo.current = true;
    setAberto(false);
    navigate('/configuracoes/perfil');
  };

  return (
    <Sheet open={aberto} onOpenChange={setAberto}>
      <Tooltip>
        <TooltipTrigger asChild>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative mr-3"
              aria-label={rotulo}
            >
              <Bell className="h-4 w-4" />
              {contagem.isError && naoLidas === 0 && (
                <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-muted-foreground" aria-hidden="true" />
              )}
              {naoLidas > 0 && (
                <span className="absolute -right-0.5 -top-0.5 min-w-[1.1rem] rounded-full bg-destructive px-1 text-[10px] font-semibold leading-[1.1rem] text-destructive-foreground">
                  {numeroDoSino(naoLidas)}
                </span>
              )}
            </Button>
          </SheetTrigger>
        </TooltipTrigger>
        <TooltipContent>{rotulo}</TooltipContent>
      </Tooltip>

      <SheetContent
        side="right"
        className="flex w-full max-w-md flex-col gap-0 p-0"
        onCloseAutoFocus={(e) => {
          if (saindo.current) e.preventDefault();
          saindo.current = false;
        }}
      >
        <div className="border-b px-5 py-4 pr-12">
          <SheetTitle className="text-base">Notificações</SheetTitle>
          <SheetDescription className="text-xs">
            Mudanças de status nas programações, ordens de serviço, anomalias e solicitações.
          </SheetDescription>
        </div>

        <div className="flex items-center justify-between gap-2 px-5 pt-3">
          <Tabs value={aba} onValueChange={(v) => setAba(v as Aba)}>
            <TabsList>
              <TabsTrigger value="nao-lidas">Não lidas{naoLidas > 0 ? ` (${numeroDoSino(naoLidas)})` : ''}</TabsTrigger>
              <TabsTrigger value="todas">Todas</TabsTrigger>
            </TabsList>
          </Tabs>
          {naoLidas > 0 && (
            <Button variant="ghost" size="sm" onClick={() => todasLidas.mutate()} disabled={todasLidas.isPending}>
              <CheckCheck className="mr-1.5 h-4 w-4" />
              Marcar todas
            </Button>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
          {lista.isLoading ? (
            <p className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
            </p>
          ) : lista.isError ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <p>Não foi possível carregar as notificações.</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => lista.refetch()}>
                Tentar de novo
              </Button>
            </div>
          ) : itens.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {aba === 'nao-lidas' ? 'Nada novo por aqui.' : 'Nenhuma notificação ainda.'}
            </p>
          ) : (
            <ul className="space-y-2">
              {itens.map((n) => (
                <li key={n.id}>
                  <ItemDaNotificacao notificacao={n} onAbrir={abrir} />
                </li>
              ))}
            </ul>
          )}

          {lista.hasNextPage && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 w-full"
              onClick={() => lista.fetchNextPage()}
              disabled={lista.isFetchingNextPage}
            >
              {lista.isFetchingNextPage ? 'Carregando...' : 'Carregar mais'}
            </Button>
          )}
        </div>

        <div className="border-t px-5 py-2">
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={irParaPreferencias}>
            <Settings2 className="mr-1.5 h-4 w-4" />
            O que recebo por e-mail
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ItemDaNotificacao({ notificacao: n, onAbrir }: { notificacao: Notificacao; onAbrir: (n: Notificacao) => void }) {
  return (
    <button
      type="button"
      onClick={() => onAbrir(n)}
      className={cn(
        'w-full rounded-md border px-3 py-2.5 text-left transition-colors hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        n.lida ? 'bg-background' : 'bg-card',
      )}
    >
      <div className="flex items-start gap-2">
        <span
          className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.lida ? 'bg-transparent' : 'bg-ring')}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className={cn('text-sm', n.lida ? 'text-muted-foreground' : 'font-medium')}>
              {!n.lida && <span className="sr-only">Não lida: </span>}
              {n.titulo}
            </p>
            <time dateTime={n.created_at} className="shrink-0 text-xs text-muted-foreground">
              {quandoFoi(n.created_at)}
            </time>
          </div>
          {n.descricao && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.descricao}</p>}
          {n.tipo === 'acao' && !n.lida && <p className="mt-1 text-[11px] font-medium text-muted-foreground">Pede uma ação sua</p>}
        </div>
      </div>
    </button>
  );
}
