import { describe, expect, it } from 'vitest';
import { payloadDoComponente } from '@/core/features/equipamentos/utils/payload-do-componente';

/**
 * O que o sheet do componente (UAR) manda para a API (SN-12). Ele mandava
 * `planta_id` e `proprietario_id`, que o CreateEquipamentoDto não aceita:
 * com o pai numa planta, criar o componente dava 400 (forbidNonWhitelisted).
 * O componente herda a planta do UC pela unidade, no backend.
 */
describe('payloadDoComponente', () => {
  const formulario = {
    nome: 'Ventoinha',
    criticidade: '3' as const,
    equipamentoPaiId: 'uc1',
    unidadeId: 'u1',
    plantaId: 'p1',
    proprietarioId: 'dono1',
    tipoComponente: 'VENT',
    valorImobilizado: '1500.5',
    dataInstalacao: '2026-10-01',
  };

  it('não manda planta_id nem proprietario_id', () => {
    const payload = payloadDoComponente(formulario, 'tipo1', []);

    expect(payload).not.toHaveProperty('planta_id');
    expect(payload).not.toHaveProperty('proprietario_id');
  });

  it('o componente leva o pai, a unidade do pai e o tipo', () => {
    expect(payloadDoComponente(formulario, 'tipo1', [])).toMatchObject({
      nome: 'Ventoinha',
      classificacao: 'UAR',
      equipamento_pai_id: 'uc1',
      unidade_id: 'u1',
      tipo_equipamento: 'VENT',
      tipo_equipamento_id: 'tipo1',
      valor_imobilizado: 1500.5,
      data_instalacao: '2026-10-01T00:00:00.000Z',
    });
  });

  // SN-64: o motivo só vai quando o nível difere da matriz
  it('leva a avaliação pela matriz', () => {
    expect(
      payloadDoComponente({ ...formulario, criticidade: '5', criticidadeImpacto: 5, criticidadeProbabilidade: 1, criticidadeMotivo: ' Único ' }, 'tipo1', []),
    ).toMatchObject({ criticidade: '5', criticidade_impacto: 5, criticidade_probabilidade: 1, criticidade_motivo: 'Único' });
    expect(payloadDoComponente(formulario, 'tipo1', [])).toMatchObject({
      criticidade_impacto: null,
      criticidade_probabilidade: null,
      criticidade_motivo: null,
    });
  });

  // SN-66: undefined era "não mexe", e a data apagada na tela continuava gravada
  it('garantia e centro de custo vão; o que foi apagado vai null', () => {
    expect(payloadDoComponente({ ...formulario, garantiaAte: '2028-10-01', centroCusto: ' CC-1 ' }, 'tipo1', [])).toMatchObject({
      garantia_ate: '2028-10-01T00:00:00.000Z',
      centro_custo: 'CC-1',
    });
    expect(payloadDoComponente({ ...formulario, dataInstalacao: '', garantiaAte: '', fornecedor: '  ', centroCusto: '' }, 'tipo1', [])).toMatchObject({
      data_instalacao: null,
      garantia_ate: null,
      fornecedor: null,
      centro_custo: null,
    });
  });
});
