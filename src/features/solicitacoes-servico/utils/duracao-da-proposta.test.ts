import { describe, expect, it } from 'vitest';
import { propostaVazia, type PlanejamentoCalculado, type Proposta } from '@/services/proposta.services';
import { contaDosDias, horasNaTela } from '@/features/solicitacoes-servico/utils/duracao-da-proposta';

/**
 * A duração escrita na tela (30/out/2026): o usuário vê de onde saem os dias, as
 * horas dos passos das instruções, a estrada e a jornada de 8 h.
 */
const calculado = (mudar: Partial<PlanejamentoCalculado>): PlanejamentoCalculado => ({
  horas_dos_passos: 9,
  pessoas: 2,
  ida_e_volta_km: null,
  interno_km: null,
  interno_sugerido_km: null,
  horas_por_trecho: null,
  bate_volta: null,
  dias_sugeridos: 2,
  dias: 2,
  noites_sugeridas: null,
  noites: null,
  veiculos: 1,
  km_por_veiculo: null,
  ...mudar,
});
const proposta = (c: Partial<PlanejamentoCalculado>, mudar: Partial<Proposta> = {}): Proposta => ({
  ...propostaVazia(),
  itens: [{ instrucao_id: 'a', descricao: 'A', quantidade: 1, preco_unitario: 0 }],
  planejamento_calculado: calculado(c),
  ...mudar,
});

describe('a duração da proposta, escrita', () => {
  it('sem a distância: as horas ÷ 8 h, para cima', () => {
    expect(contaDosDias(proposta({}))).toBe('9h de serviço (os passos das instruções) ÷ 8h por dia → 2 dias (para cima).');
  });

  it('dormindo no local: a estrada de ida e volta soma às horas', () => {
    expect(contaDosDias(proposta({ horas_por_trecho: 4.5, bate_volta: false, dias_sugeridos: 3 }))).toBe(
      '9h de serviço + 9h de estrada (ida e volta) = 18h ÷ 8h por dia → 3 dias (para cima).',
    );
  });

  it('no bate-volta: a estrada sai de cada dia', () => {
    expect(contaDosDias(proposta({ horas_por_trecho: 1.5, bate_volta: true, dias_sugeridos: 2 }))).toBe(
      '9h de serviço ÷ 5h de trabalho por dia (8h menos 3h de estrada, ida e volta) → 2 dias (para cima).',
    );
  });

  it('os dias digitados valem, e a conta diz quanto ela daria', () => {
    expect(contaDosDias(proposta({}, { dias_previstos: 4 }))).toMatch(/→ 2 dias \(para cima\)\. Valem os 4 dias digitados\.$/);
  });

  it('instrução sem horas nos passos: pede os dias; sem instrução nem cálculo, nada', () => {
    expect(contaDosDias(proposta({ horas_dos_passos: 0, dias_sugeridos: null }))).toBe('As instruções não têm horas nos passos: digite os dias.');
    expect(contaDosDias(proposta({ horas_dos_passos: 0 }, { itens: [] }))).toBeNull();
    expect(contaDosDias({ ...propostaVazia(), planejamento_calculado: null })).toBeNull();
  });

  it('as horas na tela: 4h30, 8h, 45 min', () => {
    expect([horasNaTela(4.5), horasNaTela(8), horasNaTela(0.75), horasNaTela(16.5)]).toEqual(['4h30', '8h', '45 min', '16h30']);
  });
});
