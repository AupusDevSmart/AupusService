// src/features/programacao-os/components/MultiplePlanosSelector.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Search,
  Settings,
  CheckCircle2,
  Clock,
  Wrench,
  MapPin,
  Building2,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useOrigemDados } from '../hooks/useOrigemDados';
import { usePlantas } from '@/features/plantas/hooks/usePlantas';
import { useUnidadesByPlanta } from '@/features/unidades/hooks/useUnidades';

interface TarefasPorPlano {
  [planoId: string]: {
    plano: any;
    tarefas: any[];
    expanded: boolean;
  };
}

interface MultiplePlanosValue {
  tipo: 'PLANO_MANUTENCAO';
  plantaId?: string;
  unidadeId?: string; // Adicionar unidade
  planosSelecionados: string[];
  tarefasSelecionadas: string[];
  tarefasPorPlano: TarefasPorPlano;
}

interface MultiplePlanosSelectorProps {
  value: MultiplePlanosValue;
  onChange: (value: MultiplePlanosValue) => void;
  onLocalAtivoChange?: (local: string, ativo: string) => void;
  disabled?: boolean;
}

export const MultiplePlanosSelector: React.FC<MultiplePlanosSelectorProps> = ({
  value,
  onChange,
  onLocalAtivoChange,
  disabled = false
}) => {
  const {
    planosDisponiveis,
    carregarPlanos,
    gerarTarefasDoPlano,
    loading: loadingPlanos
  } = useOrigemDados();

  const {
    plantas,
    carregarPlantasSimples,
    loading: loadingPlantas
  } = usePlantas();

  const {
    unidades,
    isLoading: loadingUnidades
  } = useUnidadesByPlanta(value.plantaId || undefined);

  const [searchTerm, setSearchTerm] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const lastPlantaIdRef = useRef<string | null>(null);
  const lastUnidadeIdRef = useRef<string | null>(null);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Carregar plantas ao montar
  useEffect(() => {
    carregarPlantasSimples();

    // Cleanup function
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ✅ Executar apenas uma vez ao montar

  // Carregar planos quando planta ou unidade mudar
  useEffect(() => {
    const plantaChanged = value.plantaId !== lastPlantaIdRef.current;
    const unidadeChanged = value.unidadeId !== lastUnidadeIdRef.current;

    if (plantaChanged || unidadeChanged) {
      console.log('🔄 [MultiplePlanosSelector] Mudança detectada:', {
        plantaId: value.plantaId,
        unidadeId: value.unidadeId,
        plantaChanged,
        unidadeChanged
      });

      lastPlantaIdRef.current = value.plantaId ?? null;
      lastUnidadeIdRef.current = value.unidadeId ?? null;

      // Prioridade: unidade > planta
      if (value.unidadeId) {
        console.log('🎯 [MultiplePlanosSelector] Carregando planos por UNIDADE:', value.unidadeId);
        carregarPlanos(value.plantaId, value.unidadeId);
      } else if (value.plantaId) {
        console.log('🎯 [MultiplePlanosSelector] Carregando planos por PLANTA:', value.plantaId);
        carregarPlanos(value.plantaId);
      }
    }
  }, [value.plantaId, value.unidadeId]); // Removido carregarPlanos da dependência


  // Filtrar planos baseado na busca
  const planosFiltrados = planosDisponiveis.filter(plano =>
    plano.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plano.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePlantaChange = (plantaId: string) => {
    const novoValor: MultiplePlanosValue = {
      tipo: 'PLANO_MANUTENCAO',
      plantaId,
      unidadeId: undefined, // Reset unidade
      planosSelecionados: [],
      tarefasSelecionadas: [],
      tarefasPorPlano: {}
    };

    onChange(novoValor);
  };

  const handleUnidadeChange = (unidadeId: string) => {
    // Adicionar pequena transição visual
    setIsTransitioning(true);

    // Limpar timeout anterior se existir
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }

    // Atualizar valor imediatamente para resposta rápida
    const novoValor: MultiplePlanosValue = {
      ...value,
      unidadeId: unidadeId || undefined,
      planosSelecionados: [], // Reset planos quando mudar unidade
      tarefasSelecionadas: [],
      tarefasPorPlano: {}
    };

    onChange(novoValor);

    // Remover indicador de transição após um curto período
    transitionTimeoutRef.current = setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };

  const handlePlanoToggle = (planoId: string) => {
    const cleanPlanoId = planoId.trim(); // Limpar espaços extras
    const jaSelecionado = value.planosSelecionados.includes(cleanPlanoId);

    if (jaSelecionado) {
      // Remover plano
      const novosPlanos = value.planosSelecionados.filter(id => id !== cleanPlanoId);
      const novoTarefasPorPlano = { ...value.tarefasPorPlano };
      delete novoTarefasPorPlano[cleanPlanoId];

      const novasTarefas = value.tarefasSelecionadas.filter(tarefaId => {
        return Object.values(novoTarefasPorPlano).some(grupo =>
          grupo.tarefas.some(tarefa => tarefa.id === tarefaId)
        );
      });

      onChange({
        ...value,
        planosSelecionados: novosPlanos,
        tarefasSelecionadas: novasTarefas,
        tarefasPorPlano: novoTarefasPorPlano
      });
    } else {
      // Adicionar plano
      const plano = planosDisponiveis.find(p => p.id.trim() === cleanPlanoId);
      if (!plano) return;

      // Carregar tarefas primeiro
      gerarTarefasDoPlano(cleanPlanoId, ['1'])
        .then(tarefas => {
          console.log('🔍 [MULTIPLOS PLANOS] Tarefas carregadas para plano', cleanPlanoId, ':', tarefas);

          // Adicionar plano com tarefas já carregadas
          onChange({
            ...value,
            planosSelecionados: [...value.planosSelecionados, cleanPlanoId],
            tarefasPorPlano: {
              ...value.tarefasPorPlano,
              [cleanPlanoId]: {
                plano,
                tarefas: tarefas || [],
                expanded: true
              }
            }
          });
        })
        .catch(error => {
          console.error('Erro ao carregar tarefas:', error);

          // Adicionar plano mesmo com erro nas tarefas
          onChange({
            ...value,
            planosSelecionados: [...value.planosSelecionados, cleanPlanoId],
            tarefasPorPlano: {
              ...value.tarefasPorPlano,
              [cleanPlanoId]: {
                plano,
                tarefas: [],
                expanded: true
              }
            }
          });
        });
    }
  };

  const handleTarefaToggle = (tarefaId: string, checked: boolean) => {
    const tarefaIdTrimmed = tarefaId.trim();
    const tarefasAtuais = value.tarefasSelecionadas || [];
    const novasTarefas = checked
      ? [...tarefasAtuais, tarefaIdTrimmed]
      : tarefasAtuais.filter(id => id !== tarefaIdTrimmed);

    const novoValor: MultiplePlanosValue = {
      ...value,
      tarefasSelecionadas: novasTarefas
    };

    onChange(novoValor);
    updateLocalAtivoFromTarefas(novasTarefas, value.tarefasPorPlano);
  };

  const handleExpandirPlano = (planoId: string) => {
    const novoTarefasPorPlano = {
      ...value.tarefasPorPlano,
      [planoId]: {
        ...value.tarefasPorPlano[planoId],
        expanded: !value.tarefasPorPlano[planoId]?.expanded
      }
    };

    const novoValor: MultiplePlanosValue = {
      ...value,
      tarefasPorPlano: novoTarefasPorPlano
    };

    onChange(novoValor);
  };

  const updateLocalAtivoFromTarefas = (tarefasSelecionadas: string[], tarefasPorPlano: TarefasPorPlano) => {
    if (!onLocalAtivoChange || tarefasSelecionadas.length === 0) {
      if (onLocalAtivoChange) {
        onLocalAtivoChange('', '');
      }
      return;
    }

    // Pegar a primeira tarefa selecionada para definir local/ativo
    for (const grupo of Object.values(tarefasPorPlano)) {
      const tarefaEncontrada = grupo.tarefas.find(t => tarefasSelecionadas.includes(t.id));
      if (tarefaEncontrada) {
        const local = tarefaEncontrada.local || 'Local não definido';
        const ativo = tarefaEncontrada.ativo || tarefaEncontrada.tag || 'Ativo não definido';
        onLocalAtivoChange(local, ativo);
        break;
      }
    }
  };

  const handleSelectAllTarefasPlano = (planoId: string) => {
    const grupo = value.tarefasPorPlano[planoId];
    if (!grupo) return;

    const todasTarefas = grupo.tarefas
      .map(t => t.id?.toString().trim() || '')
      .filter(id => id !== ''); // Apenas filtrar IDs vazios

    const tarefasAtuais = value.tarefasSelecionadas.filter(id =>
      !grupo.tarefas.some(t => t.id?.toString().trim() === id)
    );
    const novasTarefas = [...tarefasAtuais, ...todasTarefas];

    const novoValor: MultiplePlanosValue = {
      ...value,
      tarefasSelecionadas: novasTarefas
    };

    onChange(novoValor);
    updateLocalAtivoFromTarefas(novasTarefas, value.tarefasPorPlano);
  };

  const handleDeselectAllTarefasPlano = (planoId: string) => {
    const grupo = value.tarefasPorPlano[planoId];
    if (!grupo) return;

    const novasTarefas = value.tarefasSelecionadas.filter(id =>
      !grupo.tarefas.some(t => t.id === id)
    );

    const novoValor: MultiplePlanosValue = {
      ...value,
      tarefasSelecionadas: novasTarefas
    };

    onChange(novoValor);
    updateLocalAtivoFromTarefas(novasTarefas, value.tarefasPorPlano);
  };

  const renderPlantaSelector = () => {
    const plantaSelecionada = plantas.find(p => p.id?.trim() === value.plantaId?.trim());

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-foreground flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Passo 1: Selecione a Planta
          </Label>
          {!plantaSelecionada && (
            <span className="text-xs text-muted-foreground">Obrigatório</span>
          )}
        </div>

        {plantaSelecionada ? (
          <Card className="border-primary bg-primary/10">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <div>
                    <h4 className="font-medium text-sm">{plantaSelecionada.nome}</h4>
                    <p className="text-xs text-muted-foreground">{plantaSelecionada.localizacao}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePlantaChange('')}
                  disabled={disabled}
                >
                  Trocar
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : loadingPlantas ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid gap-2">
            {plantas.map((planta) => {
            const isSelected = value.plantaId === planta.id;

            return (
              <Card
                key={planta.id}
                className={`cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary/20'
                    : 'border-border bg-card hover:bg-accent hover:text-accent-foreground hover:border-primary/50'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => {
                  if (!disabled) {
                    handlePlantaChange(planta.id);
                  }
                }}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <div>
                        <h4 className="font-medium text-sm">{planta.nome}</h4>
                        <p className="text-xs text-muted-foreground">{planta.localizacao}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          </div>
        )}
      </div>
    );
  };

  const renderUnidadeSelector = () => {
    if (!value.plantaId) return null;

    const unidadeSelecionada = unidades.find(u => u.id?.trim() === value.unidadeId?.trim());

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            Passo 2: Selecione a Unidade (Opcional)
          </Label>
          <span className="text-xs text-muted-foreground">Filtrar por unidade específica</span>
        </div>

        {unidadeSelecionada ? (
          <Card className="border-primary bg-primary/10">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <h4 className="font-medium text-sm">{unidadeSelecionada.nome}</h4>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUnidadeChange('')}
                  disabled={disabled}
                >
                  Limpar
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : loadingUnidades ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid gap-2 max-h-48 overflow-y-auto border border-border rounded-lg p-2 bg-muted/30">
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleUnidadeChange('')}
              disabled={disabled}
            >
              <Building2 className="h-4 w-4 mr-2" />
              Todas as Unidades
            </Button>
            {unidades.map((unidade) => (
              <Card
                key={unidade.id}
                className="cursor-pointer transition-all duration-200 border-border bg-card hover:bg-accent hover:text-accent-foreground hover:border-primary/50"
                onClick={() => {
                  if (!disabled) {
                    handleUnidadeChange(unidade.id);
                  }
                }}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    <h4 className="font-medium text-sm">{unidade.nome}</h4>
                  </div>
                </CardContent>
              </Card>
            ))}

            {unidades.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                <Building2 className="h-6 w-6 mx-auto mb-2 opacity-50" />
                <p className="text-xs">Nenhuma unidade encontrada</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderPlanosSelector = () => {
    if (!value.plantaId) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary" />
            Passo 3: Selecione os Planos de Manutenção
          </Label>
          {!loadingPlanos && planosDisponiveis.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {planosDisponiveis.length} plano(s) disponíveis
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar plano de manutenção..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={disabled || loadingPlanos}
            className="bg-background border-border text-foreground placeholder:text-muted-foreground transition-opacity duration-200"
          />
        </div>

        <div className={`max-h-64 overflow-y-auto space-y-2 border border-border rounded-lg p-2 bg-muted/30 relative transition-opacity duration-300 ${
          isTransitioning ? 'opacity-70' : 'opacity-100'
        }`}>
          {loadingPlanos || isTransitioning ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <p className="text-xs text-muted-foreground">
                {isTransitioning ? 'Atualizando planos...' : 'Carregando planos...'}
              </p>
            </div>
          ) : planosFiltrados.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum plano encontrado para esta planta</p>
            </div>
          ) : (
            planosFiltrados.map((plano) => {
              const isSelected = value.planosSelecionados.includes(plano.id.trim());

              return (
                <Card
                  key={plano.id}
                  className={`cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-950/50 shadow-sm ring-1 ring-green-500/20'
                      : 'border-border bg-card hover:bg-accent hover:text-accent-foreground hover:border-green-500/50'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => {
                    if (!disabled) {
                      handlePlanoToggle(plano.id);
                    }
                  }}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                            isSelected
                              ? 'border-green-500 bg-green-500'
                              : 'border-gray-300'
                          }`}>
                            {isSelected && <div className="w-2 h-2 bg-white rounded-sm"></div>}
                          </div>
                          <Settings className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <Badge variant="outline" className="text-xs">
                            {plano.categoria}
                          </Badge>
                        </div>
                        <h4 className="font-medium text-sm text-foreground ml-6">{plano.nome}</h4>
                        <p className="text-xs text-muted-foreground mt-1 ml-6">
                          {plano.totalTarefas} tarefas
                        </p>
                      </div>
                      {/* Remover loading indicator por enquanto */}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const renderTarefasPorPlano = () => {
    if (value.planosSelecionados.length === 0) return null;

    return (
      <div className="space-y-4">
        <Label className="text-sm font-medium text-foreground flex items-center gap-2">
          <Wrench className="h-4 w-4 text-primary" />
          Passo 4: Selecione as Tarefas ({value.tarefasSelecionadas.length} selecionadas)
        </Label>

        <div className="space-y-3">
          {value.planosSelecionados.map(planoId => {
            const grupo = value.tarefasPorPlano[planoId];

            // Debug removido para evitar spam nos logs

            if (!grupo) return null;

            const tarefasSelecionadasDoPlano = grupo.tarefas.filter(t =>
              value.tarefasSelecionadas.includes(t.id)
            ).length;

            return (
              <Card key={planoId} className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                <CardHeader
                  className="pb-3 cursor-pointer"
                  onClick={() => handleExpandirPlano(planoId)}
                >
                  <CardTitle className="flex items-center justify-between text-blue-700 dark:text-blue-400">
                    <div className="flex items-center gap-2">
                      {grupo.expanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <Settings className="h-4 w-4" />
                      {grupo.plano.nome}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {tarefasSelecionadasDoPlano}/{grupo.tarefas.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>

                {grupo.expanded && (
                  <CardContent className="space-y-3">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectAllTarefasPlano(planoId)}
                        disabled={disabled}
                      >
                        Selecionar Todas
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeselectAllTarefasPlano(planoId)}
                        disabled={disabled}
                      >
                        Limpar
                      </Button>
                    </div>

                    <div className="grid gap-2 max-h-48 overflow-y-auto">
                      {grupo.tarefas.map((tarefa) => {
                        const isChecked = value.tarefasSelecionadas.includes(tarefa.id);

                        return (
                          <Card
                            key={tarefa.id}
                            className={`border-border transition-colors ${
                              isChecked
                                ? 'bg-primary/5 border-primary/30'
                                : 'bg-card hover:bg-accent/50'
                            }`}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-start gap-3">
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={(checked) => {
                                    handleTarefaToggle(tarefa.id, checked as boolean);
                                  }}
                                  disabled={disabled}
                                  className="mt-0.5"
                                />

                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Wrench className="h-4 w-4 text-primary" />
                                    <Badge variant="outline" className="text-xs">
                                      {tarefa.categoria}
                                    </Badge>
                                    <Badge
                                      variant={tarefa.criticidade >= 4 ? 'destructive' : tarefa.criticidade >= 3 ? 'secondary' : 'default'}
                                      className="text-xs"
                                    >
                                      Crit. {tarefa.criticidade}
                                    </Badge>
                                  </div>

                                  <h4 className="font-medium text-sm text-foreground">{tarefa.descricao}</h4>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Tag: {tarefa.tag} • {tarefa.tipo} • {tarefa.frequencia}
                                  </p>
                                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {tarefa.tempoEstimado}min
                                    </div>
                                    <div>
                                      Duração: {tarefa.duracaoEstimada}h
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  if (loadingPlantas) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Carregando plantas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb de progresso */}
      <div className="flex items-center justify-center gap-2 py-2">
        <div className="flex items-center gap-2">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-colors ${
            value.plantaId ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            1
          </div>
          <span className={`text-xs font-medium ${value.plantaId ? 'text-foreground' : 'text-muted-foreground'}`}>
            Planta
          </span>
        </div>

        <div className={`w-8 h-0.5 transition-colors ${
          value.plantaId ? 'bg-primary' : 'bg-muted'
        }`} />

        <div className="flex items-center gap-2">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-colors ${
            value.unidadeId ? 'bg-primary text-primary-foreground' : value.plantaId ? 'bg-muted text-muted-foreground' : 'bg-muted/50 text-muted-foreground/50'
          }`}>
            2
          </div>
          <span className={`text-xs font-medium ${
            value.unidadeId ? 'text-foreground' : value.plantaId ? 'text-muted-foreground' : 'text-muted-foreground/50'
          }`}>
            Unidade
          </span>
        </div>

        <div className={`w-8 h-0.5 transition-colors ${
          value.plantaId ? 'bg-primary' : 'bg-muted'
        }`} />

        <div className="flex items-center gap-2">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-colors ${
            value.planosSelecionados.length > 0 ? 'bg-primary text-primary-foreground' : value.plantaId ? 'bg-muted text-muted-foreground' : 'bg-muted/50 text-muted-foreground/50'
          }`}>
            3
          </div>
          <span className={`text-xs font-medium ${
            value.planosSelecionados.length > 0 ? 'text-foreground' : value.plantaId ? 'text-muted-foreground' : 'text-muted-foreground/50'
          }`}>
            Planos
          </span>
        </div>

        <div className={`w-8 h-0.5 transition-colors ${
          value.planosSelecionados.length > 0 ? 'bg-primary' : 'bg-muted'
        }`} />

        <div className="flex items-center gap-2">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-colors ${
            value.tarefasSelecionadas.length > 0 ? 'bg-primary text-primary-foreground' : value.planosSelecionados.length > 0 ? 'bg-muted text-muted-foreground' : 'bg-muted/50 text-muted-foreground/50'
          }`}>
            4
          </div>
          <span className={`text-xs font-medium ${
            value.tarefasSelecionadas.length > 0 ? 'text-foreground' : value.planosSelecionados.length > 0 ? 'text-muted-foreground' : 'text-muted-foreground/50'
          }`}>
            Tarefas
          </span>
        </div>
      </div>

      {/* Containers com visual melhorado */}
      <div className="space-y-4">
        {/* Passo 1: Planta */}
        <div className={`rounded-lg border-2 transition-all duration-200 ${
          !value.plantaId ? 'border-primary bg-primary/5' : 'border-border bg-background'
        }`}>
          <div className="p-4">
            {renderPlantaSelector()}
          </div>
        </div>

        {/* Passo 2: Unidade (opcional) */}
        {value.plantaId && (
          <div className={`rounded-lg border-2 transition-all duration-200 ${
            value.plantaId && !value.planosSelecionados.length ? 'border-primary/50 bg-primary/5' : 'border-border bg-background'
          }`}>
            <div className="p-4">
              {renderUnidadeSelector()}
            </div>
          </div>
        )}

        {/* Passo 3: Planos */}
        {value.plantaId && (
          <div className={`rounded-lg border-2 transition-all duration-300 ease-in-out ${
            value.plantaId && !value.planosSelecionados.length ? 'border-primary bg-primary/5' : 'border-border bg-background'
          } ${isTransitioning ? 'scale-[0.99] opacity-95' : 'scale-100 opacity-100'}`}>
            <div className="p-4">
              {renderPlanosSelector()}
            </div>
          </div>
        )}

        {/* Passo 4: Tarefas */}
        {value.planosSelecionados.length > 0 && (
          <div className={`rounded-lg border-2 transition-all duration-200 ${
            value.planosSelecionados.length > 0 && !value.tarefasSelecionadas.length ? 'border-primary bg-primary/5' : 'border-border bg-background'
          }`}>
            <div className="p-4">
              {renderTarefasPorPlano()}
            </div>
          </div>
        )}
      </div>

      {/* Status da seleção */}
      {value.tarefasSelecionadas.length > 0 && (
        <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <p className="text-sm text-primary font-medium">
              {value.planosSelecionados.length} plano(s) e {value.tarefasSelecionadas.length} tarefa(s) selecionadas
            </p>
          </div>
        </div>
      )}
    </div>
  );
};