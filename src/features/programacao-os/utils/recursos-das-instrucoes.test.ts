import { describe, expect, it } from 'vitest';
import type { InstrucaoApiResponse, RecursoInstrucaoApiResponse, MaquinarioInstrucaoApiResponse } from '@/services/instrucoes.services';
import { SEM_PRECO, contribuicaoDaInstrucao, somar, tirar, trocarInstrucoes, type RecursosDaProgramacao } from './recursos-das-instrucoes';

/** Uma linha de recurso como o detalhe da instrução a devolve (SN-85), só com o que a conta lê */
const recurso = (
  categoria: string,
  nome: string,
  linha: Partial<RecursoInstrucaoApiResponse> & { base?: string; unidade?: string } = {},
): RecursoInstrucaoApiResponse =>
  ({
    quantidade: 1,
    duracao_horas: 0,
    fator_perda: 0,
    fornecido_pelo_cliente: false,
    preco_base: null,
    subtotal: null,
    ...linha,
    recurso: { nome, categoria, unidade: linha.unidade ?? null, base_calculo: linha.base ?? 'unidade' },
  }) as unknown as RecursoInstrucaoApiResponse;

const maquinario = (nome: string, linha: Partial<MaquinarioInstrucaoApiResponse> = {}): MaquinarioInstrucaoApiResponse =>
  ({ quantidade: 1, duracao_horas: 0, subtotal: null, ...linha, maquinario: { nome } }) as unknown as MaquinarioInstrucaoApiResponse;

const instrucao = (recursos: RecursoInstrucaoApiResponse[], maquinarios: MaquinarioInstrucaoApiResponse[] = []) =>
  ({ recursos, maquinarios }) as Pick<InstrucaoApiResponse, 'recursos' | 'maquinarios'>;

const nada = (): RecursosDaProgramacao => ({ materiais: [], ferramentas: [], tecnicos: [], itens_orcamento: [] });

