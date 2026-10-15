import { describe, expect, it, vi } from 'vitest';
import { rodarAcoesPosCriacao } from '@/core/features/equipamentos/utils/acoes-pos-criacao';

/**
 * O que o sheet guarda para depois que o componente existir (anexos, por
 * exemplo). No criar de um componente só, a falha caía num catch vazio: o
 * componente nascia e o acessório sumia sem aviso (SN-12).
 */
describe('rodarAcoesPosCriacao', () => {
  it('ação que falha volta pelo nome, para o sheet avisar', async () => {
    const acoes = new Map([
      ['os anexos', vi.fn(async () => { throw new Error('rede'); })],
      ['a posição', vi.fn(async () => undefined)],
    ]);

    expect(await rodarAcoesPosCriacao(acoes, 'eq1')).toEqual(['os anexos']);
  });

  it('uma falha não impede as outras, e todas recebem o id criado', async () => {
    const segunda = vi.fn(async () => undefined);
    const acoes = new Map([
      ['primeira', vi.fn(async () => { throw new Error('x'); })],
      ['segunda', segunda],
    ]);

    await rodarAcoesPosCriacao(acoes, 'eq1');

    expect(segunda).toHaveBeenCalledWith('eq1');
  });
});
