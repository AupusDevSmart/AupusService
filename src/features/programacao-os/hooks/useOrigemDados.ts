// src/features/programacao-os/hooks/useOrigemDados.ts
import { useState, useCallback } from 'react';
import { anomaliasService } from '@/services/anomalias.service';

interface AnomaliaDisponivel {
  id: string;
  descricao: string;
  local: string;
  ativo: string;
  prioridade: string;
  status: string;
  data: string;
  equipamentoId?: string;
  plantaId?: string;
  unidadeId?: string;
  plantaNome?: string;
  unidadeNome?: string;
  condicao?: string;
  origem?: string;
}

interface PlanoDisponivel {
  id: string;
  nome: string;
  categoria: string;
  totalTarefas: number;
  totalEquipamentos: number;
  ativo: boolean;
  tarefasTemplate: any[];
  plantaId?: string;
}

interface SolicitacaoDisponivel {
  id: string;
  numero: string;
  titulo: string;
  descricao: string;
  tipo: string;
  prioridade: string;
  status: string;
  local: string;
  plantaId?: string;
  unidadeId?: string;
  plantaNome?: string;
  unidadeNome?: string;
  equipamentoId?: string;
  solicitanteNome: string;
  dataSolicitacao: string;
}

export const useOrigemDados = () => {
  const [loading, setLoading] = useState(false);
  const [anomaliasDisponiveis, setAnomaliasDisponiveis] = useState<AnomaliaDisponivel[]>([]);
  const [planosDisponiveis, setPlanosDisponiveis] = useState<PlanoDisponivel[]>([]);
  const [solicitacoesDisponiveis, setSolicitacoesDisponiveis] = useState<SolicitacaoDisponivel[]>([]);

  // Carregar anomalias disponíveis (apenas registradas)
  const carregarAnomalias = useCallback(async () => {
    setLoading(true);
    try {
      const filtros = {
        page: 1,
        limit: 100,
        search: '',
        periodo: 'all',
        status: 'REGISTRADA',
        prioridade: 'all',
        origem: 'all',
        planta: 'all',
        unidade: 'all'
      };

      const response = await anomaliasService.findAll(filtros);

      const anomaliasFiltradas = response.data
        .filter(anomalia => anomalia.status === 'REGISTRADA')
        .map(anomalia => ({
          id: String(anomalia.id),
          descricao: anomalia.descricao,
          local: anomalia.local,
          ativo: anomalia.ativo,
          prioridade: anomalia.prioridade,
          status: anomalia.status,
          data: anomalia.created_at || anomalia.data || new Date().toISOString(),
          equipamentoId: anomalia.equipamento_id?.toString() || anomalia.equipamentoId?.toString(),
          plantaId: anomalia.planta_id?.toString() || anomalia.plantaId?.toString(),
          unidadeId: anomalia.unidade_id?.toString() || anomalia.unidadeId?.toString(),
          plantaNome: anomalia.planta?.nome || anomalia.equipamento?.planta?.nome,
          unidadeNome: anomalia.unidade?.nome || anomalia.equipamento?.unidade?.nome,
          condicao: anomalia.condicao,
          origem: anomalia.origem
        }));

      setAnomaliasDisponiveis(anomaliasFiltradas);

    } catch (error) {
      setAnomaliasDisponiveis([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregar planos de manutenção ativos
  const carregarPlanos = useCallback(async (plantaId?: string, unidadeId?: string) => {
    console.log('🔍 [useOrigemDados] INÍCIO - Carregando planos de manutenção...', {
      plantaId,
      unidadeId,
      timestamp: new Date().toISOString()
    });

    setLoading(true);
    try {
      console.log('📡 [useOrigemDados] Importando serviço da API...');

      // Usar o serviço diretamente (não o hook, para evitar erro de hook call)
      const { planosManutencaoApi } = await import('@/services/planos-manutencao.services');

      console.log('✅ [useOrigemDados] Serviço da API importado com sucesso');

      let response;

      // ✅ PRIORIDADE 1: Filtrar por unidade (mais específico)
      if (unidadeId) {
        const cleanUnidadeId = unidadeId.trim();
        console.log('🎯 [useOrigemDados] Usando endpoint POR UNIDADE - /por-unidade/' + cleanUnidadeId);

        response = await planosManutencaoApi.findByUnidade(cleanUnidadeId, {
          status: 'ATIVO',
          limit: 100,
          page: 1,
          incluir_tarefas: false
        });

        console.log('📊 [useOrigemDados] Resposta do endpoint por unidade:', {
          total: response.data?.length || 0,
          pagination: response.pagination
        });
      }
      // ✅ PRIORIDADE 2: Filtrar por planta
      else if (plantaId) {
        const cleanPlantaId = plantaId.trim();
        console.log('🎯 [useOrigemDados] Usando endpoint POR PLANTA - /por-planta/' + cleanPlantaId);

        response = await planosManutencaoApi.findByPlanta(cleanPlantaId, {
          status: 'ATIVO',
          limit: 100,
          page: 1,
          incluir_tarefas: false
        });

        console.log('📊 [useOrigemDados] Resposta do endpoint por planta:', {
          total: response.data?.length || 0,
          pagination: response.pagination
        });
      }
      // ✅ FALLBACK: Endpoint geral (não recomendado para OS)
      else {
        console.log('📋 [useOrigemDados] Usando endpoint GERAL - /planos-manutencao');

        response = await planosManutencaoApi.findAll({
          status: 'ATIVO',
          limit: 100,
          page: 1
        });

        console.log('📊 [useOrigemDados] Resposta do endpoint geral:', {
          total: response.data?.length || 0,
          pagination: response.pagination
        });
      }

      console.log('🔄 [useOrigemDados] Iniciando formatação dos planos...');

      const planosFormatados: PlanoDisponivel[] = response.data.map((plano, index) => {
        console.log(`🔍 [useOrigemDados] Formatando plano ${index + 1}:`, {
          id: plano.id,
          nome: plano.nome,
          status: plano.status,
          equipamento: plano.equipamento,
          total_tarefas: plano.total_tarefas,
          tarefasArray: plano.tarefas
        });

        const planoFormatado = {
          id: plano.id,
          nome: plano.nome,
          categoria: plano.equipamento?.tipo_equipamento || 'GERAL', // Usar tipo do equipamento como categoria
          totalTarefas: plano.total_tarefas || 0,
          totalEquipamentos: 1, // Cada plano tem 1 equipamento
          ativo: plano.status === 'ATIVO',
          tarefasTemplate: plano.tarefas || [],
          plantaId: plano.equipamento?.planta?.id
        };

        console.log(`✅ [useOrigemDados] Plano ${index + 1} formatado:`, planoFormatado);

        return planoFormatado;
      });

      console.log('🎉 [useOrigemDados] SUCESSO - Planos formatados:', {
        quantidadeTotal: planosFormatados.length,
        planosAtivos: planosFormatados.filter(p => p.ativo).length,
        categorias: [...new Set(planosFormatados.map(p => p.categoria))],
        plantas: [...new Set(planosFormatados.map(p => p.plantaId).filter(Boolean))]
      });

      setPlanosDisponiveis(planosFormatados);

    } catch (error) {
      console.error('❌ [useOrigemDados] ERRO ao carregar planos:', {
        error,
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        plantaId
      });
      setPlanosDisponiveis([]);
    } finally {
      console.log('🏁 [useOrigemDados] FIM - Finalizando carregamento, setLoading(false)');
      setLoading(false);
    }
  }, []);

  // Carregar solicitações de serviço disponíveis (apenas registradas)
  const carregarSolicitacoes = useCallback(async () => {
    setLoading(true);
    try {
      const { solicitacoesServicoService } = await import('@/services/solicitacoes-servico.service');

      const response = await solicitacoesServicoService.findAll({
        page: 1,
        limit: 100,
        status: 'REGISTRADA'
      });

      const solicitacoesFormatadas = response.data.map(solicitacao => ({
        id: solicitacao.id,
        numero: solicitacao.numero,
        titulo: solicitacao.titulo,
        descricao: solicitacao.descricao,
        tipo: solicitacao.tipo,
        prioridade: solicitacao.prioridade,
        status: solicitacao.status,
        local: solicitacao.local,
        plantaId: solicitacao.planta_id,
        unidadeId: solicitacao.unidade_id,
        plantaNome: solicitacao.planta?.nome,
        unidadeNome: solicitacao.unidade?.nome,
        equipamentoId: solicitacao.equipamento_id,
        solicitanteNome: solicitacao.solicitante_nome,
        dataSolicitacao: solicitacao.data_solicitacao || solicitacao.created_at
      }));

      setSolicitacoesDisponiveis(solicitacoesFormatadas);

    } catch (error) {
      setSolicitacoesDisponiveis([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar anomalia específica por ID
  const obterAnomalia = useCallback(async (id: string): Promise<AnomaliaDisponivel | null> => {
    try {
      // console.log('🔍 [useOrigemDados] Buscando anomalia:', id);
      
      const anomalia = await anomaliasService.findOne(id);
      
      const anomaliaFormatada: AnomaliaDisponivel = {
        id: anomalia.id,
        descricao: anomalia.descricao,
        local: anomalia.local,
        ativo: anomalia.ativo,
        prioridade: anomalia.prioridade,
        status: anomalia.status,
        data: anomalia.created_at || anomalia.data || new Date().toISOString(),
        equipamentoId: anomalia.equipamento_id?.toString() || anomalia.equipamentoId?.toString(),
        plantaId: anomalia.planta_id?.toString() || anomalia.plantaId?.toString(),
        condicao: anomalia.condicao,
        origem: anomalia.origem
      };

      // console.log('✅ [useOrigemDados] Anomalia encontrada:', anomaliaFormatada);
      return anomaliaFormatada;
      
    } catch (error) {
      // console.error('❌ [useOrigemDados] Erro ao buscar anomalia:', error);
      return null;
    }
  }, []);

  // ✅ ATUALIZADO: Buscar plano específico usando a API real
  const obterPlano = useCallback(async (id: string): Promise<PlanoDisponivel | null> => {
    try {
      console.log('🔍 [useOrigemDados] Buscando plano na API:', id);

      // Usar API real
      const { planosManutencaoApi } = await import('@/services/planos-manutencao.services');

      const plano = await planosManutencaoApi.findOne(id.trim(), true); // incluirTarefas = true

      if (plano) {
        const planoFormatado: PlanoDisponivel = {
          id: plano.id,
          nome: plano.nome,
          categoria: plano.equipamento?.tipo_equipamento || 'GERAL',
          totalTarefas: plano.total_tarefas || plano.tarefas?.length || 0,
          totalEquipamentos: 1,
          ativo: plano.status === 'ATIVO',
          tarefasTemplate: plano.tarefas || [],
          plantaId: plano.equipamento?.planta?.id
        };

        console.log('✅ [useOrigemDados] Plano encontrado na API:', planoFormatado);
        return planoFormatado;
      } else {
        console.log('⚠️ [useOrigemDados] Plano não encontrado na API:', id);
        return null;
      }

    } catch (error) {
      console.error('❌ [useOrigemDados] Erro ao buscar plano na API:', error);

      // Fallback: buscar nos dados carregados em cache
      const plano = planosDisponiveis.find(p => p.id.trim() === id.trim());
      return plano || null;
    }
  }, [planosDisponiveis]);

  // Buscar tarefas reais da API
  const gerarTarefasDoPlano = useCallback(async (planoId: string, equipamentosIds?: string[]) => {
    try {
      console.log('🔧 [useOrigemDados] INÍCIO buscarTarefasDoPlano da API:', {
        planoId,
        equipamentosIds,
        timestamp: new Date().toISOString()
      });

      // Usar API real
      const { tarefasApi } = await import('@/services/tarefas.services');

      // Buscar tarefas reais do plano na API
      const tarefasDoPlano = await tarefasApi.findByPlano(planoId, {
        status: 'ATIVA',
        limit: 100,
        page: 1
      });

      console.log('📋 [useOrigemDados] Tarefas reais da API:', {
        quantidadeTarefas: tarefasDoPlano.length,
        primeiraTarefa: tarefasDoPlano[0] || null
      });

      // Formatar tarefas da API para o formato esperado pelo frontend
      const tarefasFormatadas = tarefasDoPlano.map((tarefa) => {
        return {
          id: tarefa.id, // ✅ ID real da API (UUID/CUID)
          templateId: tarefa.id,
          tag: tarefa.tag,
          descricao: tarefa.descricao,
          nome: tarefa.nome,
          categoria: tarefa.categoria,
          tipo: tarefa.tipo_manutencao,
          frequencia: tarefa.frequencia,
          criticidade: tarefa.criticidade,
          duracaoEstimada: tarefa.duracao_estimada,
          tempoEstimado: tarefa.tempo_estimado,
          responsavel: tarefa.responsavel,
          observacoes: tarefa.observacoes,
          ordem: tarefa.ordem,
          condicaoAtivo: tarefa.condicao_ativo,
          // Sub-tarefas (se existirem)
          subTarefas: tarefa.sub_tarefas?.map(subTarefa => ({
            id: subTarefa.id, // ✅ ID real da API
            descricao: subTarefa.descricao,
            obrigatoria: subTarefa.obrigatoria,
            ordem: subTarefa.ordem,
            tempo_estimado: subTarefa.tempo_estimado
          })) || [],
          // Recursos (se existirem)
          recursos: tarefa.recursos?.map(recurso => ({
            id: recurso.id, // ✅ ID real da API
            tipo: recurso.tipo,
            descricao: recurso.descricao,
            quantidade: recurso.quantidade,
            unidade: recurso.unidade,
            obrigatorio: recurso.obrigatorio
          })) || []
        };
      });

      console.log('✅ [useOrigemDados] Tarefas formatadas:', {
        quantidadeTarefasFormatadas: tarefasFormatadas.length,
        primeiraFormatada: tarefasFormatadas[0] || null
      });

      return tarefasFormatadas;

    } catch (error) {
      console.error('❌ [useOrigemDados] Erro ao buscar tarefas da API:', error);
      return [];
    }
  }, []);

  // Verificar se uma anomalia pode gerar OS
  const podeAnomaliaGerarOS = useCallback((anomalia: AnomaliaDisponivel): boolean => {
    return anomalia.status === 'REGISTRADA';
  }, []);

  // Verificar se um plano está disponível
  const planoDisponivel = useCallback((plano: PlanoDisponivel): boolean => {
    return plano.ativo && plano.totalEquipamentos > 0;
  }, []);

  // Buscar solicitação específica por ID
  const obterSolicitacao = useCallback(async (id: string): Promise<SolicitacaoDisponivel | null> => {
    try {
      console.log('🔍 [useOrigemDados] Buscando solicitação:', id);

      const { solicitacoesServicoService } = await import('@/services/solicitacoes-servico.service');
      const solicitacao = await solicitacoesServicoService.findOne(id);

      const solicitacaoFormatada: SolicitacaoDisponivel = {
        id: solicitacao.id,
        numero: solicitacao.numero,
        titulo: solicitacao.titulo,
        descricao: solicitacao.descricao,
        tipo: solicitacao.tipo,
        prioridade: solicitacao.prioridade,
        status: solicitacao.status,
        local: solicitacao.local,
        plantaId: solicitacao.planta_id,
        equipamentoId: solicitacao.equipamento_id,
        solicitanteNome: solicitacao.solicitante_nome,
        dataSolicitacao: solicitacao.data_solicitacao || solicitacao.created_at
      };

      console.log('✅ [useOrigemDados] Solicitação encontrada:', solicitacaoFormatada);
      return solicitacaoFormatada;

    } catch (error) {
      console.error('❌ [useOrigemDados] Erro ao buscar solicitação:', error);
      return null;
    }
  }, []);

  return {
    loading,
    anomaliasDisponiveis,
    planosDisponiveis,
    solicitacoesDisponiveis,
    carregarAnomalias,
    carregarPlanos,
    carregarSolicitacoes,
    obterAnomalia,
    obterPlano,
    obterSolicitacao,
    gerarTarefasDoPlano,
    podeAnomaliaGerarOS,
    planoDisponivel
  };
};