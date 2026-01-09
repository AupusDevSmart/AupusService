// src/features/planos-manutencao/components/ClonagemPlanosPage.tsx - USANDO API REAL COM CLONAGEM EM LOTE

import { Layout } from '@/components/common/Layout';
import { TitleCard } from '@/components/common/title-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useEquipamentos } from '@nexon/features/equipamentos/hooks/useEquipamentos';
import { ClonarPlanoLoteResponseDto, PlanoManutencaoApiResponse } from '@/services/planos-manutencao.services';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Building,
  CheckCircle,
  ChevronLeft,
  Copy,
  Factory,
  Layers,
  Loader2,
  MapPin,
  Search,
  Wrench,
  XCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePlanosManutencaoApi } from '../hooks/usePlanosManutencaoApi';

interface EquipamentoSelecionado {
  equipamentoId: string;
  equipamentoNome: string;
  unidadeId: string;
  unidadeNome: string;
  plantaId: string;
  plantaNome: string;
}

export function ClonagemPlanosPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planoIdInicial = searchParams.get('planoId');

  const { equipamentos, fetchEquipamentos, loading: loadingEquipamentos } = useEquipamentos();
  const {
    planos,
    loading: loadingPlanos,
    clonarLote,
    fetchPlanos,
    getPlano
  } = usePlanosManutencaoApi();

  // Estados de seleção hierárquica: PLANTA → UNIDADE → EQUIPAMENTO
  const [plantaSelecionada, setPlantaSelecionada] = useState<string>('');
  const [unidadeSelecionada, setUnidadeSelecionada] = useState<string>('');
  const [equipamentoSelecionado, setEquipamentoSelecionado] = useState<string>('');

  // Estado do plano origem
  const [planoOrigemId, setPlanoOrigemId] = useState<string>(planoIdInicial || '');
  const [planoOrigem, setPlanoOrigem] = useState<PlanoManutencaoApiResponse | null>(null);

  // Estado dos equipamentos selecionados
  const [equipamentosSelecionados, setEquipamentosSelecionados] = useState<EquipamentoSelecionado[]>([]);

  // Estado da clonagem
  const [clonando, setClonando] = useState(false);
  const [resultado, setResultado] = useState<ClonarPlanoLoteResponseDto | null>(null);
  const [mostrarResultado, setMostrarResultado] = useState(false);
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [buscaPlano, setBuscaPlano] = useState('');

  // Extrair hierarquia única: PLANTA → UNIDADE → EQUIPAMENTOS
  // Usar eq.unidade.planta porque eq.planta pode estar null
  const plantas = equipamentos
    .filter((eq, index, arr) =>
      eq.unidade?.planta && arr.findIndex(e => e.unidade?.planta?.id === eq.unidade?.planta?.id) === index
    )
    .map(eq => eq.unidade!.planta!)
    .filter(Boolean);

  const unidadesDisponiveis = plantaSelecionada
    ? equipamentos
        .filter(eq => eq.unidade?.planta?.id === plantaSelecionada && eq.unidade)
        .filter((eq, index, arr) => arr.findIndex(e => e.unidade?.id === eq.unidade?.id) === index)
        .map(eq => eq.unidade!)
        .filter(Boolean)
    : [];

  const equipamentosDisponiveis = unidadeSelecionada
    ? equipamentos.filter(eq =>
        eq.unidade?.id === unidadeSelecionada &&
        eq.classificacao === 'UC' &&
        !equipamentosSelecionados.some(selected => selected.equipamentoId === eq.id.toString())
      )
    : [];

  // Filtrar planos com busca (incluir ativos E inativos)
  const planosFiltrados = planos.filter(p => {
    // Remover o filtro de ativo para mostrar todos os planos
    // O status será indicado visualmente no card
    if (!buscaPlano) return true;

    const busca = buscaPlano.toLowerCase();
    return (
      p.nome.toLowerCase().includes(busca) ||
      p.equipamento?.nome?.toLowerCase().includes(busca) ||
      p.descricao?.toLowerCase().includes(busca)
    );
  });

  // Debug: log dos planos
  useEffect(() => {
    console.log('📊 Debug Planos:', {
      totalPlanos: planos.length,
      planosAtivos: planos.filter(p => p.ativo).length,
      planosInativos: planos.filter(p => !p.ativo).length,
      planosFiltrados: planosFiltrados.length,
      buscaPlano
    });
    if (planos.length > 0) {
      console.log('📋 Primeiro plano:', planos[0]);
    }
  }, [planos.length, planosFiltrados.length, buscaPlano]);

  // Debug: Log das hierarquias
  useEffect(() => {
    console.log('📊 Hierarquias (PLANTA → UNIDADE → EQUIPAMENTO):', {
      totalEquipamentos: equipamentos.length,
      plantas: plantas.length,
      plantasLista: plantas.map(p => ({ id: p.id, nome: p.nome })),
      unidadesDisponiveis: unidadesDisponiveis.length,
      unidadesLista: unidadesDisponiveis.map(u => ({ id: u.id, nome: u.nome })),
      equipamentosDisponiveis: equipamentosDisponiveis.length,
      plantaSelecionada,
      unidadeSelecionada
    });

    // Log detalhado dos primeiros 3 equipamentos
    if (equipamentos.length > 0) {
      console.log('🔍 Primeiros equipamentos:', equipamentos.slice(0, 3).map(eq => ({
        id: eq.id,
        nome: eq.nome,
        planta: eq.planta ? { id: eq.planta.id, nome: eq.planta.nome } : null,
        unidade: eq.unidade ? { id: eq.unidade.id, nome: eq.unidade.nome } : null,
        classificacao: eq.classificacao
      })));
    }
  }, [equipamentos.length, plantas.length, unidadesDisponiveis.length, equipamentosDisponiveis.length, plantaSelecionada, unidadeSelecionada]);

  // Carregar dados iniciais
  useEffect(() => {
    const carregarDados = async () => {
      try {
        setCarregandoDados(true);
        console.log('🔄 Carregando planos e equipamentos...');

        // Carregar planos e equipamentos em paralelo
        // NOTA: Não filtrar por ativo aqui, deixar o filtro visual fazer isso
        console.log('🔍 Chamando fetchPlanos com parâmetros:', { limit: 100 });

        const [planosResult, equipamentosResult] = await Promise.all([
          fetchPlanos({ limit: 100 }), // Carregar todos os planos (ativos e inativos)
          fetchEquipamentos({ limit: 100 }) // Backend limita a 100 equipamentos por página
        ]);

        console.log('✅ Planos carregados:', planosResult?.data?.length || 0);
        console.log('📋 Planos recebidos (raw):', planosResult);
        console.log('📋 Estado planos após fetch:', planos);
        console.log('✅ Equipamentos carregados:', equipamentosResult?.length || 0);
      } catch (error) {
        console.error('❌ Erro ao carregar dados iniciais:', error);
      } finally {
        setCarregandoDados(false);
      }
    };

    carregarDados();
  }, []);

  useEffect(() => {
    if (planoOrigemId) {
      carregarPlanoOrigem();
    }
  }, [planoOrigemId]);

  const carregarPlanoOrigem = async () => {
    try {
      const plano = await getPlano(planoOrigemId, true);
      setPlanoOrigem(plano);
    } catch (error) {
      console.error('Erro ao carregar plano origem:', error);
      setPlanoOrigem(null);
    }
  };

  const adicionarEquipamento = () => {
    if (!unidadeSelecionada || !equipamentoSelecionado) return;

    const equipamento = equipamentosDisponiveis.find(eq => eq.id.toString() === equipamentoSelecionado);
    if (!equipamento) return;

    const planta = plantas.find(p => p.id === plantaSelecionada);
    const unidade = unidadesDisponiveis.find(u => u.id === unidadeSelecionada);

    if (!planta || !unidade) return;

    const novo: EquipamentoSelecionado = {
      equipamentoId: equipamento.id.toString(),
      equipamentoNome: equipamento.nome,
      unidadeId: unidade.id,
      unidadeNome: unidade.nome,
      plantaId: planta.id,
      plantaNome: planta.nome
    };

    setEquipamentosSelecionados(prev => [...prev, novo]);
    setEquipamentoSelecionado('');
  };

  const removerEquipamento = (equipamentoId: string) => {
    setEquipamentosSelecionados(prev =>
      prev.filter(eq => eq.equipamentoId !== equipamentoId)
    );
  };

  const limparTodos = () => {
    setEquipamentosSelecionados([]);
  };

  const handleClonar = async () => {
    if (!planoOrigemId || equipamentosSelecionados.length === 0) {
      alert('Selecione um plano de origem e pelo menos um equipamento de destino.');
      return;
    }

    try {
      setClonando(true);
      setMostrarResultado(false);

      const equipamentosIds = equipamentosSelecionados.map(eq => eq.equipamentoId);

      const response = await clonarLote(planoOrigemId, {
        equipamentos_destino_ids: equipamentosIds,
        manter_nome_original: false, // Adiciona sufixo com nome do equipamento
        // Não enviar criado_por se não houver usuário autenticado (evita erro de FK)
        // criado_por: 'usuario-atual' // TODO: Pegar do contexto de autenticação
      });

      setResultado(response);
      setMostrarResultado(true);

      // Se todos foram bem sucedidos, limpar seleções
      if (response.planos_com_erro === 0) {
        setEquipamentosSelecionados([]);
      }

    } catch (error: any) {
      console.error('Erro ao clonar planos:', error);
      alert(`Erro ao clonar planos: ${error?.response?.data?.message || error.message}`);
    } finally {
      setClonando(false);
    }
  };

  const stats = {
    equipamentosSelecionados: equipamentosSelecionados.length,
    totalTarefas: (planoOrigem?.total_tarefas || 0) * equipamentosSelecionados.length
  };

  // Loading completo dos dados
  if (carregandoDados) {
    return (
      <Layout>
        <Layout.Main>
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Carregando dados...</p>
          </div>
        </Layout.Main>
      </Layout>
    );
  }

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
            <span className="text-gray-600 dark:text-gray-400">Clonar Plano</span>
          </div>

          {/* Header */}
          <TitleCard
            title="Clonar Plano de Manutenção"
            description="Clone um plano existente (incluindo todas as tarefas) para múltiplos equipamentos"
          />

          {/* Alerta de instrução */}
          <div className="mb-6">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">
                    Como Funciona a Clonagem
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Selecione um plano de origem e escolha os equipamentos de destino.
                    O sistema criará cópias completas do plano (incluindo todas as tarefas, subtarefas e recursos) para cada equipamento selecionado.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard de estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Copy className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {planoOrigem ? '1' : '0'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Plano de Origem
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Wrench className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.equipamentosSelecionados}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Equipamentos Destino
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Layers className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.totalTarefas}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Tarefas a Criar
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Fluxo de clonagem */}
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-4 text-sm overflow-x-auto">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                Escolher Plano Origem
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                Selecionar Equipamentos
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                Clonar e Confirmar
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Seleção do Plano Origem */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <Copy className="h-5 w-5 text-blue-600" />
                1. Selecionar Plano de Origem
              </h2>

              <div className="space-y-4">
                {/* Campo de Busca */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar plano por nome, equipamento ou descrição..."
                    value={buscaPlano}
                    onChange={(e) => setBuscaPlano(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Lista de Planos com Cards */}
                <div className="max-h-96 overflow-y-auto space-y-2 border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                  {loadingPlanos ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
                      <span className="text-gray-600 dark:text-gray-400">Carregando planos...</span>
                    </div>
                  ) : planosFiltrados.length === 0 ? (
                    <div className="text-center py-8">
                      <Copy className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500 dark:text-gray-400">
                        {buscaPlano ? 'Nenhum plano encontrado com essa busca' : 'Nenhum plano ativo disponível'}
                      </p>
                    </div>
                  ) : (
                    planosFiltrados.map(plano => (
                      <div
                        key={plano.id}
                        onClick={() => setPlanoOrigemId(plano.id)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          planoOrigemId === plano.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-gray-800'
                        } ${!plano.ativo ? 'opacity-60' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                {plano.nome}
                              </h4>
                              {!plano.ativo && (
                                <Badge variant="outline" className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                  Inativo
                                </Badge>
                              )}
                            </div>
                            {plano.equipamento && (
                              <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
                                <Wrench className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{plano.equipamento.nome}</span>
                              </div>
                            )}
                            {plano.descricao && (
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 line-clamp-2">
                                {plano.descricao}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge variant={planoOrigemId === plano.id ? "default" : "secondary"} className="text-xs">
                              v{plano.versao}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                              <Layers className="h-3 w-3" />
                              <span>{plano.total_tarefas || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Preview do Plano Selecionado */}
                {planoOrigem && (
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-2 border-blue-300 dark:border-blue-700 rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                        ✓ Plano Selecionado
                      </h4>
                      <Badge className="bg-blue-600 text-white">
                        {planoOrigem.status}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="font-medium text-blue-800 dark:text-blue-200">
                        {planoOrigem.nome}
                      </div>
                      {planoOrigem.descricao && (
                        <p className="text-blue-700 dark:text-blue-300">
                          {planoOrigem.descricao}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 text-blue-700 dark:text-blue-300">
                        <span className="flex items-center gap-1">
                          <Layers className="h-4 w-4" />
                          <strong>{planoOrigem.total_tarefas || 0}</strong> tarefas
                        </span>
                        <span>
                          <strong>{planoOrigem.tarefas_ativas || 0}</strong> ativas
                        </span>
                        <span className="text-blue-600 dark:text-blue-400">
                          Versão {planoOrigem.versao}
                        </span>
                      </div>
                      {planoOrigem.equipamento && (
                        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 mt-2 pt-2 border-t border-blue-200 dark:border-blue-800">
                          <Wrench className="h-4 w-4" />
                          <span><strong>Equipamento Atual:</strong> {planoOrigem.equipamento.nome}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Seleção de Equipamentos com Hierarquia */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <Wrench className="h-5 w-5 text-green-600" />
                2. Selecionar Equipamentos Destino
              </h2>

              {/* Seletores Hierárquicos: PLANTA → UNIDADE → EQUIPAMENTO */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    Planta/Local
                  </label>
                  <select
                    value={plantaSelecionada}
                    onChange={(e) => {
                      setPlantaSelecionada(e.target.value);
                      setUnidadeSelecionada('');
                      setEquipamentoSelecionado('');
                    }}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Selecione a planta...</option>
                    {plantas.map((planta: any) => (
                      <option key={planta.id} value={planta.id}>
                        {planta.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Factory className="h-4 w-4 inline mr-1" />
                    Unidade
                  </label>
                  <select
                    value={unidadeSelecionada}
                    onChange={(e) => {
                      setUnidadeSelecionada(e.target.value);
                      setEquipamentoSelecionado('');
                    }}
                    disabled={!plantaSelecionada}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">
                      {plantaSelecionada ? "Selecione a unidade..." : "Primeiro selecione uma planta"}
                    </option>
                    {unidadesDisponiveis.map((unidade: any) => (
                      <option key={unidade.id} value={unidade.id}>
                        {unidade.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Wrench className="h-4 w-4 inline mr-1" />
                    Equipamento
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={equipamentoSelecionado}
                      onChange={(e) => setEquipamentoSelecionado(e.target.value)}
                      disabled={!unidadeSelecionada}
                      className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">
                        {unidadeSelecionada ? "Selecione o equipamento..." : "Primeiro selecione uma unidade"}
                      </option>
                      {equipamentosDisponiveis.map((equipamento: any) => (
                        <option key={equipamento.id} value={equipamento.id.toString()}>
                          {equipamento.nome} - {equipamento.tipo}
                        </option>
                      ))}
                    </select>
                    <Button
                      onClick={adicionarEquipamento}
                      disabled={!equipamentoSelecionado}
                      className="px-4"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Lista de Equipamentos Selecionados */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    Equipamentos Destino ({equipamentosSelecionados.length})
                  </h3>
                  {equipamentosSelecionados.length > 0 && (
                    <Button variant="outline" size="sm" onClick={limparTodos}>
                      Limpar Todos
                    </Button>
                  )}
                </div>

                {equipamentosSelecionados.length === 0 ? (
                  <div className="text-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                    <Wrench className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum equipamento selecionado</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {equipamentosSelecionados.map((eq) => (
                      <div key={eq.equipamentoId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-gray-100">{eq.equipamentoNome}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {eq.plantaNome}
                            </span>
                            <span>→</span>
                            <span className="flex items-center gap-1">
                              <Factory className="h-3 w-3" />
                              {eq.unidadeNome}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removerEquipamento(eq.equipamentoId)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Ação de Clonagem */}
          {planoOrigem && equipamentosSelecionados.length > 0 && (
            <Card className="mt-6 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                3. Confirmar Clonagem
              </h3>

              <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div className="text-sm text-amber-700 dark:text-amber-300">
                    <p className="font-medium mb-1">Você está prestes a criar:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>{equipamentosSelecionados.length} novos planos de manutenção</li>
                      <li>{stats.totalTarefas} novas tarefas (incluindo subtarefas e recursos)</li>
                      <li>Esta operação pode levar alguns segundos</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <Button
                  onClick={handleClonar}
                  disabled={clonando}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
                  size="lg"
                >
                  {clonando ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Clonando Planos...
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-5 w-5" />
                      Clonar para {equipamentosSelecionados.length} Equipamento(s)
                    </>
                  )}
                </Button>
              </div>
            </Card>
          )}

          {/* Modal de Resultado */}
          {mostrarResultado && resultado && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      Resultado da Clonagem
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMostrarResultado(false)}
                    >
                      <XCircle className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Resumo */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-2xl font-bold text-green-900 dark:text-green-100">
                          {resultado.planos_criados}
                        </span>
                      </div>
                      <p className="text-sm text-green-700 dark:text-green-300">Planos Criados</p>
                    </div>

                    <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <XCircle className="h-5 w-5 text-red-600" />
                        <span className="text-2xl font-bold text-red-900 dark:text-red-100">
                          {resultado.planos_com_erro}
                        </span>
                      </div>
                      <p className="text-sm text-red-700 dark:text-red-300">Erros</p>
                    </div>
                  </div>

                  {/* Detalhes */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Detalhes:</h4>
                    {resultado.detalhes.map((detalhe, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          detalhe.sucesso
                            ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                            : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {detalhe.sucesso ? (
                            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className={`font-medium ${
                              detalhe.sucesso
                                ? 'text-green-900 dark:text-green-100'
                                : 'text-red-900 dark:text-red-100'
                            }`}>
                              {detalhe.equipamento_nome}
                            </p>
                            {detalhe.sucesso ? (
                              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                                Plano criado: {detalhe.plano_nome} ({detalhe.total_tarefas} tarefas)
                              </p>
                            ) : (
                              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                                Erro: {detalhe.erro}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex gap-3 justify-end">
                    {resultado.planos_criados > 0 && (
                      <Button
                        onClick={() => {
                          setMostrarResultado(false);
                          navigate('/planos-manutencao');
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Ver Todos os Planos
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => {
                        setMostrarResultado(false);
                        if (resultado.planos_com_erro === 0) {
                          navigate('/planos-manutencao');
                        }
                      }}
                    >
                      {resultado.planos_com_erro === 0 ? 'Concluir' : 'Fechar'}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </Layout.Main>
    </Layout>
  );
}
