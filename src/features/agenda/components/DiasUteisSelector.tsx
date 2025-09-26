// src/features/agenda/components/DiasUteisSelector.tsx
import React from 'react';
import { FormFieldProps } from '@/types/base';
import { Check, Calendar } from 'lucide-react';
import { DIAS_SEMANA } from '../types';

interface DiasUteisSelectorValue {
  segunda?: boolean;
  terca?: boolean;
  quarta?: boolean;
  quinta?: boolean;
  sexta?: boolean;
  sabado?: boolean;
  domingo?: boolean;
}

interface DiasUteisSelectorProps extends Partial<FormFieldProps> {
  value?: DiasUteisSelectorValue;
  onChange: (value: DiasUteisSelectorValue) => void;
  disabled?: boolean;
  mode?: 'create' | 'edit' | 'view';
}

export const DiasUteisSelector: React.FC<DiasUteisSelectorProps> = ({
  value = {},
  onChange,
  disabled = false,
  mode = 'create'
}) => {
  const isViewMode = mode === 'view';

  const handleDayToggle = (day: string) => {
    if (disabled || isViewMode) return;

    const newValue = {
      ...value,
      [day]: !value[day as keyof DiasUteisSelectorValue]
    };

    onChange(newValue);
  };

  const handlePresetSelect = (preset: 'uteis' | 'todos' | 'limpar') => {
    if (disabled || isViewMode) return;

    let newValue: DiasUteisSelectorValue = {};

    switch (preset) {
      case 'uteis':
        newValue = {
          segunda: true,
          terca: true,
          quarta: true,
          quinta: true,
          sexta: true,
          sabado: false,
          domingo: false
        };
        break;
      case 'todos':
        newValue = {
          segunda: true,
          terca: true,
          quarta: true,
          quinta: true,
          sexta: true,
          sabado: true,
          domingo: true
        };
        break;
      case 'limpar':
        newValue = {
          segunda: false,
          terca: false,
          quarta: false,
          quinta: false,
          sexta: false,
          sabado: false,
          domingo: false
        };
        break;
    }

    onChange(newValue);
  };

  // Calcular estatísticas
  const diasSelecionados = DIAS_SEMANA.filter(dia =>
    value[dia.key as keyof DiasUteisSelectorValue]
  );
  const totalDias = diasSelecionados.length;

  return (
    <div className="space-y-4">
      {/* Presets de seleção rápida */}
      {!isViewMode && (
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => handlePresetSelect('uteis')}
            disabled={disabled}
            className="px-3 py-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 rounded border border-blue-200 disabled:opacity-50"
          >
            Dias Úteis (Seg-Sex)
          </button>
          <button
            type="button"
            onClick={() => handlePresetSelect('todos')}
            disabled={disabled}
            className="px-3 py-1 text-xs bg-green-50 text-green-700 hover:bg-green-100 rounded border border-green-200 disabled:opacity-50"
          >
            Todos os Dias
          </button>
          <button
            type="button"
            onClick={() => handlePresetSelect('limpar')}
            disabled={disabled}
            className="px-3 py-1 text-xs bg-gray-50 text-gray-700 hover:bg-gray-100 rounded border border-gray-200 disabled:opacity-50"
          >
            Limpar Seleção
          </button>
        </div>
      )}

      {/* Grid de dias da semana */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
        {DIAS_SEMANA.map((dia) => {
          const isSelected = value[dia.key as keyof DiasUteisSelectorValue] || false;
          const isWeekend = dia.key === 'sabado' || dia.key === 'domingo';

          return (
            <div
              key={dia.key}
              className={`
                flex flex-col items-center p-3 border rounded-lg transition-colors
                ${!isViewMode ? 'cursor-pointer hover:bg-gray-50' : 'cursor-default'}
                ${isSelected
                  ? isWeekend
                    ? 'bg-orange-50 border-orange-200'
                    : 'bg-blue-50 border-blue-200'
                  : 'bg-white border-gray-200'
                }
                ${disabled ? 'opacity-50' : ''}
              `}
              onClick={() => handleDayToggle(dia.key)}
            >
              {/* Checkbox visual */}
              <div className={`
                flex items-center justify-center w-5 h-5 border rounded mb-2
                ${isSelected
                  ? isWeekend
                    ? 'bg-orange-500 border-orange-500 text-white'
                    : 'bg-blue-600 border-blue-600 text-white'
                  : 'border-gray-300'
                }
              `}>
                {isSelected && <Check className="h-3 w-3" />}
              </div>

              {/* Nome do dia */}
              <span className={`
                text-sm font-medium text-center
                ${isSelected
                  ? isWeekend
                    ? 'text-orange-800'
                    : 'text-blue-800'
                  : 'text-gray-700'
                }
              `}>
                {dia.label.split('-')[0]}
              </span>

              {/* Indicador de fim de semana */}
              {isWeekend && (
                <span className="text-xs text-orange-600 mt-1">
                  Fim de semana
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Resumo da seleção */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium">
            {totalDias} {totalDias === 1 ? 'dia útil' : 'dias úteis'} selecionados
          </span>
        </div>

        {totalDias > 0 && (
          <div className="text-xs text-gray-600">
            {diasSelecionados.map(dia => dia.label.substring(0, 3)).join(', ')}
          </div>
        )}
      </div>

      {/* Modo visualização - mostrar dias selecionados */}
      {isViewMode && totalDias > 0 && (
        <div className="mt-3">
          <span className="text-sm font-medium text-gray-700 mb-2 block">
            Dias úteis configurados:
          </span>
          <div className="flex flex-wrap gap-2">
            {diasSelecionados.map((dia) => {
              const isWeekend = dia.key === 'sabado' || dia.key === 'domingo';
              return (
                <div
                  key={dia.key}
                  className={`
                    inline-flex items-center gap-1 px-2 py-1 rounded text-xs
                    ${isWeekend
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-blue-100 text-blue-800'
                    }
                  `}
                >
                  <Calendar className="h-3 w-3" />
                  <span>{dia.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Validação visual */}
      {!isViewMode && totalDias === 0 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <span className="text-sm text-yellow-800">
            ⚠️ Selecione pelo menos um dia da semana
          </span>
        </div>
      )}

      {/* Debug info em development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded">
          <div>Debug Dias Úteis Selector:</div>
          <div>Total dias: {totalDias}</div>
          <div>Segunda: {value.segunda ? 'Sim' : 'Não'}</div>
          <div>Terça: {value.terca ? 'Sim' : 'Não'}</div>
          <div>Quarta: {value.quarta ? 'Sim' : 'Não'}</div>
          <div>Quinta: {value.quinta ? 'Sim' : 'Não'}</div>
          <div>Sexta: {value.sexta ? 'Sim' : 'Não'}</div>
          <div>Sábado: {value.sabado ? 'Sim' : 'Não'}</div>
          <div>Domingo: {value.domingo ? 'Sim' : 'Não'}</div>
        </div>
      )}
    </div>
  );
};