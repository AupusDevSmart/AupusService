// src/features/execucao-os/components/OrigemOSCard.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  AlertTriangle,
  Wrench,
  Calendar,
  FilePenLine,
  ChevronDown,
  ChevronUp,
  MapPin,
  Settings,
  Clock
} from 'lucide-react';

interface OrigemOSCardProps {
  value?: {
    origem?: string;
    planoManutencao?: any;
    programacaoOrigem?: any;
    anomalia?: any;
    tarefa?: any;
    solicitacaoServico?: any;
    _dadosCompletos?: any;
  };
  origem?: string;
  planoManutencao?: any;
  programacaoOrigem?: any;
  anomalia?: any;
  tarefa?: any;
  solicitacaoServico?: any;
  _dadosCompletos?: any;
}

const formatarData = (dataField: any): string => {
  if (!dataField) return '';
  try {
    if (typeof dataField === 'string') {
      if (dataField.includes('/')) return dataField;
      const date = new Date(dataField);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      }
    }
    return dataField.toString();
  } catch {
    return dataField.toString();
  }
};

export const OrigemOSCard: React.FC<OrigemOSCardProps> = (props) => {
  const [expanded, setExpanded] = useState(false);
  const data = props.value || props;

  const {
    origem = 'MANUAL',
    planoManutencao,
    programacaoOrigem,
    anomalia,
    tarefa,
    solicitacaoServico,
  } = data;

  const getOrigemLabel = (o: string): string => {
    const labels: Record<string, string> = {
      'MANUAL': 'Manual',
      'PLANEJAMENTO': 'Planejamento',
      'EMERGENCIA': 'Emergência',
      'CORRETIVA': 'Corretiva',
      'PREVENTIVA': 'Preventiva',
      'PREDITIVA': 'Preditiva',
      'ANOMALIA': 'Anomalia',
      'PLANO_MANUTENCAO': 'Plano de Manutenção',
      'SOLICITACAO_SERVICO': 'Solicitação de Serviço'
    };
    return labels[o] || o;
  };

  const getOrigemIcon = (o: string) => {
    if (o === 'ANOMALIA' || o === 'EMERGENCIA') return AlertTriangle;
    if (o === 'PLANO_MANUTENCAO' || o === 'PREVENTIVA') return Calendar;
    if (o === 'SOLICITACAO_SERVICO') return FilePenLine;
    if (o === 'CORRETIVA' || o === 'PREDITIVA') return Wrench;
    return FileText;
  };

  const OrigemIcon = getOrigemIcon(origem);

  const hasAnomalia = !!(anomalia && typeof anomalia === 'object');
  const hasPlano = !!(planoManutencao && (typeof planoManutencao === 'object' ? planoManutencao.nome : planoManutencao));
  const hasProgramacao = !!(programacaoOrigem && typeof programacaoOrigem === 'object');
  const hasTarefa = !!(tarefa && (typeof tarefa === 'object' ? (tarefa.nome || tarefa.descricao || tarefa.titulo) : tarefa));
  const hasSolicitacao = !!(solicitacaoServico && typeof solicitacaoServico === 'object');
  const hasDetails = hasAnomalia || hasPlano || hasProgramacao || hasTarefa || hasSolicitacao;

  return (
    <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
      <CardHeader
        className="pb-3 bg-gray-50 dark:bg-gray-800/50 cursor-pointer select-none"
        onClick={() => hasDetails && setExpanded(!expanded)}
      >
        <CardTitle className="text-sm flex items-center justify-between text-gray-700 dark:text-gray-300">
          <div className="flex items-center gap-2">
            <OrigemIcon className="h-4 w-4" />
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
        <CardContent className="pt-4 space-y-4">
          {/* Anomalia */}
          {hasAnomalia && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Anomalia</div>
              <div className="text-sm text-gray-800 dark:text-gray-200">
                {anomalia.descricao || 'Descrição não disponível'}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {(anomalia.local || anomalia.localizacao?.local) && (
                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <MapPin className="h-3 w-3" />
                    <span>{anomalia.localizacao?.local || anomalia.local}</span>
                  </div>
                )}
                {(anomalia.ativo || anomalia.localizacao?.ativo) && (
                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <Settings className="h-3 w-3" />
                    <span>{anomalia.localizacao?.ativo || anomalia.ativo}</span>
                  </div>
                )}
              </div>

              {(anomalia.condicao || anomalia.origem || anomalia.observacoes) && (
                <div className="space-y-1 border-t border-gray-200 dark:border-gray-700 pt-2 text-xs">
                  {anomalia.condicao && (
                    <div>
                      <span className="font-medium text-gray-600 dark:text-gray-400">Condição: </span>
                      <span className="text-gray-700 dark:text-gray-300">{anomalia.condicao}</span>
                    </div>
                  )}
                  {anomalia.origem && (
                    <div>
                      <span className="font-medium text-gray-600 dark:text-gray-400">Origem: </span>
                      <span className="text-gray-700 dark:text-gray-300">{anomalia.origem}</span>
                    </div>
                  )}
                  {anomalia.observacoes && (
                    <div>
                      <span className="font-medium text-gray-600 dark:text-gray-400">Obs: </span>
                      <span className="text-gray-700 dark:text-gray-300">{anomalia.observacoes}</span>
                    </div>
                  )}
                </div>
              )}

              {(anomalia.prioridade || anomalia.status) && (
                <div className="flex gap-2">
                  {anomalia.prioridade && (
                    <Badge
                      variant={anomalia.prioridade === 'CRITICA' || anomalia.prioridade === 'ALTA' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {anomalia.prioridade}
                    </Badge>
                  )}
                  {anomalia.status && (
                    <Badge variant="outline" className="text-xs">{anomalia.status}</Badge>
                  )}
                </div>
              )}

              {(anomalia.created_at || anomalia.createdAt || anomalia.updated_at || anomalia.updatedAt) && (
                <div className="space-y-1 border-t border-gray-200 dark:border-gray-700 pt-2 text-xs text-gray-500 dark:text-gray-400">
                  {(anomalia.created_at || anomalia.createdAt) && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>Reportada em: {formatarData(anomalia.created_at || anomalia.createdAt)}</span>
                    </div>
                  )}
                  {(anomalia.updated_at || anomalia.updatedAt) && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Atualizada em: {formatarData(anomalia.updated_at || anomalia.updatedAt)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Solicitação de Serviço */}
          {hasSolicitacao && (
            <div className={`space-y-2 ${hasAnomalia ? 'border-t border-gray-200 dark:border-gray-700 pt-3' : ''}`}>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Solicitação de Serviço</div>
              <div className="text-sm text-gray-800 dark:text-gray-200">
                {solicitacaoServico.titulo || solicitacaoServico.descricao || 'Sem descrição'}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
                {solicitacaoServico.numero && (
                  <div>N.° {solicitacaoServico.numero}</div>
                )}
                {solicitacaoServico.tipo && (
                  <div>Tipo: {solicitacaoServico.tipo}</div>
                )}
                {solicitacaoServico.local && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{solicitacaoServico.local}</span>
                  </div>
                )}
                {solicitacaoServico.solicitante_nome && (
                  <div>Solicitante: {solicitacaoServico.solicitante_nome}</div>
                )}
              </div>

              {(solicitacaoServico.prioridade || solicitacaoServico.status) && (
                <div className="flex gap-2">
                  {solicitacaoServico.prioridade && (
                    <Badge variant="secondary" className="text-xs">{solicitacaoServico.prioridade}</Badge>
                  )}
                  {solicitacaoServico.status && (
                    <Badge variant="outline" className="text-xs">{solicitacaoServico.status}</Badge>
                  )}
                </div>
              )}

              {solicitacaoServico.data_solicitacao && (
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>Solicitada em: {formatarData(solicitacaoServico.data_solicitacao)}</span>
                </div>
              )}
            </div>
          )}

          {/* Plano de Manutenção */}
          {hasPlano && (
            <div className={`space-y-2 ${(hasAnomalia || hasSolicitacao) ? 'border-t border-gray-200 dark:border-gray-700 pt-3' : ''}`}>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Plano de Manutenção</div>
              <div className="text-sm text-gray-800 dark:text-gray-200">
                {typeof planoManutencao === 'object' ? planoManutencao.nome : planoManutencao}
              </div>
              {typeof planoManutencao === 'object' && planoManutencao.descricao && (
                <div className="text-xs text-gray-600 dark:text-gray-400">{planoManutencao.descricao}</div>
              )}
            </div>
          )}

          {/* Programação de Origem */}
          {hasProgramacao && (
            <div className={`space-y-2 ${(hasAnomalia || hasSolicitacao || hasPlano) ? 'border-t border-gray-200 dark:border-gray-700 pt-3' : ''}`}>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Programação</div>
              <div className="text-sm text-gray-800 dark:text-gray-200">
                {programacaoOrigem.numero_programacao || programacaoOrigem.codigo || programacaoOrigem.descricao || 'N/A'}
              </div>
              {programacaoOrigem.descricao && programacaoOrigem.numero_programacao && (
                <div className="text-xs text-gray-600 dark:text-gray-400">{programacaoOrigem.descricao}</div>
              )}
              {programacaoOrigem.status && (
                <Badge variant="outline" className="text-xs">{programacaoOrigem.status}</Badge>
              )}
            </div>
          )}

          {/* Tarefa */}
          {hasTarefa && (
            <div className={`space-y-2 ${(hasAnomalia || hasSolicitacao || hasPlano || hasProgramacao) ? 'border-t border-gray-200 dark:border-gray-700 pt-3' : ''}`}>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Tarefa</div>
              <div className="text-sm text-gray-800 dark:text-gray-200">
                {typeof tarefa === 'object' ? (tarefa.nome || tarefa.descricao || tarefa.titulo) : tarefa}
              </div>
              {typeof tarefa === 'object' && (tarefa.categoria || tarefa.tipo_manutencao) && (
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {tarefa.categoria && tarefa.categoria}
                  {tarefa.categoria && tarefa.tipo_manutencao && ' · '}
                  {tarefa.tipo_manutencao && tarefa.tipo_manutencao}
                </div>
              )}
            </div>
          )}

          {/* Manual */}
          {!hasDetails && origem === 'MANUAL' && (
            <div className="text-xs text-gray-500 dark:text-gray-400 italic">
              Ordem criada manualmente
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};
