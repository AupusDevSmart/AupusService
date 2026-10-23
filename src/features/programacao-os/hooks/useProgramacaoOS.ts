// src/features/programacao-os/hooks/useProgramacaoOS.ts
import { useState, useCallback } from 'react';
import {
  programacaoOSApi,
  type ProgramacaoResponse,
  type ProgramacaoDetalhesResponse,
  type CreateProgramacaoDto,
  type CreateProgramacaoAnomaliaDto,
  type CreateProgramacaoTarefasDto,
  type ProgramacaoFiltersDto,
} from '@/services/programacao-os.service';
import { api } from '@/config/api';
import { formatApiError, mensagemDoBackend } from '@/utils/api-error';

interface IniciarExecucaoData {
  equipePresente: string[];
  responsavelExecucao: string;
  observacoesInicio?: string;
}

export const useProgramacaoOS = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função para lidar com erros
  const handleError = useCallback((error: unknown, defaultMessage: string): never => {
    // A API manda a mensagem em `error.message` ({ success: false, error: {...} });
    // ler só `data.message` caía no "Request failed with status code 409"
    const errorMessage = (error ? formatApiError(error) : '') || defaultMessage;
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
  const listarProgramacoes = useCallback(async (filters: ProgramacaoFiltersDto) => {
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
          // O que foi pedido, e nao um 10 fixo: senao o seletor de linhas
          // por pagina pulava para 10 sozinho quando a busca falhava.
          limit: filters?.limit ?? 10,
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
  const criarDeAnomalia = useCallback(async (anomaliaId: string, ajustes?: CreateProgramacaoAnomaliaDto['ajustes']) => {
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
  const criarDeTarefas = useCallback(async (data: CreateProgramacaoTarefasDto) => {
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

  // Inicia a execução pela programação (chama a API de execução)
  const iniciarExecucao = useCallback(async (programacaoId: string, dados: IniciarExecucaoData) => {
    console.log('▶️ Iniciando execução da OS a partir da programação:', programacaoId, dados);
    setLoading(true);

    try {
      // ✅ Chamada real para a API de execução-os
      const response = await api.post<{ message?: string; os_id?: string }>(
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
    } catch (error) {
      console.error('❌ Erro ao iniciar execução:', error);
      setError(mensagemDoBackend(error) || 'Erro ao iniciar execução');
      throw error;
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

    // Planejar, finalizar, cancelar e exportar daqui eram simulações (esperavam
    // e respondiam "sucesso" sem chamar a API) e saíram: as de verdade são as da
    // execução da OS. A exportação da lista é a do SN-63, na Execução de OS
    iniciarExecucao,
  };
};