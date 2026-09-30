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
import { RefreshCw, Download, Eye } from 'lucide-react';
import { useGenericModal } from '@/hooks/useGenericModal';

// Hooks e configurações da feature
import { useExecucaoOSApi } from '../hooks/useExecucaoOSApi';
import { useExecucaoOSFilters } from '../hooks/useExecucaoOSFilters';
import { execucaoOSTableColumns } from '../config/table-config';
import { createExecucaoOSTableActions } from '../config/actions-config';
import { ActionConfirmPanel, type PendingAction } from './ActionConfirmPanel';
import { AcoesDaOS } from './AcoesDaOS';
import { OQueFoiFeito } from './OQueFoiFeito';
import {
  geraisObrigatoriosPendentes,
  montarProgresso,
  tarefasPendentes,
  type ProgressoDaExecucao,
} from '../utils/progresso-da-execucao';
import { statusDaExecucao } from '../config/actions-config';

// Tipos
import type { ExecucaoOS, ExecucaoOSFilters } from '../types';
import { execucaoOSTransitionsService } from '@/services/execucao-os-transitions.service';
import { toast } from '@/hooks/use-toast';
import { formatApiError } from '@/utils/api-error';
import { execucaoOSApi } from '@/services/execucao-os.service';
import { registrosAlterados } from '../utils/registro-da-execucao';
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
  limit: LINHAS_POR_PAGINA_PADRAO,
};

