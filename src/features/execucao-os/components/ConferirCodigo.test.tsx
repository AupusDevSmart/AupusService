import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test-utils';
import { server } from '@/test-mocks/server';
import { ConferirCodigo } from './ConferirCodigo';

/** Conferir o código do PDF da OS (SN-62): a API refaz a conta e diz em que mudou. */
const CODIGO = 'ab12cd34'.repeat(8);
const pedidos: (string | null)[] = [];

const responder = (corpo: Record<string, unknown>, status = 200) =>
  server.use(
    http.get('*/execucao-os/conferencia', ({ request }) => {
      pedidos.push(new URL(request.url).searchParams.get('codigo'));
      return HttpResponse.json(status === 200 ? { success: true, data: corpo } : corpo, { status });
    }),
  );

const resultado = (mudar: Record<string, unknown> = {}) => ({
  os_id: 'OS1 ',
  numero_os: 'OS-2026-0042',
  finalizada_em: '2026-10-17T12:00:00.000Z',
  finalizado_por: 'Gil Gerente',
  confere: true,
  diferencas: [],
  anexos: [],
  conferido_em: '2026-10-17T13:00:00.000Z',
  ...mudar,
});

describe('ConferirCodigo', () => {
  beforeEach(() => {
    pedidos.length = 0;
  });

  it('confere o código colado e mostra a OS', async () => {
    responder(resultado());
    const abrir = vi.fn();
    renderWithProviders(<ConferirCodigo aberto onAbertoChange={vi.fn()} onAbrirOS={abrir} />);
    const usuario = userEvent.setup();

    // Colado, como quem copia do PDF (digitar 66 caracteres estourava o tempo com a suíte em paralelo)
    await usuario.click(screen.getByLabelText(/Código/));
    await usuario.paste(`  ${CODIGO} `);
    await usuario.click(screen.getByRole('button', { name: 'Conferir' }));

    expect(await screen.findByText('Confere')).toBeInTheDocument();
    expect(screen.getByText(/OS-2026-0042, finalizada em 17\/10\/2026, 09:00 \(horário de Brasília\) por Gil Gerente/)).toBeInTheDocument();
    expect(screen.getByText('O registro no sistema é o mesmo da finalização.')).toBeInTheDocument();
    // O código prova o registro, não o arquivo recebido: o PDF registrado fica à mão para comparar
    expect(screen.getByText(/compare o seu PDF com o PDF registrado/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Baixar o PDF registrado' })).toBeInTheDocument();
    expect(pedidos).toEqual([CODIGO]);

    await usuario.click(screen.getByRole('button', { name: 'Abrir a OS' }));
    expect(abrir).toHaveBeenCalledWith('OS1 ');
  });

  it('não confere: diz em que mudou', async () => {
    responder(
      resultado({
        confere: false,
        diferencas: ['checklist e leituras', 'fotos e documentos'],
        anexos: ['painel.jpg: o arquivo é diferente do registrado'],
      }),
    );
    renderWithProviders(<ConferirCodigo aberto onAbertoChange={vi.fn()} codigoInicial={CODIGO} onAbrirOS={vi.fn()} />);

    // Pelo link do PDF: confere ao abrir
    expect(await screen.findByText('Não confere')).toBeInTheDocument();
    expect(screen.getByText('O registro no sistema mudou depois da finalização em: checklist e leituras, fotos e documentos.')).toBeInTheDocument();
    expect(screen.getByText('painel.jpg: o arquivo é diferente do registrado')).toBeInTheDocument();
  });

  it('código não encontrado: a recusa da API aparece no lugar do resultado', async () => {
    responder({ success: false, error: { code: 'NOT_FOUND', message: 'Código não encontrado: confira se foi copiado inteiro (64 letras e números).' } }, 404);
    renderWithProviders(<ConferirCodigo aberto onAbertoChange={vi.fn()} codigoInicial={CODIGO} onAbrirOS={vi.fn()} />);

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Código não encontrado'));
    expect(screen.queryByText('Confere')).toBeNull();
  });
});
