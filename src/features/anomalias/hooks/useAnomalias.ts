// src/features/anomalias/hooks/useAnomalias.ts
import { useState, useCallback } from 'react';
import { Anomalia, AnomaliaFormData } from '../types';
import { mockAnomalias } from '../data/mock-data';

interface UseAnomaliasReturn {
  // Estados
  loading: boolean;
  
  // Operações CRUD
  criarAnomalia: (dados: AnomaliaFormData) => Promise<Anomalia>;
  editarAnomalia: (id: string, dados: Partial<AnomaliaFormData>) => Promise<Anomalia>;
  obterAnomalia: (id: string) => Promise<Anomalia | null>;
  excluirAnomalia: (id: string) => Promise<boolean>;
  
  // Operações específicas de anomalias
  gerarOS: (anomaliaId: string) => Promise<Anomalia>;
  resolverAnomalia: (anomaliaId: string, observacoes?: string) => Promise<Anomalia>;
  cancelarAnomalia: (anomaliaId: string, motivo?: string) => Promise<Anomalia>;
  adicionarHistorico: (anomaliaId: string, acao: string, observacoes?: string) => Promise<Anomalia>;
  
  // Operações em lote
  gerarOSLote: (anomaliaIds: string[]) => Promise<Anomalia[]>;
  resolverLote: (anomaliaIds: string[], observacoes?: string) => Promise<Anomalia[]>;
  cancelarLote: (anomaliaIds: string[], motivo?: string) => Promise<Anomalia[]>;
}

