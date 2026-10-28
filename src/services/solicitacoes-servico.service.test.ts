import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { server } from '@/test-mocks/server';
import type { SolicitacaoServicoFormData } from '@/features/solicitacoes-servico/types';
import { solicitacoesServicoService } from './solicitacoes-servico.service';

/**
 * O que o cadastro e a edição da solicitação mandam à API.
 *
 * - Sem instrução vinculada, o BaseModal semeia o campo custom com '' e o
 *   cadastro mandava `instrucoes_ids: ""`: a API recusava (400, "deve ser uma
 *   lista") e a solicitação não se cadastrava.
 * - A edição não mandava planta, instalação nem local: trocar o lugar e salvar
 *   não gravava nada, sem aviso.
 * - Planta e instalação são opcionais (quem cadastra muitas solicitações não
 *   quer criar planta para as que não viram OS); o cliente em texto as substitui.
 */
describe('solicitacoesServicoService: cadastro e edição', () => {
  const corpos: Record<string, unknown>[] = [];
  beforeEach(() => {
    corpos.length = 0;
    const responder = async ({ request }: { request: Request }) => {
      corpos.push((await request.json()) as Record<string, unknown>);
      return HttpResponse.json({ success: true, data: { id: 's1' } });
    };
    server.use(http.post('*/solicitacoes-servico', responder), http.patch('*/solicitacoes-servico/:id', responder));
  });

  const formulario = (campos: Partial<SolicitacaoServicoFormData> & Record<string, unknown> = {}) =>
    ({
      titulo: 'Troca do disjuntor',
      descricao: 'Disjuntor geral desarmando',
      tipo: 'MANUTENCAO_CORRETIVA',
      prioridade: 'MEDIA',
      solicitante_nome: '',
      ...campos,
    }) as SolicitacaoServicoFormData;

  it('cadastrar sem instrução manda uma lista vazia, nunca o texto vazio', async () => {
    await solicitacoesServicoService.create(formulario({ planta_id: 'p1', instrucoes_ids: '' as unknown as string[] }));
    expect(corpos[0].instrucoes_ids).toEqual([]);
  });

  it('cadastrar com instruções manda os ids aparados', async () => {
    await solicitacoesServicoService.create(formulario({ instrucoes_ids: [' i1 ', 'i2'] }));
    expect(corpos[0].instrucoes_ids).toEqual(['i1', 'i2']);
  });

  it('cadastrar sem planta e sem instalação vai, com o cliente em texto', async () => {
    await solicitacoesServicoService.create(formulario({ planta_id: '', unidade_id: '', cliente_nome: '  Padaria do Zé ' }));
    expect(corpos[0]).not.toHaveProperty('planta_id');
    expect(corpos[0]).not.toHaveProperty('unidade_id');
    expect(corpos[0].cliente_nome).toBe('Padaria do Zé');
  });

  it('cadastrar não manda campo que a API não aceita (seria 400)', async () => {
    await solicitacoesServicoService.create(
      formulario({ local_especifico: 'x', requisitos_especiais: 'y', prazo_esperado: 3, solicitante_email: 'a@b.c' }),
    );
    for (const campo of ['local_especifico', 'requisitos_especiais', 'prazo_esperado', 'solicitante_email', 'solicitante_nome']) {
      expect(corpos[0]).not.toHaveProperty(campo);
    }
  });

  it('editar manda o lugar: planta, instalação, local e cliente', async () => {
    await solicitacoesServicoService.update(
      's1',
      formulario({ planta_id: 'p2', unidade_id: 'u2', proprietario_id: 'd2', local: 'Galpão 3', cliente_nome: 'Padaria' }),
    );
    expect(corpos[0]).toMatchObject({ planta_id: 'p2', unidade_id: 'u2', proprietario_id: 'd2', local: 'Galpão 3', cliente_nome: 'Padaria' });
  });

  it('editar: apagar a instalação ou a planta manda null; o que não veio fica de fora', async () => {
    await solicitacoesServicoService.update('s1', formulario({ planta_id: 'p2', unidade_id: '' }));
    await solicitacoesServicoService.update('s1', formulario({ planta_id: '', unidade_id: '', cliente_nome: '' }));
    await solicitacoesServicoService.update('s1', { titulo: 'Só o título' });

    expect(corpos[0]).toMatchObject({ planta_id: 'p2', unidade_id: null });
    expect(corpos[1]).toMatchObject({ planta_id: null, unidade_id: null, cliente_nome: null });
    for (const campo of ['planta_id', 'unidade_id', 'local', 'cliente_nome', 'instrucoes_ids']) {
      expect(corpos[2]).not.toHaveProperty(campo);
    }
  });
});
