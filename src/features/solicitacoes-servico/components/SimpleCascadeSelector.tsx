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
  const { plantas, unidades, proprietarioDaPlanta, loading, error } =
    useSolicitacoesSelectData();

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

  /**
   * Planta escolhida: o proprietário vem junto, deduzido dela.
   *
   * O combo de proprietário saiu da tela — era um passo a mais para chegar
   * onde se queria, e a informação é consequência da planta, nunca o
   * contrário. Mas o campo continua existindo no registro, então é preenchido
   * aqui: sem isso a solicitação nasceria sem dono.
   */
  const handlePlantaChange = (value: string) => {
    const proprietarioId = proprietarioDaPlanta(value);

    const newState = {
      proprietario_id: proprietarioId,
      planta_id: value,
      unidade_id: ''
    };

    setLocalState(newState);

    if (onMultipleChange) {
      onMultipleChange(newState);
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

  // Todas as plantas: a lista deixou de depender do proprietário.
  const plantasOptions = plantas();
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
    // Lado a lado no desktop, empilhados no celular. São dois passos e ambos
    // curtos: separá-los em linhas gastava altura sem ganhar clareza.
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <ComboboxField
        label="Planta"
        placeholder={
          plantasOptions.length === 0 ? 'Nenhuma planta disponível' : 'Selecione a planta'
        }
        searchPlaceholder="Buscar planta..."
        emptyText="Nenhuma planta encontrada"
        options={plantasOptions}
        value={localState.planta_id}
        onChange={handlePlantaChange}
        disabled={disabled || loading || plantasOptions.length === 0}
      />

      {/* A instalação fica visível desde o começo, apenas desabilitada: some
          e volta, a linha inteira dançava a cada escolha de planta. */}
      <ComboboxField
        label="Instalação"
        placeholder={
          !localState.planta_id
            ? 'Escolha a planta primeiro'
            : unidadesOptions.length === 0
              ? 'Nenhuma instalação nesta planta'
              : 'Selecione a instalação'
        }
        searchPlaceholder="Buscar instalação..."
        emptyText="Nenhuma instalação encontrada"
        options={unidadesOptions}
        value={localState.unidade_id}
        onChange={handleUnidadeChange}
        disabled={disabled || loading || !localState.planta_id || unidadesOptions.length === 0}
      />
    </div>
  );
};