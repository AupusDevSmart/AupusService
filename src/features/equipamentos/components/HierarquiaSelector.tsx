// src/features/equipamentos/components/HierarquiaSelector.tsx - CORRIGIDO
import React, { useMemo } from 'react';
import { FormFieldProps } from '@/types/base';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Building2, Factory, Layers, Route, Package, Cog, Wrench } from 'lucide-react';

// ============================================================================
// MOCK DATA - Hierarquia completa até máquinas
// ============================================================================
const mockProprietarios = [
  { id: 1, razaoSocial: 'Empresa ABC Ltda', tipo: 'pessoa_juridica' as const },
  { id: 2, razaoSocial: 'João Silva', tipo: 'pessoa_fisica' as const },
  { id: 3, razaoSocial: 'Maria Santos Consultoria ME', tipo: 'pessoa_juridica' as const }
];

const mockPlantas = [
  { id: 1, nome: 'Planta Industrial São Paulo', proprietarioId: 1 },
  { id: 2, nome: 'Centro de Distribuição Rio', proprietarioId: 3 },
  { id: 3, nome: 'Oficina João Silva', proprietarioId: 2 }
];

const mockAreas = [
  { id: 1, nome: 'Produção', plantaId: 1 },
  { id: 2, nome: 'Logística', plantaId: 2 },
  { id: 3, nome: 'Administrativo', plantaId: 1 },
  { id: 4, nome: 'Manutenção', plantaId: 3 }
];

const mockSubAreas = [
  { id: 1, nome: 'Linha A', areaId: 1 },
  { id: 2, nome: 'Linha B', areaId: 1 },
  { id: 4, nome: 'Expedição', areaId: 2 },
  { id: 5, nome: 'Recebimento', areaId: 2 }
];

const mockLinhas = [
  // Linhas da subárea "Linha A"
  { id: 1, nome: 'Montagem A1', subAreaId: 1, areaId: null },
  { id: 2, nome: 'Montagem A2', subAreaId: 1, areaId: null },
  // Linha direta da área (sem subárea)
  { id: 3, nome: 'Linha Principal Produção', subAreaId: null, areaId: 1 },
  // Linhas da logística
  { id: 4, nome: 'Linha Expedição A', subAreaId: 4, areaId: null }
];

const mockConjuntos = [
  { id: 1, nome: 'Conjunto Motor Principal', linhaId: 1 },
  { id: 2, nome: 'Conjunto Hidráulico', linhaId: 1 },
  { id: 3, nome: 'Conjunto Pneumático', linhaId: 2 },
  { id: 4, nome: 'Conjunto Esteira', linhaId: 4 }
];

const mockMaquinas = [
  // Máquinas do Conjunto 1
  { id: 1, nome: 'Motor Elétrico 01', conjuntoId: 1 },
  { id: 2, nome: 'Redutor de Velocidade', conjuntoId: 1 },
  // Máquinas do Conjunto 2
  { id: 3, nome: 'Bomba Hidráulica Principal', conjuntoId: 2 },
  { id: 4, nome: 'Cilindro Hidráulico 01', conjuntoId: 2 },
  // Máquinas do Conjunto 3
  { id: 5, nome: 'Compressor de Ar', conjuntoId: 3 },
  { id: 6, nome: 'Cilindro Pneumático 01', conjuntoId: 3 }
];

interface HierarquiaSelectorProps {
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
}

