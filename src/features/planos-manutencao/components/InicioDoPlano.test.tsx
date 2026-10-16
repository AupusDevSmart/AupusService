import { fireEvent, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test-utils';
import { server } from '@/test-mocks/server';
import type { PrimeirosVencimentos } from '@/services/planos-manutencao.services';
import { InicioDoPlano } from './InicioDoPlano';

let pedidos: URL[] = [];

const responder = (dados: Partial<PrimeirosVencimentos> = {}, status = 200) =>
  server.use(
    http.get('*/planos-manutencao/:id/primeiros-vencimentos', ({ request }) => {
      pedidos.push(new URL(request.url));
      if (status !== 200) return HttpResponse.json({ success: false, error: { message: 'A data de início vai de até 5 anos atrás a até 1 ano à frente' } }, { status });
      return HttpResponse.json({
        success: true,
        data: {
          ancora: '2026-05-10T03:00:00.000Z',
          com_planta: true,
          tarefas: [
            // 13:00 UTC = 10:00 em Brasília: o dia é o mesmo em qualquer fuso do teste
            { tarefa_id: 'T1', tag: 'TRF-1', nome: 'Troca de óleo', frequencia: 'SEMESTRAL', frequencia_personalizada: null, vence_em: '2026-11-06T13:00:00.000Z', atrasada: false, data_programada: null, programacao_a_partir_de: null },
            { tarefa_id: 'T2', tag: 'TRF-2', nome: 'Limpeza', frequencia: 'MENSAL', frequencia_personalizada: null, vence_em: '2026-06-09T13:00:00.000Z', atrasada: true, data_programada: null, programacao_a_partir_de: null },
            { tarefa_id: 'T3', tag: 'TRF-3', nome: 'Inspeção', frequencia: null, frequencia_personalizada: null, vence_em: null, atrasada: false, data_programada: null, programacao_a_partir_de: null },
          ],
          ...dados,
        },
      });
    }),
  );

const montar = (props: Partial<Parameters<typeof InicioDoPlano>[0]> = {}) =>
  renderWithProviders(<InicioDoPlano planoId="PLANO1 " equipamentoId="EQ1 " dataInicio="2026-05-10" onDataInicio={vi.fn()} {...props} />, { withRouter: false });

/** SN-53: a data em que o plano começa a contar, e o primeiro vencimento antes de vincular. */
describe('InicioDoPlano', () => {
  beforeEach(() => {
    pedidos = [];
    responder();
  });

  it('mostra o primeiro vencimento de cada tarefa, o vencido e o sem prazo, pela data pedida', async () => {
    montar();

    expect(await screen.findByText('vence em 06/11/2026')).toBeInTheDocument();
    expect(screen.getByText(/venceu em 09\/06\/2026: sai na primeira rodada do gerador/)).toBeInTheDocument();
    expect(screen.getByText(/sem prazo/)).toBeInTheDocument();
    expect(pedidos[0].pathname).toMatch(/\/planos-manutencao\/PLANO1\/primeiros-vencimentos$/);
    expect(pedidos[0].searchParams.get('data_inicio')).toBe('2026-05-10');
    expect(pedidos[0].searchParams.get('equipamento_id')).toBe('EQ1');
  });

  it('no cadastro (sem equipamento) não manda equipamento', async () => {
    montar({ equipamentoId: undefined });

    await screen.findByText('vence em 06/11/2026');
    expect(pedidos[0].searchParams.has('equipamento_id')).toBe(false);
  });

  it('avisa quando o equipamento não tem planta, e a vencida não promete a rodada do gerador', async () => {
    responder({ com_planta: false });
    montar();

    expect(await screen.findByText(/não está em nenhuma planta/)).toBeInTheDocument();
    expect(screen.getByText('venceu em 09/06/2026')).toBeInTheDocument();
    expect(screen.queryByText(/sai na primeira rodada/)).not.toBeInTheDocument();
  });

  // O campo de data devolve vazio ao apagar um trecho: antes o vínculo contava de agora, calado
  it('data apagada pede a data e não calcula nada', () => {
    montar({ dataInicio: '' });

    expect(screen.getByText('Informe a data de início.')).toBeInTheDocument();
    expect(pedidos).toEqual([]);
  });

  it('trocar a data avisa quem guarda', () => {
    const mudou = vi.fn();
    montar({ onDataInicio: mudou });

    fireEvent.change(screen.getByLabelText('Começa a contar em'), { target: { value: '2026-04-01' } });

    expect(mudou).toHaveBeenCalledWith('2026-04-01');
  });

  it('a data recusada mostra o motivo no próprio painel', async () => {
    responder({}, 400);
    montar({ dataInicio: '2019-01-01' });

    expect(await screen.findByText(/vai de até 5 anos atrás/)).toBeInTheDocument();
  });
});
