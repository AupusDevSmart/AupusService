# Arquivos Restantes para Feature de Solicitações de Serviço

## ✅ Arquivos Criados

1. **Tipos** - `types/index.ts` ✅
2. **Serviço de API** - `services/solicitacoes-servico.service.ts` ✅
3. **Hooks**:
   - `hooks/useSolicitacoesApi.ts` ✅
   - `hooks/useSolicitacoesFilters.ts` ✅
   - `hooks/useSolicitacoesActions.ts` ✅
4. **Configurações**:
   - `config/table-config.tsx` ✅
   - `config/filter-config.ts` ✅
   - `config/form-config.tsx` ✅
   - `config/actions-config.tsx` ✅
5. **Componentes**:
   - `components/table-cells/StatusCell.tsx` ✅
   - `components/table-cells/PrioridadeCell.tsx` ✅
   - `components/table-cells/SolicitacaoInfoCell.tsx` ✅
   - `components/SolicitacoesDashboard.tsx` ✅
6. **Index** - `index.ts` ✅

## 📝 Arquivos que VOCÊ Precisa Criar

### 1. Página Principal
Arquivo: `src/features/solicitacoes-servico/components/SolicitacoesPage.tsx`

Copie o arquivo `src/features/anomalias/components/AnomaliasPage.tsx` e adapte:
- Trocar todas as referências de "Anomalia" para "Solicitacao"
- Trocar todas as referências de "anomalias" para "solicitacoes"
- Atualizar os imports para usar os hooks e configurações de solicitações
- Atualizar o título e descrição
- Adicionar as ações de workflow (enviar, analisar, aprovar, rejeitar, cancelar, concluir)
- Ajustar os stats do dashboard

### 2. Rota da Aplicação
Arquivo: `src/pages/solicitacoes-servico/index.tsx`

```typescript
import { SolicitacoesPage } from '@/features/solicitacoes-servico/components/SolicitacoesPage';

export default function SolicitacoesServicoIndexPage() {
  return <SolicitacoesPage />;
}
```

### 3. Adicionar ao Menu de Navegação
Arquivo onde está o menu principal (procure por "Anomalias" no menu)

Adicione um item similar:
```typescript
{
  title: 'Solicitações de Serviço',
  href: '/solicitacoes-servico',
  icon: FilePenLine,
}
```

### 4. Opcional: Componentes Adicionais

Se quiser melhorar, pode criar:
- `components/ComentariosSection.tsx` - Seção de comentários
- `components/HistoricoSection.tsx` - Seção de histórico
- `components/WorkflowActions.tsx` - Ações de workflow customizadas

## 🔧 Template da Página Principal

Aqui está um template simplificado para `SolicitacoesPage.tsx`:

