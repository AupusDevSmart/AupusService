import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentesUARExpandedRow } from '@/core/features/equipamentos/components/ComponentesUARExpandedRow';
import type { Equipamento } from '@/core/features/equipamentos/types';

// O avatar le a URL base da API do contexto do app, que nao e o assunto aqui
vi.mock('@/core/features/equipamentos/components/EquipamentoAvatar', () => ({
  EquipamentoAvatar: () => null,
}));

/**
 * O dropdown de UARs da lista de equipamentos. A lista passou a ser so de UCs,
 * entao esta linha e o unico lugar da tela onde o componente aparece: ela tem
 * de manter as acoes que a linha propria dele tinha (ver, editar, duplicar,
 * excluir, compartilhar) e nunca confundir "falhou" com "nao tem componente".
 */
const uar = (id: string, nome: string, extra: Partial<Equipamento> = {}): Equipamento => ({
  id,
  nome,
  classificacao: 'UAR',
  criticidade: '3',
  status: 'Ativo',
  ...extra,
});

const acoes = () => ({
  onVisualizar: vi.fn(),
  onEditar: vi.fn(),
  onDuplicar: vi.fn(),
  onExcluir: vi.fn(),
});

describe('ComponentesUARExpandedRow', () => {
  it('mostra um componente por linha, com tag e fabricante', () => {
    render(
      <ComponentesUARExpandedRow
        componentes={[
          uar('a', 'Ventilador', { tag: 'VT-01', fabricante: 'WEG' }),
          uar('b', 'Sensor de temperatura'),
        ]}
        {...acoes()}
      />,
    );

    expect(screen.getByText('Ventilador')).toBeInTheDocument();
    expect(screen.getByText('Sensor de temperatura')).toBeInTheDocument();
    expect(screen.getByText('VT-01')).toBeInTheDocument();
    expect(screen.getByText('WEG')).toBeInTheDocument();
  });

  it('cada botao age sobre o componente da propria linha', async () => {
    const handlers = acoes();
    const ventilador = uar('a', 'Ventilador');
    const sensor = uar('b', 'Sensor');
    render(<ComponentesUARExpandedRow componentes={[ventilador, sensor]} {...handlers} />);

    await userEvent.click(screen.getAllByTitle('Visualizar')[1]);
    await userEvent.click(screen.getAllByTitle('Editar')[0]);
    await userEvent.click(screen.getAllByTitle('Duplicar')[1]);
    await userEvent.click(screen.getAllByTitle('Excluir')[0]);

    expect(handlers.onVisualizar).toHaveBeenCalledWith(sensor);
    expect(handlers.onEditar).toHaveBeenCalledWith(ventilador);
    expect(handlers.onDuplicar).toHaveBeenCalledWith(sensor);
    expect(handlers.onExcluir).toHaveBeenCalledWith(ventilador);
  });

  it('somente leitura deixa so o visualizar', () => {
    render(
      <ComponentesUARExpandedRow
        componentes={[uar('a', 'Ventilador')]}
        somenteLeitura
        {...acoes()}
        onCompartilhar={vi.fn()}
        onPararDeCompartilhar={vi.fn()}
      />,
    );

    expect(screen.getByTitle('Visualizar')).toBeInTheDocument();
    expect(screen.queryByTitle('Editar')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Duplicar')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Excluir')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Compartilhar com o outro produto')).not.toBeInTheDocument();
  });

  it('compartilhar e parar de compartilhar seguem o estado de cada componente', async () => {
    const onCompartilhar = vi.fn();
    const onPararDeCompartilhar = vi.fn();
    const livre = uar('a', 'Livre');
    const dividido = uar('b', 'Dividido');
    render(
      <ComponentesUARExpandedRow
        componentes={[livre, dividido]}
        {...acoes()}
        estaCompartilhado={(c) => c.id === 'b'}
        onCompartilhar={onCompartilhar}
        onPararDeCompartilhar={onPararDeCompartilhar}
      />,
    );

    await userEvent.click(screen.getByTitle('Compartilhar com o outro produto'));
    await userEvent.click(screen.getByTitle('Parar de compartilhar'));

    expect(onCompartilhar).toHaveBeenCalledWith(livre);
    expect(onPararDeCompartilhar).toHaveBeenCalledWith(dividido);
  });

  it('carregando nao diz que esta vazio', () => {
    render(<ComponentesUARExpandedRow componentes={[]} carregando {...acoes()} />);

    expect(screen.getByText(/carregando componentes/i)).toBeInTheDocument();
    expect(screen.queryByText(/nenhum componente/i)).not.toBeInTheDocument();
  });

  it('falha de carga oferece tentar de novo e nao diz que esta vazio', async () => {
    const onTentarNovamente = vi.fn();
    render(
      <ComponentesUARExpandedRow
        componentes={[]}
        falhou
        onTentarNovamente={onTentarNovamente}
        {...acoes()}
      />,
    );

    expect(screen.queryByText(/nenhum componente/i)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /tentar novamente/i }));

    expect(onTentarNovamente).toHaveBeenCalled();
  });

  it('sem componentes diz que nao ha', () => {
    render(<ComponentesUARExpandedRow componentes={[]} {...acoes()} />);

    expect(screen.getByText(/nenhum componente neste equipamento/i)).toBeInTheDocument();
  });

  it('avisa quando o UC tem mais componentes do que a linha mostra', () => {
    render(
      <ComponentesUARExpandedRow
        componentes={[uar('a', 'Ventilador')]}
        total={130}
        {...acoes()}
      />,
    );

    expect(screen.getByText(/mostrando 1 de 130 componentes/i)).toBeInTheDocument();
  });
});
