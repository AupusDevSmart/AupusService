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
import { ActionConfirmPanel, type PendingAction, type DadosDaConfirmacao, type RascunhoDoExecutar } from './ActionConfirmPanel';
import { AcoesDaOS } from './AcoesDaOS';
import { OQueFoiFeito } from './OQueFoiFeito';
import { CustosDaOS } from './CustosDaOS';
import { AnexosDaOS } from './AnexosDaOS';
import { BotaoPdfDaOS } from './BotaoPdfDaOS';
import { BotaoExportarOS } from './BotaoExportarOS';
import { ConferirCodigo } from './ConferirCodigo';
import { ComentariosDoRegistro } from '@/features/comentarios/components/ComentariosDoRegistro';
import {
  montarProgresso,
  tarefasPendentes,
  type ProgressoDaExecucao,
} from '../utils/progresso-da-execucao';
import { acoesDisponiveis, statusDaExecucao } from '../config/actions-config';
import { RecursosUsados } from './RecursosUsados';
import { ConcluirExecucao } from './ConcluirExecucao';
import { custoDoMaterialUsado, materiaisDaExecucao, type MaterialUsado } from '../utils/recursos-usados';
import { maoDeObraDasHoras, outrosDoPainel } from '../utils/custo-ate-agora';

// Tipos
import type { ExecucaoOS, ExecucaoOSFilters } from '../types';
import { execucaoOSTransitionsService, type ExecutarOSDto } from '@/services/execucao-os-transitions.service';
import type { IconeDeAcao } from '@/core/types/base';
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
  planta: 'all',
  equipamento: 'all',
  dataInicio: '',
  dataFim: '',
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
  // SN-62: a conferência do código do PDF, aberta pelo botão ou pelo link impresso (?conferir=)
  const [conferencia, setConferencia] = useState<{ aberta: boolean; codigo: string | null }>({ aberta: false, codigo: null });
  const temPermissao = useUserStore((s) => s.hasPermission);
  const ehCliente = useUserStore((s) => s.getUserRole()) === 'proprietario';

  // Tarefas e checklist da OS aberta, vivos: a seção "O que foi feito" grava
  // item a item, e o painel de Executar precisa saber o que ainda está pendente.
  const [progresso, setProgresso] = useState<ProgressoDaExecucao>({ tarefas: [] });
  // O material registrado na seção "usados", vivo: o custo até agora muda a cada registro
  const [materiaisVivos, setMateriaisVivos] = useState<MaterialUsado[] | null>(null);
  // As horas e os outros custos digitados no painel de concluir, ainda não gravados
  const [rascunho, setRascunho] = useState<RascunhoDoExecutar | null>(null);

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
    const os = modalState.entity;
    setProgresso(montarProgresso(os?.tarefas_os ?? [], os?.checklist ?? []));
    setMateriaisVivos(null);
  }, [modalState.entity]);

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

  // O editar grava o que a OS em andamento registra — consumo de material e
  // uso de ferramenta — e só o que mudou. Antes este submit descartava os dados
  // e fechava, e quem editava perdia tudo sem aviso (D1 da
  // SPEC-ATALHOS-E-ACOES-DA-OS). O resto do formulário é só leitura no editar.
  const handleSubmit = async (data: Partial<ExecucaoOS> & Record<string, unknown>) => {
    const entity = modalState.entity;
    if (!entity) return;

    const registros = registrosAlterados(
      {
        materiais: entity.materiaisConsumidos ?? [],
        ferramentas: entity.ferramentasUtilizadas ?? [],
      },
      {
        materiais: data.materiaisConsumidos ?? [],
        ferramentas: data.ferramentasUtilizadas ?? [],
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
      // Na OS em andamento, o consumo e o uso gravam na hora, na seção do topo: "Nada a salvar"
      // fazia parecer que o registrado lá não tinha ido
      toast({
        title: total > 0 ? 'Execução salva' : 'Nada a salvar no formulário',
        ...(total === 0 && { description: 'Materiais e ferramentas usados são salvos na hora, ao registrar.' }),
      });
      closeModal();
      await fetchItems(toApiParams);
    } catch (error) {
      toast({ title: 'Erro ao salvar a execução', description: formatApiError(error), variant: 'destructive' });
      throw error; // mantém o sheet aberto com o que foi digitado
    }
  };

  const rascunhoDoComentario = useRef(false);
  const handleCloseModal = () => {
    // Comentário digitado e não enviado não some calado ao fechar (SN-48)
    if (rascunhoDoComentario.current && !window.confirm('Há um comentário não enviado. Fechar e descartar?')) return;
    rascunhoDoComentario.current = false;
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
              onEdit={handleEdit}
              emptyMessage="Nenhuma execução de OS encontrada."
              emptyIcon={<Eye className="h-12 w-12 text-gray-400" />}
            />
          </div>
        </div>

        {/* Modal Genérico */}
        {modalState.entity && (() => {
          const status = statusDaExecucao(modalState.entity);
          const emExecucao = status === 'EM_EXECUCAO' || status === 'PAUSADA';
          const executada = status === 'EXECUTADA' || status === 'AUDITADA' || status === 'FINALIZADA';
          const temProgresso = progresso.tarefas.length > 0;
          const podeExecutar = temPermissao('execucao_os.manage', 'execucao_os.executar');
          // A OS em andamento se lê de cima para baixo (06/nov/2026): o que foi feito, o que foi
          // usado, as fotos, o custo até agora, os comentários e, por último, depois de tudo,
          // concluir — com o motivo do que faltou e o botão. O Executar sai do topo: lá, convidava
          // a concluir antes de marcar
          const concluirNoFim =
            modalState.mode !== 'create' && emExecucao && acoesDisponiveis(status, temPermissao).some((a) => a.acao === 'executar');
          const pendentes = tarefasPendentes(progresso).map((t) => ({ id: t.id, nome: t.nome }));
          // Concluindo: o painel do Executar aberto no fim (os custos vão para dentro dele)
          const concluindo = concluirNoFim && pendingAction === 'executar';
          const quadroDeCustos = modalState.entity?.custos ? (
            <div className="rounded-md border p-4">
              <CustosDaOS
                osId={modalState.entity.id}
                status={status ?? ''}
                custos={modalState.entity.custos}
                itensOrcamento={modalState.entity.itens_orcamento}
                aoVivo={
                  emExecucao
                    ? {
                        // O material da OS lida é a base: a seção "usados" só avisa quando muda
                        // (o efeito do filho roda antes do reset do pai, e a OS sem material
                        // ficava sem custo até agora)
                        material: custoDoMaterialUsado(materiaisVivos ?? materiaisDaExecucao(modalState.entity.materiaisConsumidos ?? [])),
                        maoDeObra: rascunho ? maoDeObraDasHoras(rascunho.horas, modalState.entity.tecnicos) : null,
                        outros: rascunho && modalState.entity.itens_orcamento ? outrosDoPainel(rascunho.outros) : null,
                      }
                    : null
                }
                // Na auditada, só quem gerencia: o auditor aprovou um custo (a API recusa igual)
                podeCorrigir={
                  status === 'AUDITADA'
                    ? temPermissao('execucao_os.manage')
                    : temPermissao('execucao_os.manage', 'execucao_os.executar')
                }
                onCorrigido={async () => {
                  // A lista da tabela também tem o custo real
                  const [atual] = await Promise.all([fetchOne(modalState.entity!.id), fetchItems(toApiParams)]);
                  if (atual) openModal(modalState.mode, atual);
                }}
              />
            </div>
          ) : null;
          return (
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
                    const anexos = (
                      <div className="rounded-md border p-4">
                        <AnexosDaOS
                          osId={modalState.entity!.id}
                          status={status}
                          soGerais={(emExecucao || executada) && temProgresso}
                          podeEditar={podeExecutar}
                        />
                      </div>
                    );
                    return (
                      <div className="space-y-4">
                        <div className="rounded-md border p-4">
                          {pendingAction && !(concluirNoFim && pendingAction === 'executar') ? (
                            // Confirmação da ação escolhida (na tabela ou aqui)
                            <ActionConfirmPanel
                              key={pendingAction}
                              action={pendingAction}
                              entity={modalState.entity}
                              onConfirm={handleConfirmAction}
                              onVoltar={() => setPendingAction(null)}
                              tarefasPendentes={pendentes}
                              podeInformarValorDaHora={temPermissao('execucao_os.manage')}
                            />
                          ) : (
                            <div className="space-y-3">
                              <AcoesDaOS
                                status={status}
                                temPermissao={temPermissao}
                                alteracoesPendentes={alteracoesPendentes}
                                onAcao={setPendingAction}
                                ocultar={concluirNoFim ? ['executar'] : []}
                                aviso={concluirNoFim ? 'Marque o que foi feito e o que foi usado; para concluir, desça até o fim.' : undefined}
                                bloqueadas={pendingAction === 'executar' ? 'Feche o painel "Concluir a execução", no fim, para escolher outra ação.' : undefined}
                              />
                              {/* O PDF da OS (SN-62): prévia antes de finalizar, com o código depois */}
                              <BotaoPdfDaOS os={modalState.entity!} />
                            </div>
                          )}
                        </div>

                        {/* O que foi feito: marca-se durante a execução; depois,
                            é o registro que o auditor e o relatório leem. */}
                        {(emExecucao || executada) && temProgresso && (
                          <div className="rounded-md border p-4">
                            <OQueFoiFeito
                              status={status}
                              osId={modalState.entity!.id}
                              progresso={progresso}
                              editavel={emExecucao && podeExecutar}
                              onChange={setProgresso}
                            />
                          </div>
                        )}

                        {/* O que foi usado, registrado no próprio sheet (no Visualizar também) */}
                        {emExecucao && (
                          <div className="rounded-md border p-4">
                            <RecursosUsados
                              key={modalState.entity!.id}
                              osId={modalState.entity!.id}
                              materiais={modalState.entity!.materiaisConsumidos}
                              ferramentas={modalState.entity!.ferramentasUtilizadas}
                              editavel={podeExecutar}
                              onMateriais={setMateriaisVivos}
                            />
                          </div>
                        )}

                        {/* Na OS em andamento, as fotos vêm logo depois do que foi usado */}
                        {concluirNoFim && anexos}

                        {/* SN-93: o custo com destaque. Com o painel de concluir aberto, ele vai para
                            dentro do painel, depois das horas e dos outros custos e antes do botão */}
                        {!concluindo && quadroDeCustos}

                        {/* A prova do que foi feito: fotos e documentos, com quem enviou e quando.
                            Na OS em andamento, vem antes de concluir */}
                        {!concluirNoFim && anexos}

                        {/* Conversa da equipe sobre a OS; o interno não aparece para o cliente (SN-48) */}
                        <div className="rounded-md border p-4">
                          <ComentariosDoRegistro
                            alvo="ordem_servico"
                            registroId={modalState.entity!.id}
                            podeComentar={temPermissao('execucao_os.manage', 'execucao_os.executar')}
                            ehCliente={ehCliente}
                            onRascunho={(tem) => (rascunhoDoComentario.current = tem)}
                          />
                        </div>
                      </div>
                    );
                  }
                : undefined
            }
            onClose={handleCloseModal}
            onSubmit={handleSubmit}
            width="w-[1200px]"
            loading={loading}
          >
            {/* O último do sheet, depois dos custos, dos comentários e do formulário: o botão fica lá embaixo */}
            {concluirNoFim && (
              <div className="rounded-md border p-4">
                <ConcluirExecucao
                  aberto={pendingAction === 'executar'}
                  onAbrir={() => setPendingAction('executar')}
                  onFechar={() => setPendingAction(null)}
                  entity={modalState.entity}
                  onConfirm={handleConfirmAction}
                  tarefasPendentes={pendentes}
                  totalDeTarefas={progresso.tarefas.length}
                  podeInformarValorDaHora={temPermissao('execucao_os.manage')}
                  bloqueado={pendingAction && pendingAction !== 'executar' ? 'Termine ou feche a ação aberta no topo antes de concluir.' : undefined}
                  onRascunho={setRascunho}
                  custos={quadroDeCustos}
                />
              </div>
            )}
          </BaseModal>
          );
        })()}
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