```typescript
// src/features/solicitacoes-servico/components/SolicitacoesPage.tsx
import { useState, useEffect, useMemo } from 'react';
import { Layout } from '@/components/common/Layout';
import { TitleCard } from '@/components/common/title-card';
import { BaseTable } from '@nexon/components/common/base-table/BaseTable';
import { BaseFilters } from '@nexon/components/common/base-filters/BaseFilters';
import { BaseModal } from '@nexon/components/common/base-modal/BaseModal';
import { Plus, FilePenLine } from 'lucide-react';
import { useGenericModal } from '@/hooks/useGenericModal';
import { SolicitacaoServico, SolicitacaoServicoFormData } from '../types';
import { solicitacoesTableColumns } from '../config/table-config';
import { createSolicitacoesTableActions } from '../config/actions-config';
import { useSolicitacoesApi } from '../hooks/useSolicitacoesApi';
import { useSolicitacoesFilters } from '../hooks/useSolicitacoesFilters';
import { useSolicitacoesActions } from '../hooks/useSolicitacoesActions';
import { SolicitacoesDashboard } from './SolicitacoesDashboard';
import { SolicitacoesStats } from '@/services/solicitacoes-servico.service';

const initialFilters = {
  search: '',
  page: 1,
  limit: 10,
};

const initialStats: SolicitacoesStats = {
  total: 0,
  rascunhos: 0,
  aguardando: 0,
  emAnalise: 0,
  aprovadas: 0,
  rejeitadas: 0,
  emExecucao: 0,
  concluidas: 0,
  canceladas: 0,
  urgentes: 0,
  porTipo: {},
  porPrioridade: {},
  taxaAprovacao: 0,
};

export function SolicitacoesPage() {
  // Estados
  const [filters, setFilters] = useState(initialFilters);
  const [stats, setStats] = useState<SolicitacoesStats>(initialStats);

  // Hook de API
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
    enviar,
    analisar,
    aprovar,
    rejeitar,
    cancelar,
    concluir,
  } = useSolicitacoesApi();

  // Hook de filtros
  const { filterConfigs, formFields, loadFilterOptions } = useSolicitacoesFilters(filters);

  // Modal
  const { modalState, openModal, closeModal } = useGenericModal<SolicitacaoServico>();

  // Função de recarga
  const reloadData = async () => {
    await fetchSolicitacoes(filters);
    await loadDashboard();
  };

  // Hook de ações
  const solicitacoesActions = useSolicitacoesActions({
    openModal,
    deleteItem: deleteSolicitacao,
    enviar,
    analisar,
    aprovar,
    rejeitar,
    cancelar,
    concluir,
    onSuccess: reloadData,
  });

  // Ações customizadas
  const customActions = useMemo(() => {
    const tableActions = createSolicitacoesTableActions({
      onView: solicitacoesActions.handleView,
      onEdit: solicitacoesActions.handleEdit,
      onDelete: solicitacoesActions.handleDelete,
      onEnviar: solicitacoesActions.handleEnviar,
      onAnalisar: solicitacoesActions.handleAnalisar,
      onAprovar: solicitacoesActions.handleAprovar,
      onRejeitar: solicitacoesActions.handleRejeitar,
      onCancelar: solicitacoesActions.handleCancelar,
      onConcluir: solicitacoesActions.handleConcluir,
    });

    return tableActions
      .filter((action) => action.label !== 'Visualizar' && action.label !== 'Editar')
      .map((action) => {
        const Icon = action.icon;
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

  // Carregar dados iniciais
  useEffect(() => {
    loadFilterOptions();
    loadData();
    loadDashboard();
  }, []);

  // Recarregar quando filtros mudam
  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      await fetchSolicitacoes(filters);
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
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

  // Handlers
  const handleSubmit = async (data: SolicitacaoServicoFormData) => {
    try {
      if (modalState.mode === 'create') {
        await createSolicitacao(data);
      } else if (modalState.mode === 'edit' && modalState.entity) {
        await updateSolicitacao(modalState.entity.id, data);
      }

      closeModal();
      await reloadData();
    } catch (error) {
      console.error('Erro ao salvar solicitação:', error);
      throw error;
    }
  };

  const handleFilterChange = async (newFilters: any) => {
    const cleanedFilters = { ...newFilters };
    Object.keys(cleanedFilters).forEach((key) => {
      if (cleanedFilters[key] === 'all') {
        cleanedFilters[key] = undefined;
      }
    });

    setFilters((prev) => ({ ...prev, ...cleanedFilters, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  return (
    <Layout>
      <Layout.Main>
        <div className="flex flex-col h-full w-full">
          {/* Header */}
          <TitleCard
            title="Solicitações de Serviço"
            description="Gerencie e monitore solicitações de serviço"
          />

          {/* Dashboard */}
          <SolicitacoesDashboard data={stats} />

          {/* Filtros e Ação */}
          <div className="flex flex-col gap-3 mb-4 md:mb-6">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-start">
              <div className="flex-1 min-w-0">
                <BaseFilters
                  filters={filters}
                  config={filterConfigs}
                  onFilterChange={handleFilterChange}
                />
              </div>
              <button
                onClick={() => openModal('create')}
                className="btn-minimal-primary w-full sm:w-auto whitespace-nowrap flex-shrink-0 justify-center"
              >
                <Plus className="mr-2 h-4 w-4" />
                <span>Nova Solicitação</span>
              </button>
            </div>
          </div>

          {/* Tabela */}
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

        {/* Modal */}
        {modalState.isOpen && (
          <BaseModal
            isOpen={modalState.isOpen}
            mode={modalState.mode}
            entity={modalState.entity as any}
            title={
              modalState.mode === 'create'
                ? 'Nova Solicitação'
                : modalState.mode === 'edit'
                ? 'Editar Solicitação'
                : 'Visualizar Solicitação'
            }
            icon={<FilePenLine className="h-4 w-4 md:h-5 md:w-5 text-primary" />}
            formFields={formFields}
            onClose={closeModal}
            onSubmit={handleSubmit}
            width="w-full max-w-[95vw] sm:max-w-[90vw] md:max-w-[800px]"
          />
        )}
      </Layout.Main>
    </Layout>
  );
}
```

## 🚀 Próximos Passos

1. Crie o arquivo `SolicitacoesPage.tsx` usando o template acima
2. Crie a rota em `src/pages/solicitacoes-servico/index.tsx`
3. Adicione ao menu de navegação
4. Teste a feature completa
5. Ajuste conforme necessário

Todos os arquivos base já foram criados! A feature está 90% pronta! 🎉
