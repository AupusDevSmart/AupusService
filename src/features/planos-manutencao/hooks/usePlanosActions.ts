// src/features/planos-manutencao/hooks/usePlanosActions.ts
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/store/useUserStore';
import { usePlanosManutencaoApi } from './usePlanosManutencaoApi';
import { PlanoManutencaoApiResponse } from '@/services/planos-manutencao.services';

interface UsePlanosActionsParams {
  onSuccess?: () => void;
  onToggleStatus?: () => void;
}

export function usePlanosActions({ onSuccess, onToggleStatus }: UsePlanosActionsParams = {}) {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const { updateStatus, duplicarPlano, deletePlano } = usePlanosManutencaoApi();

  const handleToggleStatus = useCallback(async (plano: PlanoManutencaoApiResponse) => {
    try {
      const newStatus = plano.ativo ? 'INATIVO' : 'ATIVO';
      await updateStatus(plano.id, { status: newStatus });
      onToggleStatus?.();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      alert('Erro ao alterar status do plano.');
    }
  }, [updateStatus, onToggleStatus]);

  const handleDuplicar = useCallback(async (plano: PlanoManutencaoApiResponse) => {
    try {
      if (!user?.id) {
        alert('Erro: Usuário não autenticado. Faça login para duplicar planos.');
        return;
      }

      await duplicarPlano(plano.id, {
        equipamento_destino_id: plano.equipamento_id,
        novo_nome: `${plano.nome} - Cópia`,
        criado_por: user.id
      });
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao duplicar plano:', error);
    }
  }, [user, duplicarPlano, onSuccess]);

  const handleDelete = useCallback(async (plano: PlanoManutencaoApiResponse) => {
    if (confirm(`Tem certeza que deseja excluir o plano "${plano.nome}"?`)) {
      try {
        await deletePlano(plano.id);
        onSuccess?.();
      } catch (error) {
        console.error('Erro ao excluir plano:', error);
      }
    }
  }, [deletePlano, onSuccess]);

  const handlePlanejarOS = useCallback((plano: PlanoManutencaoApiResponse) => {
    // Lógica será tratada no componente pai com modals
    return plano;
  }, []);

  const handleAssociarEquipamentos = useCallback((plano: PlanoManutencaoApiResponse) => {
    navigate(`/planos-manutencao/associar?planoId=${plano.id}`);
  }, [navigate]);

  const handleClonarPlano = useCallback((plano: PlanoManutencaoApiResponse) => {
    navigate(`/planos-manutencao/clonar?planoId=${plano.id}`);
  }, [navigate]);

  const handleVerTarefas = useCallback((plano: PlanoManutencaoApiResponse) => {
    navigate(`/tarefas?planoId=${plano.id}`);
  }, [navigate]);

  return {
    handleToggleStatus,
    handleDuplicar,
    handleDelete,
    handlePlanejarOS,
    handleAssociarEquipamentos,
    handleClonarPlano,
    handleVerTarefas
  };
}
