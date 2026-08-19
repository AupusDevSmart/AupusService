// src/features/instrucoes/components/InstrucoesModal.tsx
import { useEffect, useMemo, useState } from 'react';
import { BaseModal } from '@aupus/shared-pages';
import { FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  /** Ausente, o botão de excluir não aparece. */
  onExcluir?: (instrucao: InstrucaoApiResponse) => Promise<void>;
}

export function InstrucoesModal({
  isOpen,
  mode,
  entity,
  formFields,
  onClose,
  onSubmit,
  onFilesChange,
  onExcluir
}: InstrucoesModalProps) {
  /**
   * Confirmação em dois toques, no lugar de um diálogo.
   *
   * O AupusService não tem `alert-dialog` entre os componentes de UI, e o
   * `confirm` nativo destoa do resto. Dois toques resolvem: o primeiro troca o
   * botão pelo par confirmar/desistir, e sair do modal zera o estado — ninguém
   * volta e encontra a exclusão armada.
   */
  const [confirmando, setConfirmando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setConfirmando(false);
      setExcluindo(false);
    }
  }, [isOpen]);

  const excluir = async () => {
    if (!entity || !onExcluir) return;
    try {
      setExcluindo(true);
      await onExcluir(entity);
    } finally {
      setExcluindo(false);
      setConfirmando(false);
    }
  };

  const acaoExcluir =
    mode === 'edit' && entity && onExcluir ? (
      confirmando ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            Excluir <span className="font-medium text-foreground">{entity.tag}</span>?
            {typeof entity.total_tarefas_derivadas === 'number' &&
              entity.total_tarefas_derivadas > 0 && (
                <>
                  {' '}
                  {entity.total_tarefas_derivadas} tarefa
                  {entity.total_tarefas_derivadas !== 1 ? 's' : ''} usa
                  {entity.total_tarefas_derivadas !== 1 ? 'm' : ''} esta instrução e
                  ficará{entity.total_tarefas_derivadas !== 1 ? 'm' : ''} sem conteúdo.
                </>
              )}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="destructive"
              className="flex-1"
              disabled={excluindo}
              onClick={excluir}
            >
              {excluindo ? 'Excluindo...' : 'Confirmar exclusão'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              disabled={excluindo}
              onClick={() => setConfirmando(false)}
            >
              Manter
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="ghost"
          className="w-full flex items-center gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => setConfirmando(true)}
        >
          <Trash2 className="h-4 w-4" />
          Excluir instrução
        </Button>
      )
    ) : undefined;

  const getModalTitle = () => {
    const titles = {
      create: 'Nova Instrução',
      edit: 'Editar Instrução',
      view: 'Visualizar Instrução'
    };
    return titles[mode] || 'Instrução';
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
      acaoDestrutiva={acaoExcluir}
      width="w-[900px]"
      groups={[
        {
          key: 'informacoes_basicas',
          title: 'Informações Básicas',
          // Status logo apos a descricao: e informacao do cabecalho da
          // instrucao, nao um apendice no fim do formulario.
          fields: ['tag', 'nome', 'descricao']
        },
        {
          key: 'classificacao',
          title: 'Classificação',
          fields: ['categoria', 'tipo_manutencao', 'criticidade', 'condicao_ativo']
        },
        {
          key: 'planejamento',
          title: 'Planejamento',
          fields: ['duracao_estimada', 'tempo_estimado']
        },
        {
          // 'main' e a unica chave cujo titulo o BaseForm nao renderiza. As
          // duas tabelas titulam a si mesmas, com o botao de adicionar na
          // mesma linha do titulo.
          key: 'main',
          title: '',
          fields: ['sub_instrucoes', 'recursos']
        }
      ]}
    >
      {isOpen && (
        <div className="mt-4 border-t pt-4">
          <h3 className="text-sm font-medium mb-2">Anexos</h3>
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
