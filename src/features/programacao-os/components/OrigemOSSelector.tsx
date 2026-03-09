// src/features/programacao-os/components/OrigemOSSelector.tsx - VERSÃO REFATORADA (Padrão Controlled Component)
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertTriangle,
  Wrench,
  Search,
  FileText,
  CheckCircle2,
  Clock,
  Settings,
  MapPin,
  Building2
} from 'lucide-react';
import { useOrigemDados } from '../hooks/useOrigemDados';
import { MultiplePlanosSelector } from './MultiplePlanosSelector';
import { usePlantas } from '@nexon/features/plantas/hooks/usePlantas';
import { useUnidadesByPlanta } from '@nexon/features/unidades/hooks/useUnidades';

interface OrigemOSSelectorProps {
  value: {
    tipo: 'ANOMALIA' | 'PLANO_MANUTENCAO' | 'MANUAL';
    anomaliaId?: string;
    planoId?: string;
    tarefasSelecionadas?: string[];
    // Campos de hierarquia (Planta → Unidade → Anomalia/Plano)
    plantaId?: string;
    unidadeId?: string;
    // Novos campos para múltiplos planos
    planosSelecionados?: string[];
    tarefasPorPlano?: any;
  };
  onChange: (value: any) => void;
  onLocalAtivoChange?: (local: string, ativo: string) => void;
  disabled?: boolean;
}

