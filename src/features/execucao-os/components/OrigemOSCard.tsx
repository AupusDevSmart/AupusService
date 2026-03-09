// src/features/execucao-os/components/OrigemOSCard.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, AlertTriangle, Wrench, Calendar } from 'lucide-react';

interface OrigemOSCardProps {
  value?: {
    origem?: string;
    planoManutencao?: any;
    programacaoOrigem?: any;
    anomalia?: any;
    tarefa?: any;
    _dadosCompletos?: any;
  };
  // Props individuais para compatibilidade (deprecated)
  origem?: string;
  planoManutencao?: any;
  programacaoOrigem?: any;
  anomalia?: any;
  tarefa?: any;
  _dadosCompletos?: any;
}

export const OrigemOSCard: React.FC<OrigemOSCardProps> = (props) => {
  // Aceitar dados via 'value' (quando vem do BaseForm) ou props individuais
  const data = props.value || props;

  const {
    origem = 'MANUAL',
    planoManutencao,
    programacaoOrigem,
    anomalia,
    tarefa,
    _dadosCompletos
  } = data;

  // Helper para extrair descrição de anomalia/tarefa
  const getDescricao = (obj: any): string => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    return obj.descricao || obj.titulo || obj.nome || '';
  };

  const anomaliaDesc = getDescricao(anomalia);
  const tarefaDesc = getDescricao(tarefa);

  const getOrigemLabel = (origem: string): string => {
    const labels: Record<string, string> = {
      'MANUAL': 'Manual',
      'PLANEJAMENTO': 'Planejamento',
      'EMERGENCIA': 'Emergência',
      'CORRETIVA': 'Corretiva',
      'PREVENTIVA': 'Preventiva',
      'PREDITIVA': 'Preditiva',
      'ANOMALIA': 'Anomalia',
      'PLANO_MANUTENCAO': 'Plano de Manutenção'
    };
    return labels[origem] || origem;
  };

  const getOrigemIcon = (origem: string) => {
    if (origem === 'ANOMALIA' || origem === 'EMERGENCIA') return AlertTriangle;
    if (origem === 'PLANO_MANUTENCAO' || origem === 'PREVENTIVA') return Calendar;
    if (origem === 'CORRETIVA' || origem === 'PREDITIVA') return Wrench;
    return FileText;
  };

  const OrigemIcon = getOrigemIcon(origem);

  return (
    <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
      <CardHeader className="pb-3 bg-gray-50 dark:bg-gray-800/50">
        <CardTitle className="text-sm flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <FileText className="h-4 w-4" />
          Origem da OS
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        {/* Tipo de Origem - Design minimalista */}
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tipo</div>
          <div className="flex items-center gap-2">
            <OrigemIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {getOrigemLabel(origem)}
            </span>
          </div>
        </div>

        {/* Anomalia - Se existir */}
        {anomaliaDesc && (
          <div className="border-t pt-3">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Anomalia</div>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              {anomaliaDesc}
            </div>
            {typeof anomalia === 'object' && anomalia.prioridade && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Prioridade: {anomalia.prioridade}
                {anomalia.status && ` • Status: ${anomalia.status}`}
              </div>
            )}
          </div>
        )}

        {/* Plano de Manutenção - Se existir */}
        {planoManutencao && (
          <div className="border-t pt-3">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Plano de Manutenção</div>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              {typeof planoManutencao === 'object' && planoManutencao.nome
                ? planoManutencao.nome
                : typeof planoManutencao === 'string'
                  ? planoManutencao
                  : 'N/A'}
            </div>
            {typeof planoManutencao === 'object' && planoManutencao.descricao && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {planoManutencao.descricao}
              </div>
            )}
          </div>
        )}

        {/* Programação de Origem - Se existir */}
        {programacaoOrigem && (
          <div className="border-t pt-3">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Programação</div>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              {typeof programacaoOrigem === 'object'
                ? (programacaoOrigem.codigo || programacaoOrigem.numero_programacao || 'N/A')
                : programacaoOrigem}
            </div>
            {typeof programacaoOrigem === 'object' && programacaoOrigem.descricao && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {programacaoOrigem.descricao}
              </div>
            )}
          </div>
        )}

        {/* Tarefa - Se existir */}
        {tarefaDesc && (
          <div className="border-t pt-3">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tarefa</div>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              {tarefaDesc}
            </div>
            {typeof tarefa === 'object' && tarefa.tarefa && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {tarefa.tarefa.categoria && `${tarefa.tarefa.categoria}`}
                {tarefa.tarefa.tipo_manutencao && ` • ${tarefa.tarefa.tipo_manutencao}`}
              </div>
            )}
          </div>
        )}

        {/* Mensagem quando não há informações adicionais */}
        {!planoManutencao && !programacaoOrigem && !anomaliaDesc && !tarefaDesc && origem === 'MANUAL' && (
          <div className="text-xs text-gray-500 dark:text-gray-400 italic">
            Ordem criada manualmente
          </div>
        )}
      </CardContent>
    </Card>
  );
};