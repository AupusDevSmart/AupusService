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
        const response = await PlantasService.getAllPlantas({ limit: 100 });
        setPlantas(response.data);
        console.log('✅ [PLANTAS SELECTOR] Plantas carregadas:', response.data.length);
      } catch (err: any) {
        console.error('❌ [PLANTAS SELECTOR] Erro ao carregar plantas:', err);
        setError(err.message || 'Erro ao carregar plantas');
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
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Building2 className="h-4 w-4 text-blue-600" />
          <span className="text-sm text-blue-800">
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
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          ⚠️ {error}
        </div>
      </div>
    );
  }

  // Nenhuma planta disponível
  if (plantas.length === 0) {
    return (
      <div className="space-y-2">
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
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
              className="text-xs text-blue-600 hover:text-blue-700 disabled:text-gray-400"
            >
              Selecionar todas
            </button>
            <span className="text-xs text-gray-400">|</span>
            <button
              type="button"
              onClick={handleDeselectAll}
              disabled={disabled || value.length === 0}
              className="text-xs text-red-600 hover:text-red-700 disabled:text-gray-400"
            >
              Limpar seleção
            </button>
          </div>
        </div>
      )}

      {/* Lista de plantas */}
      <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
        {plantas.map((planta) => {
          const isSelected = value.includes(planta.id);

          return (
            <div
              key={planta.id}
              className={`
                flex items-center gap-3 p-3 border-b border-gray-100 last:border-b-0
                ${!isViewMode ? 'hover:bg-gray-50 cursor-pointer' : ''}
                ${isSelected ? 'bg-blue-50' : ''}
              `}
              onClick={() => handlePlantaToggle(planta.id)}
            >
              <div className={`
                flex items-center justify-center w-4 h-4 border rounded
                ${isSelected
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-gray-300'
                }
              `}>
                {isSelected && <Check className="h-3 w-3" />}
              </div>

              <Building2 className="h-4 w-4 text-gray-500 flex-shrink-0" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">
                    {planta.nome}
                  </span>
                </div>
                <div className="text-xs text-gray-500 truncate">
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
          <span className="text-sm font-medium text-gray-700">
            Plantas selecionadas:
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {value.map((plantaId) => {
              const planta = plantas.find(p => p.id === plantaId);
              return (
                <div
                  key={plantaId}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
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
        <div className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded">
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