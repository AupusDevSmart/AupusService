import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test-utils';
import { server } from '@/test-mocks/server';
import type { CalendarioDaAgenda, EventoDaAgenda } from '@/services/eventos-da-agenda.services';
import { CalendarioPage } from './CalendarioPage';

// Radix e cmdk usam APIs que o ambiente de teste não tem
beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  Element.prototype.scrollIntoView ??= () => {};
});

const evento = (dados: Partial<EventoDaAgenda> = {}): EventoDaAgenda => ({
  id: 'os:OS1',
  origem: 'os',
  data: '2026-11-10T13:00:00.000Z',
  titulo: 'OS 2026-001',
  descricao: 'Limpeza dos módulos',
  situacao: 'programado',
  motivo: null,
  status: 'PENDENTE',
  tipo: 'PREVENTIVA',
  prioridade: 'MEDIA',
  planta_id: 'P1',
  planta_nome: 'Usina Norte',
  instalacoes: ['UFV 1'],
  link: '/execucao-os?execucaoId=OS1',
  previsao: null,
  ...dados,
});

const RODADA = '2026-09-15T06:00:00.000Z';
const previsto = evento({
  id: 'previsao:T1:1',
  origem: 'previsao',
  data: '2026-11-16T13:00:00.000Z',
  titulo: 'Inspeção termográfica',
  descricao: 'Inversor 3',
  situacao: 'previsto',
  status: 'previsto',
  prioridade: null,
  link: null,
  previsao: {
    tarefa_tag: 'TRF-9',
    tarefa_nome: 'Inspeção termográfica',
    frequencia: 'TRIMESTRAL',
    equipamento_nome: 'Inversor 3',
    ciclo: '2026-11-14T13:00:00.000Z',
    programacao_a_partir_de: RODADA,
    data_estimada: true,
  },
});

let pedidos: URLSearchParams[] = [];
const ultimo = () => pedidos[pedidos.length - 1];

const responder = (calendario: Partial<CalendarioDaAgenda> = {}, status = 200) =>
  server.use(
    http.get('*/agenda/eventos', ({ request }) => {
      pedidos.push(new URL(request.url).searchParams);
      if (status !== 200) return HttpResponse.json({ success: false, error: { message: 'falhou' } }, { status });
      return HttpResponse.json({
        success: true,
        data: { eventos: [evento(), previsto], atrasados_antes: 0, sem_data: 0, opcoes: { plantas: [{ id: 'P1', nome: 'Usina Norte' }] }, ...calendario },
      });
    }),
  );

const abrir = (rota = '/agenda/calendario?data=2026-11-10') => renderWithProviders(<CalendarioPage />, { initialRoute: rota });
const doDia = (dia: string) => document.querySelector<HTMLElement>(`[data-dia="${dia}"]`)!;

/** O calendário de manutenção (SN-52): programações, OS e a previsão do gerador. */
describe('CalendarioPage', () => {
  beforeEach(() => {
    pedidos = [];
    responder();
  });

  it('pede o mês em semanas inteiras e desenha cada evento no seu dia; a OS abre a página dela', async () => {
    abrir();

    const chip = await within(await waitFor(() => doDia('2026-11-10'))).findByText('Limpeza dos módulos');
    expect(chip.closest('a')).toHaveAttribute('href', '/execucao-os?execucaoId=OS1');
    expect(within(doDia('2026-11-16')).getByText('Inspeção termográfica')).toBeInTheDocument();
    // Novembro de 2026 começa num domingo; dezembro termina a semana no sábado 5
    expect(ultimo().get('inicio')).toBe('2026-11-01');
    expect(ultimo().get('fim')).toBe('2026-12-05');
  });

  it('a previsão mostra a tarefa, quando vence e quando o gerador a programa', async () => {
    const usuario = userEvent.setup();
    abrir();

    await usuario.click(await within(await waitFor(() => doDia('2026-11-16'))).findByText('Inspeção termográfica'));

    expect(await screen.findByText('TRF-9')).toBeInTheDocument();
    expect(screen.getByText('Trimestral')).toBeInTheDocument();
    expect(screen.getByText('14/11/2026')).toBeInTheDocument();
    // A rodada do gerador é às 3h de Brasília (06:00 UTC), em qualquer fuso do aparelho
    expect(screen.getByText(/criada em 15\/09\/2026 às 03:00/)).toBeInTheDocument();
    expect(screen.getByText(/A data é estimada/)).toBeInTheDocument();
  });

  it('avisa o que venceu antes do período e o que não tem data', async () => {
    responder({ atrasados_antes: 3, sem_data: 1 });
    abrir();

    expect(await screen.findByText(/3 pendências venceram antes deste período/)).toBeInTheDocument();
    expect(screen.getByText(/1 programação ou OS em aberto não tem data marcada/)).toBeInTheDocument();
  });

  it('a lista pede só o mês e agrupa por dia', async () => {
    const usuario = userEvent.setup();
    abrir();
    await screen.findAllByText('Limpeza dos módulos');

    await usuario.click(screen.getByRole('tab', { name: 'Lista' }));

    await waitFor(() => expect(ultimo().get('fim')).toBe('2026-11-30'));
    expect(ultimo().get('inicio')).toBe('2026-11-01');
    expect(await screen.findByRole('heading', { name: /terça-feira, 10 de novembro/i })).toBeInTheDocument();
    expect(screen.getByText('OS 2026-001 · Limpeza dos módulos')).toBeInTheDocument();
  });

  it('avança para o mês seguinte', async () => {
    const usuario = userEvent.setup();
    abrir();
    await screen.findAllByText('Limpeza dos módulos');

    await usuario.click(screen.getByRole('button', { name: 'Próximo mês' }));

    // Dezembro de 2026 começa numa terça: a grade vai de 29/11 a 02/01
    await waitFor(() => expect(ultimo().get('inicio')).toBe('2026-11-29'));
    expect(ultimo().get('fim')).toBe('2027-01-02');
  });

  it('planta da URL que a pessoa não enxerga não aparece como "todas"', async () => {
    abrir('/agenda/calendario?data=2026-11-10&planta=OUTRA');

    expect(await screen.findByText('Planta indisponível')).toBeInTheDocument();
  });

  it('os filtros (guardados na URL) vão na consulta, e limpar tira todos', async () => {
    const usuario = userEvent.setup();
    abrir('/agenda/calendario?data=2026-11-10&planta=P1&tipo=CORRETIVA');

    await waitFor(() => expect(pedidos.length).toBeGreaterThan(0));
    expect(ultimo().get('planta_id')).toBe('P1');
    expect(ultimo().get('tipo')).toBe('CORRETIVA');

    await usuario.click(await screen.findByRole('button', { name: /Limpar filtros/ }));

    await waitFor(() => expect(ultimo().get('planta_id')).toBeNull());
    expect(ultimo().get('tipo')).toBeNull();
  });

  it('falha ao carregar: diz o motivo e deixa tentar de novo', async () => {
    responder({}, 500);
    const usuario = userEvent.setup();
    abrir();

    expect(await screen.findByText('Não foi possível carregar o calendário.')).toBeInTheDocument();
    expect(screen.getByText('falhou')).toBeInTheDocument();
    responder();
    await usuario.click(screen.getByRole('button', { name: 'Tentar de novo' }));

    expect(await screen.findAllByText('Limpeza dos módulos')).not.toHaveLength(0);
  });
});
