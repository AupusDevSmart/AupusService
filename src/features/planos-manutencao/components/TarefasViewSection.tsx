// src/features/planos-manutencao/components/TarefasViewSection.tsx - CORRIGIDO
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Settings,
  Tag,
  Hash
} from 'lucide-react';

// 🔧 Interface mais flexível para receber diferentes tipos de tarefa
interface TarefaFlexivel {
  id: string | number;
  nome: string;
  tag?: string;
  ordem: number;
  ativo: boolean;
  categoria: string;
  tipo_manutencao?: string;
  tempo_estimado: number;
  criticidade: number;
  status?: string;
}

interface TarefasViewSectionProps {
  tarefas?: TarefaFlexivel[] | any[];
  isVisible?: boolean;
}

const getCriticidadeColor = (criticidade: number) => {
  switch (criticidade) {
    case 1:
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 2:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 3:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 4:
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    case 5:
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};

const getCriticidadeLabel = (criticidade: number) => {
  switch (criticidade) {
    case 1: return 'Muito Baixa';
    case 2: return 'Baixa';
    case 3: return 'Média';
    case 4: return 'Alta';
    case 5: return 'Muito Alta';
    default: return 'N/A';
  }
};

const getCategoriaColor = (categoria: string) => {
  const cat = categoria?.toUpperCase() || '';
  switch (cat) {
    case 'MECANICA':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'ELETRICA':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'INSTRUMENTACAO':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    case 'LUBRIFICACAO':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'LIMPEZA':
      return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300';
    case 'INSPECAO':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    case 'CALIBRACAO':
      return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};

const formatTempo = (minutos: number): string => {
  if (!minutos || isNaN(minutos)) return '0min';
  
  if (minutos < 60) {
    return `${minutos}min`;
  }
  const horas = Math.floor(minutos / 60);
  const minutosRestantes = minutos % 60;
  return minutosRestantes > 0 ? `${horas}h ${minutosRestantes}min` : `${horas}h`;
};

// 🔧 Função para normalizar dados da tarefa
const normalizarTarefa = (tarefa: any): TarefaFlexivel => {
  return {
    id: tarefa.id || tarefa.tarefa_id || 'N/A',
    nome: tarefa.nome || tarefa.titulo || 'Tarefa sem nome',
    tag: tarefa.tag || `T-${tarefa.id || '000'}`,
    ordem: tarefa.ordem || tarefa.posicao || 0,
    ativo: tarefa.ativo ?? tarefa.ativa ?? true,
    categoria: tarefa.categoria || 'GERAL',
    tipo_manutencao: tarefa.tipo_manutencao || tarefa.tipo || 'PREVENTIVA',
    tempo_estimado: tarefa.tempo_estimado || tarefa.tempo || 0,
    criticidade: tarefa.criticidade || tarefa.prioridade || 3,
    status: tarefa.status || 'ATIVA'
  };
};

export const TarefasViewSection: React.FC<TarefasViewSectionProps> = ({ 
  tarefas, 
  isVisible = true 
}) => {
  console.log('🔍 TarefasViewSection - props recebidas:', { tarefas, isVisible });

  if (!isVisible) {
    return null;
  }

  // 🔧 Verificação mais robusta das tarefas
  if (!tarefas || !Array.isArray(tarefas) || tarefas.length === 0) {
    console.log('⚠️ TarefasViewSection - Nenhuma tarefa válida encontrada');
    return (
      <div className="p-6 text-center">
        <Settings className="h-12 w-12 mx-auto text-gray-400 mb-3" />
        <p className="text-gray-500 dark:text-gray-400">Nenhuma tarefa encontrada neste plano de manutenção.</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
          As tarefas podem estar em outro formato ou não foram carregadas ainda.
        </p>
      </div>
    );
  }

  // 🔧 Normalizar e ordenar tarefas
  const tarefasNormalizadas = tarefas.map(normalizarTarefa);
  console.log('📋 TarefasViewSection - Tarefas normalizadas:', tarefasNormalizadas);

  const tarefasOrdenadas = [...tarefasNormalizadas].sort((a, b) => a.ordem - b.ordem);

  // Calcular estatísticas
  const tarefasAtivas = tarefasNormalizadas.filter(t => t.ativo).length;
  const tempoTotal = tarefasNormalizadas.reduce((acc, t) => acc + (t.tempo_estimado || 0), 0);
  const criticidadeMedia = tarefasNormalizadas.length > 0 
    ? Math.round(tarefasNormalizadas.reduce((acc, t) => acc + (t.criticidade || 3), 0) / tarefasNormalizadas.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Debug Info - remover em produção */}
      <div className="text-xs text-gray-400 p-2 bg-gray-50 dark:bg-gray-800 rounded">
        Debug: {tarefasNormalizadas.length} tarefas processadas - {tarefasAtivas} ativas
      </div>

      {/* Cabeçalho e Estatísticas */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Tarefas do Plano ({tarefasNormalizadas.length})
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {tarefasAtivas} ativas • Tempo total estimado: {formatTempo(tempoTotal)}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {criticidadeMedia}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Criticidade Média
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Tarefas */}
      <div className="grid gap-4">
        {tarefasOrdenadas.map((tarefa, index) => (
          <div 
            key={`tarefa-${tarefa.id}-${index}`} 
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800"
          >
            <div className="space-y-3">
              {/* Linha 1: TAG, Nome e Status */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs font-mono">
                      <Tag className="h-3 w-3 mr-1" />
                      {tarefa.tag}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Hash className="h-3 w-3 mr-1" />
                      #{tarefa.ordem}
                    </Badge>
                  </div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    {tarefa.nome}
                  </h4>
                </div>
                
                <div className="flex items-center gap-2">
                  {tarefa.ativo ? (
                    <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Ativo
                    </Badge>
                  ) : (
                    <Badge className="text-xs bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">
                      <XCircle className="h-3 w-3 mr-1" />
                      Inativo
                    </Badge>
                  )}
                </div>
              </div>

              {/* Linha 2: Categoria, Tipo, Tempo e Criticidade */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <div className="text-gray-600 dark:text-gray-400 text-xs mb-1">Categoria</div>
                  <Badge className={`text-xs ${getCategoriaColor(tarefa.categoria)}`}>
                    {tarefa.categoria}
                  </Badge>
                </div>
                
                <div>
                  <div className="text-gray-600 dark:text-gray-400 text-xs mb-1">Tipo</div>
                  <Badge variant="outline" className="text-xs">
                    {(tarefa.tipo_manutencao || '').replace('_', ' ')}
                  </Badge>
                </div>
                
                <div>
                  <div className="text-gray-600 dark:text-gray-400 text-xs mb-1">Tempo</div>
                  <div className="flex items-center gap-1 text-sm text-gray-900 dark:text-gray-100">
                    <Clock className="h-3 w-3" />
                    {formatTempo(tarefa.tempo_estimado)}
                  </div>
                </div>
                
                <div>
                  <div className="text-gray-600 dark:text-gray-400 text-xs mb-1">Criticidade</div>
                  <Badge className={`text-xs ${getCriticidadeColor(tarefa.criticidade)}`}>
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {getCriticidadeLabel(tarefa.criticidade)}
                  </Badge>
                </div>
              </div>

              {/* Status da Tarefa */}
              {tarefa.status && tarefa.status !== 'ATIVA' && (
                <div>
                  <Badge 
                    variant="outline" 
                    className="text-xs"
                  >
                    Status: {tarefa.status}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Resumo Final */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {tarefasNormalizadas.length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Total de Tarefas
            </div>
          </div>
          
          <div>
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              {tarefasAtivas}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Tarefas Ativas
            </div>
          </div>
          
          <div>
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {formatTempo(tempoTotal)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Tempo Total
            </div>
          </div>
          
          <div>
            <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
              {getCriticidadeLabel(criticidadeMedia)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Criticidade Média
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};