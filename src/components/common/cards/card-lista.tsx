// src/components/common/cards/card-lista.tsx
import React from 'react';

/**
 * Primitivas das listas em card (tecnicos, materiais, ferramentas, orcamento).
 *
 * Os quatro cards tinham o mesmo par de problemas:
 *
 * 1. Os campos vinham com `bg-transparent border-0 shadow-none
 *    focus-visible:ring-0` — invisiveis por construcao. Sem borda e sem fundo
 *    proprio, nao dava para ver onde um campo terminava e o outro comecava,
 *    em dark ou light mode.
 * 2. A linha era `flex flex-wrap` com larguras fixas, entao quebrava em duas
 *    metades desalinhadas assim que a soma passava da largura do sheet. E sem
 *    cabecalho: depois de preenchido, "8" e "67" nao diziam o que eram.
 *
 * Aqui a linha vira grid com template compartilhado entre cabecalho e itens,
 * o que garante alinhamento; o container rola na horizontal em vez de quebrar.
 */

export interface ColunaCard {
  /** Vazio no caso da coluna de acoes. */
  label: string;
  /** Valor de grid-template-columns para esta coluna. */
  largura: string;
  alinhamento?: 'left' | 'center' | 'right';
}

/** Campos visiveis: mantem a borda e o anel de foco do Input/select padrao. */
export const campoCard = 'h-8 text-sm px-2 dark:bg-black';

/** Mesmo tratamento para os `select` nativos usados nos cards. */
export const selectCard =
  'h-8 w-full rounded-[0.25rem] border border-input bg-transparent px-2 text-sm text-foreground shadow-sm ' +
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ' +
  'disabled:cursor-not-allowed disabled:opacity-50 dark:bg-black';

const alinhar = (a?: ColunaCard['alinhamento']) =>
  a === 'center' ? 'text-center' : a === 'right' ? 'text-right' : 'text-left';

export function CardLista({
  colunas,
  larguraMinima,
  children,
}: {
  colunas: ColunaCard[];
  /** Abaixo disso o container rola em vez de quebrar a linha. */
  larguraMinima: string;
  children: React.ReactNode;
}) {
  const template = colunas.map((c) => c.largura).join(' ');

  return (
    <div className="border border-border rounded-md overflow-x-auto">
      <div style={{ minWidth: larguraMinima }}>
        <div
          className="grid gap-2 px-3 py-1.5 bg-muted/50 border-b border-border text-xs text-muted-foreground"
          style={{ gridTemplateColumns: template }}
        >
          {colunas.map((coluna, i) => (
            <span key={`${coluna.label}-${i}`} className={`truncate ${alinhar(coluna.alinhamento)}`}>
              {coluna.label}
            </span>
          ))}
        </div>
        <div className="divide-y divide-border">{children}</div>
      </div>
    </div>
  );
}

export function CardLinha({
  colunas,
  children,
}: {
  colunas: ColunaCard[];
  children: React.ReactNode;
}) {
  return (
    <div
      className="grid gap-2 px-3 py-1.5 items-center"
      style={{ gridTemplateColumns: colunas.map((c) => c.largura).join(' ') }}
    >
      {children}
    </div>
  );
}
