// src/features/solicitacoes-servico/components/SimpleCascadeSelector.tsx
import React, { useState, useEffect, useRef } from 'react';
import { ComboboxField } from '@/components/ui/combobox-field';
import { useSolicitacoesSelectData } from '../hooks/useSolicitacoesSelectData';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

interface SimpleCascadeSelectorProps {
  value?: any;
  onChange?: (value: any) => void;
  onMultipleChange?: (updates: Record<string, unknown>) => void;
  disabled?: boolean;
  formData?: any;
  entity?: any;
}

export const SimpleCascadeSelector: React.FC<SimpleCascadeSelectorProps> = ({
  onMultipleChange,
  disabled = false,
  formData,
  entity
}) => {

  // Estado local para evitar loops
  const [localState, setLocalState] = useState({
    proprietario_id: '',
    planta_id: '',
    unidade_id: ''
  });

  const initializedEntityRef = useRef<string | null>(null);

  // Buscar dados
  const { proprietarios, plantas, unidades, loading, error } = useSolicitacoesSelectData();

  // Sincronizar com entity diretamente (mais confiável que formData para dados iniciais)
  useEffect(() => {
    const source = entity && entity.id ? entity : formData;
    const sourceId = source?.id || null;

    if (!source) return;

    const propId = (source.proprietario_id || '')?.toString().trim();
    const plantId = (source.planta_id || '')?.toString().trim();
    const unidId = (source.unidade_id || '')?.toString().trim();

    // Evitar re-inicialização se já inicializou com esta entity
    if (sourceId && sourceId === initializedEntityRef.current) return;

    if (propId || plantId || unidId) {
      setLocalState({
        proprietario_id: propId,
        planta_id: plantId,
        unidade_id: unidId
      });
      if (sourceId) initializedEntityRef.current = sourceId;
    }
  }, [entity?.id, entity?.proprietario_id, entity?.planta_id, entity?.unidade_id,
      formData?.proprietario_id, formData?.planta_id, formData?.unidade_id]);

  // Handler para mudança de proprietário
  const handleProprietarioChange = (value: string) => {
    const newState = {
      proprietario_id: value,
      planta_id: '',
      unidade_id: ''
    };

    setLocalState(newState);

    if (onMultipleChange) {
      onMultipleChange(newState);
    }
  };

  // Handler para mudança de planta
  const handlePlantaChange = (value: string) => {
    const newState = {
      ...localState,
      planta_id: value,
      unidade_id: ''
    };

    setLocalState(newState);

    if (onMultipleChange) {
      onMultipleChange({
        planta_id: value,
        unidade_id: ''
      });
    }
  };

  // Handler para mudança de unidade
  const handleUnidadeChange = (value: string) => {
    setLocalState(prev => ({
      ...prev,
      unidade_id: value
    }));

    if (onMultipleChange) {
      onMultipleChange({
        unidade_id: value
      });
    }
  };

  // Obter opções filtradas
  const plantasOptions = plantas(localState.proprietario_id);
  // IMPORTANTE: passar o unidade_id atual para garantir que ela apareça nas opções
  const unidadesOptions = unidades(localState.planta_id, localState.unidade_id);

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

  if (error) {
    return (
      <Alert className="mb-4">
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar dados: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Seletor de Proprietário */}
      <ComboboxField
        label="Proprietário"
        placeholder="Selecione o proprietário"
        searchPlaceholder="Buscar proprietário..."
        emptyText="Nenhum proprietário encontrado"
        options={proprietarios}
        value={localState.proprietario_id}
        onChange={handleProprietarioChange}
        disabled={disabled || loading}
      />

      {/* Seletor de Planta - só aparece se tiver proprietário selecionado */}
      {localState.proprietario_id && (
        <ComboboxField
          label="Planta"
          placeholder={
            plantasOptions.length === 0
              ? "Nenhuma planta disponível para este proprietário"
              : "Selecione a planta"
          }
          searchPlaceholder="Buscar planta..."
          emptyText="Nenhuma planta encontrada"
          options={plantasOptions}
          value={localState.planta_id}
          onChange={handlePlantaChange}
          disabled={disabled || loading || plantasOptions.length === 0}
        />
      )}

      {/* Seletor de Unidade - só aparece se tiver planta selecionada */}
      {localState.proprietario_id && localState.planta_id && (
        <ComboboxField
          label="Unidade"
          placeholder={
            unidadesOptions.length === 0
              ? "Nenhuma unidade disponível para esta planta"
              : "Selecione a unidade"
          }
          searchPlaceholder="Buscar unidade..."
          emptyText="Nenhuma unidade encontrada"
          options={unidadesOptions}
          value={localState.unidade_id}
          onChange={handleUnidadeChange}
          disabled={disabled || loading || unidadesOptions.length === 0}
        />
      )}

      {/* Mensagem informativa */}
      {!localState.proprietario_id && (
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            Selecione um proprietário para visualizar as plantas disponíveis.
          </AlertDescription>
        </Alert>
      )}

      {localState.proprietario_id && !localState.planta_id && plantasOptions.length > 0 && (
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            Selecione uma planta para visualizar as unidades disponíveis.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};