describe('contribuicaoDaInstrucao', () => {
  it('reparte as 6 categorias e o maquinário nos quatro campos, com o custo', () => {
    const c = contribuicaoDaInstrucao(
      instrucao(
        [
          recurso('MATERIAL', 'Cabo 2,5 mm', { quantidade: 40, fator_perda: 0.1, unidade: 'm', subtotal: 220 }),
          recurso('MAO_DE_OBRA', 'Eletricista', { quantidade: 2, duracao_horas: 4, base: 'hora', subtotal: 400 }),
          recurso('INSTRUMENTO', 'Megômetro', { quantidade: 1, subtotal: 80 }),
          recurso('VEICULO', 'Caminhonete', { subtotal: 150 }),
          recurso('TERCEIRO', 'Laudo', { subtotal: 1000 }),
          recurso('DESPESA_CAMPO', 'Hospedagem', { subtotal: 250.555 }),
        ],
        [maquinario('Guindaste', { quantidade: 1, subtotal: 900 })],
      ),
    );

    // O material planejado com a perda, e o preço de uma unidade dele
    expect(c.materiais).toEqual([{ descricao: 'Cabo 2,5 mm', quantidade_planejada: 44, unidade: 'm', custo_unitario: 5 }]);
    // Uma vaga por pessoa: duas de 4 h, com o preço da hora (400 / 8 h)
    expect(c.tecnicos).toEqual([
      { nome: '', especialidade: 'Eletricista', horas_estimadas: 4, custo_hora: 50 },
      { nome: '', especialidade: 'Eletricista', horas_estimadas: 4, custo_hora: 50 },
    ]);
    expect(c.ferramentas.map((f) => [f.descricao, f.quantidade])).toEqual([
      ['Megômetro', 1],
      ['Guindaste', 1],
    ]);
    expect(c.itens_orcamento).toEqual([
      { descricao: 'Instrumento: Megômetro', valor: 80 },
      { descricao: 'Veículo: Caminhonete', valor: 150 },
      { descricao: 'Terceiro: Laudo', valor: 1000 },
      { descricao: 'Despesa de campo: Hospedagem', valor: 250.56 },
      { descricao: 'Maquinário: Guindaste', valor: 900 },
    ]);
  });

  it('sem preço no cadastro: o material sem custo, e no orçamento com a marca; o fornecido pelo cliente não entra no orçamento', () => {
    const c = contribuicaoDaInstrucao(
      instrucao([
        recurso('MATERIAL', 'Fusível', { quantidade: 2, subtotal: null }),
        recurso('TERCEIRO', 'Ensaio', { subtotal: null }),
        recurso('INSTRUMENTO', 'Escada', { subtotal: 0, fornecido_pelo_cliente: true }),
      ]),
    );
    expect(c.materiais).toEqual([{ descricao: 'Fusível', quantidade_planejada: 2, unidade: '' }]);
    expect(c.itens_orcamento).toEqual([{ descricao: `Terceiro: Ensaio ${SEM_PRECO}`, valor: 0 }]);
    expect(c.ferramentas.map((f) => f.descricao)).toEqual(['Escada']);
  });

  it('as casas que o servidor aceita: quantidade com 3, preço e horas com 2 (mais casas davam 400 ao salvar)', () => {
    const c = contribuicaoDaInstrucao(
      instrucao([
        recurso('MATERIAL', 'Graxa', { quantidade: 3, fator_perda: 0.0125, unidade: 'kg', subtotal: 10 }),
        recurso('MAO_DE_OBRA', 'Mecânico', { quantidade: 1.5, duracao_horas: 3, subtotal: 100 }),
      ]),
    );
    expect(c.materiais[0]).toMatchObject({ quantidade_planejada: 3.038, custo_unitario: 3.29 });
    // 1,5 pessoa: uma vaga inteira e outra com metade das horas; 100 / 4,5 h
    expect(c.tecnicos.map((t) => [t.horas_estimadas, t.custo_hora])).toEqual([
      [3, 22.22],
      [1.5, 22.22],
    ]);
  });

  it('a vaga fica entre 0,25 e 24 h: mais de 24 h por pessoa vira mais vagas, a fração pequena sobe a 0,25', () => {
    const c = contribuicaoDaInstrucao(
      instrucao([
        recurso('MAO_DE_OBRA', 'Montador', { quantidade: 1, duracao_horas: 30, subtotal: 300 }),
        recurso('MAO_DE_OBRA', 'Ajudante', { quantidade: 1.1, duracao_horas: 2, subtotal: 22 }),
        recurso('MAO_DE_OBRA', 'Vigia', { quantidade: 1, duracao_horas: 0.1, subtotal: 1 }),
      ]),
    );
    expect(c.tecnicos.map((t) => [t.especialidade, t.horas_estimadas])).toEqual([
      ['Montador', 24],
      ['Montador', 6],
      ['Ajudante', 2],
      ['Ajudante', 0.25],
      ['Vigia', 0.25],
    ]);
  });

  it('mão de obra sem duração: vaga sem horas (a programação preenche), com o preço da hora do cadastro', () => {
    const c = contribuicaoDaInstrucao(instrucao([recurso('MAO_DE_OBRA', 'Ajudante', { quantidade: 1, base: 'hora', preco_base: 35 })]));
    expect(c.tecnicos).toEqual([{ nome: '', especialidade: 'Ajudante', horas_estimadas: 0, custo_hora: 35 }]);
  });

  it('a mesma linha duas vezes na instrução vira uma', () => {
    const c = contribuicaoDaInstrucao(
      instrucao([
        recurso('INSTRUMENTO', 'Alicate', { quantidade: 1 }),
        recurso('INSTRUMENTO', 'Alicate', { quantidade: 2 }),
      ]),
    );
    expect(c.ferramentas).toEqual([{ descricao: 'Alicate', quantidade: 3, unidade: undefined }]);
  });
});

