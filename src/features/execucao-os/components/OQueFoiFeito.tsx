// src/features/execucao-os/components/OQueFoiFeito.tsx
import { useState, type Dispatch, type SetStateAction } from 'react';
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
  type MudancaDoItem,
  type ProgressoDaExecucao,
  type TarefaDaExecucao,
} from '../utils/progresso-da-execucao';
import { LeituraDoItem } from './LeituraDoItem';
import { FotosDoItem } from './FotosDoItem';
import { ehFoto, useAnexosDaOS } from '../hooks/useAnexosDaOS';
import { tipoSugerido } from '../utils/anexos-da-os';
import type { AnexoOS } from '../types';

interface OQueFoiFeitoProps {
  osId: string;
  /** O status da OS, para o tipo da foto (durante, depois) */
  status?: string;
  progresso: ProgressoDaExecucao;
  /** OS em execução/pausada e usuário pode mexer; senão, só leitura */
  editavel: boolean;
  /** Com função de atualização: cada gravação mexe só no item dela, mesmo com outra no ar */
  onChange: Dispatch<SetStateAction<ProgressoDaExecucao>>;
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
export function OQueFoiFeito({ osId, status, progresso, editavel, onChange }: OQueFoiFeitoProps) {
  const [ocupado, setOcupado] = useState<string | null>(null);
  // As fotos de cada item e de cada tarefa (SN-59), da mesma consulta da seção de anexos
  const { data: anexos = [], isLoading: carregandoFotos, isError: erroNasFotos, refetch: buscarFotosDeNovo } = useAnexosDaOS(osId);
  const doItem = (id: string) => anexos.filter((a) => a.checklist_item_id?.trim() === id);
  const daTarefa = (id: string) => anexos.filter((a) => !a.checklist_item_id && a.tarefa_os_id?.trim() === id);
  const semFoto = (item: ItemDoChecklist, fotos: AnexoOS[]) => item.exigeFoto && !fotos.some(ehFoto);
  const tipoDaFoto = tipoSugerido(status);

  const feitas = progresso.tarefas.filter((t) => t.status === 'CONCLUIDA').length;
  const naoFeitas = progresso.tarefas.filter((t) => t.status === 'CANCELADA').length;

  // Verificação manda se foi feito; leitura manda o valor (e a observação), e a
  // API marca pelo valor — a mesma conta do aplicarItem (SN-58)
  const gravarItem = async (item: ItemDoChecklist, mudanca: MudancaDoItem) => {
    // Só os campos que este pedido muda voltam no erro: desfazer o progresso
    // inteiro apagava da tela o que outro pedido, já salvo, tinha mudado
    const antes = Object.fromEntries(
      (Object.keys(mudanca) as Array<keyof MudancaDoItem>).map((campo) => [campo, item[campo]]),
    ) as MudancaDoItem;
    onChange((p) => aplicarItem(p, item.id, mudanca));
    const pedido =
      item.tipo === 'LEITURA'
        ? {
            id: item.id,
            ...(mudanca.valorLido !== undefined && { valor_lido: mudanca.valorLido }),
            ...(mudanca.observacao !== undefined && { observacoes: mudanca.observacao }),
          }
        : { id: item.id, concluida: Boolean(mudanca.concluida) };
    try {
      await execucaoOSApi.atualizarChecklist(osId, [pedido]);
    } catch (error) {
      onChange((p) => aplicarItem(p, item.id, antes));
      toast({ title: 'Não foi possível salvar o item', description: formatApiError(error), variant: 'destructive' });
    }
  };

  const mudarTarefa = async (tarefa: TarefaDaExecucao, acao: 'concluir' | 'desfazer') => {
    setOcupado(tarefa.id);
    try {
      if (acao === 'concluir') {
        await execucaoOSApi.concluirTarefa(osId, tarefa.id);
        onChange((p) => aplicarStatusDaTarefa(p, tarefa.id, 'CONCLUIDA'));
      } else {
        await execucaoOSApi.reabrirTarefa(osId, tarefa.id);
        onChange((p) => aplicarStatusDaTarefa(p, tarefa.id, 'PENDENTE'));
      }
    } catch (error) {
      toast({ title: 'Não foi possível atualizar a tarefa', description: formatApiError(error), variant: 'destructive' });
    } finally {
      setOcupado(null);
    }
  };

  // A câmera ao lado do item e as fotos debaixo dele. O item que exige foto
  // espera a foto para ser marcado (a API recusa sem); desmarcar fica livre
  const linhaDeItem = (item: ItemDoChecklist, travado: boolean) => {
    const fotos = doItem(item.id);
    // Travado também enquanto as fotos não chegam (a API recusaria sem foto); o
    // texto diz o porquê de verdade
    const bloqueio = !semFoto(item, fotos)
      ? null
      : carregandoFotos
        ? 'Carregando as fotos do item'
        : erroNasFotos
          ? 'Não foi possível carregar as fotos do item'
          : 'Tire a foto do item antes de marcá-lo';
    return (
      <div key={item.id} className="flex flex-wrap items-start justify-between gap-x-3">
        <div className="min-w-0 flex-1">
          {item.tipo === 'LEITURA' ? (
            <LeituraDoItem item={item} editavel={editavel && !travado} onGravar={(m) => gravarItem(item, m)} bloqueio={bloqueio} />
          ) : (
            <label className="flex items-start gap-2 py-1 text-sm" title={!item.concluida ? (bloqueio ?? undefined) : undefined}>
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-border"
                checked={item.concluida}
                disabled={!editavel || travado || (!item.concluida && !!bloqueio)}
                onChange={(e) => gravarItem(item, { concluida: e.target.checked })}
                aria-label={item.texto}
              />
              <span className={item.concluida ? 'text-muted-foreground line-through' : 'text-foreground'}>
                {item.texto}
                {item.obrigatoria && <span className="ml-1 text-xs text-muted-foreground">(obrigatório)</span>}
              </span>
            </label>
          )}
        </div>
        <div className="py-1">
          <FotosDoItem
            osId={osId}
            destino={{ checklist_item_id: item.id }}
            fotos={fotos}
            editavel={editavel && !travado}
            tipo={tipoDaFoto}
            rotulo={`o item ${item.texto}`}
            exigeFoto={item.exigeFoto}
            carregando={carregandoFotos}
          />
        </div>
      </div>
    );
  };

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

      {erroNasFotos && (
        <p className="text-xs text-muted-foreground">
          Não foi possível carregar as fotos.{' '}
          <button type="button" className="underline" onClick={() => buscarFotosDeNovo()}>
            Tentar de novo
          </button>
        </p>
      )}

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
                {/* Não vem do plano: feita ou não, não mexe na agenda de tarefa nenhuma */}
                {tarefa.instrucaoAvulsa && <span className="shrink-0 text-xs text-muted-foreground">instrução</span>}
                <Badge variant="outline" className="shrink-0 text-[11px]">
                  {tarefa.status === 'CONCLUIDA' ? 'Feita' : tarefa.status === 'CANCELADA' ? 'Não feita' : 'Pendente'}
                </Badge>
              </div>

              {editavel && (
                pendente ? (
                  <Button
                    type="button"
                    size="sm"
                    disabled={tarefa.obrigatoriosPendentes > 0 || tarefa.leiturasSemExplicacao > 0 || ocupado === tarefa.id}
                    onClick={() => mudarTarefa(tarefa, 'concluir')}
                    aria-label={`Marcar "${tarefa.nome}" como feita`}
                    title={
                      tarefa.obrigatoriosPendentes > 0
                        ? 'Marque os itens obrigatórios antes'
                        : tarefa.leiturasSemExplicacao > 0
                          ? 'Explique a leitura fora da faixa antes'
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

            {(editavel || daTarefa(tarefa.id).length > 0) && (
              <div className="flex flex-wrap items-center gap-2 pl-6">
                <span className="text-xs text-muted-foreground">Fotos da tarefa</span>
                <FotosDoItem
                  osId={osId}
                  destino={{ tarefa_os_id: tarefa.id }}
                  fotos={daTarefa(tarefa.id)}
                  editavel={editavel}
                  tipo={tipoDaFoto}
                  rotulo={`a tarefa ${tarefa.nome}`}
                />
              </div>
            )}

            {editavel && pendente && tarefa.obrigatoriosPendentes > 0 && (
              <p className="pl-6 text-xs text-muted-foreground">
                {tarefa.obrigatoriosPendentes === 1
                  ? 'Falta 1 item obrigatório.'
                  : `Faltam ${tarefa.obrigatoriosPendentes} itens obrigatórios.`}
              </p>
            )}
            {editavel && pendente && tarefa.obrigatoriosPendentes === 0 && tarefa.leiturasSemExplicacao > 0 && (
              <p className="pl-6 text-xs text-muted-foreground">
                Explique na observação a leitura fora da faixa para concluir a tarefa.
              </p>
            )}
          </div>
        );
      })}

      {editavel && progresso.tarefas.some((t) => t.status === 'PENDENTE') && (
        <p className="text-xs text-muted-foreground">
          Tarefa que não der para fazer: o motivo é pedido ao executar a OS, e ela volta para a agenda.
        </p>
      )}
    </div>
  );
}
