// src/features/execucao-os/components/ExecucaoOSPage.tsx - REFATORADA
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/common/Layout';
import { TitleCard } from '@/components/common/title-card';
import { BaseTable } from '@nexon/components/common/base-table/BaseTable';
import { BaseFilters } from '@nexon/components/common/base-filters/BaseFilters';
import { BaseModal } from '@nexon/components/common/base-modal/BaseModal';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download, Eye } from 'lucide-react';
import { useGenericModal } from '@/hooks/useGenericModal';

// Hooks e configurações da feature
import { useExecucaoOSApi } from '../hooks/useExecucaoOSApi';
import { useExecucaoOSFilters } from '../hooks/useExecucaoOSFilters';
import { useExecucaoOSActions } from '../hooks/useExecucaoOSActions';
import { execucaoOSTableColumns } from '../config/table-config';
import { createExecucaoOSTableActions } from '../config/actions-config';

// Modais customizados
import { IniciarExecucaoModal } from './IniciarExecucaoModal';
import { FinalizarExecucaoModal } from './FinalizarExecucaoModal';
import { PausarExecucaoModal } from './PausarExecucaoModal';
import { CancelarExecucaoModal } from './CancelarExecucaoModal';

// Tipos
import type { ExecucaoOS, ExecucaoOSFilters } from '../types';
import { execucaoOSTransitionsService } from '@/services/execucao-os-transitions.service';
import { useUserStore } from '@/store/useUserStore';

// Dashboard Component
import { ExecucaoOSDashboard } from './ExecucaoOSDashboard';

// Filtros iniciais
const initialFilters: ExecucaoOSFilters = {
  search: '',
  statusExecucao: 'all',
  tipo: 'all',
  prioridade: 'all',
  page: 1,
  limit: 10,
};

