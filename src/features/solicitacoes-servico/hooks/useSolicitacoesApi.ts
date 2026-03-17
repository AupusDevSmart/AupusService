// src/features/solicitacoes-servico/hooks/useSolicitacoesApi.ts
import { useState, useCallback } from 'react';
import {
  solicitacoesServicoService,
  SolicitacoesResponse,
  SolicitacoesStats,
} from '@/services/solicitacoes-servico.service';
import {
  SolicitacaoServico,
  SolicitacaoServicoFormData,
  AnalisarSolicitacaoDto,
  AprovarSolicitacaoDto,
  RejeitarSolicitacaoDto,
  CancelarSolicitacaoDto,
  ConcluirSolicitacaoDto,
  AdicionarComentarioDto,
} from '../types';

export function useSolicitacoesApi() {
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoServico[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchSolicitacoes = useCallback(async (params: any = {}) => {
    try {
      setLoading(true);
      const response: SolicitacoesResponse = await solicitacoesServicoService.findAll(params);
      setSolicitacoes(response.data || []);
      setTotal(response.pagination?.total || 0);
      setTotalPages(response.pagination?.totalPages || 0);
      setCurrentPage(response.pagination?.page || 1);
      return response;
    } catch (error) {
      console.error('Erro ao buscar solicitações:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const createSolicitacao = useCallback(async (data: SolicitacaoServicoFormData) => {
    try {
      setLoading(true);
      const response = await solicitacoesServicoService.create(data);
      return response;
    } catch (error) {
      console.error('Erro ao criar solicitação:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSolicitacao = useCallback(
    async (id: string, data: Partial<SolicitacaoServicoFormData>) => {
      try {
        setLoading(true);
        const response = await solicitacoesServicoService.update(id, data);
        return response;
      } catch (error) {
        console.error('Erro ao atualizar solicitação:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteSolicitacao = useCallback(async (id: string) => {
    try {
      setLoading(true);
      await solicitacoesServicoService.remove(id);
    } catch (error) {
      console.error('Erro ao deletar solicitação:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const getStats = useCallback(async (periodo?: string): Promise<SolicitacoesStats> => {
    try {
      const stats = await solicitacoesServicoService.getStats(periodo);
      return stats;
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      throw error;
    }
  }, []);

  // Ações de workflow
  const enviar = useCallback(async (id: string, observacoes?: string) => {
    try {
      setLoading(true);
      const response = await solicitacoesServicoService.enviar(id, { observacoes });
      return response;
    } catch (error) {
      console.error('Erro ao enviar solicitação:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const analisar = useCallback(async (id: string, dto: AnalisarSolicitacaoDto) => {
    try {
      setLoading(true);
      const response = await solicitacoesServicoService.analisar(id, dto);
      return response;
    } catch (error) {
      console.error('Erro ao analisar solicitação:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const aprovar = useCallback(async (id: string, dto?: AprovarSolicitacaoDto) => {
    try {
      setLoading(true);
      const response = await solicitacoesServicoService.aprovar(id, dto);
      return response;
    } catch (error) {
      console.error('Erro ao aprovar solicitação:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const rejeitar = useCallback(async (id: string, dto: RejeitarSolicitacaoDto) => {
    try {
      setLoading(true);
      const response = await solicitacoesServicoService.rejeitar(id, dto);
      return response;
    } catch (error) {
      console.error('Erro ao rejeitar solicitação:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelar = useCallback(async (id: string, dto: CancelarSolicitacaoDto) => {
    try {
      setLoading(true);
      const response = await solicitacoesServicoService.cancelar(id, dto);
      return response;
    } catch (error) {
      console.error('Erro ao cancelar solicitação:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const concluir = useCallback(async (id: string, dto?: ConcluirSolicitacaoDto) => {
    try {
      setLoading(true);
      const response = await solicitacoesServicoService.concluir(id, dto);
      return response;
    } catch (error) {
      console.error('Erro ao concluir solicitação:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const getComentarios = useCallback(async (id: string) => {
    try {
      const comentarios = await solicitacoesServicoService.getComentarios(id);
      return comentarios;
    } catch (error) {
      console.error('Erro ao buscar comentários:', error);
      throw error;
    }
  }, []);

  const adicionarComentario = useCallback(async (id: string, dto: AdicionarComentarioDto) => {
    try {
      const comentario = await solicitacoesServicoService.adicionarComentario(id, dto);
      return comentario;
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      throw error;
    }
  }, []);

  const getHistorico = useCallback(async (id: string) => {
    try {
      const historico = await solicitacoesServicoService.getHistorico(id);
      return historico;
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      throw error;
    }
  }, []);

  return {
    solicitacoes,
    loading,
    total,
    totalPages,
    currentPage,
    fetchSolicitacoes,
    createSolicitacao,
    updateSolicitacao,
    deleteSolicitacao,
    getStats,
    enviar,
    analisar,
    aprovar,
    rejeitar,
    cancelar,
    concluir,
    getComentarios,
    adicionarComentario,
    getHistorico,
  };
}
