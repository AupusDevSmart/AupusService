// src/features/execucao-os/components/ExecucaoOSPage.tsx
import { useState, useEffect, useRef } from 'react';
import { useLinhasPorPagina, LINHAS_POR_PAGINA_PADRAO } from '@/store/usePreferenciasDeTabela';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/common/Layout';
import { TitleCard } from '@/components/common/title-card';
import { BaseTable } from '@/core';
import { BaseFilters } from '@/core';
import { BaseModal } from '@/core';
import { Button } from '@/components/ui/button';
import { RefreshCw, Eye, ShieldCheck } from 'lucide-react';
import { useGenericModal } from '@/hooks/useGenericModal';

// Hooks e configurações da feature
import { useExecucaoOSApi } from '../hooks/useExecucaoOSApi';
import { useExecucaoOSFilters } from '../hooks/useExecucaoOSFilters';
import { execucaoOSTableColumns } from '../config/table-config';
import { createExecucaoOSTableActions } from '../config/actions-config';
import type { PendingAction, DadosDaConfirmacao } from './ActionConfirmPanel';
import { BotaoExportarOS } from './BotaoExportarOS';
import { ConferirCodigo } from './ConferirCodigo';
import { SheetDaExecucao } from './sheet/SheetDaExecucao';
import { statusLabels } from '../config/labels';
import { statusDaExecucao } from '../config/actions-config';

// Tipos
import type { ExecucaoOS, ExecucaoOSFilters } from '../types';
import { execucaoOSTransitionsService, type ExecutarOSDto } from '@/services/execucao-os-transitions.service';
import type { IconeDeAcao } from '@/core/types/base';
import { toast } from '@/hooks/use-toast';
import { formatApiError } from '@/utils/api-error';
import { useUserStore } from '@/store/useUserStore';

// Dashboard Component
import { ExecucaoOSDashboard } from './ExecucaoOSDashboard';

// Filtros iniciais
const initialFilters: ExecucaoOSFilters = {
  search: '',
  statusExecucao: 'all',
  tipo: 'all',
  prioridade: 'all',
  planta: 'all',
  equipamento: 'all',
  dataInicio: '',
  dataFim: '',
  page: 1,
  limit: LINHAS_POR_PAGINA_PADRAO,
};

/** "OSS-2026-0002 · O&M Preventiva... · Em execução": o que é a OS, no título do sheet */
function tituloDoSheet(os: ExecucaoOS): string {
  const status = statusDaExecucao(os);
  return [os.numero_os?.trim() || os.numeroOS, os.descricao?.trim(), status ? (statusLabels[status] ?? status) : null]
    .filter(Boolean)
    .join(' · ');
}

