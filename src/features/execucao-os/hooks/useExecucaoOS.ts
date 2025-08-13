// src/features/execucao-os/hooks/useExecucaoOS.ts
import { useState, useCallback } from 'react';
import { ExecucaoOS, FinalizarExecucaoData, MaterialConsumido, FerramentaUtilizada } from '../types';
import { mockExecucoesOS } from '../data/mock-data';

interface UseExecucaoOSReturn {
  // Estados
  loading: boolean;
  
  // Operações CRUD
  obterExecucao: (id: string) => Promise<ExecucaoOS | null>;
  editarExecucao: (id: string, dados: Partial<ExecucaoOS>) => Promise<ExecucaoOS>;
  
  // Operações de execução
  pausarExecucao: (id: string, motivo?: string) => Promise<{ success: boolean }>;
  retomarExecucao: (id: string) => Promise<{ success: boolean }>;
  finalizarExecucao: (id: string, dados: FinalizarExecucaoData) => Promise<{ success: boolean }>;
  cancelarExecucao: (id: string, motivo: string) => Promise<{ success: boolean }>;
  
  // Gerenciamento de atividades
  atualizarChecklist: (id: string, checklistAtividades: any[]) => Promise<{ success: boolean }>;
  adicionarAtividade: (id: string, atividade: string) => Promise<{ success: boolean }>;
  
  // Gerenciamento de recursos
  atualizarMateriaisConsumidos: (id: string, materiais: MaterialConsumido[]) => Promise<{ success: boolean }>;
  atualizarFerramentasUtilizadas: (id: string, ferramentas: FerramentaUtilizada[]) => Promise<{ success: boolean }>;
  
  // Registros de tempo
  registrarTempo: (id: string, tecnicoId: string, atividade: string, tempoMinutos: number) => Promise<{ success: boolean }>;
  
  // Anexos
  adicionarAnexo: (id: string, anexo: any) => Promise<{ success: boolean }>;
  removerAnexo: (id: string, anexoId: string) => Promise<{ success: boolean }>;
  
  // Relatórios
  gerarRelatorioExecucao: (id: string) => Promise<Blob>;
  exportarDadosExecucao: (ids: string[]) => Promise<Blob>;
}

