// src/features/planos-manutencao/hooks/usePlanosManutencao.ts

import { useState, useCallback } from 'react';
import { 
  PlanoManutencao, 
  PlanoManutencaoFormData, 
  AssociacaoPlanoFormData,
  PlanoEquipamento,
  EstatisticasPlano,
  EquipamentoPlanoInfo
} from '../types';
import { mockPlanosManutencao, mockPlanosEquipamentos } from '../data/mock-data';
import { TarefaAtualizada } from '../types';

interface UsePlanosManutencaoReturn {
  // Estados
  loading: boolean;
  
  // Operações CRUD de Planos
  criarPlano: (dados: PlanoManutencaoFormData) => Promise<PlanoManutencao>;
  editarPlano: (id: string, dados: Partial<PlanoManutencaoFormData>) => Promise<PlanoManutencao>;
  obterPlano: (id: string) => Promise<PlanoManutencao | null>;
  excluirPlano: (id: string) => Promise<boolean>;
  duplicarPlano: (id: string, novoNome?: string) => Promise<PlanoManutencao>;
  
  // Operações de Associação
  associarEquipamentos: (dados: AssociacaoPlanoFormData) => Promise<PlanoEquipamento[]>;
  desassociarEquipamento: (planoId: string, equipamentoId: number) => Promise<boolean>;
  obterEquipamentosAssociados: (planoId: string) => Promise<EquipamentoPlanoInfo[]>;
  obterPlanosDoEquipamento: (equipamentoId: number) => Promise<PlanoEquipamento[]>;
  
  // Geração de Tarefas
  gerarTarefasDoPlano: (planoId: string, equipamentosIds: number[]) => Promise<TarefaAtualizada[]>;
  sincronizarTarefasComPlano: (planoId: string) => Promise<TarefaAtualizada[]>;
  
  // Estatísticas e Relatórios
  obterEstatisticasPlano: (planoId: string) => Promise<EstatisticasPlano>;
  exportarPlano: (planoId: string) => Promise<Blob>;
  importarPlano: (arquivo: File) => Promise<{ sucesso: boolean; plano?: PlanoManutencao; erros?: string[] }>;
  
  // Operações em lote
  ativarPlanos: (planosIds: string[]) => Promise<PlanoManutencao[]>;
  desativarPlanos: (planosIds: string[]) => Promise<PlanoManutencao[]>;
}

