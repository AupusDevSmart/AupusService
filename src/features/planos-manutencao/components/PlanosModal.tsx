// src/features/planos-manutencao/components/PlanosModal.tsx
import { useMemo } from 'react';
import { BaseModal } from '@aupus/shared-pages';
import { Layers } from 'lucide-react';
import { PlanoManutencaoApiResponse } from '@/services/planos-manutencao.services';
import { FormField } from '@/types/base';
import { TarefasViewSection } from './TarefasViewSection';

interface PlanosModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'view';
  entity: PlanoManutencaoApiResponse | null;
  formFields: FormField[];
  tarefas: any[];
  carregandoTarefas: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  onEditTarefa?: (tarefa: any) => void;
  onDeleteTarefa?: (tarefa: any) => void;
  onAddTarefa?: () => void;
}

export function PlanosModal({
  isOpen,
  mode,
  entity,
  formFields,
  tarefas,
  carregandoTarefas,
  onClose,
  onSubmit,
  onEditTarefa,
  onDeleteTarefa,
  onAddTarefa,
}: PlanosModalProps) {
  const getModalTitle = () => {
    const titles = {
      create: 'Novo Plano de Manutenção',
      edit: 'Editar Plano de Manutenção',
      view: 'Visualizar Plano de Manutenção'
    };
    return titles[mode] || 'Plano de Manutenção';
  };

  const modalEntity = useMemo(() => {
    if (mode === 'create') {
      return {
        id: '',
        equipamento_id: '',
        nome: '',
        descricao: '',
        versao: '1.0',
        status: 'ATIVO',
        data_vigencia_inicio: '',
        data_vigencia_fim: '',
        observacoes: '',
        criado_por: '',
        planta_equipamento: {
          planta_id: '',
          equipamento_id: ''
        }
      };
    }

    if (entity) {
      // Extrair planta, unidade e equipamento da estrutura aninhada
      const unidade = (entity.equipamento as any)?.unidade;
      const planta = unidade?.planta || entity.equipamento?.planta;
      const plantaId = planta?.id?.trim() || '';
      const unidadeId = unidade?.id?.trim() || '';
      const equipamentoId = entity.equipamento_id?.trim() || '';

      return {
        ...entity,
        // Mapear datas (tratar null)
        data_vigencia_inicio: entity.data_vigencia_inicio
          ? new Date(entity.data_vigencia_inicio).toISOString().split('T')[0]
          : '',
        data_vigencia_fim: entity.data_vigencia_fim
          ? new Date(entity.data_vigencia_fim).toISOString().split('T')[0]
          : '',

        // Campo para o controlador planta/equipamento
        planta_equipamento: {
          planta_id: plantaId,
          unidade_id: unidadeId,
          equipamento_id: equipamentoId,
          // Dados para exibição no view
          planta_nome: planta?.nome || '',
          unidade_nome: unidade?.nome || '',
          equipamento_nome: entity.equipamento?.nome || '',
          equipamento_tipo:
            (entity.equipamento as any)?.tipo_equipamento || (entity.equipamento as any)?.tipo || ''
        }
      };
    }

    // Fallback
    return {
      id: '',
      equipamento_id: '',
      nome: '',
      descricao: '',
      versao: '1.0',
      status: 'ATIVO',
      data_vigencia_inicio: '',
      data_vigencia_fim: '',
      observacoes: '',
      criado_por: '',
      planta_equipamento: {
        planta_id: '',
        equipamento_id: ''
      }
    };
  }, [entity, mode]);

  return (
    <BaseModal
      isOpen={isOpen}
      mode={mode}
      entity={modalEntity as any}
      title={getModalTitle()}
      icon={<Layers className="h-5 w-5 text-blue-600" />}
      formFields={formFields}
      onClose={onClose}
      onSubmit={onSubmit}
      width="w-[1200px]"
      groups={[
        {
          key: 'informacoes_basicas',
          title: 'Informações Básicas',
          fields: ['planta_equipamento', 'nome', 'descricao', 'versao']
        },
        {
          key: 'configuracoes',
          title: 'Configurações',
          fields: ['status', 'data_vigencia_inicio', 'data_vigencia_fim', 'observacoes']
        }
      ]}
    >
      {/* Seção de Tarefas */}
      <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
        {carregandoTarefas ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-gray-600 dark:text-gray-400">Carregando tarefas...</span>
          </div>
        ) : (
          <TarefasViewSection
            tarefas={tarefas}
            mode={mode === 'view' ? 'view' : 'edit'}
            onEditTarefa={onEditTarefa}
            onDeleteTarefa={onDeleteTarefa}
            onAddTarefa={onAddTarefa}
          />
        )}
      </div>
    </BaseModal>
  );
}
