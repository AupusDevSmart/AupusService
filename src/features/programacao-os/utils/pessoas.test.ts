import { describe, expect, it } from 'vitest';
import {
  GRUPO_ANTES,
  GRUPO_APOIO,
  GRUPO_EQUIPE,
  nomeDaOpcao,
  opcoesDePessoas,
  plantaDoFormulario,
  textoSemUsuario,
} from './pessoas';

const pessoas = {
  equipe: [{ id: 'tec-ana ', nome: 'Ana Técnica', email: null, papel: 'operador' }],
  apoio: [{ id: 'pla-paula', nome: 'Paula Planejadora', email: null, papel: 'analista' }],
};

/** SN-31: responsável e técnicos escolhidos entre usuários, não digitados. */
describe('opcoesDePessoas', () => {
  it('equipe da planta primeiro, depois o apoio, com o id sem espaço', () => {
    expect(opcoesDePessoas(pessoas)).toEqual([
      { value: 'tec-ana', label: 'Ana Técnica', grupo: GRUPO_EQUIPE },
      { value: 'pla-paula', label: 'Paula Planejadora', grupo: GRUPO_APOIO },
    ]);
  });

  it('quem já está escalado e saiu da lista continua aparecendo', () => {
    const opcoes = opcoesDePessoas(pessoas, { id: 'tec-bruno  ', nome: 'Bruno Técnico' });
    expect(opcoes.at(-1)).toEqual({ value: 'tec-bruno', label: 'Bruno Técnico', grupo: GRUPO_ANTES });
  });

  it('não repete quem já está na lista', () => {
    expect(opcoesDePessoas(pessoas, { id: 'tec-ana', nome: 'Ana' })).toHaveLength(2);
  });

  it('antes de carregar, só quem já está escalado', () => {
    expect(opcoesDePessoas(undefined, { id: 'x', nome: 'Xis' })).toEqual([{ value: 'x', label: 'Xis', grupo: GRUPO_ANTES }]);
    expect(opcoesDePessoas(undefined)).toEqual([]);
  });
});

describe('plantaDoFormulario', () => {
  it('vem da origem escolhida; senão, da programação salva', () => {
    expect(plantaDoFormulario({ origem: { plantaId: ' p1 ' }, planta_id: 'p2' })).toBe('p1');
    expect(plantaDoFormulario({ planta_id: 'p2' })).toBe('p2');
    expect(plantaDoFormulario({ origem: { plantaId: '' } })).toBeNull();
    // preventiva do cron: origem sem planta, programação com planta
    expect(plantaDoFormulario({ origem: { plantaId: '' }, planta_id: 'p2 ' })).toBe('p2');
    expect(plantaDoFormulario(undefined)).toBeNull();
  });
});

describe('textos', () => {
  it('nome da opção escolhida', () => {
    expect(nomeDaOpcao(opcoesDePessoas(pessoas), 'pla-paula')).toBe('Paula Planejadora');
    expect(nomeDaOpcao([], 'x')).toBe('');
  });

  it('texto antigo sem usuário é sinalizado', () => {
    expect(textoSemUsuario('Ailton', null)).toBe('Ailton (sem usuário)');
    expect(textoSemUsuario('Ailton', 'u1')).toBeNull();
    expect(textoSemUsuario('  ', null)).toBeNull();
  });
});
