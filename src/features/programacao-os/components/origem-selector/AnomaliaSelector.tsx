// src/features/programacao-os/components/origem-selector/AnomaliaSelector.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Search, CheckCircle2, Loader2, MapPin } from 'lucide-react';
import { AnomaliaDisponivel } from './types';

interface AnomaliaSelectorProps {
  anomalias: AnomaliaDisponivel[];
  value?: string;
  onChange: (anomaliaId: string) => void;
  loading?: boolean;
  disabled?: boolean;
}

export const AnomaliaSelector: React.FC<AnomaliaSelectorProps> = ({
  anomalias,
  value,
  onChange,
  loading = false,
  disabled = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const anomaliaSelecionada = anomalias.find(a => String(a.id).trim() === value);

  // Filtrar anomalias baseado na busca
  const anomaliasFiltradas = anomalias.filter(anomalia =>
    anomalia.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    anomalia.local.toLowerCase().includes(searchTerm.toLowerCase()) ||
    anomalia.ativo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (anomalia.plantaNome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (anomalia.unidadeNome || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-foreground flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          Selecione a Anomalia
        </Label>
        {!anomaliaSelecionada && (
          <span className="text-xs text-muted-foreground">
            {anomalias.length} disponíveis
          </span>
        )}
      </div>

      {/* Anomalia já selecionada - mostrar card com botão para trocar */}
      {anomaliaSelecionada ? (
        <Card className="border-primary bg-primary/10">
          <CardContent className="p-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <Badge
                    variant={anomaliaSelecionada.prioridade === 'CRITICA' || anomaliaSelecionada.prioridade === 'ALTA' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {anomaliaSelecionada.prioridade}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {anomaliaSelecionada.status}
                  </Badge>
                </div>
                <h4 className="font-medium text-sm">{anomaliaSelecionada.descricao}</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {anomaliaSelecionada.local} - {anomaliaSelecionada.ativo}
                </p>
                {(anomaliaSelecionada.plantaNome || anomaliaSelecionada.unidadeNome) && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3" />
                    {[anomaliaSelecionada.plantaNome, anomaliaSelecionada.unidadeNome].filter(Boolean).join(' / ')}
                  </p>
                )}
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
        <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg bg-muted/30">
          <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin opacity-50" />
          <p>Carregando anomalias...</p>
        </div>
      ) : (
        <>
          {/* Campo de busca */}
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por descrição, local, ativo, planta ou unidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={disabled}
              className="bg-background border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Lista de anomalias */}
          <div className="max-h-64 overflow-y-auto space-y-2 border border-border rounded-lg p-2 bg-muted/30">
            {anomaliasFiltradas.map((anomalia) => {
              const isSelected = value === String(anomalia.id).trim();

              return (
                <Card
                  key={anomalia.id}
                  className={`cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary/20'
                      : 'border-border bg-card hover:bg-accent hover:text-accent-foreground hover:border-primary/50'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => {
                    if (!disabled) {
                      onChange(String(anomalia.id));
                    }
                  }}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                          <Badge
                            variant={anomalia.prioridade === 'CRITICA' || anomalia.prioridade === 'ALTA' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {anomalia.prioridade}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {anomalia.status}
                          </Badge>
                        </div>
                        <h4 className="font-medium text-sm text-foreground">{anomalia.descricao}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {anomalia.local} - {anomalia.ativo}
                        </p>
                        {(anomalia.plantaNome || anomalia.unidadeNome) && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3" />
                            {[anomalia.plantaNome, anomalia.unidadeNome].filter(Boolean).join(' / ')}
                          </p>
                        )}
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 ml-2" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {anomaliasFiltradas.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="font-medium">Nenhuma anomalia encontrada</p>
                <p className="text-xs mt-2">
                  {searchTerm
                    ? 'Tente ajustar os termos da busca.'
                    : 'Não há anomalias com status REGISTRADA disponíveis.'}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
