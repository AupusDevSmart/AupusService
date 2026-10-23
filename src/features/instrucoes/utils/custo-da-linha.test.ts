import { describe, expect, it } from 'vitest';
import { descreverUso, somarSubtotais, subtotalDaLinha, unidadesDaLinha } from './custo-da-linha';

/**
 * O espelho da conta do servidor (custo-da-instrucao.ts, a BaseDeCusto do
 * AupusProject, SN-85): os mesmos casos do spec de lá, para as duas não
 * divergirem.
 */
const hora = { base_calculo: 'hora', horas_por_diaria: 8, preco_base: 80 };
const diaria = { base_calculo: 'diaria', horas_por_diaria: 8, preco_base: 1500 };
const unidade = { base_calculo: 'unidade', horas_por_diaria: 8, preco_base: 12.5, unidade: 'm' };
const km = { base_calculo: 'km', horas_por_diaria: 8, preco_base: 2 };
const fechado = { base_calculo: 'fechado', horas_por_diaria: 8, preco_base: 1000 };

describe('custo da linha (espelho do servidor)', () => {
  it('hora: quantidade x horas x preço', () => {
    expect(subtotalDaLinha(hora, { quantidade: 2, duracao_horas: 3 })).toBe(480);
  });

  it('diária: horas ÷ jornada para cima; zero hora é zero', () => {
    expect(unidadesDaLinha(diaria, { duracao_horas: 10 })).toBe(2);
    expect(unidadesDaLinha(diaria, { duracao_horas: 0 })).toBe(0);
    expect(subtotalDaLinha(diaria, { duracao_horas: '10' })).toBe(3000);
  });

  it('unidade: a perda na quantidade, que não multiplica de novo', () => {
    expect(unidadesDaLinha(unidade, { quantidade: 40, fator_perda: 0.1 })).toBe(44);
    expect(subtotalDaLinha(unidade, { quantidade: 40, fator_perda: 0.1 })).toBe(550);
  });

  it('km e fechado', () => {
    expect(subtotalDaLinha(km, { quantidade: 1, distancia_km: 120 })).toBe(240);
    expect(subtotalDaLinha(fechado, { quantidade: 3 })).toBe(3000);
  });

  it('sem preço é nulo; fornecido pelo cliente é zero; o preço próprio vale no lugar do cadastro', () => {
    expect(subtotalDaLinha({ ...hora, preco_base: null }, { duracao_horas: 1 })).toBeNull();
    expect(subtotalDaLinha({ ...unidade, preco_base: null }, { quantidade: 5, fornecido_pelo_cliente: true })).toBe(0);
    expect(subtotalDaLinha(hora, { duracao_horas: 2, preco_proprio: '100' })).toBe(200);
  });

  it('a soma é nula com uma linha sem preço', () => {
    expect(somarSubtotais([480, null])).toBeNull();
    expect(somarSubtotais([0.1, 0.2])).toBe(0.3);
  });

  it('o uso em texto curto', () => {
    expect(descreverUso(hora, { quantidade: 2, duracao_horas: 3 })).toBe('2 × 3h');
    expect(descreverUso(diaria, { duracao_horas: 10 })).toBe('10h (2 diárias)');
    expect(descreverUso(unidade, { quantidade: 40, fator_perda: 0.1 })).toBe('40 m + 10%');
    expect(descreverUso(km, { distancia_km: 120 })).toBe('120 km');
    expect(descreverUso(fechado, {})).toBe('valor fechado');
  });
});
