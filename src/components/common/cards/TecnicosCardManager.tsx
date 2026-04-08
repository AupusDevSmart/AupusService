// src/components/common/cards/TecnicosCardManager.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Users, Trash2 } from 'lucide-react';

export interface TecnicoItem {
  id?: string;
  nome: string;
  especialidade: string;
  horas_estimadas: number;
  horas_trabalhadas?: number;
  custo_hora?: number;
  custo_total?: number;
  presente?: boolean;
  tecnico_id?: string;
  observacoes?: string;
}

interface TecnicosCardManagerProps {
  value: TecnicoItem[];
  onChange: (tecnicos: TecnicoItem[]) => void;
  disabled?: boolean;
  mode?: 'planejamento' | 'execucao' | 'view';
  showCustos?: boolean;
  showStatus?: boolean;
  showHorasReais?: boolean;
  title?: string;
}

const especialidadesComuns = [
  'Técnico Mecânico',
  'Técnico Elétrico',
  'Técnico Eletrônico',
  'Soldador',
  'Operador de Guindastes',
  'Técnico em Instrumentação',
  'Técnico em Segurança',
  'Engenheiro',
  'Auxiliar',
  'Outros'
];

const TecnicosCardManager: React.FC<TecnicosCardManagerProps> = ({
  value = [],
  onChange,
  disabled = false,
  mode = 'planejamento',
  showCustos = false,
  showStatus = false,
  showHorasReais = false,
  title = "Técnicos"
}) => {
  const [tecnicos, setTecnicos] = useState<TecnicoItem[]>(value);

  useEffect(() => {
    setTecnicos(value);
  }, [value]);

  const updateTecnicos = (newTecnicos: TecnicoItem[]) => {
    setTecnicos(newTecnicos);
    onChange(newTecnicos);
  };

  const adicionarTecnico = () => {
    const novoTecnico: TecnicoItem = {
      id: `temp_${Date.now()}`,
      nome: '',
      especialidade: '',
      horas_estimadas: 8,
      custo_hora: 0,
      custo_total: 0,
      presente: false
    };
    updateTecnicos([...tecnicos, novoTecnico]);
  };

  const removerTecnico = (index: number) => {
    updateTecnicos(tecnicos.filter((_, i) => i !== index));
  };

  const atualizarTecnico = (index: number, campo: keyof TecnicoItem, valor: any) => {
    const novosTecnicos = [...tecnicos];
    novosTecnicos[index] = { ...novosTecnicos[index], [campo]: valor };

    if (campo === 'horas_estimadas' || campo === 'horas_trabalhadas' || campo === 'custo_hora') {
      const tecnico = novosTecnicos[index];
      const horas = mode === 'execucao' && tecnico.horas_trabalhadas !== undefined
        ? tecnico.horas_trabalhadas
        : tecnico.horas_estimadas;
      if (horas && tecnico.custo_hora) {
        tecnico.custo_total = horas * tecnico.custo_hora;
      }
    }

    updateTecnicos(novosTecnicos);
  };

  const calcularCustoTotal = () => {
    return tecnicos.reduce((total, tecnico) => total + (tecnico.custo_total || 0), 0);
  };

  const calcularHorasTotal = () => {
    if (mode === 'execucao' && showHorasReais) {
      return tecnicos.reduce((total, tecnico) => total + (tecnico.horas_trabalhadas || 0), 0);
    }
    return tecnicos.reduce((total, tecnico) => total + (tecnico.horas_estimadas || 0), 0);
  };

  if (disabled && tecnicos.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <Users className="h-5 w-5 mx-auto mb-1 opacity-40" />
        <p className="text-sm">Nenhum técnico cadastrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium text-foreground">{title}</Label>
          {tecnicos.length > 0 && (
            <span className="text-xs text-muted-foreground">({tecnicos.length})</span>
          )}
        </div>
        {!disabled && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={adicionarTecnico}
            className="h-7 text-xs gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar
          </Button>
        )}
      </div>

      {/* Lista */}
      {tecnicos.length > 0 && (
        <div className="border border-border rounded-md divide-y divide-border dark:bg-[hsl(0,0%,0%)]">
          {tecnicos.map((tecnico, index) => (
            <div
              key={tecnico.id || index}
              className="flex flex-wrap items-center gap-2 px-3 py-2"
            >
              <Input
                value={tecnico.nome}
                onChange={(e) => atualizarTecnico(index, 'nome', e.target.value)}
                placeholder="Nome do técnico..."
                disabled={disabled}
                className="h-8 text-sm flex-1 min-w-[140px] bg-transparent border-0 shadow-none px-2 focus-visible:ring-0 placeholder:text-muted-foreground/60"
              />
              <select
                value={tecnico.especialidade}
                onChange={(e) => atualizarTecnico(index, 'especialidade', e.target.value)}
                disabled={disabled}
                className="h-8 text-sm w-44 bg-transparent border-0 shadow-none px-2 focus-visible:ring-0 text-foreground"
              >
                <option value="">Especialidade...</option>
                {especialidadesComuns.map(esp => (
                  <option key={esp} value={esp}>{esp}</option>
                ))}
              </select>
              <Input
                type="number"
                min="0"
                step="0.5"
                value={tecnico.horas_estimadas}
                onChange={(e) => atualizarTecnico(index, 'horas_estimadas', parseFloat(e.target.value) || 0)}
                placeholder="Horas"
                disabled={disabled}
                className="h-8 text-sm w-16 text-center bg-transparent border-0 shadow-none px-2 focus-visible:ring-0"
              />
              {showHorasReais && mode === 'execucao' && (
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={tecnico.horas_trabalhadas || ''}
                  onChange={(e) => atualizarTecnico(index, 'horas_trabalhadas', parseFloat(e.target.value) || 0)}
                  placeholder="H. trab."
                  disabled={disabled}
                  className="h-8 text-sm w-18 text-center bg-transparent border-0 shadow-none px-2 focus-visible:ring-0"
                />
              )}
              {showCustos && (
                <>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={tecnico.custo_hora || ''}
                    onChange={(e) => atualizarTecnico(index, 'custo_hora', parseFloat(e.target.value) || 0)}
                    placeholder="R$/h"
                    disabled={disabled}
                    className="h-8 text-sm w-18 text-center bg-transparent border-0 shadow-none px-2 focus-visible:ring-0"
                  />
                  <span className="text-xs text-muted-foreground w-20 text-right">
                    R$ {(tecnico.custo_total || 0).toFixed(2)}
                  </span>
                </>
              )}
              {mode === 'execucao' && showStatus && (
                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={tecnico.presente}
                    onChange={(e) => atualizarTecnico(index, 'presente', e.target.checked)}
                    disabled={disabled}
                    className="rounded border-border"
                  />
                  Presente
                </label>
              )}
              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removerTecnico(index)}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500 dark:hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Resumo */}
      {tecnicos.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground text-right justify-end pr-1">
          <span>Total: {calcularHorasTotal().toFixed(1)}h</span>
          {showCustos && <span>Custo: R$ {calcularCustoTotal().toFixed(2)}</span>}
        </div>
      )}

      {/* Empty state */}
      {tecnicos.length === 0 && !disabled && (
        <div className="text-center py-4 border border-dashed border-border rounded-md">
          <p className="text-sm text-muted-foreground">Nenhum técnico adicionado</p>
        </div>
      )}
    </div>
  );
};

export { TecnicosCardManager };
