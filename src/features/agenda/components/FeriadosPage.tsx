// src/features/agenda/components/FeriadosPage.tsx
import { useEffect, useState, useMemo } from 'react';
import { Layout } from '@/components/common/Layout';
import { TitleCard } from '@/components/common/title-card';
import { BaseTable } from '@/components/common/base-table/BaseTable';
import { BaseFilters } from '@/components/common/base-filters/BaseFilters';
import { BaseModal } from '@/components/common/base-modal/BaseModal';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, RefreshCw, Filter } from 'lucide-react';
import { useGenericModal } from '@/hooks/useGenericModal';
import { toast } from '@/hooks/use-toast';
import { agendaService } from '@/services/agenda.services';
import {
  FeriadosFilters,
  FeriadoResponse,
  CreateFeriadoData,
  UpdateFeriadoData,
  QueryFeriadosParams
} from '../types';
import { feriadosTableColumns } from '../config/table-config';
import { usePlantas, createFeriadosFilterConfig } from '../config/filter-config';
import {
  feriadosFormFields,
  feriadosFormGroups,
  transformFeriadoFormData
} from '../config/form-config';

const initialFilters: FeriadosFilters = {
  search: '',
  tipo: 'all',
  plantaId: 'all',
  ano: 'all',
  mes: 'all',
  geral: 'all',
  recorrente: 'all',
  page: 1,
  limit: 10
};

