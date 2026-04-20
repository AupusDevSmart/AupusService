// src/features/reservas/components/ReservasPage.tsx
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Layout } from '@/components/common/Layout';
import { TitleCard } from '@/components/common/title-card';
import { BaseTable, CustomAction } from '@aupus/shared-pages';
import { BaseFilters } from '@aupus/shared-pages';
import { BaseModal } from '@aupus/shared-pages';
import { ReservaModal } from './ReservaModal';
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
  const fetchingRef = useRef(false);
  const initialLoadRef = useRef(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filters, setFilters] = useState<LocalReservasFilters>(initialFilters);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [reservaParaCancelar, setReservaParaCancelar] = useState<ReservaResponse | null>(null);
  const [motivoCancelamento, setMotivoCancelamento] = useState('');

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

  const { veiculos, loading: loadingVeiculos, error: veiculosError } = useVeiculos();

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

  const { modalState, openModal, closeModal } = useGenericModal<ReservaResponse>();

  const fetchReservasWithFilters = useCallback(async (filtersToUse: LocalReservasFilters) => {
    if (fetchingRef.current) return;

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

      await fetchReservas(params);

    } catch (error) {
      console.error('Erro ao buscar reservas:', error);
      toast({
        title: "Erro ao carregar reservas",
        description: "Não foi possível carregar as reservas. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      fetchingRef.current = false;
    }
  }, [fetchReservas, clearError]);

  useEffect(() => {
    if (!initialLoadRef.current) {
      initialLoadRef.current = true;
      fetchReservasWithFilters(initialFilters);
    }
  }, []);

  const handleFilterChange = useCallback((newFilters: Partial<LocalReservasFilters>) => {
    const updatedFilters = {
      ...filters,
      ...newFilters,
      page: newFilters.page !== undefined ? newFilters.page : 1
    };

    setFilters(updatedFilters);

    const timeoutId = setTimeout(() => {
      fetchReservasWithFilters(updatedFilters);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters, fetchReservasWithFilters]);

  const handlePageChange = useCallback((newPage: number) => {
    const updatedFilters = { ...filters, page: newPage };
    setFilters(updatedFilters);
    fetchReservasWithFilters(updatedFilters);
  }, [filters, fetchReservasWithFilters]);

  const handleRefresh = useCallback(() => {
    fetchReservasWithFilters(filters);
  }, [fetchReservasWithFilters, filters]);

  const handleSubmit = async (data: CreateReservaRequest) => {
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

      setTimeout(() => {
        fetchReservasWithFilters(filters);
      }, 500);

    } catch (error: any) {
      console.error('Erro ao salvar reserva:', error);

      toast({
        title: modalState.mode === 'create' ? "Erro ao criar reserva" : "Erro ao atualizar reserva",
        description: error.message || "Ocorreu um erro interno. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelarReserva = useCallback((reserva: ReservaResponse) => {
    setReservaParaCancelar(reserva);
    setMotivoCancelamento('');
    setCancelModalOpen(true);
  }, []);

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

  const handleFinalizarReserva = async (reserva: ReservaResponse) => {
    try {
      await updateStatus(reserva.id, 'finalizada');

      toast({
        title: "Reserva finalizada",
        description: "A reserva foi finalizada com sucesso.",
        variant: "default",
      });

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

  const pagination = {
    page: filters.page || 1,
    limit: filters.limit || 10,
    total: totalReservas,
    totalPages: Math.ceil(totalReservas / (filters.limit || 10))
  };

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
  ], []);

  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(([key, value]) =>
      key !== 'page' && key !== 'limit' && value !== 'all' && value !== ''
    );
  }, [filters]);

  return (
    <Layout>
      <Layout.Main>
        <div className="flex flex-col h-full w-full">
          <TitleCard
            title="Reservas de Veículos"
            description="Gerencie as reservas de viaturas da empresa"
          />

          {error && (
            <div className="mb-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <XCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                <strong className="text-sm sm:text-base">Erro ao carregar reservas:</strong>
              </div>
              <p className="text-red-700 mt-1 text-sm">{error}</p>
              <button
                onClick={handleRefresh}
                className="btn-minimal-outline mt-2 flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="text-xs sm:text-sm">Tentar novamente</span>
              </button>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex-1">
              <BaseFilters
                filters={filters}
                config={filterConfig}
                onFilterChange={handleFilterChange}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="btn-minimal flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="text-xs sm:text-sm">Atualizar</span>
              </button>

              <button
                onClick={() => openModal('create')}
                disabled={isSubmitting}
                className="btn-minimal-primary flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <Plus className="h-4 w-4" />
                <span className="text-xs sm:text-sm">Nova Reserva</span>
              </button>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center gap-2 mb-3 sm:mb-4 text-xs sm:text-sm text-muted-foreground">
              <Filter className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Filtros aplicados</span>
            </div>
          )}

          {veiculosError && (
            <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs sm:text-sm text-yellow-800">
              ⚠️ Erro ao carregar veículos para o filtro: {veiculosError}
            </div>
          )}

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

        <ReservaModal
          isOpen={modalState.isOpen}
          mode={modalState.mode as 'create' | 'edit' | 'view'}
          entity={getModalEntity() as any}
          onClose={closeModal}
          onSubmit={handleSubmit}
          veiculos={veiculos}
          reservas={reservas}
          reservaId={modalState.entity?.id}
          loading={isSubmitting}
        />

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
          width="w-full sm:w-[90vw] md:w-[500px] max-w-[500px]"
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
