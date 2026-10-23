import { describe, expect, it } from 'vitest';
import { formatarTelefone, mascararTelefone, telefoneE164 } from '@/core/lib/telefone';

/**
 * Telefone guardado em E.164 (`+5562999998888`) e mostrado com máscara
 * (SN-46). A regra de converter é a mesma da API (common/helpers/contato.ts):
 * a tela manda o número já no padrão, e a API recusa o que não é telefone.
 */
describe('telefoneE164', () => {
  it.each([
    ['62999998888', '+5562999998888'],
    ['(62) 99999-8888', '+5562999998888'],
    ['+55 62 99999-8888', '+5562999998888'],
    ['(62) 3333-4444', '+556233334444'],
    ['+1 415 555 2671', '+14155552671'],
  ])('%s vira %s', (entrada, esperado) => {
    expect(telefoneE164(entrada)).toBe(esperado);
  });

  it.each(['werwe', '9999', '99998888', '62899998888', '(62) 9999-9888', '6213334444'])('%s não é telefone', (entrada) => {
    expect(telefoneE164(entrada)).toBeNull();
  });
});

describe('formatarTelefone', () => {
  it.each([
    ['+5562999998888', '(62) 99999-8888'],
    ['+556233334444', '(62) 3333-4444'],
    ['+14155552671', '+14155552671'],
    ['texto antigo', 'texto antigo'],
    [null, ''],
  ])('%s aparece como %s', (gravado, exibido) => {
    expect(formatarTelefone(gravado)).toBe(exibido);
  });
});

describe('mascararTelefone (enquanto digita)', () => {
  it.each([
    ['6', '(6'],
    ['629', '(62) 9'],
    ['6299999', '(62) 9999-9'],
    ['6233334444', '(62) 3333-4444'],
    ['62999998888', '(62) 99999-8888'],
    ['629999988889', '629999988889'],
    ['+1 415', '+1415'],
  ])('%s vira %s', (digitado, mascarado) => {
    expect(mascararTelefone(digitado)).toBe(mascarado);
  });
});
