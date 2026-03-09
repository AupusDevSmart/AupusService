// src/features/planos-manutencao/hooks/useTarefasPlano.ts
import { useState, useCallback } from 'react';
import { usePlanosManutencaoApi } from './usePlanosManutencaoApi';

export function useTarefasPlano() {
  const [tarefas, setTarefas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { getPlano } = usePlanosManutencaoApi();

  const carregarTarefas = useCallback(async (planoId: string) => {
    try {
      setLoading(true);
      const planoCompleto = await getPlano(planoId, true);

      if (planoCompleto.tarefas && Array.isArray(planoCompleto.tarefas)) {
        setTarefas(planoCompleto.tarefas);
      } else {
        setTarefas([]);
      }
    } catch (error) {
      console.error('Erro ao carregar tarefas do plano:', error);
      setTarefas([]);
    } finally {
      setLoading(false);
    }
  }, [getPlano]);

  const limparTarefas = useCallback(() => {
    setTarefas([]);
    setLoading(false);
  }, []);

  return {
    tarefas,
    loading,
    carregarTarefas,
    limparTarefas
  };
}
