// src/features/agenda/components/PlantasSelector.tsx
import React from 'react';
import { FormFieldProps } from '@/types/base';
import { PlantasService, PlantaResponse } from '@/services/plantas.services';
import { Loader2, Building2, Check } from 'lucide-react';

interface PlantasSelectorProps extends Partial<FormFieldProps> {
  value?: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  mode?: 'create' | 'edit' | 'view';
  geral?: boolean;
}

export const PlantasSelector: React.FC<PlantasSelectorProps> = ({
  value = [],
  onChange,
  disabled = false,
  mode = 'create',
  geral = false
}) => {
  const [plantas, setPlantas] = React.useState<PlantaResponse[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isViewMode = mode === 'view';

  // Carregar plantas
  React.useEffect(() => {
    const fetchPlantas = async () => {
      if (geral) {
        // Se é geral, não precisa carregar plantas
        setPlantas([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setPlantas(await PlantasService.listarTodas());
      } catch (err) {
        console.error('[PLANTAS SELECTOR] Erro ao carregar plantas:', err);
        setError((err instanceof Error && err.message) || 'Erro ao carregar plantas');
        setPlantas([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPlantas();
  }, [geral]);

  const handlePlantaToggle = (plantaId: string) => {
    if (disabled || isViewMode) return;

    const newValue = value.includes(plantaId)
      ? value.filter(id => id !== plantaId)
      : [...value, plantaId];

    onChange(newValue);
  };

  const handleSelectAll = () => {
    if (disabled || isViewMode) return;
    onChange(plantas.map(p => p.id));
  };

  const handleDeselectAll = () => {
    if (disabled || isViewMode) return;
    onChange([]);
  };

  // Se for geral, mostrar informação
  if (geral) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 p-3 bg-accent border border-border rounded-lg">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-foreground">
            Aplicado a todas as plantas do sistema
          </span>
        </div>
      </div>
    );
  }

  // Estado de carregamento
  if (loading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Carregando plantas...</span>
        </div>
      </div>
    );
  }

  // Estado de erro
  if (error) {
    return (
      <div className="space-y-2">
        <div className="p-3 bg-background border border-border rounded-lg text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      </div>
    );
  }

  // Nenhuma planta disponível
  if (plantas.length === 0) {
    return (
      <div className="space-y-2">
        <div className="p-3 bg-muted border border-border rounded-lg text-sm text-muted-foreground">
          Nenhuma planta encontrada
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header com ações */}
      {!isViewMode && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {value.length} de {plantas.length} plantas selecionadas
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              disabled={disabled || value.length === plantas.length}
              className="text-xs text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              Selecionar todas
            </button>
            <span className="text-xs text-muted-foreground">|</span>
            <button
              type="button"
              onClick={handleDeselectAll}
              disabled={disabled || value.length === 0}
              className="text-xs text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              Limpar seleção
            </button>
          </div>
        </div>
      )}

      {/* Lista de plantas */}
      <div className="max-h-60 overflow-y-auto border border-border rounded-lg">
        {plantas.map((planta) => {
          const isSelected = value.includes(planta.id);

          return (
            <div
              key={planta.id}
              className={`
                flex items-center gap-3 p-3 border-b border-border last:border-b-0
                ${!isViewMode ? 'hover:bg-accent cursor-pointer' : ''}
                ${isSelected ? 'bg-accent' : ''}
              `}
              onClick={() => handlePlantaToggle(planta.id)}
            >
              <div className={`
                flex items-center justify-center w-4 h-4 border rounded
                ${isSelected
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'border-border'
                }
              `}>
                {isSelected && <Check className="h-3 w-3" />}
              </div>

              <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">
                    {planta.nome}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  CNPJ: {planta.cnpj} • {planta.endereco.cidade}/{planta.endereco.uf}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modo visualização - mostrar plantas selecionadas */}
      {isViewMode && value.length > 0 && (
        <div className="mt-3">
          <span className="text-sm font-medium text-foreground">
            Plantas selecionadas:
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {value.map((plantaId) => {
              const planta = plantas.find(p => p.id === plantaId);
              return (
                <div
                  key={plantaId}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-accent text-foreground rounded text-xs"
                >
                  <Building2 className="h-3 w-3" />
                  <span>{planta?.nome || `ID: ${plantaId}`}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Debug info em development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs bg-muted p-2 rounded">
          <div>Debug Plantas Selector:</div>
          <div>Geral: {geral ? 'Sim' : 'Não'}</div>
          <div>Plantas disponíveis: {plantas.length}</div>
          <div>Plantas selecionadas: {value.length}</div>
          <div>IDs selecionados: {value.join(', ') || 'Nenhum'}</div>
        </div>
      )}
    </div>
  );
};