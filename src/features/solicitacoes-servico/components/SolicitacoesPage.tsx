// src/features/solicitacoes-servico/components/SolicitacoesPage.tsx
import { useState, useEffect, useMemo } from 'react';
import { Layout } from '@/components/common/Layout';
import { TitleCard } from '@/components/common/title-card';
import { BaseTable } from '@aupus/shared-pages';
import { BaseFilters } from '@aupus/shared-pages';
import { BaseModal } from '@aupus/shared-pages';
import { Plus, FilePenLine, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { formatApiError } from '@/utils/api-error';
import { propostaApi, type Proposta } from '@/services/proposta.services';
import { PropostaSection } from './PropostaSection';
import { PropostaCorrenteProvider, comBotaoDePdf } from './BotaoGerarPdf';
import { AbrirInstrucaoContext, ValoresDaPropostaContext, type ValoresDaProposta } from './proposta-contexto';
import { EditarInstrucaoSheet } from '@/features/instrucoes/components/EditarInstrucaoSheet';
import type { FormField } from '@/types/base';

/**
 * O que o BaseForm entrega a um campo customizado. So o que esta secao usa —
 * declarar o objeto inteiro aqui duplicaria o tipo do BaseForm.
 */
interface PropsDoCampo {
  entity?: SolicitacaoServico | null;
  mode?: 'create' | 'edit' | 'view';
  /**
   * O estado VIVO do formulário. A selecao de instrucoes tem que sair daqui, e
   * nao do `entity`: o entity e o que esta gravado, e a proposta precisa
   * reagir no instante em que a instrucao e escolhida, antes de salvar.
   */
  formData?: { instrucoes_ids?: string[] };
}
import { useGenericModal } from '@/hooks/useGenericModal';
import { SolicitacaoServico, SolicitacaoServicoFormData } from '../types';
import { solicitacoesTableColumns } from '../config/table-config';
import { createSolicitacoesTableActions } from '../config/actions-config';
import { useSolicitacoesApi } from '../hooks/useSolicitacoesApi';
import { useSolicitacoesFilters } from '../hooks/useSolicitacoesFilters';
import { useSolicitacoesActions } from '../hooks/useSolicitacoesActions';
import { ActionConfirmPanel } from './ActionConfirmPanel';
import { SolicitacoesDashboard } from './SolicitacoesDashboard';
import { SolicitacoesStats } from '@/services/solicitacoes-servico.service';

const initialFilters = {
  search: '',
  page: 1,
  limit: 10,
};

const initialStats: SolicitacoesStats = {
  total: 0,
  registradas: 0,
  programadas: 0,
  finalizadas: 0,
  porTipo: {},
  porPrioridade: {},
};

export function SolicitacoesPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [stats, setStats] = useState<SolicitacoesStats>(initialStats);

  const {
    solicitacoes,
    loading,
    total,
    totalPages,
    currentPage,
    fetchSolicitacoes,
    createSolicitacao,
    updateSolicitacao,
    deleteSolicitacao,
    getStats,
  } = useSolicitacoesApi();

  const { filterConfigs, formFields, loadFilterOptions } = useSolicitacoesFilters(filters);
  const { modalState, openModal, closeModal } = useGenericModal<SolicitacaoServico>();

  const reloadData = async () => {
    await fetchSolicitacoes(filters);
    await loadDashboard();
  };

  const solicitacoesActions = useSolicitacoesActions({
    openModal,
    closeModal,
    deleteItem: deleteSolicitacao,
    onSuccess: reloadData,
  });

  const customActions = useMemo(() => {
    const tableActions = createSolicitacoesTableActions({
      onView: solicitacoesActions.handleView,
      onEdit: solicitacoesActions.handleEdit,
      onDelete: solicitacoesActions.handleDelete,
    });

    return tableActions
      .filter((action) => action.label !== 'Visualizar' && action.label !== 'Editar')
      .map((action) => {
        const Icon = action.icon as any;
        return {
          key: action.label.toLowerCase().replace(/\s+/g, '_'),
          label: action.label,
          handler: action.onClick,
          condition: action.condition,
          icon: Icon ? <Icon className="h-4 w-4" /> : undefined,
          variant: action.variant,
        };
      });
  }, [solicitacoesActions]);


  useEffect(() => {
    loadFilterOptions();
    loadData();
    loadDashboard();
  }, []);

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      await fetchSolicitacoes(filters);
    } catch (error) {
      console.error('Erro ao carregar solicitacoes:', error);
    }
  };

  const loadDashboard = async () => {
    try {
      const dashboardData = await getStats();
      setStats(dashboardData);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    }
  };

  /**
   * A proposta montada no sheet antes de a solicitacao existir.
   *
   * Fica na pagina, e nao no componente da secao, porque quem sabe o id novo e
   * o handleSubmit — a secao ja foi desmontada quando ele chega.
   */
  const [rascunhoProposta, setRascunhoProposta] = useState<Proposta | null>(null);

  /**
   * A proposta corrente, para o botao de PDF que fecha o formulario.
   *
   * Separada do rascunho porque as duas respondem perguntas diferentes: o
   * rascunho e "o que gravar quando a solicitacao nascer", e so existe no
   * cadastro; esta e "o que imprimir agora", e vale tambem para solicitacao ja
   * salva, cuja proposta a secao carrega sozinha da API.
   *
   * Viaja por contexto, e nao pelo `camposDoSheet`: aquele e memoizado, e mudar
   * a identidade do render de um campo o desmonta e remonta.
   */
  const [propostaAtual, setPropostaAtual] = useState<Proposta | null>(null);

  /**
   * A instrucao aberta por cima do sheet da solicitacao.
   *
   * Fica na pagina porque ela e quem monta o BaseModal — e precisa desligar o
   * `closeOnEscape` dele enquanto o de cima estiver aberto: os dois escutam a
   * tecla no document, e um Escape fecharia os dois de uma vez.
   */
  const [instrucaoAberta, setInstrucaoAberta] = useState<string | null>(null);

  /**
   * Os valores da proposta, publicados pela secao e devolvidos ao card.
   *
   * A pagina e o unico ponto que enxerga os dois campos — `instrucoes_ids`, que
   * desenha os cards, e `proposta`, que tem os valores. Eles sao irmaos no
   * formulario e nao se alcancam.
   */
  const [valoresProposta, setValoresProposta] = useState<ValoresDaProposta | null>(null);

  /**
   * Grava o rascunho em sequencia: cada rota devolve os totais recalculados.
   *
   * O BDI nao viaja: as colunas nascem com o padrao no proprio banco, e o
   * `create` ja recalcula com ele. Mandar daqui so repetiria o mesmo numero.
   */
  const gravarRascunhoProposta = async (id: string, rascunho: Proposta) => {
    if (rascunho.itens.length > 0) {
      await propostaApi.salvarItens(id, rascunho.itens);
    }
    if (rascunho.outros_custos.length > 0) {
      await propostaApi.salvarOutrosCustos(id, rascunho.outros_custos);
    }
  };

  /**
   * O render da proposta e montado aqui, e nao no form-config, porque so a
   * pagina tem o setRascunhoProposta — e e ela quem grava depois de criar.
   */
  const camposDoSheet = useMemo(
    () =>
      formFields.map((campo: FormField) =>
        campo.key === 'proposta'
          ? {
              ...campo,
              render: ({ entity, mode, formData }: PropsDoCampo) => (
                <PropostaSection
                  solicitacaoId={entity?.id ?? null}
                  instrucoesIds={formData?.instrucoes_ids ?? []}
                  somenteLeitura={mode === 'view'}
                  onRascunhoChange={setRascunhoProposta}
                  onPropostaChange={setPropostaAtual}
                  onValoresChange={setValoresProposta}
                />
              ),
            }
          : campo.key === 'solicitante'
            ? { ...campo, render: comBotaoDePdf(campo.render) }
            : campo,
      ),
    [formFields],
  );

  const handleSubmit = async (data: SolicitacaoServicoFormData) => {
    try {
      if (modalState.mode === 'create') {
        const criada = (await createSolicitacao(data)) as SolicitacaoServico | undefined;

        // A proposta e montada no mesmo sheet, antes de a solicitacao existir.
        // Sem id nao ha rota para gravar, entao ela viaja como rascunho e e
        // persistida aqui, assim que o id nasce.
        const novoId = criada?.id?.trim?.();
        if (novoId && rascunhoProposta) {
          try {
            await gravarRascunhoProposta(novoId, rascunhoProposta);
          } catch (erro) {
            // A solicitacao existe; so a proposta falhou. Dizer qual das duas
            // coisas deu errado evita a pessoa cadastrar tudo de novo.
            toast.error('Solicitação criada, mas a proposta não pôde ser salva', {
              description: formatApiError(erro),
            });
          }
        }
        setRascunhoProposta(null);
      } else if (modalState.mode === 'edit' && modalState.entity) {
        await updateSolicitacao(modalState.entity.id, data);
      }

      closeModal();
      solicitacoesActions.clearPendingAction();
      await reloadData();
    } catch (error) {
      console.error('Erro ao salvar solicitacao:', error);
      throw error;
    }
  };

  const handleClose = () => {
    closeModal();
    solicitacoesActions.clearPendingAction();
  };

  const handleFilterChange = async (newFilters: any) => {
    const cleanedFilters = { ...newFilters };

    Object.keys(cleanedFilters).forEach((key) => {
      if (cleanedFilters[key] === 'all' || cleanedFilters[key] === '') {
        cleanedFilters[key] = undefined;
      }
    });

    setFilters((prev) => {
      const updated = { ...prev, ...cleanedFilters, page: 1 };
      Object.keys(updated).forEach(key => {
        if (updated[key] === undefined && key !== 'page' && key !== 'limit' && key !== 'search') {
          delete updated[key];
        }
      });
      return updated;
    });
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
  };

  // Título do modal muda se tem ação pendente
  const getModalTitle = () => {
    if (modalState.mode === 'create') return 'Nova Solicitação';
    if (modalState.mode === 'edit') return 'Editar Solicitação';
    if (solicitacoesActions.pendingAction === 'excluir') return 'Excluir Solicitação';
    return 'Visualizar Solicitação';
  };

  return (
    <Layout>
      <Layout.Main>
        <div className="flex flex-col h-full w-full">
          <TitleCard
            title="Solicitações de Serviço"
            description="Gerencie e monitore solicitações de serviço"
          />

          <SolicitacoesDashboard data={stats} />

          <div className="flex flex-col gap-3 mb-4 md:mb-6">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-start">
              <div className="flex-1 min-w-0">
                <BaseFilters
                  filters={filters}
                  config={filterConfigs}
                  onFilterChange={handleFilterChange}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleClearFilters}
                  className="btn-minimal-primary w-full sm:w-auto whitespace-nowrap flex-shrink-0 justify-center"
                  title="Limpar filtros"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  <span>Limpar Filtros</span>
                </button>
                <button
                  onClick={() => openModal('create')}
                  className="btn-minimal-primary w-full sm:w-auto whitespace-nowrap flex-shrink-0 justify-center"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <span>Nova Solicitação</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0">
            <BaseTable
              data={solicitacoes}
              columns={solicitacoesTableColumns}
              pagination={{
                page: currentPage,
                limit: filters.limit || 10,
                total,
                totalPages,
              }}
              loading={loading}
              onPageChange={handlePageChange}
              onView={solicitacoesActions.handleView}
              onEdit={solicitacoesActions.handleEdit}
              emptyMessage="Nenhuma solicitação encontrada."
              emptyIcon={<FilePenLine className="h-8 w-8 text-muted-foreground/50" />}
              customActions={customActions}
            />
          </div>
        </div>

        {modalState.isOpen && (
          <PropostaCorrenteProvider proposta={propostaAtual}>
            <AbrirInstrucaoContext.Provider value={setInstrucaoAberta}>
            <ValoresDaPropostaContext.Provider value={valoresProposta}>
              <BaseModal
                isOpen={modalState.isOpen}
                mode={modalState.mode}
                entity={modalState.entity as any}
                title={getModalTitle()}
                icon={<FilePenLine className="h-4 w-4 md:h-5 md:w-5 text-primary" />}
                formFields={camposDoSheet}
                onClose={handleClose}
                onSubmit={handleSubmit}
                closeOnEscape={!instrucaoAberta}
                closeOnBackdropClick={!instrucaoAberta}
                width="w-full max-w-[95vw] sm:max-w-[90vw] md:max-w-[800px]"
              >
                {/* Painel de confirmação de ação - aparece no final do form em modo view */}
                {solicitacoesActions.pendingAction && modalState.mode === 'view' && (
                  <ActionConfirmPanel
                    action={solicitacoesActions.pendingAction}
                    onConfirm={solicitacoesActions.confirmAction}
                  />
                )}
              </BaseModal>

              <EditarInstrucaoSheet
                instrucaoId={instrucaoAberta}
                onClose={() => setInstrucaoAberta(null)}
              />
            </ValoresDaPropostaContext.Provider>
            </AbrirInstrucaoContext.Provider>
          </PropostaCorrenteProvider>
        )}
      </Layout.Main>
    </Layout>
  );
}