export const OrigemOSSelector: React.FC<OrigemOSSelectorProps> = ({
  value,
  onChange,
  onLocalAtivoChange,
  disabled = false
}) => {
  // ✅ DERIVAR VALORES DIRETAMENTE DAS PROPS PRIMEIRO - Antes dos hooks que dependem deles
  const tipo = value.tipo || 'MANUAL';
  const plantaId = value.plantaId?.toString().trim() || '';
  const unidadeId = value.unidadeId?.toString().trim() || '';
  const anomaliaId = value.anomaliaId?.toString().trim() || '';
  const planoId = value.planoId?.toString().trim() || '';
  const tarefasSelecionadas = value.tarefasSelecionadas || [];

  const {
    anomaliasDisponiveis,
    planosDisponiveis,
    carregarAnomalias,
    carregarPlanos,
    gerarTarefasDoPlano,
    loading
  } = useOrigemDados();

  // ✅ Hooks para carregar plantas e unidades
  const {
    plantas,
    carregarPlantasSimples,
    loading: loadingPlantas
  } = usePlantas();

  // ✅ Hook correto: usar useUnidadesByPlanta que filtra por planta (usa plantaId já definido acima)
  const {
    unidades,
    isLoading: loadingUnidades
  } = useUnidadesByPlanta(plantaId || undefined);

  // ✅ APENAS UI STATE - Não armazena valores de negócio que vêm das props
  const [searchTerm, setSearchTerm] = useState('');
  const [tarefasDoPlano, setTarefasDoPlano] = useState<any[]>([]);
  const [equipamentosSelecionados] = useState<number[]>([1]);
  const [loadingTarefas, setLoadingTarefas] = useState(false);

  // Carregar plantas ao montar
  useEffect(() => {
    carregarPlantasSimples();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ✅ Executar apenas uma vez ao montar

  // ✅ useUnidadesByPlanta já carrega automaticamente quando plantaId muda

  // Carregar anomalias/planos quando unidade for selecionada
  useEffect(() => {
    if (tipo === 'ANOMALIA' && plantaId && unidadeId) {
      console.log('🔍 [OrigemOSSelector] Carregando anomalias filtradas:', { plantaId, unidadeId });
      carregarAnomalias(plantaId, unidadeId);
    }
  }, [tipo, plantaId, unidadeId, carregarAnomalias]);

  // Quando o plano for selecionado, carregar suas tarefas
  useEffect(() => {
    const carregarTarefasPlano = async () => {
      if (tipo === 'PLANO_MANUTENCAO' && planoId && planoId !== '') {
        setLoadingTarefas(true);
        try {
          const tarefas = await gerarTarefasDoPlano(planoId, equipamentosSelecionados.map(String));

          // Usar as tarefas retornadas diretamente da API
          setTarefasDoPlano(tarefas || []);
        } catch (error) {
          console.error('Erro ao carregar tarefas:', error);
          setTarefasDoPlano([]);
        } finally {
          setLoadingTarefas(false);
        }
      } else {
        setTarefasDoPlano([]);
      }
    };

    carregarTarefasPlano();
  }, [planoId, tipo, gerarTarefasDoPlano, equipamentosSelecionados]);

  const handleTipoChange = (tipo: 'ANOMALIA' | 'PLANO_MANUTENCAO' | 'MANUAL') => {
    console.log('🔄 [OrigemOSSelector] Mudando tipo para:', tipo);

    const novoValor = {
      tipo,
      // Resetar hierarquia completa
      plantaId: undefined,
      unidadeId: undefined,
      anomaliaId: undefined,
      planoId: undefined,
      tarefasSelecionadas: [],
      // Limpar campos de múltiplos planos
      planosSelecionados: [],
      tarefasPorPlano: {}
    };

    onChange(novoValor);
    setTarefasDoPlano([]);
    setSearchTerm('');

    // Limpar local e ativo quando muda tipo de origem
    if (onLocalAtivoChange) {
      if (tipo === 'MANUAL') {
        onLocalAtivoChange('', '');
      }
    }
  };

  // ✅ NOVO: Handlers para seleção de planta e unidade
  const handlePlantaChange = (newPlantaId: string) => {
    console.log('🏭 [OrigemOSSelector] Selecionando planta:', newPlantaId);

    const novoValor = {
      ...value,
      // Se string vazia, setar como undefined para mostrar lista de seleção
      plantaId: newPlantaId || undefined,
      // Resetar unidade e seleções dependentes
      unidadeId: undefined,
      anomaliaId: undefined,
      planoId: undefined,
      tarefasSelecionadas: []
    };

    onChange(novoValor);
  };

  const handleUnidadeChange = (newUnidadeId: string) => {
    console.log('🏢 [OrigemOSSelector] Selecionando unidade:', newUnidadeId);

    const novoValor = {
      ...value,
      // Se string vazia, setar como undefined para mostrar lista de seleção
      unidadeId: newUnidadeId || undefined,
      // Resetar apenas seleções dependentes (manter planta)
      anomaliaId: undefined,
      planoId: undefined,
      tarefasSelecionadas: []
    };

    onChange(novoValor);
  };

  const handleAnomaliaChange = (anomaliaId: string) => {
    console.log('🔍 [OrigemOSSelector] Selecionando anomalia:', anomaliaId);

    // ✅ Se string vazia, limpar seleção (para botão "Trocar")
    if (!anomaliaId || anomaliaId === '') {
      const novoValor = {
        ...value,
        anomaliaId: undefined
      };
      onChange(novoValor);

      // Limpar local/ativo
      if (onLocalAtivoChange) {
        onLocalAtivoChange('', '');
      }
      return;
    }

    const anomaliaSelecionada = anomaliasDisponiveis.find(a => String(a.id) === String(anomaliaId));

    if (!anomaliaSelecionada) {
      // console.log('Anomalia não encontrada:', anomaliaId);
      // console.log('Anomalias disponíveis:', anomaliasDisponiveis);
      return;
    }

    // Criar novo objeto de valor
    const novoValor = {
      tipo: 'ANOMALIA' as const,
      plantaId: value.plantaId,
      unidadeId: value.unidadeId,
      anomaliaId: String(anomaliaId), // Garantir que é string
      planoId: undefined,
      tarefasSelecionadas: []
    };

    // console.log('Enviando novo valor:', novoValor);

    // Chamar onChange
    onChange(novoValor);

    // Notificar local/ativo
    if (onLocalAtivoChange && anomaliaSelecionada) {
      // console.log('Atualizando local/ativo:', {
      //   local: anomaliaSelecionada.local,
      //   ativo: anomaliaSelecionada.ativo
      // });
      onLocalAtivoChange(anomaliaSelecionada.local, anomaliaSelecionada.ativo);
    }
  };

  const handlePlanoChange = (planoId: string) => {
    // console.log('Selecionando plano:', planoId);
    
    if (!planoId || planoId === '') {
      // console.log('ID do plano inválido');
      return;
    }

    const novoValor = {
      tipo: 'PLANO_MANUTENCAO' as const,
      planoId: String(planoId), // Garantir que é string
      anomaliaId: undefined,
      tarefasSelecionadas: []
    };

    // console.log('Enviando novo valor do plano:', novoValor);
    onChange(novoValor);

    // As tarefas serão carregadas pelo useEffect
  };

  const handleTarefaToggle = (tarefaId: string, checked: boolean) => {
    const tarefaIdTrimmed = tarefaId.trim();

    const novasTarefas = checked
      ? [...tarefasSelecionadas, tarefaIdTrimmed]
      : tarefasSelecionadas.filter(id => id !== tarefaIdTrimmed);

    const novoValor = {
      ...value,
      tarefasSelecionadas: novasTarefas
    };

    onChange(novoValor);

    // Atualizar local e ativo baseado nas tarefas selecionadas
    updateLocalAtivoFromTarefas(novasTarefas);
  };

  // Função para atualizar local/ativo baseado nas tarefas selecionadas
  const updateLocalAtivoFromTarefas = (tarefasSelecionadas: string[]) => {
    if (!onLocalAtivoChange || tarefasSelecionadas.length === 0) {
      // Se não há tarefas selecionadas, limpar local/ativo
      if (onLocalAtivoChange && tarefasSelecionadas.length === 0) {
        onLocalAtivoChange('', '');
      }
      return;
    }

    const tarefasSelecionadasData = tarefasDoPlano.filter(t =>
      tarefasSelecionadas.includes(t.id)
    );

    if (tarefasSelecionadasData.length > 0) {
      // Pegar local e ativo da primeira tarefa selecionada
      const primeiraTarefa = tarefasSelecionadasData[0];
      const local = primeiraTarefa.local || 'Local não definido';
      const ativo = primeiraTarefa.ativo || primeiraTarefa.tag || 'Ativo não definido';

      // console.log('Atualizando local/ativo das tarefas:', { local, ativo });
      onLocalAtivoChange(local, ativo);
    }
  };

  const handleSelectAllTarefas = () => {
    const todasTarefas = tarefasDoPlano
      .map(t => t.id?.toString().trim() || '')
      .filter(id => id !== ''); // Apenas filtrar IDs vazios

    const novoValor = {
      ...value,
      tarefasSelecionadas: todasTarefas
    };

    onChange(novoValor);
    updateLocalAtivoFromTarefas(todasTarefas);
  };

  const handleDeselectAllTarefas = () => {
    const novoValor = {
      ...value,
      tarefasSelecionadas: []
    };
    
    onChange(novoValor);
    // Limpar local e ativo quando desmarca todas as tarefas
    if (onLocalAtivoChange) {
      onLocalAtivoChange('', '');
    }
  };

  // Filtrar anomalias baseado na busca
  const anomaliasFiltradas = anomaliasDisponiveis.filter(anomalia =>
    anomalia.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    anomalia.local.toLowerCase().includes(searchTerm.toLowerCase()) ||
    anomalia.ativo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filtrar planos baseado na busca
  const planosFiltrados = planosDisponiveis.filter(plano =>
    plano.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plano.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ✅ NOVO: Renderizar seletor de Planta
  const renderPlantaSelector = () => {
    if (tipo === 'MANUAL') return null;

    // ✅ Comparar com trim() porque os IDs do backend podem ter espaços
    const plantaSelecionada = plantas.find(p => p.id?.trim() === plantaId);

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

        {/* ✅ Se já selecionou, mostrar apenas a selecionada com botão para trocar */}
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
          <div className="grid gap-2 max-h-48 overflow-y-auto border border-border rounded-lg p-2 bg-muted/30">
            {plantas.map((planta) => (
              <Card
                key={planta.id}
                className="cursor-pointer transition-all duration-200 border-border bg-card hover:bg-accent hover:text-accent-foreground hover:border-primary/50"
                onClick={() => {
                  if (!disabled) {
                    handlePlantaChange(planta.id);
                  }
                }}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <div>
                      <h4 className="font-medium text-sm">{planta.nome}</h4>
                      <p className="text-xs text-muted-foreground">{planta.localizacao}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {plantas.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma planta encontrada</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ✅ NOVO: Renderizar seletor de Unidade
  const renderUnidadeSelector = () => {
    if (tipo === 'MANUAL' || !plantaId) return null;

    // ✅ Comparar com trim() porque os IDs do backend podem ter espaços
    const unidadeSelecionada = unidades.find(u => u.id?.trim() === unidadeId);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            Passo 2: Selecione a Unidade
          </Label>
          {!unidadeSelecionada && (
            <span className="text-xs text-muted-foreground">Obrigatório</span>
          )}
        </div>

        {/* ✅ Se já selecionou, mostrar apenas a selecionada com botão para trocar */}
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
                  Trocar
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
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma unidade encontrada para esta planta</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderTipoSelector = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Button
          type="button"
          variant={tipo === 'ANOMALIA' ? 'default' : 'outline'}
          className={`h-24 flex-col gap-2 relative transition-all duration-200 ${
            tipo === 'ANOMALIA'
              ? 'ring-2 ring-primary ring-offset-2 bg-primary hover:bg-primary/90'
              : 'hover:border-primary/50 hover:bg-primary/5'
          }`}
          onClick={() => handleTipoChange('ANOMALIA')}
          disabled={disabled}
        >
          <AlertTriangle className={`h-6 w-6 ${tipo === 'ANOMALIA' ? 'text-primary-foreground' : 'text-destructive'}`} />
          <span className="text-xs font-medium">Anomalia</span>
          <span className="text-[10px] opacity-70">Problema detectado</span>
        </Button>

        <Button
          type="button"
          variant={tipo === 'PLANO_MANUTENCAO' ? 'default' : 'outline'}
          className={`h-24 flex-col gap-2 relative transition-all duration-200 ${
            tipo === 'PLANO_MANUTENCAO'
              ? 'ring-2 ring-primary ring-offset-2 bg-primary hover:bg-primary/90'
              : 'hover:border-primary/50 hover:bg-primary/5'
          }`}
          onClick={() => handleTipoChange('PLANO_MANUTENCAO')}
          disabled={disabled}
        >
          <Settings className={`h-6 w-6 ${tipo === 'PLANO_MANUTENCAO' ? 'text-primary-foreground' : 'text-green-600'}`} />
          <span className="text-xs font-medium">Plano Manutenção</span>
          <span className="text-[10px] opacity-70">Preventiva/Preditiva</span>
        </Button>

        <Button
          type="button"
          variant={tipo === 'MANUAL' ? 'default' : 'outline'}
          className={`h-24 flex-col gap-2 relative transition-all duration-200 ${
            tipo === 'MANUAL'
              ? 'ring-2 ring-primary ring-offset-2 bg-primary hover:bg-primary/90'
              : 'hover:border-primary/50 hover:bg-primary/5'
          }`}
          onClick={() => handleTipoChange('MANUAL')}
          disabled={disabled}
        >
          <FileText className={`h-6 w-6 ${tipo === 'MANUAL' ? 'text-primary-foreground' : 'text-blue-600'}`} />
          <span className="text-xs font-medium">Manual</span>
          <span className="text-[10px] opacity-70">Criação direta</span>
        </Button>
      </div>
    </div>
  );

  const renderAnomaliaSelector = () => {
    // ✅ NOVO: Só mostrar se planta e unidade estiverem selecionadas
    if (!plantaId || !unidadeId) {
      return (
        <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg bg-muted/30">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Selecione uma planta e unidade primeiro</p>
        </div>
      );
    }

    const anomaliaSelecionada = anomaliasDisponiveis.find(a => String(a.id).trim() === anomaliaId);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-foreground flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Passo 3: Selecione a Anomalia
          </Label>
          {!anomaliaSelecionada && (
            <span className="text-xs text-muted-foreground">
              {anomaliasDisponiveis.length} disponíveis
            </span>
          )}
        </div>

        {/* ✅ Se já selecionou, mostrar apenas a selecionada com botão para trocar */}
        {anomaliaSelecionada ? (
          <Card className="border-primary bg-primary/10">
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <Badge
                      variant={anomaliaSelecionada.prioridade === 'CRITICA' || anomaliaSelecionada.prioridade === 'ALTA' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {anomaliaSelecionada.prioridade}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {anomaliaSelecionada.status}
                    </Badge>
                  </div>
                  <h4 className="font-medium text-sm">{anomaliaSelecionada.descricao}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {anomaliaSelecionada.local} - {anomaliaSelecionada.ativo}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAnomaliaChange('')}
                  disabled={disabled}
                >
                  Trocar
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar anomalia..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={disabled}
                className="bg-background border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 border border-border rounded-lg p-2 bg-muted/30">
              {anomaliasFiltradas.map((anomalia) => {
                const isSelected = anomaliaId === String(anomalia.id).trim();

                return (
                  <Card
                    key={anomalia.id}
                    className={`cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary/20'
                        : 'border-border bg-card hover:bg-accent hover:text-accent-foreground hover:border-primary/50'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => {
                      if (!disabled) {
                        // console.log('Click na anomalia:', anomalia.id);
                        handleAnomaliaChange(String(anomalia.id));
                      }
                    }}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                            <Badge
                              variant={anomalia.prioridade === 'CRITICA' || anomalia.prioridade === 'ALTA' ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {anomalia.prioridade}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {anomalia.status}
                            </Badge>
                          </div>
                          <h4 className="font-medium text-sm text-foreground">{anomalia.descricao}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {anomalia.local} - {anomalia.ativo}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Data: {anomalia.data}
                          </p>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 ml-2" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {anomaliasFiltradas.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="font-medium">Nenhuma anomalia disponível</p>
                  <p className="text-xs mt-2">
                    Não há anomalias pendentes (AGUARDANDO ou EM_ANALISE) para esta unidade.
                  </p>
                  <p className="text-xs mt-1">
                    Anomalias já resolvidas ou com OS gerada não aparecem aqui.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  const renderPlanoSelector = () => (
    <div className="space-y-4">
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
        {planosFiltrados.map((plano) => {
          const isSelected = planoId === String(plano.id).trim();
          
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
                  // console.log('Click no plano:', plano.id);
                  handlePlanoChange(String(plano.id));
                }
              }}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Settings className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <Badge variant="outline" className="text-xs">
                        {plano.categoria}
                      </Badge>
                      {plano.ativo && (
                        <Badge variant="secondary" className="text-xs">
                          Ativo
                        </Badge>
                      )}
                    </div>
                    <h4 className="font-medium text-sm text-foreground">{plano.nome}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {plano.totalTarefas} tarefas • {plano.totalEquipamentos} equipamentos
                    </p>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 ml-2" />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {planosFiltrados.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum plano encontrado</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderTarefasSelector = () => {
    if (!planoId || planoId === '') return null;

    if (loadingTarefas) {
      return (
        <div className="space-y-4">
          <Label className="text-sm font-medium text-foreground">Carregando Tarefas...</Label>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </div>
      );
    }

    if (tarefasDoPlano.length === 0) {
      return (
        <div className="space-y-4">
          <Label className="text-sm font-medium text-foreground">Tarefas do Plano</Label>
          <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">
            <Wrench className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhuma tarefa encontrada para este plano</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-foreground">
            Tarefas do Plano ({tarefasDoPlano.length})
          </Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAllTarefas}
              disabled={disabled}
            >
              Selecionar Todas
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDeselectAllTarefas}
              disabled={disabled}
            >
              Limpar
            </Button>
          </div>
        </div>

        <div className="grid gap-2 max-h-96 overflow-y-auto border border-border rounded-lg p-2 bg-muted/30">
          {tarefasDoPlano.map((tarefa) => {
            const isChecked = tarefasSelecionadas.includes(tarefa.id);
            
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
                        // console.log('Checkbox change:', tarefa.id, checked);
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
                          Criticidade {tarefa.criticidade}
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
                        {tarefa.responsavel && (
                          <div>
                            Resp: {tarefa.responsavel}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {tarefasSelecionadas.length > 0 && (
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
            <p className="text-sm text-primary">
              <strong>{tarefasSelecionadas.length}</strong> tarefa(s) selecionada(s)
            </p>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Seletor de Tipo com melhor descrição */}
      <div className="space-y-4">
        <Label className="text-sm font-medium text-foreground">Origem da Ordem de Serviço</Label>
        <p className="text-xs text-muted-foreground -mt-2">
          Selecione a origem que irá gerar esta programação
        </p>
        {renderTipoSelector()}
      </div>

      {/* ✅ HIERARQUIA COM BREADCRUMB VISUAL */}
      {tipo === 'ANOMALIA' && (
        <>
          {/* Breadcrumb de progresso */}
          <div className="flex items-center justify-center gap-2 py-2">
            <div className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                plantaId ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                1
              </div>
              <span className={`text-xs font-medium ${plantaId ? 'text-foreground' : 'text-muted-foreground'}`}>
                Planta
              </span>
            </div>

            <div className={`w-8 h-0.5 transition-colors ${
              plantaId ? 'bg-primary' : 'bg-muted'
            }`} />

            <div className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                unidadeId ? 'bg-primary text-primary-foreground' : plantaId ? 'bg-muted text-muted-foreground' : 'bg-muted/50 text-muted-foreground/50'
              }`}>
                2
              </div>
              <span className={`text-xs font-medium ${
                unidadeId ? 'text-foreground' : plantaId ? 'text-muted-foreground' : 'text-muted-foreground/50'
              }`}>
                Unidade
              </span>
            </div>

            <div className={`w-8 h-0.5 transition-colors ${
              unidadeId ? 'bg-primary' : 'bg-muted'
            }`} />

            <div className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                anomaliaId ? 'bg-primary text-primary-foreground' : unidadeId ? 'bg-muted text-muted-foreground' : 'bg-muted/50 text-muted-foreground/50'
              }`}>
                3
              </div>
              <span className={`text-xs font-medium ${
                anomaliaId ? 'text-foreground' : unidadeId ? 'text-muted-foreground' : 'text-muted-foreground/50'
              }`}>
                Anomalia
              </span>
            </div>
          </div>

          {/* Containers com visual melhorado */}
          <div className="space-y-4">
            {/* Passo 1: Selecionar Planta */}
            <div className={`rounded-lg border-2 transition-all duration-200 ${
              !plantaId ? 'border-primary bg-primary/5' : 'border-border bg-background'
            }`}>
              <div className="p-4">
                {renderPlantaSelector()}
              </div>
            </div>

            {/* Passo 2: Selecionar Unidade */}
            {plantaId && (
              <div className={`rounded-lg border-2 transition-all duration-200 ${
                plantaId && !unidadeId ? 'border-primary bg-primary/5' : 'border-border bg-background'
              }`}>
                <div className="p-4">
                  {renderUnidadeSelector()}
                </div>
              </div>
            )}

            {/* Passo 3: Selecionar Anomalia */}
            {plantaId && unidadeId && (
              <div className={`rounded-lg border-2 transition-all duration-200 ${
                unidadeId && !anomaliaId ? 'border-primary bg-primary/5' : 'border-border bg-background'
              }`}>
                <div className="p-4">
                  {renderAnomaliaSelector()}
                </div>
              </div>
            )}
          </div>

          {/* Status da seleção */}
          {anomaliaId && (
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <p className="text-sm text-primary font-medium">
                  Anomalia selecionada com sucesso
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Passo 3b: Selecionar Planos (se tipo for PLANO_MANUTENCAO) */}
      {tipo === 'PLANO_MANUTENCAO' && (
        <div className="rounded-lg border-2 border-primary bg-primary/5 p-4">
          <MultiplePlanosSelector
            value={{
              tipo: 'PLANO_MANUTENCAO',
              plantaId: value.plantaId,
              unidadeId: value.unidadeId,
              planosSelecionados: value.planosSelecionados || [],
              tarefasSelecionadas: tarefasSelecionadas,
              tarefasPorPlano: value.tarefasPorPlano || {}
            }}
            onChange={onChange}
            onLocalAtivoChange={onLocalAtivoChange}
            disabled={disabled}
          />
        </div>
      )}

      {/* Tipo MANUAL: Sem seleção necessária */}
      {tipo === 'MANUAL' && (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-primary/30 rounded-lg bg-primary/5">
          <FileText className="h-8 w-8 mx-auto mb-2 text-primary opacity-70" />
          <p className="font-medium text-foreground">Ordem de Serviço Manual</p>
          <p className="text-xs mt-1">Preencha os campos necessários manualmente</p>
        </div>
      )}
    </div>
  );
};