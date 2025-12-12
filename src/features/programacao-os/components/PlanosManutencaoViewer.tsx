// src/features/programacao-os/components/PlanosManutencaoViewer.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Calendar,
  Clock,
  ChevronDown,
  ChevronRight,
  Settings,
  CheckCircle,
  AlertTriangle,
  User,
  FileText,
  Wrench,
  Package,
  Users
} from 'lucide-react';
import { tarefasApi, TarefaApiResponse } from '@/services/tarefas.services';
import { planosManutencaoApi, PlanoManutencaoApiResponse } from '@/services/planos-manutencao.services';

// Usar tipos da API diretamente
type TarefaDetalhada = TarefaApiResponse & {
  sub_tarefas?: Array<{
    id: string;
    descricao: string;
    obrigatoria: boolean;
    ordem: number;
    tempo_estimado?: number;
  }>;
  recursos?: Array<{
    id: string;
    tipo: string;
    descricao: string;
    quantidade?: number;
    unidade?: string;
    obrigatorio?: boolean;
  }>;
};

type PlanoDetalhado = PlanoManutencaoApiResponse;

interface PlanosManutencaoViewerProps {
  tarefasIds: string[];
  planosIds?: string[];
  title?: string;
  className?: string;
}

const PlanosManutencaoViewer: React.FC<PlanosManutencaoViewerProps> = React.memo(({
  tarefasIds = [],
  planosIds = [],
  title = "Planos de Manutenção e Tarefas",
  className = ""
}) => {
  // Identificador único para evitar conflitos entre instâncias
  const instanceId = React.useRef(Math.random().toString(36).substr(2, 9));
  const [tarefas, setTarefas] = useState<TarefaDetalhada[]>([]);
  const [planos, setPlanos] = useState<PlanoDetalhado[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedPlanos, setExpandedPlanos] = useState<Set<string>>(new Set());
  const [expandedTarefas, setExpandedTarefas] = useState<Set<string>>(new Set());

  // ✅ ESTRATÉGIA ALTERNATIVA: Se IDs de tarefas falharem, carregar planos e usar suas tarefas
  useEffect(() => {
    const carregarDados = async () => {
      console.log('🔍 [PlanosViewer] INICIANDO carregamento:', { tarefasIds, planosIds });

      if (tarefasIds.length === 0 && planosIds.length === 0) {
        console.log('⚠️ [PlanosViewer] Sem IDs de tarefas nem planos para carregar');
        return;
      }

      setLoading(true);
      try {
        console.log('🔍 [PlanosViewer] ESTRATÉGIA 1: Tentando carregar tarefas individuais:', tarefasIds);

        // ESTRATÉGIA 1: Tentar carregar tarefas individuais
        const tarefasPromises = tarefasIds.map(async (id) => {
          try {
            return await tarefasApi.findOne(id);
          } catch (error) {
            console.warn('⚠️ [PlanosViewer] Tarefa não encontrada na API:', id);
            return null;
          }
        });

        const tarefasCarregadas = (await Promise.all(tarefasPromises))
          .filter(Boolean) as TarefaDetalhada[];

        console.log('✅ [PlanosViewer] Tarefas individuais carregadas:', tarefasCarregadas.length);

        // ESTRATÉGIA 2: Se nenhuma tarefa foi encontrada individualmente,
        // tentar carregar planos e usar suas tarefas
        if (tarefasCarregadas.length === 0) {
          console.log('🔄 [PlanosViewer] ESTRATÉGIA 2: Tarefas mockadas detectadas, carregando tarefas reais via planos...');

          // Combinar com planos explicitamente fornecidos
          const todosPlansIds = [...new Set(planosIds)];

          console.log('🔍 [PlanosViewer] Planos disponíveis para carregar:', todosPlansIds);

          if (todosPlansIds.length > 0) {
            console.log('🔍 [PlanosViewer] Carregando planos com suas tarefas:', todosPlansIds);

            const planosPromises = todosPlansIds.map(async (id) => {
              try {
                return await planosManutencaoApi.findOne(id, true); // incluir tarefas
              } catch (error) {
                console.warn('⚠️ [PlanosViewer] Erro ao carregar plano:', id, error);
                return null;
              }
            });

            const planosCarregados = (await Promise.all(planosPromises))
              .filter(Boolean) as PlanoDetalhado[];

            console.log('✅ [PlanosViewer] Planos carregados:', planosCarregados.length);
            setPlanos(planosCarregados);

            // Extrair tarefas dos planos carregados
            const todasTarefasDoPlano: TarefaDetalhada[] = [];
            planosCarregados.forEach(plano => {
              if (plano.tarefas && plano.tarefas.length > 0) {
                todasTarefasDoPlano.push(...plano.tarefas as TarefaDetalhada[]);
              }
            });

            console.log('✅ [PlanosViewer] Tarefas extraídas dos planos:', todasTarefasDoPlano.length);
            setTarefas(todasTarefasDoPlano);
          } else {
            console.log('❌ [PlanosViewer] Não há IDs de planos para carregar - tarefas têm IDs mockados');
            // Definir estado para mostrar mensagem informativa
            setTarefas([]);
            setPlanos([]);
          }
        } else {
          // Se tarefas foram encontradas individualmente, carregar seus planos
          setTarefas(tarefasCarregadas);

          const planosIdsFromTarefas = [...new Set(
            tarefasCarregadas
              .map(tarefa => tarefa.plano_manutencao_id || (tarefa as any).plano_id)
              .filter(Boolean)
          )];

          const todosPlansIds = [...new Set([...planosIds, ...planosIdsFromTarefas])];

          if (todosPlansIds.length > 0) {
            const planosPromises = todosPlansIds.map(async (id) => {
              try {
                return await planosManutencaoApi.findOne(id, true);
              } catch (error) {
                console.warn('⚠️ [PlanosViewer] Erro ao carregar plano:', id, error);
                return null;
              }
            });

            const planosCarregados = (await Promise.all(planosPromises))
              .filter(Boolean) as PlanoDetalhado[];

            console.log('✅ [PlanosViewer] Planos carregados:', planosCarregados.length);
            // Não incluir tarefas dos planos no estado quando já temos tarefas individuais
            // para evitar duplicação na renderização
            setPlanos(planosCarregados);
          }
        }

      } catch (error) {
        console.error('❌ [PlanosViewer] Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [tarefasIds, planosIds]);

  const togglePlanoExpanded = (planoId: string) => {
    const newExpanded = new Set(expandedPlanos);
    if (newExpanded.has(planoId)) {
      newExpanded.delete(planoId);
    } else {
      newExpanded.add(planoId);
    }
    setExpandedPlanos(newExpanded);
  };

  const toggleTarefaExpanded = (tarefaId: string) => {
    const newExpanded = new Set(expandedTarefas);
    if (newExpanded.has(tarefaId)) {
      newExpanded.delete(tarefaId);
    } else {
      newExpanded.add(tarefaId);
    }
    setExpandedTarefas(newExpanded);
  };

  const getCriticidadeBadge = (criticidade: number) => {
    const configs = {
      1: { color: 'bg-muted text-foreground dark:bg-muted dark:text-foreground', label: 'Baixa' },
      2: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', label: 'Baixa-Média' },
      3: { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300', label: 'Média' },
      4: { color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300', label: 'Alta' },
      5: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', label: 'Crítica' }
    };
    const config = configs[criticidade as keyof typeof configs] || configs[3];
    return (
      <Badge className={`${config.color} text-xs`}>
        {config.label} ({criticidade}/5)
      </Badge>
    );
  };

  const getCategoriasIcons = (categoria: string) => {
    const icons = {
      MECANICA: <Wrench className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
      ELETRICA: <Settings className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />,
      INSTRUMENTACAO: <Settings className="h-4 w-4 text-purple-600 dark:text-purple-400" />,
      LUBRIFICACAO: <Package className="h-4 w-4 text-green-600 dark:text-green-400" />,
      LIMPEZA: <CheckCircle className="h-4 w-4 text-teal-600 dark:text-teal-400" />,
      INSPECAO: <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />,
      CALIBRACAO: <Settings className="h-4 w-4 text-red-600 dark:text-red-400" />,
    };
    return icons[categoria as keyof typeof icons] || <FileText className="h-4 w-4 text-gray-600 dark:text-gray-400" />;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
            <span className="ml-2 text-muted-foreground">Carregando dados...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tarefasIds.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
            <p>Nenhuma tarefa de plano de manutenção vinculada</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Estado para quando há tarefas mas são mockadas e não há planos
  if (!loading && tarefas.length === 0 && planos.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500 dark:text-orange-400" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 mx-auto mb-2 text-orange-400 dark:text-orange-500" />
            <p className="text-orange-600 dark:text-orange-400 font-medium mb-2">Tarefas com referências inválidas</p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Esta programação possui tarefas com IDs que não existem na base de dados.
              As tarefas podem ter sido criadas com dados mockados ou removidas posteriormente.
            </p>
            <Badge variant="outline" className="mt-3 text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-700">
              {tarefasIds.length} tarefa{tarefasIds.length !== 1 ? 's' : ''} com problema{tarefasIds.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          {title}
          <Badge variant="secondary" className="ml-auto">
            {planos.length} plano{planos.length !== 1 ? 's' : ''}, {tarefas.length} tarefa{tarefas.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {planos.map((plano, planoIndex) => {
          const tarefasDoPlano = tarefas.filter(tarefa =>
            (tarefa.plano_manutencao_id || (tarefa as any).plano_id) === plano.id
          );
          const isExpanded = expandedPlanos.has(plano.id);

          return (
            <Card key={`${instanceId.current}-plano-${planoIndex}-${plano.id}`} className="border-l-4 border-l-blue-500 dark:border-l-blue-400">
              <Collapsible open={isExpanded} onOpenChange={() => togglePlanoExpanded(plano.id)}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full p-4 h-auto justify-start hover:bg-muted/50"
                  >
                    <div className="flex items-center w-full">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground mr-2" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground mr-2" />
                      )}
                      <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3" />
                      <div className="text-left flex-1">
                        <div className="font-medium text-foreground">{plano.nome}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                          <span>{plano.equipamento?.codigo}</span>
                          <span>•</span>
                          <span>{plano.equipamento?.tipo_equipamento}</span>
                          {plano.equipamento?.planta && (
                            <>
                              <span>•</span>
                              <span>{plano.equipamento.planta.nome}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700">
                        {tarefasDoPlano.length} tarefa{tarefasDoPlano.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="px-4 pb-4 space-y-3">
                    {tarefasDoPlano.map((tarefa, tarefaIndex) => {
                      const tarefaExpanded = expandedTarefas.has(tarefa.id);

                      return (
                        <Card key={`${instanceId.current}-plano-${planoIndex}-tarefa-${tarefaIndex}-${tarefa.id}`} className="ml-6 border-l-2 border-l-border">
                          <Collapsible open={tarefaExpanded} onOpenChange={() => toggleTarefaExpanded(tarefa.id)}>
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="ghost"
                                className="w-full p-3 h-auto justify-start hover:bg-muted/50"
                              >
                                <div className="flex items-center w-full">
                                  {tarefaExpanded ? (
                                    <ChevronDown className="h-3 w-3 text-muted-foreground mr-2" />
                                  ) : (
                                    <ChevronRight className="h-3 w-3 text-muted-foreground mr-2" />
                                  )}
                                  {getCategoriasIcons(tarefa.categoria)}
                                  <div className="text-left flex-1 ml-2">
                                    <div className="font-medium text-sm text-foreground flex items-center gap-2">
                                      <span>{tarefa.nome}</span>
                                      <Badge variant="outline" className="text-xs font-mono">
                                        {tarefa.tag}
                                      </Badge>
                                    </div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                                      <span>{tarefa.categoria}</span>
                                      <span>•</span>
                                      <span>{tarefa.tipo_manutencao}</span>
                                      <span>•</span>
                                      <Clock className="h-3 w-3" />
                                      <span>{tarefa.duracao_estimada}h</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {getCriticidadeBadge(tarefa.criticidade)}
                                  </div>
                                </div>
                              </Button>
                            </CollapsibleTrigger>

                            <CollapsibleContent>
                              <div className="px-3 pb-3 space-y-3">
                                {/* Descrição da Tarefa */}
                                <div className="bg-muted/50 dark:bg-muted/30 rounded p-3">
                                  <p className="text-sm text-foreground">{tarefa.descricao}</p>
                                  {tarefa.observacoes && (
                                    <p className="text-xs text-muted-foreground mt-2 italic">
                                      Observações: {tarefa.observacoes}
                                    </p>
                                  )}
                                </div>

                                {/* Detalhes técnicos */}
                                <div className="grid grid-cols-2 gap-4 text-xs">
                                  <div>
                                    <span className="font-medium text-foreground">Frequência:</span>
                                    <span className="ml-2">{tarefa.frequencia}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-foreground">Condição:</span>
                                    <span className="ml-2">{tarefa.condicao_ativo}</span>
                                  </div>
                                  {tarefa.responsavel && (
                                    <div className="col-span-2">
                                      <span className="font-medium text-foreground">Responsável:</span>
                                      <span className="ml-2 flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        {tarefa.responsavel}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Sub-tarefas */}
                                {tarefa.sub_tarefas && tarefa.sub_tarefas.length > 0 && (
                                  <div>
                                    <h5 className="font-medium text-xs text-foreground mb-2 flex items-center gap-1">
                                      <CheckCircle className="h-3 w-3" />
                                      Sub-tarefas ({tarefa.sub_tarefas.length})
                                    </h5>
                                    <div className="space-y-1">
                                      {tarefa.sub_tarefas.map((subTarefa, subTarefaIndex) => (
                                        <div key={`${instanceId.current}-sub-${subTarefaIndex}-${subTarefa.id}`} className="flex items-center gap-2 text-xs bg-card rounded p-2 border">
                                          <span className="font-mono text-muted-foreground">{subTarefa.ordem}</span>
                                          <span className="flex-1">{subTarefa.descricao}</span>
                                          {subTarefa.obrigatoria && (
                                            <Badge variant="outline" className="text-xs text-red-600 dark:text-red-400 border-red-200 dark:border-red-700">
                                              Obrigatória
                                            </Badge>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Recursos */}
                                {tarefa.recursos && tarefa.recursos.length > 0 && (
                                  <div>
                                    <h5 className="font-medium text-xs text-foreground mb-2 flex items-center gap-1">
                                      <Package className="h-3 w-3" />
                                      Recursos ({tarefa.recursos.length})
                                    </h5>
                                    <div className="space-y-1">
                                      {tarefa.recursos.map((recurso, recursoIndex) => (
                                        <div key={`${instanceId.current}-recurso-${recursoIndex}-${recurso.id}`} className="flex items-center gap-2 text-xs bg-card rounded p-2 border">
                                          <Badge variant="outline" className="text-xs">
                                            {recurso.tipo}
                                          </Badge>
                                          <span className="flex-1">{recurso.descricao}</span>
                                          {recurso.quantidade && (
                                            <span className="text-muted-foreground">
                                              {recurso.quantidade} {recurso.unidade || 'UN'}
                                            </span>
                                          )}
                                          {recurso.obrigatorio && (
                                            <Badge variant="outline" className="text-xs text-red-600 dark:text-red-400 border-red-200 dark:border-red-700">
                                              Obrigatório
                                            </Badge>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        </Card>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
});

export default PlanosManutencaoViewer;