import { describe, expect, it } from 'vitest';
import {
  avaliacaoDaApi,
  avaliacaoParaApi,
  avaliar,
  criticidadeSugerida,
  difereDaMatriz,
  MATRIZ_DE_CRITICIDADE,
  problemaDaCriticidade,
} from './criticidade-pela-matriz';

/** A matriz que sugere a criticidade (SN-64). A mesma tabela está no teste do backend. */
describe('criticidade pela matriz', () => {
  it('a matriz é a regra decidida: (2 × impacto + probabilidade) ÷ 3, arredondado', () => {
    expect(MATRIZ_DE_CRITICIDADE).toEqual([
      [1, 1, 2, 2, 2],
      [2, 2, 2, 3, 3],
      [2, 3, 3, 3, 4],
      [3, 3, 4, 4, 4],
      [4, 4, 4, 5, 5],
    ]);
    for (let i = 1; i <= 5; i++) {
      for (let p = 1; p <= 5; p++) expect(criticidadeSugerida(i, p)).toBe(Math.round((2 * i + p) / 3));
    }
    expect(criticidadeSugerida(null, 3)).toBeNull();
  });

  it('dar as duas notas aceita a sugestão; mudar o nível depois não é desfeito', () => {
    const comImpacto = avaliar({ criticidade: '3' }, { criticidadeImpacto: 5 });
    expect(comImpacto).toEqual({ criticidade: '3', criticidadeImpacto: 5 });

    const avaliado = avaliar(comImpacto, { criticidadeProbabilidade: 1 });
    expect(avaliado).toMatchObject({ criticidade: '4', criticidadeMotivo: '' });

    const outroNivel = avaliar(avaliado, { criticidade: '5' });
    expect(outroNivel.criticidade).toBe('5');
    expect(difereDaMatriz(outroNivel)).toBe(true);
  });

  it('mexer numa nota não desfaz o nível escolhido fora da matriz, nem o motivo', () => {
    const escolhido = { criticidade: '4', criticidadeImpacto: 3, criticidadeProbabilidade: 3, criticidadeMotivo: 'Alimenta a subestação' };

    expect(avaliar(escolhido, { criticidadeProbabilidade: 2 })).toEqual({ ...escolhido, criticidadeProbabilidade: 2 });
    // Seguindo a matriz, a nota nova puxa o nível
    expect(avaliar({ criticidade: '3', criticidadeImpacto: 3, criticidadeProbabilidade: 3 }, { criticidadeImpacto: 5 })).toMatchObject({
      criticidade: '4',
    });
  });

  it('o que impede salvar: nota sozinha, ou nível diferente sem motivo', () => {
    expect(problemaDaCriticidade({ criticidade: '3', criticidadeImpacto: 3 })).toBe(
      'Informe o impacto e a probabilidade juntos, ou nenhum dos dois.',
    );
    expect(problemaDaCriticidade({ criticidade: '5', criticidadeImpacto: 5, criticidadeProbabilidade: 1, criticidadeMotivo: '  ' })).toBe(
      'A matriz sugere 4 · Alta. Para usar outro nível, informe o motivo.',
    );
    expect(problemaDaCriticidade({ criticidade: '5', criticidadeImpacto: 5, criticidadeProbabilidade: 1, criticidadeMotivo: 'Único' })).toBeNull();
    // Cadastro de antes do SN-64: sem avaliação, o nível vale como está
    expect(problemaDaCriticidade({ criticidade: '2' })).toBeNull();
  });

  it('para a API: o motivo vai só quando o nível difere da matriz', () => {
    expect(avaliacaoParaApi({ criticidade: '5', criticidadeImpacto: 5, criticidadeProbabilidade: 1, criticidadeMotivo: ' Único ' })).toEqual({
      criticidade_impacto: 5,
      criticidade_probabilidade: 1,
      criticidade_motivo: 'Único',
    });
    expect(avaliacaoParaApi({ criticidade: '4', criticidadeImpacto: 5, criticidadeProbabilidade: 1, criticidadeMotivo: 'sobrou' })).toEqual({
      criticidade_impacto: 5,
      criticidade_probabilidade: 1,
      criticidade_motivo: null,
    });
    expect(avaliacaoParaApi({ criticidade: '3' })).toEqual({ criticidade_impacto: null, criticidade_probabilidade: null, criticidade_motivo: null });
  });

  it('da API: o que não é nota vira vazio', () => {
    expect(avaliacaoDaApi({ criticidade_impacto: 4, criticidade_probabilidade: 2, criticidade_motivo: 'x' })).toEqual({
      criticidadeImpacto: 4,
      criticidadeProbabilidade: 2,
      criticidadeMotivo: 'x',
    });
    expect(avaliacaoDaApi({})).toEqual({ criticidadeImpacto: null, criticidadeProbabilidade: null, criticidadeMotivo: null });
  });
});
