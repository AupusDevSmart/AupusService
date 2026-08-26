// src/features/planos-manutencao/components/PlanosManutencaoPage.tsx - REFATORADA
import { useState, useEffect, useCallback } from 'react';
import { Layout } from '@/components/common/Layout';
import { TitleCard } from '@/components/common/title-card';
import { BaseTable } from '@aupus/shared-pages';
import { BaseFilters } from '@aupus/shared-pages';
import { Plus, Layers } from 'lucide-react';
import { useGenericModal } from '@/hooks/useGenericModal';
import { useUserStore } from '@/store/useUserStore';
import { planosTableColumns } from '../config/table-config';
import { usePlanosManutencaoApi } from '../hooks/usePlanosManutencaoApi';
import { usePlanosFilters } from '../hooks/usePlanosFilters';
import { createPlanosTableActions } from '../config/actions-config';
import {
  PlanoManutencaoApiResponse,
  CreatePlanoManutencaoApiData,
  UpdatePlanoManutencaoApiData
} from '@/services/planos-manutencao.services';
import { PlanosModal } from './PlanosModal';
import { TarefasExpandedRow } from './TarefasExpandedRow';
import { InstrucoesApiService, type InstrucaoApiResponse } from '@/services/instrucoes.services';
import { InstrucoesModal } from '@/features/instrucoes/components/InstrucoesModal';
import { instrucoesFormFields } from '@/features/instrucoes/config/form-config';

const instrucoesApi = new InstrucoesApiService();
import { type TarefaApiResponse } from '@/services/tarefas.services';
import { toast } from '@/hooks/use-toast';
import { formatApiError } from '@/utils/api-error';

interface PlanosFiltersApi {
  search?: string;
  page?: number;
  limit?: number;
}

const initialFilters: PlanosFiltersApi = {
  search: '',
  page: 1,
  limit: 10
};

