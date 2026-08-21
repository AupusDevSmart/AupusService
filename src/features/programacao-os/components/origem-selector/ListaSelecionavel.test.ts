// src/features/programacao-os/components/origem-selector/ListaSelecionavel.test.ts
import { describe, expect, it } from 'vitest';
import type { OpcaoDaLista } from './ListaSelecionavel';

/**
 * O filtro da lista, extraido do componente.
 *
 * Repetido aqui de proposito: o componente e visual e a regra e a mesma, mas
 * testar via render exigiria montar a arvore inteira para verificar uma
 * comparacao de texto. O que precisa ficar preso e QUE CAMPOS a busca alcanca —
 * ja aconteceu de a lista mostrar a planta e nao encontra-la na busca.
 */
function filtrar(opcoes: OpcaoDaLista[], busca: string): OpcaoDaLista[] {
  const termo = busca.trim().toLowerCase();
  if (!termo) return opcoes;

  return opcoes.filter((o) =>
    [o.titulo, o.subtitulo, ...(o.etiquetas ?? []).map((e) => e.texto)]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(termo),
  );
}

const planos: OpcaoDaLista[] = [
  {
    id: 'a',
    titulo: 'plano inversor solar power',
    subtitulo: 'Inversor 3 · UFV SOLAR POWER · 4 tarefas',
    etiquetas: [{ texto: 'INVERSOR' }, { texto: 'UFV Solar Power' }],
  },
  {
    id: 'b',
    titulo: 'Teste plano disjuntor',
    subtitulo: 'Disjuntor 1 · UFV SOLAR POWER · 2 tarefas',
    etiquetas: [{ texto: 'DISJUNTOR' }, { texto: 'UFV Solar Power' }],
  },
  {
    id: 'c',
    titulo: 'Plano Duplicado E2E',
    subtitulo: 'Pivô 8 · Pivos · 1 tarefa',
    etiquetas: [{ texto: 'PIVO' }, { texto: 'Fazenda Sete Irmãos' }],
  },
];

describe('busca da lista de origem', () => {
  it('acha pelo nome do plano', () => {
    expect(filtrar(planos, 'disjuntor').map((p) => p.id)).toEqual(['b']);
  });

  it('acha pelo EQUIPAMENTO, que fica no subtitulo', () => {
    expect(filtrar(planos, 'Inversor 3').map((p) => p.id)).toEqual(['a']);
  });

  it('acha pela INSTALACAO', () => {
    expect(filtrar(planos, 'Pivos').map((p) => p.id)).toEqual(['c']);
  });

  it('acha pela PLANTA, que fica na etiqueta em corpo menor', () => {
    // O caso que motivou o teste: a planta desceu para a etiqueta, e etiqueta
    // fora do filtro deixaria um texto visivel na tela e inalcancavel na busca.
    expect(filtrar(planos, 'Fazenda Sete').map((p) => p.id)).toEqual(['c']);
  });

  it('acha pela categoria', () => {
    expect(filtrar(planos, 'pivo').map((p) => p.id)).toEqual(['c']);
  });

  it('ignora caixa e espaco em volta', () => {
    expect(filtrar(planos, '  UFV SOLAR  ').map((p) => p.id)).toEqual(['a', 'b']);
  });

  it('busca vazia devolve tudo', () => {
    expect(filtrar(planos, '   ')).toHaveLength(3);
  });
});
