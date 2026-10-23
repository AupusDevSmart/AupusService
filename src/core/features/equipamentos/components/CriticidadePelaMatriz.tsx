import type { KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { NIVEIS_DE_CRITICIDADE, rotuloDaCriticidade } from '@/core/features/equipamentos/config/criticidade';
import {
  avaliar,
  difereDaMatriz,
  IMPACTOS,
  LIMITE_DO_MOTIVO,
  MATRIZ_DE_CRITICIDADE,
  PROBABILIDADES,
  sugeridaDe,
  type AvaliacaoDaCriticidade,
  type NotaDaEscala,
} from '@/core/features/equipamentos/utils/criticidade-pela-matriz';

const NIVEIS: readonly NotaDaEscala[] = [...NIVEIS_DE_CRITICIDADE]
  .reverse()
  .map((n) => ({ nota: Number(n.value), rotulo: n.label, descricao: '' }));

interface EscalaProps {
  id: string;
  rotulo: string;
  escala: readonly NotaDaEscala[];
  valor: number | null | undefined;
  onChange: (nota: number) => void;
  somenteLeitura: boolean;
  /** A nota que a matriz sugere, marcada na escala do nível */
  sugerida?: number | null;
  obrigatorio?: boolean;
}

/** De 1 a 5 em botões: grupo de rádio de verdade (setas do teclado, leitor de tela). */
function Escala({ id, rotulo, escala, valor, onChange, somenteLeitura, sugerida, obrigatorio }: EscalaProps) {
  const escolhida = escala.find((n) => n.nota === valor);
  const aoTeclar = (e: KeyboardEvent<HTMLDivElement>) => {
    if (somenteLeitura) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      onChange(Math.min(5, (valor || 0) + 1));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      onChange(Math.max(1, (valor || 2) - 1));
    }
  };

  return (
    <div className="space-y-1.5">
      <span id={`${id}-rotulo`} className="text-sm font-medium">
        {rotulo} {obrigatorio && !somenteLeitura && <span className="text-red-500">*</span>}
      </span>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <div
          role="radiogroup"
          aria-labelledby={`${id}-rotulo`}
          aria-readonly={somenteLeitura || undefined}
          tabIndex={somenteLeitura ? -1 : 0}
          onKeyDown={aoTeclar}
          className="flex gap-1 rounded-md outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {escala.map((n) => (
            <button
              key={n.nota}
              type="button"
              role="radio"
              aria-checked={n.nota === valor}
              aria-label={`${n.nota} · ${n.rotulo}${n.descricao ? `: ${n.descricao}` : ''}${n.nota === sugerida ? ' (sugerida pela matriz)' : ''}`}
              title={n.descricao || undefined}
              tabIndex={-1}
              disabled={somenteLeitura}
              onClick={() => onChange(n.nota)}
              className={cn(
                'h-8 w-8 rounded border text-sm transition-colors disabled:cursor-default',
                n.nota === valor ? 'border-foreground bg-foreground text-background' : 'border-border text-muted-foreground',
                !somenteLeitura && n.nota !== valor && 'hover:bg-muted',
                n.nota === sugerida && n.nota !== valor && 'border-dashed border-foreground text-foreground',
              )}
            >
              {n.nota}
            </button>
          ))}
        </div>
        <span className="min-w-0 text-sm text-muted-foreground">
          {escolhida ? `${escolhida.rotulo}${escolhida.descricao ? `: ${escolhida.descricao.toLowerCase()}` : ''}` : somenteLeitura ? '—' : 'Escolha de 1 a 5'}
        </span>
      </div>
    </div>
  );
}

interface CriticidadePelaMatrizProps {
  valores: AvaliacaoDaCriticidade;
  /** Recebe o formulário já avaliado (as notas puxam o nível sugerido) */
  onChange: (valores: AvaliacaoDaCriticidade) => void;
  somenteLeitura?: boolean;
}

/**
 * A criticidade do equipamento pela matriz impacto × probabilidade (SN-64), no
 * sheet da UC e no do componente. As duas notas sugerem o nível; a pessoa pode
 * escolher outro e, então, diz o motivo. Cadastro de antes fica sem avaliação,
 * com o nível como estava.
 */
