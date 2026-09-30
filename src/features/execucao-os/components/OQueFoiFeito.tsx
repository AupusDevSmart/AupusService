// src/features/execucao-os/components/OQueFoiFeito.tsx
import { useState } from 'react';
import { Check, CircleDashed, Loader2, Undo2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { execucaoOSApi } from '@/services/execucao-os.service';
import { toast } from '@/hooks/use-toast';
import { formatApiError } from '@/utils/api-error';
import {
  aplicarItem,
  aplicarStatusDaTarefa,
  type ItemDoChecklist,
  type ProgressoDaExecucao,
  type TarefaDaExecucao,
} from '../utils/progresso-da-execucao';

interface OQueFoiFeitoProps {
  osId: string;
  progresso: ProgressoDaExecucao;
  /** OS em execução/pausada e usuário pode mexer; senão, só leitura */
  editavel: boolean;
  onChange: (progresso: ProgressoDaExecucao) => void;
}

/**
 * Onde a equipe marca o que fez, enquanto faz (docs/SPEC-EXECUCAO-DA-OS.md).
 *
 * Antes não existia: o checklist era gerado e nunca aparecia para marcar, e
 * nenhuma tarefa era concluída pela tela — a OS de plano finalizava com tudo
 * PENDENTE, o plano não registrava a execução e o cron gerava o mesmo ciclo de
 * novo.
 *
 * Cada item grava na hora. A tarefa é marcada como feita com um clique, liberado
 * quando os itens obrigatórios dela estão marcados (D1). A que não der para
 * fazer recebe o motivo ao executar a OS (D2).
 */
export function OQueFoiFeito({ osId, progresso, editavel, onChange }: OQueFoiFeitoProps) {
  const [ocupado, setOcupado] = useState<string | null>(null);

  const feitas = progresso.tarefas.filter((t) => t.status === 'CONCLUIDA').length;
  const naoFeitas = progresso.tarefas.filter((t) => t.status === 'CANCELADA').length;

  const marcarItem = async (item: ItemDoChecklist, concluida: boolean) => {
    const antes = progresso;
    onChange(aplicarItem(progresso, item.id, concluida));
    try {
      await execucaoOSApi.atualizarChecklist(osId, [{ id: item.id, concluida }]);
    } catch (error) {
      onChange(antes);
      toast({ title: 'Não foi possível salvar o item', description: formatApiError(error), variant: 'destructive' });
    }
  };

  const mudarTarefa = async (tarefa: TarefaDaExecucao, acao: 'concluir' | 'desfazer') => {
    setOcupado(tarefa.id);
    try {
      if (acao === 'concluir') {
        await execucaoOSApi.concluirTarefa(osId, tarefa.id);
        onChange(aplicarStatusDaTarefa(progresso, tarefa.id, 'CONCLUIDA'));
      } else {
        await execucaoOSApi.reabrirTarefa(osId, tarefa.id);
        onChange(aplicarStatusDaTarefa(progresso, tarefa.id, 'PENDENTE'));
      }
    } catch (error) {
      toast({ title: 'Não foi possível atualizar a tarefa', description: formatApiError(error), variant: 'destructive' });
    } finally {
      setOcupado(null);
    }
  };

  const linhaDeItem = (item: ItemDoChecklist, travado: boolean) => (
    <label key={item.id} className="flex items-start gap-2 py-1 text-sm">
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 rounded border-border"
        checked={item.concluida}
        disabled={!editavel || travado}
        onChange={(e) => marcarItem(item, e.target.checked)}
        aria-label={item.texto}
      />
      <span className={item.concluida ? 'text-muted-foreground line-through' : 'text-foreground'}>
        {item.texto}
        {item.obrigatoria && <span className="ml-1 text-xs text-muted-foreground">(obrigatório)</span>}
      </span>
    </label>
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium">O que foi feito</h3>
        {progresso.tarefas.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {feitas} de {progresso.tarefas.length} tarefa{progresso.tarefas.length === 1 ? '' : 's'} feita{feitas === 1 ? '' : 's'}
            {naoFeitas > 0 && ` · ${naoFeitas} não feita${naoFeitas === 1 ? '' : 's'}`}
          </span>
        )}
      </div>

      {progresso.tarefas.map((tarefa) => {
        const pendente = tarefa.status === 'PENDENTE';
        return (
          <div key={tarefa.id} className="rounded-md border p-3 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                {tarefa.status === 'CONCLUIDA' ? (
                  <Check className="h-4 w-4 shrink-0 text-foreground" aria-hidden />
                ) : tarefa.status === 'CANCELADA' ? (
                  <X className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                ) : (
                  <CircleDashed className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                )}
                <span className="truncate text-sm font-medium">{tarefa.nome}</span>
                <Badge variant="outline" className="shrink-0 text-[11px]">
                  {tarefa.status === 'CONCLUIDA' ? 'Feita' : tarefa.status === 'CANCELADA' ? 'Não feita' : 'Pendente'}
                </Badge>
              </div>

              {editavel && (
                pendente ? (
                  <Button
                    type="button"
                    size="sm"
                    disabled={tarefa.obrigatoriosPendentes > 0 || ocupado === tarefa.id}
                    onClick={() => mudarTarefa(tarefa, 'concluir')}
                    aria-label={`Marcar "${tarefa.nome}" como feita`}
                    title={
                      tarefa.obrigatoriosPendentes > 0
                        ? 'Marque os itens obrigatórios antes'
                        : 'Marcar a tarefa como feita'
                    }
                  >
                    {ocupado === tarefa.id ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Check className="h-4 w-4 mr-1.5" />}
                    Feita
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={ocupado === tarefa.id}
                    onClick={() => mudarTarefa(tarefa, 'desfazer')}
                    aria-label={`Desfazer "${tarefa.nome}"`}
                  >
                    <Undo2 className="h-4 w-4 mr-1.5" />
                    Desfazer
                  </Button>
                )
              )}
            </div>

            {tarefa.status === 'CANCELADA' && tarefa.motivo && (
              <p className="text-sm text-muted-foreground">
                Motivo: <span className="text-foreground">{tarefa.motivo}</span>
              </p>
            )}

            {tarefa.itens.length > 0 && (
              <div className="pl-6">
                {tarefa.itens.map((item) => linhaDeItem(item, !pendente))}
              </div>
            )}

            {editavel && pendente && tarefa.obrigatoriosPendentes > 0 && (
              <p className="pl-6 text-xs text-muted-foreground">
                Falta{tarefa.obrigatoriosPendentes === 1 ? '' : 'm'} {tarefa.obrigatoriosPendentes} item
                {tarefa.obrigatoriosPendentes === 1 ? '' : 's'} obrigatório{tarefa.obrigatoriosPendentes === 1 ? '' : 's'}.
              </p>
            )}
          </div>
        );
      })}

      {progresso.gerais.length > 0 && (
        <div className="rounded-md border p-3">
          <p className="mb-1 text-sm font-medium">Segurança e encerramento</p>
          {progresso.gerais.map((item) => linhaDeItem(item, false))}
        </div>
      )}

      {editavel && progresso.tarefas.some((t) => t.status === 'PENDENTE') && (
        <p className="text-xs text-muted-foreground">
          Tarefa que não der para fazer: o motivo é pedido ao executar a OS, e ela volta para a agenda.
        </p>
      )}
    </div>
  );
}
