// src/features/planos-manutencao/components/TarefasDoEquipamentoSection.tsx
import { ClipboardList } from 'lucide-react';
import { TarefasExpandedRow } from './TarefasExpandedRow';
import { usePlanoDoEquipamento } from './PlanoDoEquipamentoContext';
import type { TarefaApiResponse } from '@/services/tarefas.services';

interface TarefasDoEquipamentoSectionProps {
  equipamentoId: string;
  classificacao?: string;
  somenteLeitura?: boolean;
  /** Abre o sheet da instrução ao clicar em "ver" numa tarefa. */
  onVerInstrucao?: (tarefa: TarefaApiResponse) => void;
}

/**
 * Tarefas de manutenção deste equipamento, em seção própria.
 *
 * As tarefas são da CÓPIA do plano, não do template: a tela de planos lista só
 * templates, então sem esta seção as tarefas do equipamento — e o estado de
 * herança de cada uma — não apareceriam em lugar nenhum.
 *
 * A escolha do plano ficou em Dados Básicos (SeletorDePlanoField); as duas
 * partes dividem o mesmo estado via PlanoDoEquipamentoContext, então vincular
 * ou trocar o plano lá recarrega esta lista aqui.
 */
export function TarefasDoEquipamentoSection({
  equipamentoId,
  classificacao,
  somenteLeitura = false,
  onVerInstrucao,
}: TarefasDoEquipamentoSectionProps) {
  const { planoAtual, previa, instrucoesOptions, carregando, refreshTarefas, ehUC, recarregar } =
    usePlanoDoEquipamento(equipamentoId, classificacao);

  if (!ehUC) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <ClipboardList className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">Tarefas de Manutenção</h3>
        {planoAtual && (
          <span className="text-xs text-muted-foreground">
            {previa?.total_tarefas ?? 0} tarefa{(previa?.total_tarefas ?? 0) === 1 ? '' : 's'}
            {(previa?.tarefas_proprias ?? 0) > 0 && ` · ${previa?.tarefas_proprias} própria(s)`}
            {(previa?.tarefas_customizadas ?? 0) > 0 &&
              ` · ${previa?.tarefas_customizadas} customizada(s)`}
          </span>
        )}
      </div>

      {carregando ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : !planoAtual ? (
        <p className="text-sm text-muted-foreground">
          Nenhum plano vinculado. Escolha um plano em Dados Básicos para que as tarefas dele apareçam
          aqui.
        </p>
      ) : (
        <TarefasExpandedRow
          planoId={planoAtual.id}
          instrucoesOptions={instrucoesOptions}
          refreshToken={refreshTarefas}
          onVerTarefa={onVerInstrucao ?? (() => {})}
          onTarefasChange={recarregar}
          somenteLeitura={somenteLeitura}
          variante="sheet"
        />
      )}
    </div>
  );
}