describe('somar e tirar', () => {
  const a = contribuicaoDaInstrucao(
    instrucao([
      recurso('MATERIAL', 'Cabo', { quantidade: 10, unidade: 'm', subtotal: 50 }),
      recurso('MAO_DE_OBRA', 'Eletricista', { quantidade: 2, duracao_horas: 2, subtotal: 200 }),
      recurso('TERCEIRO', 'Ensaio', { subtotal: null }),
    ]),
  );
  const b = contribuicaoDaInstrucao(
    instrucao([
      recurso('MATERIAL', 'Cabo', { quantidade: 10, unidade: 'm', subtotal: 70 }),
      recurso('MAO_DE_OBRA', 'Eletricista', { quantidade: 1, duracao_horas: 3, subtotal: 150 }),
      recurso('TERCEIRO', 'Ensaio', { subtotal: null }),
    ]),
  );

  it('somar junta a linha igual: quantidade somada, preço pela média ponderada; a vaga i soma as horas da vaga i', () => {
    const juntas = somar(somar(nada(), a), b);
    expect(juntas.materiais).toEqual([{ descricao: 'Cabo', quantidade_planejada: 20, unidade: 'm', custo_unitario: 6 }]);
    // A mesma equipe faz as duas: a primeira vaga 2 + 3 h, a segunda só as 2 h de A
    expect(juntas.tecnicos.map((t) => t.horas_estimadas)).toEqual([5, 2]);
    expect(juntas.itens_orcamento).toEqual([{ descricao: `Terceiro: Ensaio ${SEM_PRECO}`, valor: 0 }]);
  });

  it('tirar devolve ao que a outra pede, e o que só a retirada trazia sai', () => {
    const juntas = somar(somar(nada(), a), b);
    const semB = tirar(juntas, b, a);
    expect(semB.materiais).toEqual([{ descricao: 'Cabo', quantidade_planejada: 10, unidade: 'm', custo_unitario: 6 }]);
    expect(semB.tecnicos.map((t) => t.horas_estimadas)).toEqual([2, 2]);
    // O item sem preço que a outra também pede fica
    expect(semB.itens_orcamento).toHaveLength(1);

    expect(tirar(semB, a, nada())).toEqual(nada());
  });

  it('o que o planejador ajustou fica: a linha a mais, a quantidade a mais, a pessoa escalada', () => {
    const ajustado = somar(nada(), a);
    ajustado.materiais[0].quantidade_planejada = 15;
    ajustado.tecnicos[0] = { ...ajustado.tecnicos[0], nome: 'Ana', tecnico_id: 'u1' };
    ajustado.ferramentas.push({ descricao: 'Escada', quantidade: 1 });
    ajustado.itens_orcamento.push({ descricao: 'Frete', valor: 0 });

    const depois = tirar(ajustado, a, nada());
    expect(depois.materiais).toEqual([{ descricao: 'Cabo', quantidade_planejada: 5, unidade: 'm', custo_unitario: 5 }]);
    expect(depois.ferramentas).toEqual([{ descricao: 'Escada', quantidade: 1 }]);
    // O frete zero foi digitado: não sai junto com a instrução
    expect(depois.itens_orcamento).toEqual([{ descricao: 'Frete', valor: 0 }]);
    // A vaga sem ninguém sai; a de Ana fica, sem horas: o formulário as pede, e a pessoa escalada não some calada
    expect(depois.tecnicos).toEqual([{ ...ajustado.tecnicos[0], horas_estimadas: 0 }]);
  });

  it('a vaga passa de 24 h: abre outra (a linha aceita até 24 h); tirar a instrução tira a vaga que ela abriu', () => {
    const longa = (horas: number) =>
      contribuicaoDaInstrucao(instrucao([recurso('MAO_DE_OBRA', 'Eletricista', { quantidade: 1, duracao_horas: horas, subtotal: horas * 10 })]));
    const duas = somar(somar(nada(), longa(16)), longa(16));
    expect(duas.tecnicos.map((t) => t.horas_estimadas)).toEqual([16, 16]);

    expect(tirar(duas, longa(16), longa(16)).tecnicos.map((t) => t.horas_estimadas)).toEqual([16]);
  });

  it('a linha que o planejador diminuiu e ainda é pedida volta ao que a restante pede (negativa daria 400)', () => {
    const juntas = somar(somar(nada(), a), b);
    juntas.materiais[0].quantidade_planejada = 5;
    expect(tirar(juntas, b, a).materiais[0].quantidade_planejada).toBe(10);
  });

  it('trocarInstrucoes: trocar a origem tira as de antes e soma as novas', () => {
    const comA = trocarInstrucoes(nada(), { entraram: [a], sairam: [], ficam: [] });
    const comB = trocarInstrucoes(comA, { entraram: [b], sairam: [a], ficam: [] });
    expect(comB).toEqual(somar(nada(), b));
  });
});
