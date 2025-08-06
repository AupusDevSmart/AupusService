// src/features/tarefas/hooks/useTarefas.ts
import { useState, useCallback } from 'react';
import { Tarefa } from '../types';
import { mockTarefas } from '../data/mock-data';

interface UseTarefasReturn {
  // Estados
  loading: boolean;
  
  // Operações CRUD
  criarTarefa: (dados: any) => Promise<Tarefa>;
  editarTarefa: (id: string, dados: any) => Promise<Tarefa>;
  obterTarefa: (id: string) => Promise<Tarefa | null>;
  excluirTarefa: (id: string) => Promise<boolean>;
  
  // Operações específicas de tarefas
  ativarTarefa: (tarefaId: string) => Promise<Tarefa>;
  desativarTarefa: (tarefaId: string) => Promise<Tarefa>;
  arquivarTarefa: (tarefaId: string) => Promise<Tarefa>;
  duplicarTarefa: (tarefaId: string) => Promise<Tarefa>;
  sincronizarComPlano: (tarefaId: string) => Promise<Tarefa>;
  gerarOS: (tarefaId: string) => Promise<{ tarefa: Tarefa; osId: string }>;
  
  // Relatórios e exportação
  exportarTarefas: (filtros?: any) => Promise<Blob>;
  importarTarefas: (arquivo: File) => Promise<{ sucesso: number; erros: string[] }>;
}

