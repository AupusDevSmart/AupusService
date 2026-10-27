import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useUserStore } from '@/store/useUserStore';
import { TecnicosCardManager, type TecnicoItem } from './TecnicosCardManager';

/**
 * A equipe da programação (SN-58 no cartão): as horas e o valor da hora eram
 * type="number", que perdia a vírgula e mostrava "64" no lugar de "64,00". As
 * horas agora se escrevem como na execução ("3h30", "45min" ou "3,5").
 */
const ana: TecnicoItem = { id: 'T1', nome: 'Ana Souza', especialidade: 'Eletricista', horas_estimadas: 1.5, custo_hora: 64, custo_total: 96 };

// Quem vê custo: o planejador (o cliente não, SERV-10)
beforeEach(() => useUserStore.setState({ acessivel: ['execucao_os.manage'] }));

describe('TecnicosCardManager', () => {
  it('horas como 1h30 e o valor da hora com 2 casas', () => {
    render(<TecnicosCardManager value={[ana]} onChange={vi.fn()} showCustos />);
    expect(screen.getByLabelText('Horas estimadas de Ana Souza')).toHaveValue('1h30');
    expect(screen.getByLabelText('Valor da hora de Ana Souza')).toHaveValue('64,00');
  });

  it('"3h30" vira 3,5 h; "62,50" vira R$ 62,50/h', () => {
    const onChange = vi.fn();
    render(<TecnicosCardManager value={[ana]} onChange={onChange} showCustos />);
    const horas = screen.getByLabelText('Horas estimadas de Ana Souza');
    fireEvent.change(horas, { target: { value: '3h30' } });
    fireEvent.blur(horas);
    expect(onChange.mock.lastCall?.[0][0]).toMatchObject({ horas_estimadas: 3.5 });

    const valor = screen.getByLabelText('Valor da hora de Ana Souza');
    fireEvent.change(valor, { target: { value: '62,50' } });
    fireEvent.blur(valor);
    expect(onChange.mock.lastCall?.[0][0]).toMatchObject({ custo_hora: 62.5 });
  });
});
