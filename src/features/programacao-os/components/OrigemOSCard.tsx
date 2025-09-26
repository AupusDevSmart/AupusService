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
  Loader2
} from 'lucide-react';
import PlanosManutencaoViewer from './PlanosManutencaoViewer';

interface OrigemOSCardProps {
  origem: string;
  dadosOrigem?: any;
  anomalia?: any;
  tarefas?: any[];
  planoManutencao?: any;
  // Novos campos para múltiplos planos
  planosSelecionados?: any[];
  tarefasPorPlano?: { [planoId: string]: { plano: any; tarefas: any[] } };
}

// Função utilitária para formatar datas
const formatarData = (dataField: any): string => {
  if (!dataField) return 'Data não informada';

  try {
    // Se é uma string de data ISO ou similar
    if (typeof dataField === 'string') {
      // Verificar se está no formato ISO (YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss)
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

      // Se está no formato DD/MM/YYYY, retornar como está
      if (dataField.includes('/')) {
        return dataField;
      }

      // Tentar parse direto
      const date = new Date(dataField);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      }
    }

    // Fallback: retornar o valor como string
    return dataField.toString();
  } catch (error) {
    console.error('Erro ao formatar data da anomalia:', error);
    return dataField.toString();
  }
};

export const OrigemOSCard: React.FC<OrigemOSCardProps> = React.memo(({
  origem,
  dadosOrigem,
  anomalia,
  tarefas = [],
  planoManutencao,
  planosSelecionados = [],
  tarefasPorPlano = {}
}) => {
  // Hook para carregar dados da anomalia da API
  const { obterAnomalia, loading: anomaliaLoading, error: anomaliaError } = useAnomalias();
  const [anomaliaFromAPI, setAnomaliaFromAPI] = useState(null);

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

  const renderAnomaliaCard = () => {
    const anomaliaId = dadosOrigem?.anomaliaId || anomalia?.id;
    if (!anomaliaId && !anomalia && !dadosOrigem?.anomaliaId) return null;

    // Usar dados da API se disponíveis, senão usar dados passados via props
    const anomaliaData = anomaliaFromAPI || anomalia || dadosOrigem;

    return (
      <Card className="border-red-200 bg-red-50 dark:bg-red-900/30 dark:border-red-700/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-red-700 dark:text-white">
            {anomaliaLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <AlertTriangle className="h-5 w-5" />
            )}
            Anomalia Origem
            {anomaliaLoading && <span className="text-xs font-normal">(carregando...)</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {anomaliaError && (
            <div className="text-xs text-red-600 dark:text-red-300 bg-red-100 dark:bg-red-900/50 p-2 rounded">
              Erro ao carregar dados da anomalia
            </div>
          )}
          <div>
            <h4 className="font-medium text-sm text-red-800 dark:text-white">
              {anomaliaData?.descricao || 'Descrição não disponível'}
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-red-600 dark:text-red-400" />
              <span className="text-red-700 dark:text-white">
                {anomaliaData?.localizacao?.local || anomaliaData?.local || 'Local não informado'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Settings className="h-3 w-3 text-red-600 dark:text-red-400" />
              <span className="text-red-700 dark:text-white">
                {anomaliaData?.localizacao?.ativo || anomaliaData?.ativo || 'Ativo não informado'}
              </span>
            </div>
          </div>

          {/* Mais informações da anomalia */}
          <div className="space-y-2 border-t border-red-200 dark:border-red-700/50 pt-2">
            {anomaliaData?.condicao && (
              <div className="flex items-center gap-1 text-xs">
                <span className="font-medium text-red-700 dark:text-red-300">Condição:</span>
                <span className="text-red-600 dark:text-white">{anomaliaData.condicao}</span>
              </div>
            )}
            {anomaliaData?.origem && (
              <div className="flex items-center gap-1 text-xs">
                <span className="font-medium text-red-700 dark:text-red-300">Origem:</span>
                <span className="text-red-600 dark:text-white">{anomaliaData.origem}</span>
              </div>
            )}
            {anomaliaData?.observacoes && (
              <div className="text-xs">
                <span className="font-medium text-red-700 dark:text-red-300">Observações:</span>
                <p className="text-red-600 dark:text-white mt-1 leading-relaxed">
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

          {/* Datas da anomalia */}
          <div className="space-y-1 border-t border-red-200 dark:border-red-700/50 pt-2">
            {(anomaliaData?.createdAt || anomaliaData?.created_at || anomaliaData?.data) && (
              <div className="flex items-center gap-1 text-xs text-red-600 dark:text-white">
                <Calendar className="h-3 w-3" />
                <span>
                  Reportada em: {formatarData(anomaliaData.createdAt || anomaliaData.created_at || anomaliaData.data)}
                </span>
              </div>
            )}
            {(anomaliaData?.updatedAt || anomaliaData?.updated_at || anomaliaData?.atualizadoEm) && (
              <div className="flex items-center gap-1 text-xs text-red-600 dark:text-white">
                <Clock className="h-3 w-3" />
                <span>
                  Atualizada em: {formatarData(anomaliaData.updatedAt || anomaliaData.updated_at || anomaliaData.atualizadoEm)}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };


  const renderMultiplosPlanosCard = () => {
    // Usar tarefasPorPlano dos dadosOrigem se não estiver na prop direta
    const tarefasPorPlanoData = tarefasPorPlano && Object.keys(tarefasPorPlano).length > 0
      ? tarefasPorPlano
      : dadosOrigem?.tarefasPorPlano || {};

    const hasMultiplosPlanos = Object.keys(tarefasPorPlanoData).length > 0;
    const hasTarefasLegacy = tarefas?.length > 0 || dadosOrigem?.tarefasSelecionadas?.length > 0;

    console.log('🔍 [OrigemOSCard] renderMultiplosPlanosCard chamado');
    console.log('🔍 [OrigemOSCard] tarefasPorPlano (prop):', tarefasPorPlano);
    console.log('🔍 [OrigemOSCard] dadosOrigem.tarefasPorPlano:', dadosOrigem?.tarefasPorPlano);
    console.log('🔍 [OrigemOSCard] tarefasPorPlanoData (final):', tarefasPorPlanoData);
    console.log('🔍 [OrigemOSCard] hasMultiplosPlanos:', hasMultiplosPlanos);
    console.log('🔍 [OrigemOSCard] tarefas:', tarefas);
    console.log('🔍 [OrigemOSCard] hasTarefasLegacy:', hasTarefasLegacy);

    if (!hasMultiplosPlanos && !hasTarefasLegacy) {
      console.log('❌ [OrigemOSCard] Retornando null - sem dados para exibir');
      return null;
    }

    // Se tem múltiplos planos, usar nova visualização
    if (hasMultiplosPlanos) {
      const totalTarefas = Object.values(tarefasPorPlanoData).reduce(
        (total, grupo) => total + grupo.tarefas.length,
        0
      );

      // Usar apenas tarefas que estão relacionadas à programação específica
      // Em vez de buscar todas as tarefas dos planos, usar as tarefas já carregadas
      const tarefasIds: string[] = [];
      const planosIds: string[] = [];

      // Extrair IDs dos planos
      Object.keys(tarefasPorPlanoData).forEach((planoId) => {
        planosIds.push(planoId);
      });

      // Usar apenas as tarefas reais dos dados de origem, não os IDs de relacionamento
      console.log('🔍 [OrigemOSCard] Verificando fonte de tarefas:');
      console.log('🔍 [OrigemOSCard] tarefas (array):', tarefas);
      console.log('🔍 [OrigemOSCard] dadosOrigem.tarefasSelecionadas:', dadosOrigem?.tarefasSelecionadas);

      // Priorizar sempre os IDs reais das tarefas dos dadosOrigem
      if (dadosOrigem?.tarefasSelecionadas && dadosOrigem.tarefasSelecionadas.length > 0) {
        console.log('✅ [OrigemOSCard] Usando tarefasSelecionadas dos dadosOrigem (IDs reais)');
        dadosOrigem.tarefasSelecionadas.forEach((tarefaId: string) => {
          console.log('🔍 [OrigemOSCard] TarefaId real encontrado:', tarefaId);
          if (tarefaId && tarefaId.trim()) {
            tarefasIds.push(tarefaId.trim());
          }
        });
      } else if (tarefas && tarefas.length > 0) {
        console.log('⚠️ [OrigemOSCard] Usando array de tarefas como fallback');
        tarefas.forEach((tarefa: any) => {
          console.log('🔍 [OrigemOSCard] Tarefa encontrada:', tarefa);
          // Usar tarefa_id se disponível, senão usar id
          const idReal = tarefa.tarefa_id || tarefa.id;
          if (idReal) {
            tarefasIds.push(idReal);
          }
        });
      }

      console.log('✅ [OrigemOSCard] IDs finais extraídos:', { tarefasIds, planosIds });
      console.log('✅ [OrigemOSCard] Renderizando PlanosManutencaoViewer com tarefas da programação:', { tarefasIds, planosIds });

      return (
        <PlanosManutencaoViewer
          tarefasIds={tarefasIds}
          planosIds={planosIds}
          title={`Planos de Manutenção (${Object.keys(tarefasPorPlanoData).length}) - ${tarefasIds.length} Tarefas`}
          className=""
        />
      );
    }

    return null;
  };

  const renderManualCard = () => {
    return (
      <Card className="border-gray-200 bg-gray-50 dark:bg-gray-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-gray-700 dark:text-gray-400">
            <FileText className="h-5 w-5" />
            Ordem de Serviço Manual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Esta ordem de serviço foi criada manualmente, sem origem específica de anomalia ou plano de manutenção.
          </p>
        </CardContent>
      </Card>
    );
  };

  // Renderizar baseado na origem
  const renderKey = Math.random().toString(36).substr(2, 9);
  console.log(`🔍 [OrigemOSCard-${renderKey}] Renderizando com origem:`, origem);
  console.log(`🔍 [OrigemOSCard-${renderKey}] Props recebidas:`, { origem, dadosOrigem, anomalia, tarefas, planoManutencao, planosSelecionados, tarefasPorPlano });

  switch (origem) {
    case 'ANOMALIA':
      console.log('🔍 [OrigemOSCard] Renderizando ANOMALIA');
      return renderAnomaliaCard();
    case 'PLANO_MANUTENCAO':
    case 'TAREFA':
      console.log('🔍 [OrigemOSCard] Renderizando PLANO_MANUTENCAO/TAREFA');
      return renderMultiplosPlanosCard();
    case 'MANUAL':
    default:
      console.log('🔍 [OrigemOSCard] Renderizando MANUAL');
      return renderManualCard();
  }
});