export function FeriadosPage() {
  // Estados locais
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feriados, setFeriados] = useState<FeriadoResponse[]>([]);
  const [totalFeriados, setTotalFeriados] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FeriadosFilters>(initialFilters);

  // Hook para plantas
  const { plantas, loading: loadingPlantas, error: plantasError } = usePlantas();

  // Configuração dinâmica dos filtros
  const filterConfig = useMemo(() => {
    if (loadingPlantas || plantasError) {
      return [
        {
          key: 'search',
          type: 'search' as const,
          placeholder: 'Buscar por nome ou descrição...',
          className: 'lg:min-w-80'
        }
      ];
    }
    return createFeriadosFilterConfig(plantas);
  }, [plantas, loadingPlantas, plantasError]);

  // Modal state
  const {
    modalState,
    openModal,
    closeModal
  } = useGenericModal<FeriadoResponse>();

  // Buscar feriados da API
  const fetchFeriados = async (currentFilters: FeriadosFilters) => {
    try {
      setLoading(true);

      const params: QueryFeriadosParams = {
        page: currentFilters.page,
        limit: currentFilters.limit,
        search: currentFilters.search || undefined,
        tipo: currentFilters.tipo !== 'all' ? currentFilters.tipo as any : undefined,
        plantaId: currentFilters.plantaId !== 'all' ? currentFilters.plantaId : undefined,
        ano: currentFilters.ano !== 'all' ? parseInt(currentFilters.ano) : undefined,
        mes: currentFilters.mes !== 'all' ? parseInt(currentFilters.mes) : undefined,
        geral: currentFilters.geral !== 'all' ? currentFilters.geral === 'true' : undefined,
        recorrente: currentFilters.recorrente !== 'all' ? currentFilters.recorrente === 'true' : undefined,
        orderBy: 'data',
        orderDirection: 'desc'
      };

      console.log('🔍 [FERIADOS PAGE] Buscando feriados com filtros:', params);

      const response = await agendaService.getFeriados(params);

      setFeriados(response.data);
      setTotalFeriados(response.pagination.total);

      console.log('✅ [FERIADOS PAGE] Feriados carregados:', {
        total: response.pagination.total,
        count: response.data.length,
        page: response.pagination.page
      });

    } catch (error: any) {
      console.error('❌ [FERIADOS PAGE] Erro ao carregar feriados:', error);
      toast({
        title: "Erro ao carregar feriados",
        description: error.message || "Não foi possível carregar a lista de feriados.",
        variant: "destructive",
      });
      setFeriados([]);
      setTotalFeriados(0);
    } finally {
      setLoading(false);
    }
  };

  // Efeito inicial
  useEffect(() => {
    fetchFeriados(initialFilters);
  }, []);

  // Handler: Mudança de filtros
  const handleFilterChange = (newFilters: Partial<FeriadosFilters>) => {
    console.log('🔄 [FERIADOS PAGE] Filtros alterados:', newFilters);

    const updatedFilters = {
      ...filters,
      ...newFilters,
      page: newFilters.page || 1
    };

    setFilters(updatedFilters);
    fetchFeriados(updatedFilters);
  };

  // Handler: Mudança de página
  const handlePageChange = (newPage: number) => {
    console.log('📄 [FERIADOS PAGE] Mudança de página:', newPage);
    handleFilterChange({ page: newPage });
  };

  // Handler: Refresh manual
  const handleRefresh = () => {
    console.log('🔄 [FERIADOS PAGE] Refresh manual');
    fetchFeriados(filters);
  };

  // Handler: Buscar dados detalhados do feriado para modal
  const fetchFeriadoDetails = async (id: string): Promise<FeriadoResponse | null> => {
    try {
      return await agendaService.getFeriadoById(id);
    } catch (error: any) {
      console.error('❌ [FERIADOS PAGE] Erro ao buscar detalhes do feriado:', error);
      toast({
        title: "Erro ao carregar feriado",
        description: error.message || "Não foi possível carregar os detalhes do feriado.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Handler: Visualizar feriado
  const handleView = async (feriado: FeriadoResponse) => {
    console.log('👁️ [FERIADOS PAGE] Visualizando feriado:', feriado.id);
    const detailedFeriado = await fetchFeriadoDetails(feriado.id);
    if (detailedFeriado) {
      openModal('view', detailedFeriado);
    }
  };

  // Handler: Editar feriado
  const handleEdit = async (feriado: FeriadoResponse) => {
    console.log('✏️ [FERIADOS PAGE] Editando feriado:', feriado.id);
    const detailedFeriado = await fetchFeriadoDetails(feriado.id);
    if (detailedFeriado) {
      openModal('edit', detailedFeriado);
    }
  };

  // Handler: Submissão do formulário
  const handleSubmit = async (data: any) => {
    console.log('💾 [FERIADOS PAGE] Iniciando submissão:', data);
    setIsSubmitting(true);

    try {
      const transformedData = transformFeriadoFormData(data);

      if (modalState.mode === 'create') {
        const createData: CreateFeriadoData = transformedData;
        const novoFeriado = await agendaService.createFeriado(createData);

        toast({
          title: "Feriado cadastrado!",
          description: `O feriado "${novoFeriado.nome}" foi cadastrado com sucesso.`,
          variant: "default",
        });

      } else if (modalState.mode === 'edit' && modalState.entity) {
        const updateData: UpdateFeriadoData = transformedData;
        const feriadoAtualizado = await agendaService.updateFeriado(modalState.entity.id, updateData);

        toast({
          title: "Feriado atualizado!",
          description: `O feriado "${feriadoAtualizado.nome}" foi atualizado com sucesso.`,
          variant: "default",
        });
      }

      await fetchFeriados(filters);
      closeModal();

    } catch (error: any) {
      console.error('❌ [FERIADOS PAGE] Erro ao salvar feriado:', error);

      toast({
        title: modalState.mode === 'create' ? "Erro ao cadastrar feriado" : "Erro ao atualizar feriado",
        description: error.message || "Ocorreu um erro interno. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Preparar entidade para o modal
  const getModalEntity = () => {
    const entity = modalState.entity;

    if (modalState.mode === 'create') {
      return {
        id: '',
        geral: true,
        recorrente: false,
        plantaIds: []
      };
    }

    if (entity) {
      return {
        ...entity,
        plantaIds: entity.plantas?.map(p => p.id) || []
      };
    }

    return entity || {
      id: '',
      geral: true,
      recorrente: false,
      plantaIds: []
    };
  };

  // Calcular paginação
  const pagination = {
    page: filters.page || 1,
    limit: filters.limit || 10,
    total: totalFeriados,
    totalPages: Math.ceil(totalFeriados / (filters.limit || 10))
  };

  return (
    <Layout>
      <Layout.Main>
        <div className="flex flex-col h-full w-full">
          {/* Header */}
          <TitleCard
            title="Feriados"
            description="Gerencie os feriados e datas especiais do sistema"
          />

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
                Novo Feriado
              </Button>
            </div>
          </div>

          {/* Indicador de filtros ativos */}
          {Object.entries(filters).some(([key, value]) =>
            key !== 'page' && key !== 'limit' && value !== 'all' && value !== ''
          ) && (
            <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>Filtros aplicados</span>
            </div>
          )}

          {/* Status de carregamento das plantas */}
          {plantasError && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              ⚠️ Erro ao carregar plantas para o filtro: {plantasError}
            </div>
          )}

          {/* Tabela */}
          <div className="flex-1 min-h-0">
            <BaseTable
              data={feriados}
              columns={feriadosTableColumns}
              pagination={pagination}
              loading={loading}
              onPageChange={handlePageChange}
              onView={handleView}
              onEdit={handleEdit}
              emptyMessage="Nenhum feriado encontrado"
              emptyIcon={<Calendar className="h-8 w-8 text-muted-foreground/50" />}
            />
          </div>
        </div>

        {/* Modal integrado */}
        <BaseModal
          isOpen={modalState.isOpen}
          mode={modalState.mode}
          entity={getModalEntity()}
          title={
            modalState.mode === 'create' ? 'Novo Feriado' :
            modalState.mode === 'edit' ? 'Editar Feriado' : 'Visualizar Feriado'
          }
          icon={<Calendar className="h-5 w-5 text-blue-600" />}
          formFields={feriadosFormFields}
          groups={feriadosFormGroups}
          onClose={closeModal}
          onSubmit={handleSubmit}
          width="w-[600px]"
          loading={isSubmitting}
          loadingText={modalState.mode === 'create' ? "Cadastrando feriado..." : "Salvando alterações..."}
          closeOnBackdropClick={!isSubmitting}
          closeOnEscape={true}
          submitButtonText={modalState.mode === 'create' ? "Cadastrar Feriado" : "Salvar Alterações"}
        />
      </Layout.Main>
    </Layout>
  );
}