export function useAnomalias(): UseAnomaliasReturn {
  const [loading, setLoading] = useState<boolean>(false);

  // Simular delay de API
  const simulateDelay = (ms: number = 1000) => 
    new Promise(resolve => setTimeout(resolve, ms));

  // Criar anomalia
  const criarAnomalia = useCallback(async (dados: AnomaliaFormData): Promise<Anomalia> => {
    setLoading(true);
    try {
      await simulateDelay();
      
      const novaAnomalia: Anomalia = {
        id: String(Date.now()),
        criadoEm: new Date().toISOString(),
        ...dados,
        data: new Date().toISOString(),
        status: 'AGUARDANDO',
        criadoPor: 'Usuário Atual',
        historico: [
          {
            id: String(Date.now()),
            acao: 'Anomalia criada',
            usuario: 'Usuário Atual',
            data: new Date().toISOString(),
          }
        ]
      };
      
      // Adicionar ao array de dados (simulação)
      mockAnomalias.unshift(novaAnomalia);
      
      return novaAnomalia;
    } finally {
      setLoading(false);
    }
  }, []);

  // Editar anomalia
  const editarAnomalia = useCallback(async (id: string, dados: Partial<AnomaliaFormData>): Promise<Anomalia> => {
    setLoading(true);
    try {
      await simulateDelay();
      
      const index = mockAnomalias.findIndex(a => a.id === id);
      if (index === -1) {
        throw new Error('Anomalia não encontrada');
      }
      
      const anomaliaAtualizada = {
        ...mockAnomalias[index],
        ...dados,
        atualizadoEm: new Date().toISOString(),
        historico: [
          ...(mockAnomalias[index].historico || []),
          {
            id: String(Date.now()),
            acao: 'Anomalia atualizada',
            usuario: 'Usuário Atual',
            data: new Date().toISOString(),
          }
        ]
      };
      
      mockAnomalias[index] = anomaliaAtualizada;
      return anomaliaAtualizada;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obter anomalia por ID
  const obterAnomalia = useCallback(async (id: string): Promise<Anomalia | null> => {
    setLoading(true);
    try {
      await simulateDelay(300);
      return mockAnomalias.find(a => a.id === id) || null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Excluir anomalia
  const excluirAnomalia = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    try {
      await simulateDelay();
      
      const index = mockAnomalias.findIndex(a => a.id === id);
      if (index === -1) {
        return false;
      }
      
      mockAnomalias.splice(index, 1);
      return true;
    } finally {
      setLoading(false);
    }
  }, []);

  // Gerar OS
  const gerarOS = useCallback(async (anomaliaId: string): Promise<Anomalia> => {
    setLoading(true);
    try {
      await simulateDelay();
      
      const index = mockAnomalias.findIndex(a => a.id === anomaliaId);
      if (index === -1) {
        throw new Error('Anomalia não encontrada');
      }
      
      const osId = `OS-2025-${String(Date.now()).slice(-3)}`;
      const anomaliaAtualizada = {
        ...mockAnomalias[index],
        status: 'OS_GERADA' as const,
        ordemServicoId: osId,
        atualizadoEm: new Date().toISOString(),
        historico: [
          ...(mockAnomalias[index].historico || []),
          {
            id: String(Date.now()),
            acao: 'Ordem de Serviço gerada',
            usuario: 'Usuário Atual',
            data: new Date().toISOString(),
            observacoes: `${osId} criada`
          }
        ]
      };
      
      mockAnomalias[index] = anomaliaAtualizada;
      return anomaliaAtualizada;
    } finally {
      setLoading(false);
    }
  }, []);

  // Resolver anomalia
  const resolverAnomalia = useCallback(async (anomaliaId: string, observacoes?: string): Promise<Anomalia> => {
    setLoading(true);
    try {
      await simulateDelay();
      
      const index = mockAnomalias.findIndex(a => a.id === anomaliaId);
      if (index === -1) {
        throw new Error('Anomalia não encontrada');
      }
      
      const anomaliaAtualizada = {
        ...mockAnomalias[index],
        status: 'RESOLVIDA' as const,
        atualizadoEm: new Date().toISOString(),
        historico: [
          ...(mockAnomalias[index].historico || []),
          {
            id: String(Date.now()),
            acao: 'Anomalia resolvida',
            usuario: 'Usuário Atual',
            data: new Date().toISOString(),
            observacoes
          }
        ]
      };
      
      mockAnomalias[index] = anomaliaAtualizada;
      return anomaliaAtualizada;
    } finally {
      setLoading(false);
    }
  }, []);

  // Cancelar anomalia
  const cancelarAnomalia = useCallback(async (anomaliaId: string, motivo?: string): Promise<Anomalia> => {
    setLoading(true);
    try {
      await simulateDelay();
      
      const index = mockAnomalias.findIndex(a => a.id === anomaliaId);
      if (index === -1) {
        throw new Error('Anomalia não encontrada');
      }
      
      const anomaliaAtualizada = {
        ...mockAnomalias[index],
        status: 'CANCELADA' as const,
        atualizadoEm: new Date().toISOString(),
        historico: [
          ...(mockAnomalias[index].historico || []),
          {
            id: String(Date.now()),
            acao: 'Anomalia cancelada',
            usuario: 'Usuário Atual',
            data: new Date().toISOString(),
            observacoes: motivo
          }
        ]
      };
      
      mockAnomalias[index] = anomaliaAtualizada;
      return anomaliaAtualizada;
    } finally {
      setLoading(false);
    }
  }, []);

  // Adicionar entrada no histórico
  const adicionarHistorico = useCallback(async (anomaliaId: string, acao: string, observacoes?: string): Promise<Anomalia> => {
    setLoading(true);
    try {
      await simulateDelay(300);
      
      const index = mockAnomalias.findIndex(a => a.id === anomaliaId);
      if (index === -1) {
        throw new Error('Anomalia não encontrada');
      }
      
      const anomaliaAtualizada = {
        ...mockAnomalias[index],
        atualizadoEm: new Date().toISOString(),
        historico: [
          ...(mockAnomalias[index].historico || []),
          {
            id: String(Date.now()),
            acao,
            usuario: 'Usuário Atual',
            data: new Date().toISOString(),
            observacoes
          }
        ]
      };
      
      mockAnomalias[index] = anomaliaAtualizada;
      return anomaliaAtualizada;
    } finally {
      setLoading(false);
    }
  }, []);

  // Gerar OS em lote
  const gerarOSLote = useCallback(async (anomaliaIds: string[]): Promise<Anomalia[]> => {
    setLoading(true);
    try {
      const resultados: Anomalia[] = [];
      
      for (const id of anomaliaIds) {
        const anomaliaAtualizada = await gerarOS(id);
        resultados.push(anomaliaAtualizada);
      }
      
      return resultados;
    } finally {
      setLoading(false);
    }
  }, [gerarOS]);

  // Resolver em lote
  const resolverLote = useCallback(async (anomaliaIds: string[], observacoes?: string): Promise<Anomalia[]> => {
    setLoading(true);
    try {
      const resultados: Anomalia[] = [];
      
      for (const id of anomaliaIds) {
        const anomaliaAtualizada = await resolverAnomalia(id, observacoes || 'Resolvida em lote');
        resultados.push(anomaliaAtualizada);
      }
      
      return resultados;
    } finally {
      setLoading(false);
    }
  }, [resolverAnomalia]);

  // Cancelar em lote
  const cancelarLote = useCallback(async (anomaliaIds: string[], motivo?: string): Promise<Anomalia[]> => {
    setLoading(true);
    try {
      const resultados: Anomalia[] = [];
      
      for (const id of anomaliaIds) {
        const anomaliaAtualizada = await cancelarAnomalia(id, motivo || 'Cancelada em lote');
        resultados.push(anomaliaAtualizada);
      }
      
      return resultados;
    } finally {
      setLoading(false);
    }
  }, [cancelarAnomalia]);

  return {
    loading,
    criarAnomalia,
    editarAnomalia,
    obterAnomalia,
    excluirAnomalia,
    gerarOS,
    resolverAnomalia,
    cancelarAnomalia,
    adicionarHistorico,
    gerarOSLote,
    resolverLote,
    cancelarLote,
  };
}