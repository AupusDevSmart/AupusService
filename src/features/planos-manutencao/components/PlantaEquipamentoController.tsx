// src/features/planos-manutencao/components/PlantaEquipamentoController.tsx - OTIMIZADO
import React from 'react';
import { FormFieldProps } from '@/types/base';
import { PlantasService, PlantaResponse } from '@/services/plantas.services';
import { getUnidadesByPlanta } from '@/services/unidades.services';
import { EquipamentosApiService, EquipamentoApiResponse } from '@/services/equipamentos.services';
import { Loader2 } from 'lucide-react';

interface PlantaEquipamentoValue {
  planta_id?: string;
  unidade_id?: string;
  equipamento_id?: string;
  // Dados aninhados para exibição
  planta_nome?: string;
  unidade_nome?: string;
  equipamento_nome?: string;
  equipamento_tipo?: string;
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
  const [unidades, setUnidades] = React.useState<any[]>([]);
  const [equipamentos, setEquipamentos] = React.useState<EquipamentoApiResponse[]>([]);
  const [loadingPlantas, setLoadingPlantas] = React.useState(false);
  const [loadingUnidades, setLoadingUnidades] = React.useState(false);
  const [loadingEquipamentos, setLoadingEquipamentos] = React.useState(false);
  const [plantaId, setPlantaId] = React.useState(value?.planta_id || '');
  const [unidadeId, setUnidadeId] = React.useState(value?.unidade_id || '');
  const [equipamentoId, setEquipamentoId] = React.useState(value?.equipamento_id || '');

  const equipamentosService = React.useMemo(() => new EquipamentosApiService(), []);

  const isCreateMode = mode === 'create';
  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';

  // ==============================================
  // MODO VIEW/EDIT: Apenas exibir dados (SEM carregar listas)
  // ==============================================
  if (isViewMode || isEditMode) {
    const plantaNome = value?.planta_nome || 'Planta não informada';
    const unidadeNome = value?.unidade_nome || 'Unidade não informada';
    const equipamentoNome = value?.equipamento_nome || 'Equipamento não informado';

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Planta */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Planta/Local</label>
          <div className="p-3 border rounded-md bg-muted/30">
            <div className="text-sm font-medium">{plantaNome}</div>
          </div>
        </div>

        {/* Unidade */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Unidade</label>
          <div className="p-3 border rounded-md bg-muted/30">
            <div className="text-sm font-medium">{unidadeNome}</div>
          </div>
        </div>

        {/* Equipamento */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Equipamento</label>
          <div className="p-3 border rounded-md bg-muted/30">
            <div className="text-sm font-medium">{equipamentoNome}</div>
            {value?.equipamento_tipo && (
              <div className="text-xs text-muted-foreground mt-1">
                Tipo: {value.equipamento_tipo}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==============================================
  // MODO CREATE: Carregar listas e permitir seleção
  // ==============================================

  // Carregar plantas (apenas no modo create)
  React.useEffect(() => {
    if (!isCreateMode) return;

    const loadPlantas = async () => {
      setLoadingPlantas(true);
      try {
        const response = await PlantasService.getAllPlantas({ limit: 100 });
        setPlantas(response.data);
      } catch (error) {
        console.error('Erro ao carregar plantas:', error);
        setPlantas([]);
      } finally {
        setLoadingPlantas(false);
      }
    };

    loadPlantas();
  }, [isCreateMode]);

  // Carregar unidades quando planta muda
  React.useEffect(() => {
    if (!isCreateMode || !plantaId) {
      setUnidades([]);
      return;
    }

    const loadUnidades = async () => {
      setLoadingUnidades(true);
      try {
        const response = await getUnidadesByPlanta(plantaId);
        setUnidades(response || []);
      } catch (error) {
        console.error('Erro ao carregar unidades:', error);
        setUnidades([]);
      } finally {
        setLoadingUnidades(false);
      }
    };

    loadUnidades();
  }, [isCreateMode, plantaId]);

  // Carregar equipamentos quando unidade muda
  React.useEffect(() => {
    if (!isCreateMode || !unidadeId) {
      setEquipamentos([]);
      return;
    }

    const loadEquipamentos = async () => {
      setLoadingEquipamentos(true);
      try {
        const response = await equipamentosService.findAll({
          unidade_id: unidadeId,
          limit: 100
        });
        setEquipamentos(response.data);
      } catch (error) {
        console.error('Erro ao carregar equipamentos:', error);
        setEquipamentos([]);
      } finally {
        setLoadingEquipamentos(false);
      }
    };

    loadEquipamentos();
  }, [isCreateMode, unidadeId, equipamentosService]);

  // Sincronizar estado interno com value externo
  React.useEffect(() => {
    if (value?.planta_id !== plantaId) setPlantaId(value?.planta_id || '');
    if (value?.unidade_id !== unidadeId) setUnidadeId(value?.unidade_id || '');
    if (value?.equipamento_id !== equipamentoId) setEquipamentoId(value?.equipamento_id || '');
  }, [value]);

  const handlePlantaChange = (newPlantaId: string) => {
    setPlantaId(newPlantaId);
    setUnidadeId('');
    setEquipamentoId('');

    onChange({
      planta_id: newPlantaId || undefined,
      unidade_id: undefined,
      equipamento_id: undefined
    });
  };

  const handleUnidadeChange = (newUnidadeId: string) => {
    setUnidadeId(newUnidadeId);
    setEquipamentoId('');

    onChange({
      planta_id: plantaId || undefined,
      unidade_id: newUnidadeId || undefined,
      equipamento_id: undefined
    });
  };

  const handleEquipamentoChange = (newEquipamentoId: string) => {
    setEquipamentoId(newEquipamentoId);

    onChange({
      planta_id: plantaId || undefined,
      unidade_id: unidadeId || undefined,
      equipamento_id: newEquipamentoId || undefined
    });
  };

  return (
    <div className="space-y-4">
      {/* Planta */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Planta/Local <span className="text-red-500">*</span>
        </label>

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
            {loadingPlantas ? 'Carregando plantas...' : 'Selecione a planta...'}
          </option>
          {plantas.map((planta) => (
            <option key={planta.id} value={planta.id}>
              {planta.nome}
            </option>
          ))}
        </select>
      </div>

      {/* Unidade */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Unidade <span className="text-red-500">*</span>
        </label>

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
              ? 'Primeiro selecione uma planta'
              : loadingUnidades
                ? 'Carregando unidades...'
                : 'Selecione a unidade...'}
          </option>
          {unidades.map((unidade) => (
            <option key={unidade.id} value={unidade.id}>
              {unidade.nome}
            </option>
          ))}
        </select>
      </div>

      {/* Equipamento */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Equipamento <span className="text-red-500">*</span>
        </label>

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
              ? 'Primeiro selecione uma unidade'
              : loadingEquipamentos
                ? 'Carregando equipamentos...'
                : 'Selecione o equipamento...'}
          </option>
          {equipamentos.map((equipamento) => (
            <option key={equipamento.id} value={equipamento.id}>
              {equipamento.nome} -{' '}
              {(equipamento as any).tipo_equipamento || (equipamento as any).tipo || 'N/A'}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
