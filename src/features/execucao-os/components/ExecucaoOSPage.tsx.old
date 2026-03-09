// src/features/execucao-os/components/ExecucaoOSPage.tsx - ATUALIZADA COM CARDS
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/common/Layout';
import { TitleCard } from '@/components/common/title-card';
import { BaseTable } from '@nexon/components/common/base-table/BaseTable';
import { BaseFilters } from '@nexon/components/common/base-filters/BaseFilters';
import { BaseModal } from '@nexon/components/common/base-modal/BaseModal';
import { Button } from '@/components/ui/button';
import {
  Play,
  Pause,
  CheckCircle,
  Eye,
  Edit,
  Calendar,
  Timer,
  AlertTriangle,
  Clock,
  FileText,
  Camera,
  Download,
  RefreshCw,
  X
} from 'lucide-react';
import { useGenericModal } from '@/hooks/useGenericModal';
import { ExecucaoOS, ExecucaoOSFilters } from '../types';
import type { ExecucaoOSApiResponse } from '@/services/execucao-os.service';
import { execucaoOSTableColumns } from '../config/table-config';
import { execucaoOSFilterConfig } from '../config/filter-config';
import { execucaoOSFormFields, execucaoOSFormGroups } from '../config/form-config';
import { useExecucaoOS } from '../hooks/useExecucaoOS';
import { transformApiArrayToExecucaoOS } from '../utils/transform-api-data';
import { execucaoOSTransitionsService, type StatusExecucaoOS } from '@/services/execucao-os-transitions.service';
import { useUserStore } from '@/store/useUserStore';
import { execucaoOSApi } from '@/services/execucao-os.service';
import { IniciarExecucaoModal } from './IniciarExecucaoModal';
import { FinalizarExecucaoModal } from './FinalizarExecucaoModal';

const initialFilters: ExecucaoOSFilters = {
  search: '',
  statusExecucao: 'all',
  tipo: 'all',
  prioridade: 'all',
  responsavel: 'all',
  dataExecucao: '',
  periodo: 'all',
  planta: 'all',
  page: 1,
  limit: 10
};

