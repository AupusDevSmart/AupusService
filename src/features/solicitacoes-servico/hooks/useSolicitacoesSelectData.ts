// src/features/solicitacoes-servico/hooks/useSolicitacoesSelectData.ts
import { useState, useEffect } from 'react';
import selectDataCache from '../services/selectDataCache';

export function useSolicitacoesSelectData() {
  const [, forceUpdate] = useState({});
  const [loading, setLoading] = useState(false);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    // Carregar dados se ainda não foram carregados
    selectDataCache.loadData();

    // Se inscrever para mudanças
    const unsubscribe = selectDataCache.subscribe(() => {
      setLoading(selectDataCache.isLoading());
      forceUpdate({});
    });

    // Atualizar loading state inicial
    setLoading(selectDataCache.isLoading());

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    proprietarios: selectDataCache.getProprietarios(),
    plantas: selectDataCache.getPlantasOptions.bind(selectDataCache),
    unidades: selectDataCache.getUnidadesOptions.bind(selectDataCache),
    loading: loading,
    error,
    refetch: {
      proprietarios: () => selectDataCache.loadData(),
      plantas: () => selectDataCache.loadData(),
      unidades: () => selectDataCache.loadData(),
    },
  };
}