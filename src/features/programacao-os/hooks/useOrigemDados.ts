// src/features/programacao-os/hooks/useOrigemDados.ts
import { useState, useCallback, useEffect } from 'react';
import { mockAnomalias } from '@/features/anomalias/data/mock-data';
import { mockPlanosManutencao } from '@/features/planos-manutencao/data/mock-data';

interface AnomaliaDisponivel {
  id: string;
  descricao: string;
  local: string;
  ativo: string;
  prioridade: string;
  status: string;
  data: string;
  equipamentoId: number;
  plantaId: number;
}

interface PlanoDisponivel {
  id: string;
  nome: string;
  categoria: string;
  totalTarefas: number;
  totalEquipamentos: number;
  ativo: boolean;
  tarefasTemplate: any[];
}

export const useOrigemDados = () => {
  const [loading, setLoading] = useState(false);
  const [anomaliasDisponiveis, setAnomaliasDisponiveis] = useState<AnomaliaDisponivel[]>([]);
  const [planosDisponiveis, setPlanosDisponiveis] = useState<PlanoDisponivel[]>([]);

  // Carregar anomalias disponíveis (apenas pendentes)
  const carregarAnomalias = useCallback(async () => {
    setLoading(true);
    try {
      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const anomaliasFiltradas = mockAnomalias
        .filter(anomalia => ['AGUARDANDO', 'EM_ANALISE'].includes(anomalia.status))
        .map(anomalia => ({
          id: anomalia.id,
          descricao: anomalia.descricao,
          local: anomalia.local,
          ativo: anomalia.ativo,
          prioridade: anomalia.prioridade,
          status: anomalia.status,
          data: anomalia.data,
          equipamentoId: anomalia.equipamentoId || 0,
          plantaId: anomalia.plantaId || 0
        }));
        
      setAnomaliasDisponiveis(anomaliasFiltradas);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregar planos ativos
  const carregarPlanos = useCallback(async () => {
    setLoading(true);
    try {
      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const planosFiltrados = mockPlanosManutencao
        .filter(plano => plano.ativo)
        .map(plano => ({
          id: plano.id,
          nome: plano.nome,
          categoria: plano.categoria,
          totalTarefas: plano.tarefasTemplate?.length || 0,
          totalEquipamentos: plano.totalEquipamentos || 0,
          ativo: plano.ativo,
          tarefasTemplate: plano.tarefasTemplate || []
        }));
        
      setPlanosDisponiveis(planosFiltrados);
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar anomalia por ID
  const obterAnomalia = useCallback(async (id: string): Promise<AnomaliaDisponivel | null> => {
    await carregarAnomalias();
    return anomaliasDisponiveis.find(a => a.id === id) || null;
  }, [anomaliasDisponiveis, carregarAnomalias]);

  // Buscar plano por ID
  const obterPlano = useCallback(async (id: string): Promise<PlanoDisponivel | null> => {
    await carregarPlanos();
    return planosDisponiveis.find(p => p.id === id) || null;
  }, [planosDisponiveis, carregarPlanos]);

  // Gerar tarefas baseadas em plano
  const gerarTarefasDoPlano = useCallback(async (planoId: string, equipamentosIds?: number[]) => {
    const plano = await obterPlano(planoId);
    if (!plano) return [];

    const tarefasGeradas = [];
    const equipamentosParaGerar = equipamentosIds || [1]; // Default para equipamento 1

    for (const equipamentoId of equipamentosParaGerar) {
      for (const template of plano.tarefasTemplate) {
        const tarefa = {
          id: `tarefa-${Date.now()}-${Math.random()}`,
          templateId: template.id,
          tag: `${template.tagBase}-EQ${equipamentoId}`,
          descricao: `${template.descricao} - Equipamento ${equipamentoId}`,
          categoria: template.categoria,
          tipo: template.tipoManutencao,
          frequencia: template.frequencia,
          criticidade: template.criticidade,
          duracaoEstimada: template.duracaoEstimada,
          tempoEstimado: template.tempoEstimado,
          responsavel: template.responsavelSugerido,
          observacoes: template.observacoesTemplate,
          equipamentoId,
          subTarefas: template.subTarefas || [],
          recursos: template.recursos || []
        };
        tarefasGeradas.push(tarefa);
      }
    }

    return tarefasGeradas;
  }, [obterPlano]);

  // Carregar dados iniciais
  useEffect(() => {
    carregarAnomalias();
    carregarPlanos();
  }, [carregarAnomalias, carregarPlanos]);

  return {
    loading,
    anomaliasDisponiveis,
    planosDisponiveis,
    carregarAnomalias,
    carregarPlanos,
    obterAnomalia,
    obterPlano,
    gerarTarefasDoPlano
  };
};