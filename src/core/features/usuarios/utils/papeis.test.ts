import { describe, expect, it } from 'vitest';
import { papeisQuePodeDar, permissoesMarcadas, soAsExtras, type PapelDaTela } from './papeis';

const PAPEIS: PapelDaTela[] = [
  { value: 'operador', label: 'Técnico de campo', ordem: 0 },
  { value: 'proprietario', label: 'Cliente', ordem: 1 },
  { value: 'analista', label: 'Planejador PCM', ordem: 2 },
  { value: 'gerente', label: 'Gerente de manutenção', ordem: 3 },
  { value: 'admin', label: 'Administrador', ordem: 4 },
  { value: 'super_admin', label: 'Super administrador', ordem: 5 },
  { value: 'vendedor', label: 'vendedor' },
];
const com = (...permissoes: string[]) => (...pedidas: string[]) => pedidas.some((p) => permissoes.includes(p));

describe('papeisQuePodeDar', () => {
  it('o planejador só oferece técnico e cliente (as create_ que ele tem)', () => {
    const lista = papeisQuePodeDar(PAPEIS, com('usuarios.create_operador', 'usuarios.create_proprietario'), false);
    expect(lista.map((p) => p.value)).toEqual(['operador', 'proprietario']);
  });

  it('o super_admin oferece todos os da matriz, nunca o legado', () => {
    expect(papeisQuePodeDar(PAPEIS, com(), true).map((p) => p.value)).toEqual([
      'operador',
      'proprietario',
      'analista',
      'gerente',
      'admin',
      'super_admin',
    ]);
  });

  it('o papel atual aparece mesmo quando não se pode dá-lo (a tela mostra o que o usuário é)', () => {
    const lista = papeisQuePodeDar(PAPEIS, com('usuarios.create_operador'), false, 'vendedor');
    expect(lista.map((p) => p.value)).toEqual(['operador', 'vendedor']);
  });
});

describe('permissões do papel e extras', () => {
  it('na tela, as do papel vêm marcadas junto com as extras', () => {
    expect([...permissoesMarcadas(['a', 'b'], ['c'])]).toEqual(['a', 'b', 'c']);
  });

  it('o que se grava são só as extras: as do papel saem', () => {
    expect(soAsExtras(['a', 'c', 'c', 'b'], ['a', 'b'])).toEqual(['c']);
  });
});
