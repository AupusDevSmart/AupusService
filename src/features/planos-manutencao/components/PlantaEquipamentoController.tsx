// src/features/planos-manutencao/components/PlantaEquipamentoController.tsx
import React from 'react';
import { FormFieldProps } from '@/types/base';
import { PlantasService, PlantaResponse } from '@/services/plantas.services';
import { getUnidadesByPlanta } from '@/services/unidades.services';
import { EquipamentosApiService, EquipamentoApiResponse } from '@/services/equipamentos.services';
import { ComboboxField } from '@/components/ui/combobox-field';

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
          semPlano: true,
          limit: 100
        });
        setEquipamentos(response.data.data || []);
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

  const plantaOptions = React.useMemo(
    () => plantas.map((p) => ({ value: p.id, label: p.nome })),
    [plantas],
  );

  const unidadeOptions = React.useMemo(
    () => unidades.map((u) => ({ value: u.id, label: u.nome })),
    [unidades],
  );

  const equipamentoOptions = React.useMemo(
    () =>
      equipamentos.map((e) => ({
        value: e.id,
        label: `${e.nome} - ${(e as any).tipo_equipamento || (e as any).tipo || 'N/A'}`,
      })),
    [equipamentos],
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <ComboboxField
        label="Planta/Local"
        placeholder={loadingPlantas ? 'Carregando...' : 'Selecione a planta...'}
        searchPlaceholder="Buscar planta..."
        emptyText="Nenhuma planta encontrada."
        options={plantaOptions}
        value={plantaId}
        onChange={handlePlantaChange}
        disabled={disabled || loadingPlantas}
        required
      />

      <ComboboxField
        label="Unidade"
        placeholder={
          !plantaId
            ? 'Selecione uma planta primeiro'
            : loadingUnidades
              ? 'Carregando...'
              : 'Selecione a unidade...'
        }
        searchPlaceholder="Buscar unidade..."
        emptyText="Nenhuma unidade encontrada."
        options={unidadeOptions}
        value={unidadeId}
        onChange={handleUnidadeChange}
        disabled={disabled || !plantaId || loadingUnidades}
        required
      />

      <ComboboxField
        label="Equipamento"
        placeholder={
          !unidadeId
            ? 'Selecione uma unidade primeiro'
            : loadingEquipamentos
              ? 'Carregando...'
              : 'Selecione o equipamento...'
        }
        searchPlaceholder="Buscar equipamento..."
        emptyText="Nenhum equipamento encontrado."
        options={equipamentoOptions}
        value={equipamentoId}
        onChange={handleEquipamentoChange}
        disabled={disabled || !unidadeId || loadingEquipamentos}
        required
      />
    </div>
  );
};
