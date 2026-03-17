// src/features/programacao-os/components/origem-selector/SolicitacaoSelector.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { FilePenLine, Search, CheckCircle2 } from 'lucide-react';
import { SolicitacaoDisponivel } from './types';

interface SolicitacaoSelectorProps {
  solicitacoes: SolicitacaoDisponivel[];
  value?: string;
  onChange: (solicitacaoId: string) => void;
  plantaId?: string;
  unidadeId?: string;
  disabled?: boolean;
}

/**
 * Componente para seleção de solicitação de serviço
 * Mostra lista de solicitações disponíveis com busca, ou a solicitação selecionada
 */
export const SolicitacaoSelector: React.FC<SolicitacaoSelectorProps> = ({
  solicitacoes,
  value,
  onChange,
  plantaId,
  unidadeId,
  disabled = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Validar se planta e unidade foram selecionadas
  if (!plantaId || !unidadeId) {
    return (
      <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg bg-muted/30">
        <FilePenLine className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Selecione uma planta e unidade primeiro</p>
      </div>
    );
  }

  const solicitacaoSelecionada = solicitacoes.find(s => String(s.id).trim() === value);

  // Filtrar solicitações baseado na busca
  const solicitacoesFiltradas = solicitacoes.filter(solicitacao =>
    solicitacao.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    solicitacao.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
    solicitacao.local.toLowerCase().includes(searchTerm.toLowerCase()) ||
    solicitacao.tipo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-foreground flex items-center gap-2">
          <FilePenLine className="h-4 w-4 text-orange-600" />
          Passo 3: Selecione a Solicitação de Serviço
        </Label>
        {!solicitacaoSelecionada && (
          <span className="text-xs text-muted-foreground">
            {solicitacoes.length} disponíveis
          </span>
        )}
      </div>

      {/* Solicitação já selecionada - mostrar card com botão para trocar */}
      {solicitacaoSelecionada ? (
        <Card className="border-primary bg-primary/10">
          <CardContent className="p-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <FilePenLine className="h-4 w-4 text-orange-600" />
                  <Badge variant="outline" className="text-xs">
                    {solicitacaoSelecionada.numero}
                  </Badge>
                  <Badge
                    variant={solicitacaoSelecionada.prioridade === 'CRITICA' || solicitacaoSelecionada.prioridade === 'ALTA' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {solicitacaoSelecionada.prioridade}
                  </Badge>
                </div>
                <h4 className="font-medium text-sm">{solicitacaoSelecionada.titulo}</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {solicitacaoSelecionada.local} • {solicitacaoSelecionada.tipo}
                </p>
                <p className="text-xs text-muted-foreground">
                  Solicitante: {solicitacaoSelecionada.solicitanteNome}
                </p>
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
      ) : (
        <>
          {/* Campo de busca */}
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar solicitação..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={disabled}
              className="bg-background border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Lista de solicitações */}
          <div className="max-h-64 overflow-y-auto space-y-2 border border-border rounded-lg p-2 bg-muted/30">
            {solicitacoesFiltradas.map((solicitacao) => {
              const isSelected = value === String(solicitacao.id).trim();

              return (
                <Card
                  key={solicitacao.id}
                  className={`cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary/20'
                      : 'border-border bg-card hover:bg-accent hover:text-accent-foreground hover:border-orange-500/50'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => {
                    if (!disabled) {
                      onChange(String(solicitacao.id));
                    }
                  }}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <FilePenLine className="h-4 w-4 text-orange-600" />
                          <Badge variant="outline" className="text-xs">
                            {solicitacao.numero}
                          </Badge>
                          <Badge
                            variant={solicitacao.prioridade === 'CRITICA' || solicitacao.prioridade === 'ALTA' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {solicitacao.prioridade}
                          </Badge>
                        </div>
                        <h4 className="font-medium text-sm text-foreground">{solicitacao.titulo}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {solicitacao.local} • {solicitacao.tipo}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Solicitante: {solicitacao.solicitanteNome}
                        </p>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 ml-2" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {solicitacoesFiltradas.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FilePenLine className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="font-medium">Nenhuma solicitação disponível</p>
                <p className="text-xs mt-2">
                  Não há solicitações aprovadas para esta planta/unidade.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
