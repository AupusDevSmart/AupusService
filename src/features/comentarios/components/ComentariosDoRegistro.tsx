import { useEffect, useRef, useState } from 'react';
import { Loader2, Lock, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { quandoFoi } from '@/features/notificacoes/utils/quando';
import type { AlvoDoComentario, Comentario } from '@/services/comentarios.services';
import { useComentarios } from '../hooks/useComentarios';

interface Props {
  alvo: AlvoDoComentario;
  registroId: string;
  /** Tem a permissão de atuar no registro (a mesma da rota de comentar). */
  podeComentar: boolean;
  /** Cliente não vê nem escreve comentário interno. */
  ehCliente: boolean;
  /** Avisa quem monta o sheet que há texto não enviado: fechar pergunta antes de descartar. */
  onRascunho?: (temRascunho: boolean) => void;
}

const MAXIMO = 5000;

/**
 * Sem maxLength na caixa: o navegador cortaria calado o que fosse colado além
 * do limite e o comentário iria sem o final. Aqui o excesso aparece e o botão
 * trava até a pessoa encurtar.
 */
function TamanhoDoTexto({ tamanho }: { tamanho: number }) {
  if (tamanho <= MAXIMO * 0.9) return null;
  const passou = tamanho > MAXIMO;
  return (
    <p className={passou ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'} role={passou ? 'alert' : undefined}>
      {passou ? `Passou do limite: ${tamanho} de ${MAXIMO} caracteres. Encurte para enviar.` : `${tamanho} de ${MAXIMO} caracteres`}
    </p>
  );
}

/**
 * Comentários da OS ou da solicitação (SN-48), do mais antigo ao mais novo.
 * Quem escreveu edita ou exclui por 15 minutos (o prazo vem do servidor). O
 * interno não chega ao cliente — nem a lista, nem a caixa para marcar. Falha ao
 * gravar sai no toast do interceptor; o texto digitado fica na caixa.
 *
 * Mora dentro do <form> do sheet: todo botão é type="button", senão comentar
 * enviava o formulário e fechava o sheet.
 */
export function ComentariosDoRegistro({ alvo, registroId, podeComentar, ehCliente, onRascunho, semTitulo = false }: Props & { semTitulo?: boolean }) {
  const { lista, comentar, editar, excluir } = useComentarios(alvo, registroId);
  const [texto, setTexto] = useState('');
  const [interno, setInterno] = useState(false);
  const [editando, setEditando] = useState<{ id: string; texto: string } | null>(null);
  // O prazo de 15 min passa com o sheet aberto: os botões somem sozinhos
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const relogio = setInterval(() => setAgora(Date.now()), 30_000);
    return () => clearInterval(relogio);
  }, []);

  const avisarRascunho = useRef(onRascunho);
  avisarRascunho.current = onRascunho;
  const temRascunho = texto.trim().length > 0 || editando !== null;
  useEffect(() => {
    avisarRascunho.current?.(temRascunho);
  }, [temRascunho]);
  // Saindo da tela (sheet fechado), não há mais rascunho
  useEffect(() => () => avisarRascunho.current?.(false), []);

  const comentarios = lista.data ?? [];
  // O prazo vem como "quanto falta" medido no servidor, contado a partir da hora
  // em que a lista chegou: relógio do aparelho adiantado não some com os botões
  const editavel = (c: Comentario) => c.editavel_por_ms !== null && lista.dataUpdatedAt + c.editavel_por_ms > agora;
  const longoDemais = texto.trim().length > MAXIMO;
  const edicaoLongaDemais = (editando?.texto.trim().length ?? 0) > MAXIMO;

  const enviar = () => {
    const limpo = texto.trim();
    if (!limpo || limpo.length > MAXIMO) return;
    comentar.mutate(
      { comentario: limpo, interno: !ehCliente && interno },
      {
        onSuccess: () => {
          setTexto('');
          setInterno(false);
        },
      },
    );
  };

  const salvarEdicao = () => {
    if (!editando || !editando.texto.trim() || edicaoLongaDemais) return;
    editar.mutate({ id: editando.id, comentario: editando.texto.trim() }, { onSuccess: () => setEditando(null) });
  };

  return (
    <section aria-labelledby={`comentarios-${registroId}`} className="space-y-3">
      {/* `semTitulo`: dentro de uma seção que já tem o título (a "Conversa" da solicitação, 30/out/2026) */}
      <h3 id={`comentarios-${registroId}`} className={semTitulo ? 'sr-only' : 'flex items-center gap-2 text-sm font-medium'}>
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        Comentários{comentarios.length > 0 ? ` (${comentarios.length})` : ''}
      </h3>

      {lista.isLoading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
        </p>
      ) : lista.isError ? (
        <div className="text-sm text-muted-foreground">
          <p>Não foi possível carregar os comentários.</p>
          <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => lista.refetch()}>
            Tentar de novo
          </Button>
        </div>
      ) : comentarios.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum comentário ainda.</p>
      ) : (
        <ul className="space-y-2">
          {comentarios.map((c) => (
            // Fundo leve no lugar da borda (30/out/2026: menos borda no sheet)
            <li key={c.id} className="rounded-md bg-muted px-3 py-2">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p className="text-sm font-medium">
                  {c.autor}
                  {c.interno && (
                    <span className="ml-2 inline-flex items-center gap-1 text-xs font-normal text-muted-foreground">
                      <Lock className="h-3 w-3" aria-hidden="true" /> interno
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  <time dateTime={c.created_at}>{quandoFoi(c.created_at, new Date(agora))}</time>
                  {c.editado && ' · editado'}
                </p>
              </div>

              {editando?.id === c.id ? (
                <div className="mt-2 space-y-2">
                  <Textarea
                    aria-label="Editar comentário"
                    value={editando.texto}
                    onChange={(e) => setEditando({ id: c.id, texto: e.target.value })}
                    onKeyDown={(e) => {
                      // Esc cancela a edição, sem fechar o sheet
                      if (e.key === 'Escape') {
                        e.stopPropagation();
                        setEditando(null);
                      }
                    }}
                  />
                  <TamanhoDoTexto tamanho={editando.texto.trim().length} />
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setEditando(null)}>
                      Cancelar
                    </Button>
                    <Button type="button" size="sm" onClick={salvarEdicao} disabled={editar.isPending || !editando.texto.trim() || edicaoLongaDemais}>
                      Salvar
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="mt-1 whitespace-pre-wrap break-words text-sm">{c.comentario}</p>
              )}

              {editavel(c) && editando?.id !== c.id && (
                <div className="mt-1 flex gap-1">
                  <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setEditando({ id: c.id, texto: c.comentario })}>
                    Editar
                  </Button>
                  <Button type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-muted-foreground"
                    disabled={excluir.isPending}
                    onClick={() => {
                      if (window.confirm('Excluir este comentário?')) excluir.mutate(c.id);
                    }}
                  >
                    Excluir
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {podeComentar && (
        <div className="space-y-2">
          <Textarea
            aria-label="Novo comentário"
            placeholder="Escreva um comentário"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              // Com texto na caixa, Esc não fecha o sheet (o rascunho se perderia)
              if (e.key === 'Escape' && texto.trim()) e.stopPropagation();
            }}
          />
          <TamanhoDoTexto tamanho={texto.trim().length} />
          <div className="flex flex-wrap items-center justify-between gap-2">
            {!ehCliente ? (
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox checked={interno} onCheckedChange={(v) => setInterno(v === true)} aria-label="Comentário interno" />
                Interno (o cliente não vê)
              </label>
            ) : (
              <span />
            )}
            <Button type="button" size="sm" onClick={enviar} disabled={comentar.isPending || !texto.trim() || longoDemais}>
              {comentar.isPending ? 'Enviando...' : 'Comentar'}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
