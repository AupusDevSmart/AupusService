// src/services/proposta.services.test.ts
import { describe, expect, it } from 'vitest';
import { calcularRascunho, propostaVazia, type Proposta } from '@/services/proposta.services';

/**
 * O rascunho do cadastro (29/out/2026): a proposta antes de a solicitação existir
 * usa a cópia da conta do servidor (`conta-da-proposta.ts`, com os números
 * presos no teste dela). Aqui, o que o rascunho grava em cada campo.
 */
describe('totais do rascunho', () => {
  const base = (): Proposta => ({
    ...propostaVazia(),
    itens: [{ descricao: 'Termografia', quantidade: 1, preco_unitario: 10000 }],
    outros_custos: [{ descricao: 'Guindaste', valor: 5000, faturamento_direto: true }],
  });

  const padroes = { imposto_percentual: 15, margem_percentual: 20, adm_servicos_percentual: 5, adm_fd_percentual: 2 };

  it('com os padrões da empresa, os totais da conta: o global é a Aupus mais o faturamento direto', () => {
    const total = calcularRascunho({ ...base(), ...padroes });
    expect(total).toMatchObject({
      imposto_percentual: 15,
      margem_percentual: 20,
      total_servicos: 10000,
      total_fd: 5000,
      total_administracao: 705.88,
      total_aupus: 16090.5,
      valor_imposto: 2413.57,
      total_geral: 21090.5,
      total_desconto: 0,
    });
    expect(total.itens[0].valor_venda).toBe(15384.62);
    expect(total.fechamento).toMatchObject({ custo_servicos: 10000, preco_servicos: 15384.62 });
  });

  it('os padrões que a página lê da API entram no lugar dos da spec', () => {
    const comOutros = calcularRascunho({
      ...propostaVazia({ imposto_percentual: 10, margem_percentual: 10, adm_servicos_percentual: 0, adm_fd_percentual: 0 }),
      itens: base().itens,
    });
    expect(comOutros.total_aupus).toBe(12500);
  });

  it('a logística ganha o total de cada linha e entra no custo dos serviços', () => {
    const total = calcularRascunho({
      ...base(),
      ...padroes,
      logistica: [
        { tabela: 'DESLOCAMENTO', ativo: true, descricao: 'Picape', dias: 3, valor_unitario: 200, km: 240, valor_km: 2, total: null },
        { tabela: 'DIARIA', ativo: false, descricao: 'Pernoite', quantidade: 2, valor_unitario: 200, total: null },
      ],
    });
    expect(total.logistica.map((l) => l.total)).toEqual([1080, 400]);
    expect(total.total_servicos).toBe(11080);
    // A linha sem nome (que não se grava) não entra na conta
    expect(calcularRascunho({ ...total, logistica: [...total.logistica, { tabela: 'FRETE', ativo: true, descricao: ' ', quantidade: 1, km: 10, valor_km: 100, total: null }] }).total_servicos).toBe(11080);
    expect(total.venda?.logistica).toBeGreaterThan(1080);
  });

  it('o desconto sobre o total inteiro sai do faturamento da Aupus', () => {
    const total = calcularRascunho({ ...base(), ...padroes, desconto_tipo: 'PERCENTUAL', desconto_valor: 10 });
    expect(total).toMatchObject({ total_desconto: 2109.05, total_aupus: 13981.45, total_geral: 18981.45 });
  });

  it('antes de os padrões chegarem, sem percentual: o preço é o custo', () => {
    expect(calcularRascunho(base())).toMatchObject({ imposto_percentual: null, total_aupus: 10000, total_geral: 15000 });
  });

  it('zera sem nada', () => {
    expect(calcularRascunho(propostaVazia())).toMatchObject({ total_geral: 0, total_aupus: 0, margem_efetiva: null });
  });
});