export function ExecucaoOSPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [linhasPorPagina, setLinhasPorPagina] = useLinhasPorPagina('execucao-os');
  const [filters, setFilters] = useState<ExecucaoOSFilters>(() => ({
    ...initialFilters,
    limit: linhasPorPagina,
  }));
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  // SN-62: a conferência do código do PDF, aberta pelo botão ou pelo link impresso (?conferir=)
  const [conferencia, setConferencia] = useState<{ aberta: boolean; codigo: string | null }>({ aberta: false, codigo: null });
  const temPermissao = useUserStore((s) => s.hasPermission);
  const ehCliente = useUserStore((s) => s.getUserRole()) === 'proprietario';

  // Hook de API
  const {
    items,
    loading,
    total,
    totalPages,
    currentPage,
    stats,
    fetchItems,
    fetchOne,
  } = useExecucaoOSApi();

  // Hook de filtros
  const { filterConfigs, toApiParams } = useExecucaoOSFilters(filters);

  // Modal genérico
  const { modalState, openModal, closeModal } = useGenericModal<ExecucaoOS>();

  // ============================
  // View-first action handlers
  // ============================

  const openViewWithAction = async (execucao: ExecucaoOS, action: PendingAction) => {
    try {
      const dadosCompletos = await fetchOne(execucao.id);
      if (!dadosCompletos) throw new Error('A OS não veio da API');
      setPendingAction(action);
      openModal('view', dadosCompletos);
    } catch (error) {
      // A ação não abre sobre a linha da tabela: ela vem sem as despesas, e o Executar
      // mandaria a lista vazia, que apaga as não previstas
      toast({ title: 'Não foi possível abrir a OS', description: formatApiError(error), variant: 'destructive' });
    }
  };

  // O sheet abre com a OS completa: a linha da tabela vem sem checklist, histórico e custos.
  // Sem ela, abre com a linha e avisa (antes caía na linha calado)
  const handleView = async (execucao: ExecucaoOS) => {
    setPendingAction(null);
    try {
      openModal('view', (await fetchOne(execucao.id)) || execucao);
    } catch (error) {
      toast({ title: 'A OS abriu incompleta', description: `Feche e abra de novo. ${formatApiError(error)}`, variant: 'destructive' });
      openModal('view', execucao);
    }
  };

  // Relê a OS aberta (o custo real que a API refez) e a lista
  const recarregar = async () => {
    const id = modalState.entity?.id;
    if (!id) return;
    const [atual] = await Promise.all([fetchOne(id), fetchItems(toApiParams)]);
    if (atual) openModal('view', atual);
  };

  // Confirm action handler - recebe objeto com todos os campos do painel
  const handleConfirmAction = async (data: DadosDaConfirmacao) => {
    if (!pendingAction || !modalState.entity) return;

    const entity = modalState.entity;

    try {
      switch (pendingAction) {
        case 'iniciar':
          await execucaoOSTransitionsService.iniciar(entity.id, data);
          break;
        case 'pausar':
          await execucaoOSTransitionsService.pausar(entity.id, {
            motivo_pausa: data.motivo_pausa || '',
            observacoes: data.observacoes,
          });
          break;
        case 'retomar':
          await execucaoOSTransitionsService.retomar(entity.id, data);
          break;
        case 'executar':
          // resultado_servico é obrigatório no painel: não confirma sem ele
          await execucaoOSTransitionsService.executar(entity.id, data as ExecutarOSDto);
          break;
        case 'auditar':
          await execucaoOSTransitionsService.auditar(entity.id, {
            avaliacao_qualidade: data.avaliacao_qualidade ? Number(data.avaliacao_qualidade) : undefined,
            observacoes_qualidade: data.observacoes_qualidade,
          });
          break;
        case 'finalizar':
          await execucaoOSTransitionsService.finalizar(entity.id, data);
          break;
        case 'reabrir':
          await execucaoOSTransitionsService.reabrir(entity.id, data);
          break;
        case 'cancelar':
          await execucaoOSTransitionsService.cancelar(entity.id, {
            motivo_cancelamento: data.motivo_cancelamento || '',
            observacoes: data.observacoes,
          });
          break;
      }

      const actionLabels: Record<string, string> = {
        iniciar: 'OS iniciada',
        pausar: 'OS pausada',
        retomar: 'OS retomada',
        executar: 'OS executada',
        auditar: 'OS auditada',
        finalizar: 'OS finalizada',
        reabrir: 'OS reaberta',
        cancelar: 'OS cancelada',
      };
      toast({ title: actionLabels[pendingAction] || 'Ação realizada' });

      closeModal();
      setPendingAction(null);
      await fetchItems(toApiParams);
    } catch (error) {
      toast({
        title: `Erro ao ${pendingAction}`,
        description: formatApiError(error),
        variant: 'destructive',
      });
    }
  };

  // Ações da tabela
  const actions = createExecucaoOSTableActions(openViewWithAction, temPermissao);

  // Carregar dados ao montar e quando filtros mudarem
  useEffect(() => {
    fetchItems(toApiParams);
  }, [filters]);

  // Abrir modal automaticamente quando vier com execucaoId na URL.
  // A ref guarda o id já aberto: o fetchOne alterna `loading` (dependência do
  // efeito) antes de o parâmetro sair da URL, e isso refazia o GET a cada ~2s,
  // recriando o progresso e desfazendo o que a pessoa acabara de marcar.
  // Sem o parâmetro, a ref zera: o mesmo link clicado de novo (a notificação
  // da mesma OS) volta a abrir.
  // O link impresso no PDF (?conferir=<código>) abre a conferência já com o código.
  // O parâmetro sai da URL (replace), como o execucaoId, e o código fica no estado
  useEffect(() => {
    const codigo = searchParams.get('conferir');
    if (!codigo) return;
    setConferencia({ aberta: true, codigo });
    const resto = new URLSearchParams(searchParams);
    resto.delete('conferir');
    setSearchParams(resto, { replace: true });
  }, [searchParams, setSearchParams]);

  const abertoPelaUrl = useRef<string | null>(null);
  useEffect(() => {
    const execucaoIdParam = searchParams.get('execucaoId');
    if (!execucaoIdParam) abertoPelaUrl.current = null;

    if (execucaoIdParam && abertoPelaUrl.current !== execucaoIdParam) {
      const abrirModalAutomatico = async () => {
        try {
          // Sempre a OS completa: a linha da tabela nao traz checklist, e a
          // secao "O que foi feito" abria sem os itens.
          const execucaoEncontrada = await fetchOne(execucaoIdParam);

          if (execucaoEncontrada) {
            openModal('view', execucaoEncontrada);
          }

          // replace: sem ele o Voltar caía de novo em ?execucaoId, reabria a OS e
          // empilhava outra vez — quem veio do calendário não conseguia voltar
          setSearchParams({}, { replace: true });
        } catch (error) {
          console.error('Erro ao buscar execução para abrir modal:', error);
          setSearchParams({}, { replace: true });
        }
      };

      if (items.length > 0 || loading === false) {
        abertoPelaUrl.current = execucaoIdParam;
        abrirModalAutomatico();
      }
    }
  }, [items, searchParams, loading]);

  // Handlers
  const handleFilterChange = (partial: Partial<ExecucaoOSFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...partial,
      // Outra planta: o equipamento escolhido era da anterior
      ...('planta' in partial && partial.planta !== prev.planta && { equipamento: 'all' }),
      page: 1,
    }));
  };

  // Volta para a pagina 1: na pagina 4 de 10 linhas, trocar para 100 pediria
  // um trecho que nao existe.
  const handleLimitChange = (limit: number) => {
    setLinhasPorPagina(limit);
    setFilters((prev) => ({ ...prev, limit, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const rascunhoDoComentario = useRef(false);
  const handleCloseModal = () => {
    // Comentário digitado e não enviado não some calado ao fechar (SN-48)
    if (rascunhoDoComentario.current && !window.confirm('Há um comentário não enviado. Fechar e descartar?')) return;
    rascunhoDoComentario.current = false;
    setPendingAction(null);
    closeModal();
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
        <div className="flex flex-col w-full sm:h-full space-y-4">
          {/* Header */}
          <TitleCard
            title="Execução de Ordens de Serviço"
            description="Acompanhe e gerencie a execução das ordens de serviço em campo"
          />

          {/* Dashboard */}
          <ExecucaoOSDashboard
            total={total}
            apiStats={stats}
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

            {/* Quebra a linha no celular: os três botões não cabem lado a lado em 360px (SN-68) */}
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
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
                onClick={() => setConferencia({ aberta: true, codigo: null })}
                className="flex-1 sm:flex-none"
              >
                <ShieldCheck className="h-4 w-4 mr-2" />
                Conferir código
              </Button>

              {/* Todas as OS do filtro, não só a página (SN-63) */}
              <BotaoExportarOS filtro={toApiParams} valores={filters as unknown as Record<string, unknown>} filtros={filterConfigs} />
            </div>
          </div>

          {/* Tabela */}
          <div className="sm:flex-1 sm:min-h-0">
            <BaseTable
              data={items}
              columns={execucaoOSTableColumns}
              customActions={actions.map((action) => {
                const Icone = action.icon as IconeDeAcao | undefined;
                return {
                  key: action.label.toLowerCase().replace(' ', ''),
                  label: action.label,
                  handler: action.onClick,
                  condition: action.condition,
                  icon: Icone ? <Icone className="h-4 w-4" /> : undefined,
                  variant: action.variant,
                };
              })}
              loading={loading}
              pagination={{
                page: currentPage,
                limit: filters.limit || LINHAS_POR_PAGINA_PADRAO,
                total,
                totalPages,
              }}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
              onView={handleView}
              emptyMessage="Nenhuma execução de OS encontrada."
              emptyIcon={<Eye className="h-12 w-12 text-gray-400" />}
            />
          </div>
        </div>

        {/* O sheet da OS: uma ordem só em qualquer status (sheet/SheetDaExecucao.tsx) */}
        {modalState.entity && (
          <BaseModal
            isOpen={modalState.isOpen}
            mode="view"
            entity={modalState.entity}
            title={tituloDoSheet(modalState.entity)}
            formFields={[]}
            topo={
              <SheetDaExecucao
                os={modalState.entity}
                pendingAction={pendingAction}
                onAcao={setPendingAction}
                onConfirmar={handleConfirmAction}
                temPermissao={temPermissao}
                ehCliente={ehCliente}
                onRecarregar={recarregar}
                onRascunhoDoComentario={(tem) => (rascunhoDoComentario.current = tem)}
              />
            }
            onClose={handleCloseModal}
            onSubmit={async () => {}}
            width="w-[1200px]"
            loading={loading}
          />
        )}
                <ConferirCodigo
          aberto={conferencia.aberta}
          onAbertoChange={(aberta) => setConferencia((atual) => ({ ...atual, aberta }))}
          codigoInicial={conferencia.codigo}
          onAbrirOS={(osId) => {
            setConferencia({ aberta: false, codigo: null });
            setSearchParams({ execucaoId: osId.trim() });
          }}
        />
      </Layout.Main>
    </Layout>
  );
}

export default ExecucaoOSPage;