export const useExecucaoOS = (): UseExecucaoOSReturn => {
  const [loading, setLoading] = useState(false);

  // Simular delay de API
  const simulateDelay = (ms: number = 1000) => 
    new Promise(resolve => setTimeout(resolve, ms));

  // Gerar ID único
  const generateId = () => String(Date.now() + Math.random());

  // ✅ OBTER EXECUÇÃO POR ID
  const obterExecucao = useCallback(async (id: string): Promise<ExecucaoOS | null> => {
    setLoading(true);
    try {
      console.log('🔍 Buscando execução:', id);
      await simulateDelay(500);
      
      const execucao = mockExecucoesOS.find(exec => exec.id === parseInt(id));
      console.log(execucao ? '✅ Execução encontrada' : '❌ Execução não encontrada');
      return execucao || null;
    } catch (error) {
      console.error('❌ Erro ao buscar execução:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ EDITAR EXECUÇÃO
  const editarExecucao = useCallback(async (id: string, dados: Partial<ExecucaoOS>): Promise<ExecucaoOS> => {
    setLoading(true);
    try {
      console.log('✏️ Editando execução:', id, dados);
      await simulateDelay(1200);
      
      const index = mockExecucoesOS.findIndex(exec => exec.id === parseInt(id));
      if (index === -1) {
        throw new Error('Execução não encontrada');
      }
      
      const execucaoAtualizada = {
        ...mockExecucoesOS[index],
        ...dados,
        atualizadoEm: new Date().toISOString()
      };
      
      mockExecucoesOS[index] = execucaoAtualizada;
      console.log('✅ Execução editada com sucesso');
      return execucaoAtualizada;
    } catch (error) {
      console.error('❌ Erro ao editar execução:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ PAUSAR EXECUÇÃO
  const pausarExecucao = useCallback(async (id: string, motivo?: string): Promise<{ success: boolean }> => {
    setLoading(true);
    try {
      console.log('⏸️ Pausando execução:', id, motivo);
      await simulateDelay(1000);
      
      const index = mockExecucoesOS.findIndex(exec => exec.id === parseInt(id));
      if (index === -1) {
        throw new Error('Execução não encontrada');
      }
      
      const execucaoAtualizada = {
        ...mockExecucoesOS[index],
        statusExecucao: 'PAUSADA' as const,
        atualizadoEm: new Date().toISOString()
      };
      
      mockExecucoesOS[index] = execucaoAtualizada;
      console.log('✅ Execução pausada com sucesso');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao pausar execução:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ RETOMAR EXECUÇÃO
  const retomarExecucao = useCallback(async (id: string): Promise<{ success: boolean }> => {
    setLoading(true);
    try {
      console.log('▶️ Retomando execução:', id);
      await simulateDelay(800);
      
      const index = mockExecucoesOS.findIndex(exec => exec.id === parseInt(id));
      if (index === -1) {
        throw new Error('Execução não encontrada');
      }
      
      const execucaoAtualizada = {
        ...mockExecucoesOS[index],
        statusExecucao: 'EM_EXECUCAO' as const,
        atualizadoEm: new Date().toISOString()
      };
      
      mockExecucoesOS[index] = execucaoAtualizada;
      console.log('✅ Execução retomada com sucesso');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao retomar execução:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ FINALIZAR EXECUÇÃO
  const finalizarExecucao = useCallback(async (id: string, dados: FinalizarExecucaoData): Promise<{ success: boolean }> => {
    setLoading(true);
    try {
      console.log('🏁 Finalizando execução:', id, dados);
      await simulateDelay(2000);
      
      const index = mockExecucoesOS.findIndex(exec => exec.id === parseInt(id));
      if (index === -1) {
        throw new Error('Execução não encontrada');
      }
      
      const agora = new Date();
      const execucaoAtualizada = {
        ...mockExecucoesOS[index],
        statusExecucao: 'FINALIZADA' as const,
        dataFimReal: agora.toISOString().split('T')[0],
        horaFimReal: agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        resultadoServico: dados.resultadoServico,
        problemasEncontrados: dados.problemasEncontrados,
        recomendacoes: dados.recomendacoes,
        proximaManutencao: dados.proximaManutencao,
        materiaisConsumidos: dados.materiaisConsumidos,
        ferramentasUtilizadas: dados.ferramentasUtilizadas,
        avaliacaoQualidade: dados.avaliacaoQualidade,
        observacoesQualidade: dados.observacoesQualidade,
        aprovadoPor: 'Usuário Atual',
        dataAprovacao: agora.toISOString(),
        atualizadoEm: agora.toISOString()
      };
      
      mockExecucoesOS[index] = execucaoAtualizada;
      console.log('✅ Execução finalizada com sucesso');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao finalizar execução:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ CANCELAR EXECUÇÃO
  const cancelarExecucao = useCallback(async (id: string, motivo: string): Promise<{ success: boolean }> => {
    setLoading(true);
    try {
      console.log('❌ Cancelando execução:', id, motivo);
      await simulateDelay(1000);
      
      const index = mockExecucoesOS.findIndex(exec => exec.id === parseInt(id));
      if (index === -1) {
        throw new Error('Execução não encontrada');
      }
      
      const execucaoAtualizada = {
        ...mockExecucoesOS[index],
        statusExecucao: 'CANCELADA' as const,
        resultadoServico: `Execução cancelada: ${motivo}`,
        atualizadoEm: new Date().toISOString()
      };
      
      mockExecucoesOS[index] = execucaoAtualizada;
      console.log('✅ Execução cancelada com sucesso');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao cancelar execução:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ ATUALIZAR CHECKLIST
  const atualizarChecklist = useCallback(async (id: string, checklistAtividades: any[]): Promise<{ success: boolean }> => {
    setLoading(true);
    try {
      console.log('📋 Atualizando checklist:', id);
      await simulateDelay(800);
      
      const index = mockExecucoesOS.findIndex(exec => exec.id === parseInt(id));
      if (index === -1) {
        throw new Error('Execução não encontrada');
      }
      
      const execucaoAtualizada = {
        ...mockExecucoesOS[index],
        checklistAtividades,
        atualizadoEm: new Date().toISOString()
      };
      
      mockExecucoesOS[index] = execucaoAtualizada;
      console.log('✅ Checklist atualizado com sucesso');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao atualizar checklist:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ ADICIONAR ATIVIDADE
  const adicionarAtividade = useCallback(async (id: string, atividade: string): Promise<{ success: boolean }> => {
    setLoading(true);
    try {
      console.log('➕ Adicionando atividade:', id, atividade);
      await simulateDelay(600);
      
      const index = mockExecucoesOS.findIndex(exec => exec.id === parseInt(id));
      if (index === -1) {
        throw new Error('Execução não encontrada');
      }
      
      const novaAtividade = {
        id: generateId(),
        osId: id,
        atividade,
        concluida: false
      };
      
      const execucaoAtualizada = {
        ...mockExecucoesOS[index],
        checklistAtividades: [...mockExecucoesOS[index].checklistAtividades, novaAtividade],
        atualizadoEm: new Date().toISOString()
      };
      
      mockExecucoesOS[index] = execucaoAtualizada;
      console.log('✅ Atividade adicionada com sucesso');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao adicionar atividade:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ ATUALIZAR MATERIAIS CONSUMIDOS
  const atualizarMateriaisConsumidos = useCallback(async (id: string, materiais: MaterialConsumido[]): Promise<{ success: boolean }> => {
    setLoading(true);
    try {
      console.log('📦 Atualizando materiais consumidos:', id);
      await simulateDelay(800);
      
      const index = mockExecucoesOS.findIndex(exec => exec.id === parseInt(id));
      if (index === -1) {
        throw new Error('Execução não encontrada');
      }
      
      const execucaoAtualizada = {
        ...mockExecucoesOS[index],
        materiaisConsumidos: materiais,
        atualizadoEm: new Date().toISOString()
      };
      
      mockExecucoesOS[index] = execucaoAtualizada;
      console.log('✅ Materiais atualizados com sucesso');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao atualizar materiais:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ ATUALIZAR FERRAMENTAS UTILIZADAS
  const atualizarFerramentasUtilizadas = useCallback(async (id: string, ferramentas: FerramentaUtilizada[]): Promise<{ success: boolean }> => {
    setLoading(true);
    try {
      console.log('🔧 Atualizando ferramentas utilizadas:', id);
      await simulateDelay(800);
      
      const index = mockExecucoesOS.findIndex(exec => exec.id === parseInt(id));
      if (index === -1) {
        throw new Error('Execução não encontrada');
      }
      
      const execucaoAtualizada = {
        ...mockExecucoesOS[index],
        ferramentasUtilizadas: ferramentas,
        atualizadoEm: new Date().toISOString()
      };
      
      mockExecucoesOS[index] = execucaoAtualizada;
      console.log('✅ Ferramentas atualizadas com sucesso');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao atualizar ferramentas:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ REGISTRAR TEMPO
  const registrarTempo = useCallback(async (id: string, tecnicoId: string, atividade: string, tempoMinutos: number): Promise<{ success: boolean }> => {
    setLoading(true);
    try {
      console.log('⏱️ Registrando tempo:', id, tecnicoId, atividade, tempoMinutos);
      await simulateDelay(600);
      
      const index = mockExecucoesOS.findIndex(exec => exec.id === parseInt(id));
      if (index === -1) {
        throw new Error('Execução não encontrada');
      }
      
      const novoRegistro = {
        id: generateId(),
        osId: id,
        tecnicoId,
        tecnicoNome: 'Técnico',
        dataInicio: new Date().toISOString().split('T')[0],
        horaInicio: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        dataFim: new Date().toISOString().split('T')[0],
        horaFim: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        tempoTotal: tempoMinutos,
        atividade
      };
      
      const execucaoAtualizada = {
        ...mockExecucoesOS[index],
        registrosTempoTecnicos: [...mockExecucoesOS[index].registrosTempoTecnicos, novoRegistro],
        atualizadoEm: new Date().toISOString()
      };
      
      mockExecucoesOS[index] = execucaoAtualizada;
      console.log('✅ Tempo registrado com sucesso');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao registrar tempo:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ ADICIONAR ANEXO
  const adicionarAnexo = useCallback(async (id: string, anexo: any): Promise<{ success: boolean }> => {
    setLoading(true);
    try {
      console.log('📎 Adicionando anexo:', id, anexo);
      await simulateDelay(1200);
      
      const index = mockExecucoesOS.findIndex(exec => exec.id === parseInt(id));
      if (index === -1) {
        throw new Error('Execução não encontrada');
      }
      
      const novoAnexo = {
        id: generateId(),
        osId: id,
        tipo: anexo.tipo || 'documento',
        nome: anexo.nome,
        url: anexo.url || `/uploads/${anexo.nome}`,
        descricao: anexo.descricao,
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'Usuário Atual'
      };
      
      const execucaoAtualizada = {
        ...mockExecucoesOS[index],
        anexos: [...mockExecucoesOS[index].anexos, novoAnexo],
        atualizadoEm: new Date().toISOString()
      };
      
      mockExecucoesOS[index] = execucaoAtualizada;
      console.log('✅ Anexo adicionado com sucesso');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao adicionar anexo:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ REMOVER ANEXO
  const removerAnexo = useCallback(async (id: string, anexoId: string): Promise<{ success: boolean }> => {
    setLoading(true);
    try {
      console.log('🗑️ Removendo anexo:', id, anexoId);
      await simulateDelay(800);
      
      const index = mockExecucoesOS.findIndex(exec => exec.id === parseInt(id));
      if (index === -1) {
        throw new Error('Execução não encontrada');
      }
      
      const execucaoAtualizada = {
        ...mockExecucoesOS[index],
        anexos: mockExecucoesOS[index].anexos.filter(anexo => anexo.id !== anexoId),
        atualizadoEm: new Date().toISOString()
      };
      
      mockExecucoesOS[index] = execucaoAtualizada;
      console.log('✅ Anexo removido com sucesso');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao remover anexo:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ GERAR RELATÓRIO DE EXECUÇÃO
  const gerarRelatorioExecucao = useCallback(async (id: string): Promise<Blob> => {
    setLoading(true);
    try {
      console.log('📊 Gerando relatório de execução:', id);
      await simulateDelay(2000);
      
      const execucao = mockExecucoesOS.find(exec => exec.id === parseInt(id));
      if (!execucao) {
        throw new Error('Execução não encontrada');
      }
      
      const relatorio = `RELATÓRIO DE EXECUÇÃO DE OS
==========================================

OS: ${execucao.os.numeroOS}
Descrição: ${execucao.os.descricao}
Local: ${execucao.os.local}
Ativo: ${execucao.os.ativo}

EXECUÇÃO:
Status: ${execucao.statusExecucao}
Responsável: ${execucao.responsavelExecucao}
Equipe: ${execucao.equipePresente.join(', ')}
Início: ${execucao.dataInicioReal} às ${execucao.horaInicioReal}
${execucao.dataFimReal ? `Fim: ${execucao.dataFimReal} às ${execucao.horaFimReal}` : ''}

CHECKLIST:
${execucao.checklistAtividades.map(atividade => 
  `${atividade.concluida ? '✅' : '⬜'} ${atividade.atividade}`
).join('\n')}

RESULTADO:
${execucao.resultadoServico || 'Não informado'}

${execucao.problemasEncontrados ? `PROBLEMAS:\n${execucao.problemasEncontrados}\n` : ''}
${execucao.recomendacoes ? `RECOMENDAÇÕES:\n${execucao.recomendacoes}\n` : ''}

AVALIAÇÃO: ${execucao.avaliacaoQualidade ? `${execucao.avaliacaoQualidade}/5 estrelas` : 'Não avaliado'}
`;
      
      const blob = new Blob([relatorio], { type: 'text/plain;charset=utf-8;' });
      console.log('✅ Relatório gerado com sucesso');
      
      return blob;
    } catch (error) {
      console.error('❌ Erro ao gerar relatório:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ EXPORTAR DADOS DE EXECUÇÃO
  const exportarDadosExecucao = useCallback(async (ids: string[]): Promise<Blob> => {
    setLoading(true);
    try {
      console.log('📄 Exportando dados de execução:', ids);
      await simulateDelay(2500);
      
      const execucoesSelecionadas = mockExecucoesOS.filter(exec => ids.includes(exec.id.toString()));
      
      const header = 'OS,Descrição,Status,Responsável,Início,Fim,Duração,Avaliação\n';
      const csvContent = execucoesSelecionadas.map(exec => {
        const duracao = exec.tempoTotalExecucao ? `${Math.floor(exec.tempoTotalExecucao / 60)}h ${exec.tempoTotalExecucao % 60}min` : 'N/A';
        return `"${exec.os.numeroOS}","${exec.os.descricao}","${exec.statusExecucao}","${exec.responsavelExecucao}","${exec.dataInicioReal} ${exec.horaInicioReal}","${exec.dataFimReal || 'N/A'} ${exec.horaFimReal || ''}","${duracao}","${exec.avaliacaoQualidade || 'N/A'}/5"`;
      }).join('\n');
      
      const blob = new Blob([header + csvContent], { type: 'text/csv;charset=utf-8;' });
      console.log(`✅ Exportação concluída: ${execucoesSelecionadas.length} execuções`);
      
      return blob;
    } catch (error) {
      console.error('❌ Erro ao exportar dados:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    obterExecucao,
    editarExecucao,
    pausarExecucao,
    retomarExecucao,
    finalizarExecucao,
    cancelarExecucao,
    atualizarChecklist,
    adicionarAtividade,
    atualizarMateriaisConsumidos,
    atualizarFerramentasUtilizadas,
    registrarTempo,
    adicionarAnexo,
    removerAnexo,
    gerarRelatorioExecucao,
    exportarDadosExecucao
  };
};