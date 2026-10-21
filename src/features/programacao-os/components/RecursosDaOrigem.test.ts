// src/features/programacao-os/components/RecursosDaOrigem.test.ts
import { describe, expect, it } from 'vitest';
import { daLinhaDaInstrucao, separarRecursos } from './RecursosDaOrigem';

/**
 * O reparte dos recursos da instrucao nos tres campos da programacao.
 *
 * O TipoRecurso tem cinco valores e a programacao tem tres campos, entao o mapa
 * nao e um-para-um — e errar aqui coloca ferramenta no lugar de material sem
 * nenhum erro aparecer.
 */
describe('separarRecursos', () => {
  it('reparte cada tipo no campo certo', () => {
    const { materiais, ferramentas, tecnicos } = separarRecursos([
      { tipo: 'MATERIAL', descricao: 'Cabo 2,5mm', quantidade: 10, unidade: 'm' },
      { tipo: 'INSTRUMENTO', descricao: 'Chave inglesa', quantidade: 1 },
      { tipo: 'INSTRUMENTO', descricao: 'Multímetro', quantidade: 1 },
      { tipo: 'MAO_DE_OBRA', descricao: 'Eletricista', quantidade: 4 },
    ]);

    expect(materiais).toHaveLength(1);
    expect(materiais[0]).toMatchObject({ descricao: 'Cabo 2,5mm', quantidade_planejada: 10, unidade: 'm' });

    // Instrumento entra junto das ferramentas: a programacao nao separa os dois.
    expect(ferramentas.map((f) => f.descricao)).toEqual(['Chave inglesa', 'Multímetro']);

    // O tecnico da instrucao e um PERFIL, entao vai para especialidade e o nome
    // fica vazio ate alguem ser escalado.
    expect(tecnicos[0]).toMatchObject({ nome: '', especialidade: 'Eletricista', horas_estimadas: 4 });
  });

  it('ignora viatura, que se resolve pela reserva', () => {
    const saida = separarRecursos([{ tipo: 'VEICULO', descricao: 'Caminhonete', quantidade: 1 }]);

    expect(saida.materiais).toHaveLength(0);
    expect(saida.ferramentas).toHaveLength(0);
    expect(saida.tecnicos).toHaveLength(0);
  });

  it('soma o recurso pedido por duas instrucoes', () => {
    const { ferramentas, tecnicos } = separarRecursos([
      { tipo: 'INSTRUMENTO', descricao: 'Chave inglesa', quantidade: 1 },
      { tipo: 'INSTRUMENTO', descricao: 'Chave inglesa', quantidade: 2 },
      { tipo: 'MAO_DE_OBRA', descricao: 'Eletricista', quantidade: 4 },
      { tipo: 'MAO_DE_OBRA', descricao: 'Eletricista', quantidade: 2 },
    ]);

    expect(ferramentas).toHaveLength(1);
    expect(ferramentas[0].quantidade).toBe(3);
    expect(tecnicos[0].horas_estimadas).toBe(6);
  });

  it('separa o mesmo material quando a unidade difere', () => {
    // "10 m de cabo" e "2 rolos de cabo" nao somam.
    const { materiais } = separarRecursos([
      { tipo: 'MATERIAL', descricao: 'Cabo', quantidade: 10, unidade: 'm' },
      { tipo: 'MATERIAL', descricao: 'Cabo', quantidade: 2, unidade: 'rolo' },
    ]);

    expect(materiais).toHaveLength(2);
  });

  it('preserva a quantidade decimal', () => {
    const { ferramentas } = separarRecursos([
      { tipo: 'INSTRUMENTO', descricao: 'Cabo de aço', quantidade: 2.5, unidade: 'm' },
    ]);

    expect(ferramentas[0].quantidade).toBe(2.5);
    expect(ferramentas[0].unidade).toBe('m');
  });

  it('descarta linha sem descrição', () => {
    expect(separarRecursos([{ tipo: 'MATERIAL', descricao: '   ', quantidade: 1 }]).materiais).toEqual([]);
  });
});

/** A linha da instrução com o item embutido (SN-85) vira o que a programação reparte */
describe('daLinhaDaInstrucao', () => {
  it('material com a perda (o que se compra), mão de obra em horas de equipe, instrumento pela quantidade', () => {
    expect(daLinhaDaInstrucao({ recurso: { categoria: 'MATERIAL', nome: 'Cabo', unidade: 'm' }, quantidade: 40, fator_perda: 0.1 })).toEqual({
      tipo: 'MATERIAL',
      descricao: 'Cabo',
      quantidade: 44,
      unidade: 'm',
    });
    expect(daLinhaDaInstrucao({ recurso: { categoria: 'MAO_DE_OBRA', nome: 'Eletricista' }, quantidade: 2, duracao_horas: 3 })).toMatchObject({ quantidade: 6 });
    expect(daLinhaDaInstrucao({ recurso: { categoria: 'INSTRUMENTO', nome: 'Megômetro' }, quantidade: 1, duracao_horas: 10 })).toMatchObject({ quantidade: 1 });
  });

  it('a mão de obra sem duração fica sem horas (nada inventado), e a linha vira o reparte de sempre', () => {
    const linhas = [
      daLinhaDaInstrucao({ recurso: { categoria: 'MAO_DE_OBRA', nome: 'Eletricista' }, quantidade: 2, duracao_horas: 0 }),
      daLinhaDaInstrucao({ recurso: { categoria: 'MATERIAL', nome: 'Fita', unidade: 'un' }, quantidade: '3' }),
    ];
    expect(separarRecursos(linhas)).toMatchObject({
      tecnicos: [{ especialidade: 'Eletricista', horas_estimadas: 0 }],
      materiais: [{ descricao: 'Fita', quantidade_planejada: 3, unidade: 'un' }],
    });
  });
});
