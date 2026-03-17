// src/features/programacao-os/components/origem-selector/UnidadeSelector.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Building2 } from 'lucide-react';
import { UnidadeDisponivel } from './types';

interface UnidadeSelectorProps {
  unidades: UnidadeDisponivel[];
  value?: string;
  onChange: (unidadeId: string) => void;
  loading?: boolean;
  disabled?: boolean;
}

/**
 * Componente para seleção de unidade
 * Mostra lista de unidades disponíveis ou a unidade selecionada com opção de trocar
 */
export const UnidadeSelector: React.FC<UnidadeSelectorProps> = ({
  unidades,
  value,
  onChange,
  loading = false,
  disabled = false
}) => {
  const unidadeSelecionada = unidades.find(u => u.id?.trim() === value?.trim());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-foreground flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          Passo 2: Selecione a Unidade
        </Label>
        {!unidadeSelecionada && (
          <span className="text-xs text-muted-foreground">Obrigatório</span>
        )}
      </div>

      {/* Unidade já selecionada - mostrar card com botão para trocar */}
      {unidadeSelecionada ? (
        <Card className="border-primary bg-primary/10">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <h4 className="font-medium text-sm">{unidadeSelecionada.nome}</h4>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChange('')}
                disabled={disabled}
              >
                Trocar
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : loading ? (
        // Loading state
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      ) : (
        // Lista de unidades disponíveis
        <div className="grid gap-2 max-h-48 overflow-y-auto border border-border rounded-lg p-2 bg-muted/30">
          {unidades.map((unidade) => (
            <Card
              key={unidade.id}
              className="cursor-pointer transition-all duration-200 border-border bg-card hover:bg-accent hover:text-accent-foreground hover:border-primary/50"
              onClick={() => {
                if (!disabled) {
                  onChange(unidade.id);
                }
              }}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <h4 className="font-medium text-sm">{unidade.nome}</h4>
                </div>
              </CardContent>
            </Card>
          ))}

          {unidades.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhuma unidade encontrada para esta planta</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
