// src/features/programacao-os/components/OrigemOSCard.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OrigemLinks } from '@/features/execucao-os/components/OrigemLinks';
import { useAnomalias } from '@/features/anomalias/hooks/useAnomalias';
import { AlertTriangle, FileText, Calendar, Wrench, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import PlanosManutencaoViewer from './PlanosManutencaoViewer';
import { solicitacoesServicoService } from '@/services/solicitacoes-servico.service';
import { tarefasApi, type TarefaApiResponse } from '@/services/tarefas.services';

interface OrigemOSCardProps {
  origem: string;
  dadosOrigem?: any;
  anomalia?: any;
  tarefas?: any[];
  planoManutencao?: any;
  planosSelecionados?: any[];
  tarefasPorPlano?: { [planoId: string]: { plano: any; tarefas: any[] } };
  solicitacaoServico?: any;
}

const formatarData = (dataField: any): string => {
  if (!dataField) return 'Data não informada';

  try {
    if (typeof dataField === 'string') {
      if (dataField.includes('-')) {
        const date = new Date(dataField);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
        }
      }

      if (dataField.includes('/')) {
        return dataField;
      }

      const date = new Date(dataField);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      }
    }

    return dataField.toString();
  } catch {
    return dataField.toString();
  }
};

const getOrigemLabel = (origem: string): string => {
  const labels: Record<string, string> = {
    'ANOMALIA': 'Anomalia',
    'PLANO_MANUTENCAO': 'Plano de Manutenção',
    'TAREFA': 'Tarefa',
    'SOLICITACAO_SERVICO': 'Solicitação de Serviço',
    'EMERGENCIA': 'Emergência',
    'CORRETIVA': 'Corretiva',
    'PREVENTIVA': 'Preventiva',
    'PREDITIVA': 'Preditiva',
    'PLANEJAMENTO': 'Planejamento'
  };
  return labels[origem] || origem;
};

/**
 * Um par rótulo → valor.
 *
 * As quatro origens mostram basicamente isso — local, ativo, condição,
 * prioridade, datas, solicitante — e cada uma montava do seu jeito, uma
 * embaixo da outra. Empilhado, o card de anomalia passava de 400px de altura
 * num sheet que já tem muito conteúdo.
 *
 * Some sozinho quando não há valor: campo vazio ocupando espaço é pior que
 * ausência.
 */
const Campo: React.FC<{ rotulo: string; children?: React.ReactNode }> = ({ rotulo, children }) => {
  if (children === null || children === undefined || children === '') return null;

  return (
    <div className="min-w-0">
      <p className="text-[11px] text-muted-foreground leading-tight">{rotulo}</p>
      <div className="text-xs text-foreground/90 truncate">{children}</div>
    </div>
  );
};

/**
 * Duas colunas no celular, quatro no desktop. É o que tira a altura do card:
 * seis campos empilhados viram duas linhas.
 */
const Grade: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-3">{children}</div>
);

/**
 * Abre a instrução por cima do sheet da OS.
 *
 * Vale para as três origens que têm instrução: a tarefa (uma por tarefa), a
 * anomalia (várias, via anomalias_instrucoes) e a solicitação de serviço
 * (várias, via solicitacoes_instrucoes). É na instrução que vivem as etapas,
 * os recursos e os anexos — o resto é rótulo.
 */
const BotaoInstrucao: React.FC<{ instrucaoId?: string | null; titulo?: string }> = ({
  instrucaoId,
  titulo = 'Ver instrução',
}) => {
  if (!instrucaoId) return null;
  return <OrigemLinks instrucaoId={instrucaoId} instrucaoRotulo={titulo} />;
};

/**
 * As instruções vinculadas a uma anomalia ou a uma solicitação.
 *
 * As duas aceitam VÁRIAS — `anomalias_instrucoes` e `solicitacoes_instrucoes` —
 * e as duas já trazem isso no detalhe, então é só listar. Antes o card mostrava
 * a descrição do problema e parava por aí: quem ia executar não tinha como
 * chegar no procedimento.
 */
const ListaDeInstrucoes: React.FC<{ instrucoes?: any[] }> = ({ instrucoes }) => {
  const lista = (instrucoes || [])
    .map((i: any) => i?.instrucao ?? i)
    .filter((i: any) => i?.id);

  if (lista.length === 0) return null;

  return (
    <div className="border-t pt-3">
      <p className="text-[11px] text-muted-foreground mb-1">
        Instruções ({lista.length})
      </p>
      {lista.map((i: any) => (
        <div key={i.id} className="flex items-center gap-3 py-2 border-t first:border-t-0">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-foreground/90 truncate" title={i.nome}>{i.nome}</p>
            {i.tag && <span className="font-mono text-[11px] text-muted-foreground">{i.tag}</span>}
          </div>
          <div className="shrink-0">
            <BotaoInstrucao instrucaoId={i.id} />
          </div>
        </div>
      ))}
    </div>
  );
};

