// src/features/programacao-os/components/MultiplePlanosSelector.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useOrigemDados } from '../hooks/useOrigemDados';
import { usePlantas } from '@/features/plantas/hooks/usePlantas';

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

  const [searchTerm, setSearchTerm] = useState('');
  const lastPlantaIdRef = useRef<string | null>(null);

  // Carregar plantas ao montar
  useEffect(() => {
    carregarPlantasSimples();
  }, [carregarPlantasSimples]);

  // Carregar planos quando a planta for selecionada (evitar infinite loop)
  useEffect(() => {
    // Só executar se plantaId mudou realmente
    if (value.plantaId !== lastPlantaIdRef.current) {
      console.log('🔄 [MultiplePlanosSelector] useEffect - plantaId mudou:', {
        plantaIdNovo: value.plantaId,
        plantaIdAnterior: lastPlantaIdRef.current,
        timestamp: new Date().toISOString()
      });

      lastPlantaIdRef.current = value.plantaId;

      if (value.plantaId) {
        console.log('🎯 [MultiplePlanosSelector] Chamando carregarPlanos com plantaId:', value.plantaId);
        carregarPlanos(value.plantaId);
      } else {
        console.log('⚠️ [MultiplePlanosSelector] Não há plantaId, não carregando planos');
      }
    }
  }, [value.plantaId]); // Removido carregarPlanos da dependência


  // Filtrar planos baseado na busca
  const planosFiltrados = planosDisponiveis.filter(plano =>
    plano.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plano.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePlantaChange = (plantaId: string) => {
    const novoValor: MultiplePlanosValue = {
      tipo: 'PLANO_MANUTENCAO',
      plantaId,
      planosSelecionados: [],
      tarefasSelecionadas: [],
      tarefasPorPlano: {}
    };

    onChange(novoValor);
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
          console.log('🔍 [MULTIPLOS PLANOS] IDs das tarefas:', tarefas?.map(t => ({ id: t.id, tipo: typeof t.id, isMock: t.id?.includes('cmg') })));

          // ✅ VALIDAÇÃO: Verificar se algum ID é mockado
          const tarefasValidadas = (tarefas || []).map(tarefa => {
            if (tarefa.id && typeof tarefa.id === 'string' && tarefa.id.includes('cmg')) {
              console.error('❌ [MULTIPLOS PLANOS] DETECTADO ID MOCKADO:', {
                tarefaId: tarefa.id,
                tarefaNome: tarefa.nome || tarefa.descricao,
                planoId: cleanPlanoId
              });
            }
            return tarefa;
          });

          // Adicionar plano com tarefas já carregadas
          onChange({
            ...value,
            planosSelecionados: [...value.planosSelecionados, cleanPlanoId],
            tarefasPorPlano: {
              ...value.tarefasPorPlano,
              [cleanPlanoId]: {
                plano,
                tarefas: tarefasValidadas,
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
    const tarefasAtuais = value.tarefasSelecionadas || [];
    const novasTarefas = checked
      ? [...tarefasAtuais, tarefaId]
      : tarefasAtuais.filter(id => id !== tarefaId);

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

    const todasTarefasDoPlano = grupo.tarefas.map(t => t.id);
    const tarefasAtuais = value.tarefasSelecionadas.filter(id =>
      !grupo.tarefas.some(t => t.id === id)
    );
    const novasTarefas = [...tarefasAtuais, ...todasTarefasDoPlano];

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

  const renderPlantaSelector = () => (
    <div className="space-y-4">
      <Label className="text-sm font-medium text-foreground">
        1. Selecione a Planta
      </Label>
      <div className="grid gap-2">
        {loadingPlantas ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : (
          plantas.map((planta) => {
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
          })
        )}
      </div>
    </div>
  );

  const renderPlanosSelector = () => {
    if (!value.plantaId) return null;

    return (
      <div className="space-y-4">
        <Label className="text-sm font-medium text-foreground">
          2. Selecione os Planos de Manutenção
        </Label>

        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar plano de manutenção..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={disabled}
            className="bg-background border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="max-h-64 overflow-y-auto space-y-2 border border-border rounded-lg p-2 bg-muted/30">
          {loadingPlanos ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
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
        <Label className="text-sm font-medium text-foreground">
          3. Selecione as Tarefas ({value.tarefasSelecionadas.length} selecionadas)
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
      {renderPlantaSelector()}
      {renderPlanosSelector()}
      {renderTarefasPorPlano()}
    </div>
  );
};