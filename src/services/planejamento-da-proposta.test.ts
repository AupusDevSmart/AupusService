import { describe, expect, it } from 'vitest';
import { comAsAutomaticas, comLogisticaAutomatica, linhasAutomaticas, planejamentoCalculado, type PadroesDaLogistica, type PlanejamentoDigitado } from '@/services/planejamento-da-proposta';
import { propostaVazia, type LinhaDeLogistica } from '@/services/proposta.services';

/**
 * A cópia do cálculo da API (30/out/2026): os mesmos números de
 * `planejamento-da-proposta.spec.ts` do aupus-service-api. Se um muda, o outro muda.
 */
const PADROES: PadroesDaLogistica = { valorKm: 2.5, horasPor100Km: 1.5, internoPercentual: 10, cafe: 10, almoco: 20, jantar: 20, pernoite: 100, pessoasPorVeiculo: 4, bateVoltaHoras: 2, pessoasPadrao: 2 };
const vazio: PlanejamentoDigitado = { idaKm: null, internoKm: null, dias: null, pessoas: null, noites: null, horasDosPassos: 0 };
const calcular = (d: Partial<PlanejamentoDigitado>) => planejamentoCalculado({ ...vazio, ...d }, PADROES);

describe('planejamento calculado (a mesma conta da API)', () => {
  it('longe (300 km, 5 pessoas, 9 h de passos): pernoite, 3 dias, 2 noites, 2 veículos de 660 km', () => {
    expect(calcular({ idaKm: 300, pessoas: 5, horasDosPassos: 9 })).toEqual({
      horas_dos_passos: 9,
      pessoas: 5,
      ida_e_volta_km: 600,
      interno_km: 60,
      interno_sugerido_km: 60,
      horas_por_trecho: 4.5,
      bate_volta: false,
      dias_sugeridos: 3,
      dias: 3,
      noites_sugeridas: 2,
      noites: 2,
      veiculos: 2,
      km_por_veiculo: 660,
    });
  });

  it('perto (100 km): bate-volta de 2 dias e 420 km por veículo', () => {
    expect(calcular({ idaKm: 100, pessoas: 2, horasDosPassos: 9 })).toMatchObject({ bate_volta: true, dias: 2, noites: 0, km_por_veiculo: 420 });
  });

  it('as noites digitadas decidem o bate-volta; sem pessoas valem as do padrão', () => {
    expect(calcular({ idaKm: 300, horasDosPassos: 9, dias: 4, noites: 0, internoKm: 0 })).toMatchObject({ bate_volta: true, km_por_veiculo: 2400, pessoas: 2 });
    expect(calcular({ idaKm: 100, horasDosPassos: 9, dias: 3, noites: 2 })).toMatchObject({ bate_volta: false, km_por_veiculo: 220 });
  });

  it('as linhas: km dos veículos e as refeições (café e jantar só nas noites fora)', () => {
    const linhas = linhasAutomaticas(calcular({ idaKm: 300, pessoas: 5, horasDosPassos: 9 }), PADROES);
    expect(linhas.map((l) => [l.automatica, l.quantidade, l.total])).toEqual([
      ['KM', 2, 3300],
      ['CAFE', 10, 100],
      ['ALMOCO', 15, 300],
      ['JANTAR', 10, 200],
      ['PERNOITE', 10, 1000],
    ]);
  });
});

describe('as linhas da tabela seguindo o planejamento', () => {
  const linha = (dados: Partial<LinhaDeLogistica>): LinhaDeLogistica => ({ tabela: 'DIARIA', ativo: true, descricao: 'x', total: 0, ...dados });

  it('a ajustada fica; a que acompanha recebe a quantidade e mantém o preço; a digitada não se mexe; a que falta entra', () => {
    const pedidas = linhasAutomaticas(calcular({ idaKm: 300, pessoas: 5, horasDosPassos: 9 }), PADROES);
    const resultado = comAsAutomaticas(
      [
        linha({ descricao: 'Lanche', quantidade: 3, valor_unitario: 8 }),
        linha({ automatica: 'ALMOCO', descricao: 'Almoço', quantidade: 4, valor_unitario: 25 }),
        linha({ automatica: 'JANTAR', descricao: 'Jantar', quantidade: 2, valor_unitario: 20, ajustada: true }),
      ],
      pedidas,
    );
    expect(resultado.map((l) => [l.automatica ?? l.descricao, l.quantidade, l.total])).toEqual([
      ['Lanche', 3, 0],
      ['ALMOCO', 15, 375],
      ['JANTAR', 2, 0],
      ['KM', 2, 3300],
      ['CAFE', 10, 100],
      ['PERNOITE', 10, 1000],
    ]);
  });

  it('sem noites, café e pernoite ficam com zero, com o preço que tinham', () => {
    const pedidas = linhasAutomaticas(calcular({ idaKm: 100, pessoas: 2, horasDosPassos: 9 }), PADROES);
    const resultado = comAsAutomaticas([linha({ automatica: 'CAFE', quantidade: 4, valor_unitario: 12 }), linha({ automatica: 'PERNOITE', ativo: false, quantidade: 2 })], pedidas);
    expect(resultado.map((l) => [l.automatica, l.quantidade, l.valor_unitario ?? null])).toEqual([
      ['CAFE', 0, 12],
      ['PERNOITE', 0, null],
      ['KM', 1, null],
      ['ALMOCO', 4, 20],
    ]);
  });

  it('o rascunho soma as horas dos passos das instruções lidas e grava o calculado', () => {
    const rascunho = {
      ...propostaVazia(),
      itens: [
        { instrucao_id: 'a', descricao: 'A', quantidade: 1, preco_unitario: 0, horas_dos_passos: 5 },
        { instrucao_id: 'b', descricao: 'B', quantidade: 1, preco_unitario: 0, horas_dos_passos: 4 },
      ],
      distancia_km: 300,
      pessoas_previstas: 5,
    };
    const calculado = comLogisticaAutomatica(rascunho, PADROES);
    expect(calculado).toMatchObject({
      distancia_ida_volta_km: 600,
      dias_sugeridos: 3,
      planejamento_calculado: { dias: 3, noites: 2, horas_dos_passos: 9, horas_por_instrucao: [{ descricao: 'A', horas: 5 }, { descricao: 'B', horas: 4 }] },
    });
    expect(calculado.logistica.map((l) => l.automatica)).toEqual(['KM', 'CAFE', 'ALMOCO', 'JANTAR', 'PERNOITE']);
    // Sem os padrões (ainda lendo), nada muda
    expect(comLogisticaAutomatica(rascunho, null)).toBe(rascunho);
  });
});
