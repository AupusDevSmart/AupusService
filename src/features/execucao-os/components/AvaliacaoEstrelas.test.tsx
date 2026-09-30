import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AvaliacaoEstrelas } from './AvaliacaoEstrelas';

describe('AvaliacaoEstrelas', () => {
  it('clicar na 4ª estrela dá nota 4', () => {
    const onChange = vi.fn();
    render(<AvaliacaoEstrelas valor={null} onChange={onChange} />);

    fireEvent.click(screen.getByRole('radio', { name: /4 estrelas/i }));

    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('anuncia a nota escolhida para leitor de tela', () => {
    render(<AvaliacaoEstrelas valor={3} onChange={() => {}} />);

    expect(screen.getByRole('radio', { name: /3 estrelas/i })).toBeChecked();
    expect(screen.getByText('Satisfatório')).toBeInTheDocument();
  });

  it('seta para a direita sobe a nota', () => {
    const onChange = vi.fn();
    render(<AvaliacaoEstrelas valor={2} onChange={onChange} />);

    fireEvent.keyDown(screen.getByRole('radiogroup'), { key: 'ArrowRight' });

    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('em leitura mostra a nota sem ser clicável', () => {
    render(<AvaliacaoEstrelas valor={5} somenteLeitura />);

    expect(screen.queryByRole('radio')).toBeNull();
    expect(screen.getByLabelText('Avaliação: 5 de 5')).toBeInTheDocument();
  });
});
