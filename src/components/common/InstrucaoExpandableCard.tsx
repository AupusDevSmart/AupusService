// src/components/common/InstrucaoExpandableCard.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { FileText, ChevronRight, X, Clock, Wrench, ListChecks, AlertCircle, SquarePen, Construction } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Expandir } from '@/components/ui/expandir';
import {
  instrucoesApi,
  ROTULO_DA_DISCIPLINA,
  type InstrucaoApiResponse,
  type SubInstrucaoApiResponse,
} from '@/services/instrucoes.services';
import { descreverFaixa, numeroOuNulo } from '@/utils/leitura';
import { formatarHoras } from '@/utils/horas';
import { rotuloCategoria } from '@/services/recursos.services';
import { descreverUso } from '@/features/instrucoes/utils/custo-da-linha';
import { useVeCustos } from '@/hooks/useVeCustos';

/** "leitura 580 a 620 V", "leitura em V", "leitura" (SN-58) */
function rotuloDaLeitura(sub: SubInstrucaoApiResponse) {
  const faixa = descreverFaixa({ minimo: numeroOuNulo(sub.valor_minimo), maximo: numeroOuNulo(sub.valor_maximo), unidade: sub.unidade });
  if (faixa) return `leitura ${faixa}`;
  return sub.unidade ? `leitura em ${sub.unidade}` : 'leitura';
}

interface InstrucaoExpandableCardProps {
  id: string;
  /** O código da instrução (SN-85: era tag) */
  codigo?: string | null;
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
  /** O valor sugerido contou como zero alguma linha sem preço no cadastro (SN-86) */
  semPrecoNoCadastro?: boolean;
}

const moeda = (valor: number) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function InstrucaoExpandableCard({
  id,
  codigo,
  nome,
  onRemove,
  disabled,
  onEditar,
  valor,
  onValor,
  valorEditavel = true,
  semPrecoNoCadastro = false,
}: InstrucaoExpandableCardProps) {
  // O preço da instrução só para quem vê custos (28/out/2026)
  const veCusto = useVeCustos();
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

  const label = `${codigo ? codigo + ' - ' : ''}${nome || 'Instrucao'}`;

  return (
    <div className="overflow-hidden">
      {/* Header - sempre visivel */}
      <div className="flex items-center justify-between py-1.5">
        <button
          type="button"
          onClick={handleToggle}
          className="flex items-center gap-2 min-w-0 flex-1 text-left hover:opacity-80 transition-opacity"
        >
          <ChevronRight
            className={`h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
          />
          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm truncate font-medium">{label}</span>
        </button>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          {/* O valor logo depois do nome, e nao numa lista separada abaixo: a
              instrucao aparecia duas vezes na tela, uma para ser lida e outra
              para ser precificada. */}
          {valor !== undefined && (
            <>
              {semPrecoNoCadastro && (
                <span
                  className="text-xs text-muted-foreground"
                  title="Alguma linha desta instrução não tem preço no cadastro: o valor sugerido a conta como zero."
                >
                  sem preço
                </span>
              )}
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
      <Expandir aberto={expanded}>
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
              {/* Os campos do AupusProject (SN-85): a frente e o D+X, a duração dos passos e o valor */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <InfoItem label="Frente" value={details.frente || '-'} />
                <InfoItem
                  label="Cronograma"
                  value={`D+${details.prazo_inicio_relativo ?? 0}, ${details.duracao_dias ?? 1} ${details.duracao_dias === 1 ? 'dia' : 'dias'}`}
                />
                <InfoItem
                  label="Duração dos passos"
                  value={details.horas_dos_passos ? formatarHoras(details.horas_dos_passos) : '-'}
                  icon={<Clock className="h-3.5 w-3.5" />}
                />
                {/* Para quem não vê custos (cliente, técnico) a API manda sem preço: "falta preço" seria mentira */}
                {veCusto && (
                  <InfoItem
                    label="Valor da instrução"
                    value={details.custo === null ? 'falta preço' : details.custo === undefined ? '-' : moeda(details.custo)}
                  />
                )}
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
                        {sub.tipo && (
                          <span className="text-xs text-muted-foreground flex-shrink-0">{ROTULO_DA_DISCIPLINA[sub.tipo]}</span>
                        )}
                        {sub.registro === 'LEITURA' && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground flex-shrink-0">
                            {rotuloDaLeitura(sub)}
                          </span>
                        )}
                        {sub.obrigatoria && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground flex-shrink-0">
                            obrigatoria
                          </span>
                        )}
                        {sub.duracao_horas ? (
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {formatarHoras(sub.duracao_horas)}
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
                    {details.recursos.map((rec) => (
                      <LinhaDeCusto
                        key={rec.id}
                        rotulo={rotuloCategoria(rec.recurso.categoria)}
                        nome={rec.recurso.nome}
                        uso={descreverUso(rec.recurso, rec)}
                        subtotal={rec.fornecido_pelo_cliente ? 'do cliente' : veCusto ? rec.subtotal : undefined}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Maquinário (SN-85) */}
              {details.maquinarios && details.maquinarios.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Construction className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-xs font-medium text-muted-foreground">Maquinário ({details.maquinarios.length})</p>
                  </div>
                  <div className="space-y-1">
                    {details.maquinarios.map((maq) => (
                      <LinhaDeCusto
                        key={maq.id}
                        nome={maq.maquinario.nome}
                        uso={descreverUso(maq.maquinario, maq)}
                        subtotal={veCusto ? maq.subtotal : undefined}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state if no sub-instrucoes and no recursos */}
              {(!details.sub_instrucoes || details.sub_instrucoes.length === 0) &&
               (!details.recursos || details.recursos.length === 0) &&
               (!details.maquinarios || details.maquinarios.length === 0) &&
               !details.descricao && (
                <p className="text-sm text-muted-foreground">Nenhum detalhe adicional disponivel.</p>
              )}
            </>
          )}
        </div>
      </Expandir>
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

/** Uma linha de recurso ou maquinário: o que é, quanto se usa e quanto custa (do servidor) */
/** `subtotal` ausente: quem não vê custos (a linha mostra o que é e quanto se usa, sem preço) */
function LinhaDeCusto({ rotulo, nome, uso, subtotal }: { rotulo?: string; nome: string; uso: string; subtotal?: number | null | string }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm pl-1">
      {rotulo && (
        <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground flex-shrink-0">{rotulo}</span>
      )}
      <span className="min-w-0 flex-1">{nome}</span>
      <span className="text-xs text-muted-foreground flex-shrink-0">{uso}</span>
      {subtotal !== undefined && (
        <span className="text-xs text-foreground flex-shrink-0">
          {typeof subtotal === 'string' ? subtotal : subtotal === null ? 'sem preço' : moeda(subtotal)}
        </span>
      )}
    </div>
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
