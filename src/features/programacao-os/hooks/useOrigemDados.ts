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

export const useOrigemDados = () => {
  const [loading, setLoading] = useState(false);
  const [anomaliasDisponiveis, setAnomaliasDisponiveis] = useState<AnomaliaDisponivel[]>([]);
  const [planosDisponiveis, setPlanosDisponiveis] = useState<PlanoDisponivel[]>([]);

  // Carregar anomalias disponíveis (apenas pendentes/em análise)
  const carregarAnomalias = useCallback(async (plantaId?: string, unidadeId?: string) => {
    console.log('🔍 [useOrigemDados] Carregando anomalias disponíveis...', { plantaId, unidadeId });

    setLoading(true);
    try {
      // Criar filtros corretos baseados no tipo AnomaliasFilters
      const filtros = {
        page: 1,
        limit: 100,
        search: '',
        periodo: 'all',
        status: 'all', // ✅ MOSTRAR TODAS as anomalias (não apenas EM_ANALISE)
        prioridade: 'all',
        origem: 'all',
        // ✅ NOVO: Filtrar por planta e unidade
        planta: plantaId || 'all',
        unidade: unidadeId || 'all'
      };

      console.log('📋 [useOrigemDados] Filtros aplicados:', filtros);

      const response = await anomaliasService.findAll(filtros);

      console.log('📊 [useOrigemDados] Total de anomalias antes do filtro:', response.data.length);

      const anomaliasFiltradas = response.data
        .filter(anomalia => {
          // ✅ PERMITIR: AGUARDANDO, EM_ANALISE (podem gerar OS)
          // ❌ BLOQUEAR: OS_GERADA, RESOLVIDA, CANCELADA (já tem OS ou não faz sentido)
          const statusPermitido = ['AGUARDANDO', 'EM_ANALISE'].includes(anomalia.status);

          if (!statusPermitido) {
            console.log('⚠️ [useOrigemDados] Anomalia bloqueada por status:', {
              id: anomalia.id,
              descricao: anomalia.descricao,
              status: anomalia.status
            });
          }

          return statusPermitido;
        })
        .map(anomalia => {
          // console.log('🔄 [useOrigemDados] Mapeando anomalia:', {
          //   id: anomalia.id,
          //   idType: typeof anomalia.id,
          //   descricao: anomalia.descricao
          // });

          return {
            id: String(anomalia.id), // Garantir que seja string
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
        });

      // console.log('✅ [useOrigemDados] Anomalias carregadas:', anomaliasFiltradas.length);
      setAnomaliasDisponiveis(anomaliasFiltradas);
      
    } catch (error) {
      // console.error('❌ [useOrigemDados] Erro ao carregar anomalias:', error);
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
    return ['AGUARDANDO', 'EM_ANALISE'].includes(anomalia.status);
  }, []);

  // Verificar se um plano está disponível
  const planoDisponivel = useCallback((plano: PlanoDisponivel): boolean => {
    return plano.ativo && plano.totalEquipamentos > 0;
  }, []);

  return {
    loading,
    anomaliasDisponiveis,
    planosDisponiveis,
    carregarAnomalias,
    carregarPlanos,
    obterAnomalia,
    obterPlano,
    gerarTarefasDoPlano,
    podeAnomaliaGerarOS,
    planoDisponivel
  };
};