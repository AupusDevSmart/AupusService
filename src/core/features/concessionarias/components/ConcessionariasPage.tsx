// src/features/concessionarias/components/ConcessionariasPage.tsx
import { useEffect, useState } from 'react';
import { useLinhasPorPagina, LINHAS_POR_PAGINA_PADRAO } from '@/store/usePreferenciasDeTabela';
import { Layout } from '@/core/components/common/Layout';
import { TitleCard } from '@/core/components/common/title-card';
import { BaseTable } from '@/core/components/common/base-table/BaseTable';
import { BaseFilters } from '@/core/components/common/base-filters/BaseFilters';
import { BaseModal } from '@/core/components/common/base-modal/BaseModal';
import { Plus, Zap, RefreshCw, Filter } from 'lucide-react';
import { useGenericModal } from '@/core/hooks/useGenericModal';
import { toast } from '@/core/hooks/use-toast';
import { isAxiosError } from 'axios';
import { ehAnexoTemporario, type ConcessionariasFilters } from '../types';
import type { ConcessionariaResponse } from '@/services/concessionarias.services';
import { doFormulario, paraApi, type ConcessionariaDoFormulario } from '@/core/features/concessionarias/utils/formulario';
import { concessionariasTableColumns } from '../config/table-config';
import { useConcessionariasFilters } from '../hooks/useConcessionariasFilters';
import { concessionariasFormFields } from '../config/form-config';
import { useUserStore, useConcessionariasFeature, useHttpClient } from '@/core/context/hooks';
import { PlanilhaDoCadastro } from '@/components/common/PlanilhaDoCadastro';
import { exportarConcessionarias, lerConcessionarias } from '../utils/planilha';

const initialFilters: ConcessionariasFilters = {
  search: '',
  estado: 'all',
  page: 1,
  limit: LINHAS_POR_PAGINA_PADRAO
};

