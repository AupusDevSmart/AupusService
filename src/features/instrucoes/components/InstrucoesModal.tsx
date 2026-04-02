// src/features/instrucoes/components/InstrucoesModal.tsx
import { useMemo } from 'react';
import { BaseModal } from '@nexon/components/common/base-modal/BaseModal';
import { FileText } from 'lucide-react';
import { InstrucaoApiResponse } from '@/services/instrucoes.services';
import { AnexosInstrucaoManager } from './AnexosInstrucaoManager';
import { FormField } from '@/types/base';

interface InstrucoesModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'view';
  entity: InstrucaoApiResponse | null;
  formFields: FormField[];
  pendingFiles?: File[];
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  onFilesChange: (files: File[]) => void;
}

export function InstrucoesModal({
  isOpen,
  mode,
  entity,
  formFields,
  onClose,
  onSubmit,
  onFilesChange
}: InstrucoesModalProps) {
  const getModalTitle = () => {
    const titles = {
      create: 'Nova Instrucao',
      edit: 'Editar Instrucao',
      view: 'Visualizar Instrucao'
    };
    return titles[mode] || 'Instrucao';
  };

  const modalEntity = useMemo(() => {
    if (mode === 'create') {
      return {
        nome: '',
        descricao: '',
        categoria: 'MECANICA',
        tipo_manutencao: 'PREVENTIVA',
        condicao_ativo: 'PARADO',
        criticidade: '3',
        status: 'ATIVA',
        ativo: true,
        duracao_estimada: 1,
        tempo_estimado: 60,
        sub_instrucoes: [],
        recursos: []
      };
    }

    if (entity) {
      return {
        ...entity,
        criticidade: String(entity.criticidade),
        status: entity.status,
        sub_instrucoes: entity.sub_instrucoes || [],
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
      icon={<FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />}
      formFields={formFields}
      onClose={onClose}
      onSubmit={onSubmit}
      width="w-[900px]"
      groups={[
        {
          key: 'informacoes_basicas',
          title: 'Informacoes Basicas',
          fields: ['tag', 'nome', 'descricao']
        },
        {
          key: 'classificacao',
          title: 'Classificacao',
          fields: ['categoria', 'tipo_manutencao', 'criticidade', 'condicao_ativo']
        },
        {
          key: 'planejamento',
          title: 'Planejamento',
          fields: ['duracao_estimada', 'tempo_estimado']
        },
        {
          key: 'atividades',
          title: 'Sub-instrucoes',
          fields: ['sub_instrucoes']
        },
        {
          key: 'recursos',
          title: 'Recursos Necessarios',
          fields: ['recursos']
        },
        {
          key: 'observacoes',
          title: 'Observacoes & Status',
          fields: ['observacoes', 'status']
        }
      ]}
    >
      {isOpen && (
        <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Anexos</h3>
          {mode === 'create' ? (
            <AnexosInstrucaoManager
              instrucaoId={null}
              readonly={false}
              onFilesChange={onFilesChange}
            />
          ) : (
            <AnexosInstrucaoManager instrucaoId={entity?.id || null} readonly={mode === 'view'} />
          )}
        </div>
      )}
    </BaseModal>
  );
}
