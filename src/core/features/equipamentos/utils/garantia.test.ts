import { describe, expect, it } from 'vitest';
import { garantiaAntesDaInstalacao, situacaoDaGarantia } from './garantia';

/** A garantia na leitura do equipamento (SN-66): dias de calendário, em Brasília. */
describe('situação da garantia', () => {
  const hoje = '2026-10-19';

  it.each([
    ['2026-10-18', 'vencida', 'Garantia vencida em 18/10/2026'],
    ['2026-10-19', 'vencendo', 'A garantia termina hoje'],
    ['2026-10-20', 'vencendo', 'A garantia termina em 1 dia (20/10/2026)'],
    ['2026-12-18', 'vencendo', 'A garantia termina em 60 dias (18/12/2026)'],
    ['2026-12-19', 'vigente', 'Em garantia até 19/12/2026'],
    // O que a API manda: meia-noite UTC (não pode virar o dia anterior)
    ['2027-01-15T00:00:00.000Z', 'vigente', 'Em garantia até 15/01/2027'],
  ])('%s: %s', (garantia, tipo, texto) => {
    expect(situacaoDaGarantia(garantia, hoje)).toMatchObject({ tipo, texto });
  });

  it('sem data ou com data inválida, nada a dizer', () => {
    expect(situacaoDaGarantia(undefined, hoje)).toBeNull();
    expect(situacaoDaGarantia('', hoje)).toBeNull();
    expect(situacaoDaGarantia('amanhã', hoje)).toBeNull();
  });

  it('garantia que acaba antes da instalação é data trocada', () => {
    expect(garantiaAntesDaInstalacao('2026-05-01', '2026-04-30')).toBe(true);
    expect(garantiaAntesDaInstalacao('2026-05-01', '2031-05-01')).toBe(false);
    expect(garantiaAntesDaInstalacao('', '2026-04-30')).toBe(false);
  });
});
