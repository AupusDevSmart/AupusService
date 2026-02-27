// src/features/agenda/components/ConfiguracoesDiasUteisPage.tsx
import { useEffect, useState, useMemo } from 'react';
import { Layout } from '@/components/common/Layout';
import { TitleCard } from '@/components/common/title-card';
import { BaseTable } from '@nexon/components/common/base-table/BaseTable';
import { BaseFilters } from '@nexon/components/common/base-filters/BaseFilters';
import { BaseModal } from '@nexon/components/common/base-modal/BaseModal';
import { Button } from '@/components/ui/button';
import { Plus, Clock, RefreshCw, Filter } from 'lucide-react';
import { useGenericModal } from '@/hooks/useGenericModal';
import { toast } from '@/hooks/use-toast';
import { agendaService } from '@/services/agenda.services';
import {
  ConfiguracoesDiasUteisFilters,
  ConfiguracaoDiasUteisResponse,
  CreateConfiguracaoDiasUteisData,
  UpdateConfiguracaoDiasUteisData,
  QueryConfiguracoesDiasUteisParams
} from '../types';
import { configuracoesDiasUteisTableColumns } from '../config/table-config';
import { usePlantas, createConfiguracoesDiasUteisFilterConfig } from '../config/filter-config';
import {
  configuracoesDiasUteisFormFields,
  configuracoesDiasUteisFormGroups,
  transformConfiguracaoDiasUteisFormData
} from '../config/form-config';

const initialFilters: ConfiguracoesDiasUteisFilters = {
  search: '',
  plantaId: 'all',
  geral: 'all',
  sabado: 'all',
  domingo: 'all',
  page: 1,
  limit: 10
};

