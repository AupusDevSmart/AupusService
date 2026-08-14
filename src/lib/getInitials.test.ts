import { describe, expect, it } from 'vitest';
import { getInitials } from '@/lib/getInitials';

describe('getInitials', () => {
  it('retorna as duas primeiras letras quando o nome tem uma palavra so', () => {
    expect(getInitials('Nicolas')).toBe('NI');
  });

  it('retorna a inicial das duas primeiras palavras quando tem mais de uma', () => {
    expect(getInitials('Nicolas Santana Kruger')).toBe('NS');
  });
});
