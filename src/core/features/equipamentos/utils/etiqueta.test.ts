import { describe, expect, it } from 'vitest';
import type { Equipamento } from '@/core/features/equipamentos/types';
import { dadosDaListagem, dadosDoEquipamento, enderecoDoEquipamento, etiquetaDe } from './etiqueta';

/** O que vai na etiqueta do equipamento (SN-67). */
describe('etiqueta do equipamento', () => {
  it('o endereço abre o cadastro pelo id, sem o espaço do Char(26)', () => {
    expect(enderecoDoEquipamento('https://service.aupus.com.br/', 'abc123   ')).toBe(
      'https://service.aupus.com.br/cadastros/equipamentos?equipamento=abc123',
    );
  });

  it('nome, TAG, planta · unidade e a criticidade pelo rótulo', () => {
    expect(etiquetaDe({ id: 'e1', nome: 'Inversor 1', tag: ' INV-01 ', criticidade: '4', planta: 'UFV Norte', unidade: 'Usina 1' }, 'https://app')).toEqual({
      url: 'https://app/cadastros/equipamentos?equipamento=e1',
      nome: 'Inversor 1',
      tag: 'INV-01',
      lugar: 'UFV Norte · Usina 1',
      criticidade: '4 · Alta',
    });
    expect(etiquetaDe({ id: 'e1', nome: '', tag: '', criticidade: null }, 'https://app')).toMatchObject({
      nome: 'Equipamento',
      tag: null,
      lugar: null,
      criticidade: null,
    });
  });

  it('do sheet: o componente sem unidade vale pela do pai', () => {
    const pai = { id: 'uc', nome: 'UC', unidade: { nome: 'Usina 1', planta: { nome: 'UFV Norte' } } } as unknown as Equipamento;
    const componente = { id: 'c1', nome: 'String 01', criticidade: '3' } as unknown as Equipamento;
    expect(dadosDoEquipamento(componente, pai)).toMatchObject({ planta: 'UFV Norte', unidade: 'Usina 1' });
  });

  it('da listagem da API', () => {
    expect(dadosDaListagem({ id: 'e1', nome: 'Inversor', tag: 'INV', criticidade: '5', unidade: { nome: 'U1', planta: { nome: 'P1' } } })).toEqual({
      id: 'e1',
      nome: 'Inversor',
      tag: 'INV',
      criticidade: '5',
      planta: 'P1',
      unidade: 'U1',
    });
  });
});
