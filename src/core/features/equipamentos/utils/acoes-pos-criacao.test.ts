import { act, renderHook } from '@testing-library/react';
import { AxiosError } from 'axios';
import { describe, expect, it, vi } from 'vitest';
import { rodarAcoesPosCriacao, useAcoesPosCriacao } from '@/core/features/equipamentos/utils/acoes-pos-criacao';

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

  it('com o motivo, quando o backend mandou um', async () => {
    const recusa = new AxiosError('400', 'ERR_BAD_REQUEST', undefined, undefined, {
      status: 400,
      data: { message: 'Arquivo maior que 10 MB' },
    } as never);
    const acoes = new Map([['os anexos', vi.fn(async () => { throw recusa; })]]);

    expect(await rodarAcoesPosCriacao(acoes, 'eq1')).toEqual(['os anexos (Arquivo maior que 10 MB)']);
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

/**
 * O campo registra a ação e não se desregistra ao fechar o sheet. Sem limpar a
 * cada abertura, os anexos escolhidos para o componente A subiam também no B,
 * criado depois sem abrir a aba Anexos (revisão do SN-12).
 */
describe('useAcoesPosCriacao', () => {
  const subir = async () => undefined;

  it('começa vazio a cada abertura do sheet', () => {
    const { result, rerender } = renderHook(({ aberto }) => useAcoesPosCriacao(aberto), { initialProps: { aberto: true } });
    act(() => result.current.registrar('os anexos', subir));

    rerender({ aberto: false });
    rerender({ aberto: true });

    expect([...result.current.acoes.current.keys()]).toEqual([]);
  });

  it('enquanto aberto, guarda o que foi registrado', () => {
    const { result, rerender } = renderHook(({ aberto }) => useAcoesPosCriacao(aberto), { initialProps: { aberto: true } });
    act(() => result.current.registrar('os anexos', subir));

    rerender({ aberto: true });

    expect([...result.current.acoes.current.keys()]).toEqual(['os anexos']);
  });

  it('trocar o modo lote também recomeça (o campo que sumiu não fica registrado)', () => {
    const { result, rerender } = renderHook(({ lote }) => useAcoesPosCriacao(true, lote), { initialProps: { lote: false } });
    act(() => result.current.registrar('o plano', subir));

    rerender({ lote: true });

    expect([...result.current.acoes.current.keys()]).toEqual([]);
  });
});
