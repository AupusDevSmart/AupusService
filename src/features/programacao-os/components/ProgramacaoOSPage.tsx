// src/features/programacao-os/components/ProgramacaoOSPage.tsx - ATUALIZADA COM CARDS
import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/common/Layout';
import { TitleCard } from '@/components/common/title-card';
import { BaseTable } from '@nexon/components/common/base-table/BaseTable';
import { BaseFilters } from '@nexon/components/common/base-filters/BaseFilters';
import { BaseModal } from '@nexon/components/common/base-modal/BaseModal';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Calendar, Play, CheckCircle, XCircle, Download, Clock, AlertTriangle, Trash2 } from 'lucide-react';
import { useGenericModal } from '@/hooks/useGenericModal';
import { programacaoOSTableColumns } from '../config/table-config';
import { programacaoOSFilterConfig } from '../config/filter-config';
import { programacaoOSFormFields, programacaoOSFormGroups } from '../config/form-config';
import { createProgramacaoOSTableActions } from '../config/actions-config';
import { useProgramacaoOS } from '../hooks/useProgramacaoOS';
import { WorkflowModal } from './WorkflowModal';
import { processarMateriaisComCustos, processarTecnicosComCustos } from '@/utils/recursos.utils';
import type { ProgramacaoResponse, ProgramacaoDetalhesResponse, ProgramacaoFiltersDto, CreateProgramacaoDto } from '@/services/programacao-os.service';
import { useUserStore } from '@/store/useUserStore';

// Função utilitária para converter datas para o formato datetime-local
const formatToDateTimeLocal = (dateValue: any): string => {
  if (!dateValue) return '';

  try {
    let date: Date;

    if (typeof dateValue === 'string') {
      // Se já está no formato correto (YYYY-MM-DDTHH:mm), retornar
      if (dateValue.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
        return dateValue;
      }

      // Se está no formato ISO com segundos, remover os segundos
      if (dateValue.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
        return dateValue.substring(0, 16); // YYYY-MM-DDTHH:mm
      }

      // Tentar fazer parse da data
      date = new Date(dateValue);
    } else {
      date = new Date(dateValue);
    }

    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      return '';
    }

    // Converter para o formato datetime-local
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch (error) {
    console.error('Erro ao formatar data para datetime-local:', error);
    return '';
  }
};

const initialFilters: ProgramacaoFiltersDto = {
  page: 1,
  limit: 10,
  search: '',
  status: 'all',
  tipo: 'all',
  prioridade: 'all',
  origem: 'all'
};