export const HierarquiaSelector: React.FC<HierarquiaSelectorProps> = ({ 
  value, 
  onChange, 
  disabled = false 
}) => {
  // Garantir que value tem a estrutura correta
  const currentValue = value || {
    proprietarioId: null,
    plantaId: null,
    areaId: null,
    subAreaId: null,
    linhaId: null,
    conjuntoId: null,
    maquinaId: null // ← OBRIGATÓRIO para equipamentos
  };

  // Filtrar opções baseado nas seleções anteriores
  const availablePlantas = useMemo(() => {
    return currentValue.proprietarioId 
      ? mockPlantas.filter(p => p.proprietarioId === currentValue.proprietarioId)
      : [];
  }, [currentValue.proprietarioId]);

  const availableAreas = useMemo(() => {
    return currentValue.plantaId 
      ? mockAreas.filter(a => a.plantaId === currentValue.plantaId)
      : [];
  }, [currentValue.plantaId]);

  const availableSubAreas = useMemo(() => {
    return currentValue.areaId 
      ? mockSubAreas.filter(sa => sa.areaId === currentValue.areaId)
      : [];
  }, [currentValue.areaId]);

  const availableLinhas = useMemo(() => {
    // Linhas podem estar diretamente na área OU na subárea
    if (currentValue.subAreaId) {
      return mockLinhas.filter(l => l.subAreaId === currentValue.subAreaId);
    } else if (currentValue.areaId) {
      return mockLinhas.filter(l => l.areaId === currentValue.areaId && !l.subAreaId);
    }
    return [];
  }, [currentValue.areaId, currentValue.subAreaId]);

  const availableConjuntos = useMemo(() => {
    return currentValue.linhaId 
      ? mockConjuntos.filter(c => c.linhaId === currentValue.linhaId)
      : [];
  }, [currentValue.linhaId]);

  const availableMaquinas = useMemo(() => {
    return currentValue.conjuntoId 
      ? mockMaquinas.filter(m => m.conjuntoId === currentValue.conjuntoId)
      : [];
  }, [currentValue.conjuntoId]);

  // Handlers para cada nível
  const handleProprietarioChange = (proprietarioId: string) => {
    const newProprietarioId = proprietarioId === 'none' ? null : parseInt(proprietarioId);
    onChange({
      proprietarioId: newProprietarioId,
      plantaId: null,
      areaId: null,
      subAreaId: null,
      linhaId: null,
      conjuntoId: null,
      maquinaId: null
    });
  };

  const handlePlantaChange = (plantaId: string) => {
    const newPlantaId = plantaId === 'none' ? null : parseInt(plantaId);
    onChange({
      ...currentValue,
      plantaId: newPlantaId,
      areaId: null,
      subAreaId: null,
      linhaId: null,
      conjuntoId: null,
      maquinaId: null
    });
  };

  const handleAreaChange = (areaId: string) => {
    const newAreaId = areaId === 'none' ? null : parseInt(areaId);
    onChange({
      ...currentValue,
      areaId: newAreaId,
      subAreaId: null,
      linhaId: null,
      conjuntoId: null,
      maquinaId: null
    });
  };

  const handleSubAreaChange = (subAreaId: string) => {
    const newSubAreaId = subAreaId === 'none' ? null : parseInt(subAreaId);
    onChange({
      ...currentValue,
      subAreaId: newSubAreaId,
      linhaId: null,
      conjuntoId: null,
      maquinaId: null
    });
  };

  const handleLinhaChange = (linhaId: string) => {
    const newLinhaId = linhaId === 'none' ? null : parseInt(linhaId);
    onChange({
      ...currentValue,
      linhaId: newLinhaId,
      conjuntoId: null,
      maquinaId: null
    });
  };

  const handleConjuntoChange = (conjuntoId: string) => {
    const newConjuntoId = conjuntoId === 'none' ? null : parseInt(conjuntoId);
    onChange({
      ...currentValue,
      conjuntoId: newConjuntoId,
      maquinaId: null
    });
  };

  // ✅ NOVO: Handler para máquinas
  const handleMaquinaChange = (maquinaId: string) => {
    const newMaquinaId = maquinaId === 'none' ? null : parseInt(maquinaId);
    onChange({
      ...currentValue,
      maquinaId: newMaquinaId
    });
  };

  return (
    <div className="space-y-4">
      {/* Proprietário */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Proprietário <span className="text-red-500">*</span>
        </label>
        <Select
          value={currentValue.proprietarioId ? String(currentValue.proprietarioId) : undefined}
          onValueChange={handleProprietarioChange}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um proprietário" />
          </SelectTrigger>
          <SelectContent>
            {mockProprietarios.map((prop) => (
              <SelectItem key={prop.id} value={String(prop.id)}>
                <div className="flex items-center gap-2">
                  <Building2 className="h-3 w-3" />
                  <span>{prop.razaoSocial}</span>
                  <Badge variant="outline" className="text-xs">
                    {prop.tipo === 'pessoa_juridica' ? 'PJ' : 'PF'}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Planta */}
      {currentValue.proprietarioId && (
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Factory className="h-4 w-4" />
            Planta <span className="text-red-500">*</span>
          </label>
          <Select
            value={currentValue.plantaId ? String(currentValue.plantaId) : undefined}
            onValueChange={handlePlantaChange}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma planta" />
            </SelectTrigger>
            <SelectContent>
              {availablePlantas.map((planta) => (
                <SelectItem key={planta.id} value={String(planta.id)}>
                  <div className="flex items-center gap-2">
                    <Factory className="h-3 w-3" />
                    <span>{planta.nome}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Área */}
      {currentValue.plantaId && (
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Área <span className="text-red-500">*</span>
          </label>
          <Select
            value={currentValue.areaId ? String(currentValue.areaId) : undefined}
            onValueChange={handleAreaChange}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma área" />
            </SelectTrigger>
            <SelectContent>
              {availableAreas.map((area) => (
                <SelectItem key={area.id} value={String(area.id)}>
                  <div className="flex items-center gap-2">
                    <Layers className="h-3 w-3" />
                    <span>{area.nome}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Sub Área (opcional) */}
      {currentValue.areaId && availableSubAreas.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Sub Área (opcional)
          </label>
          <Select
            value={currentValue.subAreaId ? String(currentValue.subAreaId) : 'none'}
            onValueChange={handleSubAreaChange}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma sub área" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Área direta (sem subárea)</SelectItem>
              {availableSubAreas.map((subArea) => (
                <SelectItem key={subArea.id} value={String(subArea.id)}>
                  <div className="flex items-center gap-2">
                    <Layers className="h-3 w-3" />
                    <span>{subArea.nome}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Linha */}
      {currentValue.areaId && availableLinhas.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Route className="h-4 w-4" />
            Linha <span className="text-red-500">*</span>
          </label>
          <Select
            value={currentValue.linhaId ? String(currentValue.linhaId) : undefined}
            onValueChange={handleLinhaChange}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma linha" />
            </SelectTrigger>
            <SelectContent>
              {availableLinhas.map((linha) => (
                <SelectItem key={linha.id} value={String(linha.id)}>
                  <div className="flex items-center gap-2">
                    <Route className="h-3 w-3" />
                    <span>{linha.nome}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Conjunto */}
      {currentValue.linhaId && availableConjuntos.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Package className="h-4 w-4" />
            Conjunto <span className="text-red-500">*</span>
          </label>
          <Select
            value={currentValue.conjuntoId ? String(currentValue.conjuntoId) : undefined}
            onValueChange={handleConjuntoChange}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um conjunto" />
            </SelectTrigger>
            <SelectContent>
              {availableConjuntos.map((conjunto) => (
                <SelectItem key={conjunto.id} value={String(conjunto.id)}>
                  <div className="flex items-center gap-2">
                    <Package className="h-3 w-3" />
                    <span>{conjunto.nome}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* ✅ NOVO: Máquina */}
      {currentValue.conjuntoId && availableMaquinas.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Cog className="h-4 w-4" />
            Máquina <span className="text-red-500">*</span>
          </label>
          <Select
            value={currentValue.maquinaId ? String(currentValue.maquinaId) : undefined}
            onValueChange={handleMaquinaChange}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma máquina" />
            </SelectTrigger>
            <SelectContent>
              {availableMaquinas.map((maquina) => (
                <SelectItem key={maquina.id} value={String(maquina.id)}>
                  <div className="flex items-center gap-2">
                    <Cog className="h-3 w-3" />
                    <span>{maquina.nome}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Resumo da seleção */}
      {currentValue.proprietarioId && (
        <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200 dark:from-orange-950 dark:to-amber-950 dark:border-orange-800">
          <div className="flex items-center gap-2 mb-3">
            <Wrench className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-900 dark:text-orange-100">
              Localização do Equipamento:
            </span>
          </div>
          
          <div className="flex flex-wrap gap-1 text-xs">
            {currentValue.proprietarioId && (
              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                <Building2 className="h-3 w-3 mr-1" />
                {mockProprietarios.find(p => p.id === currentValue.proprietarioId)?.razaoSocial}
              </Badge>
            )}
            {currentValue.plantaId && (
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                <Factory className="h-3 w-3 mr-1" />
                {mockPlantas.find(p => p.id === currentValue.plantaId)?.nome}
              </Badge>
            )}
            {currentValue.areaId && (
              <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
                <Layers className="h-3 w-3 mr-1" />
                {mockAreas.find(a => a.id === currentValue.areaId)?.nome}
              </Badge>
            )}
            {currentValue.subAreaId && (
              <Badge variant="outline" className="bg-indigo-100 text-indigo-800 border-indigo-300">
                <Layers className="h-3 w-3 mr-1" />
                {mockSubAreas.find(sa => sa.id === currentValue.subAreaId)?.nome}
              </Badge>
            )}
            {currentValue.linhaId && (
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                <Route className="h-3 w-3 mr-1" />
                {mockLinhas.find(l => l.id === currentValue.linhaId)?.nome}
              </Badge>
            )}
            {currentValue.conjuntoId && (
              <Badge variant="outline" className="bg-pink-100 text-pink-800 border-pink-300">
                <Package className="h-3 w-3 mr-1" />
                {mockConjuntos.find(c => c.id === currentValue.conjuntoId)?.nome}
              </Badge>
            )}
            {currentValue.maquinaId && (
              <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                <Cog className="h-3 w-3 mr-1" />
                {mockMaquinas.find(m => m.id === currentValue.maquinaId)?.nome}
              </Badge>
            )}
          </div>
          
          {/* Aviso se máquina não foi selecionada */}
          {currentValue.conjuntoId && !currentValue.maquinaId && availableMaquinas.length > 0 && (
            <div className="mt-3 p-2 bg-amber-100 border border-amber-300 rounded text-amber-800 text-xs">
              ⚠️ Selecione uma máquina para vincular o equipamento
            </div>
          )}
          
          {/* Informação sobre equipamento */}
          {currentValue.maquinaId && (
            <div className="mt-3 p-2 bg-green-100 border border-green-300 rounded text-green-800 text-xs">
              ✅ O equipamento será vinculado à máquina selecionada
            </div>
          )}
        </div>
      )}
    </div>
  );
};