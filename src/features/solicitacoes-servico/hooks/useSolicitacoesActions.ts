// src/features/solicitacoes-servico/hooks/useSolicitacoesActions.ts
import { useCallback } from 'react';
import { SolicitacaoServico } from '../types';

interface UseSolicitacoesActionsProps {
  openModal: (mode: 'create' | 'edit' | 'view', entity?: SolicitacaoServico) => void;
  deleteItem: (id: string) => Promise<void>;
  enviar: (id: string, observacoes?: string) => Promise<any>;
  analisar: (id: string, dto: any) => Promise<any>;
  aprovar: (id: string, dto?: any) => Promise<any>;
  rejeitar: (id: string, dto: any) => Promise<any>;
  cancelar: (id: string, dto: any) => Promise<any>;
  concluir: (id: string, dto?: any) => Promise<any>;
  onSuccess: () => void | Promise<void>;
}

export function useSolicitacoesActions({
  openModal,
  deleteItem,
  enviar,
  analisar,
  aprovar,
  rejeitar,
  cancelar,
  concluir,
  onSuccess,
}: UseSolicitacoesActionsProps) {
  const handleView = useCallback(
    (solicitacao: SolicitacaoServico) => {
      openModal('view', solicitacao);
    },
    [openModal]
  );

  const handleEdit = useCallback(
    (solicitacao: SolicitacaoServico) => {
      // Apenas rascunhos podem ser editados
      if (solicitacao.status !== 'RASCUNHO') {
        alert(
          `Não é possível editar uma solicitação com status "${solicitacao.status}". ` +
            'Apenas solicitações em "RASCUNHO" podem ser editadas.'
        );
        return;
      }
      openModal('edit', solicitacao);
    },
    [openModal]
  );

  const handleDelete = useCallback(
    async (solicitacao: SolicitacaoServico) => {
      // Apenas rascunhos e canceladas podem ser deletados
      if (solicitacao.status !== 'RASCUNHO' && solicitacao.status !== 'CANCELADA') {
        alert(
          `Não é possível excluir uma solicitação com status "${solicitacao.status}". ` +
            'Apenas solicitações em "RASCUNHO" ou "CANCELADA" podem ser excluídas.'
        );
        return;
      }

      const confirmDelete = confirm(
        `Tem certeza que deseja excluir a solicitação: ${solicitacao.titulo}?`
      );

      if (!confirmDelete) return;

      try {
        await deleteItem(solicitacao.id);
        await onSuccess();
      } catch (error) {
        console.error('Erro ao excluir solicitação:', error);
        alert('Erro ao excluir solicitação. Tente novamente.');
      }
    },
    [deleteItem, onSuccess]
  );

  const handleEnviar = useCallback(
    async (solicitacao: SolicitacaoServico) => {
      if (solicitacao.status !== 'RASCUNHO') {
        alert('Apenas solicitações em "RASCUNHO" podem ser enviadas para análise.');
        return;
      }

      const confirmEnviar = confirm(
        `Enviar solicitação "${solicitacao.titulo}" para análise?`
      );

      if (!confirmEnviar) return;

      try {
        await enviar(solicitacao.id);
        await onSuccess();
        alert('Solicitação enviada para análise com sucesso!');
      } catch (error) {
        console.error('Erro ao enviar solicitação:', error);
        alert('Erro ao enviar solicitação. Tente novamente.');
      }
    },
    [enviar, onSuccess]
  );

  const handleAnalisar = useCallback(
    async (solicitacao: SolicitacaoServico) => {
      if (solicitacao.status !== 'AGUARDANDO') {
        alert('Apenas solicitações "AGUARDANDO" podem ser analisadas.');
        return;
      }

      const observacoes = prompt(
        'Digite as observações da análise (obrigatório):'
      );

      if (!observacoes || observacoes.trim() === '') {
        alert('É necessário informar as observações da análise.');
        return;
      }

      try {
        await analisar(solicitacao.id, {
          observacoes_analise: observacoes,
        });
        await onSuccess();
        alert('Solicitação em análise!');
      } catch (error) {
        console.error('Erro ao analisar solicitação:', error);
        alert('Erro ao analisar solicitação. Tente novamente.');
      }
    },
    [analisar, onSuccess]
  );

  const handleAprovar = useCallback(
    async (solicitacao: SolicitacaoServico) => {
      if (solicitacao.status !== 'EM_ANALISE') {
        alert('Apenas solicitações "EM ANÁLISE" podem ser aprovadas.');
        return;
      }

      const observacoes = prompt('Observações da aprovação (opcional):');

      const confirmAprovar = confirm(
        `Aprovar solicitação "${solicitacao.titulo}"?`
      );

      if (!confirmAprovar) return;

      try {
        await aprovar(solicitacao.id, {
          observacoes_aprovacao: observacoes || undefined,
        });
        await onSuccess();
        alert('Solicitação aprovada com sucesso!');
      } catch (error) {
        console.error('Erro ao aprovar solicitação:', error);
        alert('Erro ao aprovar solicitação. Tente novamente.');
      }
    },
    [aprovar, onSuccess]
  );

  const handleRejeitar = useCallback(
    async (solicitacao: SolicitacaoServico) => {
      if (solicitacao.status !== 'EM_ANALISE') {
        alert('Apenas solicitações "EM ANÁLISE" podem ser rejeitadas.');
        return;
      }

      const motivo = prompt('Digite o motivo da rejeição (obrigatório):');

      if (!motivo || motivo.trim() === '') {
        alert('É necessário informar o motivo da rejeição.');
        return;
      }

      const sugestoes = prompt('Sugestões alternativas (opcional):');

      try {
        await rejeitar(solicitacao.id, {
          motivo_rejeicao: motivo,
          sugestoes_alternativas: sugestoes || undefined,
        });
        await onSuccess();
        alert('Solicitação rejeitada.');
      } catch (error) {
        console.error('Erro ao rejeitar solicitação:', error);
        alert('Erro ao rejeitar solicitação. Tente novamente.');
      }
    },
    [rejeitar, onSuccess]
  );

  const handleCancelar = useCallback(
    async (solicitacao: SolicitacaoServico) => {
      if (
        solicitacao.status === 'CONCLUIDA' ||
        solicitacao.status === 'CANCELADA'
      ) {
        alert('Esta solicitação já foi concluída ou cancelada.');
        return;
      }

      const motivo = prompt('Digite o motivo do cancelamento (obrigatório):');

      if (!motivo || motivo.trim() === '') {
        alert('É necessário informar o motivo do cancelamento.');
        return;
      }

      try {
        await cancelar(solicitacao.id, {
          motivo_cancelamento: motivo,
        });
        await onSuccess();
        alert('Solicitação cancelada com sucesso!');
      } catch (error) {
        console.error('Erro ao cancelar solicitação:', error);
        alert('Erro ao cancelar solicitação. Tente novamente.');
      }
    },
    [cancelar, onSuccess]
  );

  const handleConcluir = useCallback(
    async (solicitacao: SolicitacaoServico) => {
      if (solicitacao.status !== 'EM_EXECUCAO') {
        alert('Apenas solicitações "EM EXECUÇÃO" podem ser concluídas.');
        return;
      }

      const observacoes = prompt('Observações da conclusão (opcional):');

      const confirmConcluir = confirm(
        `Concluir solicitação "${solicitacao.titulo}"?`
      );

      if (!confirmConcluir) return;

      try {
        await concluir(solicitacao.id, {
          observacoes_conclusao: observacoes || undefined,
        });
        await onSuccess();
        alert('Solicitação concluída com sucesso!');
      } catch (error) {
        console.error('Erro ao concluir solicitação:', error);
        alert('Erro ao concluir solicitação. Tente novamente.');
      }
    },
    [concluir, onSuccess]
  );

  return {
    handleView,
    handleEdit,
    handleDelete,
    handleEnviar,
    handleAnalisar,
    handleAprovar,
    handleRejeitar,
    handleCancelar,
    handleConcluir,
  };
}