export function ProgramacaoOSPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUserStore(); // Hook para obter usuário logado

  // Estados principais
  const [programacoes, setProgramacoes] = useState<ProgramacaoResponse[]>([]);
  const [filters, setFilters] = useState<ProgramacaoFiltersDto>(initialFilters);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [stats, setStats] = useState<{
    rascunho: number;
    pendentes: number;
    em_analise: number;
    aprovadas: number;
    rejeitadas: number;
    canceladas: number;
  }>({
    rascunho: 0,
    pendentes: 0,
    em_analise: 0,
    aprovadas: 0,
    rejeitadas: 0,
    canceladas: 0
  });

  // Estados para workflow modal
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [workflowAction, setWorkflowAction] = useState<'analisar' | 'aprovar' | 'rejeitar' | 'cancelar' | null>(null);
  const [programacaoWorkflow, setProgramacaoWorkflow] = useState<ProgramacaoResponse | null>(null);

  const {
    modalState,
    openModal,
    closeModal
  } = useGenericModal<ProgramacaoResponse>();

  const {
    loading,
    listarProgramacoes,
    criarProgramacao,
    atualizarProgramacao,
    analisarProgramacao,
    aprovarProgramacao,
    rejeitarProgramacao,
    cancelarProgramacao,
    deletarProgramacao,
    iniciarExecucao,
    exportarOS,
    buscarProgramacao
  } = useProgramacaoOS();

  // Carregar dados
  const carregarDados = async () => {
    try {
      const response = await listarProgramacoes(filters);
      setProgramacoes(response.data || []);
      setPagination(response.pagination || {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
      });
      setStats(response.stats || {
        rascunho: 0,
        pendentes: 0,
        em_analise: 0,
        aprovadas: 0,
        rejeitadas: 0,
        canceladas: 0
      });
    } catch (error) {
      console.error('Erro ao carregar programações:', error);
      // Manter estados com valores padrão em caso de erro
      setProgramacoes([]);
      setPagination({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
      });
      setStats({
        rascunho: 0,
        pendentes: 0,
        em_analise: 0,
        aprovadas: 0,
        rejeitadas: 0,
        canceladas: 0
      });
    }
  };

  // Carregar dados quando filtros mudarem
  useEffect(() => {
    carregarDados();
  }, [filters]);

  // Receber dados pré-selecionados via navigate state
  useEffect(() => {
    const state = location.state as any;
    if (state?.preselectedData) {
      // console.log('📋 Dados pré-selecionados recebidos:', state.preselectedData);
      
      setTimeout(() => {
        openModal('create', null, state.preselectedData);
      }, 100);
      
      // Limpar state
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate, openModal]);

  // Handlers para filtros
  const handleFilterChange = (filters: Partial<ProgramacaoFiltersDto>) => {
    setFilters(prev => ({
      ...prev,
      ...filters,
      page: 1 // Reset para primeira página
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  // Handlers para CRUD
  const handleSubmit = async (data: any) => {
    try {
      console.log('🔄 Dados recebidos do modal:', data);
      
      // ✅ UNIFICADO: Mesma preparação de dados para create e update
      const preparedData = {
        // Campos básicos
        descricao: data.descricao,
        local: data.local,
        ativo: data.ativo,
        condicoes: data.condicoes,
        tipo: data.tipo,
        prioridade: data.prioridade,
        origem: data.origem?.tipo || 'MANUAL',

        // Relacionamentos de origem (só incluir se existirem)
        ...(data.origem?.plantaId && { planta_id: data.origem.plantaId }),
        ...(data.origem?.equipamentoId && { equipamento_id: data.origem.equipamentoId }),
        ...(data.origem?.anomaliaId && { anomalia_id: data.origem.anomaliaId }),
        ...(data.origem?.planoId && { plano_manutencao_id: data.origem.planoId }),

        // Dados de origem completos (sempre incluir para referência)
        dados_origem: data.origem || null,

        // Planejamento - campos atualizados para snake_case
        tempo_estimado: parseFloat(data.tempo_estimado || data.tempoEstimado) || 4,
        duracao_estimada: parseFloat(data.duracao_estimada || data.duracaoEstimada) || 6,
        data_previsao_inicio: data.data_previsao_inicio || data.dataPrevisaoInicio ?
          new Date(data.data_previsao_inicio || data.dataPrevisaoInicio).toISOString() : null,
        data_previsao_fim: data.data_previsao_fim || data.dataPrevisaoFim ?
          new Date(data.data_previsao_fim || data.dataPrevisaoFim).toISOString() : null,
        orcamento_previsto: parseFloat(data.orcamento_previsto || data.orcamentoPrevisto) || null,

        // Programação - campos atualizados para snake_case
        data_hora_programada: data.data_hora_programada || data.dataHoraProgramada ?
          new Date(data.data_hora_programada || data.dataHoraProgramada).toISOString() : null,
        responsavel: data.responsavel || null,
        responsavel_id: data.responsavel_id || null,
        time_equipe: data.time_equipe || data.timeEquipe || null,

        // Veículo - campos atualizados para snake_case
        necessita_veiculo: data.necessita_veiculo || data.necessitaVeiculo || false,
        // Extrair dados de reserva_veiculo (objeto retornado pelo componente customizado)
        veiculo_id: data.reserva_veiculo?.veiculo_id || data.veiculo_id || null,
        reserva_data_inicio: data.reserva_veiculo?.reserva_data_inicio || data.reserva_data_inicio || null,
        reserva_data_fim: data.reserva_veiculo?.reserva_data_fim || data.reserva_data_fim || null,
        reserva_hora_inicio: data.reserva_veiculo?.reserva_hora_inicio || data.reserva_hora_inicio || null,
        reserva_hora_fim: data.reserva_veiculo?.reserva_hora_fim || data.reserva_hora_fim || null,
        reserva_finalidade: data.reserva_veiculo?.reserva_finalidade || data.reserva_finalidade || null,
        assentos_necessarios: data.assentos_necessarios || data.assentosNecessarios ?
          parseInt(data.assentos_necessarios || data.assentosNecessarios) : null,
        carga_necessaria: data.carga_necessaria || data.cargaNecessaria ?
          parseFloat(data.carga_necessaria || data.cargaNecessaria) : null,
        observacoes_veiculo: data.observacoes_veiculo || data.observacoesVeiculo || null,

        // Observações - campos atualizados para snake_case
        observacoes: data.observacoes || null,
        observacoes_programacao: data.observacoes_programacao || data.observacoesProgramacao || null,
        justificativa: data.justificativa || null,

        // Tarefas relacionadas (só para create, em update pode ser separado)
        ...(modalState.mode === 'create' && {
          // IDs das tarefas selecionadas
          tarefas_ids: data.origem?.tarefasSelecionadas || []
        }),

        // Arrays de recursos - Apenas campos aceitos pelo backend
        materiais: data.materiais?.map((m: any) => ({
          descricao: m.descricao,
          quantidade_planejada: parseFloat(m.quantidade_planejada || m.quantidade || 1),
          unidade: m.unidade || 'UN',
          custo_unitario: parseFloat(m.custo_unitario || 0)
        })) || [],

        ferramentas: data.ferramentas?.map((f: any) => ({
          descricao: f.descricao,
          quantidade: parseInt(f.quantidade || 1)
        })) || [],

        tecnicos: data.tecnicos?.map((t: any) => ({
          nome: t.nome,
          especialidade: t.especialidade,
          horas_estimadas: parseFloat(t.horas_estimadas || t.horasEstimadas || 8),
          custo_hora: parseFloat(t.custo_hora || t.custoHora || 0),
          tecnico_id: t.tecnico_id || null
        })) || []
      };

      console.log('📤 Dados preparados para API:', preparedData);
      console.log('🚗 [DEBUG RESERVA] Dados de reserva extraídos:', {
        reserva_veiculo_original: data.reserva_veiculo,
        veiculo_id: preparedData.veiculo_id,
        reserva_data_inicio: preparedData.reserva_data_inicio,
        reserva_data_fim: preparedData.reserva_data_fim,
        reserva_hora_inicio: preparedData.reserva_hora_inicio,
        reserva_hora_fim: preparedData.reserva_hora_fim,
        reserva_finalidade: preparedData.reserva_finalidade
      });

      if (modalState.mode === 'create') {
        // Backend preenche automaticamente criado_por_id
        await criarProgramacao(preparedData as CreateProgramacaoDto);
      } else if (modalState.mode === 'edit') {
        // ✅ CORREÇÃO: Mesma estrutura, só remover campos que não devem ser atualizados
        const updateData = { ...preparedData };
        
        // Remover campos que não devem ser alterados em updates (se necessário)
        // delete updateData.origem; // Exemplo: se origem não pode ser alterada
        // delete updateData.dados_origem; // Exemplo: se dados_origem não podem ser alterados
        
        await atualizarProgramacao(modalState.entity!.id, updateData as Partial<CreateProgramacaoDto>);
      }
      
      await carregarDados();
      closeModal();
    } catch (error) {
      //console.error('❌ Erro ao salvar:', error);
      alert('Erro ao salvar programação. Verifique os dados e tente novamente.');
    }
  };

  // Handlers para ações da tabela
  const handleView = async (programacao: ProgramacaoResponse) => {
    // ✅ OTIMIZAÇÃO: Abrir modal instantaneamente com dados básicos
    openModal('view', programacao);

    // Carregar dados completos em segundo plano
    try {
      console.log('🔍 [ProgramacaoOSPage] Carregando dados completos em segundo plano:', programacao.id);
      const dadosCompletos = await buscarProgramacao(programacao.id);

      console.log('📦 [ProgramacaoOSPage] Dados completos carregados, atualizando modal...');

      // Atualizar modal com dados completos (só se ainda estiver aberto)
      if (modalState.isOpen && modalState.entity?.id === programacao.id) {
        openModal('view', dadosCompletos);
      }
    } catch (error) {
      console.error('❌ [ProgramacaoOSPage] Erro ao carregar dados completos:', error);
      // Modal já está aberto com dados básicos, não precisa fazer nada
    }
  };

  const handleEdit = async (programacao: ProgramacaoResponse) => {
    // Verificar se pode ser editada
    if (!['RASCUNHO', 'PENDENTE'].includes(programacao.status)) {
      alert('Apenas programações em rascunho ou pendentes podem ser editadas');
      return;
    }

    // ✅ OTIMIZAÇÃO: Abrir modal instantaneamente com dados básicos
    openModal('edit', programacao);

    // Carregar dados completos em segundo plano
    try {
      const dadosCompletos = await buscarProgramacao(programacao.id);

      // Atualizar modal com dados completos (só se ainda estiver aberto)
      if (modalState.isOpen && modalState.entity?.id === programacao.id) {
        openModal('edit', dadosCompletos);
      }
    } catch (error) {
      console.error('Erro ao carregar dados completos:', error);
      // Modal já está aberto com dados básicos, não precisa fazer nada
    }
  };

  // ============================
  // AÇÕES ESPECÍFICAS DO WORKFLOW
  // ============================

  // PENDENTE → EM_ANALISE
  const handleAnalisar = async (programacao: ProgramacaoResponse, dadosAnalise?: any) => {
    if (programacao.status !== 'PENDENTE') {
      alert('Apenas programações pendentes podem ser analisadas');
      return;
    }

    // Se não há dados, abrir modal
    if (!dadosAnalise) {
      setProgramacaoWorkflow(programacao);
      setWorkflowAction('analisar');
      setShowWorkflowModal(true);
      return;
    }

    try {
      console.log('🔍 [DEBUG] Chamando analisarProgramacao:', {
        id: programacao.id,
        observacoes: dadosAnalise.observacoes_analise || '',
        programacaoCompleta: programacao
      });

      await analisarProgramacao(programacao.id, dadosAnalise.observacoes_analise || '');
      await carregarDados();
      setShowWorkflowModal(false);

      // Atualizar modal com dados mais recentes se estiver aberto
      if (modalState.isOpen && modalState.entity?.id === programacao.id) {
        const dadosAtualizados = await buscarProgramacao(programacao.id);
        openModal(modalState.mode, dadosAtualizados);
      }

      alert('✅ Programação enviada para análise com sucesso!');
    } catch (error) {
      console.error('Erro ao analisar:', error);
      alert('❌ Erro ao iniciar análise. Tente novamente.');
    }
  };

  // EM_ANALISE → APROVADA
  const handleAprovar = async (programacao: ProgramacaoResponse, dadosAprovacao?: any) => {
    if (programacao.status !== 'EM_ANALISE') {
      alert('Apenas programações em análise podem ser aprovadas');
      return;
    }

    // Se não há dados, abrir modal
    if (!dadosAprovacao) {
      setProgramacaoWorkflow(programacao);
      setWorkflowAction('aprovar');
      setShowWorkflowModal(true);
      return;
    }

    try {
      await aprovarProgramacao(
        programacao.id,
        dadosAprovacao.observacoes_aprovacao || '',
        {
          ajustes_orcamento: dadosAprovacao.ajustes_orcamento || null,
          data_programada_sugerida: dadosAprovacao.data_programada_sugerida || null,
          hora_programada_sugerida: dadosAprovacao.hora_programada_sugerida || null
        }
      );

      await carregarDados();
      setShowWorkflowModal(false);

      // Atualizar modal com dados mais recentes se estiver aberto
      if (modalState.isOpen && modalState.entity?.id === programacao.id) {
        const dadosAtualizados = await buscarProgramacao(programacao.id);
        openModal(modalState.mode, dadosAtualizados);
      }

      alert('✅ Programação aprovada! Uma ordem de serviço foi gerada automaticamente.');
    } catch (error) {
      console.error('Erro ao aprovar:', error);
      alert('❌ Erro ao aprovar programação. Tente novamente.');
    }
  };

  // EM_ANALISE → REJEITADA
  const handleRejeitar = async (programacao: ProgramacaoResponse, dadosRejeicao?: any) => {
    if (programacao.status !== 'EM_ANALISE') {
      alert('Apenas programações em análise podem ser rejeitadas');
      return;
    }

    // Se não há dados, abrir modal
    if (!dadosRejeicao) {
      setProgramacaoWorkflow(programacao);
      setWorkflowAction('rejeitar');
      setShowWorkflowModal(true);
      return;
    }

    try {
      if (!dadosRejeicao.motivo_rejeicao?.trim()) {
        alert('⚠️ O motivo da rejeição é obrigatório');
        return;
      }

      await rejeitarProgramacao(programacao.id, dadosRejeicao.motivo_rejeicao, dadosRejeicao.sugestoes_melhoria);
      await carregarDados();
      setShowWorkflowModal(false);

      // Atualizar modal com dados mais recentes se estiver aberto
      if (modalState.isOpen && modalState.entity?.id === programacao.id) {
        const dadosAtualizados = await buscarProgramacao(programacao.id);
        openModal(modalState.mode, dadosAtualizados);
      }

      alert('✅ Programação rejeitada com sucesso!');
    } catch (error) {
      console.error('Erro ao rejeitar:', error);
      alert('❌ Erro ao rejeitar programação. Tente novamente.');
    }
  };

  // QUALQUER_STATUS → CANCELADA (exceto APROVADA e CANCELADA)
  const handleCancelar = async (programacao: ProgramacaoResponse, dadosCancelamento?: any) => {
    if (['CANCELADA', 'APROVADA'].includes(programacao.status)) {
      alert('⚠️ Esta programação não pode ser cancelada');
      return;
    }

    // Se não há dados, abrir modal
    if (!dadosCancelamento) {
      setProgramacaoWorkflow(programacao);
      setWorkflowAction('cancelar');
      setShowWorkflowModal(true);
      return;
    }

    try {
      if (!dadosCancelamento.motivo_cancelamento?.trim()) {
        alert('⚠️ O motivo do cancelamento é obrigatório');
        return;
      }

      await cancelarProgramacao(programacao.id, dadosCancelamento.motivo_cancelamento);
      await carregarDados();
      setShowWorkflowModal(false);

      // Atualizar modal com dados mais recentes se estiver aberto
      if (modalState.isOpen && modalState.entity?.id === programacao.id) {
        const dadosAtualizados = await buscarProgramacao(programacao.id);
        openModal(modalState.mode, dadosAtualizados);
      }

      alert('✅ Programação cancelada com sucesso!');
    } catch (error) {
      console.error('Erro ao cancelar:', error);
      alert('❌ Erro ao cancelar programação. Tente novamente.');
    }
  };

  const handleDeletar = async (programacao: ProgramacaoResponse) => {
    if (programacao.status === 'APROVADA') {
      alert('Programações aprovadas não podem ser deletadas');
      return;
    }

    const confirmacao = confirm(`Deseja deletar a programação "${programacao.descricao}"?`);
    if (!confirmacao) return;

    try {
      await deletarProgramacao(programacao.id);
      await carregarDados();
    } catch (error) {
      // console.error('Erro ao deletar:', error);
      alert('Erro ao deletar programação. Tente novamente.');
    }
  };

  const handleIrParaExecucao = (programacao: ProgramacaoResponse) => {
    if (programacao.ordem_servico?.id) {
      navigate(`/execucao-os?execucaoId=${programacao.ordem_servico.id}`);
    }
  };

  const handleExportar = async () => {
    try {
      const blob = await exportarOS(filters);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `programacoes-os-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      // console.error('Erro ao exportar:', error);
      alert('Erro ao exportar dados. Tente novamente.');
    }
  };

  // Fechar workflow modal
  const handleCloseWorkflowModal = () => {
    setShowWorkflowModal(false);
    setWorkflowAction(null);
    setProgramacaoWorkflow(null);
  };

  // Confirmar ação do workflow modal
  const handleConfirmWorkflowAction = async (data: any) => {
    if (!programacaoWorkflow || !workflowAction) return;

    switch (workflowAction) {
      case 'analisar':
        await handleAnalisar(programacaoWorkflow, data);
        break;
      case 'aprovar':
        await handleAprovar(programacaoWorkflow, data);
        break;
      case 'rejeitar':
        await handleRejeitar(programacaoWorkflow, data);
        break;
      case 'cancelar':
        await handleCancelar(programacaoWorkflow, data);
        break;
    }
  };

  // Criar ações da tabela (sem useMemo para evitar problemas de referência)
  const tableActions = createProgramacaoOSTableActions({
    onView: handleView,
    onEdit: handleEdit,
    onAnalisar: handleAnalisar,
    onAprovar: handleAprovar,
    onRejeitar: handleRejeitar,
    onCancelar: handleCancelar,
    onDelete: handleDeletar,
    onIrParaExecucao: handleIrParaExecucao,
  });

  const getModalTitle = useMemo(() => {
    const titles = {
      create: 'Nova Programação de Ordem de Serviço',
      edit: 'Editar Programação de OS',
      view: 'Visualizar Programação de OS'
    };
    return titles[modalState.mode as keyof typeof titles] || 'Programação de OS';
  }, [modalState.mode]);

  const getModalEntity = useMemo(() => {
    if (modalState.mode === 'create') {
      const baseEntity = {
        // ✅ Campos obrigatórios
        descricao: '',
        local: '',
        ativo: '',
        condicoes: 'PARADO',
        tipo: 'PREVENTIVA',
        prioridade: 'MEDIA',
        origem: {
          tipo: 'MANUAL',
          anomaliaId: undefined,
          planoId: undefined,
          dados: {},
          tarefasSelecionadas: []
        },
        // Usar snake_case para compatibilidade com form-config
        tempo_estimado: 4,
        duracao_estimada: 6,
        necessita_veiculo: false,
        assentos_necessarios: null,
        carga_necessaria: null,
        observacoes_veiculo: '',
        materiais: [],
        ferramentas: [],
        tecnicos: []
      };

      if (modalState.preselectedData) {
        return { ...baseEntity, ...modalState.preselectedData };
      }

      return baseEntity;
    }

    // Para view/edit, converter campos da API para o formato do formulário
    const entity = modalState.entity || {} as ProgramacaoDetalhesResponse;
    console.log('🔄 [ProgramacaoOSPage] getModalEntity chamada para view/edit:', entity.id)
    return {
      // Campos básicos - manter snake_case da API e adicionar camelCase para formulário
      id: entity.id,
      codigo: entity.codigo,
      numeroOS: entity.codigo, // Alias para numeroOS
      descricao: entity.descricao,
      local: entity.local,
      ativo: entity.ativo,

      // Status e classificação
      status: entity.status,
      tipo: entity.tipo,
      prioridade: entity.prioridade,
      condicoes: entity.condicoes,
      origem: {
        tipo: entity.origem, // ✅ CORREÇÃO: origem é uma string, não um objeto
        ...(typeof entity.dados_origem === 'object' ? entity.dados_origem : {}),
        // ✅ CORREÇÃO: Extrair IDs corretos das tarefas da programação
        tarefasSelecionadas: ((entity as any).tarefas_programacao || []).map((tarefa: any) => {
          // CRÍTICO: Usar tarefa_id em vez de id para obter o ID real da tarefa
          const tarefaId = tarefa.tarefa_id || tarefa.id;
          console.log('🔍 [ProgramacaoOSPage] Extraindo ID da tarefa:', {
            tarefa_id: tarefa.tarefa_id,
            id: tarefa.id,
            idSelecionado: tarefaId,
            tipoTarefaId: typeof tarefa.tarefa_id,
            tipoId: typeof tarefa.id
          });
          return tarefaId;
        }).filter(Boolean)
      },

      // IDs de relacionamento
      planta_id: entity.planta_id,
      equipamento_id: entity.equipamento_id,
      anomalia_id: entity.anomalia_id,
      plano_manutencao_id: entity.plano_manutencao_id,
      dados_origem: entity.dados_origem,

      // Campos de veículo (manter snake_case)
      necessita_veiculo: entity.necessita_veiculo ?? false,
      assentos_necessarios: entity.assentos_necessarios ?? null,
      carga_necessaria: entity.carga_necessaria ?? null,
      observacoes_veiculo: entity.observacoes_veiculo ?? '',
      // ✅ CORREÇÃO: Mapear reserva_veiculo dependendo do modo
      reserva_veiculo: modalState.mode === 'edit' && entity.reserva_veiculo ? {
        // Para EDIT: converter para formato do ReservaViaturaField
        veiculo_id: entity.reserva_veiculo.veiculo_id,
        reserva_data_inicio: entity.reserva_veiculo.data_inicio ?
          new Date(entity.reserva_veiculo.data_inicio).toISOString().split('T')[0] : '',
        reserva_data_fim: entity.reserva_veiculo.data_fim ?
          new Date(entity.reserva_veiculo.data_fim).toISOString().split('T')[0] : '',
        reserva_hora_inicio: entity.reserva_veiculo.hora_inicio,
        reserva_hora_fim: entity.reserva_veiculo.hora_fim,
        reserva_finalidade: entity.reserva_veiculo.finalidade
      } : entity.reserva_veiculo ?? null, // Para VIEW: manter formato original da API

      // Campos de planejamento e programação (manter snake_case)
      tempo_estimado: entity.tempo_estimado ?? 0,
      duracao_estimada: entity.duracao_estimada ?? 0,
      data_previsao_inicio: formatToDateTimeLocal(entity.data_previsao_inicio),
      data_previsao_fim: formatToDateTimeLocal(entity.data_previsao_fim),
      data_hora_programada: formatToDateTimeLocal(entity.data_hora_programada),
      orcamento_previsto: entity.orcamento_previsto ?? null,
      time_equipe: entity.time_equipe ?? '',
      responsavel: entity.responsavel ?? '',
      responsavel_id: entity.responsavel_id ?? '',
      observacoes: entity.observacoes ?? '',
      observacoes_programacao: entity.observacoes_programacao ?? '',
      justificativa: entity.justificativa ?? '',

      // Campos de workflow
      observacoes_analise: entity.observacoes_analise ?? '',
      motivo_rejeicao: entity.motivo_rejeicao ?? '',
      sugestoes_melhoria: entity.sugestoes_melhoria ?? '',
      motivo_cancelamento: entity.motivo_cancelamento ?? '',
      observacoes_aprovacao: entity.observacoes_aprovacao ?? '',
      ajustes_orcamento: entity.ajustes_orcamento ?? null,
      data_programada_sugerida: entity.data_programada_sugerida ?? '',
      hora_programada_sugerida: entity.hora_programada_sugerida ?? '',

      // Campos de auditoria
      criado_por: entity.criado_por,
      criado_por_id: entity.criado_por_id,
      criadoPor: entity.criado_por, // Alias para formulário
      analisado_por: entity.analisado_por,
      analisadoPor: entity.analisado_por, // Alias para formulário
      data_analise: entity.data_analise,
      dataAnalise: entity.data_analise, // Alias para formulário
      aprovado_por: entity.aprovado_por,
      aprovadoPor: entity.aprovado_por, // Alias para formulário
      data_aprovacao: entity.data_aprovacao,
      dataAprovacao: entity.data_aprovacao, // Alias para formulário

      // Mapear recursos da API para o formato do formulário COM cálculos
      materiais: processarMateriaisComCustos(
        entity.materiais?.map((material: any) => ({
          id: material.id,
          descricao: material.descricao,
          quantidade_planejada: material.quantidade_planejada || 0,
          quantidade: material.quantidade_planejada || 0, // Alias para compatibilidade
          unidade: material.unidade,
          custo_unitario: material.custo_unitario || 0,
          custoUnitario: material.custo_unitario || 0, // Alias para compatibilidade
          status: material.status || 'PLANEJADO',
          confirmado: material.confirmado || false,
          disponivel: material.disponivel !== false,
          observacoes: material.observacoes || ''
        })) || []
      ),

      ferramentas: entity.ferramentas?.map((ferramenta: any) => ({
        id: ferramenta.id,
        descricao: ferramenta.descricao,
        quantidade: ferramenta.quantidade,
        status: ferramenta.status || 'PLANEJADA',
        confirmada: ferramenta.confirmada || false,
        disponivel: ferramenta.disponivel !== false,
        calibracao: ferramenta.calibracao || 'EM_DIA',
        observacoes: ferramenta.observacoes || ''
      })) || [],

      tecnicos: processarTecnicosComCustos(
        entity.tecnicos?.map((tecnico: any) => ({
          id: tecnico.id,
          nome: tecnico.nome,
          especialidade: tecnico.especialidade,
          horas_estimadas: tecnico.horas_estimadas || 0,
          horasEstimadas: tecnico.horas_estimadas || 0, // Alias para compatibilidade
          custo_hora: tecnico.custo_hora || 0,
          custoHora: tecnico.custo_hora || 0, // Alias para compatibilidade
          tecnico_id: tecnico.tecnico_id,
          status: tecnico.status || 'PLANEJADO',
          confirmado: tecnico.confirmado || false,
          disponivel: tecnico.disponivel !== false,
          observacoes: tecnico.observacoes || ''
        })) || [],
        'planejamento' // Modo padrão
      ),

      // Dados da origem expandidos (para exibição no card)
      anomalia: (entity as any).anomalia || null,
      plano_manutencao: (entity as any).plano_manutencao || null,
      tarefas_programacao: (entity as any).tarefas_programacao || [],

      // ✅ LOGGING: Verificar estrutura das tarefas na API
      _debug_entity_keys: Object.keys(entity || {}),
      _debug_tarefas_ids: entity.tarefas_ids,
      _debug_tarefas_programacao: (entity as any).tarefas_programacao,
      _debug_dados_origem: entity.dados_origem,

      // Campos computados (usando as propriedades que existem)
      created_at: (entity as any).created_at,
      updated_at: (entity as any).updated_at
    };
  }, [modalState.mode, modalState.entity, modalState.preselectedData]);

  return (
    <Layout>
      <Layout.Main>
        <div className="flex flex-col h-full w-full">
          {/* Header */}
          <TitleCard
            title="Programação de Ordens de Serviço"
            description="Gerencie e programe ordens de serviço com recursos detalhados"
          />
          
          {/* Dashboard de Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
            <div className="bg-card border rounded-sm p-4 hover:border-gray-400 dark:hover:border-gray-600 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2">Pendentes</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{stats.pendentes}</p>
                </div>
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0" />
              </div>
            </div>

            <div className="bg-card border rounded-sm p-4 hover:border-gray-400 dark:hover:border-gray-600 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2">Em Análise</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{stats.em_analise}</p>
                </div>
                <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-500 flex-shrink-0" />
              </div>
            </div>

            <div className="bg-card border rounded-sm p-4 hover:border-gray-400 dark:hover:border-gray-600 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2">Aprovadas</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{stats.aprovadas}</p>
                </div>
                <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-500 flex-shrink-0" />
              </div>
            </div>

            <div className="bg-card border rounded-sm p-4 hover:border-gray-400 dark:hover:border-gray-600 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2">Total</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{pagination.total}</p>
                </div>
                <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
              </div>
            </div>
          </div>
          
          {/* Filtros e Ação */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <BaseFilters 
                filters={filters}
                config={programacaoOSFilterConfig}
                onFilterChange={handleFilterChange}
              />
            </div>
            <button
              onClick={() => openModal('create')}
              className="btn-minimal-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Programação
            </button>
          </div>

          {/* Tabela */}
          <div className="flex-1 min-h-0">
            <BaseTable
              data={programacoes}
              columns={programacaoOSTableColumns}
              pagination={pagination}
              loading={loading}
              onPageChange={handlePageChange}
              customActions={tableActions.map((action: any) => ({
                key: action.label.toLowerCase().replace(/\s+/g, ''),
                label: action.label,
                handler: action.onClick,
                condition: action.condition,
                icon: action.icon ? <action.icon className="h-4 w-4" /> : undefined,
                variant: action.variant,
              }))}
              emptyMessage="Nenhuma programação de OS encontrada."
              emptyIcon={<FileText className="h-8 w-8 text-gray-400" />}
            />
          </div>
        </div>

        {/* Modal Principal com Cards */}
        <BaseModal
          isOpen={modalState.isOpen}
          mode={modalState.mode}
          entity={getModalEntity}
          title={getModalTitle}
          icon={<Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
          formFields={programacaoOSFormFields}
          groups={programacaoOSFormGroups}
          onClose={closeModal}
          onSubmit={handleSubmit}
          width="w-[1200px]"
          loading={loading}
        >
          {/* Botões de Ação no Modal */}
          {modalState.mode !== 'create' && modalState.entity && (
            <div className="border-t pt-4 mt-6">
              <div className="flex flex-wrap gap-2">
                {/* Analisar */}
                {modalState.entity.status === 'PENDENTE' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAnalisar(modalState.entity!)}
                    className="flex items-center gap-2"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Analisar
                  </Button>
                )}

                {/* Aprovar */}
                {modalState.entity.status === 'EM_ANALISE' && (
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() => handleAprovar(modalState.entity!)}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Aprovar
                  </Button>
                )}

                {/* Rejeitar */}
                {modalState.entity.status === 'EM_ANALISE' && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRejeitar(modalState.entity!)}
                    className="flex items-center gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Rejeitar
                  </Button>
                )}

                {/* Cancelar */}
                {!['CANCELADA', 'APROVADA'].includes(modalState.entity.status) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCancelar(modalState.entity!)}
                    className="flex items-center gap-2 border-orange-200 text-orange-700 hover:bg-orange-50"
                  >
                    <XCircle className="h-4 w-4" />
                    Cancelar
                  </Button>
                )}

                {/* Deletar */}
                {modalState.entity.status !== 'APROVADA' && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeletar(modalState.entity!)}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Deletar
                  </Button>
                )}

                {/* Ir para Execução - Aparece quando programação está aprovada */}
                {(() => {
                  console.log('🔍 DEBUG Botão Ir para Execução:', {
                    status: modalState.entity.status,
                    isAprovada: modalState.entity.status === 'APROVADA',
                    ordem_servico: modalState.entity.ordem_servico,
                    ordem_servico_id: modalState.entity.ordem_servico?.id,
                    shouldShowButton: modalState.entity.status === 'APROVADA' && modalState.entity.ordem_servico?.id
                  });

                  if (modalState.entity.status === 'APROVADA' && modalState.entity.ordem_servico?.id) {
                    return (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => navigate(`/execucao-os?execucaoId=${modalState.entity.ordem_servico.id}`)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                      >
                        <Play className="h-4 w-4" />
                        Ir para Execução
                      </Button>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          )}
        </BaseModal>

        {/* Modal para ações de workflow */}
        <WorkflowModal
          isOpen={showWorkflowModal}
          action={workflowAction}
          programacao={programacaoWorkflow}
          onClose={handleCloseWorkflowModal}
          onConfirm={handleConfirmWorkflowAction}
          loading={loading}
        />
      </Layout.Main>
    </Layout>
  );
}

export default ProgramacaoOSPage;