export function useTarefas(): UseTarefasReturn {
  const [loading, setLoading] = useState<boolean>(false);

  // Simular delay de API
  const simulateDelay = (ms: number = 1000) => 
    new Promise(resolve => setTimeout(resolve, ms));

  // Gerar ID único
  const generateId = () => String(Date.now() + Math.random());

  // Criar tarefa manual
  const criarTarefa = useCallback(async (dados: any): Promise<Tarefa> => {
    setLoading(true);
    try {
      await simulateDelay();
      
      const novaTarefa: Tarefa = {
        id: generateId(),
        criadoEm: new Date().toISOString(),
        ...dados,
        customizada: false,
        sincronizada: true,
        origemPlano: false, // Tarefa manual
        ativa: dados.status === 'ATIVA',
        totalExecucoes: 0,
        subTarefas: dados.subTarefas.map((sub: any, index: number) => ({
          ...sub,
          id: `${generateId()}-${index}`
        })),
        recursos: dados.recursos.map((rec: any, index: number) => ({
          ...rec,
          id: `${generateId()}-${index}`
        })),
        anexos: []
      };
      
      mockTarefas.unshift(novaTarefa);
      return novaTarefa;
    } finally {
      setLoading(false);
    }
  }, []);

  // Editar tarefa
  const editarTarefa = useCallback(async (id: string, dados: any): Promise<Tarefa> => {
    setLoading(true);
    try {
      await simulateDelay();
      
      const index = mockTarefas.findIndex(t => t.id === id);
      if (index === -1) {
        throw new Error('Tarefa não encontrada');
      }
      
      const tarefaOriginal = mockTarefas[index];
      const Tarefa = {
        ...tarefaOriginal,
        ...dados,
        atualizadoEm: new Date().toISOString(),
        ativa: dados.status === 'ATIVA',
        customizada: tarefaOriginal.origemPlano ? true : false, // Se veio de plano e foi editada, marca como customizada
        subTarefas: dados.subTarefas ? dados.subTarefas.map((sub: any, idx: number) => ({
          ...sub,
          id: sub.id || `${generateId()}-${idx}`
        })) : tarefaOriginal.subTarefas,
        recursos: dados.recursos ? dados.recursos.map((rec: any, idx: number) => ({
          ...rec,
          id: rec.id || `${generateId()}-${idx}`
        })) : tarefaOriginal.recursos
      };
      
      mockTarefas[index] = Tarefa;
      return Tarefa;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obter tarefa por ID
  const obterTarefa = useCallback(async (id: string): Promise<Tarefa | null> => {
    setLoading(true);
    try {
      await simulateDelay(300);
      return mockTarefas.find(t => t.id === id) || null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Excluir tarefa
  const excluirTarefa = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    try {
      await simulateDelay();
      
      const index = mockTarefas.findIndex(t => t.id === id);
      if (index === -1) {
        return false;
      }
      
      mockTarefas.splice(index, 1);
      return true;
    } finally {
      setLoading(false);
    }
  }, []);

  // Ativar tarefa
  const ativarTarefa = useCallback(async (tarefaId: string): Promise<Tarefa> => {
    setLoading(true);
    try {
      await simulateDelay();
      
      const index = mockTarefas.findIndex(t => t.id === tarefaId);
      if (index === -1) {
        throw new Error('Tarefa não encontrada');
      }
      
      const Tarefa = {
        ...mockTarefas[index],
        status: 'ATIVA' as const,
        ativa: true,
        atualizadoEm: new Date().toISOString()
      };
      
      mockTarefas[index] = Tarefa;
      return Tarefa;
    } finally {
      setLoading(false);
    }
  }, []);

  // Desativar tarefa
  const desativarTarefa = useCallback(async (tarefaId: string): Promise<Tarefa> => {
    setLoading(true);
    try {
      await simulateDelay();
      
      const index = mockTarefas.findIndex(t => t.id === tarefaId);
      if (index === -1) {
        throw new Error('Tarefa não encontrada');
      }
      
      const Tarefa = {
        ...mockTarefas[index],
        status: 'INATIVA' as const,
        ativa: false,
        atualizadoEm: new Date().toISOString()
      };
      
      mockTarefas[index] = Tarefa;
      return Tarefa;
    } finally {
      setLoading(false);
    }
  }, []);

  // Arquivar tarefa
  const arquivarTarefa = useCallback(async (tarefaId: string): Promise<Tarefa> => {
    setLoading(true);
    try {
      await simulateDelay();
      
      const index = mockTarefas.findIndex(t => t.id === tarefaId);
      if (index === -1) {
        throw new Error('Tarefa não encontrada');
      }
      
      const Tarefa = {
        ...mockTarefas[index],
        status: 'ARQUIVADA' as const,
        ativa: false,
        atualizadoEm: new Date().toISOString()
      };
      
      mockTarefas[index] = Tarefa;
      return Tarefa;
    } finally {
      setLoading(false);
    }
  }, []);

  // Duplicar tarefa
  const duplicarTarefa = useCallback(async (tarefaId: string): Promise<Tarefa> => {
    setLoading(true);
    try {
      await simulateDelay();
      
      const tarefaOriginal = mockTarefas.find(t => t.id === tarefaId);
      if (!tarefaOriginal) {
        throw new Error('Tarefa não encontrada');
      }
      
      const tarefaDuplicada: Tarefa = {
        ...tarefaOriginal,
        id: generateId(),
        tag: `${tarefaOriginal.tag}-COPY`,
        criadoEm: new Date().toISOString(),
        atualizadoEm: undefined,
        totalExecucoes: 0,
        ultimaExecucao: undefined,
        proximaExecucao: undefined,
        customizada: false,
        origemPlano: false, // Cópia vira tarefa manual
        planoManutencaoId: undefined,
        tarefaTemplateId: undefined,
        planoEquipamentoId: undefined,
        versaoTemplate: undefined,
        sincronizada: true,
        subTarefas: tarefaOriginal.subTarefas.map((sub, index) => ({
          ...sub,
          id: `${generateId()}-${index}`
        })),
        recursos: tarefaOriginal.recursos.map((rec, index) => ({
          ...rec,
          id: `${generateId()}-${index}`
        })),
        anexos: []
      };
      
      mockTarefas.unshift(tarefaDuplicada);
      return tarefaDuplicada;
    } finally {
      setLoading(false);
    }
  }, []);

  // Sincronizar com plano
  const sincronizarComPlano = useCallback(async (tarefaId: string): Promise<Tarefa> => {
    setLoading(true);
    try {
      await simulateDelay(1500);
      
      const index = mockTarefas.findIndex(t => t.id === tarefaId);
      if (index === -1) {
        throw new Error('Tarefa não encontrada');
      }
      
      const tarefa = mockTarefas[index];
      if (!tarefa.origemPlano || !tarefa.planoManutencaoId) {
        throw new Error('Esta tarefa não foi gerada de um plano');
      }
      
      // Simular sincronização com o plano atual
      const tarefaSincronizada = {
        ...tarefa,
        sincronizada: true,
        versaoTemplate: '3.0', // Nova versão do plano
        customizada: false, // Reset customizações
        atualizadoEm: new Date().toISOString()
      };
      
      mockTarefas[index] = tarefaSincronizada;
      return tarefaSincronizada;
    } finally {
      setLoading(false);
    }
  }, []);

  // Gerar OS
  const gerarOS = useCallback(async (tarefaId: string): Promise<{ tarefa: Tarefa; osId: string }> => {
    setLoading(true);
    try {
      await simulateDelay();
      
      const index = mockTarefas.findIndex(t => t.id === tarefaId);
      if (index === -1) {
        throw new Error('Tarefa não encontrada');
      }
      
      const osId = `OS-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      
      const Tarefa = {
        ...mockTarefas[index],
        atualizadoEm: new Date().toISOString()
      };
      
      mockTarefas[index] = Tarefa;
      
      return { tarefa: Tarefa, osId };
    } finally {
      setLoading(false);
    }
  }, []);

  // Exportar tarefas
  const exportarTarefas = useCallback(async (filtros?: any): Promise<Blob> => {
    setLoading(true);
    try {
      await simulateDelay();
      
      // Simular exportação para CSV
      const csvContent = mockTarefas.map(tarefa => 
        `${tarefa.tag},${tarefa.descricao},${tarefa.categoria},${tarefa.tipoManutencao},${tarefa.frequencia},${tarefa.status},${tarefa.origemPlano ? 'Plano' : 'Manual'},${tarefa.sincronizada ? 'Sim' : 'Não'}`
      ).join('\n');
      
      const header = 'TAG,Descrição,Categoria,Tipo,Frequência,Status,Origem,Sincronizada\n';
      const blob = new Blob([header + csvContent], { type: 'text/csv' });
      
      return blob;
    } finally {
      setLoading(false);
    }
  }, []);

  // Importar tarefas
  const importarTarefas = useCallback(async (arquivo: File): Promise<{ sucesso: number; erros: string[] }> => {
    setLoading(true);
    try {
      await simulateDelay(2000);
      
      // Simular importação
      return {
        sucesso: 3,
        erros: ['Linha 2: TAG já existe', 'Linha 5: Equipamento não encontrado']
      };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    criarTarefa,
    editarTarefa,
    obterTarefa,
    excluirTarefa,
    ativarTarefa,
    desativarTarefa,
    arquivarTarefa,
    duplicarTarefa,
    sincronizarComPlano,
    gerarOS,
    exportarTarefas,
    importarTarefas,
  };
}