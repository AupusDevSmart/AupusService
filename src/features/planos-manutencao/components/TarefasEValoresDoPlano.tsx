// src/features/planos-manutencao/components/TarefasEValoresDoPlano.tsx
import { formatCurrency } from '@/lib/utils';
import type { PlanoManutencaoApiResponse, TarefaResumoDto } from '@/services/planos-manutencao.services';
import { ROTULO_FREQUENCIA } from '../utils/frequencia';

/**
 * As tarefas do plano, o valor de cada uma e o valor do plano, dentro do sheet.
 *
 * O valor da tarefa e o da instrucao dela pelo cadastro (a mesma conta da proposta
 * e da OS) e o do plano e a soma das tarefas ATIVAS, uma execucao de cada: nao e o
 * custo por ano, que depende de quantas vezes cada tarefa roda. Quem le precisa
 * saber disso, entao a legenda abaixo do total diz.
 *
 * APRESENTACIONAL: le o plano que o sheet ja carregou com as tarefas
 * (`getPlano(id, true)`); nao busca nada.
 */

interface TarefasEValoresDoPlanoProps {
  plano: PlanoManutencaoApiResponse | null | undefined;
}

const rotuloDaFrequencia = (tarefa: TarefaResumoDto): string => {
  if (!tarefa.frequencia) return '-';
  if (tarefa.frequencia === 'PERSONALIZADA') {
    return tarefa.frequencia_personalizada ? `A cada ${tarefa.frequencia_personalizada} dias` : 'Personalizada';
  }
  return ROTULO_FREQUENCIA[tarefa.frequencia] ?? tarefa.frequencia;
};

export function TarefasEValoresDoPlano({ plano }: TarefasEValoresDoPlanoProps) {
  const tarefas = plano?.tarefas;

  // Sem a lista (a busca do plano falhou e o sheet abriu com a linha da tabela),
  // "nenhuma tarefa" seria mentira: o plano pode ter dez.
  if (!tarefas) {
    return (
      <p className="text-sm text-muted-foreground">Não foi possível carregar as tarefas deste plano. Feche e abra o plano de novo.</p>
    );
  }

  if (tarefas.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Este plano ainda não tem tarefas. Cadastre-as na linha do plano, na tabela.
      </p>
    );
  }

  const semPreco = plano?.tarefas_sem_preco ?? 0;
  const ativas = tarefas.filter((t) => t.ativo !== false).length;

  return (
    <div>
      {/* Larguras e visibilidade iguais as das celulas: a legenda cai sobre o dado que nomeia */}
      <div className="flex items-center gap-3 pb-1.5 text-[11px] uppercase tracking-wide text-muted-foreground/70">
        <div className="min-w-0 flex-1">Tarefa</div>
        <div className="hidden sm:block w-28 flex-shrink-0">Frequência</div>
        <div className="w-28 flex-shrink-0 text-right">Valor</div>
      </div>

      <div className="divide-y border-t">
        {tarefas.map((tarefa) => {
          const inativa = tarefa.ativo === false;
          return (
            <div key={tarefa.id} className={`flex items-start gap-3 py-2 ${inativa ? 'opacity-60' : ''}`}>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground truncate" title={tarefa.nome}>
                  {tarefa.nome}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {[
                    tarefa.tag,
                    tarefa.instrucao_codigo && tarefa.instrucao_nome
                      ? `${tarefa.instrucao_codigo} - ${tarefa.instrucao_nome}`
                      : (tarefa.instrucao_nome ?? 'Sem instrução'),
                    inativa ? 'inativa' : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>

              <div className="hidden sm:block w-28 flex-shrink-0 text-xs text-muted-foreground pt-0.5">
                {rotuloDaFrequencia(tarefa)}
              </div>

              <div className="w-28 flex-shrink-0 text-right">
                {typeof tarefa.valor === 'number' ? (
                  <>
                    <p className="text-sm tabular-nums">{formatCurrency(tarefa.valor)}</p>
                    {tarefa.valor_sem_preco && (
                      <p
                        className="text-[11px] text-muted-foreground"
                        title="A instrução tem item sem preço no cadastro: este valor está abaixo do custo."
                      >
                        item sem preço
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground" title="A tarefa não tem instrução vinculada, então não há custo a somar.">
                    -
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3 border-t pt-3">
        <div className="min-w-0 flex-1 text-sm font-semibold text-foreground">Valor total do plano</div>
        <div className="w-28 flex-shrink-0 text-right text-sm font-semibold tabular-nums">
          {formatCurrency(plano?.valor_total ?? 0)}
        </div>
      </div>

      <p className="pt-2 text-xs text-muted-foreground">
        Soma de uma execução de cada uma das {ativas} {ativas === 1 ? 'tarefa ativa' : 'tarefas ativas'}, pelo valor da
        instrução no cadastro.
        {semPreco > 0 &&
          ` ${semPreco} ${semPreco === 1 ? 'tarefa tem' : 'tarefas têm'} instrução com item sem preço: o total pode estar abaixo do custo.`}
      </p>
    </div>
  );
}
