// src/features/execucao-os/hooks/useExecucaoOS.ts
import { useState, useCallback } from 'react';
import { execucaoOSApi } from '@/services/execucao-os.service';
import type {
  ExecucaoOSApiResponse,
  ExecucaoOSListApiResponse,
  QueryExecucaoOSApiParams,
  IniciarExecucaoApiData,
  PausarExecucaoApiData,
  RetomarExecucaoApiData,
  FinalizarExecucaoApiData,
  CancelarExecucaoApiData,
  AtualizarProgressoApiData,
  ExecutarTarefaApiData,
  TarefaExecucaoApiResponse,
  AnexoExecucaoApiResponse,
  EquipeExecucaoApiResponse,
  PausaExecucaoApiResponse,
  TipoAnexoExecucao
} from '@/services/execucao-os.service';

interface UseExecucaoOSReturn {
  // Estados
  loading: boolean;
  error: string | null;

  // Operações de listagem e busca
  listarExecucoes: (params?: QueryExecucaoOSApiParams) => Promise<ExecucaoOSListApiResponse>;
  buscarExecucao: (id: string) => Promise<ExecucaoOSApiResponse>;
  getDashboard: () => Promise<any>;

  // Operações de fluxo de execução
  iniciarExecucao: (id: string, data: IniciarExecucaoApiData) => Promise<ExecucaoOSApiResponse>;
  pausarExecucao: (id: string, data: PausarExecucaoApiData) => Promise<ExecucaoOSApiResponse>;
  retomarExecucao: (id: string, data: RetomarExecucaoApiData) => Promise<ExecucaoOSApiResponse>;
  finalizarExecucao: (id: string, data: FinalizarExecucaoApiData) => Promise<ExecucaoOSApiResponse>;
  cancelarExecucao: (id: string, data: CancelarExecucaoApiData) => Promise<ExecucaoOSApiResponse>;
  atualizarProgresso: (id: string, data: AtualizarProgressoApiData) => Promise<ExecucaoOSApiResponse>;

  // Operações de aprovação
  aprovarExecucao: (id: string, observacoes?: string, aprovadoPor?: string) => Promise<ExecucaoOSApiResponse>;
  reprovarExecucao: (id: string, motivo: string, reprovadoPor?: string) => Promise<ExecucaoOSApiResponse>;

  // Operações de tarefas
  listarTarefas: (id: string) => Promise<TarefaExecucaoApiResponse[]>;
  executarTarefa: (id: string, tarefaId: string, data: ExecutarTarefaApiData) => Promise<TarefaExecucaoApiResponse>;

  // Operações de equipe
  listarEquipe: (id: string) => Promise<EquipeExecucaoApiResponse[]>;
  adicionarMembroEquipe: (id: string, tecnicoId: string, papel: 'RESPONSAVEL' | 'AUXILIAR' | 'SUPERVISOR') => Promise<EquipeExecucaoApiResponse>;
  removerMembroEquipe: (id: string, membroId: string) => Promise<void>;

  // Operações de anexos
  listarAnexos: (id: string) => Promise<AnexoExecucaoApiResponse[]>;
  uploadAnexo: (id: string, file: File, tipo: TipoAnexoExecucao, descricao?: string, usuarioId?: string) => Promise<AnexoExecucaoApiResponse>;
  downloadAnexo: (id: string, anexoId: string) => Promise<Blob>;
  removerAnexo: (id: string, anexoId: string) => Promise<void>;

  // Operações de histórico e pausas
  listarPausas: (id: string) => Promise<PausaExecucaoApiResponse[]>;
  buscarHistoricoCompleto: (id: string) => Promise<any>;

  // Relatórios
  getRelatorioPerformance: (params?: any) => Promise<any>;
  getRelatorioCustos: (params?: any) => Promise<any>;
  getRelatorioEficiencia: (params?: any) => Promise<any>;
}

