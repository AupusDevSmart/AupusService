import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VeiculoSelector } from './VeiculoSelector';
import { VeiculosService } from '@/services/veiculos.services';

/**
 * O seletor mostra a ocupação calculada no servidor
 * (docs/SPEC-RESERVAS-DE-VIATURA.md). Antes ele baixava 10 reservas e montava
 * `new Date("2026-10-05T00:00:00.000ZT08:00")` — data inválida —, então toda
 * viatura aparecia livre.
 */
vi.mock('@/services/veiculos.services', () => ({
  VeiculosService: { getDisponibilidade: vi.fn() },
}));

const getDisponibilidade = vi.mocked(VeiculosService.getDisponibilidade);

const viatura = (id: string, placa: string, disponivel: boolean, motivo: string | null = null) => ({
  id,
  nome: `Viatura ${placa}`,
  placa,
  marca: 'Fiat',
  modelo: 'Ducato',
  tipo: 'van',
  tipo_combustivel: 'diesel',
  status: 'disponivel',
  capacidade_passageiros: 3,
  capacidade_carga: 0,
  quilometragem: 1000,
  disponivel,
  motivo,
});

describe('VeiculoSelector', () => {
  beforeEach(() => {
    getDisponibilidade.mockReset();
  });

  it('pergunta ao servidor pela janela e marca a ocupada com o motivo', async () => {
    getDisponibilidade.mockResolvedValue([
      viatura('V1', 'AAA1A11', true),
      viatura('V2', 'BBB2B22', false, 'Reservada de 10/03 08:00 a 10/03 12:00 (Programação PRG-1)'),
    ]);

    render(
      <VeiculoSelector
        filtrosDisponibilidade={{ dataInicio: '2027-03-10', dataFim: '2027-03-10', horaInicio: '09:00', horaFim: '10:00', excluirReservaId: 'R1' }}
        onVeiculoChange={vi.fn()}
      />,
    );

    expect(await screen.findByText(/Reservada de 10\/03 08:00/)).toBeInTheDocument();
    expect(getDisponibilidade).toHaveBeenCalledWith({
      dataInicio: '2027-03-10',
      dataFim: '2027-03-10',
      horaInicio: '09:00',
      horaFim: '10:00',
      excluirReservaId: 'R1',
    });
    expect(screen.getByRole('button', { name: /BBB2B22/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /AAA1A11/ })).toBeEnabled();
    expect(screen.getByText('1 livres')).toBeInTheDocument();
  });

  it('sem datas, não consulta e pede as datas', () => {
    render(<VeiculoSelector filtrosDisponibilidade={{ dataInicio: '', dataFim: '' }} onVeiculoChange={vi.fn()} />);

    expect(getDisponibilidade).not.toHaveBeenCalled();
    expect(screen.getByText(/Selecione as datas/)).toBeInTheDocument();
  });

  it('com a viatura já escolhida, mostra o resumo dela', async () => {
    getDisponibilidade.mockResolvedValue([viatura('V1', 'AAA1A11', true)]);

    render(
      <VeiculoSelector
        filtrosDisponibilidade={{ dataInicio: '2027-03-10', dataFim: '2027-03-10' }}
        veiculoSelecionado="V1"
        onVeiculoChange={vi.fn()}
      />,
    );

    await waitFor(() => expect(screen.getByText('Viatura AAA1A11')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /Trocar/ })).toBeInTheDocument();
  });

  it('a viatura escolhida que ficou ocupada no horário novo avisa no resumo', async () => {
    getDisponibilidade.mockResolvedValue([viatura('V1', 'AAA1A11', false, 'Reservada de 10/03 08:00 a 10/03 12:00 (Outra)')]);

    render(
      <VeiculoSelector
        filtrosDisponibilidade={{ dataInicio: '2027-03-10', dataFim: '2027-03-10' }}
        veiculoSelecionado="V1"
        onVeiculoChange={vi.fn()}
      />,
    );

    expect(await screen.findByText(/Ocupada neste horário: Reservada de 10\/03 08:00/)).toBeInTheDocument();
  });
});
