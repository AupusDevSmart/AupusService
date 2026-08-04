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

  // O plano e um template de categoria: nao carrega mais planta, unidade nem
  // equipamento. O vinculo com equipamento acontece no sheet do equipamento.
  const modalEntity = useMemo(() => {
    const vazio = {
      id: '',
      categoria_id: '',
      nome: '',
      descricao: '',
      versao: '1.0',
      criado_por: ''
    };

    if (mode === 'create') return vazio;

    if (entity) {
      return {
        ...entity,
        // Char(26) vem com padding do banco; sem trim o Combobox nao casa o
        // valor selecionado e renderiza vazio em edit/view.
        categoria_id: (entity.categoria_id || entity.categoria?.id || '').trim()
      };
    }

    return vazio;
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
          // O grupo lista as chaves explicitamente: campo fora daqui nao
          // renderiza. Era 'planta_equipamento' antes de o plano virar
          // template de categoria.
          fields: ['categoria_id', 'nome', 'descricao', 'versao']
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
