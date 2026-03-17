// src/features/programacao-os/components/origem-selector/PlanoSelector.tsx
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Settings, Search, CheckCircle2 } from 'lucide-react';
import { PlanoDisponivel } from './types';

interface PlanoSelectorProps {
  planos: PlanoDisponivel[];
  value?: string;
  onChange: (planoId: string) => void;
  disabled?: boolean;
}

/**
 * Componente para seleção de plano de manutenção
 * Mostra lista de planos disponíveis com busca
 */
export const PlanoSelector: React.FC<PlanoSelectorProps> = ({
  planos,
  value,
  onChange,
  disabled = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar planos baseado na busca
  const planosFiltrados = planos.filter(plano =>
    plano.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plano.tipo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Campo de busca */}
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar plano de manutenção..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={disabled}
          className="bg-background border-border text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Lista de planos */}
      <div className="max-h-64 overflow-y-auto space-y-2 border border-border rounded-lg p-2 bg-muted/30">
        {planosFiltrados.map((plano) => {
          const isSelected = value === String(plano.id).trim();

          return (
            <Card
              key={plano.id}
              className={`cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-950/50 shadow-sm ring-1 ring-green-500/20'
                  : 'border-border bg-card hover:bg-accent hover:text-accent-foreground hover:border-green-500/50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => {
                if (!disabled) {
                  onChange(String(plano.id));
                }
              }}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Settings className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <Badge variant="outline" className="text-xs">
                        {plano.tipo}
                      </Badge>
                    </div>
                    <h4 className="font-medium text-sm text-foreground">{plano.nome}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {plano.descricao}
                    </p>
                    {plano.equipamentoNome && (
                      <p className="text-xs text-muted-foreground">
                        Equipamento: {plano.equipamentoNome}
                      </p>
                    )}
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 ml-2" />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {planosFiltrados.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum plano encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
};
