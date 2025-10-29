// src/features/programacao-os/components/OrigemOSController.tsx - CORRIGIDO DARK/LIGHT MODE
import React from 'react';
import { 
  AlertTriangle, 
  Layers, 
  Search, 
  FileText, 
  Calendar,
  CheckCircle,
  Clock,
  Building,
  Loader2,
  Wrench
} from 'lucide-react';
import { useOrigemDados } from '../hooks/useOrigemDados';
import { formatarPrioridade, formatarStatus, formatarCategoria } from '../utils/origemUtils';

interface OrigemOSControllerProps {
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  entity?: any;
  mode?: string;
}

export const OrigemOSController: React.FC<OrigemOSControllerProps> = ({ 
  value, 
  onChange, 
  disabled = false
}) => {
  const [tipoOrigem, setTipoOrigem] = React.useState(value?.tipo || 'ANOMALIA');
  const [itemSelecionado, setItemSelecionado] = React.useState(value?.item || null);
  const [busca, setBusca] = React.useState('');

  // Usar dados reais da API
  const {
    loading,
    anomaliasDisponiveis,
    planosDisponiveis,
    carregarAnomalias,
    carregarPlanos
  } = useOrigemDados();

  // Filtrar anomalias com busca
  const anomaliasFiltradas = React.useMemo(() => {
    return anomaliasDisponiveis.filter(anomalia =>
      busca === '' || 
      anomalia.descricao.toLowerCase().includes(busca.toLowerCase()) ||
      anomalia.ativo.toLowerCase().includes(busca.toLowerCase()) ||
      anomalia.local.toLowerCase().includes(busca.toLowerCase())
    );
  }, [anomaliasDisponiveis, busca]);

  // Filtrar planos com busca  
  const planosFiltrados = React.useMemo(() => {
    return planosDisponiveis.filter(plano =>
      busca === '' || 
      plano.nome.toLowerCase().includes(busca.toLowerCase()) ||
      plano.categoria.toLowerCase().includes(busca.toLowerCase())
    );
  }, [planosDisponiveis, busca]);

  // Carregar dados quando tipo mudar
  React.useEffect(() => {
    if (tipoOrigem === 'ANOMALIA') {
      carregarAnomalias();
    } else if (tipoOrigem === 'PLANO_MANUTENCAO') {
      carregarPlanos();
    }
  }, [tipoOrigem, carregarAnomalias, carregarPlanos]);

  // Função para alterar tipo de origem
  const handleTipoChange = (novoTipo: string) => {
    setTipoOrigem(novoTipo);
    setItemSelecionado(null);
    setBusca('');
    
    onChange({
      tipo: novoTipo,
      item: null,
      dados: null
    });
  };

  // Função para selecionar anomalia
  const handleSelecionarAnomalia = (anomalia: any) => {
    setItemSelecionado(anomalia);

    const dadosCompletos = {
      tipo: 'ANOMALIA',
      item: anomalia,
      dados: {
        anomaliaId: anomalia.id,
        descricaoOrigem: anomalia.descricao,
        localOrigem: anomalia.local,
        ativoOrigem: anomalia.ativo,
        equipamentoId: anomalia.equipamentoId,
        plantaId: anomalia.plantaId,
        unidadeId: anomalia.unidadeId, // NOVO: Incluir unidadeId
        prioridadeOrigem: anomalia.prioridade
      }
    };

    onChange(dadosCompletos);
  };

  // Função para selecionar plano
  const handleSelecionarPlano = (plano: any) => {
    setItemSelecionado(plano);
    
    const dadosCompletos = {
      tipo: 'PLANO_MANUTENCAO',
      item: plano,
      dados: {
        planoId: plano.id,
        planoNome: plano.nome,
        categoria: plano.categoria,
        totalTarefas: plano.totalTarefas,
        totalEquipamentos: plano.totalEquipamentos
      }
    };
    
    onChange(dadosCompletos);
  };

  // Componente para badge de prioridade
  const PrioridadeBadge = ({ prioridade }: { prioridade: string }) => {
    const config = {
      'ALTA': { color: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200 border-red-200 dark:border-red-800', icon: AlertTriangle },
      'MEDIA': { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800', icon: Clock },
      'BAIXA': { color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 border-green-200 dark:border-green-800', icon: CheckCircle },
      'CRITICA': { color: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200 border-red-200 dark:border-red-800', icon: AlertTriangle }
    };
    
    const { color, icon: Icon } = config[prioridade as keyof typeof config] || config.MEDIA;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${color}`}>
        <Icon className="h-3 w-3" />
        {formatarPrioridade(prioridade)}
      </span>
    );
  };

  // Componente para status badge
  const StatusBadge = ({ status }: { status: string }) => {
    const config = {
      'AGUARDANDO': { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 border-blue-200 dark:border-blue-800', label: 'Aguardando' },
      'EM_ANALISE': { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200 border-purple-200 dark:border-purple-800', label: 'Em Análise' }
    };
    
    const { color, label } = config[status as keyof typeof config] || { color: 'bg-muted text-muted-foreground border-border', label: formatarStatus(status) };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${color}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Seletor de Tipo de Origem */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          Origem da Ordem de Serviço <span className="text-destructive">*</span>
        </label>
        
        <div className="grid grid-cols-2 gap-3">
          {/* Opção: Anomalia */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleTipoChange('ANOMALIA')}
            className={`p-4 rounded-xl border-2 transition-all duration-200 text-left group ${
              tipoOrigem === 'ANOMALIA'
                ? 'border-primary bg-primary/10 dark:bg-primary/5 shadow-sm'
                : 'border-border bg-card hover:border-primary/30 hover:bg-accent/50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className={`h-6 w-6 mt-0.5 transition-colors ${
                tipoOrigem === 'ANOMALIA'
                  ? 'text-primary'
                  : 'text-muted-foreground group-hover:text-primary'
              }`} />
              <div>
                <h3 className={`font-semibold text-sm ${
                  tipoOrigem === 'ANOMALIA'
                    ? 'text-primary'
                    : 'text-foreground'
                }`}>
                  Anomalia Detectada
                </h3>
                <p className={`text-xs mt-1 ${
                  tipoOrigem === 'ANOMALIA'
                    ? 'text-primary/80'
                    : 'text-muted-foreground'
                }`}>
                  Corrigir problema identificado no sistema
                </p>
              </div>
            </div>
          </button>

          {/* Opção: Plano de Manutenção */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleTipoChange('PLANO_MANUTENCAO')}
            className={`p-4 rounded-xl border-2 transition-all duration-200 text-left group ${
              tipoOrigem === 'PLANO_MANUTENCAO'
                ? 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-950/30 shadow-sm'
                : 'border-border bg-card hover:border-green-300 dark:hover:border-green-600 hover:bg-accent/50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="flex items-start gap-3">
              <Layers className={`h-6 w-6 mt-0.5 transition-colors ${
                tipoOrigem === 'PLANO_MANUTENCAO'
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-muted-foreground group-hover:text-green-500'
              }`} />
              <div>
                <h3 className={`font-semibold text-sm ${
                  tipoOrigem === 'PLANO_MANUTENCAO'
                    ? 'text-green-900 dark:text-green-100'
                    : 'text-foreground'
                }`}>
                  Plano de Manutenção
                </h3>
                <p className={`text-xs mt-1 ${
                  tipoOrigem === 'PLANO_MANUTENCAO'
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-muted-foreground'
                }`}>
                  Executar tarefas programadas
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Área de Seleção do Item */}
      {tipoOrigem && (
        <div className="space-y-4">
          {/* Campo de Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              type="text"
              placeholder={tipoOrigem === 'ANOMALIA' ? 'Buscar anomalia...' : 'Buscar plano de manutenção...'}
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              disabled={disabled}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg 
                bg-background text-foreground 
                placeholder:text-muted-foreground
                focus:ring-2 focus:ring-ring focus:ring-offset-2
                focus:border-ring
                disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Lista de Itens */}
          <div className="max-h-80 overflow-y-auto space-y-2 border border-border rounded-lg p-2 bg-muted/30">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Carregando {tipoOrigem === 'ANOMALIA' ? 'anomalias' : 'planos'}...
                </span>
              </div>
            ) : (
              <>
                {tipoOrigem === 'ANOMALIA' && (
                  <>
                    {anomaliasFiltradas.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="font-medium">Nenhuma anomalia encontrada</p>
                        <p className="text-sm">
                          {busca ? 'Tente uma busca diferente.' : 'Todas as anomalias foram resolvidas ou não há anomalias pendentes.'}
                        </p>
                        <button 
                          type="button"
                          onClick={carregarAnomalias}
                          className="mt-2 text-primary text-sm hover:underline"
                        >
                          Recarregar anomalias
                        </button>
                      </div>
                    ) : (
                      anomaliasFiltradas.map((anomalia) => (
                        <button
                          key={anomalia.id}
                          type="button"
                          disabled={disabled}
                          onClick={() => handleSelecionarAnomalia(anomalia)}
                          className={`w-full p-4 rounded-lg border text-left transition-all duration-200 ${
                            itemSelecionado?.id === anomalia.id
                              ? 'border-primary bg-primary/10 shadow-sm'
                              : 'border-border bg-card hover:border-primary/30 hover:bg-accent/50'
                          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <h4 className="font-medium text-sm text-foreground line-clamp-2">
                                {anomalia.descricao}
                              </h4>
                              <div className="flex gap-2 shrink-0">
                                <PrioridadeBadge prioridade={anomalia.prioridade} />
                                <StatusBadge status={anomalia.status} />
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                {anomalia.local}
                              </span>
                              <span className="flex items-center gap-1">
                                <Wrench className="h-3 w-3" />
                                {anomalia.ativo}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(anomalia.data).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </>
                )}

                {tipoOrigem === 'PLANO_MANUTENCAO' && (
                  <>
                    {planosFiltrados.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Layers className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="font-medium">Nenhum plano encontrado</p>
                        <p className="text-sm">
                          {busca ? 'Tente uma busca diferente.' : 'Não há planos de manutenção ativos disponíveis.'}
                        </p>
                        <button 
                          type="button"
                          onClick={carregarPlanos}
                          className="mt-2 text-green-600 dark:text-green-400 text-sm hover:underline"
                        >
                          Recarregar planos
                        </button>
                      </div>
                    ) : (
                      planosFiltrados.map((plano) => (
                        <button
                          key={plano.id}
                          type="button"
                          disabled={disabled}
                          onClick={() => handleSelecionarPlano(plano)}
                          className={`w-full p-4 rounded-lg border text-left transition-all duration-200 ${
                            itemSelecionado?.id === plano.id
                              ? 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-950/30 shadow-sm'
                              : 'border-border bg-card hover:border-green-300 dark:hover:border-green-600 hover:bg-accent/50'
                          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <h4 className="font-medium text-sm text-foreground">
                                {plano.nome}
                              </h4>
                              <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 border border-green-200 dark:border-green-800 rounded-full text-xs font-medium shrink-0">
                                {formatarCategoria(plano.categoria)}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                {plano.totalTarefas} tarefas
                              </span>
                              <span className="flex items-center gap-1">
                                <Wrench className="h-3 w-3" />
                                {plano.totalEquipamentos} equipamentos
                              </span>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </>
                )}
              </>
            )}
          </div>

          {/* Preview do Item Selecionado */}
          {itemSelecionado && (
            <div className="p-4 bg-muted/50 rounded-lg border border-border">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2 text-foreground">
                {tipoOrigem === 'ANOMALIA' ? (
                  <>
                    <AlertTriangle className="h-4 w-4 text-primary" />
                    Anomalia Selecionada:
                  </>
                ) : (
                  <>
                    <Layers className="h-4 w-4 text-green-600 dark:text-green-400" />
                    Plano Selecionado:
                  </>
                )}
              </h4>
              
              {tipoOrigem === 'ANOMALIA' ? (
                <div className="space-y-2">
                  <p className="font-medium text-foreground">{itemSelecionado.descricao}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="space-y-1">
                      <p className="text-muted-foreground">
                        <strong>Local:</strong> {itemSelecionado.local}
                      </p>
                      <p className="text-muted-foreground">
                        <strong>Equipamento:</strong> {itemSelecionado.ativo}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">
                        <strong>Prioridade:</strong> {formatarPrioridade(itemSelecionado.prioridade)}
                      </p>
                      <p className="text-muted-foreground">
                        <strong>Data:</strong> {new Date(itemSelecionado.data).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="font-medium text-foreground">{itemSelecionado.nome}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="space-y-1">
                      <p className="text-muted-foreground">
                        <strong>Categoria:</strong> {formatarCategoria(itemSelecionado.categoria)}
                      </p>
                      <p className="text-muted-foreground">
                        <strong>Templates:</strong> {itemSelecionado.totalTarefas} tarefas
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">
                        <strong>Equipamentos:</strong> {itemSelecionado.totalEquipamentos} associados
                      </p>
                      <p className="text-muted-foreground">
                        <strong>Status:</strong> <span className="text-green-600 dark:text-green-400">Ativo</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};