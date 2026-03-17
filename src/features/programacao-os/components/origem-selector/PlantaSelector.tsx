// src/features/programacao-os/components/origem-selector/PlantaSelector.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import { PlantaDisponivel } from './types';

interface PlantaSelectorProps {
  plantas: PlantaDisponivel[];
  value?: string;
  onChange: (plantaId: string) => void;
  loading?: boolean;
  disabled?: boolean;
}

/**
 * Componente para seleção de planta
 * Mostra lista de plantas disponíveis ou a planta selecionada com opção de trocar
 */
export const PlantaSelector: React.FC<PlantaSelectorProps> = ({
  plantas,
  value,
  onChange,
  loading = false,
  disabled = false
}) => {
  const plantaSelecionada = plantas.find(p => p.id?.trim() === value?.trim());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-foreground flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          Passo 1: Selecione a Planta
        </Label>
        {!plantaSelecionada && (
          <span className="text-xs text-muted-foreground">Obrigatório</span>
        )}
      </div>

      {/* Planta já selecionada - mostrar card com botão para trocar */}
      {plantaSelecionada ? (
        <Card className="border-primary bg-primary/10">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <div>
                  <h4 className="font-medium text-sm">{plantaSelecionada.nome}</h4>
                  {plantaSelecionada.localizacao && (
                    <p className="text-xs text-muted-foreground">{plantaSelecionada.localizacao}</p>
                  )}
                </div>
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
        // Lista de plantas disponíveis
        <div className="grid gap-2 max-h-48 overflow-y-auto border border-border rounded-lg p-2 bg-muted/30">
          {plantas.map((planta) => (
            <Card
              key={planta.id}
              className="cursor-pointer transition-all duration-200 border-border bg-card hover:bg-accent hover:text-accent-foreground hover:border-primary/50"
              onClick={() => {
                if (!disabled) {
                  onChange(planta.id);
                }
              }}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <div>
                    <h4 className="font-medium text-sm">{planta.nome}</h4>
                    {planta.localizacao && (
                      <p className="text-xs text-muted-foreground">{planta.localizacao}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {plantas.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhuma planta encontrada</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
