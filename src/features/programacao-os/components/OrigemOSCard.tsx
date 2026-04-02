// src/features/programacao-os/components/OrigemOSCard.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAnomalias } from '@/features/anomalias/hooks/useAnomalias';
import {
  AlertTriangle,
  Settings,
  FileText,
  MapPin,
  Calendar,
  Wrench,
  Clock,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
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
  planoManutencao,
  planosSelecionados = [],
  tarefasPorPlano = {},
  solicitacaoServico
}) => {
  const [expanded, setExpanded] = useState(false);
  const { obterAnomalia, loading: anomaliaLoading, error: anomaliaError } = useAnomalias();
  const [anomaliaFromAPI, setAnomaliaFromAPI] = useState(null);
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

  // Buscar detalhes das tarefas quando expandir card de origem TAREFA
  useEffect(() => {
    if (!expanded || origem !== 'TAREFA' || tarefasFromAPI.length > 0) return;

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
    dadosOrigem?.tarefas_ids?.length ||
    dadosOrigem?.tarefas_nomes?.length ||
    dadosOrigem?.tarefas_tags?.length ||
    dadosOrigem?.tarefas_count
  );

  const hasSolicitacaoDetails = origem === 'SOLICITACAO_SERVICO' && !!(solicitacaoServico || dadosOrigem?.solicitacaoServicoId);

  const hasDetails = hasAnomaliaDetails || hasPlanoDetails || hasTarefaDetails || hasSolicitacaoDetails;

  const OrigemIcon = getOrigemIcon(origem);

  const renderAnomaliaDetails = () => {
    const anomaliaData = anomaliaFromAPI || anomalia || dadosOrigem;

    return (
      <div className="space-y-3">
        {anomaliaError && (
          <div className="text-xs text-red-600 dark:text-red-300 bg-red-100 dark:bg-red-900/50 p-2 rounded">
            Erro ao carregar dados da anomalia
          </div>
        )}
        <div>
          <h4 className="font-medium text-sm text-gray-800 dark:text-gray-200">
            {anomaliaData?.descricao || 'Descrição não disponível'}
          </h4>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-gray-500 dark:text-gray-400" />
            <span className="text-gray-700 dark:text-gray-300">
              {anomaliaData?.localizacao?.local || anomaliaData?.local || 'Local não informado'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Settings className="h-3 w-3 text-gray-500 dark:text-gray-400" />
            <span className="text-gray-700 dark:text-gray-300">
              {anomaliaData?.localizacao?.ativo || anomaliaData?.ativo || 'Ativo não informado'}
            </span>
          </div>
        </div>

        <div className="space-y-2 border-t border-gray-200 dark:border-gray-700 pt-2">
          {anomaliaData?.condicao && (
            <div className="flex items-center gap-1 text-xs">
              <span className="font-medium text-gray-600 dark:text-gray-400">Condição:</span>
              <span className="text-gray-700 dark:text-gray-300">{anomaliaData.condicao}</span>
            </div>
          )}
          {anomaliaData?.origem && (
            <div className="flex items-center gap-1 text-xs">
              <span className="font-medium text-gray-600 dark:text-gray-400">Origem:</span>
              <span className="text-gray-700 dark:text-gray-300">{anomaliaData.origem}</span>
            </div>
          )}
          {anomaliaData?.observacoes && (
            <div className="text-xs">
              <span className="font-medium text-gray-600 dark:text-gray-400">Observações:</span>
              <p className="text-gray-700 dark:text-gray-300 mt-1 leading-relaxed">
                {anomaliaData.observacoes}
              </p>
            </div>
          )}
        </div>

        {anomaliaData?.prioridade && (
          <div className="flex gap-2">
            <Badge
              variant={anomaliaData.prioridade === 'CRITICA' || anomaliaData.prioridade === 'ALTA' ? 'destructive' : 'secondary'}
              className="text-xs"
            >
              {anomaliaData.prioridade}
            </Badge>
            {anomaliaData.status && (
              <Badge variant="outline" className="text-xs">
                {anomaliaData.status}
              </Badge>
            )}
          </div>
        )}

        <div className="space-y-1 border-t border-gray-200 dark:border-gray-700 pt-2">
          {(anomaliaData?.createdAt || anomaliaData?.created_at || anomaliaData?.data) && (
            <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
              <Calendar className="h-3 w-3" />
              <span>
                Reportada em: {formatarData(anomaliaData.createdAt || anomaliaData.created_at || anomaliaData.data)}
              </span>
            </div>
          )}
          {(anomaliaData?.updatedAt || anomaliaData?.updated_at || anomaliaData?.atualizadoEm) && (
            <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
              <Clock className="h-3 w-3" />
              <span>
                Atualizada em: {formatarData(anomaliaData.updatedAt || anomaliaData.updated_at || anomaliaData.atualizadoEm)}
              </span>
            </div>
          )}
        </div>
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

    const count = dadosOrigem.tarefas_count || dadosOrigem.tarefas_ids?.length || 0;
    const unidadeNome = dadosOrigem.unidade_nome;
    const autoGerada = dadosOrigem.auto_gerada;

    const frequenciaLabels: Record<string, string> = {
      DIARIA: 'Diária', SEMANAL: 'Semanal', QUINZENAL: 'Quinzenal',
      MENSAL: 'Mensal', BIMESTRAL: 'Bimestral', TRIMESTRAL: 'Trimestral',
      SEMESTRAL: 'Semestral', ANUAL: 'Anual', PERSONALIZADA: 'Personalizada',
    };

    const categoriaLabels: Record<string, string> = {
      MECANICA: 'Mecânica', ELETRICA: 'Elétrica', INSTRUMENTACAO: 'Instrumentação',
      LUBRIFICACAO: 'Lubrificação', LIMPEZA: 'Limpeza', INSPECAO: 'Inspeção',
      CALIBRACAO: 'Calibração', OUTROS: 'Outros',
    };

    const tipoLabels: Record<string, string> = {
      PREVENTIVA: 'Preventiva', PREDITIVA: 'Preditiva', CORRETIVA: 'Corretiva',
      INSPECAO: 'Inspeção', VISITA_TECNICA: 'Visita Técnica',
    };

    return (
      <div className="space-y-3">
        {/* Resumo */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs">
            {count} tarefa{count !== 1 ? 's' : ''}
          </Badge>
          {unidadeNome && (
            <Badge variant="secondary" className="text-xs">{unidadeNome}</Badge>
          )}
          {autoGerada && (
            <Badge variant="secondary" className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
              Auto-gerada
            </Badge>
          )}
        </div>

        {/* Loading */}
        {tarefasLoading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Carregando detalhes das tarefas...
          </div>
        )}

        {/* Lista de tarefas com detalhes completos */}
        {tarefasFromAPI.length > 0 && (
          <div className="space-y-2">
            {tarefasFromAPI.map((tarefa) => (
              <div
                key={tarefa.id}
                className="border border-gray-200 dark:border-gray-700 rounded-md p-3 space-y-2"
              >
                {/* Header da tarefa */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-muted-foreground">{tarefa.tag}</span>
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                        {tarefa.nome}
                      </span>
                    </div>
                    {tarefa.descricao && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {tarefa.descricao}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant={tarefa.status === 'ATIVA' ? 'default' : 'secondary'}
                    className="text-xs shrink-0"
                  >
                    {tarefa.status}
                  </Badge>
                </div>

                {/* Detalhes em grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs">
                  {tarefa.categoria && (
                    <div>
                      <span className="text-muted-foreground">Categoria: </span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {categoriaLabels[tarefa.categoria] || tarefa.categoria}
                      </span>
                    </div>
                  )}
                  {tarefa.tipo_manutencao && (
                    <div>
                      <span className="text-muted-foreground">Tipo: </span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {tipoLabels[tarefa.tipo_manutencao] || tarefa.tipo_manutencao}
                      </span>
                    </div>
                  )}
                  {tarefa.frequencia && (
                    <div>
                      <span className="text-muted-foreground">Frequência: </span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {frequenciaLabels[tarefa.frequencia] || tarefa.frequencia}
                        {tarefa.frequencia === 'PERSONALIZADA' && tarefa.frequencia_personalizada
                          ? ` (${tarefa.frequencia_personalizada} dias)`
                          : ''}
                      </span>
                    </div>
                  )}
                  {tarefa.criticidade != null && (
                    <div>
                      <span className="text-muted-foreground">Criticidade: </span>
                      <span className="text-gray-700 dark:text-gray-300">{tarefa.criticidade}/5</span>
                    </div>
                  )}
                  {tarefa.duracao_estimada != null && (
                    <div>
                      <span className="text-muted-foreground">Duração: </span>
                      <span className="text-gray-700 dark:text-gray-300">{tarefa.duracao_estimada}h</span>
                    </div>
                  )}
                  {tarefa.condicao_ativo && (
                    <div>
                      <span className="text-muted-foreground">Condição: </span>
                      <span className="text-gray-700 dark:text-gray-300">{tarefa.condicao_ativo}</span>
                    </div>
                  )}
                </div>

                {/* Equipamento e plano */}
                <div className="flex items-center gap-3 text-xs flex-wrap">
                  {tarefa.equipamento && (
                    <div className="flex items-center gap-1">
                      <Settings className="h-3 w-3 text-muted-foreground" />
                      <span className="text-gray-700 dark:text-gray-300">{tarefa.equipamento.nome}</span>
                    </div>
                  )}
                  {tarefa.plano_manutencao && (
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3 text-muted-foreground" />
                      <span className="text-gray-700 dark:text-gray-300">{tarefa.plano_manutencao.nome}</span>
                    </div>
                  )}
                </div>

                {/* Execução */}
                {(tarefa.data_ultima_execucao || tarefa.numero_execucoes > 0) && (
                  <div className="flex items-center gap-3 text-xs border-t border-gray-100 dark:border-gray-700/50 pt-1.5">
                    {tarefa.data_ultima_execucao && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Última execução: {formatarData(tarefa.data_ultima_execucao)}
                        </span>
                      </div>
                    )}
                    {tarefa.numero_execucoes > 0 && (
                      <span className="text-muted-foreground">
                        ({tarefa.numero_execucoes} execuç{tarefa.numero_execucoes === 1 ? 'ão' : 'ões'})
                      </span>
                    )}
                  </div>
                )}

                {/* Sub-tarefas */}
                {tarefa.sub_tarefas && tarefa.sub_tarefas.length > 0 && (
                  <div className="border-t border-gray-100 dark:border-gray-700/50 pt-1.5">
                    <span className="text-xs text-muted-foreground">
                      Sub-tarefas ({tarefa.sub_tarefas.length}):
                    </span>
                    <ul className="mt-1 space-y-0.5">
                      {tarefa.sub_tarefas.map((st) => (
                        <li key={st.id} className="text-xs text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                          <span className="h-1 w-1 rounded-full bg-gray-400 shrink-0" />
                          {st.descricao}
                          {st.obrigatoria && (
                            <span className="text-destructive text-[10px]">*</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Fallback: se não conseguiu carregar da API, mostrar dados básicos */}
        {!tarefasLoading && tarefasFromAPI.length === 0 && (dadosOrigem.tarefas_tags?.length > 0 || dadosOrigem.tarefas_nomes?.length > 0) && (
          <div className="space-y-1">
            {(dadosOrigem.tarefas_tags || []).map((tag: string, i: number) => (
              <div key={tag} className="flex items-center gap-2 text-xs">
                <span className="font-mono text-muted-foreground">{tag}</span>
                {dadosOrigem.tarefas_nomes?.[i] && (
                  <span className="text-gray-700 dark:text-gray-300">{dadosOrigem.tarefas_nomes[i]}</span>
                )}
              </div>
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

    return (
      <div className="space-y-3">
        {/* Número e título */}
        {sol.numero && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-mono">{sol.numero}</Badge>
            {sol.status && (
              <Badge variant="secondary" className="text-xs">{sol.status}</Badge>
            )}
          </div>
        )}

        {sol.titulo && (
          <h4 className="font-medium text-sm text-gray-800 dark:text-gray-200">
            {sol.titulo}
          </h4>
        )}

        {sol.descricao && (
          <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
            {sol.descricao}
          </p>
        )}

        {/* Detalhes em grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          {sol.tipo && (
            <div>
              <span className="font-medium text-gray-600 dark:text-gray-400">Tipo: </span>
              <span className="text-gray-700 dark:text-gray-300">{tipoLabels[sol.tipo] || sol.tipo}</span>
            </div>
          )}
          {sol.prioridade && (
            <div>
              <span className="font-medium text-gray-600 dark:text-gray-400">Prioridade: </span>
              <Badge
                variant={sol.prioridade === 'URGENTE' || sol.prioridade === 'ALTA' ? 'destructive' : 'secondary'}
                className="text-xs"
              >
                {sol.prioridade}
              </Badge>
            </div>
          )}
          {sol.local && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-gray-500 dark:text-gray-400" />
              <span className="text-gray-700 dark:text-gray-300">{sol.local}</span>
            </div>
          )}
          {sol.solicitante_nome && (
            <div>
              <span className="font-medium text-gray-600 dark:text-gray-400">Solicitante: </span>
              <span className="text-gray-700 dark:text-gray-300">{sol.solicitante_nome}</span>
            </div>
          )}
        </div>

        {/* Data */}
        {sol.data_solicitacao && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
            <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
              <Calendar className="h-3 w-3" />
              <span>Solicitada em: {formatarData(sol.data_solicitacao)}</span>
            </div>
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