export function ExecucaoOSPage() {
  const { user } = useUserStore(); // Hook para obter usuário logado
  const [searchParams, setSearchParams] = useSearchParams(); // Para ler parâmetros da URL

  // Estados para dados da API
  const [execucoes, setExecucoes] = useState<ExecucaoOS[]>([]);
  const [filters, setFilters] = useState<ExecucaoOSFilters>(initialFilters);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [loading, setLoading] = useState(false);

  const {
    listarExecucoes,
    pausarExecucao,
    retomarExecucao,
    cancelarExecucao,
    loading: hookLoading
  } = useExecucaoOS();

  const {
    modalState,
    openModal,
    closeModal
  } = useGenericModal<ExecucaoOS>();

  // Estados para modais personalizados
  const [showIniciarModal, setShowIniciarModal] = useState(false);
  const [showFinalizarModal, setShowFinalizarModal] = useState(false);
  const [execucaoSelecionada, setExecucaoSelecionada] = useState<ExecucaoOS | null>(null);

  // Contadores para dashboard
  const [stats, setStats] = useState({
    total: 0,
    programadas: 0,
    emExecucao: 0,
    pausadas: 0,
    finalizadas: 0,
    atrasadas: 0,
    criticas: 0
  });

  // ✅ Carregar dados da API
  const carregarDados = async () => {
    try {
      setLoading(true);
      console.log('🔍 Carregando execuções com filtros:', filters);

      // Converter filtros do frontend para o formato da API
      const params: any = {
        page: filters.page,
        limit: filters.limit
      };

      if (filters.search) params.search = filters.search;
      if (filters.statusExecucao && filters.statusExecucao !== 'all') params.status_execucao = filters.statusExecucao;
      if (filters.tipo && filters.tipo !== 'all') params.tipo = filters.tipo;
      if (filters.prioridade && filters.prioridade !== 'all') params.prioridade = filters.prioridade;
      if (filters.responsavel && filters.responsavel !== 'all') params.responsavel_id = filters.responsavel;
      if (filters.planta && filters.planta !== 'all') params.planta_id = filters.planta;

      const response = await listarExecucoes(params);

      console.log('✅ Execuções carregadas (API):', response);

      // ✅ Transformar dados da API para o formato esperado pelo frontend
      const execucoesFormatadas = transformApiArrayToExecucaoOS(response.data || []);

      console.log('✅ Execuções formatadas (Frontend):', execucoesFormatadas);

      setExecucoes(execucoesFormatadas);
      setPagination({
        page: response.pagination?.page || 1,
        limit: response.pagination?.limit || 10,
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.pages || 0
      });

      // Calcular estatísticas dos dados retornados
      calcularEstatisticas(execucoesFormatadas);

    } catch (error) {
      console.error('❌ Erro ao carregar execuções:', error);
      setExecucoes([]);
      setPagination({ page: 1, limit: 10, total: 0, totalPages: 0 });
      setStats({
        total: 0,
        programadas: 0,
        emExecucao: 0,
        pausadas: 0,
        finalizadas: 0,
        atrasadas: 0,
        criticas: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // Calcular estatísticas dos dados
  const calcularEstatisticas = (dados: ExecucaoOS[]) => {
    const total = dados.length;
    const programadas = dados.filter(exec => exec.statusExecucao === 'PROGRAMADA').length;
    const emExecucao = dados.filter(exec => exec.statusExecucao === 'EM_EXECUCAO').length;
    const pausadas = dados.filter(exec => exec.statusExecucao === 'PAUSADA').length;
    const finalizadas = dados.filter(exec => exec.statusExecucao === 'FINALIZADA').length;
    const criticas = dados.filter(exec => exec.os?.prioridade === 'CRITICA' || exec.os?.prioridade === 'URGENTE').length;

    // Calcular OS atrasadas
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const atrasadas = dados.filter(exec => {
      if (exec.os?.dataProgramada && exec.statusExecucao === 'PROGRAMADA') {
        const dataProgramada = new Date(exec.os.dataProgramada);
        dataProgramada.setHours(0, 0, 0, 0);
        return dataProgramada < hoje;
      }
      return false;
    }).length;

    setStats({
      total,
      programadas,
      emExecucao,
      pausadas,
      finalizadas,
      atrasadas,
      criticas
    });
  };

  // Carregar dados ao montar o componente
  useEffect(() => {
    carregarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recarregar ao mudar filtros ou página
  useEffect(() => {
    carregarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Abrir modal automaticamente quando vier com execucaoId na URL
  useEffect(() => {
    const execucaoIdParam = searchParams.get('execucaoId');

    if (execucaoIdParam) {
      const abrirModalAutomatico = async () => {
        try {
          // Primeiro tentar buscar na lista carregada
          let execucaoEncontrada = execucoes.find(exec => exec.id === execucaoIdParam);

          // Se não encontrar na lista, buscar diretamente da API
          if (!execucaoEncontrada) {
            console.log('📌 Execução não está na lista atual. Buscando da API:', execucaoIdParam);

            const response = await execucaoOSApi.findOne(execucaoIdParam);

            if (response) {
              // Transformar os dados da API para o formato esperado
              const execucoesTransformadas = transformApiArrayToExecucaoOS([response]);
              execucaoEncontrada = execucoesTransformadas[0];
            }
          }

          if (execucaoEncontrada) {
            console.log('📌 Abrindo modal automaticamente para execução:', execucaoIdParam);
            handleView(execucaoEncontrada);
          }

          // Remover o parâmetro da URL após abrir o modal (ou tentar)
          setSearchParams({});
        } catch (error) {
          console.error('❌ Erro ao buscar execução para abrir modal:', error);
          setSearchParams({});
        }
      };

      // Só executar quando a lista já foi carregada ou após o primeiro load
      if (execucoes.length > 0 || loading === false) {
        abrirModalAutomatico();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [execucoes, searchParams, loading]);

  // Handlers de filtros e paginação
  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset page when filter changes
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({
      ...prev,
      page
    }));
  };

  const handleSuccess = async () => {
    await carregarDados();
    setLoading(false);
    closeModal();
  };

  const handleSubmit = async (data: any) => {
    if (!modalState.entity) return;

    try {
      console.log('💾 Salvando dados da execução:', data);

      if (modalState.mode === 'finalizar') {
        // Para finalização, estruturar dados conforme API espera
        const finalizacaoData = {
          data_hora_fim_real: new Date().toISOString(),
          resultado_servico: data.resultadoServico || '',
          problemas_encontrados: data.problemasEncontrados || '',
          recomendacoes: data.recomendacoes || '',
          proxima_manutencao: data.proximaManutencao || null,
          avaliacao_qualidade: Number(data.avaliacaoQualidade) || 5,
          observacoes_qualidade: data.observacoesQualidade || '',

          // Auto-fill usuário logado como finalizador
          finalizado_por_id: user?.id || undefined,

          // Materiais utilizados
          materiais_consumidos: (data.materiaisConsumidos || [])
            .filter((m: any) => {
              const qtd = m.quantidade_consumida || m.quantidade_planejada || 0;
              return qtd >= 0.001; // Filtrar apenas materiais com quantidade >= 0.001
            })
            .map((m: any) => {
              // Extrair ID string (pode estar em m.id, m.material_id, ou m.id.id)
              const materialId = typeof m.id === 'string' ? m.id :
                                (m.material_id || m.id?.id || '');
              return {
                id: materialId,
                quantidade_consumida: Math.max(0.001, m.quantidade_consumida || m.quantidade_planejada || 0.001),
                observacoes: m.observacoes || ''
              };
            }),

          // Ferramentas utilizadas
          ferramentas_utilizadas: (data.ferramentasUtilizadas || []).map((f: any) => {
            // Extrair ID string (pode estar em f.id, f.ferramenta_id, ou f.id.id)
            const ferramentaId = typeof f.id === 'string' ? f.id :
                                (f.ferramenta_id || f.id?.id || '');
            return {
              id: ferramentaId,
              condicao_depois: f.condicao_depois || 'Boa',
              observacoes: f.observacoes || ''
            };
          }),

          // ✅ Dados da reserva de veículo
          km_final: data.kmFinalReserva ? Number(data.kmFinalReserva) : undefined,
          observacoes_veiculo: data.observacoesFinalizacaoReserva || undefined
        };

        await execucaoOSTransitionsService.finalizar(String(modalState.entity.id), finalizacaoData);

      } else {
        // Para edição, usar atualizarProgresso
        console.warn('⚠️ Edição de execução não implementada - use os botões de ação específicos');
        alert('Use os botões de ação (Pausar, Retomar, Finalizar) para alterar o status da execução.');
        return;
      }

      await handleSuccess();
    } catch (error) {
      console.error('Erro ao salvar execução:', error);
      alert('Erro ao salvar. Tente novamente.');
    }
  };

  const getModalTitle = () => {
    const titles = {
      view: 'Visualizar Execução',
      edit: 'Editar Execução',
      finalizar: 'Finalizar Execução',
      anexos: 'Gerenciar Anexos'
    };
    return titles[modalState.mode as keyof typeof titles] || 'Execução de OS';
  };

  const getModalIcon = () => {
    const icons = {
      view: <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
      edit: <Edit className="h-5 w-5 text-orange-600 dark:text-orange-400" />,
      finalizar: <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />,
      anexos: <Camera className="h-5 w-5 text-purple-600 dark:text-purple-400" />
    };
    return icons[modalState.mode as keyof typeof icons] || <Timer className="h-5 w-5 text-orange-600 dark:text-orange-400" />;
  };

  // Helper para converter data ISO para formato datetime-local
  const formatDateTimeLocal = (isoDate: string | null | undefined): string => {
    if (!isoDate) return '';

    try {
      const date = new Date(isoDate);

      // Verificar se a data é válida
      if (isNaN(date.getTime())) return '';

      // Formato: yyyy-MM-ddThh:mm
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');

      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (error) {
      console.error('Erro ao formatar data:', isoDate, error);
      return '';
    }
  };

  const getModalEntity = () => {
    if (!modalState.entity) return null;

    const exec = modalState.entity;

    // ✅ Mapear TODOS os dados disponíveis da execução para o formulário
    const mapped = {
      // Identificação
      id: exec.id,
      numeroOS: exec.numeroOS || exec.numero_os || exec.os?.numeroOS || '',
      descricaoOS: exec.descricao || exec.os?.descricao || '',
      localAtivo: `${exec.local || exec.os?.local || ''} - ${exec.ativo || exec.os?.ativo || ''}`,
      tipoOS: exec.tipo || exec.os?.tipo || '',
      prioridadeOS: exec.prioridade || exec.os?.prioridade || '',

      // Origem da OS - passar programacao_id para o wrapper buscar os dados
      origemCard: {
        programacao_id: exec.programacao_id || exec.os?.programacao_id || '',
        programacaoOrigem: exec.programacao || exec.os?.programacao || null,
        _dadosCompletos: exec // Para debug
      },

      // Reserva de Veículo - agrupando dados para o ReservaVeiculoCard
      reservaCard: {
        veiculo: exec.reserva_veiculo?.veiculo?.placa || '',
        kmInicial: exec.reserva_veiculo?.km_inicial || '',
        dataInicioReserva: exec.reserva_veiculo?.data_inicio || '',
        horaInicioReserva: exec.reserva_veiculo?.hora_inicio || '',
        dataFimReserva: exec.reserva_veiculo?.data_fim || '',
        horaFimReserva: exec.reserva_veiculo?.hora_fim || '',
        finalidadeReserva: exec.reserva_veiculo?.finalidade || ''
      },

      // Dados de execução da reserva (editáveis)
      kmInicialReserva: exec.reserva_veiculo?.km_inicial || '',
      kmFinalReserva: exec.reserva_veiculo?.km_final || '',
      observacoesFinalizacaoReserva: exec.reserva_veiculo?.observacoes_finalizacao || '',

      // Status e execução
      statusExecucao: exec.statusExecucao || exec.status || exec.os?.status || 'PLANEJADA',
      dataHoraInicioReal: formatDateTimeLocal(
        exec.data_hora_inicio_real ||
        exec.dataHoraInicioReal ||
        exec.os?.dataHoraInicioReal ||
        exec.dataInicioReal
      ),
      dataHoraFimReal: formatDateTimeLocal(
        exec.data_hora_fim_real ||
        exec.dataHoraFimReal ||
        exec.os?.dataHoraFimReal ||
        exec.dataFimReal
      ),
      tempoTotalExecucao: exec.tempoTotalExecucao ||
                          exec.tempo_execucao_minutos ||
                          exec.os?.tempoTotalExecucao ||
                          '',

      // Equipe e responsável
      responsavelExecucao: exec.responsavelExecucao ||
                          exec.responsavel ||
                          exec.os?.responsavel ||
                          '',
      funcaoResponsavel: exec.time_equipe ||
                        exec.os?.time_equipe ||
                        '',
      tecnicos: exec.tecnicos ||
               exec.tecnicosPresentes ||
               exec.os?.tecnicos ||
               [],

      // Recursos utilizados
      materiaisConsumidos: exec.materiais ||
                          exec.materiaisConsumidos ||
                          exec.os?.materiais ||
                          [],
      ferramentasUtilizadas: exec.ferramentas ||
                            exec.ferramentasUtilizadas ||
                            exec.os?.ferramentas ||
                            [],
      custosAdicionais: exec.custo_real ||
                       exec.os?.custo_real ||
                       '',

      // Atividades e checklist
      atividadesRealizadas: exec.observacoes_execucao ||
                           exec.observacoesExecucao ||
                           exec.os?.observacoesExecucao ||
                           '',
      checklistConcluido: (
        exec.checklistAtividades ||
        exec.checklist_atividades ||
        exec.os?.checklistAtividades ||
        []
      ).filter((c: any) => c.concluida).length || '',
      procedimentosSeguidos: '',

      // Segurança (campos não mapeados na API - deixar vazios)
      equipamentosSeguranca: '',
      incidentesSeguranca: '',
      medidasSegurancaAdicionais: '',

      // Resultados da execução
      resultadoServico: exec.resultado_servico ||
                       exec.resultadoServico ||
                       exec.os?.resultadoServico ||
                       '',
      problemasEncontrados: exec.problemas_encontrados ||
                           exec.problemasEncontrados ||
                           exec.os?.problemasEncontrados ||
                           '',
      recomendacoes: exec.recomendacoes ||
                    exec.os?.recomendacoes ||
                    '',
      proximaManutencao: formatDateTimeLocal(
        exec.proxima_manutencao ||
        exec.proximaManutencao ||
        exec.os?.proximaManutencao
      ),

      // Qualidade
      avaliacaoQualidade: exec.avaliacao_qualidade ||
                         exec.avaliacaoQualidade ||
                         exec.os?.avaliacaoQualidade ||
                         '',
      observacoesQualidade: exec.observacoes_qualidade ||
                           exec.os?.observacoesQualidade ||
                           '',

      // Observações
      observacoesExecucao: exec.observacoes_execucao ||
                          exec.observacoesExecucao ||
                          exec.os?.observacoesExecucao ||
                          '',
      motivoPausas: '', // Não mapeado diretamente - seria necessário buscar do histórico
      motivoCancelamento: exec.motivo_cancelamento ||
                         exec.os?.motivoCancelamento ||
                         '',

      // Auditoria
      finalizadoPor: exec.finalizado_por ||
                    exec.os?.finalizadoPor ||
                    '',
      dataFinalizacao: formatDateTimeLocal(
        exec.data_hora_fim_real ||
        exec.dataFinalizacao ||
        exec.os?.dataFinalizacao
      ),
      aprovadoPor: exec.aprovado_por ||
                  exec.os?.aprovadoPor ||
                  '',
      dataAprovacao: formatDateTimeLocal(
        exec.data_aprovacao ||
        exec.dataAprovacao ||
        exec.os?.dataAprovacao
      ),

      // Dados completos para debug (opcional)
      _dadosCompletos: exec
    };

    console.log('✅ getModalEntity - Dados mapeados:', mapped);

    return mapped;
  };

  const handleView = (execucao: ExecucaoOS) => {
    console.log('Visualizar execução:', execucao);
    openModal('view', execucao);
  };

  const handleEdit = (execucao: ExecucaoOS) => {
    console.log('Editar execução:', execucao);

    // ✅ VALIDAÇÃO: Não permitir edição de execuções finalizadas ou canceladas
    if (execucao.statusExecucao === 'FINALIZADA' || execucao.statusExecucao === 'CANCELADA') {
      alert('Execuções finalizadas ou canceladas não podem ser editadas. Use o modo visualizar.');
      openModal('view', execucao);
      return;
    }

    openModal('edit', execucao);
  };

  // Ações de execução
  const handleIniciar = async (execucao: ExecucaoOS) => {
    console.log('Iniciando execução:', execucao.id);
    try {
      await retomarExecucao(String(execucao.id), {
        data_hora_retomada: new Date().toISOString(),
        observacoes_retomada: 'Execução iniciada'
      });
      await carregarDados();
    } catch (error) {
      console.error('Erro ao iniciar execução:', error);
      alert('Erro ao iniciar execução');
    }
  };

  const handlePausar = async (execucao: ExecucaoOS) => {
    console.log('Pausando execução:', execucao.id);
    try {
      const motivo = prompt('Motivo da pausa:');
      if (!motivo) return;

      await pausarExecucao(String(execucao.id), {
        data_hora_pausa: new Date().toISOString(),
        motivo_pausa: motivo,
        observacoes_pausa: motivo
      });
      await carregarDados();
    } catch (error) {
      console.error('Erro ao pausar execução:', error);
      alert('Erro ao pausar execução');
    }
  };

  const handleFinalizar = async (execucao: ExecucaoOS) => {
    console.log('Finalizando execução:', execucao.id);
    openModal('finalizar', execucao);
  };

  const handleCancelar = async (execucao: ExecucaoOS) => {
    console.log('Cancelando execução:', execucao.id);
    try {
      const motivo = prompt('Motivo do cancelamento:');
      if (!motivo) return;

      await cancelarExecucao(String(execucao.id), {
        data_hora_cancelamento: new Date().toISOString(),
        motivo_cancelamento: motivo,
        observacoes_cancelamento: motivo
      });
      await carregarDados();
    } catch (error) {
      console.error('Erro ao cancelar execução:', error);
      alert('Erro ao cancelar execução');
    }
  };

  const handleAnexos = (execucao: ExecucaoOS) => {
    console.log('Gerenciar anexos:', execucao.id);
    openModal('anexos', execucao);
  };

  const handleExportar = async () => {
    console.log('⚠️ Exportar execuções não implementado ainda');
    alert('Funcionalidade de exportação será implementada em breve');
  };

  const handleGerarRelatorio = async (execucao: ExecucaoOS) => {
    console.log('⚠️ Gerar relatório não implementado ainda:', execucao.id);
    alert('Funcionalidade de relatório será implementada em breve');
  };

  const handleAtualizar = async () => {
    console.log('Atualizando dados...');
    await carregarDados();
  };

  // ============================================================================
  // AÇÕES DE TRANSIÇÃO DE STATUS
  // ============================================================================

  /**
   * Determina quais ações estão disponíveis para o status atual da OS
   */
  const getAvailableActions = (status: string | undefined): string[] => {
    if (!status) return [];

    const statusMap: Record<string, string[]> = {
      'PLANEJADA': ['programar', 'cancelar'],
      'PROGRAMADA': ['iniciar', 'cancelar'],
      'EM_EXECUCAO': ['pausar', 'finalizar', 'cancelar'],
      'PAUSADA': ['retomar', 'finalizar', 'cancelar'],
      'FINALIZADA': [],
      'CANCELADA': []
    };

    return statusMap[status] || [];
  };

  /**
   * Handler para programar OS (PLANEJADA → PROGRAMADA)
   */
  const handleProgramarOS = async () => {
    if (!modalState.entity) return;

    try {
      // Função helper para validar IDs ULID (26 caracteres)
      const isValidULID = (id: string): boolean => {
        return typeof id === 'string' && id.length === 26;
      };

      // Extrair e validar IDs
      const materiais = (modalState.entity.materiais || modalState.entity.materiaisConsumidos || []);
      const ferramentas = (modalState.entity.ferramentas || modalState.entity.ferramentasUtilizadas || []);
      const tecnicos = (modalState.entity.tecnicos || modalState.entity.tecnicosPresentes || []);

      const materiaisIds = materiais
        .map((m: any) => m.id || m.material_id)
        .filter((id: any) => id && isValidULID(id));

      const ferramentasIds = ferramentas
        .map((f: any) => f.id || f.ferramenta_id)
        .filter((id: any) => id && isValidULID(id));

      const tecnicosIds = tecnicos
        .map((t: any) => t.id || t.tecnico_id)
        .filter((id: any) => id && isValidULID(id));

      console.log('📋 Programar OS - IDs validados:', {
        materiais: materiaisIds,
        ferramentas: ferramentasIds,
        tecnicos: tecnicosIds
      });

      const data = {
        data_hora_programada: new Date().toISOString(),
        responsavel: modalState.entity.responsavel || 'Não atribuído',
        materiais_confirmados: materiaisIds,
        ferramentas_confirmadas: ferramentasIds,
        tecnicos_confirmados: tecnicosIds,
      };

      await execucaoOSTransitionsService.programar(modalState.entity.id, data);
      await carregarDados();
      closeModal();
      alert('OS programada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao programar OS:', error);
      const errorMsg = error?.response?.data?.error?.message ||
                       error?.response?.data?.message ||
                       'Erro ao programar OS. Verifique os dados e tente novamente.';
      alert(errorMsg);
    }
  };

  /**
   * Handler para iniciar execução (PROGRAMADA → EM_EXECUCAO)
   */
  const handleIniciarExecucao = async () => {
    if (!modalState.entity) return;

    setExecucaoSelecionada(modalState.entity);
    setShowIniciarModal(true);
  };

  /**
   * Confirmar início de execução do modal
   */
  const confirmarInicioExecucao = async (data: any) => {
    if (!execucaoSelecionada) return;

    try {
      await execucaoOSTransitionsService.iniciar(execucaoSelecionada.id, data);
      setShowIniciarModal(false);
      setExecucaoSelecionada(null);
      await handleSuccess();
      alert('Execução iniciada com sucesso!');
    } catch (error) {
      console.error('Erro ao iniciar execução:', error);
      throw error; // Re-throw para o modal tratar
    }
  };

  /**
   * Handler para pausar execução (EM_EXECUCAO → PAUSADA)
   */
  const handlePausarExecucao = async () => {
    if (!modalState.entity) return;

    try {
      const motivo = prompt('Motivo da pausa:');
      if (!motivo) return;

      const data = {
        motivo_pausa: motivo,
        observacoes: ''
      };

      await execucaoOSTransitionsService.pausar(modalState.entity.id, data);
      await handleSuccess();
    } catch (error) {
      console.error('Erro ao pausar execução:', error);
      alert('Erro ao pausar execução. Tente novamente.');
    }
  };

  /**
   * Handler para retomar execução (PAUSADA → EM_EXECUCAO)
   */
  const handleRetomarExecucao = async () => {
    if (!modalState.entity) return;

    try {
      const observacoes = prompt('Observações da retomada (opcional):') || '';

      const data = {
        observacoes_retomada: observacoes
      };

      await execucaoOSTransitionsService.retomar(modalState.entity.id, data);
      await handleSuccess();
    } catch (error) {
      console.error('Erro ao retomar execução:', error);
      alert('Erro ao retomar execução. Tente novamente.');
    }
  };

  /**
   * Handler para finalizar OS (EM_EXECUCAO/PAUSADA → FINALIZADA)
   */
  const handleFinalizarOS = async () => {
    if (!modalState.entity) return;

    setExecucaoSelecionada(modalState.entity);
    setShowFinalizarModal(true);
  };

  /**
   * Confirmar finalização de execução do modal
   */
  const confirmarFinalizacaoExecucao = async (data: any) => {
    if (!execucaoSelecionada) return;

    try {
      await execucaoOSTransitionsService.finalizar(execucaoSelecionada.id, data);
      setShowFinalizarModal(false);
      setExecucaoSelecionada(null);
      await handleSuccess();
      alert('Execução finalizada com sucesso!');
    } catch (error) {
      console.error('Erro ao finalizar OS:', error);
      throw error; // Re-throw para o modal tratar
    }
  };

  /**
   * Handler para cancelar OS (QUALQUER → CANCELADA)
   */
  const handleCancelarOS = async () => {
    if (!modalState.entity) return;

    try {
      const motivo = prompt('Motivo do cancelamento:');
      if (!motivo) return;

      const confirmacao = confirm(`Tem certeza que deseja cancelar esta OS?\n\nMotivo: ${motivo}`);
      if (!confirmacao) return;

      const data = {
        motivo_cancelamento: motivo,
        observacoes: ''
      };

      await execucaoOSTransitionsService.cancelar(modalState.entity.id, data);
      await handleSuccess();
    } catch (error) {
      console.error('Erro ao cancelar OS:', error);
      alert('Erro ao cancelar OS. Tente novamente.');
    }
  };

  /**
   * Renderiza os botões de ação conforme o status atual da OS
   */
  const renderActionButtons = () => {
    if (!modalState.entity) return null;

    const status = modalState.entity.statusExecucao || modalState.entity.status;
    const availableActions = getAvailableActions(status);

    if (availableActions.length === 0) {
      return (
        <Button
          type="button"
          variant="outline"
          onClick={closeModal}
          className="w-full"
        >
          <X className="h-4 w-4 mr-2" />
          Fechar
        </Button>
      );
    }

    const actionButtons: Record<string, JSX.Element> = {
      programar: (
        <Button
          key="programar"
          onClick={handleProgramarOS}
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Calendar className="h-4 w-4 mr-2" />
          Programar OS
        </Button>
      ),
      iniciar: (
        <Button
          key="iniciar"
          onClick={handleIniciarExecucao}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
        >
          <Play className="h-4 w-4 mr-2" />
          Iniciar Execução
        </Button>
      ),
      pausar: (
        <Button
          key="pausar"
          onClick={handlePausarExecucao}
          disabled={loading}
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
        >
          <Pause className="h-4 w-4 mr-2" />
          Pausar Execução
        </Button>
      ),
      retomar: (
        <Button
          key="retomar"
          onClick={handleRetomarExecucao}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Play className="h-4 w-4 mr-2" />
          Retomar Execução
        </Button>
      ),
      finalizar: (
        <Button
          key="finalizar"
          onClick={handleFinalizarOS}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Finalizar OS
        </Button>
      ),
      cancelar: (
        <Button
          key="cancelar"
          onClick={handleCancelarOS}
          disabled={loading}
          variant="destructive"
          className="w-full"
        >
          <X className="h-4 w-4 mr-2" />
          Cancelar OS
        </Button>
      )
    };

    return (
      <>
        {availableActions.map(action => actionButtons[action])}
        <Button
          type="button"
          variant="outline"
          onClick={closeModal}
          disabled={loading}
          className="w-full"
        >
          <X className="h-4 w-4 mr-2" />
          Fechar
        </Button>
      </>
    );
  };

  return (
    <Layout>
      <Layout.Main>
        <div className="flex flex-col h-full w-full">
          {/* Header */}
          <TitleCard
            title="Execução de Ordens de Serviço"
            description="Acompanhe e gerencie a execução das ordens de serviço em campo com recursos detalhados"
          />
          
          {/* ✅ RESPONSIVO: Dashboard com grid progressivo */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7 gap-2 sm:gap-3 md:gap-4 mb-4 md:mb-6">
            {/* ✅ RESPONSIVO: Card Total */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 sm:p-3 md:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">Total</div>
                </div>
              </div>
            </div>

            {/* ✅ RESPONSIVO: Card Programadas */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 sm:p-3 md:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.programadas}</div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">Programadas</div>
                </div>
              </div>
            </div>

            {/* ✅ RESPONSIVO: Card Em Execução */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 sm:p-3 md:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <Play className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 dark:text-orange-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.emExecucao}</div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">Em Execução</div>
                </div>
              </div>
            </div>

            {/* ✅ RESPONSIVO: Card Pausadas */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 sm:p-3 md:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <Pause className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 dark:text-yellow-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.pausadas}</div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">Pausadas</div>
                </div>
              </div>
            </div>

            {/* ✅ RESPONSIVO: Card Finalizadas */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 sm:p-3 md:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.finalizadas}</div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">Finalizadas</div>
                </div>
              </div>
            </div>

            {/* ✅ RESPONSIVO: Card Atrasadas */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 sm:p-3 md:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.atrasadas}</div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">Atrasadas</div>
                </div>
              </div>
            </div>

            {/* ✅ RESPONSIVO: Card Críticas */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 sm:p-3 md:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.criticas}</div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">Críticas</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* ✅ RESPONSIVO: Filtros e Ações */}
          <div className="flex flex-col gap-3 md:gap-4 mb-4 md:mb-6">
            {/* Filtros */}
            <div className="flex-1 min-w-0">
              <BaseFilters
                filters={filters}
                config={execucaoOSFilterConfig}
                onFilterChange={handleFilterChange}
              />
            </div>

            {/* ✅ RESPONSIVO: Actions - empilhados em mobile, horizontal em desktop */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAtualizar}
                disabled={loading || hookLoading}
                className="w-full sm:w-auto justify-center sm:justify-start"
              >
                <RefreshCw className={`mr-2 h-4 w-4 shrink-0 ${(loading || hookLoading) ? 'animate-spin' : ''}`} />
                <span>Atualizar</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportar}
                className="w-full sm:w-auto justify-center sm:justify-start"
              >
                <Download className="mr-2 h-4 w-4 shrink-0" />
                <span>Relatório</span>
              </Button>
            </div>
          </div>

          {/* ✅ RESPONSIVO: Alertas importantes */}
          {(stats.atrasadas > 0 || stats.criticas > 0) && (
            <div className="mb-4 md:mb-6 space-y-2 sm:space-y-3">
              {stats.atrasadas > 0 && (
                <div className="p-3 sm:p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-sm sm:text-base text-red-900 dark:text-red-100">
                        {stats.atrasadas} OS em atraso
                      </h4>
                      <p className="text-xs sm:text-sm text-red-700 dark:text-red-300 mt-0.5">
                        Ordens de serviço que passaram da data programada.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {stats.criticas > 0 && (
                <div className="p-3 sm:p-4 bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-sm sm:text-base text-orange-900 dark:text-orange-100">
                        {stats.criticas} OS críticas
                      </h4>
                      <p className="text-xs sm:text-sm text-orange-700 dark:text-orange-300 mt-0.5">
                        Ordens de serviço com prioridade crítica requerem atenção imediata.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tabela */}
          <div className="flex-1 min-h-0">
            <BaseTable
              data={execucoes}
              columns={execucaoOSTableColumns}
              pagination={pagination}
              loading={loading || hookLoading}
              onPageChange={handlePageChange}
              onView={handleView}
              onEdit={handleEdit}
              emptyMessage="Nenhuma execução de OS encontrada."
              emptyIcon={<FileText className="h-8 w-8 text-gray-400" />}
            />
          </div>
        </div>

        {/* Modal com Cards */}
        {modalState.entity && (
          <BaseModal
            isOpen={modalState.isOpen}
            mode={modalState.mode}
            entity={getModalEntity()!}
            title={getModalTitle()}
            icon={getModalIcon()}
            formFields={execucaoOSFormFields}
            groups={execucaoOSFormGroups}
            onClose={closeModal}
            onSubmit={handleSubmit}
            width="w-[1200px]"
            loading={loading || hookLoading}
            customActions={renderActionButtons()}
          />
        )}

        {/* Modal Iniciar Execução */}
        {execucaoSelecionada && (
          <IniciarExecucaoModal
            open={showIniciarModal}
            onClose={() => {
              setShowIniciarModal(false);
              setExecucaoSelecionada(null);
            }}
            onConfirm={confirmarInicioExecucao}
            execucao={{
              numeroOS: execucaoSelecionada.numeroOS || execucaoSelecionada.numero_os || '',
              descricaoOS: execucaoSelecionada.descricao || '',
              tecnicos: execucaoSelecionada.tecnicos || []
            }}
          />
        )}

        {/* Modal Finalizar Execução */}
        {execucaoSelecionada && (
          <FinalizarExecucaoModal
            open={showFinalizarModal}
            onClose={() => {
              setShowFinalizarModal(false);
              setExecucaoSelecionada(null);
            }}
            onConfirm={confirmarFinalizacaoExecucao}
            execucao={{
              numeroOS: execucaoSelecionada.numeroOS || execucaoSelecionada.numero_os || '',
              descricaoOS: execucaoSelecionada.descricao || '',
              materiais: execucaoSelecionada.materiais || [],
              ferramentas: execucaoSelecionada.ferramentas || [],
              reserva_veiculo: execucaoSelecionada.reserva_veiculo
            }}
          />
        )}
      </Layout.Main>
    </Layout>
  );
}

export default ExecucaoOSPage;