export function CriticidadePelaMatriz({ valores, onChange, somenteLeitura = false }: CriticidadePelaMatrizProps) {
  const mudar = (mudanca: Partial<AvaliacaoDaCriticidade>) => onChange(avaliar(valores, mudanca));
  const sugerida = sugeridaDe(valores);
  const diverge = difereDaMatriz(valores);
  const temNota = !!(valores.criticidadeImpacto || valores.criticidadeProbabilidade);
  const nivel = Number(valores.criticidade) || null;

  return (
    <div className="space-y-4">
      <h3 className="border-b pb-2 text-sm font-semibold text-foreground">Criticidade</h3>

      <div className="space-y-3">
        <Escala
          id="criticidade-impacto"
          rotulo="Impacto da falha"
          escala={IMPACTOS}
          valor={valores.criticidadeImpacto}
          onChange={(nota) => mudar({ criticidadeImpacto: nota })}
          somenteLeitura={somenteLeitura}
        />
        <Escala
          id="criticidade-probabilidade"
          rotulo="Probabilidade de falha"
          escala={PROBABILIDADES}
          valor={valores.criticidadeProbabilidade}
          onChange={(nota) => mudar({ criticidadeProbabilidade: nota })}
          somenteLeitura={somenteLeitura}
        />
        <Escala
          id="criticidade-nivel"
          rotulo="Criticidade"
          escala={NIVEIS}
          valor={nivel}
          onChange={(nota) => mudar({ criticidade: String(nota) })}
          somenteLeitura={somenteLeitura}
          sugerida={sugerida === null ? null : Number(sugerida)}
          obrigatorio
        />
      </div>

      {sugerida !== null && (
        <p className="text-sm text-muted-foreground">
          Sugerida pela matriz: {rotuloDaCriticidade(sugerida)}
          {diverge && '. O nível escolhido é outro.'}
        </p>
      )}
      {sugerida === null && !temNota && <p className="text-sm text-muted-foreground">Sem avaliação pela matriz: o nível vale como está.</p>}
      {sugerida === null && temNota && !somenteLeitura && (
        <p role="status" className="text-sm text-muted-foreground">
          Dê as duas notas para a matriz sugerir o nível.
        </p>
      )}

      {diverge && (
        <div className="space-y-1.5">
          <label htmlFor="criticidade-motivo" className="text-sm font-medium">
            Motivo da diferença {!somenteLeitura && <span className="text-red-500">*</span>}
          </label>
          {somenteLeitura ? (
            <p id="criticidade-motivo" className="whitespace-pre-wrap text-sm">
              {valores.criticidadeMotivo?.trim() || 'Sem motivo registrado.'}
            </p>
          ) : (
            <textarea
              id="criticidade-motivo"
              className="input-minimal min-h-[4rem]"
              value={valores.criticidadeMotivo ?? ''}
              onChange={(e) => onChange({ ...valores, criticidadeMotivo: e.target.value })}
              maxLength={LIMITE_DO_MOTIVO}
              placeholder="Por que este equipamento não segue a matriz"
            />
          )}
        </div>
      )}

      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground">Como a matriz decide</summary>
        <div className="mt-2 space-y-2">
          <table className="border-collapse text-center text-xs" aria-label="Matriz de criticidade: impacto nas linhas, probabilidade nas colunas">
            <thead>
              <tr>
                <th scope="col" className="px-1 py-0.5 text-left font-normal text-muted-foreground">
                  Impacto \ Prob.
                </th>
                {PROBABILIDADES.map((p) => (
                  <th key={p.nota} scope="col" className="w-7 px-1 py-0.5 font-normal text-muted-foreground">
                    {p.nota}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...IMPACTOS].reverse().map((i) => (
                <tr key={i.nota}>
                  <th scope="row" className="px-1 py-0.5 text-left font-normal text-muted-foreground">
                    {i.nota} · {i.rotulo}
                  </th>
                  {MATRIZ_DE_CRITICIDADE[i.nota - 1].map((n, p) => {
                    const atual = valores.criticidadeImpacto === i.nota && valores.criticidadeProbabilidade === p + 1;
                    return (
                      <td
                        key={p}
                        aria-current={atual || undefined}
                        className={cn('border border-border px-1 py-0.5', atual && 'bg-foreground font-semibold text-background')}
                      >
                        {n}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-muted-foreground">
            O impacto pesa o dobro: nível = (2 × impacto + probabilidade) ÷ 3, arredondado. Uma falha rara que para a
            instalação fica Alta; uma frequente que não afeta nada fica Baixa.
          </p>
        </div>
      </details>
    </div>
  );
}
