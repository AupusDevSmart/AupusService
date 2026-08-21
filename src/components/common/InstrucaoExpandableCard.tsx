// src/components/common/InstrucaoExpandableCard.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { FileText, ChevronDown, ChevronRight, X, Clock, Wrench, ListChecks, AlertCircle, SquarePen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { instrucoesApi, InstrucaoApiResponse, SubInstrucaoApiResponse, RecursoInstrucaoApiResponse } from '@/services/instrucoes.services';

interface InstrucaoExpandableCardProps {
  id: string;
  tag?: string;
  nome?: string;
  onRemove?: () => void;
  disabled?: boolean;
  /** Ausente, o botao de editar nao aparece. */
  onEditar?: (id: string) => void;
  /**
   * O valor desta instrucao na proposta. Indefinido esconde o campo — ha telas
   * que listam instrucao sem haver proposta nenhuma.
   */
  valor?: number;
  onValor?: (valor: number) => void;
  valorEditavel?: boolean;
}

const tipoRecursoLabels: Record<string, string> = {
  INSTRUMENTO: 'Instrumento',
  MATERIAL: 'Material',
  FERRAMENTA: 'Ferramenta',
  TECNICO: 'Tecnico',
  VIATURA: 'Viatura',
};

const categoriaLabels: Record<string, string> = {
  MECANICA: 'Mecanica',
  ELETRICA: 'Eletrica',
  INSTRUMENTACAO: 'Instrumentacao',
  CIVIL: 'Civil',
  PINTURA: 'Pintura',
  LUBRIFICACAO: 'Lubrificacao',
  LIMPEZA: 'Limpeza',
  GERAL: 'Geral',
};

const tipoManutencaoLabels: Record<string, string> = {
  PREVENTIVA: 'Preventiva',
  CORRETIVA: 'Corretiva',
  PREDITIVA: 'Preditiva',
  INSPECAO: 'Inspecao',
};

