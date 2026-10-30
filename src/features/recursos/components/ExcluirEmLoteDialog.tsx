// src/features/recursos/components/ExcluirEmLoteDialog.tsx
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { isAxiosError } from 'axios';
import { formatApiError } from '@/utils/api-error';
import { recursosApi, type PedidoDeExclusaoEmLote, type ResultadoDaExclusaoEmLote } from '@/services/recursos.services';

const recursos = (n: number) => `${n} ${n === 1 ? 'recurso' : 'recursos'}`;

interface ExcluirEmLoteDialogProps {
  /** O que excluir (os marcados ou os inativos do filtro); nulo, a janela fecha */
  pedido: PedidoDeExclusaoEmLote | null;
  /** "os 4 marcados", "todos os inativos de Materiais" */
  descricao: string;
  onClose: () => void;
  /** Depois de excluir: recarregar a lista e desmarcar */
  onExcluidos: () => void;
}

/**
 * Excluir vários recursos de uma vez (30/out/2026, pedido do stakeholder:
 * "excluir todos os inativos de uma vez pela tela"). Antes de confirmar, a
 * prévia do servidor diz quantos saem e quais ficam por estarem em uso em
 * instruções (a mesma regra de remover um). Nada sai sem a pessoa ver isso.
 */
export function ExcluirEmLoteDialog({ pedido, descricao, onClose, onExcluidos }: ExcluirEmLoteDialogProps) {
  const [previa, setPrevia] = useState<ResultadoDaExclusaoEmLote | null>(null);
  const [falha, setFalha] = useState<string | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => {
    setPrevia(null);
    setFalha(null);
    if (!pedido) return;
    let cancelado = false;
    recursosApi
      .excluirEmLote({ ...pedido, previa: true })
      .then((lida) => !cancelado && setPrevia(lida))
      .catch((erro) => !cancelado && setFalha(formatApiError(erro)));
    return () => {
      cancelado = true;
    };
  }, [pedido]);

  const excluir = async () => {
    if (!pedido || !previa) return;
    setExcluindo(true);
    try {
      // O número que a pessoa viu vai junto: se a lista mudou no meio, a API recusa (409)
      const feito = await recursosApi.excluirEmLote({ ...pedido, previa: false, esperados: previa.excluidos });
      const ficaram = feito.em_uso.length;
      const sumidos = feito.nao_encontrados ?? 0;
      const detalhes = [
        ficaram > 0 && `${recursos(ficaram)} ${ficaram === 1 ? 'ficou' : 'ficaram'} por estar em uso em instruções.`,
        sumidos > 0 && `${recursos(sumidos)} já não ${sumidos === 1 ? 'existia' : 'existiam'}.`,
      ].filter(Boolean);
      toast.success(`${recursos(feito.excluidos)} ${feito.excluidos === 1 ? 'excluído' : 'excluídos'}`, {
        ...(detalhes.length > 0 && { description: detalhes.join(' ') }),
      });
      onExcluidos();
      onClose();
    } catch (erro) {
      toast.error('Não foi possível excluir', { description: formatApiError(erro) });
      // A lista mudou desde a prévia: mostra a de agora, para a pessoa conferir de novo
      if (isAxiosError(erro) && erro.response?.status === 409) {
        setPrevia(null);
        recursosApi
          .excluirEmLote({ ...pedido, previa: true })
          .then(setPrevia)
          .catch((outro) => setFalha(formatApiError(outro)));
      }
    } finally {
      setExcluindo(false);
    }
  };

  const nada = previa !== null && previa.excluidos === 0;

  return (
    <Dialog open={Boolean(pedido)} onOpenChange={(aberto: boolean) => !aberto && !excluindo && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Excluir recursos</DialogTitle>
          <DialogDescription>Excluir {descricao}. Recurso em uso em alguma instrução não sai: desative-o ou troque-o na instrução antes.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          {!previa && !falha && (
            <p className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Conferindo o que sai...
            </p>
          )}
          {falha && <p className="text-destructive">Não foi possível conferir: {falha}</p>}
          {previa && (
            <>
              <p>
                {nada ? (
                  'Nenhum recurso a excluir.'
                ) : (
                  <>
                    Saem <span className="font-semibold">{recursos(previa.excluidos)}</span>
                    {previa.nomes.length > 0 && <span className="text-muted-foreground">: {previa.nomes.join(', ')}{previa.excluidos > previa.nomes.length ? ` e mais ${previa.excluidos - previa.nomes.length}` : ''}.</span>}
                  </>
                )}
              </p>
              {previa.em_uso.length > 0 && (
                <div className="space-y-1">
                  <p className="text-muted-foreground">
                    {recursos(previa.em_uso.length)} {previa.em_uso.length === 1 ? 'fica' : 'ficam'} por estar em uso:
                  </p>
                  <ul className="max-h-40 space-y-0.5 overflow-y-auto text-xs text-muted-foreground">
                    {previa.em_uso.map((r) => (
                      <li key={r.id}>
                        {r.nome} ({r.instrucoes} {r.instrucoes === 1 ? 'instrução' : 'instruções'})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={excluindo}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={() => void excluir()} disabled={!previa || nada || excluindo}>
            {excluindo && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {previa && !nada ? `Excluir ${recursos(previa.excluidos)}` : 'Excluir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