export function ExecucaoOSPage() {
  const { user } = useUserStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<ExecucaoOSFilters>(initialFilters);

  // Estados para modais customizados
  const [showIniciarModal, setShowIniciarModal] = useState(false);
  const [showFinalizarModal, setShowFinalizarModal] = useState(false);
  const [showPausarModal, setShowPausarModal] = useState(false);
  const [showCancelarModal, setShowCancelarModal] = useState(false);
  const [execucaoSelecionada, setExecucaoSelecionada] = useState<ExecucaoOS | null>(null);

  // Hook de API
  const {
    items,
    loading,
    total,
    totalPages,
    currentPage,
    fetchItems,
    fetchOne,
    iniciar,
    pausar,
    retomar,
    finalizar,
    cancelar,
  } = useExecucaoOSApi();

  // Hook de filtros
  const { filterConfigs, formFields, formGroups, toApiParams } = useExecucaoOSFilters(filters);

  // Modal genérico
  const { modalState, openModal, closeModal } = useGenericModal<ExecucaoOS>();

  // Handlers para iniciar/finalizar com modais customizados
  const handleIniciarComModal = async (execucao: ExecucaoOS) => {
    setExecucaoSelecionada(execucao);
    setShowIniciarModal(true);
  };

  const handleFinalizarComModal = async (execucao: ExecucaoOS) => {
    setExecucaoSelecionada(execucao);
    setShowFinalizarModal(true);
  };

  const handlePausarExecucao = async (execucao: ExecucaoOS) => {
    setExecucaoSelecionada(execucao);
    setShowPausarModal(true);
  };

  const handleRetomarExecucao = async (execucao: ExecucaoOS) => {
    const observacoes = prompt('Observações sobre a retomada (opcional):') || '';

    try {
      await retomar(execucao.id, {
        observacoes_retomada: observacoes,
      });
      await fetchItems(toApiParams);
    } catch (error) {
      console.error('Erro ao retomar execução:', error);
      alert('Erro ao retomar execução. Tente novamente.');
    }
  };

  const handleCancelarExecucao = async (execucao: ExecucaoOS) => {
    setExecucaoSelecionada(execucao);
    setShowCancelarModal(true);
  };

  // Hook de ações
  const actionsHook = useExecucaoOSActions({
    openModal,
    onSuccess: async () => {
      await fetchItems(toApiParams);
    },
    onIniciar: handleIniciarComModal,
    onPausar: handlePausarExecucao,
    onRetomar: handleRetomarExecucao,
    onFinalizar: handleFinalizarComModal,
    onCancelar: handleCancelarExecucao,
  });

  // Ações da tabela (view/edit passados direto no BaseTable)
  const actions = createExecucaoOSTableActions({
    onIniciar: actionsHook.handleIniciar,
    onPausar: actionsHook.handlePausar,
    onRetomar: actionsHook.handleRetomar,
    onFinalizar: actionsHook.handleFinalizar,
    onCancelar: actionsHook.handleCancelar,
  });

  // Carregar dados ao montar e quando filtros mudarem
  useEffect(() => {
    fetchItems(toApiParams);
  }, [filters]);

  // Abrir modal automaticamente quando vier com execucaoId na URL
  useEffect(() => {
    const execucaoIdParam = searchParams.get('execucaoId');

    if (execucaoIdParam) {
      const abrirModalAutomatico = async () => {
        try {
          let execucaoEncontrada = items.find(exec => exec.id === execucaoIdParam);

          if (!execucaoEncontrada) {
            execucaoEncontrada = await fetchOne(execucaoIdParam);
          }

          if (execucaoEncontrada) {
            actionsHook.handleView(execucaoEncontrada);
          }

          setSearchParams({});
        } catch (error) {
          console.error('Erro ao buscar execução para abrir modal:', error);
          setSearchParams({});
        }
      };

      if (items.length > 0 || loading === false) {
        abrirModalAutomatico();
      }
    }
  }, [items, searchParams, loading]);

  // Handlers
  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleSubmit = async (data: any) => {
    if (!modalState.entity) return;

    try {
      if (modalState.mode === 'finalizar') {
        const finalizacaoData = {
          data_hora_fim_real: new Date().toISOString(),
          resultado_servico: data.resultadoServico || '',
          problemas_encontrados: data.problemasEncontrados || '',
          recomendacoes: data.recomendacoes || '',
          proxima_manutencao: data.proximaManutencao || null,
          avaliacao_qualidade: Number(data.avaliacaoQualidade) || 5,
          observacoes_qualidade: data.observacoesQualidade || '',
          finalizado_por_id: user?.id || undefined,
        };

        await execucaoOSTransitionsService.finalizar(String(modalState.entity.id), finalizacaoData);
      }

      await fetchItems(toApiParams);
      closeModal();
    } catch (error) {
      console.error('Erro ao salvar execução:', error);
      alert('Erro ao salvar. Tente novamente.');
    }
  };

  const confirmarInicioExecucao = async (data: any) => {
    if (!execucaoSelecionada) return;

    try {
      await execucaoOSTransitionsService.iniciar(execucaoSelecionada.id, data);
      setShowIniciarModal(false);
      setExecucaoSelecionada(null);
      await fetchItems(toApiParams);
      alert('Execução iniciada com sucesso!');
    } catch (error) {
      console.error('Erro ao iniciar execução:', error);
      throw error;
    }
  };

  const confirmarFinalizacaoExecucao = async (data: any) => {
    if (!execucaoSelecionada) return;

    try {
      await execucaoOSTransitionsService.finalizar(execucaoSelecionada.id, data);
      setShowFinalizarModal(false);
      setExecucaoSelecionada(null);
      await fetchItems(toApiParams);
      alert('Execução finalizada com sucesso!');
    } catch (error) {
      console.error('Erro ao finalizar OS:', error);
      throw error;
    }
  };

  const confirmarPausaExecucao = async (data: any) => {
    if (!execucaoSelecionada) return;

    try {
      // Backend espera apenas: motivo_pausa e observacoes (opcional)
      await pausar(execucaoSelecionada.id, {
        motivo_pausa: data.motivo_pausa,
        observacoes: data.observacoes,
      });

      setShowPausarModal(false);
      setExecucaoSelecionada(null);
      await fetchItems(toApiParams);
    } catch (error) {
      console.error('Erro ao pausar execução:', error);
      throw error;
    }
  };

  const confirmarCancelamentoExecucao = async (data: any) => {
    if (!execucaoSelecionada) return;

    try {
      // Backend espera apenas: motivo_cancelamento e observacoes (opcional)
      await cancelar(execucaoSelecionada.id, {
        motivo_cancelamento: data.motivo_cancelamento,
        observacoes: data.observacoes,
      });

      setShowCancelarModal(false);
      setExecucaoSelecionada(null);
      await fetchItems(toApiParams);
    } catch (error) {
      console.error('Erro ao cancelar execução:', error);
      throw error;
    }
  };

  const getModalEntity = () => {
    if (!modalState.entity) return null;
    // O transformer já faz todo o mapeamento necessário
    return modalState.entity;
  };

  // Handlers para filtros do dashboard
  const handleFilterAtrasadas = () => {
    setFilters(prev => ({
      ...prev,
      atrasadas: true,
      page: 1,
    }));
  };

  const handleFilterCriticas = () => {
    setFilters(prev => ({
      ...prev,
      prioridade: 'CRITICA',
      page: 1,
    }));
  };

  return (
    <Layout>
      <Layout.Main>
        <div className="flex flex-col h-full w-full space-y-4">
          {/* Header */}
          <TitleCard
            title="Execução de Ordens de Serviço"
            description="Acompanhe e gerencie a execução das ordens de serviço em campo"
          />

          {/* Dashboard */}
          <ExecucaoOSDashboard
            items={items}
            loading={loading}
            onFilterAtrasadas={handleFilterAtrasadas}
            onFilterCriticas={handleFilterCriticas}
          />

          {/* Filtros e Ações */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex-1 w-full">
              <BaseFilters
                filters={filters}
                config={filterConfigs}
                onFilterChange={handleFilterChange}
              />
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchItems(toApiParams)}
                disabled={loading}
                className="flex-1 sm:flex-none"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => alert('Funcionalidade em breve')}
                className="flex-1 sm:flex-none"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>

          {/* Tabela */}
          <div className="flex-1 min-h-0">
            <BaseTable
              data={items}
              columns={execucaoOSTableColumns}
              customActions={actions.map((action: any) => ({
                key: action.label.toLowerCase().replace(' ', ''),
                label: action.label,
                handler: action.onClick,
                condition: action.condition,
                icon: action.icon ? <action.icon className="h-4 w-4" /> : undefined,
                variant: action.variant,
              }))}
              loading={loading}
              pagination={{
                currentPage,
                totalPages,
                total,
                pageSize: filters.limit || 10,
                onPageChange: handlePageChange,
              }}
              onView={actionsHook.handleView}
              onEdit={actionsHook.handleEdit}
              emptyMessage="Nenhuma execução de OS encontrada."
              emptyIcon={<Eye className="h-12 w-12 text-gray-400" />}
            />
          </div>
        </div>

        {/* Modal Genérico */}
        {modalState.entity && (
          <BaseModal
            isOpen={modalState.isOpen}
            mode={modalState.mode}
            entity={getModalEntity()!}
            title={`${modalState.mode === 'view' ? 'Visualizar' : modalState.mode === 'edit' ? 'Editar' : 'Finalizar'} Execução`}
            formFields={formFields}
            groups={formGroups}
            onClose={closeModal}
            onSubmit={handleSubmit}
            width="w-[1200px]"
            loading={loading}
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
              tecnicos: execucaoSelecionada.tecnicos || [],
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
              reserva_veiculo: execucaoSelecionada.reserva_veiculo,
            }}
          />
        )}

        {/* Modal Pausar Execução */}
        {execucaoSelecionada && (
          <PausarExecucaoModal
            open={showPausarModal}
            onClose={() => {
              setShowPausarModal(false);
              setExecucaoSelecionada(null);
            }}
            onConfirm={confirmarPausaExecucao}
            execucao={{
              numeroOS: execucaoSelecionada.numeroOS || execucaoSelecionada.numero_os || '',
              descricaoOS: execucaoSelecionada.descricao || '',
            }}
          />
        )}

        {/* Modal Cancelar Execução */}
        {execucaoSelecionada && (
          <CancelarExecucaoModal
            open={showCancelarModal}
            onClose={() => {
              setShowCancelarModal(false);
              setExecucaoSelecionada(null);
            }}
            onConfirm={confirmarCancelamentoExecucao}
            execucao={{
              numeroOS: execucaoSelecionada.numeroOS || execucaoSelecionada.numero_os || '',
              descricaoOS: execucaoSelecionada.descricao || '',
              statusExecucao: execucaoSelecionada.statusExecucao || execucaoSelecionada.status,
            }}
          />
        )}
      </Layout.Main>
    </Layout>
  );
}

export default ExecucaoOSPage;
