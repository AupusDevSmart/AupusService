// src/features/planos-manutencao/components/AssociacaoEquipamentosPage.tsx - USANDO API REAL

import { Layout } from '@/components/common/Layout';
import { TitleCard } from '@/components/common/title-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Combobox } from '@aupus/shared-pages';
import { useEquipamentos } from '@/features/equipamentos/hooks/useEquipamentos';
import { useGenericModal } from '@/hooks/useGenericModal';
import { getUnidadesByPlanta } from '@/services/unidades.services';
import { PlantasService, PlantaResponse } from '@/services/plantas.services';
import { CreatePlanoManutencaoApiData, PlanoManutencaoApiResponse } from '@/services/planos-manutencao.services';
import {
    AlertTriangle,
    ArrowRight,
    Building,
    CheckCircle,
    ChevronLeft,
    Copy,
    FileText,
    Layers,
    Plus,
    Settings,
    Trash2,
    Wrench
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUserStore } from '@/store/useUserStore';
import { usePlanosFilters } from '../hooks/usePlanosFilters';
import { usePlanosManutencaoApi } from '../hooks/usePlanosManutencaoApi';
import { PlanosModal } from './PlanosModal';

interface EquipamentoSelecionado {
  equipamentoId: string;
  equipamentoNome: string;
  plantaId: string;
  plantaNome: string;
  unidadeId: string;
  unidadeNome: string;
}

interface AssociacaoRapida {
  equipamentos: EquipamentoSelecionado[];
  planoSelecionado: string;
}

export function AssociacaoEquipamentosPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planoIdInicial = searchParams.get('planoId');
  const { user } = useUserStore();

  const { fetchEquipamentos } = useEquipamentos();

  // 🔧 USANDO API REAL
  const {
    planos,
    loading,
    createPlano,
    duplicarPlano,
    fetchPlanos,
    clonarLote
  } = usePlanosManutencaoApi();

  // Hook de filtros para form fields
  const { formFields } = usePlanosFilters({});

  // Modal para criar/duplicar planos
  const {
    modalState,
    openModal,
    closeModal
  } = useGenericModal<PlanoManutencaoApiResponse>();

  const [plantaSelecionada, setPlantaSelecionada] = useState<string>('');
  const [unidadeSelecionada, setUnidadeSelecionada] = useState<string>('');
  const [equipamentoSelecionado, setEquipamentoSelecionado] = useState<string>('');
  const [plantas, setPlantas] = useState<PlantaResponse[]>([]);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [equipamentosUnidade, setEquipamentosUnidade] = useState<any[]>([]);
  const [loadingPlantas, setLoadingPlantas] = useState(false);
  const [loadingUnidades, setLoadingUnidades] = useState(false);
  const [loadingEquipamentos, setLoadingEquipamentos] = useState(false);
  const [associacao, setAssociacao] = useState<AssociacaoRapida>({
    equipamentos: [],
    planoSelecionado: planoIdInicial || ''
  });

  // Estados para as novas funcionalidades
  const [mostrandoOpcaoPlano, setMostrandoOpcaoPlano] = useState<'selecionar' | 'criar' | 'duplicar'>('selecionar');
  const [planoParaDuplicar, setPlanoParaDuplicar] = useState<string>('');
  const [associandoEquipamentos, setAssociandoEquipamentos] = useState(false);

  // Buscar equipamentos quando a unidade for selecionada
  useEffect(() => {
    const buscarEquipamentos = async () => {
      if (!unidadeSelecionada) {
        setEquipamentosUnidade([]);
        return;
      }

      try {
        setLoadingEquipamentos(true);
        const equipamentosData = await fetchEquipamentos({
          proprietarioId: 'all',
          plantaId: 'all',
          unidadeId: unidadeSelecionada,
          criticidade: 'all',
          classificacao: 'UC',
          semPlano: true,
          limit: 100
        });
        setEquipamentosUnidade(equipamentosData);
      } catch (error) {
        console.error('Erro ao buscar equipamentos:', error);
        setEquipamentosUnidade([]);
      } finally {
        setLoadingEquipamentos(false);
      }
    };

    buscarEquipamentos();
  }, [unidadeSelecionada, fetchEquipamentos]);

  // Carregar plantas da API
  useEffect(() => {
    const carregarPlantas = async () => {
      try {
        setLoadingPlantas(true);
        const response = await PlantasService.getAllPlantas({ limit: 100 });
        setPlantas(response.data);
      } catch (error) {
        console.error('Erro ao carregar plantas:', error);
        setPlantas([]);
      } finally {
        setLoadingPlantas(false);
      }
    };

    carregarPlantas();
  }, []);

  // Buscar unidades quando a planta for selecionada
  useEffect(() => {
    const buscarUnidades = async () => {
      if (!plantaSelecionada) {
        setUnidades([]);
        return;
      }

      try {
        setLoadingUnidades(true);
        const unidadesDaPlanta = await getUnidadesByPlanta(plantaSelecionada);
        setUnidades(unidadesDaPlanta);
      } catch (error) {
        console.error('Erro ao buscar unidades:', error);
        setUnidades([]);
      } finally {
        setLoadingUnidades(false);
      }
    };

    buscarUnidades();
  }, [plantaSelecionada]);

  // Equipamentos disponíveis vêm do estado local carregado por unidade
  const equipamentosDisponiveis = equipamentosUnidade;

  // 🔧 CARREGAR PLANOS DA API NO INÍCIO
  useEffect(() => {
    const carregarDados = async () => {
      try {
        await fetchPlanos({ limit: 100 }); // Carregar todos os planos
      } catch (error) {
        console.error('Erro ao carregar planos:', error);
      }
    };

    carregarDados();
  }, []);

  // Estatísticas baseadas na API
  const [stats, setStats] = useState({
    equipamentosSelecionados: 0,
    planosDisponiveis: 0,
    tarefasQueSerao: 0
  });

  useEffect(() => {
    // 🔧 BUSCAR PLANO SELECIONADO DA API
    const planoSelecionado = planos.find(p => p.id === associacao.planoSelecionado);
    const tarefasQueSerao = planoSelecionado ? 
      associacao.equipamentos.length * (planoSelecionado.total_tarefas || 0) : 0;

    setStats({
      equipamentosSelecionados: associacao.equipamentos.length,
      planosDisponiveis: planos.filter(p => p.ativo).length,
      tarefasQueSerao
    });
  }, [associacao, planos]);

  const adicionarEquipamento = () => {
    if (!plantaSelecionada || !unidadeSelecionada || !equipamentoSelecionado) return;

    const equipamento = equipamentosDisponiveis.find((eq: any) => eq.id === equipamentoSelecionado);
    const planta = plantas.find(p => p.id === plantaSelecionada);
    const unidade = unidades.find(u => u.id === unidadeSelecionada);

    if (!equipamento || !planta || !unidade) {
      console.error('Dados não encontrados:', { equipamento, planta, unidade });
      return;
    }

    // 🔧 VERIFICAR SE EQUIPAMENTO JÁ FOI ADICIONADO (comparando como string)
    if (associacao.equipamentos.some(eq => eq.equipamentoId === equipamento.id.toString())) {
      alert('Este equipamento já foi adicionado à lista.');
      return;
    }

    const novoEquipamento: EquipamentoSelecionado = {
      equipamentoId: equipamento.id.toString(),
      equipamentoNome: equipamento.nome,
      plantaId: planta.id.toString(),
      plantaNome: planta.nome,
      unidadeId: unidade.id,
      unidadeNome: unidade.nome
    };

    setAssociacao(prev => ({
      ...prev,
      equipamentos: [...prev.equipamentos, novoEquipamento]
    }));

    setEquipamentoSelecionado('');
  };

  const removerEquipamento = (equipamentoId: string) => {
    setAssociacao(prev => ({
      ...prev,
      equipamentos: prev.equipamentos.filter(eq => eq.equipamentoId !== equipamentoId)
    }));
  };

  const limparTodos = () => {
    setAssociacao(prev => ({
      ...prev,
      equipamentos: []
    }));
  };

  // NOVA FUNCIONALIDADE: Criar novo plano durante associação
  const handleCriarNovoPlano = () => {
    setMostrandoOpcaoPlano('criar');
    openModal('create');
  };

  // NOVA FUNCIONALIDADE: Duplicar plano existente
  const handleDuplicarPlano = () => {
    if (!planoParaDuplicar) {
      alert('Selecione um plano para duplicar');
      return;
    }
    setMostrandoOpcaoPlano('duplicar');
    const planoOriginal = planos.find(p => p.id === planoParaDuplicar);
    if (planoOriginal) {
      openModal('create', planoOriginal);
    }
  };

  // 🔧 ATUALIZADO: Manipular submit do modal de planos usando API real
  const handleSubmitPlano = async (data: any) => {
    try {
      let novoPlano: PlanoManutencaoApiResponse | undefined;
      
      if (mostrandoOpcaoPlano === 'criar') {
        const createData: CreatePlanoManutencaoApiData = {
          equipamento_id: data.equipamento_id,
          nome: data.nome,
          descricao: data.descricao,
          versao: data.versao || '1.0',
          status: data.status || 'ATIVO',
          ativo: data.ativo ?? true,
          data_vigencia_inicio: data.data_vigencia_inicio,
          data_vigencia_fim: data.data_vigencia_fim,
          observacoes: data.observacoes,
          criado_por: data.criado_por || user?.id
        };
        novoPlano = await createPlano(createData);
      } else if (mostrandoOpcaoPlano === 'duplicar') {
        novoPlano = await duplicarPlano(planoParaDuplicar, {
          equipamento_destino_id: data.equipamento_id,
          novo_nome: data.nome,
          criado_por: user?.id
        });
      }
      
      if (novoPlano) {
        // Selecionar automaticamente o novo plano
        setAssociacao(prev => ({
          ...prev,
          planoSelecionado: novoPlano!.id
        }));
        
        // Atualizar lista de planos
        await fetchPlanos({ limit: 100 });
      }
      
      closeModal();
      setMostrandoOpcaoPlano('selecionar');
    } catch (error) {
      console.error('Erro ao criar/duplicar plano:', error);
      alert('Erro ao criar/duplicar plano. Verifique os dados e tente novamente.');
    }
  };

  // 🔧 IMPLEMENTAÇÃO REAL: Associação usando endpoint de clonagem em lote
  const handleAssociar = async () => {
    if (associacao.equipamentos.length === 0 || !associacao.planoSelecionado) {
      alert('Selecione ao menos um equipamento e um plano.');
      return;
    }

    try {
      setAssociandoEquipamentos(true);

      const equipamentosIds = associacao.equipamentos.map(eq => eq.equipamentoId);

      console.log('📋 Iniciando associação em lote:', {
        planoManutencaoId: associacao.planoSelecionado,
        equipamentosIds,
        total: equipamentosIds.length
      });

      // Chamar API de clonagem em lote
      const resultado = await clonarLote(associacao.planoSelecionado, {
        equipamentos_destino_ids: equipamentosIds,
        manter_nome_original: false, // Adicionar nome do equipamento ao plano
        criado_por: user?.id
      });

      console.log('✅ Resultado da associação:', resultado);

      // Mostrar resultado detalhado
      const mensagemSucesso = `
✅ Associação concluída!

📊 Resumo:
- Planos criados: ${resultado.planos_criados}
- Falhas: ${resultado.planos_com_erro}

${resultado.detalhes.map(det =>
  det.sucesso
    ? `✅ ${det.equipamento_nome}: ${det.total_tarefas} tarefas criadas`
    : `❌ ${det.equipamento_nome}: ${det.erro}`
).join('\n')}
      `.trim();

      alert(mensagemSucesso);

      // Se houve sucesso, limpar seleções e recarregar planos
      if (resultado.planos_criados > 0) {
        setAssociacao(prev => ({
          ...prev,
          equipamentos: [],
          planoSelecionado: planoIdInicial || ''
        }));
        await fetchPlanos({ limit: 100 });
      }

    } catch (error: any) {
      console.error('❌ Erro ao associar:', error);
      const mensagemErro = error?.response?.data?.message || error?.message || 'Erro desconhecido';
      alert(`Erro ao criar associações:\n\n${mensagemErro}\n\nVerifique o console para mais detalhes.`);
    } finally {
      setAssociandoEquipamentos(false);
    }
  };

  // 🔧 USANDO PLANO DA API
  const planoSelecionadoDetalhes = planos.find(p => p.id === associacao.planoSelecionado);

  return (
    <Layout>
      <Layout.Main>
        <div className="flex flex-col h-full w-full">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-4 text-sm">
            <button 
              onClick={() => navigate('/planos-manutencao')}
              className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Planos de Manutenção
            </button>
            <span className="text-gray-400">/</span>
            <span className="text-gray-600 dark:text-gray-400">Associar Equipamentos</span>
          </div>

          {/* Header */}
          <TitleCard
            title="Associar Equipamentos aos Planos"
            description="Vincule equipamentos a planos de manutenção para gerar tarefas automaticamente"
          />

          {/* 🔧 ALERTA SE NÃO HÁ PLANOS */}
          {planos.length === 0 && !loading && (
            <div className="mb-6">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-950 dark:border-amber-800">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <div>
                    <h4 className="font-medium text-amber-900 dark:text-amber-100">
                      Nenhum Plano Disponível
                    </h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Você precisa criar pelo menos um plano de manutenção antes de poder associar equipamentos.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Dashboard Simplificado - APENAS 3 CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Wrench className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.equipamentosSelecionados}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Equipamentos Selecionados
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Layers className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.planosDisponiveis}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Planos Disponíveis
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.tarefasQueSerao}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Tarefas que serão criadas
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Fluxo de Associação Simplificado */}
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Como Funciona a Associação
            </h3>
            <div className="flex items-center gap-4 text-sm overflow-x-auto">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                Selecionar Equipamentos
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                Escolher/Criar Plano
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                Tarefas são Geradas
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Seleção de Equipamentos */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <Wrench className="h-5 w-5 text-blue-600" />
                1. Selecionar Equipamentos
              </h2>

              {/* Seletores */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Planta/Local
                  </label>
                  <Combobox
                    options={plantas.map((planta: any) => ({
                      value: planta.id.toString(),
                      label: planta.nome
                    }))}
                    value={plantaSelecionada}
                    onValueChange={(value) => {
                      setPlantaSelecionada(value);
                      setUnidadeSelecionada('');
                      setEquipamentoSelecionado('');
                    }}
                    placeholder={loadingPlantas ? "Carregando plantas..." : "Selecione a planta..."}
                    searchPlaceholder="Buscar planta..."
                    emptyText="Nenhuma planta encontrada"
                    disabled={loadingPlantas}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Unidade Consumidora
                  </label>
                  <Combobox
                    options={unidades.map((unidade: any) => ({
                      value: unidade.id.toString(),
                      label: unidade.nome
                    }))}
                    value={unidadeSelecionada}
                    onValueChange={(value) => {
                      setUnidadeSelecionada(value);
                      setEquipamentoSelecionado('');
                    }}
                    placeholder={loadingUnidades ? "Carregando unidades..." : plantaSelecionada ? "Selecione a unidade..." : "Primeiro selecione uma planta"}
                    searchPlaceholder="Buscar unidade..."
                    emptyText="Nenhuma unidade encontrada"
                    disabled={!plantaSelecionada || loadingUnidades}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Equipamento
                  </label>
                  <div className="flex gap-2">
                    <Combobox
                      options={equipamentosDisponiveis.map((equipamento: any) => ({
                        value: equipamento.id.toString(),
                        label: `${equipamento.nome}`
                      }))}
                      value={equipamentoSelecionado}
                      onValueChange={(value) => setEquipamentoSelecionado(value)}
                      placeholder={
                        loadingEquipamentos ? "Carregando equipamentos..." :
                        unidadeSelecionada ? "Selecione o equipamento..." :
                        "Primeiro selecione uma unidade"
                      }
                      searchPlaceholder="Buscar equipamento..."
                      emptyText="Nenhum equipamento encontrado"
                      disabled={!unidadeSelecionada || loadingEquipamentos}
                      className="flex-1"
                    />
                    <Button
                      onClick={adicionarEquipamento}
                      disabled={!plantaSelecionada || !unidadeSelecionada || !equipamentoSelecionado}
                      className="px-4 h-9"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Lista de Equipamentos Selecionados */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">Equipamentos Selecionados ({associacao.equipamentos.length})</h3>
                  {associacao.equipamentos.length > 0 && (
                    <Button variant="outline" size="sm" onClick={limparTodos}>
                      Limpar Todos
                    </Button>
                  )}
                </div>

                {associacao.equipamentos.length === 0 ? (
                  <div className="text-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                    <Wrench className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum equipamento selecionado</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {associacao.equipamentos.map((eq) => (
                      <div key={eq.equipamentoId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">{eq.equipamentoNome}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <span className="flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              {eq.plantaNome}
                            </span>
                            <span>•</span>
                            <span>{eq.unidadeNome}</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removerEquipamento(eq.equipamentoId)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Seleção do Plano - USANDO API REAL */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <Layers className="h-5 w-5 text-green-600" />
                2. Escolher Plano de Manutenção
              </h2>

              {loading && (
                <div className="flex items-center justify-center p-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                  <span className="text-gray-600 dark:text-gray-400">Carregando planos...</span>
                </div>
              )}

              <div className="space-y-4">
                {/* Opções de Plano */}
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Opções de Plano</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={mostrandoOpcaoPlano === 'selecionar' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMostrandoOpcaoPlano('selecionar')}
                      disabled={loading}
                      className="btn-minimal"
                    >
                      <Layers className="h-4 w-4 mr-1" />
                      Usar Existente
                    </Button>
                    <Button
                      variant={mostrandoOpcaoPlano === 'criar' ? 'default' : 'outline'}
                      size="sm"
                      onClick={handleCriarNovoPlano}
                      className="btn-minimal"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Criar Novo
                    </Button>
                    <Button
                      variant={mostrandoOpcaoPlano === 'duplicar' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMostrandoOpcaoPlano('duplicar')}
                      disabled={planos.length === 0}
                      className="btn-minimal"
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Duplicar Existente
                    </Button>
                  </div>
                </div>

                {/* Seleção/Duplicação de Plano */}
                {mostrandoOpcaoPlano === 'duplicar' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Plano para Duplicar
                    </label>
                    <div className="flex gap-2">
                      <Combobox
                        options={planos.map(plano => ({
                          value: plano.id,
                          label: `${plano.nome} (v${plano.versao})`
                        }))}
                        value={planoParaDuplicar}
                        onValueChange={(value) => setPlanoParaDuplicar(value)}
                        placeholder="Selecione um plano para duplicar..."
                        searchPlaceholder="Buscar plano..."
                        emptyText="Nenhum plano encontrado"
                        className="flex-1"
                      />
                      <Button onClick={handleDuplicarPlano} className="h-9">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {mostrandoOpcaoPlano === 'selecionar' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Plano de Manutenção
                    </label>
                    <Combobox
                      options={planos.filter(p => p.ativo).map(plano => ({
                        value: plano.id,
                        label: `${plano.nome} (v${plano.versao}) - ${plano.status}`
                      }))}
                      value={associacao.planoSelecionado}
                      onValueChange={(value) => setAssociacao(prev => ({ ...prev, planoSelecionado: value }))}
                      placeholder={loading ? "Carregando planos..." : "Selecione um plano..."}
                      searchPlaceholder="Buscar plano..."
                      emptyText="Nenhum plano encontrado"
                      disabled={loading}
                    />
                  </div>
                )}

              </div>

              {/* Preview do Plano Selecionado - USANDO API */}
              {planoSelecionadoDetalhes && (
                <div className="mt-6 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                  <h4 className="font-medium text-green-900 dark:text-green-100 mb-3">
                    Preview do Plano: {planoSelecionadoDetalhes.nome}
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        {planoSelecionadoDetalhes.status}
                      </Badge>
                      <span className="text-green-700 dark:text-green-300">
                        {planoSelecionadoDetalhes.total_tarefas || 0} tarefas template
                      </span>
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-300">
                      Para cada equipamento serão criadas {planoSelecionadoDetalhes.total_tarefas || 0} tarefas individuais
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Resumo e Ação */}
          {stats.tarefasQueSerao > 0 && (
            <div className="mt-6 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                3. Resumo da Associação
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {associacao.equipamentos.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Equipamentos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {planoSelecionadoDetalhes?.total_tarefas || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Templates por Equipamento</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.tarefasQueSerao}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total de Tarefas</div>
                </div>
              </div>

              <div className="flex justify-center">
                <Button 
                  onClick={handleAssociar}
                  disabled={associandoEquipamentos || associacao.equipamentos.length === 0 || !associacao.planoSelecionado}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
                >
                  {associandoEquipamentos ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Criando Associações...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Associar e Gerar {stats.tarefasQueSerao} Tarefas
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Modal para Criar/Duplicar Planos */}
        <PlanosModal
          isOpen={modalState.isOpen}
          mode="create"
          entity={modalState.entity}
          formFields={formFields}
          tarefas={[]}
          carregandoTarefas={false}
          onClose={() => {
            closeModal();
            setMostrandoOpcaoPlano('selecionar');
          }}
          onSubmit={handleSubmitPlano}
        />
      </Layout.Main>
    </Layout>
  );
}