export function ConfiguracoesDiasUteisPage() {
  // Estados locais
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [configuracoes, setConfiguracoes] = useState<ConfiguracaoDiasUteisResponse[]>([]);
  const [totalConfiguracoes, setTotalConfiguracoes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ConfiguracoesDiasUteisFilters>(initialFilters);

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
    return createConfiguracoesDiasUteisFilterConfig(plantas);
  }, [plantas, loadingPlantas, plantasError]);

  // Modal state
  const {
    modalState,
    openModal,
    closeModal
  } = useGenericModal<ConfiguracaoDiasUteisResponse>();

  // Buscar configurações da API
  const fetchConfiguracoes = async (currentFilters: ConfiguracoesDiasUteisFilters) => {
    try {
      setLoading(true);

      const params: QueryConfiguracoesDiasUteisParams = {
        page: currentFilters.page,
        limit: currentFilters.limit,
        search: currentFilters.search || undefined,
        plantaId: currentFilters.plantaId !== 'all' ? currentFilters.plantaId : undefined,
        geral: currentFilters.geral !== 'all' ? currentFilters.geral === 'true' : undefined,
        sabado: currentFilters.sabado !== 'all' ? currentFilters.sabado === 'true' : undefined,
        domingo: currentFilters.domingo !== 'all' ? currentFilters.domingo === 'true' : undefined,
        orderBy: 'nome',
        orderDirection: 'asc'
      };

      console.log('🔍 [CONFIGURAÇÕES DIAS ÚTEIS PAGE] Buscando configurações com filtros:', params);

      const response = await agendaService.getConfiguracoesDiasUteis(params);

      setConfiguracoes(response.data);
      setTotalConfiguracoes(response.pagination.total);

      console.log('✅ [CONFIGURAÇÕES DIAS ÚTEIS PAGE] Configurações carregadas:', {
        total: response.pagination.total,
        count: response.data.length,
        page: response.pagination.page
      });

    } catch (error: any) {
      console.error('❌ [CONFIGURAÇÕES DIAS ÚTEIS PAGE] Erro ao carregar configurações:', error);
      toast({
        title: "Erro ao carregar configurações",
        description: error.message || "Não foi possível carregar a lista de configurações.",
        variant: "destructive",
      });
      setConfiguracoes([]);
      setTotalConfiguracoes(0);
    } finally {
      setLoading(false);
    }
  };

  // Efeito inicial
  useEffect(() => {
    fetchConfiguracoes(initialFilters);
  }, []);

  // Handler: Mudança de filtros
  const handleFilterChange = (newFilters: Partial<ConfiguracoesDiasUteisFilters>) => {
    console.log('🔄 [CONFIGURAÇÕES DIAS ÚTEIS PAGE] Filtros alterados:', newFilters);

    const updatedFilters = {
      ...filters,
      ...newFilters,
      page: newFilters.page || 1
    };

    setFilters(updatedFilters);
    fetchConfiguracoes(updatedFilters);
  };

  // Handler: Mudança de página
  const handlePageChange = (newPage: number) => {
    console.log('📄 [CONFIGURAÇÕES DIAS ÚTEIS PAGE] Mudança de página:', newPage);
    handleFilterChange({ page: newPage });
  };

  // Handler: Refresh manual
  const handleRefresh = () => {
    console.log('🔄 [CONFIGURAÇÕES DIAS ÚTEIS PAGE] Refresh manual');
    fetchConfiguracoes(filters);
  };

  // Handler: Buscar dados detalhados da configuração para modal
  const fetchConfiguracaoDetails = async (id: string): Promise<ConfiguracaoDiasUteisResponse | null> => {
    try {
      return await agendaService.getConfiguracaoDiasUteisById(id);
    } catch (error: any) {
      console.error('❌ [CONFIGURAÇÕES DIAS ÚTEIS PAGE] Erro ao buscar detalhes da configuração:', error);
      toast({
        title: "Erro ao carregar configuração",
        description: error.message || "Não foi possível carregar os detalhes da configuração.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Handler: Visualizar configuração
  const handleView = async (configuracao: ConfiguracaoDiasUteisResponse) => {
    console.log('👁️ [CONFIGURAÇÕES DIAS ÚTEIS PAGE] Visualizando configuração:', configuracao.id);
    const detailedConfiguracao = await fetchConfiguracaoDetails(configuracao.id);
    if (detailedConfiguracao) {
      openModal('view', detailedConfiguracao);
    }
  };

  // Handler: Editar configuração
  const handleEdit = async (configuracao: ConfiguracaoDiasUteisResponse) => {
    console.log('✏️ [CONFIGURAÇÕES DIAS ÚTEIS PAGE] Editando configuração:', configuracao.id);
    const detailedConfiguracao = await fetchConfiguracaoDetails(configuracao.id);
    if (detailedConfiguracao) {
      openModal('edit', detailedConfiguracao);
    }
  };

  // Handler: Submissão do formulário
  const handleSubmit = async (data: any) => {
    console.log('💾 [CONFIGURAÇÕES DIAS ÚTEIS PAGE] Iniciando submissão:', data);
    setIsSubmitting(true);

    try {
      const transformedData = transformConfiguracaoDiasUteisFormData(data);

      if (modalState.mode === 'create') {
        const createData: CreateConfiguracaoDiasUteisData = transformedData;
        const novaConfiguracao = await agendaService.createConfiguracaoDiasUteis(createData);

        toast({
          title: "Configuração cadastrada!",
          description: `A configuração "${novaConfiguracao.nome}" foi cadastrada com sucesso.`,
          variant: "default",
        });

      } else if (modalState.mode === 'edit' && modalState.entity) {
        const updateData: UpdateConfiguracaoDiasUteisData = transformedData;
        const configuracaoAtualizada = await agendaService.updateConfiguracaoDiasUteis(modalState.entity.id, updateData);

        toast({
          title: "Configuração atualizada!",
          description: `A configuração "${configuracaoAtualizada.nome}" foi atualizada com sucesso.`,
          variant: "default",
        });
      }

      await fetchConfiguracoes(filters);
      closeModal();

    } catch (error: any) {
      console.error('❌ [CONFIGURAÇÕES DIAS ÚTEIS PAGE] Erro ao salvar configuração:', error);

      toast({
        title: modalState.mode === 'create' ? "Erro ao cadastrar configuração" : "Erro ao atualizar configuração",
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
        geral: false,
        diasSemana: {
          segunda: true,
          terca: true,
          quarta: true,
          quinta: true,
          sexta: true,
          sabado: false,
          domingo: false
        },
        plantaIds: []
      };
    }

    if (entity) {
      return {
        ...entity,
        diasSemana: {
          segunda: entity.segunda,
          terca: entity.terca,
          quarta: entity.quarta,
          quinta: entity.quinta,
          sexta: entity.sexta,
          sabado: entity.sabado,
          domingo: entity.domingo
        },
        plantaIds: entity.plantas?.map(p => p.id) || []
      };
    }

    return entity || {
      id: '',
      geral: false,
      diasSemana: {
        segunda: true,
        terca: true,
        quarta: true,
        quinta: true,
        sexta: true,
        sabado: false,
        domingo: false
      },
      plantaIds: []
    };
  };

  // Calcular paginação
  const pagination = {
    page: filters.page || 1,
    limit: filters.limit || 10,
    total: totalConfiguracoes,
    totalPages: Math.ceil(totalConfiguracoes / (filters.limit || 10))
  };

  return (
    <Layout>
      <Layout.Main>
        <div className="flex flex-col h-full w-full">
          {/* Header */}
          <TitleCard
            title="Configurações de Dias Úteis"
            description="Gerencie as configurações de dias úteis para as plantas"
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
                Nova Configuração
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
              data={configuracoes}
              columns={configuracoesDiasUteisTableColumns}
              pagination={pagination}
              loading={loading}
              onPageChange={handlePageChange}
              onView={handleView}
              onEdit={handleEdit}
              emptyMessage="Nenhuma configuração encontrada"
              emptyIcon={<Clock className="h-8 w-8 text-muted-foreground/50" />}
            />
          </div>
        </div>

        {/* Modal integrado */}
        <BaseModal
          isOpen={modalState.isOpen}
          mode={modalState.mode}
          entity={getModalEntity()}
          title={
            modalState.mode === 'create' ? 'Nova Configuração' :
            modalState.mode === 'edit' ? 'Editar Configuração' : 'Visualizar Configuração'
          }
          icon={<Clock className="h-5 w-5 text-purple-600" />}
          formFields={configuracoesDiasUteisFormFields}
          groups={configuracoesDiasUteisFormGroups}
          onClose={closeModal}
          onSubmit={handleSubmit}
          width="w-[700px]"
          loading={isSubmitting}
          loadingText={modalState.mode === 'create' ? "Cadastrando configuração..." : "Salvando alterações..."}
          closeOnBackdropClick={!isSubmitting}
          closeOnEscape={true}
          submitButtonText={modalState.mode === 'create' ? "Cadastrar Configuração" : "Salvar Alterações"}
        />
      </Layout.Main>
    </Layout>
  );
}