export function ExecucaoOSPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [linhasPorPagina, setLinhasPorPagina] = useLinhasPorPagina('execucao-os');
  const [filters, setFilters] = useState<ExecucaoOSFilters>(() => ({
    ...initialFilters,
    limit: linhasPorPagina,
  }));
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const temPermissao = useUserStore((s) => s.hasPermission);

  // Tarefas e checklist da OS aberta, vivos: a seção "O que foi feito" grava
  // item a item, e o painel de Executar precisa saber o que ainda está pendente.
  const [progresso, setProgresso] = useState<ProgressoDaExecucao>({ tarefas: [], gerais: [] });

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
  const { filterConfigs, formFields, formGroups, toApiParams } = useExecucaoOSFilters(filters);

  // Modal genérico
  const { modalState, openModal, closeModal } = useGenericModal<ExecucaoOS>();

  useEffect(() => {
    const os = modalState.entity as (ExecucaoOS & { checklist?: never[]; tarefas_os?: never[] }) | null;
    setProgresso(montarProgresso(os?.tarefas_os ?? [], os?.checklist ?? []));
  }, [modalState.entity]);

  // ============================
  // View-first action handlers
  // ============================

  const openViewWithAction = async (execucao: ExecucaoOS, action: PendingAction) => {
    try {
      const dadosCompletos = await fetchOne(execucao.id);
      setPendingAction(action);
      openModal('view', dadosCompletos || execucao);
    } catch (error) {
      console.error('Erro ao buscar detalhes:', error);
      setPendingAction(action);
      openModal('view', execucao);
    }
  };

  // A linha da tabela pode vir sem materiais/ferramentas: o sheet abre com a OS
  // completa, senão o editar mostraria cartões vazios e salvaria em cima disso.
  const completa = async (execucao: ExecucaoOS): Promise<ExecucaoOS> => {
    try {
      return (await fetchOne(execucao.id)) || execucao;
    } catch {
      return execucao;
    }
  };

  const handleView = async (execucao: ExecucaoOS) => {
    setPendingAction(null);
    openModal('view', await completa(execucao));
  };

  const handleEdit = async (execucao: ExecucaoOS) => {
    setPendingAction(null);
    const status = (execucao.statusExecucao || execucao.status)?.toUpperCase();
    const detalhe = await completa(execucao);
    openModal(status === 'FINALIZADA' || status === 'CANCELADA' ? 'view' : 'edit', detalhe);
  };

  // Confirm action handler - recebe objeto com todos os campos do painel
  const handleConfirmAction = async (data: Record<string, any>) => {
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
          await execucaoOSTransitionsService.executar(entity.id, data as any);
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
      toast({ title: actionLabels[pendingAction] || 'Acao realizada' });

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
  const abertoPelaUrl = useRef<string | null>(null);
  useEffect(() => {
    const execucaoIdParam = searchParams.get('execucaoId');

    if (execucaoIdParam && abertoPelaUrl.current !== execucaoIdParam) {
      const abrirModalAutomatico = async () => {
        try {
          // Sempre a OS completa: a linha da tabela nao traz checklist, e a
          // secao "O que foi feito" abria sem os itens.
          const execucaoEncontrada = await fetchOne(execucaoIdParam);

          if (execucaoEncontrada) {
            openModal('view', execucaoEncontrada);
          }

          setSearchParams({});
        } catch (error) {
          console.error('Erro ao buscar execução para abrir modal:', error);
          setSearchParams({});
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

  // O editar grava o que a OS em andamento registra — consumo de material e
  // uso de ferramenta — e só o que mudou. Antes este submit descartava os dados
  // e fechava, e quem editava perdia tudo sem aviso (D1 da
  // SPEC-ATALHOS-E-ACOES-DA-OS). O resto do formulário é só leitura no editar.
  const handleSubmit = async (data: Partial<ExecucaoOS> & Record<string, unknown>) => {
    const entity = modalState.entity;
    if (!entity) return;

    const registros = registrosAlterados(
      {
        materiais: (entity.materiaisConsumidos ?? []) as never[],
        ferramentas: (entity.ferramentasUtilizadas ?? []) as never[],
      },
      {
        materiais: (data.materiaisConsumidos ?? []) as never[],
        ferramentas: (data.ferramentasUtilizadas ?? []) as never[],
      },
    );

    try {
      if (registros.materiais.length > 0) {
        await execucaoOSApi.registrarMateriais(entity.id, registros.materiais);
      }
      if (registros.ferramentas.length > 0) {
        await execucaoOSApi.registrarFerramentas(entity.id, registros.ferramentas);
      }
      const total = registros.materiais.length + registros.ferramentas.length;
      toast({ title: total > 0 ? 'Execução salva' : 'Nada a salvar' });
      closeModal();
      await fetchItems(toApiParams);
    } catch (error) {
      toast({ title: 'Erro ao salvar a execução', description: formatApiError(error), variant: 'destructive' });
      throw error; // mantém o sheet aberto com o que foi digitado
    }
  };

  const handleCloseModal = () => {
    setPendingAction(null);
    closeModal();
  };

  const getModalEntity = () => {
    if (!modalState.entity) return null;
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
          <div className="sm:flex-1 sm:min-h-0">
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
                page: currentPage,
                limit: filters.limit || LINHAS_POR_PAGINA_PADRAO,
                total,
                totalPages,
              }}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
              onView={handleView}
              onEdit={handleEdit}
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
            topo={
              modalState.mode === 'view' || modalState.mode === 'edit'
                ? ({ alteracoesPendentes }) => {
                    const status = statusDaExecucao(modalState.entity);
                    const emExecucao = status === 'EM_EXECUCAO' || status === 'PAUSADA';
                    const executada = status === 'EXECUTADA' || status === 'AUDITADA' || status === 'FINALIZADA';
                    const temProgresso = progresso.tarefas.length > 0 || progresso.gerais.length > 0;
                    return (
                      <div className="space-y-4">
                        <div className="rounded-md border p-4">
                          {pendingAction ? (
                            // Confirmação da ação escolhida (na tabela ou aqui)
                            <ActionConfirmPanel
                              key={pendingAction}
                              action={pendingAction}
                              entity={modalState.entity}
                              onConfirm={handleConfirmAction}
                              onVoltar={() => setPendingAction(null)}
                              tarefasPendentes={tarefasPendentes(progresso).map((t) => ({ id: t.id, nome: t.nome }))}
                              itensObrigatoriosPendentes={geraisObrigatoriosPendentes(progresso)}
                            />
                          ) : (
                            <AcoesDaOS
                              status={status}
                              temPermissao={temPermissao}
                              alteracoesPendentes={alteracoesPendentes}
                              onAcao={setPendingAction}
                            />
                          )}
                        </div>

                        {/* O que foi feito: marca-se durante a execução; depois,
                            é o registro que o auditor e o relatório leem. */}
                        {(emExecucao || executada) && temProgresso && (
                          <div className="rounded-md border p-4">
                            <OQueFoiFeito
                              osId={modalState.entity!.id}
                              progresso={progresso}
                              editavel={emExecucao && temPermissao('execucao_os.view')}
                              onChange={setProgresso}
                            />
                          </div>
                        )}
                      </div>
                    );
                  }
                : undefined
            }
            onClose={handleCloseModal}
            onSubmit={handleSubmit}
            width="w-[1200px]"
            loading={loading}
          />
        )}
      </Layout.Main>
    </Layout>
  );
}

export default ExecucaoOSPage;