function formatMinutos(minutos?: number): string {
  if (!minutos) return '-';
  if (minutos < 60) return `${minutos}min`;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export function InstrucaoExpandableCard({
  id,
  tag,
  nome,
  onRemove,
  disabled,
  onEditar,
  valor,
  onValor,
  valorEditavel = true,
}: InstrucaoExpandableCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [details, setDetails] = useState<InstrucaoApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleToggle = useCallback(async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }

    // Fetch details on first expand
    if (!details && !loading) {
      setLoading(true);
      setError(false);
      try {
        const data = await instrucoesApi.findOne(id);
        setDetails(data);
      } catch (err) {
        console.error('Erro ao carregar detalhes da instrucao:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    setExpanded(true);
  }, [expanded, details, loading, id]);

  const label = `${tag ? tag + ' - ' : ''}${nome || 'Instrucao'}`;

  return (
    <div className="overflow-hidden">
      {/* Header - sempre visivel */}
      <div className="flex items-center justify-between py-1.5">
        <button
          type="button"
          onClick={handleToggle}
          className="flex items-center gap-2 min-w-0 flex-1 text-left hover:opacity-80 transition-opacity"
        >
          {expanded
            ? <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            : <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          }
          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm truncate font-medium">{label}</span>
        </button>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          {/* O valor logo depois do nome, e nao numa lista separada abaixo: a
              instrucao aparecia duas vezes na tela, uma para ser lida e outra
              para ser precificada. */}
          {valor !== undefined && (
            <>
              <span className="text-xs text-muted-foreground">R$</span>
              <div className="w-20">
                <ValorDaInstrucao
                  valor={valor}
                  editavel={valorEditavel && !disabled}
                  onValor={onValor}
                />
              </div>
            </>
          )}

          {/* Editar a instrucao, e nao o vinculo: abre o sheet dela por cima
              deste, sem tirar ninguem do formulario que esta preenchendo. */}
          {onEditar && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEditar(id)}
              title="Editar esta instrução"
            >
              <SquarePen className="h-4 w-4" />
            </Button>
          )}
          {!disabled && onRemove && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onRemove}
              title="Desvincular"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Details panel */}
      {expanded && (
        <div className="px-4 pb-3 space-y-3">
          {loading && (
            <p className="text-sm text-muted-foreground">Carregando detalhes...</p>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>Erro ao carregar detalhes</span>
              <button type="button" onClick={handleToggle} className="underline ml-1">Tentar novamente</button>
            </div>
          )}

          {details && (
            <>
              {/* Info grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <InfoItem label="Categoria" value={categoriaLabels[details.categoria] || details.categoria} />
                <InfoItem label="Tipo" value={tipoManutencaoLabels[details.tipo_manutencao] || details.tipo_manutencao} />
                <InfoItem
                  label="Duracao Estimada"
                  value={formatMinutos(details.duracao_estimada)}
                  icon={<Clock className="h-3.5 w-3.5" />}
                />
                <InfoItem label="Criticidade" value={details.criticidade ? `${details.criticidade}/5` : '-'} />
              </div>

              {/* Descricao */}
              {details.descricao && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Descricao</p>
                  <p className="text-sm whitespace-pre-wrap">{details.descricao}</p>
                </div>
              )}

              {/* Observacoes */}
              {details.observacoes && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Observacoes</p>
                  <p className="text-sm whitespace-pre-wrap">{details.observacoes}</p>
                </div>
              )}

              {/* Sub-instrucoes */}
              {details.sub_instrucoes && details.sub_instrucoes.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <ListChecks className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-xs font-medium text-muted-foreground">
                      Sub-instrucoes ({details.sub_instrucoes.length})
                    </p>
                  </div>
                  <div className="space-y-1">
                    {details.sub_instrucoes.map((sub: SubInstrucaoApiResponse, idx: number) => (
                      <div key={sub.id} className="flex items-start gap-2 text-sm pl-1">
                        <span className="text-muted-foreground font-mono text-xs mt-0.5 w-5 text-right flex-shrink-0">
                          {sub.ordem || idx + 1}.
                        </span>
                        <span className="flex-1">{sub.descricao}</span>
                        {sub.obrigatoria && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground flex-shrink-0">
                            obrigatoria
                          </span>
                        )}
                        {sub.tempo_estimado ? (
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {formatMinutos(sub.tempo_estimado)}
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recursos */}
              {details.recursos && details.recursos.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-xs font-medium text-muted-foreground">
                      Recursos ({details.recursos.length})
                    </p>
                  </div>
                  <div className="space-y-1">
                    {details.recursos.map((rec: RecursoInstrucaoApiResponse) => (
                      <div key={rec.id} className="flex items-center gap-2 text-sm pl-1">
                        <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground flex-shrink-0">
                          {tipoRecursoLabels[rec.tipo] || rec.tipo}
                        </span>
                        <span className="flex-1">{rec.descricao}</span>
                        {rec.quantidade ? (
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {rec.quantidade}{rec.unidade ? ` ${rec.unidade}` : ''}
                          </span>
                        ) : null}
                        {rec.obrigatorio && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground flex-shrink-0">
                            obrigatorio
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state if no sub-instrucoes and no recursos */}
              {(!details.sub_instrucoes || details.sub_instrucoes.length === 0) &&
               (!details.recursos || details.recursos.length === 0) &&
               !details.descricao && (
                <p className="text-sm text-muted-foreground">Nenhum detalhe adicional disponivel.</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * O valor da instrucao na proposta.
 *
 * O texto fica em estado local e so grava no blur: gravar a cada tecla
 * dispararia um PUT por digito, e duas respostas fora de ordem devolveriam o
 * valor antigo para dentro do campo no meio da digitacao.
 */
function ValorDaInstrucao({
  valor,
  editavel,
  onValor,
}: {
  valor: number;
  editavel: boolean;
  onValor?: (valor: number) => void;
}) {
  const [texto, setTexto] = useState(String(valor ?? 0));

  // Muda por fora quando a recarga refaz os valores a partir do catalogo.
  useEffect(() => {
    setTexto(String(valor ?? 0));
  }, [valor]);

  const gravar = () => {
    const lido = Number(String(texto).replace(',', '.'));
    const limpo = Number.isFinite(lido) && lido >= 0 ? lido : 0;
    setTexto(String(limpo));
    if (limpo !== valor) onValor?.(limpo);
  };

  return (
    <input
      className="input-minimal input-numero text-center"
      type="number"
      step="0.01"
      min="0"
      value={texto}
      disabled={!editavel}
      onChange={(e) => setTexto(e.target.value)}
      onBlur={gravar}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          (e.target as HTMLInputElement).blur();
        }
      }}
    />
  );
}

function InfoItem({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <div className="flex items-center gap-1 text-sm">
        {icon}
        <span>{value}</span>
      </div>
    </div>
  );
}
