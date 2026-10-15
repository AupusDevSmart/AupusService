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
});