export function ConcessionariasPage() {
  const { hasPermission } = useUserStore();
  const podeGerenciar = hasPermission('concessionarias.manage');
  const concessionariasFeature = useConcessionariasFeature();
  const httpClient = useHttpClient();

  // Estados locais
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [concessionarias, setConcessionarias] = useState<ConcessionariaResponse[]>([]);
  const [totalConcessionarias, setTotalConcessionarias] = useState(0);
  const [loading, setLoading] = useState(true);
  const [linhasPorPagina, setLinhasPorPagina] = useLinhasPorPagina('concessionarias');
  const [filters, setFilters] = useState<ConcessionariasFilters>(() => ({
    ...initialFilters,
    limit: linhasPorPagina,
  }));

  // Configuração de filtros dinâmicos com estados do IBGE
  const { filterConfig } = useConcessionariasFilters();

  // Modal state
  const {
    modalState,
    openModal,
    closeModal
  } = useGenericModal<ConcessionariaResponse>();

  // ✅ FUNÇÃO: Buscar concessionárias da API
  const fetchConcessionarias = async (currentFilters: ConcessionariasFilters) => {
    try {
      setLoading(true);

      const params = {
        page: currentFilters.page,
        limit: currentFilters.limit,
        search: currentFilters.search || undefined,
        estado: currentFilters.estado !== 'all' ? currentFilters.estado : undefined,
        orderBy: 'nome',
        orderDirection: 'asc'
      };


      await concessionariasFeature.fetchConcessionarias(params);

      // Nao copiar o estado do hook aqui: `concessionariasFeature` e o valor
      // capturado NESTE render, e depois do await ele ainda tem a lista
      // anterior. Copiar dali pintava a tela com a pagina velha enquanto a
      // paginacao ja marcava a nova — exatamente a sensacao de "mudei de
      // pagina e vieram os mesmos registros". O efeito de sincronia abaixo faz
      // a copia no render seguinte, quando o hook ja tem os dados novos.

    } catch (error) {
      console.error('❌ [CONCESSIONARIAS PAGE] Erro ao carregar concessionárias:', error);
      toast({
        title: "Erro ao carregar concessionárias",
        description: (error instanceof Error && error.message) || "Não foi possível carregar a lista de concessionárias.",
        variant: "destructive",
      });
      setConcessionarias([]);
      setTotalConcessionarias(0);
    } finally {
      setLoading(false);
    }
  };

  // Sync hook state to local state
  useEffect(() => {
    setConcessionarias(concessionariasFeature.concessionarias);
    setTotalConcessionarias(concessionariasFeature.pagination?.total || 0);
    setLoading(concessionariasFeature.loading);
  }, [concessionariasFeature.concessionarias, concessionariasFeature.pagination?.total || 0, concessionariasFeature.loading]);

  // ✅ EFEITO: Carregar concessionárias quando a página carrega
  useEffect(() => {
    // O estado inicial, e nao initialFilters: e ele que carrega o numero de
    // linhas que o usuario escolheu.
    fetchConcessionarias(filters);
  }, []);

  // ✅ HANDLER: Mudança de filtros
  const handleFilterChange = (newFilters: Partial<ConcessionariasFilters>) => {

    const updatedFilters = {
      ...filters,
      ...newFilters,
      page: newFilters.page || 1
    };

    setFilters(updatedFilters);
    fetchConcessionarias(updatedFilters);
  };

  // ✅ HANDLER: Mudança de página
  // Volta para a pagina 1: na pagina 4 de 10 linhas, trocar para 100 pediria
  // um trecho que nao existe.
  const handleLimitChange = (limit: number) => {
    setLinhasPorPagina(limit);
    handleFilterChange({ limit, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    handleFilterChange({ page: newPage });
  };

  // ✅ HANDLER: Refresh manual
  const handleRefresh = () => {
    fetchConcessionarias(filters);
  };

  // ✅ HANDLER: Buscar dados detalhados da concessionária para modal
  const fetchConcessionariaDetails = async (id: string): Promise<ConcessionariaResponse | null> => {
    try {
      return await concessionariasFeature.getConcessionaria(id);
    } catch (error) {
      console.error('❌ [CONCESSIONARIAS PAGE] Erro ao buscar detalhes da concessionária:', error);
      toast({
        title: "Erro ao carregar concessionária",
        description: (error instanceof Error && error.message) || "Não foi possível carregar os detalhes da concessionária.",
        variant: "destructive",
      });
      return null;
    }
  };

  // ✅ HANDLER: Visualizar concessionária (abertura otimista)
  const handleView = async (concessionaria: ConcessionariaResponse) => {

    // Abrir modal IMEDIATAMENTE com dados básicos
    openModal('view', concessionaria);

    // Carregar detalhes em background
    try {
      const detailedConcessionaria = await fetchConcessionariaDetails(concessionaria.id);
      if (detailedConcessionaria) {
        openModal('view', detailedConcessionaria);
      }
    } catch (error) {
      closeModal();
    }
  };

  // ✅ HANDLER: Editar concessionária (abertura otimista)
  const handleEdit = async (concessionaria: ConcessionariaResponse) => {

    // Abrir modal IMEDIATAMENTE com dados básicos
    openModal('edit', concessionaria);

    // Carregar detalhes em background
    try {
      const detailedConcessionaria = await fetchConcessionariaDetails(concessionaria.id);
      if (detailedConcessionaria) {
        openModal('edit', detailedConcessionaria);
      }
    } catch (error) {
      closeModal();
    }
  };

  // ✅ HANDLER: Submissão do formulário (Create e Update)
  const handleSubmit = async (data: ConcessionariaDoFormulario) => {
    setIsSubmitting(true);

    try {
      const transformedData = paraApi(data);

      if (modalState.mode === 'create') {
        // 1. Criar a concessionária
        const novaConcessionaria = await concessionariasFeature.createConcessionaria(transformedData);

        // 2. Os arquivos escolhidos antes de a concessionária existir. Antes nada
        // os enviava: a tela dizia "será enviado ao salvar" e o arquivo sumia.
        const pendentes = (data.anexos ?? []).filter(ehAnexoTemporario);
        const naoSubiram: string[] = [];
        for (const anexo of pendentes) {
          const form = new FormData();
          form.append('file', anexo.file);
          try {
            await httpClient.post(`/concessionarias/${String(novaConcessionaria.id).trim()}/anexos`, form, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
          } catch (erro) {
            console.error('Erro ao enviar anexo da concessionária:', erro);
            naoSubiram.push(anexo.nome_original);
          }
        }

        toast({
          title: "Concessionária cadastrada!",
          description: `A concessionária "${novaConcessionaria.nome}" foi cadastrada com sucesso.`,
          variant: "default",
        });
        if (naoSubiram.length > 0) {
          toast({
            title: "Alguns anexos não foram enviados",
            description: `Abra a concessionária e anexe de novo: ${naoSubiram.join(', ')}.`,
            variant: "destructive",
          });
        }

      } else if (modalState.mode === 'edit') {
        // Usar o ID da entidade original ou do data se disponível
        const idToUpdate = modalState.entity?.id || data.id;


        if (!idToUpdate) {
          throw new Error('ID da concessionária não encontrado para atualização');
        }

        const concessionariaAtualizada = await concessionariasFeature.updateConcessionaria(
          idToUpdate,
          transformedData
        );


        toast({
          title: "Concessionária atualizada!",
          description: `A concessionária "${concessionariaAtualizada.nome}" foi atualizada com sucesso.`,
          variant: "default",
        });
      }

      await fetchConcessionarias(filters);
      closeModal();

    } catch (error) {
      console.error('❌ [CONCESSIONARIAS PAGE] Erro ao salvar concessionária:', error);
      console.error('❌ [CONCESSIONARIAS PAGE] Error details:', (isAxiosError(error) && error.response?.data) || error);

      toast({
        title: modalState.mode === 'create' ? "Erro ao cadastrar concessionária" : "Erro ao atualizar concessionária",
        description: (error instanceof Error && error.message) || "Ocorreu um erro interno. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ HANDLERS: Modal
  const getModalTitle = () => {
    const titles = {
      create: 'Nova Concessionária',
      edit: 'Editar Concessionária',
      view: 'Visualizar Concessionária'
    };
    return titles[modalState.mode as keyof typeof titles] || 'Concessionária';
  };

  const getModalIcon = () => {
    return <Zap className="h-5 w-5 text-yellow-600" />;
  };

  const getModalEntity = () => {
    if (modalState.mode === 'create') {
      return null;
    }

    // Transformar dados da API para formato do formulário
    return modalState.entity ? doFormulario(modalState.entity) : null;
  };

  // ✅ CALCULAR PAGINAÇÃO
  const pagination = {
    page: filters.page || 1,
    limit: filters.limit || LINHAS_POR_PAGINA_PADRAO,
    total: totalConcessionarias,
    totalPages: Math.ceil(totalConcessionarias / (filters.limit || LINHAS_POR_PAGINA_PADRAO))
  };

  return (
    <Layout>
      <Layout.Main>
        <div className="flex flex-col h-full w-full">
          <TitleCard
            title="Concessionárias"
            description="Gerencie as concessionárias de energia e suas tarifas"
          />

          {/* Filtros e Ações */}
          <div className="flex flex-col gap-3 mb-4">
            {/* Linha 1: Busca por Nome */}
            <div className="flex-1">
              <BaseFilters
                filters={filters}
                config={[filterConfig[0]]} // Campo de busca
                onFilterChange={handleFilterChange}
              />
            </div>

            {/* Linha 2: Select de Estado + Botões */}
            <div className="flex flex-col sm:flex-row sm:gap-1.5 gap-2 w-full items-start sm:items-center">
              {/* Select de Estado */}
              <div className="w-full sm:w-[250px]">
                <BaseFilters
                  filters={filters}
                  config={[filterConfig[1]]} // Select de estados
                  onFilterChange={handleFilterChange}
                />
              </div>

              {/* Botões de Ação */}
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:ml-auto">
                <PlanilhaDoCadastro
                  cadastro="concessionarias"
                  titulo="Concessionárias"
                  exportar={() =>
                    exportarConcessionarias({
                      search: filters.search || undefined,
                      estado: filters.estado !== 'all' ? filters.estado : undefined,
                    })
                  }
                  ler={lerConcessionarias}
                  aoImportar={handleRefresh}
                  podeImportar={podeGerenciar}
                />
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="btn-minimal-outline flex-1 sm:flex-none"
                >
                  <RefreshCw className={`h-4 w-4 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Atualizar</span>
                </button>

                {podeGerenciar && (
                  <button
                    onClick={() => openModal('create')}
                    disabled={isSubmitting}
                    className="btn-minimal-primary flex-1 sm:flex-none"
                  >
                    <Plus className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Nova Concessionária</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ✅ Indicador de filtros ativos */}
          {(filters.search || filters.estado !== 'all') && (
            <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>
                Filtros ativos:
                {filters.search && ` busca por "${filters.search}"`}
                {filters.search && filters.estado !== 'all' && ', '}
                {filters.estado !== 'all' && ` estado "${filters.estado}"`}
              </span>
            </div>
          )}

          {/* ✅ Tabela */}
          <div className="flex-1 min-h-0">
            <BaseTable
              data={concessionarias}
              columns={concessionariasTableColumns}
              pagination={pagination}
              loading={loading}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
              onView={handleView}
              onEdit={podeGerenciar ? handleEdit : undefined}
              emptyMessage={
                filters.search
                  ? `Nenhuma concessionária encontrada para "${filters.search}".`
                  : "Nenhuma concessionária encontrada."
              }
              emptyIcon={<Zap className="h-8 w-8 text-muted-foreground/50" />}
            />
          </div>
        </div>

        {/* Modal integrado */}
        <BaseModal
          isOpen={modalState.isOpen}
          mode={modalState.mode}
          entity={getModalEntity()}
          title={getModalTitle()}
          icon={getModalIcon()}
          formFields={concessionariasFormFields}
          onClose={closeModal}
          onSubmit={handleSubmit}

          loading={isSubmitting}
          loadingText={modalState.mode === 'create' ? "Cadastrando concessionária..." : "Salvando alterações..."}

          closeOnBackdropClick={!isSubmitting}
          closeOnEscape={true}
          submitButtonText={modalState.mode === 'create' ? "Cadastrar Concessionária" : "Salvar Alterações"}
        />
      </Layout.Main>
    </Layout>
  );
}