const getOrigemIcon = (origem: string) => {
  if (origem === 'ANOMALIA' || origem === 'EMERGENCIA') return AlertTriangle;
  if (origem === 'PLANO_MANUTENCAO' || origem === 'PREVENTIVA' || origem === 'TAREFA') return Calendar;
  if (origem === 'SOLICITACAO_SERVICO') return FileText;
  if (origem === 'CORRETIVA' || origem === 'PREDITIVA') return Wrench;
  return FileText;
};

export const OrigemOSCard: React.FC<OrigemOSCardProps> = React.memo(({
  origem,
  dadosOrigem,
  anomalia,
  tarefas = [],
  planoManutencao: _planoManutencao,
  planosSelecionados: _planosSelecionados = [],
  tarefasPorPlano = {},
  solicitacaoServico
}) => {
  const [expanded, setExpanded] = useState(false);
  const { obterAnomalia, loading: anomaliaLoading, error: anomaliaError } = useAnomalias();
  const [anomaliaFromAPI, setAnomaliaFromAPI] = useState<any>(null);
  const [solicitacaoFromAPI, setSolicitacaoFromAPI] = useState<any>(null);
  const [solicitacaoLoading, setSolicitacaoLoading] = useState(false);
  const [tarefasFromAPI, setTarefasFromAPI] = useState<TarefaApiResponse[]>([]);
  const [tarefasLoading, setTarefasLoading] = useState(false);

  useEffect(() => {
    const anomaliaId = dadosOrigem?.anomaliaId || anomalia?.id;
    if (anomaliaId) {
      obterAnomalia(anomaliaId).then((result) => {
        if (result) {
          setAnomaliaFromAPI(result);
        }
      });
    }
  }, [dadosOrigem?.anomaliaId, anomalia?.id, obterAnomalia]);

  useEffect(() => {
    const solicitacaoId = dadosOrigem?.solicitacaoServicoId || solicitacaoServico?.id;
    if (solicitacaoId && !solicitacaoServico?.titulo) {
      setSolicitacaoLoading(true);
      solicitacoesServicoService.findOne(solicitacaoId)
        .then((result) => { if (result) setSolicitacaoFromAPI(result); })
        .catch(() => {})
        .finally(() => setSolicitacaoLoading(false));
    }
  }, [dadosOrigem?.solicitacaoServicoId, solicitacaoServico?.id, solicitacaoServico?.titulo]);

  /**
   * O que a OS congelou no momento em que foi gerada.
   *
   * É a fonte melhor que `dados_origem.tarefas_ids`: aquele campo nem sempre
   * traz os ids (uma programação criada a partir de tarefas grava só nomes e
   * contagem), e mesmo quando traz, buscar a tarefa viva mostra o que ela é
   * HOJE — não o que foi pedido. Sem isto o card ficava com o cabeçalho e um
   * "1 tarefa", sem dizer o que era para fazer.
   */
  const tarefasCongeladas = (tarefas || [])
    .map((t: any) => ({
      id: t.id,
      nome: t.nome_snapshot || t.instrucao_nome || t.tarefa?.nome || t.nome,
      tag: t.instrucao_tag || t.tarefa?.tag,
      instrucaoId: t.instrucao_id ?? t.tarefa?.instrucao_id ?? null,
      instrucaoNome: t.instrucao_nome || t.instrucao?.nome || null,
      planoNome: t.plano_nome || t.tarefa?.plano_manutencao?.nome || null,
      criticidade: t.criticidade_snapshot ?? t.criticidade ?? t.tarefa?.criticidade,
      frequencia: t.frequencia_snapshot || t.frequencia || t.tarefa?.frequencia,
      status: t.status,
    }))
    .filter((t) => t.nome);

  // Buscar detalhes das tarefas quando expandir card de origem TAREFA
  useEffect(() => {
    if (!expanded || origem !== 'TAREFA' || tarefasFromAPI.length > 0) return;
    // Ja temos o congelado: nao ha por que buscar a tarefa viva.
    if (tarefasCongeladas.length > 0) return;

    const tarefaIds: string[] = dadosOrigem?.tarefas_ids || [];
    if (tarefaIds.length === 0) return;

    setTarefasLoading(true);
    Promise.all(
      tarefaIds.map((id: string) =>
        tarefasApi.findOne(id.trim()).catch(() => null)
      )
    )
      .then((results) => {
        setTarefasFromAPI(results.filter((r): r is TarefaApiResponse => r !== null));
      })
      .finally(() => setTarefasLoading(false));
  }, [expanded, origem, dadosOrigem?.tarefas_ids]);

  const hasAnomaliaDetails = origem === 'ANOMALIA' && !!(dadosOrigem?.anomaliaId || anomalia?.id || anomalia);

  const hasPlanoDetails = (() => {
    if (origem !== 'PLANO_MANUTENCAO' && origem !== 'TAREFA') return false;
    const tarefasPorPlanoData = tarefasPorPlano && Object.keys(tarefasPorPlano).length > 0
      ? tarefasPorPlano
      : dadosOrigem?.tarefasPorPlano || {};
    const hasMultiplosPlanos = Object.keys(tarefasPorPlanoData).length > 0;
    const hasTarefasLegacy = tarefas?.length > 0 || dadosOrigem?.tarefasSelecionadas?.length > 0;
    return hasMultiplosPlanos || hasTarefasLegacy;
  })();

  const hasTarefaDetails = origem === 'TAREFA' && !!(
    tarefasCongeladas.length ||
    dadosOrigem?.tarefas_ids?.length ||
    dadosOrigem?.tarefas_nomes?.length ||
    dadosOrigem?.tarefas_tags?.length ||
    dadosOrigem?.tarefas_count
  );

  const hasSolicitacaoDetails = origem === 'SOLICITACAO_SERVICO' && !!(solicitacaoServico || dadosOrigem?.solicitacaoServicoId);

  const hasDetails = hasAnomaliaDetails || hasPlanoDetails || hasTarefaDetails || hasSolicitacaoDetails;

  const OrigemIcon = getOrigemIcon(origem);

  const renderAnomaliaDetails = () => {
    const a = anomaliaFromAPI || anomalia || dadosOrigem;
    const reportada = a?.createdAt || a?.created_at || a?.data;
    const atualizada = a?.updatedAt || a?.updated_at || a?.atualizadoEm;
    const critica = a?.prioridade === 'CRITICA' || a?.prioridade === 'ALTA';

    return (
      <div className="space-y-4">
        {anomaliaError && (
          <p className="text-xs text-destructive">Erro ao carregar dados da anomalia</p>
        )}

        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium text-foreground min-w-0">
              {a?.descricao || 'Descrição não disponível'}
            </p>
            <div className="flex items-center gap-1.5 shrink-0">
              {a?.prioridade && (
                <Badge variant={critica ? 'destructive' : 'secondary'} className="text-xs">
                  {a.prioridade}
                </Badge>
              )}
              {a?.status && <Badge variant="outline" className="text-xs">{a.status}</Badge>}
            </div>
          </div>

          {/* A anomalia tem condicao, anexos e instrucoes vinculadas que nao
              cabem aqui — o atalho abre o sheet dela por cima da OS. */}
          <OrigemLinks anomaliaId={a?.id} />
        </div>

        <Grade>
          <Campo rotulo="Local">{a?.localizacao?.local || a?.local}</Campo>
          <Campo rotulo="Ativo">{a?.localizacao?.ativo || a?.ativo}</Campo>
          <Campo rotulo="Condição">{a?.condicao}</Campo>
          <Campo rotulo="Identificada por">{a?.origem}</Campo>
          <Campo rotulo="Reportada em">{reportada ? formatarData(reportada) : null}</Campo>
          <Campo rotulo="Atualizada em">{atualizada ? formatarData(atualizada) : null}</Campo>
        </Grade>

        <ListaDeInstrucoes instrucoes={a?.anomalias_instrucoes || a?.instrucoes} />

        {a?.observacoes && (
          <div className="border-t pt-3">
            <p className="text-[11px] text-muted-foreground">Observações</p>
            <p className="text-xs text-foreground/90 leading-relaxed">{a.observacoes}</p>
          </div>
        )}
      </div>
    );
  };

  const renderPlanoDetails = () => {
    const tarefasPorPlanoData = tarefasPorPlano && Object.keys(tarefasPorPlano).length > 0
      ? tarefasPorPlano
      : dadosOrigem?.tarefasPorPlano || {};

    const hasMultiplosPlanos = Object.keys(tarefasPorPlanoData).length > 0;

    if (!hasMultiplosPlanos) return null;

    const tarefasIds: string[] = [];
    const planosIds: string[] = Object.keys(tarefasPorPlanoData);

    if (dadosOrigem?.tarefasSelecionadas && dadosOrigem.tarefasSelecionadas.length > 0) {
      dadosOrigem.tarefasSelecionadas.forEach((tarefaId: string) => {
        if (tarefaId && tarefaId.trim()) {
          tarefasIds.push(tarefaId.trim());
        }
      });
    } else if (tarefas && tarefas.length > 0) {
      tarefas.forEach((tarefa: any) => {
        const idReal = tarefa.tarefa_id || tarefa.id;
        if (idReal) {
          tarefasIds.push(idReal);
        }
      });
    }

    return (
      <PlanosManutencaoViewer
        tarefasIds={tarefasIds}
        planosIds={planosIds}
        title={`Planos de Manutenção (${planosIds.length}) - ${tarefasIds.length} Tarefas`}
        className=""
      />
    );
  };

  const renderTarefaDetails = () => {
    if (!dadosOrigem) return null;

    const frequenciaLabels: Record<string, string> = {
      DIARIA: 'Diária', SEMANAL: 'Semanal', QUINZENAL: 'Quinzenal',
      MENSAL: 'Mensal', BIMESTRAL: 'Bimestral', TRIMESTRAL: 'Trimestral',
      SEMESTRAL: 'Semestral', ANUAL: 'Anual', PERSONALIZADA: 'Personalizada',
    };

    /**
     * Uma tarefa por linha, com os dados nas colunas — e não um cartão por
     * tarefa com tudo empilhado dentro. Uma OS de plano traz várias tarefas, e
     * no formato antigo cada uma custava umas cinco linhas de altura.
     *
     * A descrição da instrução fica de fora da linha de propósito: é texto
     * longo e o lugar dela é o sheet da instrução, alcançável pelo checklist.
     */
    const linhaDeTarefa = (t: {
      id: string;
      nome: string;
      tag?: string;
      frequencia?: string;
      criticidade?: number;
      status?: string;
      instrucaoId?: string | null;
      instrucaoNome?: string | null;
    }) => (
      <div key={t.id} className="flex items-center gap-3 py-2 border-t first:border-t-0">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-foreground/90 truncate" title={t.nome}>{t.nome}</p>
          <span className="text-[11px] text-muted-foreground truncate block">
            {t.tag && <span className="font-mono">{t.tag} </span>}
            {t.instrucaoNome}
          </span>
        </div>

        <span className="hidden sm:block w-24 flex-shrink-0 text-[11px] text-muted-foreground truncate">
          {t.frequencia ? frequenciaLabels[t.frequencia] ?? t.frequencia : '—'}
        </span>

        <span className="hidden md:block w-20 flex-shrink-0 text-[11px] text-muted-foreground">
          {t.criticidade != null ? `Crit. ${t.criticidade}` : '—'}
        </span>

        {t.status && (
          <Badge variant="outline" className="text-[11px] shrink-0">
            {t.status === 'CONCLUIDA' ? 'Concluída' : 'Pendente'}
          </Badge>
        )}

        <div className="shrink-0">
          <BotaoInstrucao instrucaoId={t.instrucaoId} />
        </div>
      </div>
    );

    const daApi = tarefasFromAPI.map((t: any) => ({
      id: t.id,
      nome: t.nome,
      tag: t.tag,
      instrucaoId: t.instrucao_id ?? t.instrucao?.id ?? null,
      instrucaoNome: t.instrucao?.nome ?? null,
      planoNome: t.plano_manutencao?.nome ?? null,
      frequencia: t.frequencia,
      criticidade: t.criticidade,
    }));

    // O congelado ganha do buscado: é o que foi pedido, não o que a tarefa é hoje.
    const paraMostrar = tarefasCongeladas.length > 0 ? tarefasCongeladas : daApi;

    const planosDaOS = [
      ...new Set(paraMostrar.map((t: any) => t.planoNome).filter(Boolean)),
    ] as string[];

    const count =
      dadosOrigem.tarefas_count ||
      dadosOrigem.tarefas_ids?.length ||
      dadosOrigem.tarefas_nomes?.length ||
      paraMostrar.length ||
      0;

    return (
      <div className="space-y-4">
        <Grade>
          <Campo rotulo="Tarefas">{`${count} tarefa${count !== 1 ? 's' : ''}`}</Campo>
          {/* Uma OS pode juntar tarefas de planos diferentes; nesse caso o
              resumo diz quantos, e cada linha continua sendo a verdade. */}
          <Campo rotulo={planosDaOS.length > 1 ? 'Planos' : 'Plano'}>
            {planosDaOS.length > 1 ? `${planosDaOS.length} planos` : planosDaOS[0]}
          </Campo>
          <Campo rotulo="Instalação">{dadosOrigem.unidade_nome}</Campo>
          <Campo rotulo="Geração">{dadosOrigem.auto_gerada ? 'Automática' : null}</Campo>
        </Grade>

        {tarefasLoading && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Carregando detalhes das tarefas...
          </p>
        )}

        {paraMostrar.length > 0 && (
          <div className="border-t pt-1">{paraMostrar.map(linhaDeTarefa)}</div>
        )}

        {/* Sem id nem congelado, sobra o nome que a programação gravou. */}
        {paraMostrar.length === 0 && !tarefasLoading && dadosOrigem.tarefas_nomes?.length > 0 && (
          <div className="border-t pt-1">
            {dadosOrigem.tarefas_nomes.map((nome: string, i: number) => (
              <p key={i} className="text-xs text-foreground/90 py-2 border-t first:border-t-0">
                {nome}
              </p>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderSolicitacaoDetails = () => {
    const sol = solicitacaoFromAPI || solicitacaoServico || dadosOrigem;
    if (!sol) return null;

    const tipoLabels: Record<string, string> = {
      INSTALACAO: 'Instalação',
      MANUTENCAO_PREVENTIVA: 'Manutenção Preventiva',
      MANUTENCAO_CORRETIVA: 'Manutenção Corretiva',
      INSPECAO: 'Inspeção',
      CALIBRACAO: 'Calibração',
      MODIFICACAO: 'Modificação',
      REMOCAO: 'Remoção',
      CONSULTORIA: 'Consultoria',
      TREINAMENTO: 'Treinamento',
      OUTRO: 'Outro',
    };

    const urgente = sol.prioridade === 'URGENTE' || sol.prioridade === 'ALTA';

    return (
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {sol.titulo && <p className="text-sm font-medium text-foreground">{sol.titulo}</p>}
            {sol.numero && (
              <span className="font-mono text-xs text-muted-foreground">{sol.numero}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {sol.prioridade && (
              <Badge variant={urgente ? 'destructive' : 'secondary'} className="text-xs">
                {sol.prioridade}
              </Badge>
            )}
            {sol.status && <Badge variant="outline" className="text-xs">{sol.status}</Badge>}
          </div>
        </div>

        <Grade>
          <Campo rotulo="Tipo">{sol.tipo ? tipoLabels[sol.tipo] || sol.tipo : null}</Campo>
          <Campo rotulo="Local">{sol.local}</Campo>
          <Campo rotulo="Solicitante">{sol.solicitante_nome}</Campo>
          <Campo rotulo="Solicitada em">
            {sol.data_solicitacao ? formatarData(sol.data_solicitacao) : null}
          </Campo>
        </Grade>

        <ListaDeInstrucoes instrucoes={sol.instrucoes || sol.solicitacoes_instrucoes} />

        {sol.descricao && (
          <div className="border-t pt-3">
            <p className="text-[11px] text-muted-foreground">Descrição</p>
            <p className="text-xs text-foreground/90 leading-relaxed">{sol.descricao}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
      <CardHeader
        className="pb-3 bg-gray-50 dark:bg-gray-800/50 cursor-pointer select-none"
        onClick={() => hasDetails && setExpanded(!expanded)}
      >
        <CardTitle className="text-sm flex items-center justify-between text-gray-700 dark:text-gray-300">
          <div className="flex items-center gap-2">
            {(anomaliaLoading || solicitacaoLoading || tarefasLoading) ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <OrigemIcon className="h-4 w-4" />
            )}
            <span>Origem: {getOrigemLabel(origem)}</span>
          </div>
          {hasDetails && (
            expanded
              ? <ChevronUp className="h-4 w-4 text-gray-400" />
              : <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </CardTitle>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-4">
          {origem === 'ANOMALIA' && renderAnomaliaDetails()}
          {origem === 'PLANO_MANUTENCAO' && renderPlanoDetails()}
          {origem === 'TAREFA' && (renderPlanoDetails() || (hasTarefaDetails && renderTarefaDetails()))}
          {origem === 'SOLICITACAO_SERVICO' && renderSolicitacaoDetails()}
        </CardContent>
      )}
    </Card>
  );
});
