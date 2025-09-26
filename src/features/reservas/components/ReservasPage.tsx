// src/features/reservas/components/ReservasPage.tsx
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Layout } from '@/components/common/Layout';
import { TitleCard } from '@/components/common/title-card';
import { BaseTable, CustomAction } from '@/components/common/base-table/BaseTable';
import { BaseFilters } from '@/components/common/base-filters/BaseFilters';
import { BaseModal } from '@/components/common/base-modal/BaseModal';
import { ReservaModal } from './ReservaModal';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, CheckCircle, XCircle, RefreshCw, Filter } from 'lucide-react';
import { useGenericModal } from '@/hooks/useGenericModal';
import { useReservas } from '../hooks/useReservas';
import { useVeiculos, createReservasFilterConfig } from '../config/filter-config';
import { toast } from '@/hooks/use-toast';
import {
  ReservaResponse,
  CreateReservaRequest,
  LocalReservasFilters
} from '../types';
import { reservasTableColumns } from '../config/table-config';

const initialFilters: LocalReservasFilters = {
  search: '',
  veiculoId: 'all',
  status: 'all',
  tipoSolicitante: 'all',
  responsavel: '',
  dataInicioFrom: '',
  dataInicioTo: '',
  dataFimFrom: '',
  dataFimTo: '',
  page: 1,
  limit: 10
};

