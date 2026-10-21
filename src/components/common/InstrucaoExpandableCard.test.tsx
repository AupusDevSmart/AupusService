import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { InstrucaoExpandableCard } from './InstrucaoExpandableCard';

/**
 * O valor da instrução na proposta (SN-86): a sugestão conta como zero a linha
 * sem preço no cadastro, e o cartão diz isso ao lado do valor — senão o número
 * parece completo e a proposta sai abaixo do custo.
 */
describe('InstrucaoExpandableCard: valor da proposta', () => {
  it('marca "sem preço" ao lado do valor, com a explicação na dica', () => {
    render(<InstrucaoExpandableCard id="i1" codigo="I-1" nome="Troca" valor={50} semPrecoNoCadastro valorEditavel={false} />);

    const marca = screen.getByText('sem preço');
    expect(marca).toHaveAttribute('title', expect.stringContaining('não tem preço no cadastro'));
  });

  it('sem linha sem preço, ou sem valor na tela, não marca nada', () => {
    const { rerender } = render(<InstrucaoExpandableCard id="i1" nome="Troca" valor={50} valorEditavel={false} />);
    expect(screen.queryByText('sem preço')).not.toBeInTheDocument();

    rerender(<InstrucaoExpandableCard id="i1" nome="Troca" semPrecoNoCadastro />);
    expect(screen.queryByText('sem preço')).not.toBeInTheDocument();
  });
});
