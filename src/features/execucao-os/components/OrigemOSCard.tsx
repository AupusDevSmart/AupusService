// src/features/execucao-os/components/OrigemOSCard.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Calendar, MapPin } from 'lucide-react';

interface OrigemOSCardProps {
  value?: {
    origem?: string;
    planoManutencao?: string;
    programacaoOrigem?: string;
    anomalia?: { id: string; descricao: string } | string;
    tarefa?: { id: string; descricao: string } | string;
    _dadosCompletos?: any;
  };
  // Props individuais para compatibilidade (deprecated)
  origem?: string;
  planoManutencao?: string;
  programacaoOrigem?: string;
  anomalia?: { id: string; descricao: string } | string;
  tarefa?: { id: string; descricao: string } | string;
  _dadosCompletos?: any;
}

export const OrigemOSCard: React.FC<OrigemOSCardProps> = (props) => {
  // Aceitar dados via 'value' (quando vem do BaseForm) ou props individuais
  const data = props.value || props;

  const {
    origem = 'PLANEJAMENTO',
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
      'PLANEJAMENTO': 'Planejamento',
      'EMERGENCIA': 'Emergência',
      'CORRETIVA': 'Corretiva',
      'PREVENTIVA': 'Preventiva',
      'PREDITIVA': 'Preditiva'
    };
    return labels[origem] || origem;
  };

  const getOrigemColor = (origem: string): string => {
    const colors: Record<string, string> = {
      'PLANEJAMENTO': 'bg-blue-100 text-blue-800 border-blue-200',
      'EMERGENCIA': 'bg-red-100 text-red-800 border-red-200',
      'CORRETIVA': 'bg-orange-100 text-orange-800 border-orange-200',
      'PREVENTIVA': 'bg-green-100 text-green-800 border-green-200',
      'PREDITIVA': 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[origem] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <Card className="border-2">
      {/* ✅ RESPONSIVO: Header */}
      <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-4 md:px-6 py-2 sm:py-3">
        <CardTitle className="text-sm sm:text-base flex items-center gap-1.5 sm:gap-2">
          <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
          <span className="truncate">Origem da Ordem de Serviço</span>
        </CardTitle>
      </CardHeader>
      {/* ✅ RESPONSIVO: Content */}
      <CardContent className="space-y-2 sm:space-y-3 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
        <div className="grid grid-cols-1 gap-2 sm:gap-3">
          {/* ✅ RESPONSIVO: Origem */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">
              Tipo de Origem
            </span>
            <div className={`inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium border w-fit ${getOrigemColor(origem)}`}>
              <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
              <span className="truncate">{getOrigemLabel(origem)}</span>
            </div>
          </div>

          {/* ✅ RESPONSIVO: Plano de Manutenção */}
          {planoManutencao && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3 shrink-0" />
                <span className="truncate">Plano de Manutenção</span>
              </span>
              <div className="flex flex-col gap-0.5 text-green-700 bg-green-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded border border-green-200">
                {typeof planoManutencao === 'object' && planoManutencao.nome ? (
                  <>
                    <span className="text-xs sm:text-sm font-medium break-words">
                      {planoManutencao.nome}
                    </span>
                    {planoManutencao.descricao && (
                      <span className="text-xs break-words">
                        {planoManutencao.descricao}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-xs sm:text-sm font-medium break-words">
                    {typeof planoManutencao === 'string' ? planoManutencao : planoManutencao.nome || 'N/A'}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ✅ RESPONSIVO: Programação de Origem */}
          {programacaoOrigem && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <FileText className="h-3 w-3 shrink-0" />
                <span className="truncate">Programação de Origem</span>
              </span>
              <div className="flex flex-col gap-0.5 text-purple-700 bg-purple-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded border border-purple-200">
                {typeof programacaoOrigem === 'object' && (programacaoOrigem.codigo || programacaoOrigem.numero_programacao) ? (
                  <>
                    <span className="text-xs sm:text-sm font-medium font-mono break-words">
                      {programacaoOrigem.codigo || programacaoOrigem.numero_programacao}
                    </span>
                    {programacaoOrigem.descricao && (
                      <span className="text-xs break-words">
                        {programacaoOrigem.descricao}
                      </span>
                    )}
                  </>
                ) : typeof programacaoOrigem === 'string' ? (
                  <span className="text-xs sm:text-sm font-medium font-mono break-words">
                    {programacaoOrigem}
                  </span>
                ) : (
                  <span className="text-xs sm:text-sm font-medium">
                    N/A
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ✅ RESPONSIVO: Anomalia de Origem */}
          {anomaliaDesc && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <FileText className="h-3 w-3 shrink-0" />
                <span className="truncate">Anomalia de Origem</span>
              </span>
              <div className="flex flex-col gap-0.5 text-orange-700 bg-orange-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded border border-orange-200">
                <span className="text-xs sm:text-sm font-medium break-words">
                  {anomaliaDesc}
                </span>
                {typeof anomalia === 'object' && anomalia.prioridade && (
                  <span className="text-xs break-words">
                    Prioridade: {anomalia.prioridade} | Status: {anomalia.status || 'N/A'}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ✅ RESPONSIVO: Tarefa de Origem */}
          {tarefaDesc && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <FileText className="h-3 w-3 shrink-0" />
                <span className="truncate">Tarefa de Origem</span>
              </span>
              <div className="flex flex-col gap-0.5 text-blue-700 bg-blue-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded border border-blue-200">
                <span className="text-xs sm:text-sm font-medium break-words">
                  {tarefaDesc}
                </span>
                {typeof tarefa === 'object' && tarefa.tarefa && (
                  <span className="text-xs break-words">
                    {tarefa.tarefa.categoria && `Categoria: ${tarefa.tarefa.categoria}`}
                    {tarefa.tarefa.tipo_manutencao && ` | Tipo: ${tarefa.tarefa.tipo_manutencao}`}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Mensagem quando não há informações adicionais */}
          {!planoManutencao && !programacaoOrigem && !anomaliaDesc && !tarefaDesc && (
            <div className="text-xs text-muted-foreground italic">
              Sem informações adicionais de origem
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
