import { describe, expect, it } from 'vitest';
import { instanteParaApi } from './instante';

/** Data e hora para a API: com o fuso de quem digitou (SN-74; os testes rodam em America/Sao_Paulo). */
describe('instanteParaApi', () => {
  it('o datetime-local é a hora de Brasília: 18:00 vira 21:00 UTC', () => {
    expect(instanteParaApi('2026-10-20T18:00')).toBe('2026-10-20T21:00:00.000Z');
  });

  it('o ISO que veio da API volta igual (editar sem mexer no campo)', () => {
    expect(instanteParaApi('2026-10-20T21:00:00.000Z')).toBe('2026-10-20T21:00:00.000Z');
  });

  it('vazio vira null (apagar)', () => {
    expect(instanteParaApi('')).toBeNull();
    expect(instanteParaApi('   ')).toBeNull();
    expect(instanteParaApi(null)).toBeNull();
    expect(instanteParaApi(undefined)).toBeNull();
  });

  // No update, null apaga: texto inválido virando null apagaria a data gravada calado
  it('texto que não é data é erro, não null', () => {
    expect(() => instanteParaApi('não é data')).toThrow('Data e hora inválidas: não é data');
  });
});