export function ReservasPage() {
  // Ref para evitar loops infinitos
  const fetchingRef = useRef(false);
  const initialLoadRef = useRef(false);

  // Estados locais
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filters, setFilters] = useState<LocalReservasFilters>(initialFilters);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [reservaParaCancelar, setReservaParaCancelar] = useState<ReservaResponse | null>(null);
  const [motivoCancelamento, setMotivoCancelamento] = useState('');

  // Hooks da API
  const {
    reservas,
    totalReservas,
    loading,
    fetchReservas,
    createReserva,
    updateReserva,
    updateStatus,
    clearError,
    error
  } = useReservas({ autoFetch: false });

  // Hook para veículos (para filtros)
  const { veiculos, loading: loadingVeiculos, error: veiculosError } = useVeiculos();

  // Configuração dinâmica dos filtros
  const filterConfig = useMemo(() => {
    if (loadingVeiculos || veiculosError) {
      return [
        {
          key: 'search',
          type: 'search' as const,
          placeholder: 'Buscar por responsável, finalidade...',
          className: 'lg:min-w-80'
        }
      ];
    }
    return createReservasFilterConfig(veiculos);
  }, [veiculos, loadingVeiculos, veiculosError]);

  // Modal state
  const { modalState, openModal, closeModal } = useGenericModal<ReservaResponse>();

  // Função de busca otimizada
  const fetchReservasWithFilters = useCallback(async (filtersToUse: LocalReservasFilters) => {
    // Evitar múltiplas chamadas simultâneas
    if (fetchingRef.current) {
      console.log('🚫 [RESERVAS PAGE] Já está buscando, ignorando...');
      return;
    }

    console.log('🔍 [RESERVAS PAGE] Iniciando busca com filtros:', filtersToUse);
    fetchingRef.current = true;

    try {
      clearError();

      const params = {
        page: filtersToUse.page,
        limit: filtersToUse.limit,
        search: filtersToUse.search || undefined,
        veiculoId: filtersToUse.veiculoId !== 'all' ? Number(filtersToUse.veiculoId) : undefined,
        status: filtersToUse.status !== 'all' ? filtersToUse.status as any : undefined,
        tipoSolicitante: filtersToUse.tipoSolicitante !== 'all' ? filtersToUse.tipoSolicitante as any : undefined,
        responsavel: filtersToUse.responsavel || undefined,
        dataInicioFrom: filtersToUse.dataInicioFrom || undefined,
        dataInicioTo: filtersToUse.dataInicioTo || undefined,
        dataFimFrom: filtersToUse.dataFimFrom || undefined,
        dataFimTo: filtersToUse.dataFimTo || undefined,
        orderBy: 'dataInicio' as const,
        orderDirection: 'desc' as const
      };

      console.log('📡 [RESERVAS PAGE] Enviando params para API:', params);
      await fetchReservas(params);
      console.log('✅ [RESERVAS PAGE] Busca concluída com sucesso');

    } catch (error) {
      console.error('❌ [RESERVAS PAGE] Erro ao buscar reservas:', error);
      toast({
        title: "Erro ao carregar reservas",
        description: "Não foi possível carregar as reservas. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      fetchingRef.current = false;
    }
  }, [fetchReservas, clearError]);

  // Carregamento inicial - executar apenas uma vez
  useEffect(() => {
    if (!initialLoadRef.current) {
      console.log('🚀 [RESERVAS PAGE] Carregamento inicial');
      initialLoadRef.current = true;
      fetchReservasWithFilters(initialFilters);
    }
  }, []); // Dependências vazias propositalmente

  // Handler: Mudança de filtros - debounced
  const handleFilterChange = useCallback((newFilters: Partial<LocalReservasFilters>) => {
    console.log('🔄 [RESERVAS PAGE] Filtros alterados:', newFilters);

    const updatedFilters = {
      ...filters,
      ...newFilters,
      page: newFilters.page !== undefined ? newFilters.page : 1 // Reset página se não especificado
    };

    setFilters(updatedFilters);

    // Pequeno delay para evitar múltiplas chamadas
    const timeoutId = setTimeout(() => {
      fetchReservasWithFilters(updatedFilters);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters, fetchReservasWithFilters]);

  // Handler: Mudança de página
  const handlePageChange = useCallback((newPage: number) => {
    console.log('📄 [RESERVAS PAGE] Mudança de página:', newPage);
    const updatedFilters = { ...filters, page: newPage };
    setFilters(updatedFilters);
    fetchReservasWithFilters(updatedFilters);
  }, [filters, fetchReservasWithFilters]);

  // Handler: Refresh manual
  const handleRefresh = useCallback(() => {
    console.log('🔄 [RESERVAS PAGE] Refresh manual');
    fetchReservasWithFilters(filters);
  }, [fetchReservasWithFilters, filters]);

  // Handler: Submissão do formulário
  const handleSubmit = async (data: CreateReservaRequest) => {
    console.log('💾 [RESERVAS PAGE] Iniciando submissão:', data);
    setIsSubmitting(true);

    try {
      if (modalState.mode === 'create') {
        await createReserva(data);

        toast({
          title: "Reserva criada!",
          description: `A reserva de ${data.responsavel} foi criada com sucesso.`,
          variant: "default",
        });

      } else if (modalState.mode === 'edit' && modalState.entity) {
        await updateReserva(modalState.entity.id, data);

        toast({
          title: "Reserva atualizada!",
          description: `A reserva foi atualizada com sucesso.`,
          variant: "default",
        });
      }

      closeModal();
      
      // Atualizar lista após sucesso
      setTimeout(() => {
        fetchReservasWithFilters(filters);
      }, 500);

    } catch (error: any) {
      console.error('❌ [RESERVAS PAGE] Erro ao salvar reserva:', error);

      toast({
        title: modalState.mode === 'create' ? "Erro ao criar reserva" : "Erro ao atualizar reserva",
        description: error.message || "Ocorreu um erro interno. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Cancelar reserva
  const handleCancelarReserva = useCallback((reserva: ReservaResponse) => {
    setReservaParaCancelar(reserva);
    setMotivoCancelamento('');
    setCancelModalOpen(true);
  }, []);

  // Handler: Confirmar cancelamento
  const confirmarCancelamento = async () => {
    if (!reservaParaCancelar || !motivoCancelamento.trim()) return;

    try {
      await updateStatus(reservaParaCancelar.id, 'cancelada', motivoCancelamento);

      toast({
        title: "Reserva cancelada",
        description: "A reserva foi cancelada com sucesso.",
        variant: "default",
      });

      setCancelModalOpen(false);
      setReservaParaCancelar(null);
      setMotivoCancelamento('');

      // Atualizar lista
      setTimeout(() => {
        fetchReservasWithFilters(filters);
      }, 500);

    } catch (error: any) {
      console.error('Erro ao cancelar reserva:', error);

      toast({
        title: "Erro ao cancelar reserva",
        description: error.message || "Ocorreu um erro interno. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Handler: Finalizar reserva
  const handleFinalizarReserva = async (reserva: ReservaResponse) => {
    try {
      await updateStatus(reserva.id, 'finalizada');

      toast({
        title: "Reserva finalizada",
        description: "A reserva foi finalizada com sucesso.",
        variant: "default",
      });

      // Atualizar lista
      setTimeout(() => {
        fetchReservasWithFilters(filters);
      }, 500);

    } catch (error: any) {
      console.error('Erro ao finalizar reserva:', error);

      toast({
        title: "Erro ao finalizar reserva",
        description: error.message || "Ocorreu um erro interno. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Preparar entidade para o modal
  const getModalEntity = () => {
    const entity = modalState.entity;

    if (modalState.mode === 'create') {
      return {
        id: '',
        veiculoId: 0,
        tipoSolicitante: 'manual' as const,
        dataInicio: '',
        dataFim: '',
        horaInicio: '08:00',
        horaFim: '17:00',
        responsavel: '',
        finalidade: '',
        status: 'ativa' as const
      };
    }

    return entity || {};
  };

  // Calcular paginação
  const pagination = {
    page: filters.page || 1,
    limit: filters.limit || 10,
    total: totalReservas,
    totalPages: Math.ceil(totalReservas / (filters.limit || 10))
  };

  // Ações customizadas
  const customActions: CustomAction<ReservaResponse>[] = useMemo(() => [
    {
      key: 'finalizar',
      label: 'Finalizar',
      icon: <CheckCircle className="h-4 w-4" />,
      variant: 'default',
      condition: (reserva) => reserva.status === 'ativa',
      handler: (reserva) => handleFinalizarReserva(reserva)
    },
    {
      key: 'cancelar',
      label: 'Cancelar',
      icon: <XCircle className="h-4 w-4" />,
      variant: 'destructive',
      condition: (reserva) => reserva.status === 'ativa',
      handler: (reserva) => handleCancelarReserva(reserva)
    }
  ], [handleFinalizarReserva, handleCancelarReserva]);

  // Mostrar indicador se há filtros ativos
  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(([key, value]) =>
      key !== 'page' && key !== 'limit' && value !== 'all' && value !== ''
    );
  }, [filters]);

  // Debug info
  useEffect(() => {
    console.log('🐛 [RESERVAS PAGE] Estado atual:', {
      loading,
      error,
      reservasCount: reservas.length,
      totalReservas,
      filters,
      fetchingRef: fetchingRef.current
    });
  }, [loading, error, reservas.length, totalReservas, filters]);

  return (
    <Layout>
      <Layout.Main>
        <div className="flex flex-col h-full w-full">
          {/* Header */}
          <TitleCard
            title="Reservas de Veículos"
            description="Gerencie as reservas de viaturas da empresa"
          />

          {/* Erro de carregamento */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <XCircle className="h-5 w-5" />
                <strong>Erro ao carregar reservas:</strong>
              </div>
              <p className="text-red-700 mt-1">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="mt-2"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar novamente
              </Button>
            </div>
          )}

          {/* Filtros e Ações */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <BaseFilters
                filters={filters}
                config={filterConfig}
                onFilterChange={handleFilterChange}
              />
            </div>

            <div className="flex gap-2 shrink-0">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={loading}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>

              <Button
                onClick={() => openModal('create')}
                className="bg-primary hover:bg-primary/90"
                disabled={isSubmitting}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nova Reserva
              </Button>
            </div>
          </div>

          {/* Indicador de filtros ativos */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>Filtros aplicados</span>
            </div>
          )}

          {/* Status de carregamento dos veículos */}
          {veiculosError && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              ⚠️ Erro ao carregar veículos para o filtro: {veiculosError}
            </div>
          )}

          {/* Tabela */}
          <div className="flex-1 min-h-0">
            <BaseTable
              data={reservas}
              columns={reservasTableColumns}
              pagination={pagination}
              loading={loading}
              onPageChange={handlePageChange}
              onView={(r) => openModal('view', r)}
              onEdit={(r) => r.status === 'ativa' ? openModal('edit', r) : null}
              customActions={customActions}
              emptyMessage="Nenhuma reserva encontrada"
              emptyIcon={<Calendar className="h-8 w-8 text-muted-foreground/50" />}
            />
          </div>
        </div>

        {/* Modal integrado de reservas */}
        {/* @ts-ignore - Legacy component needs refactoring */}
        <ReservaModal
          {...{
            isOpen: modalState.isOpen,
            mode: modalState.mode,
            entity: getModalEntity(),
            onClose: closeModal,
            onSubmit: handleSubmit,
            veiculos: veiculos,
            reservas: reservas,
            reservaId: modalState.entity?.id,
            loading: isSubmitting
          } as any}
        />

        {/* Modal de cancelamento */}
        <BaseModal
          isOpen={cancelModalOpen}
          mode="edit"
          entity={{ id: "0", motivoCancelamento, createdAt: new Date().toISOString() }}
          title="Cancelar Reserva"
          icon={<XCircle className="h-5 w-5 text-red-600" />}
          formFields={[
            {
              key: 'motivoCancelamento',
              label: 'Motivo do Cancelamento',
              type: 'textarea',
              required: true,
              placeholder: 'Descreva o motivo do cancelamento...'
            }
          ]}
          onClose={() => {
            setCancelModalOpen(false);
            setReservaParaCancelar(null);
            setMotivoCancelamento('');
          }}
          onSubmit={async (data) => {
            setMotivoCancelamento(data.motivoCancelamento);
            await confirmarCancelamento();
          }}
          width="w-[500px]"
          loading={false}
          loadingText="Cancelando reserva..."
          closeOnBackdropClick={true}
          closeOnEscape={true}
          submitButtonText="Cancelar Reserva"
        />
      </Layout.Main>
    </Layout>
  );
}