// src/features/tarefas/components/TarefasModal.tsx
import { useMemo } from 'react';
import { BaseModal } from '@aupus/shared-pages';
import { Tag } from 'lucide-react';
import { TarefaApiResponse } from '@/services/tarefas.services';
import { AnexosManager } from './AnexosManager';
import { FormField } from '@/types/base';

interface TarefasModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'view';
  entity: TarefaApiResponse | null;
  formFields: FormField[];
  pendingFiles: File[];
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  onFilesChange: (files: File[]) => void;
}

export function TarefasModal({
  isOpen,
  mode,
  entity,
  formFields,
  pendingFiles: _pendingFiles,
  onClose,
  onSubmit,
  onFilesChange
}: TarefasModalProps) {
  const getModalTitle = () => {
    const titles = {
      create: 'Nova Tarefa Manual',
      edit: 'Editar Tarefa',
      view: 'Visualizar Tarefa'
    };
    return titles[mode] || 'Tarefa';
  };

  const modalEntity = useMemo(() => {
    if (mode === 'create') {
      return {
        plano_manutencao_id: '',
        nome: '',
        descricao: '',
        categoria: 'MECANICA',
        tipo_manutencao: 'PREVENTIVA',
        frequencia: 'MENSAL',
        frequencia_personalizada: 30,
        condicao_ativo: 'PARADO',
        criticidade: '3',
        status: 'ATIVA',
        ativo: true,
        duracao_estimada: 1,
        data_ultima_execucao: new Date().toISOString().slice(0, 16),
        numero_execucoes: 0,
        sub_tarefas: [],
        recursos: []
      };
    }

    if (entity) {
      return {
        ...entity,
        criticidade: String(entity.criticidade),
        status: entity.status,
        data_ultima_execucao: entity.data_ultima_execucao
          ? new Date(entity.data_ultima_execucao).toISOString().slice(0, 16)
          : new Date().toISOString().slice(0, 16),
        numero_execucoes: entity.numero_execucoes || 0,
        sub_tarefas: entity.sub_tarefas || [],
        recursos: entity.recursos || []
      };
    }

    return entity;
  }, [entity, mode]);

  return (
    <BaseModal
      isOpen={isOpen}
      mode={mode}
      entity={modalEntity as any}
      title={getModalTitle()}
      icon={<Tag className="h-5 w-5 text-blue-600" />}
      formFields={formFields}
      onClose={onClose}
      onSubmit={onSubmit}
      width="w-[900px]"
      groups={[
        {
          key: 'informacoes_basicas',
          title: 'Informações Básicas',
          fields: ['plano_manutencao_id', 'instrucao_id', 'tag', 'nome', 'descricao']
        },
        ...(mode !== 'create'
          ? [
              {
                key: 'localizacao',
                title: 'Localização',
                fields: ['planta_id', 'equipamento_id']
              }
            ]
          : []),
        {
          key: 'classificacao',
          title: 'Classificação',
          fields: ['classificacao_grid']
        },
        {
          key: 'planejamento',
          title: 'Planejamento',
          fields: ['planejamento_grid']
        },
        {
          key: 'atividades',
          title: 'Sub-tarefas',
          fields: ['sub_tarefas']
        },
        {
          key: 'recursos',
          title: 'Recursos Necessários',
          fields: ['recursos']
        },
        {
          key: 'status',
          title: 'Status',
          fields: ['status']
        }
      ]}
    >
      {/* Seção de Anexos */}
      {isOpen && (
        <div className="mt-2">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-foreground border-b pb-2 capitalize">Anexos</h3>
          </div>
          {mode === 'create' ? (
            <AnexosManager
              tarefaId={null}
              readonly={false}
              onFilesChange={onFilesChange}
            />
          ) : (
            <AnexosManager tarefaId={entity?.id || null} readonly={mode === 'view'} />
          )}
        </div>
      )}
    </BaseModal>
  );
}
