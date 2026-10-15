import { describe, expect, it } from 'vitest';
import { transformApiToFrontend } from './useEquipamentos';

/**
 * A automação e os pontos da UC passam pelo transform (SN-36). Antes não
 * passavam: o sheet abria com a automação desligada e sem pontos, e todo
 * salvar mandava `automacao: false` e `pontos: []` — o backend desligava a
 * automação e apagava os pontos de uma UC que só teve o nome corrigido.
 */
describe('transformApiToFrontend: automação e pontos', () => {
  const pontos = [
    { id: 'p1', nome: 'Corrente', tag: 'I' },
    { id: 'p2', nome: 'Tensão', tag: 'V' },
  ];
  const daApi = (extra: Record<string, unknown>) =>
    ({ id: 'eq-1 ', nome: 'Disjuntor 3', classificacao: 'UC', criticidade: '3', ...extra }) as never;

  it('a UC com automação chega ao sheet com a automação ligada e os pontos', () => {
    const equipamento = transformApiToFrontend(daApi({ automacao: true, equipamento_pontos: pontos }));

    expect(equipamento.automacao).toBe(true);
    expect(equipamento.equipamento_pontos).toEqual(pontos);
  });

  it('a UC sem automação continua sem', () => {
    const equipamento = transformApiToFrontend(daApi({ automacao: false, equipamento_pontos: [] }));

    expect(equipamento.automacao).toBe(false);
    expect(equipamento.equipamento_pontos).toEqual([]);
  });
});
