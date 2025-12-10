// src/features/planos-manutencao/components/AssociacaoEquipamentosPage.tsx - USANDO API REAL

import { BaseModal } from '@/components/common/base-modal/BaseModal';
import { Layout } from '@/components/common/Layout';
import { TitleCard } from '@/components/common/title-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEquipamentos } from '@nexon/features/equipamentos/hooks/useEquipamentos';
import { useGenericModal } from '@/hooks/useGenericModal';
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
import { planosFormFields } from '../config/form-config';
import { usePlanosManutencaoApi } from '../hooks/usePlanosManutencaoApi';

interface EquipamentoSelecionado {
  equipamentoId: string; // Mudado para string (CUID)
  equipamentoNome: string;
  plantaId: number;
  plantaNome: string;
}

interface AssociacaoRapida {
  equipamentos: EquipamentoSelecionado[];
  planoSelecionado: string;
  responsavelPadrao: string;
  observacoesPadrao: string;
}

export function AssociacaoEquipamentosPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planoIdInicial = searchParams.get('planoId');
  
  const { equipamentos } = useEquipamentos();

  // Funções utilitárias para trabalhar com equipamentos
  const getEquipamentosUCByPlanta = (plantaId: number) => {
    return equipamentos.filter(eq =>
      eq.plantaId === plantaId.toString() && eq.classificacao === 'UC'
    );
  };

  const getPlantaById = (plantaId: number) => {
    // Simular busca de planta - você pode implementar um hook específico se necessário
    const plantasUnicas = equipamentos
      .filter(eq => eq.planta?.id === plantaId.toString())
      .map(eq => eq.planta)
      .filter(Boolean);
    return plantasUnicas[0] || null;
  };

  const plantas = equipamentos
    .filter((eq, index, arr) => eq.planta && arr.findIndex(e => e.planta?.id === eq.planta?.id) === index)
    .map(eq => eq.planta!)
    .filter(Boolean);

  // 🔧 USANDO API REAL
  const { 
    planos, 
    loading,
    createPlano, 
    duplicarPlano, 
    fetchPlanos 
  } = usePlanosManutencaoApi();
  
  // Modal para criar/duplicar planos
  const {
    modalState,
    openModal,
    closeModal
  } = useGenericModal<PlanoManutencaoApiResponse>();
  
  const [plantaSelecionada, setPlantaSelecionada] = useState<string>('');
  const [equipamentoSelecionado, setEquipamentoSelecionado] = useState<string>('');
  const [associacao, setAssociacao] = useState<AssociacaoRapida>({
    equipamentos: [],
    planoSelecionado: planoIdInicial || '',
    responsavelPadrao: '',
    observacoesPadrao: ''
  });

  // Estados para as novas funcionalidades
  const [mostrandoOpcaoPlano, setMostrandoOpcaoPlano] = useState<'selecionar' | 'criar' | 'duplicar'>('selecionar');
  const [planoParaDuplicar, setPlanoParaDuplicar] = useState<string>('');
  const [associandoEquipamentos, setAssociandoEquipamentos] = useState(false);

  const equipamentosDisponiveis = plantaSelecionada ? 
    getEquipamentosUCByPlanta(Number(plantaSelecionada)) : [];

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
    if (!plantaSelecionada || !equipamentoSelecionado) return;

    const equipamento = equipamentosDisponiveis.find((eq: any) => eq.id === Number(equipamentoSelecionado));
    const planta = getPlantaById(Number(plantaSelecionada));
    
    if (!equipamento || !planta) return;

    // 🔧 VERIFICAR SE EQUIPAMENTO JÁ FOI ADICIONADO (comparando como string)
    if (associacao.equipamentos.some(eq => eq.equipamentoId === equipamento.id.toString())) {
      alert('Este equipamento já foi adicionado à lista.');
      return;
    }

    const novoEquipamento: EquipamentoSelecionado = {
      equipamentoId: equipamento.id.toString(), // Converter para string
      equipamentoNome: equipamento.nome,
      plantaId: parseInt(planta.id.toString()),
      plantaNome: planta.nome
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
          criado_por: data.criado_por || 'usuario-atual'
        };
        novoPlano = await createPlano(createData);
      } else if (mostrandoOpcaoPlano === 'duplicar') {
        novoPlano = await duplicarPlano(planoParaDuplicar, {
          equipamento_destino_id: data.equipamento_id,
          novo_nome: data.nome,
          criado_por: 'usuario-atual'
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

  // 🔧 TODO: IMPLEMENTAR ASSOCIAÇÃO REAL COM A API
  const handleAssociar = async () => {
    if (associacao.equipamentos.length === 0 || !associacao.planoSelecionado) {
      alert('Selecione ao menos um equipamento e um plano.');
      return;
    }

    try {
      setAssociandoEquipamentos(true);
      
      // TODO: Implementar endpoint de associação na API
      console.log('📋 Dados para associação:', {
        planoManutencaoId: associacao.planoSelecionado,
        equipamentosIds: associacao.equipamentos.map(eq => eq.equipamentoId),
        responsavelPadrao: associacao.responsavelPadrao || undefined,
        observacoesPadrao: associacao.observacoesPadrao || undefined
      });

      // Por enquanto, simular sucesso
      alert(`Sucesso! ${associacao.equipamentos.length} associação(ões) serão criadas. As tarefas serão geradas automaticamente.`);
      
      // Navegar para as tarefas geradas
      navigate(`/tarefas?planoId=${associacao.planoSelecionado}`);
      
    } catch (error) {
      console.error('Erro ao associar:', error);
      alert('Erro ao criar associações. Tente novamente.');
    } finally {
      setAssociandoEquipamentos(false);
    }
  };

  // 🔧 USANDO PLANO DA API
  const planoSelecionadoDetalhes = planos.find(p => p.id === associacao.planoSelecionado);

  const getModalTitle = () => {
    if (mostrandoOpcaoPlano === 'criar') {
      return 'Criar Novo Plano de Manutenção';
    } else if (mostrandoOpcaoPlano === 'duplicar') {
      return 'Duplicar Plano de Manutenção';
    }
    return 'Plano de Manutenção';
  };

  const getModalEntity = () => {
    if (mostrandoOpcaoPlano === 'criar') {
      return {
        id: '',
        equipamento_id: '',
        nome: '',
        descricao: '',
        versao: '1.0',
        status: 'ATIVO',
        ativo: true,
        data_vigencia_inicio: '',
        data_vigencia_fim: '',
        observacoes: '',
        criado_por: ''
      };
    }
    return modalState.entity || {
      id: '',
      equipamento_id: '',
      nome: '',
      descricao: '',
      versao: '1.0',
      status: 'ATIVO',
      ativo: true,
      data_vigencia_inicio: '',
      data_vigencia_fim: '',
      observacoes: '',
      criado_por: ''
    };
  };

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
                  <select
                    value={plantaSelecionada}
                    onChange={(e) => {
                      setPlantaSelecionada(e.target.value);
                      setEquipamentoSelecionado('');
                    }}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Selecione a planta...</option>
                    {plantas.map((planta: any) => (
                      <option key={planta.id} value={planta.id.toString()}>
                        {planta.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Equipamento
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={equipamentoSelecionado}
                      onChange={(e) => setEquipamentoSelecionado(e.target.value)}
                      disabled={!plantaSelecionada}
                      className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">
                        {plantaSelecionada ? "Selecione o equipamento..." : "Primeiro selecione uma planta"}
                      </option>
                      {equipamentosDisponiveis.map((equipamento: any) => (
                        <option key={equipamento.id} value={equipamento.id.toString()}>
                          {equipamento.nome} - {equipamento.tipo}
                        </option>
                      ))}
                    </select>
                    <Button 
                      onClick={adicionarEquipamento}
                      disabled={!plantaSelecionada || !equipamentoSelecionado}
                      className="px-4"
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
                          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            {eq.plantaNome}
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
                    >
                      <Layers className="h-4 w-4 mr-1" />
                      Usar Existente
                    </Button>
                    <Button
                      variant={mostrandoOpcaoPlano === 'criar' ? 'default' : 'outline'}
                      size="sm"
                      onClick={handleCriarNovoPlano}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Criar Novo
                    </Button>
                    <Button
                      variant={mostrandoOpcaoPlano === 'duplicar' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMostrandoOpcaoPlano('duplicar')}
                      disabled={planos.length === 0}
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
                      <select
                        value={planoParaDuplicar}
                        onChange={(e) => setPlanoParaDuplicar(e.target.value)}
                        className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      >
                        <option value="">Selecione um plano para duplicar...</option>
                        {planos.map(plano => (
                          <option key={plano.id} value={plano.id}>
                            {plano.nome} (v{plano.versao})
                          </option>
                        ))}
                      </select>
                      <Button onClick={handleDuplicarPlano}>
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
                    <select
                      value={associacao.planoSelecionado}
                      onChange={(e) => setAssociacao(prev => ({ ...prev, planoSelecionado: e.target.value }))}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      disabled={loading}
                    >
                      <option value="">
                        {loading ? "Carregando planos..." : "Selecione um plano..."}
                      </option>
                      {planos.filter(p => p.ativo).map(plano => (
                        <option key={plano.id} value={plano.id}>
                          {plano.nome} (v{plano.versao}) - {plano.status}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Responsável Padrão (Opcional)
                  </label>
                  <Input
                    placeholder="Nome do responsável..."
                    value={associacao.responsavelPadrao}
                    onChange={(e) => setAssociacao(prev => ({ ...prev, responsavelPadrao: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Observações Padrão (Opcional)
                  </label>
                  <Input
                    placeholder="Observações para todas as tarefas..."
                    value={associacao.observacoesPadrao}
                    onChange={(e) => setAssociacao(prev => ({ ...prev, observacoesPadrao: e.target.value }))}
                  />
                </div>
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
        <BaseModal
          isOpen={modalState.isOpen}
          mode="create"
          entity={getModalEntity()}
          title={getModalTitle()}
          icon={<Layers className="h-5 w-5 text-blue-600" />}
          formFields={planosFormFields}
          onClose={() => {
            closeModal();
            setMostrandoOpcaoPlano('selecionar');
          }}
          onSubmit={handleSubmitPlano}
          width="w-[1000px]"
          groups={[
            { key: 'informacoes_basicas', title: 'Informações Básicas' },
            { key: 'configuracoes', title: 'Configurações' },
            { key: 'tarefas_template', title: 'Templates de Tarefas' }
          ]}
        />
      </Layout.Main>
    </Layout>
  );
}