export function PlanosManutencaoPage() {
  const { user } = useUserStore();

  // Estados locais
  const [filters, setFilters] = useState<PlanosFiltersApi>(initialFilters);

  // Opcoes de instrucao para o cadastro rapido da linha expandida
  const [instrucoesOptions, setInstrucoesOptions] = useState<Array<{ value: string; label: string }>>([]);
  // Linha expandida da tabela (uma por vez) + gatilho de recarga das tarefas
  // Sheet de instrução aberto pelo "ver detalhes" de uma tarefa
  const [instrucaoModal, setInstrucaoModal] = useState<{
    isOpen: boolean;
    entity: InstrucaoApiResponse | null;
  }>({ isOpen: false, entity: null });
  const [expandedPlanoId, setExpandedPlanoId] = useState<string | null>(null);
  // Plano para o qual o cadastro de tarefa deve abrir. Guardar o ALVO e nao um
  // contador: com contador o efeito disparava no mount da linha expandida.
  const [abrirCadastroPara, setAbrirCadastroPara] = useState<string | null>(null);
  // Muda quando algo fora da linha expandida mexe nas tarefas
  const [tarefasRefreshToken] = useState(0);

  // Hooks customizados
  const { filterConfig, formFields, loadFilterOptions } = usePlanosFilters(initialFilters);
  const {
    loading,
    planos,
    totalPages,
    currentPage,
    total,
    fetchPlanos,
    createPlano,
    updatePlano,
    getPlano
  } = usePlanosManutencaoApi();

  const { modalState, openModal, closeModal: originalCloseModal } = useGenericModal<PlanoManutencaoApiResponse>();

  // Carregar opções de instruções para o modal de tarefa
  useEffect(() => {
    instrucoesApi.findAll({ limit: 100, status: 'ATIVA' as any }).then((res) => {
      const options = (res.data || [])
        .filter((inst: any) => inst.id && inst.nome)
        .map((inst: any) => ({
          value: inst.id,
          label: `${inst.tag ? inst.tag + ' - ' : ''}${inst.nome}`
        }));
      setInstrucoesOptions(options);
    }).catch(() => {});
  }, []);

  // Funções de carregamento
  const loadData = async () => {
    try {
      await fetchPlanos(filters);
    } catch (error) {
      // Sem aviso, a tabela vazia parece "nenhum plano cadastrado" quando na
      // verdade a consulta falhou.
      console.error('Erro ao carregar planos:', error);
      toast({
        title: 'Erro ao carregar planos',
        description: formatApiError(error),
        variant: 'destructive'
      });
    }
  };

  const reloadAll = async () => {
    await loadData();
  };

  const closeModal = originalCloseModal;

  // Carregar dados iniciais
  useEffect(() => {
    loadData();
    loadFilterOptions();
  }, []);

  // Recarregar quando filtros mudam
  useEffect(() => {
    loadData();
  }, [filters]);

  // Handlers de modal
  const handleSuccess = async () => {
    closeModal();
    await reloadAll();
  };

  const handleSubmit = async (data: any) => {
    try {
      if (modalState.mode === 'create') {
        if (!user?.id) {
          alert('Erro: Usuário não autenticado. Faça login para criar planos.');
          return;
        }

        const createData: CreatePlanoManutencaoApiData = {
          categoria_id: (data.categoria_id || '').trim(),
          nome: data.nome,
          descricao: data.descricao,
          versao: data.versao || '1.0',
          criado_por: user.id
        };
        // As tarefas sao cadastradas na linha expandida, depois de o plano
        // existir. O acumulo de "tarefas pendentes" antes do save sumiu junto
        // com a secao de tarefas dentro do modal.
        await createPlano(createData);
      } else if (modalState.mode === 'edit' && modalState.entity) {
        const updateData: UpdatePlanoManutencaoApiData = {
          categoria_id: (data.categoria_id || '').trim() || undefined,
          nome: data.nome,
          descricao: data.descricao,
          versao: data.versao
        };
        await updatePlano(modalState.entity.id, updateData);
      }

      await handleSuccess();
    } catch (error) {
      // Sem isso o usuario clicava em salvar e nada acontecia: o modal ficava
      // aberto, sem aviso, e a falha so aparecia no console.
      console.error('Erro ao salvar plano:', error);
      toast({
        title: modalState.mode === 'create' ? 'Erro ao criar plano' : 'Erro ao salvar plano',
        description: formatApiError(error),
        variant: 'destructive'
      });
    }
  };

  const handleView = async (plano: PlanoManutencaoApiResponse) => {
    try {
      const planoCompleto = await getPlano(plano.id, true);
      openModal('view', planoCompleto);
    } catch {
      openModal('view', plano);
    }
  };

  const handleEdit = async (plano: PlanoManutencaoApiResponse) => {
    try {
      const planoCompleto = await getPlano(plano.id, true);
      openModal('edit', planoCompleto);
    } catch {
      openModal('edit', plano);
    }
  };

  // ============================
  // Handlers de tarefa (nested)
  // ============================

  // ============================
  // Handlers da linha expandida
  // ============================

  const handleAdicionarTarefa = useCallback((plano: PlanoManutencaoApiResponse) => {
    const id = plano.id?.trim() || null;
    setExpandedPlanoId(id);
    setAbrirCadastroPara(id);
  }, []);

  const handleRowToggle = useCallback((plano: PlanoManutencaoApiResponse) => {
    const planoId = plano.id?.trim() || '';
    setExpandedPlanoId((atual) => (atual === planoId ? null : planoId));
  }, []);

  // Ver/editar a partir da linha expandida sempre vão pela API — o desvio de
  // tarefa pendente do handleEditTarefa só existe no modo create do plano.
  // O detalhe util de uma tarefa e a INSTRUCAO: a tarefa em si tem so os quatro
  // campos que ja aparecem na linha. Abre o sheet de instrucao em modo view.
  const abrirInstrucaoDaTarefa = async (tarefa: TarefaApiResponse) => {
    const instrucaoId = tarefa.instrucao_id?.trim();
    if (!instrucaoId) {
      toast({ title: 'Esta tarefa não tem instrução vinculada', variant: 'destructive' });
      return;
    }

    try {
      const instrucao = await instrucoesApi.findOne(instrucaoId);
      setInstrucaoModal({ isOpen: true, entity: instrucao });
    } catch (error) {
      console.error('Erro ao carregar instrução:', error);
      toast({ title: 'Erro ao carregar a instrução', description: formatApiError(error), variant: 'destructive' });
    }
  };

  const handleTarefasChange = useCallback(async () => {
    await loadData();
  }, [filters]);

  // Filtros
  const handleFilterChange = (newFilters: Partial<PlanosFiltersApi>) => {
    const cleanedFilters = { ...newFilters };
    Object.keys(cleanedFilters).forEach((key) => {
      if (cleanedFilters[key as keyof typeof cleanedFilters] === 'all') {
        cleanedFilters[key as keyof typeof cleanedFilters] = undefined as any;
      }
    });

    setFilters((prev) => ({ ...prev, ...cleanedFilters, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  // Criar ações customizadas da tabela - apenas visualizar, editar e associar
  const customActions = createPlanosTableActions({
    handleView,
    handleEdit,
    handleAdicionarTarefa,
  }) as any;

  return (
    <Layout>
      <Layout.Main>
        <div className="flex flex-col w-full sm:h-full">
          {/* Header */}
          <TitleCard
            title="Planos de Manutenção"
            description="Gerencie templates de manutenção para equipamentos similares"
          />

          {/* Filtros e Ação */}
          <div className="flex flex-col lg:flex-row gap-3 md:gap-4 mb-4 md:mb-6 lg:items-start">
            <div className="flex-1">
              <BaseFilters filters={filters} config={filterConfig} onFilterChange={handleFilterChange} />
            </div>
            <button onClick={() => openModal('create')} className="btn-minimal-primary w-full lg:w-auto lg:mt-0 whitespace-nowrap">
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Novo Plano</span>
              <span className="sm:hidden">Novo</span>
            </button>
          </div>

          {/* Tabela */}
          <div className="sm:flex-1 sm:min-h-0">
            <BaseTable
              data={planos}
              columns={planosTableColumns}
              pagination={{
                page: currentPage,
                limit: filters.limit || 10,
                total,
                totalPages
              }}
              loading={loading}
              onPageChange={handlePageChange}
              emptyMessage="Nenhum plano de manutenção encontrado."
              emptyIcon={<Layers className="h-8 w-8 text-muted-foreground/50" />}
              customActions={customActions}
              expandedRowId={expandedPlanoId}
              onRowToggle={handleRowToggle}
              renderExpandedRow={(plano) => (
                <TarefasExpandedRow
                  planoId={plano.id}
                  instrucoesOptions={instrucoesOptions}
                  refreshToken={tarefasRefreshToken}
                  onVerTarefa={abrirInstrucaoDaTarefa}
                  onTarefasChange={handleTarefasChange}
                  posicaoBotaoAdicionar="oculto"
                  abrirCadastroPara={abrirCadastroPara}
                  onCadastroAberto={() => setAbrirCadastroPara(null)}
                />
              )}
            />
          </div>
        </div>

        {/* Modal Principal */}
        <PlanosModal
          isOpen={modalState.isOpen}
          mode={modalState.mode as 'create' | 'edit' | 'view'}
          entity={modalState.entity}
          formFields={formFields}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />

        {/* Detalhe da tarefa = sheet da instrução, em modo leitura */}
        <InstrucoesModal
          isOpen={instrucaoModal.isOpen}
          mode="view"
          entity={instrucaoModal.entity}
          formFields={instrucoesFormFields}
          onClose={() => setInstrucaoModal({ isOpen: false, entity: null })}
          onSubmit={async () => {}}
          onFilesChange={() => {}}
        />

        </Layout.Main>
    </Layout>
  );
}
