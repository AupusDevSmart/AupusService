import { useState } from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test-utils';
import { server } from '@/test-mocks/server';
import { HorasDaEquipe } from './HorasDaEquipe';
import { linhasIniciais, type LinhaDeHoras } from '@/features/execucao-os/utils/horas-da-equipe';

// Radix e cmdk usam APIs que o jsdom não tem
beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  Element.prototype.scrollIntoView ??= () => {};
});

const consultas: string[] = [];

/** O estado fica no painel; aqui, um dono mínimo que mostra as linhas como o pedido as leva */
function ComEstado({ inicial, gerente = false }: { inicial: LinhaDeHoras[]; gerente?: boolean }) {
  const [linhas, setLinhas] = useState(inicial);
  return (
    <>
      <HorasDaEquipe
        osId="OS1 "
        linhas={linhas}
        onChange={setLinhas}
        tempoEfetivoMinutos={90}
        hhEstimado={4}
        podeInformarValorDaHora={gerente}
      />
      <output data-testid="linhas">{linhas.map((l) => `${l.nome}=${l.horas}${l.extra ? '+' : ''}`).join(';')}</output>
    </>
  );
}

/**
 * Quem entrou na execução sem estar escalado (SN-61): escolhido entre as
 * pessoas que podem atuar na planta da OS, pela rota da OS (o técnico de
 * campo não tem a da programação).
 */
describe('HorasDaEquipe — quem entrou na hora', () => {
  beforeEach(() => {
    consultas.length = 0;
    server.use(
      http.get('*/execucao-os/:id/pessoas', ({ params }) => {
        consultas.push(String(params.id));
        return HttpResponse.json({
          success: true,
          data: {
            equipe: [{ id: 'U1', nome: 'Ana Técnica' }],
            apoio: [{ id: 'U2', nome: 'Paula Planejadora' }],
          },
        });
      }),
    );
  });

  const ana = linhasIniciais([{ id: 'T1', nome: 'Ana Técnica', especialidade: 'Técnico Elétrico', tecnico_id: 'U1' }], 90);

  it('registra quem trabalhou sem estar escalado, começando no tempo efetivo; quem já está na equipe não aparece', async () => {
    renderWithProviders(<ComEstado inicial={ana} />);
    const usuario = userEvent.setup();

    await usuario.click((await screen.findByText('Registrar quem trabalhou sem estar escalado')).closest('button')!);
    expect(screen.queryByRole('option', { name: 'Ana Técnica' })).toBeNull();
    await usuario.click(await screen.findByRole('option', { name: 'Paula Planejadora' }));

    expect(screen.getByTestId('linhas')).toHaveTextContent('Ana Técnica=1.5;Paula Planejadora=1.5+');
    expect(screen.getByText('entrou na execução')).toBeInTheDocument();
    expect(screen.getByText('Total: 3h de 4h previstas')).toBeInTheDocument();
    expect(consultas).toEqual(['OS1']);

    await usuario.click(screen.getByRole('button', { name: 'Tirar' }));
    expect(screen.getByTestId('linhas')).toHaveTextContent(/^Ana Técnica=1.5$/);
  });

  // SN-93 (revisão de segurança): o valor da hora é custo; quem só executa não o informa
  it('o valor da hora de quem entrou só aparece para quem gerencia a OS', async () => {
    const extra = [...ana, { chave: 'U2', tecnicoId: 'U2', nome: 'Paula Planejadora', detalhe: '', horas: 1, extra: true, registradaAntes: false }];
    const { unmount } = renderWithProviders(<ComEstado inicial={extra} />);
    expect(screen.queryByLabelText('Valor da hora de Paula Planejadora')).toBeNull();
    unmount();
    renderWithProviders(<ComEstado inicial={extra} gerente />);
    expect(screen.getByLabelText('Valor da hora de Paula Planejadora')).toBeInTheDocument();
  });

  it('sem a lista de pessoas, avisa em vez de sumir com a opção', async () => {
    server.use(http.get('*/execucao-os/:id/pessoas', () => HttpResponse.json({ message: 'falhou' }, { status: 500 })));
    renderWithProviders(<ComEstado inicial={ana} />);

    expect(await screen.findByText(/Não foi possível carregar as pessoas da planta/)).toBeInTheDocument();
  });
});
