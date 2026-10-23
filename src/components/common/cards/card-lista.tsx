// src/components/common/cards/card-lista.tsx
import React, { createContext, useContext } from 'react';
import { useMaisEstreitoQue } from '@/hooks/useMaisEstreitoQue';

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
 * o que garante alinhamento.
 *
 * Quando a grade nao cabe (a largura do container, nao a da tela: o sheet tem
 * 720px num monitor largo) cada linha vira um cartao, com o rotulo em cima de
 * cada campo, em duas colunas. O limite sai das colunas (`larguraDaGrade`):
 * um numero fixo empilhava a programacao, que cabe, e deixava rolar a execucao,
 * que tem mais colunas. Antes o container rolava na horizontal, e no
 * celular os tecnicos e os materiais da OS so se liam arrastando para o lado
 * (SN-68, pedido do usuario em 19/out/2026).
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

const Empilhada = createContext(false);

/** O `gap-2` e o `px-1` da linha, em rem */
const ESPACO_ENTRE_COLUNAS = 0.5;
const RECUO_DA_LINHA = 0.5;

/**
 * A largura que a grade precisa: a soma do minimo de cada coluna ("11rem", o
 * primeiro valor de "minmax(9rem, 1fr)"; "1fr" sozinho conta 6rem), mais os
 * espacos entre elas.
 */
export function larguraDaGrade(colunas: ColunaCard[]): string {
  const minimo = (largura: string) => {
    const valor = /(\d+(?:\.\d+)?)(rem|px)/.exec(largura);
    if (!valor) return 6;
    return valor[2] === 'px' ? Number(valor[1]) / 16 : Number(valor[1]);
  };
  const total = colunas.reduce((soma, c) => soma + minimo(c.largura), 0);
  return `${total + ESPACO_ENTRE_COLUNAS * Math.max(colunas.length - 1, 0) + RECUO_DA_LINHA}rem`;
}

export function CardLista({
  colunas,
  larguraMinima,
  children,
}: {
  colunas: ColunaCard[];
  /** Abaixo dela, cada linha vira um cartao. Sem valor, a soma das colunas (`larguraDaGrade`). */
  larguraMinima?: string;
  children: React.ReactNode;
}) {
  const template = colunas.map((c) => c.largura).join(' ');
  const { ref, estreito } = useMaisEstreitoQue<HTMLDivElement>(larguraMinima ?? larguraDaGrade(colunas));

  return (
    // Sem moldura, sem faixa no cabecalho e sem divisoria entre as linhas: a
    // borda de cada campo ja delimita o que e editavel, e o resto so somava
    // tracos ao redor de tracos.
    // `contain: inline-size`: a largura vem de onde a lista está, nunca da grade
    // dela — senão a grade alargava o sheet e a medida nunca dava "estreita"
    <div ref={ref} data-empilhada={estreito || undefined} className="w-full min-w-0 [contain:inline-size]">
      {!estreito && (
        <div
          className="grid gap-2 px-1 pb-1 text-xs text-muted-foreground"
          style={{ gridTemplateColumns: template }}
        >
          {colunas.map((coluna, i) => (
            <span key={`${coluna.label}-${i}`} className={`truncate ${alinhar(coluna.alinhamento)}`}>
              {coluna.label}
            </span>
          ))}
        </div>
      )}
      <div className={estreito ? 'space-y-2' : undefined}>
        <Empilhada.Provider value={estreito}>{children}</Empilhada.Provider>
      </div>
    </div>
  );
}

/** As celulas da linha, com os fragmentos abertos (`<>custo, total</>` sao duas) e sem os vazios */
function celulasDe(children: React.ReactNode): React.ReactNode[] {
  return React.Children.toArray(children).flatMap((filho) =>
    React.isValidElement<{ children?: React.ReactNode }>(filho) && filho.type === React.Fragment
      ? celulasDe(filho.props.children)
      : [filho],
  );
}

export function CardLinha({
  colunas,
  children,
}: {
  colunas: ColunaCard[];
  children: React.ReactNode;
}) {
  const empilhada = useContext(Empilhada);

  if (!empilhada) {
    return (
      <div
        className="grid gap-2 px-1 py-1 items-center"
        style={{ gridTemplateColumns: colunas.map((c) => c.largura).join(' ') }}
      >
        {children}
      </div>
    );
  }

  // Empilhada: a primeira celula (quem/o que) ocupa a linha toda; as sem rotulo
  // (as acoes) vao no fim, a direita. Celula a mais que as colunas (nao deveria
  // haver) entra sem rotulo, em vez de sumir.
  return (
    <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 rounded-md border border-border p-2">
      {celulasDe(children).map((celula, i) => {
        const coluna = colunas[i];
        const rotulo = coluna?.label;
        const larga = i === 0 || !rotulo;
        return (
          <div
            key={i}
            className={`min-w-0 ${larga ? 'col-span-2' : ''} ${!rotulo ? 'flex justify-end' : ''}`}
          >
            {rotulo && <span className="mb-0.5 block text-xs text-muted-foreground">{rotulo}</span>}
            {celula}
          </div>
        );
      })}
    </div>
  );
}
