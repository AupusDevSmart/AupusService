import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { server } from '@/test-mocks/server';
import type { AnomaliaFormData } from '@/features/anomalias/types';
import { anomaliasService } from './anomalias.service';

/**
 * O prazo da anomalia (SN-74): o formulário tinha o campo e o service nunca o
 * mandava — nenhuma anomalia do dev tinha prazo. Vai como ISO com o fuso
 * (a API exige), e apagar o campo manda null.
 */
describe('anomaliasService: prazo', () => {
  const corpos: Record<string, unknown>[] = [];
  beforeEach(() => {
    corpos.length = 0;
    const responder = async ({ request }: { request: Request }) => {
      corpos.push((await request.json()) as Record<string, unknown>);
      return HttpResponse.json({ success: true, data: { id: 'a1' } });
    };
    server.use(http.post('*/anomalias', responder), http.patch('*/anomalias/:id', responder));
  });

  const formulario = (prazo?: string | null): AnomaliaFormData => ({
    descricao: 'Vazamento',
    local: 'UFV',
    ativo: 'Inversor 1',
    condicao: 'FUNCIONANDO',
    origem: 'OPERADOR',
    prioridade: 'ALTA',
    localizacao: { equipamentoId: 'e1', local: 'UFV', ativo: 'Inversor 1' },
    ...(prazo !== undefined && { prazo }),
  }) as AnomaliaFormData;

  it('criar manda o prazo digitado com o fuso; sem prazo, não manda o campo', async () => {
    await anomaliasService.create(formulario('2026-10-20T18:00'));
    await anomaliasService.create(formulario(''));

    expect(corpos[0].prazo).toBe('2026-10-20T21:00:00.000Z');
    expect(corpos[1]).not.toHaveProperty('prazo');
  });

  it('editar: trocar manda o novo, apagar manda null, e o que não veio fica de fora', async () => {
    await anomaliasService.update('a1', formulario('2026-10-22T08:30'));
    await anomaliasService.update('a1', formulario(''));
    await anomaliasService.update('a1', { descricao: 'Só a descrição' });

    expect(corpos[0].prazo).toBe('2026-10-22T11:30:00.000Z');
    expect(corpos[1].prazo).toBeNull();
    expect(corpos[2]).not.toHaveProperty('prazo');
  });
});
