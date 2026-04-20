// src/features/anomalias/components/LocalizacaoController.tsx
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ComboboxField, ComboboxOption } from '@/components/ui/combobox-field';
import { PlantasService } from '@/services/plantas.services';
import { getUnidadesByPlanta } from '@/services/unidades.services';
import { useEquipamentos } from '@/features/equipamentos/hooks/useEquipamentos';

interface LocalizacaoValue {
  plantaId?: string | number;
  unidadeId?: string | number;
  equipamentoId?: string | number;
  local?: string;
  ativo?: string;
}

interface LocalizacaoControllerProps {
  value?: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  mode?: 'create' | 'edit' | 'view';
  entity?: any;
}

export const LocalizacaoController = ({
  value,
  onChange,
  disabled,
  mode = 'create',
  entity
}: LocalizacaoControllerProps) => {
  const [plantasOptions, setPlantasOptions] = useState<ComboboxOption[]>([]);
  const [unidadesOptions, setUnidadesOptions] = useState<ComboboxOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingUnidades, setLoadingUnidades] = useState(false);
  const initializedRef = useRef(false);

  const { equipamentos, fetchEquipamentos, loading: loadingEquipamentos } = useEquipamentos();

  const isViewMode = mode === 'view';

  // Extrair IDs do value OU do entity (para view/edit)
  // Cadeia: equipamento → unidade → planta (quando planta_id direto é null)
  const plantaId = value?.plantaId?.toString().trim()
    || entity?.planta_id?.toString().trim()
    || entity?.equipamento?.unidade?.planta_id?.toString().trim()
    || entity?.equipamento?.unidade?.planta?.id?.toString().trim()
    || '';
  const unidadeId = value?.unidadeId?.toString().trim()
    || entity?.equipamento?.unidade_id?.toString().trim()
    || entity?.equipamento?.unidade?.id?.toString().trim()
    || '';
  const equipamentoId = value?.equipamentoId?.toString().trim()
    || entity?.equipamento_id?.toString().trim()
    || '';

  // Carregar plantas
  useEffect(() => {
    const loadPlantas = async () => {
      try {
        const response = await PlantasService.getAllPlantas({ limit: 100 });
        const plantasData = Array.isArray(response.data) ? response.data : (response as any).data?.data || [];
        const options = plantasData.map((p: any) => ({
          value: p.id.toString().trim(),
          label: p.nome,
        }));
        setPlantasOptions(options);
      } catch (error) {
        console.error('Erro ao carregar plantas:', error);
        setPlantasOptions([]);
      } finally {
        setLoading(false);
      }
    };
    loadPlantas();
  }, []);

  // Carregar unidades quando planta mudar
  useEffect(() => {
    if (!plantaId) {
      setUnidadesOptions([]);
      return;
    }

    const loadUnidades = async () => {
      setLoadingUnidades(true);
      try {
        const response = await getUnidadesByPlanta(plantaId);
        const options = (response || []).map((u: any) => ({
          value: u.id.toString().trim(),
          label: u.nome,
        }));
        setUnidadesOptions(options);
      } catch (error) {
        console.error('Erro ao carregar unidades:', error);
        setUnidadesOptions([]);
      } finally {
        setLoadingUnidades(false);
      }
    };
    loadUnidades();
  }, [plantaId]);

  // Carregar equipamentos quando unidade mudar
  useEffect(() => {
    if (!unidadeId || !plantaId) return;

    fetchEquipamentos({
      proprietarioId: 'all',
      plantaId,
      unidadeId,
      classificacao: 'UC',
      criticidade: 'all',
      limit: 100
    }).catch(err => console.error('Erro ao carregar equipamentos:', err));
  }, [unidadeId, plantaId]);

  // Inicializar value a partir do entity em view/edit (uma vez)
  useEffect(() => {
    if (initializedRef.current) return;
    if (!entity || mode === 'create') return;
    if (value?.plantaId) return; // Já tem valor

    const entPlantaId = entity.planta_id?.toString().trim()
      || entity.equipamento?.unidade?.planta_id?.toString().trim()
      || entity.equipamento?.unidade?.planta?.id?.toString().trim()
      || '';
    const entUnidadeId = entity.equipamento?.unidade_id?.toString().trim()
      || entity.equipamento?.unidade?.id?.toString().trim()
      || '';
    const entEquipId = entity.equipamento_id?.toString().trim() || '';

    if (entPlantaId || entEquipId) {
      initializedRef.current = true;
      onChange({
        plantaId: entPlantaId || undefined,
        unidadeId: entUnidadeId || undefined,
        equipamentoId: entEquipId || undefined,
        local: entity.local || entity.planta?.nome || entity.equipamento?.unidade?.planta?.nome || '',
        ativo: entity.ativo || entity.equipamento?.nome || ''
      } as LocalizacaoValue);
    }
  }, [entity, mode, value?.plantaId, onChange]);

  const equipamentosOptions = useMemo<ComboboxOption[]>(() => {
    return equipamentos
      .filter(eq => {
        const eqUnidadeId = (eq.unidadeId || (eq as any).unidade_id || eq.unidade?.id)?.toString().trim();
        return eq.classificacao === 'UC' && (unidadeId ? eqUnidadeId === unidadeId.trim() : true);
      })
      .map(eq => ({
        value: eq.id.toString().trim(),
        label: eq.nome,
      }));
  }, [equipamentos, unidadeId]);

  // Handlers
  const handlePlantaChange = useCallback((newPlantaId: string) => {
    const plantaSelecionada = plantasOptions.find(p => p.value === newPlantaId);
    onChange({
      plantaId: newPlantaId || undefined,
      unidadeId: undefined,
      equipamentoId: undefined,
      local: plantaSelecionada?.label || '',
      ativo: ''
    } as LocalizacaoValue);
  }, [plantasOptions, onChange]);

  const handleUnidadeChange = useCallback((newUnidadeId: string) => {
    const plantaSelecionada = plantasOptions.find(p => p.value === plantaId);
    onChange({
      plantaId: plantaId || undefined,
      unidadeId: newUnidadeId || undefined,
      equipamentoId: undefined,
      local: plantaSelecionada?.label || '',
      ativo: ''
    } as LocalizacaoValue);
  }, [plantaId, plantasOptions, onChange]);

  const handleEquipamentoChange = useCallback((newEquipamentoId: string) => {
    const plantaSelecionada = plantasOptions.find(p => p.value === plantaId);
    const equipamentoSelecionado = equipamentosOptions.find(e => e.value === newEquipamentoId);
    onChange({
      plantaId: plantaId || undefined,
      unidadeId: unidadeId || undefined,
      equipamentoId: newEquipamentoId || undefined,
      local: plantaSelecionada?.label || '',
      ativo: equipamentoSelecionado?.label || ''
    } as LocalizacaoValue);
  }, [plantaId, unidadeId, plantasOptions, equipamentosOptions, onChange]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded"></div>
          <div className="h-10 bg-muted rounded"></div>
          <div className="h-10 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ComboboxField
        label="Planta/Local"
        placeholder="Selecione a planta..."
        searchPlaceholder="Buscar planta..."
        emptyText="Nenhuma planta encontrada"
        options={plantasOptions}
        value={plantaId}
        onChange={handlePlantaChange}
        disabled={disabled || isViewMode}
        required
      />

      {plantaId && (
        <ComboboxField
          label="Unidade"
          placeholder={
            loadingUnidades
              ? "Carregando unidades..."
              : unidadesOptions.length === 0
                ? "Nenhuma unidade disponivel"
                : "Selecione a unidade..."
          }
          searchPlaceholder="Buscar unidade..."
          emptyText="Nenhuma unidade encontrada"
          options={unidadesOptions}
          value={unidadeId}
          onChange={handleUnidadeChange}
          disabled={disabled || isViewMode || loadingUnidades || unidadesOptions.length === 0}
          required
        />
      )}

      {plantaId && unidadeId && (
        <ComboboxField
          label="Equipamento"
          placeholder={
            loadingEquipamentos
              ? "Carregando equipamentos..."
              : equipamentosOptions.length === 0
                ? "Nenhum equipamento disponivel"
                : "Selecione o equipamento..."
          }
          searchPlaceholder="Buscar equipamento..."
          emptyText="Nenhum equipamento encontrado"
          options={equipamentosOptions}
          value={equipamentoId}
          onChange={handleEquipamentoChange}
          disabled={disabled || isViewMode || loadingEquipamentos || equipamentosOptions.length === 0}
          required
        />
      )}
    </div>
  );
};
