import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '@/test-mocks/server';
import { planosManutencaoApi } from './planos-manutencao.services';

/** SN-53: a data de início vai junto do vínculo, e a vazia não some (a API recusa). */
describe('planosManutencaoApi.vincular', () => {
  const corpos: unknown[] = [];
  const responder = () =>
    server.use(
      http.post('*/planos-manutencao/vincular', async ({ request }) => {
        corpos.push(await request.json());
        return HttpResponse.json({ success: true, data: { plano_id: 'P', tarefas_copiadas: 1, substituiu_vinculo_anterior: false, tarefas_proprias_descartadas: 0, tarefas_customizadas_descartadas: 0 } });
      }),
    );

  it('manda a data de início, e a vazia como veio (omitir faria o vínculo contar de agora)', async () => {
    responder();

    await planosManutencaoApi.vincular({ equipamento_id: 'EQ ', plano_id: 'PL ', data_inicio: '2026-05-10' });
    await planosManutencaoApi.vincular({ equipamento_id: 'EQ', plano_id: 'PL', data_inicio: '' });
    await planosManutencaoApi.vincular({ equipamento_id: 'EQ', plano_id: 'PL' });

    expect(corpos).toEqual([
      { equipamento_id: 'EQ', plano_id: 'PL', data_inicio: '2026-05-10' },
      { equipamento_id: 'EQ', plano_id: 'PL', data_inicio: '' },
      { equipamento_id: 'EQ', plano_id: 'PL' },
    ]);
  });
});
