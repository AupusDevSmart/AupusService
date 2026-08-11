// src/features/planos-manutencao/components/PlanoDoEquipamentoWrapper.tsx
import React from 'react';
import { TarefasDoEquipamentoSection } from './TarefasDoEquipamentoSection';
import { InstrucoesModal } from '@/features/instrucoes/components/InstrucoesModal';
import { instrucoesFormFields } from '@/features/instrucoes/config/form-config';
import { InstrucoesApiService, type InstrucaoApiResponse } from '@/services/instrucoes.services';
import type { TarefaApiResponse } from '@/services/tarefas.services';
import { toast } from '@/hooks/use-toast';
import { formatApiError } from '@/utils/api-error';

const instrucoesApi = new InstrucoesApiService();

interface PlanoDoEquipamentoWrapperProps {
  equipamentoId: string;
  classificacao?: string;
  somenteLeitura?: boolean;
}

/**
 * Junta a secao de tarefas com o sheet de instrucao.
 *
 * O sheet da instrucao vive aqui e nao dentro da secao porque a secao e
 * renderizada dentro do sheet do equipamento (via slot do shared-pages), e
 * modal dentro de modal precisa do controle no nivel de cima.
 */
export function PlanoDoEquipamentoWrapper(props: PlanoDoEquipamentoWrapperProps) {
  const [instrucao, setInstrucao] = React.useState<InstrucaoApiResponse | null>(null);

  const abrirInstrucao = async (tarefa: TarefaApiResponse) => {
    const instrucaoId = tarefa.instrucao_id?.trim();
    if (!instrucaoId) {
      toast({ title: 'Esta tarefa não tem instrução vinculada', variant: 'destructive' });
      return;
    }

    try {
      setInstrucao(await instrucoesApi.findOne(instrucaoId));
    } catch (error) {
      toast({
        title: 'Erro ao carregar a instrução',
        description: formatApiError(error),
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <TarefasDoEquipamentoSection {...props} onVerInstrucao={abrirInstrucao} />

      <InstrucoesModal
        isOpen={!!instrucao}
        mode="view"
        entity={instrucao}
        formFields={instrucoesFormFields}
        onClose={() => setInstrucao(null)}
        onSubmit={async () => {}}
        onFilesChange={() => {}}
      />
    </>
  );
}