export const useExecucaoOS = (): UseExecucaoOSReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função helper para tratamento de erros
  const handleError = useCallback((err: any, defaultMessage: string) => {
    console.error('❌ [useExecucaoOS] Erro:', err);
    const errorMessage = err?.response?.data?.message || err?.message || defaultMessage;
    setError(errorMessage);
    throw err;
  }, []);

  // ============================================================================
  // LISTAGEM E BUSCA
  // ============================================================================

  const listarExecucoes = useCallback(async (params?: QueryExecucaoOSApiParams): Promise<ExecucaoOSListApiResponse> => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 [useExecucaoOS] Listando execuções com params:', params);
      const response = await execucaoOSApi.findAll(params);
      console.log('✅ [useExecucaoOS] Execuções listadas:', response.pagination);
      return response;
    } catch (err) {
      return handleError(err, 'Erro ao listar execuções');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const buscarExecucao = useCallback(async (id: string): Promise<ExecucaoOSApiResponse> => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 [useExecucaoOS] Buscando execução:', id);
      const response = await execucaoOSApi.findOne(id);
      console.log('✅ [useExecucaoOS] Execução encontrada:', response.numero_execucao);
      return response;
    } catch (err) {
      return handleError(err, 'Erro ao buscar execução');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const getDashboard = useCallback(async (): Promise<any> => {
    setLoading(true);
    setError(null);
    try {
      console.log('📊 [useExecucaoOS] Carregando dashboard');
      const response = await execucaoOSApi.getDashboard();
      console.log('✅ [useExecucaoOS] Dashboard carregado');
      return response;
    } catch (err) {
      return handleError(err, 'Erro ao carregar dashboard');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // ============================================================================
  // FLUXO DE EXECUÇÃO
  // ============================================================================

  const iniciarExecucao = useCallback(async (id: string, data: IniciarExecucaoApiData): Promise<ExecucaoOSApiResponse> => {
    setLoading(true);
    setError(null);
    try {
      console.log('▶️ [useExecucaoOS] Iniciando execução:', id);
      const response = await execucaoOSApi.iniciar(id, data);
      console.log('✅ [useExecucaoOS] Execução iniciada');
      return response;
    } catch (err) {
      return handleError(err, 'Erro ao iniciar execução');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const pausarExecucao = useCallback(async (id: string, data: PausarExecucaoApiData): Promise<ExecucaoOSApiResponse> => {
    setLoading(true);
    setError(null);
    try {
      console.log('⏸️ [useExecucaoOS] Pausando execução:', id);
      const response = await execucaoOSApi.pausar(id, data);
      console.log('✅ [useExecucaoOS] Execução pausada');
      return response;
    } catch (err) {
      return handleError(err, 'Erro ao pausar execução');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const retomarExecucao = useCallback(async (id: string, data: RetomarExecucaoApiData): Promise<ExecucaoOSApiResponse> => {
    setLoading(true);
    setError(null);
    try {
      console.log('▶️ [useExecucaoOS] Retomando execução:', id);
      const response = await execucaoOSApi.retomar(id, data);
      console.log('✅ [useExecucaoOS] Execução retomada');
      return response;
    } catch (err) {
      return handleError(err, 'Erro ao retomar execução');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const finalizarExecucao = useCallback(async (id: string, data: FinalizarExecucaoApiData): Promise<ExecucaoOSApiResponse> => {
    setLoading(true);
    setError(null);
    try {
      console.log('🏁 [useExecucaoOS] Finalizando execução:', id);
      const response = await execucaoOSApi.finalizar(id, data);
      console.log('✅ [useExecucaoOS] Execução finalizada');
      return response;
    } catch (err) {
      return handleError(err, 'Erro ao finalizar execução');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const cancelarExecucao = useCallback(async (id: string, data: CancelarExecucaoApiData): Promise<ExecucaoOSApiResponse> => {
    setLoading(true);
    setError(null);
    try {
      console.log('❌ [useExecucaoOS] Cancelando execução:', id);
      const response = await execucaoOSApi.cancelar(id, data);
      console.log('✅ [useExecucaoOS] Execução cancelada');
      return response;
    } catch (err) {
      return handleError(err, 'Erro ao cancelar execução');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const atualizarProgresso = useCallback(async (id: string, data: AtualizarProgressoApiData): Promise<ExecucaoOSApiResponse> => {
    setLoading(true);
    setError(null);
    try {
      console.log('📈 [useExecucaoOS] Atualizando progresso:', id);
      const response = await execucaoOSApi.atualizarProgresso(id, data);
      console.log('✅ [useExecucaoOS] Progresso atualizado');
      return response;
    } catch (err) {
      return handleError(err, 'Erro ao atualizar progresso');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // ============================================================================
  // APROVAÇÃO
  // ============================================================================

  const aprovarExecucao = useCallback(async (id: string, observacoes?: string, aprovadoPor?: string): Promise<ExecucaoOSApiResponse> => {
    setLoading(true);
    setError(null);
    try {
      console.log('✅ [useExecucaoOS] Aprovando execução:', id);
      const response = await execucaoOSApi.aprovar(id, observacoes, aprovadoPor);
      console.log('✅ [useExecucaoOS] Execução aprovada');
      return response;
    } catch (err) {
      return handleError(err, 'Erro ao aprovar execução');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const reprovarExecucao = useCallback(async (id: string, motivo: string, reprovadoPor?: string): Promise<ExecucaoOSApiResponse> => {
    setLoading(true);
    setError(null);
    try {
      console.log('❌ [useExecucaoOS] Reprovando execução:', id);
      const response = await execucaoOSApi.reprovar(id, motivo, reprovadoPor);
      console.log('✅ [useExecucaoOS] Execução reprovada');
      return response;
    } catch (err) {
      return handleError(err, 'Erro ao reprovar execução');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // ============================================================================
  // TAREFAS
  // ============================================================================

  const listarTarefas = useCallback(async (id: string): Promise<TarefaExecucaoApiResponse[]> => {
    setLoading(true);
    setError(null);
    try {
      console.log('📋 [useExecucaoOS] Listando tarefas:', id);
      const response = await execucaoOSApi.getTarefas(id);
      console.log('✅ [useExecucaoOS] Tarefas listadas:', response.length);
      return response;
    } catch (err) {
      return handleError(err, 'Erro ao listar tarefas');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const executarTarefa = useCallback(async (id: string, tarefaId: string, data: ExecutarTarefaApiData): Promise<TarefaExecucaoApiResponse> => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔧 [useExecucaoOS] Executando tarefa:', tarefaId);
      const response = await execucaoOSApi.executarTarefa(id, tarefaId, data);
      console.log('✅ [useExecucaoOS] Tarefa executada');
      return response;
    } catch (err) {
      return handleError(err, 'Erro ao executar tarefa');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // ============================================================================
  // EQUIPE
  // ============================================================================

  const listarEquipe = useCallback(async (id: string): Promise<EquipeExecucaoApiResponse[]> => {
    setLoading(true);
    setError(null);
    try {
      console.log('👥 [useExecucaoOS] Listando equipe:', id);
      const response = await execucaoOSApi.getEquipe(id);
      console.log('✅ [useExecucaoOS] Equipe listada:', response.length);
      return response;
    } catch (err) {
      return handleError(err, 'Erro ao listar equipe');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const adicionarMembroEquipe = useCallback(async (
    id: string,
    tecnicoId: string,
    papel: 'RESPONSAVEL' | 'AUXILIAR' | 'SUPERVISOR'
  ): Promise<EquipeExecucaoApiResponse> => {
    setLoading(true);
    setError(null);
    try {
      console.log('➕ [useExecucaoOS] Adicionando membro à equipe:', tecnicoId);
      const response = await execucaoOSApi.adicionarMembro(id, tecnicoId, papel);
      console.log('✅ [useExecucaoOS] Membro adicionado');
      return response;
    } catch (err) {
      return handleError(err, 'Erro ao adicionar membro à equipe');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const removerMembroEquipe = useCallback(async (id: string, membroId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      console.log('➖ [useExecucaoOS] Removendo membro da equipe:', membroId);
      await execucaoOSApi.removerMembro(id, membroId);
      console.log('✅ [useExecucaoOS] Membro removido');
    } catch (err) {
      return handleError(err, 'Erro ao remover membro da equipe');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // ============================================================================
  // ANEXOS
  // ============================================================================

  const listarAnexos = useCallback(async (id: string): Promise<AnexoExecucaoApiResponse[]> => {
    setLoading(true);
    setError(null);
    try {
      console.log('📎 [useExecucaoOS] Listando anexos:', id);
      const response = await execucaoOSApi.getAnexos(id);
      console.log('✅ [useExecucaoOS] Anexos listados:', response.length);
      return response;
    } catch (err) {
      return handleError(err, 'Erro ao listar anexos');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const uploadAnexo = useCallback(async (
    id: string,
    file: File,
    tipo: TipoAnexoExecucao,
    descricao?: string,
    usuarioId?: string
  ): Promise<AnexoExecucaoApiResponse> => {
    setLoading(true);
    setError(null);
    try {
      console.log('📤 [useExecucaoOS] Fazendo upload de anexo:', file.name);
      const response = await execucaoOSApi.uploadAnexo(id, file, tipo, descricao, usuarioId);
      console.log('✅ [useExecucaoOS] Anexo enviado');
      return response;
    } catch (err) {
      return handleError(err, 'Erro ao fazer upload de anexo');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const downloadAnexo = useCallback(async (id: string, anexoId: string): Promise<Blob> => {
    setLoading(true);
    setError(null);
    try {
      console.log('📥 [useExecucaoOS] Baixando anexo:', anexoId);
      const response = await execucaoOSApi.downloadAnexo(id, anexoId);
      console.log('✅ [useExecucaoOS] Anexo baixado');
      return response;
    } catch (err) {
      return handleError(err, 'Erro ao baixar anexo');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const removerAnexo = useCallback(async (id: string, anexoId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      console.log('🗑️ [useExecucaoOS] Removendo anexo:', anexoId);
      await execucaoOSApi.deleteAnexo(id, anexoId);
      console.log('✅ [useExecucaoOS] Anexo removido');
    } catch (err) {
      return handleError(err, 'Erro ao remover anexo');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // ============================================================================
  // HISTÓRICO E PAUSAS
  // ============================================================================

  const listarPausas = useCallback(async (id: string): Promise<PausaExecucaoApiResponse[]> => {
    setLoading(true);
    setError(null);
    try {
      console.log('⏸️ [useExecucaoOS] Listando pausas:', id);
      const response = await execucaoOSApi.getPausas(id);
      console.log('✅ [useExecucaoOS] Pausas listadas:', response.length);
      return response;
    } catch (err) {
      return handleError(err, 'Erro ao listar pausas');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const buscarHistoricoCompleto = useCallback(async (id: string): Promise<any> => {
    setLoading(true);
    setError(null);
    try {
      console.log('📜 [useExecucaoOS] Buscando histórico completo:', id);
      const response = await execucaoOSApi.getHistoricoCompleto(id);
      console.log('✅ [useExecucaoOS] Histórico carregado');
      return response;
    } catch (err) {
      return handleError(err, 'Erro ao buscar histórico');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // ============================================================================
  // RELATÓRIOS
  // ============================================================================

  const getRelatorioPerformance = useCallback(async (params?: any): Promise<any> => {
    setLoading(true);
    setError(null);
    try {
      console.log('📊 [useExecucaoOS] Gerando relatório de performance');
      const response = await execucaoOSApi.getRelatorioPerformance(params);
      console.log('✅ [useExecucaoOS] Relatório gerado');
      return response;
    } catch (err) {
      return handleError(err, 'Erro ao gerar relatório de performance');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const getRelatorioCustos = useCallback(async (params?: any): Promise<any> => {
    setLoading(true);
    setError(null);
    try {
      console.log('💰 [useExecucaoOS] Gerando relatório de custos');
      const response = await execucaoOSApi.getRelatorioCustos(params);
      console.log('✅ [useExecucaoOS] Relatório gerado');
      return response;
    } catch (err) {
      return handleError(err, 'Erro ao gerar relatório de custos');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const getRelatorioEficiencia = useCallback(async (params?: any): Promise<any> => {
    setLoading(true);
    setError(null);
    try {
      console.log('⚡ [useExecucaoOS] Gerando relatório de eficiência');
      const response = await execucaoOSApi.getRelatorioEficiencia(params);
      console.log('✅ [useExecucaoOS] Relatório gerado');
      return response;
    } catch (err) {
      return handleError(err, 'Erro ao gerar relatório de eficiência');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // ============================================================================
  // RETORNO DO HOOK
  // ============================================================================

  return {
    loading,
    error,

    // Listagem e busca
    listarExecucoes,
    buscarExecucao,
    getDashboard,

    // Fluxo de execução
    iniciarExecucao,
    pausarExecucao,
    retomarExecucao,
    finalizarExecucao,
    cancelarExecucao,
    atualizarProgresso,

    // Aprovação
    aprovarExecucao,
    reprovarExecucao,

    // Tarefas
    listarTarefas,
    executarTarefa,

    // Equipe
    listarEquipe,
    adicionarMembroEquipe,
    removerMembroEquipe,

    // Anexos
    listarAnexos,
    uploadAnexo,
    downloadAnexo,
    removerAnexo,

    // Histórico e pausas
    listarPausas,
    buscarHistoricoCompleto,

    // Relatórios
    getRelatorioPerformance,
    getRelatorioCustos,
    getRelatorioEficiencia
  };
};
