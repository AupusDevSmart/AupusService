// src/features/planos-manutencao/components/PlantaEquipamentoController.tsx
import React from 'react';
import { FormFieldProps } from '@/types/base';
import { PlantasService, PlantaResponse } from '@/services/plantas.services';
import { EquipamentosApiService, EquipamentoApiResponse } from '@/services/equipamentos.services';
import { Loader2 } from 'lucide-react';

interface PlantaEquipamentoValue {
  planta_id?: string;
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
  const [equipamentos, setEquipamentos] = React.useState<EquipamentoApiResponse[]>([]);
  const [loadingPlantas, setLoadingPlantas] = React.useState(false);
  const [loadingEquipamentos, setLoadingEquipamentos] = React.useState(false);
  const [plantaId, setPlantaId] = React.useState(value?.planta_id || '');
  const [equipamentoId, setEquipamentoId] = React.useState(value?.equipamento_id || '');

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

  // Sincronizar com valor externo
  React.useEffect(() => {
    if (value?.planta_id !== plantaId) {
      setPlantaId(value?.planta_id || '');
    }
    if (value?.equipamento_id !== equipamentoId) {
      setEquipamentoId(value?.equipamento_id || '');
    }
  }, [value, plantaId, equipamentoId]);

  // Carregar equipamentos quando planta muda ou no modo edit
  React.useEffect(() => {
    const loadEquipamentos = async () => {
      if (!plantaId) {
        setEquipamentos([]);
        return;
      }

      setLoadingEquipamentos(true);
      try {
        console.log('Carregando equipamentos da planta:', plantaId);
        const response = await equipamentosService.findAll({ 
          planta_id: plantaId,
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
  }, [plantaId, equipamentosService, isCreateMode, value?.equipamento_id, (value as any)?.equipamento_nome]);

  const handlePlantaChange = (newPlantaId: string) => {
    console.log('Planta selecionada:', newPlantaId);
    
    setPlantaId(newPlantaId);
    setEquipamentoId('');
    
    const newValue: PlantaEquipamentoValue = {
      planta_id: newPlantaId || undefined,
      equipamento_id: undefined
    };
    
    onChange(newValue);
  };

  const handleEquipamentoChange = (newEquipamentoId: string) => {
    console.log('Equipamento selecionado:', newEquipamentoId);
    
    setEquipamentoId(newEquipamentoId);
    
    const newValue: PlantaEquipamentoValue = {
      planta_id: plantaId || undefined,
      equipamento_id: newEquipamentoId || undefined
    };
    
    onChange(newValue);
  };

  // Função para obter nome da planta
  const getPlantaNome = (): string => {
    if (!plantaId) return '';
    
    // Primeiro: tenta usar dados aninhados da API
    if ((value as any)?.planta_nome) {
      return (value as any).planta_nome;
    }
    
    // Segundo: busca na lista carregada
    const planta = plantas.find(p => p.id === plantaId);
    if (planta?.nome) {
      return planta.nome;
    }
    
    // Fallback: mostra o ID
    return `Planta ID: ${plantaId}`;
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

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Planta/Local <span className="text-red-500">*</span>
        </label>
        
        {isViewMode || isEditMode ? (
          <>
            {process.env.NODE_ENV === 'development' && (
              <div className="text-xs text-blue-600 mb-1">
                Debug Planta: ID={plantaId}, Nome="{getPlantaNome()}", Plantas na lista={plantas.length}
                <br />
                Dados aninhados: planta_nome={(value as any)?.planta_nome || 'undefined'}
              </div>
            )}
            <input
              type="text"
              value={getPlantaNome() || 'Planta não especificada'}
              disabled
              className="w-full p-2 border rounded-md bg-muted text-foreground opacity-60 cursor-not-allowed"
            />
          </>
        ) : (
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
            {loadingEquipamentos && plantaId && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Carregando equipamentos...</span>
              </div>
            )}
            
            <select
              value={equipamentoId}
              onChange={(e) => handleEquipamentoChange(e.target.value)}
              disabled={disabled || !plantaId || loadingEquipamentos}
              className="w-full p-2 border rounded-md bg-background text-foreground"
              required
            >
              <option value="">
                {!plantaId 
                  ? "Primeiro selecione uma planta" 
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
          <div>Debug: Planta={plantaId}, Equipamento={equipamentoId}</div>
          <div>Plantas: {plantas.length}, Equipamentos: {equipamentos.length}</div>
        </div>
      )}
    </div>
  );
};