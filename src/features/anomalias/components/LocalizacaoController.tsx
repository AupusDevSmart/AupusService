// src/features/anomalias/components/LocalizacaoController.tsx
import React from 'react';
import { FormFieldProps } from '@/types/base';
import { useEquipamentos } from '@/features/equipamentos/hooks/useEquipamentos';
import { Wrench } from 'lucide-react';

// Interface para o valor esperado
interface LocalizacaoValue {
  plantaId?: number;
  equipamentoId?: number;
  local?: string;
  ativo?: string;
}

export const LocalizacaoController = ({ value, onChange, disabled }: FormFieldProps) => {
  const { plantas, getEquipamentosUCByPlanta, getComponentesByEquipamento, getPlantaById, getEquipamentoById } = useEquipamentos();
  
  // Garantir que value é tratado como LocalizacaoValue com valores seguros
  const localizacaoValue = (value || {}) as LocalizacaoValue;
  
  const [plantaId, setPlantaId] = React.useState(localizacaoValue.plantaId?.toString() || '');
  const [equipamentoId, setEquipamentoId] = React.useState(localizacaoValue.equipamentoId?.toString() || '');
  const [componenteId, setComponenteId] = React.useState('none');

  // Equipamentos UC filtrados pela planta selecionada
  const equipamentosDisponiveis = plantaId ? 
    getEquipamentosUCByPlanta(Number(plantaId)) : [];

  // Componentes UAR filtrados pelo equipamento selecionado
  const componentesDisponiveis = equipamentoId ? 
    getComponentesByEquipamento(Number(equipamentoId)) : [];

  const handlePlantaChange = (newPlantaId: string) => {
    setPlantaId(newPlantaId);
    setEquipamentoId('');
    setComponenteId('none');
    
    const planta = getPlantaById(Number(newPlantaId));
    onChange({
      plantaId: Number(newPlantaId),
      equipamentoId: null,
      local: planta?.nome || '',
      ativo: ''
    });
  };

  const handleEquipamentoChange = (newEquipamentoId: string) => {
    setEquipamentoId(newEquipamentoId);
    setComponenteId('none');
    
    const equipamento = getEquipamentoById(Number(newEquipamentoId));
    const planta = getPlantaById(Number(plantaId));
    
    onChange({
      plantaId: Number(plantaId),
      equipamentoId: Number(newEquipamentoId),
      local: planta?.nome || '',
      ativo: equipamento?.nome || ''
    });
  };

  const handleComponenteChange = (newComponenteId: string) => {
    setComponenteId(newComponenteId);
    
    const finalId = newComponenteId === 'none' ? Number(equipamentoId) : Number(newComponenteId);
    const finalItem = getEquipamentoById(finalId);
    const planta = getPlantaById(Number(plantaId));
    
    onChange({
      plantaId: Number(plantaId),
      equipamentoId: finalId,
      local: planta?.nome || '',
      ativo: finalItem?.nome || ''
    });
  };

  return (
    <div className="space-y-4">
      {/* Planta */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Planta/Local <span className="text-red-500">*</span>
        </label>
        <select
          value={plantaId}
          onChange={(e) => handlePlantaChange(e.target.value)}
          disabled={disabled}
          className="w-full p-2 border rounded-md bg-background text-foreground"
          required
        >
          <option value="">Selecione a planta...</option>
          {plantas.map(planta => (
            <option key={planta.id} value={planta.id.toString()}>
              {planta.nome}
            </option>
          ))}
        </select>
      </div>

      {/* Equipamento UC */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Equipamento <span className="text-red-500">*</span>
        </label>
        <select
          value={equipamentoId}
          onChange={(e) => handleEquipamentoChange(e.target.value)}
          disabled={disabled || !plantaId}
          className="w-full p-2 border rounded-md bg-background text-foreground"
          required
        >
          <option value="">
            {plantaId ? "Selecione o equipamento..." : "Primeiro selecione uma planta"}
          </option>
          {equipamentosDisponiveis.map(equipamento => (
            <option key={equipamento.id} value={equipamento.id.toString()}>
              {equipamento.nome} - {equipamento.tipo}
            </option>
          ))}
        </select>
      </div>

      {/* Componente UAR (Opcional) */}
      {equipamentoId && componentesDisponiveis.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Componente (Opcional)</label>
          <select
            value={componenteId}
            onChange={(e) => handleComponenteChange(e.target.value)}
            disabled={disabled}
            className="w-full p-2 border rounded-md bg-background text-foreground"
          >
            <option value="none">Nenhum componente específico</option>
            {componentesDisponiveis.map(componente => (
              <option key={componente.id} value={componente.id.toString()}>
                {componente.nome} - {componente.tipo}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Preview do item selecionado */}
      {equipamentoId && (
        <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            {componenteId !== 'none' ? 'Componente Selecionado:' : 'Equipamento Selecionado:'}
          </h4>
          {(() => {
            const finalId = componenteId !== 'none' ? Number(componenteId) : Number(equipamentoId);
            const item = getEquipamentoById(finalId);
            
            if (!item) return null;
            
            return (
              <div className="space-y-2">
                <p className="font-medium">{item.nome}</p>
                <p className="text-sm text-muted-foreground">{item.tipo}</p>
                <p className="text-sm text-muted-foreground">Localização: {item.localizacao}</p>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};