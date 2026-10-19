import { describe, expect, it } from 'vitest';
import { equipamentoParou, rotuloDoParou } from './equipamento-parou';

describe('o equipamento parou? (SN-60)', () => {
  it('a resposta gravada vale, com ou sem o horário', () => {
    expect(rotuloDoParou({ equipamento_parou: true, parada_inicio: '2026-10-16T09:00:00.000Z' })).toBe('Sim');
    expect(rotuloDoParou({ equipamento_parou: true, parada_inicio: null })).toBe('Sim, sem o horário da parada');
    expect(rotuloDoParou({ equipamento_parou: false })).toBe('Não');
  });

  it('sem resposta gravada (conteúdo de antes): a parada informada é sim; sem ela, nada', () => {
    expect(equipamentoParou({ parada_inicio: '2026-10-16T09:00:00.000Z' })).toBe(true);
    expect(equipamentoParou({ equipamento_parou: null })).toBeNull();
    expect(rotuloDoParou({})).toBeNull();
  });
});
