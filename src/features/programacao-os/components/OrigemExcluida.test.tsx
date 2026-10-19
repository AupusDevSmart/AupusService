import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * A origem da OS é contexto (instruções e prazo da anomalia ou da solicitação).
 * Cancelar a programação devolve a origem, que então pode ser excluída; abrir a
 * OS cancelada dava o toast "Erro NOT_FOUND — Anomalia não encontrada". A busca
 * vai sem o aviso global e a seção some.
 */
const anomalia = vi.fn();
const solicitacao = vi.fn();
vi.mock('@/services/anomalias.service', () => ({ anomaliasService: { findOne: (...a: unknown[]) => anomalia(...a) } }));
vi.mock('@/services/solicitacoes-servico.service', () => ({
  solicitacoesServicoService: { findOne: (...a: unknown[]) => solicitacao(...a) },
}));

const { InstrucoesDaOrigem } = await import('./InstrucoesDaOrigem');
const { PrazoDaOrigem } = await import('./PrazoDaOrigem');

const naoEncontrada = Object.assign(new Error('Request failed with status code 404'), { response: { status: 404 } });

beforeEach(() => {
  anomalia.mockReset().mockRejectedValue(naoEncontrada);
  solicitacao.mockReset().mockRejectedValue(naoEncontrada);
});

describe('origem excluída', () => {
  it('instruções da anomalia: busca sem aviso global, e a seção some', async () => {
    const { container } = render(<InstrucoesDaOrigem tipo="ANOMALIA" anomaliaId=" an1 " />);
    await waitFor(() => expect(anomalia).toHaveBeenCalledWith('an1', { semAvisoGlobal: true }));
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it('prazo da solicitação: idem', async () => {
    const { container } = render(<PrazoDaOrigem tipo="SOLICITACAO_SERVICO" solicitacaoId="ss1" />);
    await waitFor(() => expect(solicitacao).toHaveBeenCalledWith('ss1', { semAvisoGlobal: true }));
    expect(container).toBeEmptyDOMElement();
  });
});
