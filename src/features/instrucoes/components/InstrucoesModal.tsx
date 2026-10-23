// src/features/instrucoes/components/InstrucoesModal.tsx
import { useEffect, useMemo, useState } from 'react';
import { BaseModal } from '@/core';
import { FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InstrucaoApiResponse, type CreateInstrucaoApiData } from '@/services/instrucoes.services';
import { AnexosInstrucaoManager } from './AnexosInstrucaoManager';
import { FormField } from '@/types/base';

/** Os padroes de uma instrucao nova: o que o formulario precisa para abrir o cadastro. */
type SementeDaInstrucao = Pick<
  InstrucaoApiResponse,
  | 'id' | 'codigo' | 'nome' | 'descricao' | 'frente' | 'prazo_inicio_relativo' | 'duracao_dias'
  | 'status' | 'ativo' | 'sub_instrucoes' | 'recursos' | 'maquinarios'
>;

/**
 * O que o formulario entrega ao salvar. O BaseModal semeia com a instrucao
 * inteira (ou com os padroes do cadastro), entao chegam tambem os campos que so
 * o servidor gerencia — quem salva os tira antes de enviar.
 */
export type FormularioDaInstrucao = CreateInstrucaoApiData & Record<string, unknown>;

interface InstrucoesModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'view';
  entity: InstrucaoApiResponse | null;
  formFields: FormField[];
  pendingFiles?: File[];
  onClose: () => void;
  onSubmit: (data: FormularioDaInstrucao) => Promise<void>;
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
            Excluir <span className="font-medium text-foreground">{entity.codigo}</span>?
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

  const modalEntity = useMemo((): InstrucaoApiResponse | SementeDaInstrucao | null => {
    if (mode === 'create') {
      const semente: SementeDaInstrucao = {
        // Vazio, como na semente do plano: o cadastro ainda nao tem id e o
        // BaseModal pede um. Vazio ele vale como "novo", e o formulario o
        // guarda como undefined — nao vai no payload.
        id: '',
        codigo: '',
        nome: '',
        descricao: '',
        frente: null,
        prazo_inicio_relativo: 0,
        duracao_dias: 1,
        status: 'ATIVA',
        ativo: true,
        sub_instrucoes: [],
        recursos: [],
        maquinarios: []
      };
      return semente;
    }

    if (entity) {
      return {
        ...entity,
        sub_instrucoes: entity.sub_instrucoes || [],
        recursos: entity.recursos || [],
        maquinarios: entity.maquinarios || []
      };
    }

    return entity;
  }, [entity, mode]);

  return (
    <BaseModal
      isOpen={isOpen}
      mode={mode}
      entity={modalEntity}
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
          fields: ['codigo', 'nome', 'descricao']
        },
        {
          // Os campos do AupusProject (SN-85): onde a instrução entra num
          // cronograma de projeto e quanto tempo leva
          key: 'cronograma',
          title: 'Cronograma (D+X)',
          fields: ['frente', 'prazo_inicio_relativo', 'duracao_dias']
        },
        {
          // 'main' e a unica chave cujo titulo o BaseForm nao renderiza. As
          // tabelas titulam a si mesmas, com o botao de adicionar na mesma
          // linha do titulo.
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
