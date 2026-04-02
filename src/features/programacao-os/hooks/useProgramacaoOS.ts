// src/features/programacao-os/hooks/useProgramacaoOS.ts
import { useState, useCallback } from 'react';
import { programacaoOSApi, type ProgramacaoResponse, type ProgramacaoDetalhesResponse, type CreateProgramacaoDto } from '@/services/programacao-os.service';

interface IniciarExecucaoData {
  equipePresente: string[];
  responsavelExecucao: string;
  observacoesInicio?: string;
}

export const useProgramacaoOS = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função para lidar com erros
  const handleError = useCallback((error: any, defaultMessage: string): never => {
    // console.error(error);
    const errorMessage = error?.response?.data?.message || error?.message || defaultMessage;
    setError(errorMessage);
    throw new Error(errorMessage);
  }, []);

  // Criar programação
  const criarProgramacao = useCallback(async (data: CreateProgramacaoDto): Promise<ProgramacaoResponse> => {
    setLoading(true);
    setError(null);

    try {
      const result = await programacaoOSApi.criar(data);
      return result;
    } catch (error) {
      return handleError(error, 'Erro ao criar programação de OS');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // Atualizar programação
  const atualizarProgramacao = useCallback(async (id: string, data: Partial<CreateProgramacaoDto>): Promise<ProgramacaoResponse> => {
    setLoading(true);
    setError(null);

    try {
      const result = await programacaoOSApi.atualizar(id, data);
      return result;
    } catch (error) {
      return handleError(error, 'Erro ao atualizar programação de OS');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // Listar programações
  const listarProgramacoes = useCallback(async (filters: any) => {
    setLoading(true);
    setError(null);

    try {
      const result = await programacaoOSApi.listar(filters);
      return result;
    } catch (error) {
      console.error('Erro ao listar programações:', error);
      // Retornar estrutura válida mesmo em caso de erro
      return {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        },
        stats: {
          pendentes: 0,
          aprovadas: 0,
          finalizadas: 0,
          canceladas: 0
        }
      };
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // Buscar por ID
  const buscarProgramacao = useCallback(async (id: string): Promise<ProgramacaoDetalhesResponse> => {
    setLoading(true);
    setError(null);

    try {
      const result = await programacaoOSApi.buscarPorId(id);
      return result;
    } catch (error) {
      return handleError(error, 'Erro ao buscar programação');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // Aprovar programação
  const aprovarProgramacao = useCallback(async (id: string, observacoes?: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await programacaoOSApi.aprovar(id, { observacoes });
      return result;
    } catch (error) {
      return handleError(error, 'Erro ao aprovar programação');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // Finalizar programação
  const finalizarProgramacao = useCallback(async (id: string, observacoes?: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await programacaoOSApi.finalizar(id, { observacoes });
      return result;
    } catch (error) {
      return handleError(error, 'Erro ao finalizar programação');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // Cancelar programação
  const cancelarProgramacao = useCallback(async (id: string, motivo: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await programacaoOSApi.cancelar(id, { motivo_cancelamento: motivo });
      return result;
    } catch (error) {
      return handleError(error, 'Erro ao cancelar programação');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // Criar de anomalia
  const criarDeAnomalia = useCallback(async (anomaliaId: string, ajustes?: any) => {
    setLoading(true);
    setError(null);

    try {
      const result = await programacaoOSApi.criarDeAnomalia(anomaliaId, { ajustes });
      return result;
    } catch (error) {
      return handleError(error, 'Erro ao criar programação de anomalia');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // Criar de tarefas
  const criarDeTarefas = useCallback(async (data: any) => {
    setLoading(true);
    setError(null);

    try {
      const result = await programacaoOSApi.criarDeTarefas(data);
      return result;
    } catch (error) {
      return handleError(error, 'Erro ao criar programação de tarefas');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // Deletar programação
  const deletarProgramacao = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await programacaoOSApi.deletar(id);
      return result;
    } catch (error) {
      return handleError(error, 'Erro ao deletar programação');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // Funções de compatibilidade para transição (simulam execução de OS)
  const planejarOS = useCallback(async (id: string, dados: any) => {
    // console.log('🔧 Planejando OS:', id, dados);
    // Aqui você chamaria a API de execução de OS quando ela estiver pronta
    // Por enquanto, simula o comportamento
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      // console.log('✅ OS Planejada com sucesso');
      return { success: true, message: 'OS planejada com sucesso' };
    } finally {
      setLoading(false);
    }
  }, []);

  const iniciarExecucao = useCallback(async (programacaoId: string, dados: IniciarExecucaoData) => {
    console.log('▶️ Iniciando execução da OS a partir da programação:', programacaoId, dados);
    setLoading(true);

    try {
      // ✅ Chamada real para a API de execução-os
      const response = await programacaoOSApi.post(
        `/execucao-os/iniciar-de-programacao/${programacaoId}`,
        {
          responsavel_execucao: dados.responsavelExecucao,
          equipe_presente: dados.equipePresente,
          observacoes_inicio: dados.observacoesInicio,
          data_hora_inicio_real: new Date().toISOString(),
        }
      );

      console.log('✅ Execução iniciada com sucesso:', response.data);

      return {
        success: true,
        message: response.data.message || 'Execução iniciada com sucesso!',
        execucaoId: response.data.os_id
      };
    } catch (error: any) {
      console.error('❌ Erro ao iniciar execução:', error);
      setError(error.response?.data?.message || 'Erro ao iniciar execução');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const finalizarOS = useCallback(async (id: string, observacoes?: string) => {
    // console.log('🏁 Finalizando OS:', id, observacoes);
    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      // console.log('✅ OS Finalizada com sucesso');
      return { success: true, message: 'OS finalizada com sucesso' };
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelarOS = useCallback(async (id: string, motivo: string) => {
    // console.log('🚫 Cancelando OS:', id, 'Motivo:', motivo);
    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      // console.log('✅ OS Cancelada com sucesso');
      return { success: true, message: 'OS cancelada com sucesso' };
    } finally {
      setLoading(false);
    }
  }, []);

  const exportarOS = useCallback(async (filters: any) => {
    // console.log('📄 Exportando OS com filtros:', filters);
    setLoading(true);
    
    try {
      // Simula geração de CSV
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const csvContent = `OS,Descrição,Status,Data\nOS-001,Manutenção preventiva,FINALIZADA,2024-08-01`;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // console.log('✅ Exportação concluída');
      return blob;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    setError,

    // Funções principais da API
    criarProgramacao,
    atualizarProgramacao,
    listarProgramacoes,
    buscarProgramacao,
    aprovarProgramacao,
    finalizarProgramacao,
    cancelarProgramacao,
    criarDeAnomalia,
    criarDeTarefas,
    deletarProgramacao,

    // Funções de compatibilidade (simulando execução)
    planejarOS,
    iniciarExecucao,
    finalizarOS,
    cancelarOS,
    exportarOS
  };
};