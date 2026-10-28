// src/services/proposta.services.test.ts
import { describe, expect, it } from 'vitest';
import {
  BDI_GOINFRA,
  calcularBdi,
  calcularRascunho,
  descontoEmReais,
  propostaVazia,
  somaImpostos,
  type OutroCusto,
  type Proposta,
} from './proposta.services';

/**
 * O BDI é a única conta que o front repete — o rascunho precisa de total antes
 * de a solicitação existir no banco. Estes testes prendem o resultado à tabela
 * de referência (GOINFRA) e ao acórdão 2.622/2013 do TCU, para a cópia não
 * derivar da do servidor sem ninguém notar.
 */
describe('BDI', () => {
  it('reproduz os 30,44% da tabela de referência', () => {
    const p = propostaVazia();

    expect(somaImpostos(p)).toBeCloseTo(14.65, 4);
    expect(calcularBdi(p) * 100).toBeCloseTo(30.44, 2);
  });

  it('cai para 25,09% com o REIDI, que desonera PIS e COFINS', () => {
    const p: Proposta = { ...propostaVazia(), bdi_regime: 'COM_REIDI', bdi_pis: 0, bdi_cofins: 0 };

    expect(somaImpostos(p)).toBeCloseTo(11, 4);
    expect(calcularBdi(p) * 100).toBeCloseTo(25.09, 2);
  });

  it('não explode quando os impostos somam 100% ou mais', () => {
    // O campo é editável: um dígito a mais faria a divisão por (1-I) estourar.
    const p: Proposta = { ...propostaVazia(), bdi_issqn: 100 };

    expect(calcularBdi(p)).toBe(0);
  });
});

describe('totais do rascunho', () => {
  const custo = (descricao: string, valor: number, fd = false): OutroCusto => ({
    descricao,
    valor,
    faturamento_direto: fd,
    ordem: 1,
  });

  it('deixa o faturamento direto fora da base do BDI', () => {
    // 1.000 de item + 500 de FD, com o BDI padrão de 30,44%.
    const total = calcularRascunho({
      ...propostaVazia(),
      itens: [{ descricao: 'Item', quantidade: 1, preco_unitario: 1000 }],
      outros_custos: [custo('Equipamento do fornecedor', 500, true)],
    });

    expect(total.total_custo).toBe(1500); // o custo mostra tudo
    expect(total.total_bdi).toBe(304.38); // mas o BDI só incide sobre os 1.000
    expect(total.total_geral).toBe(1804.38);
    expect(total.bdi_percentual).toBeCloseTo(30.438, 3);
  });

  it('cobra BDI do custo comum, que passa pela empresa', () => {
    const total = calcularRascunho({
      ...propostaVazia(),
      itens: [{ descricao: 'Item', quantidade: 2, preco_unitario: 250 }],
      outros_custos: [custo('Deslocamento', 500)],
    });

    // (500 + 500) × 1,3044 — mesma base do caso anterior, e mesmo total.
    expect(total.total_bdi).toBe(304.38);
    expect(total.total_geral).toBe(1304.38);
  });

  it('zera sem itens', () => {
    const total = calcularRascunho(propostaVazia());

    expect(total.total_custo).toBe(0);
    expect(total.total_bdi).toBe(0);
    expect(total.total_geral).toBe(0);
  });
});

/**
 * O desconto no rascunho (28/out/2026): a mesma conta do servidor, sobre o total
 * inteiro (o faturamento direto junto), para o cadastro mostrar o total antes de
 * a solicitação existir.
 */
describe('desconto do rascunho', () => {
  const base = (): Proposta => ({
    ...propostaVazia(),
    itens: [{ descricao: 'Item', quantidade: 1, preco_unitario: 1000 }],
    outros_custos: [{ descricao: 'Guindaste', valor: 200, faturamento_direto: true }],
  });

  it('percentual sobre o total inteiro: 10% de 1.504,38', () => {
    const total = calcularRascunho({ ...base(), desconto_tipo: 'PERCENTUAL', desconto_valor: 10 });
    expect(total.total_desconto).toBe(150.44);
    expect(total.total_geral).toBe(1353.94);
  });

  it('em reais; maior que o total, para no total', () => {
    expect(calcularRascunho({ ...base(), desconto_tipo: 'VALOR', desconto_valor: 500 }).total_geral).toBe(1004.38);
    const demais = calcularRascunho({ ...base(), desconto_tipo: 'VALOR', desconto_valor: 5000 });
    expect([demais.total_desconto, demais.total_geral]).toEqual([1504.38, 0]);
  });

  it('sem tipo ou sem valor, nada', () => {
    expect(descontoEmReais(null, 10, 100)).toBe(0);
    expect(descontoEmReais('VALOR', null, 100)).toBe(0);
    expect(calcularRascunho(base()).total_geral).toBe(1504.38);
  });

  it('o rascunho nasce com o BDI que lhe derem (o padrão da empresa)', () => {
    const comLucro10 = calcularRascunho({ ...base(), ...propostaVazia({ ...BDI_GOINFRA, bdi_lucro: 10 }), itens: base().itens });
    expect(comLucro10.bdi_percentual).toBeCloseTo(36.65, 2);
  });
});
