// src/features/planos-manutencao/components/PlanosModal.tsx
import { useMemo } from 'react';
import { BaseModal } from '@aupus/shared-pages';
import { Layers } from 'lucide-react';
import { PlanoManutencaoApiResponse } from '@/services/planos-manutencao.services';
import { FormField } from '@/types/base';

interface PlanosModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'view';
  entity: PlanoManutencaoApiResponse | null;
  formFields: FormField[];
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

/**
 * Sheet do plano: apenas os dados do plano.
 *
 * As tarefas ficam na linha expandida da tabela, nao aqui. A secao antiga
 * dentro do modal montava payload no formato pre-migracao e abria o sheet
 * completo de tarefa — dois caminhos para a mesma coisa, um deles quebrado.
 */
export function PlanosModal({
  isOpen,
  mode,
  entity,
  formFields,
  onClose,
  onSubmit,
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
      icon={<Layers className="h-5 w-5 text-muted-foreground" />}
      formFields={formFields}
      onClose={onClose}
      onSubmit={onSubmit}
      width="w-[700px]"
      groups={[
        {
          key: 'informacoes_basicas',
          title: 'Informações Básicas',
          // O grupo lista as chaves explicitamente: campo fora daqui nao
          // renderiza.
          fields: ['categoria_id', 'nome', 'descricao', 'versao']
        }
      ]}
    />
  );
}
