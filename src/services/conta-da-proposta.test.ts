// src/services/conta-da-proposta.test.ts
import { describe, expect, it } from 'vitest';
import { contaDaProposta, contaFecha, totalDaLinha, type EntradaDaConta } from '@/services/conta-da-proposta';

/**
 * Os mesmos números do spec do servidor (`conta-da-proposta.spec.ts` da API): a
 * cópia do rascunho não deriva da conta que grava sem ninguém notar.
 */
describe('a conta da proposta (rascunho)', () => {
  const percentuais = { imposto: 15, margem: 20, admServicos: 5, admFd: 2 };
  const entrada = (mudar: Partial<EntradaDaConta> = {}): EntradaDaConta => ({
    instrucoes: [10000],
    logistica: [],
    adicionais: [],
    percentuais,
    desconto: { tipo: null, valor: null },
    ...mudar,
  });

  it('o exemplo da spec: custo de R$ 10.000, imposto 15% e margem 20% dão R$ 15.384,62', () => {
    const conta = contaDaProposta(entrada({ percentuais: { ...percentuais, admServicos: 0, admFd: 0 } }));
    expect([conta.precoServicos, conta.totalAupus, conta.imposto]).toEqual([15384.62, 15384.62, 2307.69]);
  });

  it('a administração leva só o imposto; o faturamento direto entra no global', () => {
    const conta = contaDaProposta(entrada({ adicionais: [{ valor: 5000, faturamento_direto: true }] }));
    expect(conta).toMatchObject({ administracao: 600, precoAdministracao: 705.88, totalAupus: 16090.5, totalGeral: 21090.5, imposto: 2413.57 });
    expect(conta.margemEfetiva).toBeCloseTo(22.852, 3);
  });

  it('o desconto é sobre o total inteiro e sai do faturamento da Aupus, até ele', () => {
    const conta = contaDaProposta(entrada({ adicionais: [{ valor: 5000, faturamento_direto: true }], desconto: { tipo: 'PERCENTUAL', valor: 10 } }));
    expect(conta).toMatchObject({ desconto: { pedido: 2109.05, aplicado: 2109.05 }, totalAupus: 13981.45, totalGeral: 18981.45, imposto: 2097.22 });
    const demais = contaDaProposta(entrada({ instrucoes: [100], adicionais: [{ valor: 5000, faturamento_direto: true }], desconto: { tipo: 'VALOR', valor: 1000 } }));
    expect([demais.totalAupus, demais.totalGeral]).toEqual([0, 5000]);
  });

  it('a logística ativa entra no custo dos serviços; a desativada, não', () => {
    const conta = contaDaProposta(
      entrada({
        logistica: [
          { tabela: 'FRETE', km: 120, quantidade: 2, valor_km: 2.5, valor_fixo: 80 },
          { tabela: 'DESLOCAMENTO', dias: 3, valor_unitario: 200, km: 240, valor_km: 2 },
          { tabela: 'DIARIA', quantidade: 6, valor_unitario: 45 },
          { tabela: 'DIARIA', ativo: false, quantidade: 4, valor_unitario: 180 },
        ],
        adicionais: [{ valor: 150, faturamento_direto: false }],
      }),
    );
    expect(conta).toMatchObject({ custoLogistica: 2030, custoAdicionais: 150, custoServicos: 12180 });
    expect([totalDaLinha({ tabela: 'FRETE', km: 100 }), totalDaLinha({ tabela: 'DIARIA', quantidade: 6, valor_unitario: 45 })]).toEqual([0, 270]);
    // Os veículos do deslocamento (30/out/2026): vazio é um, dois dobram
    expect(totalDaLinha({ tabela: 'DESLOCAMENTO', km: 240, valor_km: 2 })).toBe(480);
    expect(totalDaLinha({ tabela: 'DESLOCAMENTO', quantidade: 2, km: 240, valor_km: 2 })).toBe(960);
  });

  it('a venda de cada parte soma o preço dos serviços', () => {
    const conta = contaDaProposta(entrada({ instrucoes: [333.33, 333.33, 333.34], adicionais: [{ valor: 0.01, faturamento_direto: false }] }));
    const soma = [...conta.venda.instrucoes, conta.venda.logistica, conta.venda.adicionais].reduce((s, v) => s + v, 0);
    expect(Math.round(soma * 100) / 100).toBe(conta.precoServicos);
  });

  it('imposto e margem com 100% ou mais não fecham: o rascunho mostra o custo, e a tela avisa', () => {
    expect(contaFecha({ imposto: 40, margem: 60 })).toBe(false);
    expect(contaDaProposta(entrada({ percentuais: { ...percentuais, imposto: 40, margem: 60 } })).precoServicos).toBe(10000);
  });
});
