// src/features/planos-manutencao/components/PlantaEquipamentoController.tsx
import React from 'react';
import { FormFieldProps } from '@/types/base';
import { PlantasService, PlantaResponse } from '@/services/plantas.services';
import { getUnidadesByPlanta } from '@/services/unidades.services';
import { EquipamentosApiService, EquipamentoApiResponse } from '@/services/equipamentos.services';
import { Loader2 } from 'lucide-react';

interface PlantaEquipamentoValue {
  planta_id?: string;
  unidade_id?: string; // NOVO: Unidade do equipamento
  equipamento_id?: string;
}

interface PlantaEquipamentoControllerProps extends Partial<FormFieldProps> {
  value?: PlantaEquipamentoValue;
  onChange: (value: PlantaEquipamentoValue) => void;
  disabled?: boolean;
  mode?: 'create' | 'edit' | 'view';
}

export const PlantaEquipamentoController: React.FC<PlantaEquipamentoControllerProps> = ({
  value,
  onChange,
  disabled = false,
  mode = 'create'
}) => {
  const [plantas, setPlantas] = React.useState<PlantaResponse[]>([]);
  const [unidades, setUnidades] = React.useState<any[]>([]); // NOVO: Estado para unidades
  const [equipamentos, setEquipamentos] = React.useState<EquipamentoApiResponse[]>([]);
  const [loadingPlantas, setLoadingPlantas] = React.useState(false);
  const [loadingUnidades, setLoadingUnidades] = React.useState(false); // NOVO: Loading state
  const [loadingEquipamentos, setLoadingEquipamentos] = React.useState(false);
  const [plantaId, setPlantaId] = React.useState(value?.planta_id || '');
  const [unidadeId, setUnidadeId] = React.useState(value?.unidade_id || ''); // NOVO: Estado para unidade
  const [equipamentoId, setEquipamentoId] = React.useState(value?.equipamento_id || '');

  // Estados para armazenar nomes carregados
  const [plantaNome, setPlantaNome] = React.useState<string>('');
  const [unidadeNome, setUnidadeNome] = React.useState<string>('');
  const [dadosCarregados, setDadosCarregados] = React.useState(false);

  const equipamentosService = React.useMemo(() => new EquipamentosApiService(), []);
  
  const isCreateMode = mode === 'create';
  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';

  // Carregar plantas no modo create OU buscar planta específica nos modos edit/view
  React.useEffect(() => {
    const loadPlantas = async () => {
      if (isCreateMode) {
        // Modo create: carrega lista completa
        setLoadingPlantas(true);
        try {
          const response = await PlantasService.getAllPlantas({ limit: 100 });
          setPlantas(response.data);
          console.log('Plantas carregadas:', response.data.length);
        } catch (error) {
          console.error('Erro ao carregar plantas:', error);
          setPlantas([]);
        } finally {
          setLoadingPlantas(false);
        }
      } else if (plantaId && (isEditMode || isViewMode)) {
        // Modos edit/view: busca apenas a planta específica
        setLoadingPlantas(true);
        try {
          const planta = await PlantasService.getPlanta(plantaId);
          setPlantas([planta]);
          console.log('Planta específica carregada:', planta.nome);
        } catch (error) {
          console.error('Erro ao carregar planta específica:', error);
          setPlantas([]);
        } finally {
          setLoadingPlantas(false);
        }
      }
    };

    loadPlantas();
  }, [isCreateMode, isEditMode, isViewMode, plantaId]);

  // NOVO: Carregar unidades quando planta muda
  React.useEffect(() => {
    const loadUnidades = async () => {
      if (!plantaId) {
        setUnidades([]);
        return;
      }

      setLoadingUnidades(true);
      try {
        console.log('Carregando unidades da planta:', plantaId);
        const response = await getUnidadesByPlanta(plantaId);
        setUnidades(response || []);
        console.log('Unidades carregadas:', response?.length || 0);
      } catch (error) {
        console.error('Erro ao carregar unidades:', error);
        setUnidades([]);
      } finally {
        setLoadingUnidades(false);
      }
    };

    loadUnidades();
  }, [plantaId]);

  // Sincronizar com valor externo (apenas quando value muda externamente)
  React.useEffect(() => {
    if (value?.planta_id !== plantaId) {
      setPlantaId(value?.planta_id || '');
    }
    if (value?.unidade_id !== unidadeId) {
      setUnidadeId(value?.unidade_id || '');
      // Reset do flag de carregamento quando unidadeId muda
      if (value?.unidade_id) {
        setDadosCarregados(false);
      }
    }
    if (value?.equipamento_id !== equipamentoId) {
      setEquipamentoId(value?.equipamento_id || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Carregar dados em modo view/edit: buscar equipamento que já vem com unidade (com nome e planta_id)
  React.useEffect(() => {
    const loadDadosViewMode = async () => {
      if ((isViewMode || isEditMode) && equipamentoId && !dadosCarregados) {
        try {
          const equipamento = await equipamentosService.findOne(equipamentoId);

          // O equipamento já vem com a unidade completa
          if (equipamento.unidade) {
            const unidade = equipamento.unidade;

            // Pegar nome da unidade
            setUnidadeNome(unidade.nome);
            setUnidadeId(unidade.id);

            // Buscar nome da planta usando planta_id da unidade
            if (unidade.planta_id) {
              const planta = await PlantasService.getPlanta(unidade.planta_id);
              setPlantaNome(planta.nome);
              setPlantaId(planta.id);
            }

            setDadosCarregados(true);
          } else {
            setDadosCarregados(true);
          }
        } catch (error) {
          console.error('Erro ao buscar dados do equipamento:', error);
          setDadosCarregados(true);
        }
      }
    };

    loadDadosViewMode();
  }, [equipamentoId, isViewMode, isEditMode, dadosCarregados, equipamentosService]);

  // Carregar equipamentos quando unidade muda ou no modo edit
  React.useEffect(() => {
    const loadEquipamentos = async () => {
      if (!unidadeId) {
        setEquipamentos([]);
        return;
      }

      setLoadingEquipamentos(true);
      try {
        console.log('Carregando equipamentos da unidade:', unidadeId);
        const response = await equipamentosService.findAll({
          unidade_id: unidadeId, // ✅ Corrigido: usar unidade_id para filtrar corretamente
          limit: 100
        });
        
        console.log('Equipamentos carregados:', response.data.length);
        setEquipamentos(response.data);
        
        // Se estamos no modo edit/view e temos dados do equipamento aninhado,
        // adicionar o equipamento específico se não estiver na lista
        if (!isCreateMode && value?.equipamento_id && (value as any)?.equipamento_nome) {
          const equipamentoAtual = response.data.find(eq => eq.id === value.equipamento_id);
          if (!equipamentoAtual) {
            // Adicionar equipamento atual à lista usando dados aninhados
            const equipamentoAninhado = {
              id: value.equipamento_id,
              nome: (value as any).equipamento_nome,
              tipo_equipamento: (value as any)?.equipamento_tipo || '',
              tipo: (value as any)?.equipamento_tipo || '',
              planta_id: plantaId,
              classificacao: 'UC',
              criticidade: 'MEDIA',
              status: 'ATIVO',
              plantaId: parseInt(plantaId),
              proprietarioId: 1,
              criadoEm: '',
              atualizadoEm: ''
            };
            setEquipamentos(prev => [equipamentoAninhado as any, ...prev]);
            console.log('Equipamento atual adicionado à lista:', equipamentoAninhado.nome);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar equipamentos:', error);
        
        // Se estamos em modo edit/view e temos dados aninhados, usar esses dados
        if (!isCreateMode && value?.equipamento_id && (value as any)?.equipamento_nome) {
          setEquipamentos([{
            id: value.equipamento_id,
            nome: (value as any).equipamento_nome,
            tipo_equipamento: (value as any)?.equipamento_tipo || '',
            planta_id: plantaId,
            classificacao: 'UC',
            criticidade: '3',
            proprietario_id: '1',
            created_at: new Date(),
            updated_at: new Date()
          }]);
        } else {
          setEquipamentos([]);
        }
      } finally {
        setLoadingEquipamentos(false);
      }
    };

    loadEquipamentos();
  }, [unidadeId, equipamentosService, isCreateMode, value?.equipamento_id, (value as any)?.equipamento_nome]);

  const handlePlantaChange = (newPlantaId: string) => {
    console.log('Planta selecionada:', newPlantaId);

    setPlantaId(newPlantaId);
    setUnidadeId(''); // Resetar unidade quando planta muda
    setEquipamentoId(''); // Resetar equipamento quando planta muda

    const newValue: PlantaEquipamentoValue = {
      planta_id: newPlantaId || undefined,
      unidade_id: undefined,
      equipamento_id: undefined
    };

    onChange(newValue);
  };

  const handleUnidadeChange = (newUnidadeId: string) => {
    console.log('Unidade selecionada:', newUnidadeId);

    setUnidadeId(newUnidadeId);
    setEquipamentoId(''); // Resetar equipamento quando unidade muda

    const newValue: PlantaEquipamentoValue = {
      planta_id: plantaId || undefined,
      unidade_id: newUnidadeId || undefined,
      equipamento_id: undefined
    };

    onChange(newValue);
  };

  const handleEquipamentoChange = (newEquipamentoId: string) => {
    console.log('🎯 Equipamento selecionado:', newEquipamentoId);

    setEquipamentoId(newEquipamentoId);

    const newValue: PlantaEquipamentoValue = {
      planta_id: plantaId || undefined,
      unidade_id: unidadeId || undefined,
      equipamento_id: newEquipamentoId || undefined
    };

    console.log('📤 Enviando onChange com valor:', newValue);
    onChange(newValue);
  };

  // Função para obter nome da planta (SIMPLIFICADA)
  const getPlantaNome = (): string => {
    // Usar estado se disponível (modo view)
    if (plantaNome) return plantaNome;

    // Buscar na lista se disponível (modo create/edit)
    const planta = plantas.find(p => p.id === plantaId);
    if (planta?.nome) return planta.nome;

    return plantaId ? `Planta ID: ${plantaId}` : '';
  };

  // Função para obter nome da unidade (SIMPLIFICADA)
  const getUnidadeNome = (): string => {
    // Usar estado se disponível (modo view)
    if (unidadeNome) return unidadeNome;

    // Buscar na lista se disponível (modo create/edit)
    const unidade = unidades.find(u => u.id === unidadeId);
    if (unidade?.nome) return unidade.nome;

    return unidadeId ? `Unidade ID: ${unidadeId}` : '';
  };

  // Função para obter nome do equipamento
  const getEquipamentoNome = (): string => {
    if (!equipamentoId) return '';
    
    // Primeiro: tenta usar dados aninhados da API
    if ((value as any)?.equipamento_nome) {
      return (value as any).equipamento_nome;
    }
    
    // Segundo: busca na lista carregada
    const equipamento = equipamentos.find(e => e.id === equipamentoId);
    if (equipamento?.nome) {
      return equipamento.nome;
    }
    
    // Fallback: mostra o ID
    return `Equipamento ID: ${equipamentoId}`;
  };

  // ==============================================
  // MODO VIEW/EDIT: Interface simples apenas para exibição (NÃO EDITÁVEL)
  // ==============================================
  if (isViewMode || isEditMode) {
    return (
      <div className="space-y-4">
        {/* Planta */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Planta/Local</label>
          <input
            type="text"
            value={plantaNome || 'Carregando...'}
            disabled
            className="w-full p-2 border rounded-md bg-muted text-foreground opacity-60 cursor-not-allowed"
          />
        </div>

        {/* Unidade */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Unidade</label>
          <input
            type="text"
            value={unidadeNome || 'Carregando...'}
            disabled
            className="w-full p-2 border rounded-md bg-muted text-foreground opacity-60 cursor-not-allowed"
          />
        </div>

        {/* Equipamento */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Equipamento</label>
          <input
            type="text"
            value={getEquipamentoNome() || 'Carregando...'}
            disabled
            className="w-full p-2 border rounded-md bg-muted text-foreground opacity-60 cursor-not-allowed"
          />
        </div>
      </div>
    );
  }

  // ==============================================
  // MODO CREATE: Interface com selects dinâmicos
  // ==============================================
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Planta/Local <span className="text-red-500">*</span>
        </label>
        {(
          <>
            {loadingPlantas && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Carregando plantas...</span>
              </div>
            )}
            
            <select
              value={plantaId}
              onChange={(e) => handlePlantaChange(e.target.value)}
              disabled={disabled || loadingPlantas}
              className="w-full p-2 border rounded-md bg-background text-foreground"
              required
            >
              <option value="">
                {loadingPlantas ? "Carregando plantas..." : "Selecione a planta..."}
              </option>
              {plantas.map((planta) => (
                <option key={planta.id} value={planta.id}>
                  {planta.nome}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      {/* NOVO: Seletor de Unidade */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Unidade <span className="text-red-500">*</span>
        </label>

        {isViewMode || isEditMode ? (
          <input
            type="text"
            value={getUnidadeNome() || 'Unidade não especificada'}
            disabled
            className="w-full p-2 border rounded-md bg-muted text-foreground opacity-60 cursor-not-allowed"
          />
        ) : (
          <>
            {loadingUnidades && plantaId && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Carregando unidades...</span>
              </div>
            )}

            <select
              value={unidadeId}
              onChange={(e) => handleUnidadeChange(e.target.value)}
              disabled={disabled || !plantaId || loadingUnidades}
              className="w-full p-2 border rounded-md bg-background text-foreground"
              required
            >
              <option value="">
                {!plantaId
                  ? "Primeiro selecione uma planta"
                  : loadingUnidades
                    ? "Carregando unidades..."
                    : "Selecione a unidade..."
                }
              </option>
              {unidades.map((unidade) => (
                <option key={unidade.id} value={unidade.id}>
                  {unidade.nome}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          Equipamento <span className="text-red-500">*</span>
        </label>

        {isViewMode || isEditMode ? (
          <input
            type="text"
            value={getEquipamentoNome() || 'Equipamento não especificado'}
            disabled
            className="w-full p-2 border rounded-md bg-muted text-foreground opacity-60 cursor-not-allowed"
          />
        ) : (
          <>
            {loadingEquipamentos && unidadeId && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Carregando equipamentos...</span>
              </div>
            )}

            <select
              value={equipamentoId}
              onChange={(e) => handleEquipamentoChange(e.target.value)}
              disabled={disabled || !unidadeId || loadingEquipamentos}
              className="w-full p-2 border rounded-md bg-background text-foreground"
              required
            >
              <option value="">
                {!unidadeId
                  ? "Primeiro selecione uma unidade"
                  : loadingEquipamentos
                    ? "Carregando equipamentos..."
                    : "Selecione o equipamento..."
                }
              </option>
              {equipamentos.map((equipamento) => (
                <option key={equipamento.id} value={equipamento.id}>
                  {equipamento.nome} - {(equipamento as any).tipo_equipamento || (equipamento as any).tipo || 'N/A'}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded">
          <div>Debug: Planta={plantaId}, Unidade={unidadeId}, Equipamento={equipamentoId}</div>
          <div>Plantas: {plantas.length}, Unidades: {unidades.length}, Equipamentos: {equipamentos.length}</div>
        </div>
      )}
    </div>
  );
};