export function usePlanosManutencao(): UsePlanosManutencaoReturn {
  const [loading, setLoading] = useState<boolean>(false);

  // Simular delay de API
  const simulateDelay = (ms: number = 1000) => 
    new Promise(resolve => setTimeout(resolve, ms));

  // Gerar ID único
  const generateId = () => String(Date.now() + Math.random());

  // Gerar TAG única para tarefa
  const gerarTagTarefa = (tagBase: string, equipamentoId: number): string => {
    return `${tagBase}-EQ${equipamentoId}`;
  };

  // Criar plano
  const criarPlano = useCallback(async (dados: PlanoManutencaoFormData): Promise<PlanoManutencao> => {
    setLoading(true);
    try {
      await simulateDelay();
      
      const novoPlano: PlanoManutencao = {
        id: generateId(),
        criadoEm: new Date().toISOString(),
        ...dados,
        totalEquipamentos: 0,
        totalTarefasGeradas: 0,
        criadoPor: 'Usuário Atual',
        tarefasTemplate: dados.tarefasTemplate.map((template, index) => ({
          ...template,
          id: `template-${generateId()}-${index}`,
          ordem: index + 1
        }))
      };
      
      mockPlanosManutencao.unshift(novoPlano);
      return novoPlano;
    } finally {
      setLoading(false);
    }
  }, []);

  // Editar plano
  const editarPlano = useCallback(async (id: string, dados: Partial<PlanoManutencaoFormData>): Promise<PlanoManutencao> => {
    setLoading(true);
    try {
      await simulateDelay();
      
      const index = mockPlanosManutencao.findIndex(p => p.id === id);
      if (index === -1) {
        throw new Error('Plano não encontrado');
      }
      
      const planoAtualizado = {
        ...mockPlanosManutencao[index],
        ...dados,
        atualizadoEm: new Date().toISOString(),
        tarefasTemplate: dados.tarefasTemplate ? dados.tarefasTemplate.map((template, idx) => ({
          ...template,
          id: template.id || `template-${generateId()}-${idx}`,
          ordem: idx + 1
        })) : mockPlanosManutencao[index].tarefasTemplate
      };
      
      mockPlanosManutencao[index] = planoAtualizado;
      return planoAtualizado;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obter plano por ID
  const obterPlano = useCallback(async (id: string): Promise<PlanoManutencao | null> => {
    setLoading(true);
    try {
      await simulateDelay(300);
      return mockPlanosManutencao.find(p => p.id === id) || null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Excluir plano
  const excluirPlano = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    try {
      await simulateDelay();
      
      const index = mockPlanosManutencao.findIndex(p => p.id === id);
      if (index === -1) {
        return false;
      }
      
      // Verificar se há equipamentos associados
      const associacoes = mockPlanosEquipamentos.filter(pe => pe.planoManutencaoId === id && pe.ativo);
      if (associacoes.length > 0) {
        throw new Error(`Não é possível excluir. Plano está associado a ${associacoes.length} equipamento(s).`);
      }
      
      mockPlanosManutencao.splice(index, 1);
      return true;
    } finally {
      setLoading(false);
    }
  }, []);

  // Duplicar plano
  const duplicarPlano = useCallback(async (id: string, novoNome?: string): Promise<PlanoManutencao> => {
    setLoading(true);
    try {
      await simulateDelay();
      
      const planoOriginal = mockPlanosManutencao.find(p => p.id === id);
      if (!planoOriginal) {
        throw new Error('Plano não encontrado');
      }
      
      const planoDuplicado: PlanoManutencao = {
        ...planoOriginal,
        id: generateId(),
        nome: novoNome || `${planoOriginal.nome} - Cópia`,
        versao: '1.0',
        criadoEm: new Date().toISOString(),
        atualizadoEm: undefined,
        totalEquipamentos: 0,
        totalTarefasGeradas: 0,
        criadoPor: 'Usuário Atual',
        tarefasTemplate: planoOriginal.tarefasTemplate.map((template, index) => ({
          ...template,
          id: `template-${generateId()}-${index}`
        }))
      };
      
      mockPlanosManutencao.unshift(planoDuplicado);
      return planoDuplicado;
    } finally {
      setLoading(false);
    }
  }, []);

  // Associar equipamentos
  const associarEquipamentos = useCallback(async (dados: AssociacaoPlanoFormData): Promise<PlanoEquipamento[]> => {
    setLoading(true);
    try {
      await simulateDelay(1500);
      
      const novasAssociacoes: PlanoEquipamento[] = [];
      
      for (const equipamentoId of dados.equipamentosIds) {
        // Verificar se já existe associação ativa
        const associacaoExistente = mockPlanosEquipamentos.find(
          pe => pe.planoManutencaoId === dados.planoManutencaoId && 
               pe.equipamentoId === equipamentoId && 
               pe.ativo
        );
        
        if (associacaoExistente) {
          continue; // Pular se já existe
        }
        
        const novaAssociacao: PlanoEquipamento = {
          id: generateId(),
          criadoEm: new Date().toISOString(),
          planoManutencaoId: dados.planoManutencaoId,
          equipamentoId,
          plantaId: 1, // Seria obtido do equipamento
          responsavelCustomizado: dados.responsavelPadrao,
          observacoesCustomizadas: dados.observacoesPadrao,
          ativo: true,
          dataAssociacao: new Date().toISOString(),
          associadoPor: 'Usuário Atual'
        };
        
        mockPlanosEquipamentos.push(novaAssociacao);
        novasAssociacoes.push(novaAssociacao);
      }
      
      // Atualizar contador no plano
      const planoIndex = mockPlanosManutencao.findIndex(p => p.id === dados.planoManutencaoId);
      if (planoIndex !== -1) {
        const totalEquipamentos = mockPlanosEquipamentos.filter(
          pe => pe.planoManutencaoId === dados.planoManutencaoId && pe.ativo
        ).length;
        
        mockPlanosManutencao[planoIndex].totalEquipamentos = totalEquipamentos;
      }
      
      return novasAssociacoes;
    } finally {
      setLoading(false);
    }
  }, []);

  // Desassociar equipamento
  const desassociarEquipamento = useCallback(async (planoId: string, equipamentoId: number): Promise<boolean> => {
    setLoading(true);
    try {
      await simulateDelay();
      
      const associacaoIndex = mockPlanosEquipamentos.findIndex(
        pe => pe.planoManutencaoId === planoId && pe.equipamentoId === equipamentoId && pe.ativo
      );
      
      if (associacaoIndex === -1) {
        return false;
      }
      
      // Marcar como inativa ao invés de remover
      mockPlanosEquipamentos[associacaoIndex].ativo = false;
      mockPlanosEquipamentos[associacaoIndex].dataDesassociacao = new Date().toISOString();
      
      // Atualizar contador no plano
      const planoIndex = mockPlanosManutencao.findIndex(p => p.id === planoId);
      if (planoIndex !== -1) {
        const totalEquipamentos = mockPlanosEquipamentos.filter(
          pe => pe.planoManutencaoId === planoId && pe.ativo
        ).length;
        
        mockPlanosManutencao[planoIndex].totalEquipamentos = totalEquipamentos;
      }
      
      return true;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obter equipamentos associados
  const obterEquipamentosAssociados = useCallback(async (planoId: string): Promise<EquipamentoPlanoInfo[]> => {
    setLoading(true);
    try {
      await simulateDelay(500);
      
      const associacoes = mockPlanosEquipamentos.filter(
        pe => pe.planoManutencaoId === planoId && pe.ativo
      );
      
      // Simular busca dos dados dos equipamentos
      return associacoes.map(associacao => ({
        equipamentoId: associacao.equipamentoId,
        equipamentoNome: `Equipamento ${associacao.equipamentoId}`,
        plantaId: associacao.plantaId,
        plantaNome: `Planta ${associacao.plantaId}`,
        planoManutencaoId: planoId,
        planoNome: mockPlanosManutencao.find(p => p.id === planoId)?.nome,
        dataAssociacao: associacao.dataAssociacao,
        totalTarefas: 4, // Calculado baseado no plano
        tarefasAtivas: 3
      }));
    } finally {
      setLoading(false);
    }
  }, []);

  // Obter planos do equipamento
  const obterPlanosDoEquipamento = useCallback(async (equipamentoId: number): Promise<PlanoEquipamento[]> => {
    setLoading(true);
    try {
      await simulateDelay(300);
      return mockPlanosEquipamentos.filter(
        pe => pe.equipamentoId === equipamentoId && pe.ativo
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Gerar tarefas do plano
  const gerarTarefasDoPlano = useCallback(async (planoId: string, equipamentosIds: number[]): Promise<TarefaAtualizada[]> => {
    setLoading(true);
    try {
      await simulateDelay(2000);
      
      const plano = mockPlanosManutencao.find(p => p.id === planoId);
      if (!plano) {
        throw new Error('Plano não encontrado');
      }
      
      const tarefasGeradas: TarefaAtualizada[] = [];
      
      for (const equipamentoId of equipamentosIds) {
        for (const template of plano.tarefasTemplate) {
          if (!template.ativa) continue;
          
          const novaTarefa: TarefaAtualizada = {
            id: generateId(),
            criadoEm: new Date().toISOString(),
            planoManutencaoId: planoId,
            tarefaTemplateId: template.id,
            equipamentoId,
            plantaId: 1, // Seria obtido do equipamento
            tag: gerarTagTarefa(template.tagBase, equipamentoId),
            descricao: `${template.descricao} - Equipamento ${equipamentoId}`,
            categoria: template.categoria,
            tipoManutencao: template.tipoManutencao,
            frequencia: template.frequencia,
            frequenciaPersonalizada: template.frequenciaPersonalizada,
            condicaoAtivo: template.condicaoAtivo,
            criticidade: template.criticidade,
            duracaoEstimada: template.duracaoEstimada,
            tempoEstimado: template.tempoEstimado,
            responsavel: template.responsavelSugerido,
            observacoes: template.observacoesTemplate,
            customizada: false,
            status: 'ATIVA',
            ativa: true,
            subTarefas: template.subTarefas.map((sub, index) => ({
              ...sub,
              id: `${generateId()}-${index}`
            })),
            recursos: template.recursos.map((rec, index) => ({
              ...rec,
              id: `${generateId()}-${index}`
            })),
            anexos: [],
            totalExecucoes: 0,
            versaoTemplate: plano.versao,
            sincronizada: true,
            origemPlano: true
          };
          
          tarefasGeradas.push(novaTarefa);
        }
      }
      
      return tarefasGeradas;
    } finally {
      setLoading(false);
    }
  }, []);

  // Sincronizar tarefas com plano
  const sincronizarTarefasComPlano = useCallback(async (planoId: string): Promise<TarefaAtualizada[]> => {
    setLoading(true);
    try {
      await simulateDelay(1500);
      
      // Lógica para sincronizar tarefas existentes com mudanças no plano
      // Por enquanto, simular que foram sincronizadas algumas tarefas
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Obter estatísticas do plano
  const obterEstatisticasPlano = useCallback(async (planoId: string): Promise<EstatisticasPlano> => {
    setLoading(true);
    try {
      await simulateDelay(500);
      
      const associacoes = mockPlanosEquipamentos.filter(
        pe => pe.planoManutencaoId === planoId && pe.ativo
      );
      
      const plano = mockPlanosManutencao.find(p => p.id === planoId);
      const totalTarefas = associacoes.length * (plano?.tarefasTemplate.length || 0);
      
      return {
        totalEquipamentos: associacoes.length,
        totalTarefas,
        equipamentosAtivos: associacoes.length,
        tarefasVencidas: Math.floor(totalTarefas * 0.1),
        tarefasVencendoHoje: Math.floor(totalTarefas * 0.05),
        ultimaAssociacao: associacoes.length > 0 ? 
          associacoes.sort((a, b) => new Date(b.dataAssociacao).getTime() - new Date(a.dataAssociacao).getTime())[0].dataAssociacao :
          undefined
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Exportar plano
  const exportarPlano = useCallback(async (planoId: string): Promise<Blob> => {
    setLoading(true);
    try {
      await simulateDelay();
      
      const plano = mockPlanosManutencao.find(p => p.id === planoId);
      if (!plano) {
        throw new Error('Plano não encontrado');
      }
      
      const jsonContent = JSON.stringify(plano, null, 2);
      return new Blob([jsonContent], { type: 'application/json' });
    } finally {
      setLoading(false);
    }
  }, []);

  // Importar plano
  const importarPlano = useCallback(async (arquivo: File): Promise<{ sucesso: boolean; plano?: PlanoManutencao; erros?: string[] }> => {
    setLoading(true);
    try {
      await simulateDelay(2000);
      
      // Simular importação
      return {
        sucesso: true,
        erros: ['Alguns templates foram ajustados para compatibilidade']
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Ativar planos em lote
  const ativarPlanos = useCallback(async (planosIds: string[]): Promise<PlanoManutencao[]> => {
    const resultados: PlanoManutencao[] = [];
    for (const id of planosIds) {
      const plano = await editarPlano(id, { ativo: true });
      resultados.push(plano);
    }
    return resultados;
  }, [editarPlano]);

  // Desativar planos em lote
  const desativarPlanos = useCallback(async (planosIds: string[]): Promise<PlanoManutencao[]> => {
    const resultados: PlanoManutencao[] = [];
    for (const id of planosIds) {
      const plano = await editarPlano(id, { ativo: false });
      resultados.push(plano);
    }
    return resultados;
  }, [editarPlano]);

  return {
    loading,
    criarPlano,
    editarPlano,
    obterPlano,
    excluirPlano,
    duplicarPlano,
    associarEquipamentos,
    desassociarEquipamento,
    obterEquipamentosAssociados,
    obterPlanosDoEquipamento,
    gerarTarefasDoPlano,
    sincronizarTarefasComPlano,
    obterEstatisticasPlano,
    exportarPlano,
    importarPlano,
    ativarPlanos,
    desativarPlanos,
  };
}