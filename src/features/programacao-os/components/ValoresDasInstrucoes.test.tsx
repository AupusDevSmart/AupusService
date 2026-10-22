import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ValoresDasInstrucoes } from './ValoresDasInstrucoes';
import type { LinhaDeValor } from '@/features/programacao-os/utils/valores-das-instrucoes';

/** O valor de cada instrução na programação (SN-93, D1): do cadastro, ajustável só aqui */
const linhas: LinhaDeValor[] = [
  { chave: 'tarefa:T1', nome: 'INV-03 · Termografia', equipamento: 'Inversor 01', valor: 902.08, original: 902.08, doCadastroHoje: false },
  { chave: 'instrucao:A1', nome: 'TR-01 · Inspeção', equipamento: null, valor: 120, original: 10, doCadastroHoje: false },
];
const sem = (t: string | null) => (t ?? '').replace(/\s/g, ' ');

describe('ValoresDasInstrucoes', () => {
  it('cada linha com o valor e o total; o ajustado diz o do cadastro', () => {
    render(<ValoresDasInstrucoes linhas={linhas} ajustes={{}} onChange={vi.fn()} />);
    expect(screen.getByLabelText('Valor de INV-03 · Termografia (Inversor 01)')).toHaveValue('902,08');
    expect(sem(screen.getByText(/cadastro R\$/).textContent)).toBe('cadastro R$ 10,00');
    expect(sem(screen.getByText(/^Total das instruções/).textContent)).toBe('Total das instruções: R$ 1.022,08');
  });

  // Revisão de falha silenciosa: na programação aprovada de antes, o valor de hoje parecia o da programação
  it('a linha sem valor congelado diz "do cadastro de hoje"; ajustada, diz o do cadastro', () => {
    const deAntes: LinhaDeValor = { chave: 'tarefa:T2', nome: 'MOT-02 · Lubrificação', equipamento: 'Compressor 01', valor: 74.12, original: 74.12, doCadastroHoje: true };
    const { rerender } = render(<ValoresDasInstrucoes linhas={[deAntes]} ajustes={{}} onChange={vi.fn()} />);
    expect(screen.getByText('Compressor 01 · do cadastro de hoje')).toBeInTheDocument();
    rerender(<ValoresDasInstrucoes linhas={[deAntes]} ajustes={{ 'tarefa:T2': 80 }} onChange={vi.fn()} />);
    expect(screen.queryByText(/do cadastro de hoje/)).toBeNull();
  });

  it('digitar ajusta pela chave da linha; "Voltar ao cadastro" manda null', () => {
    const onChange = vi.fn();
    render(<ValoresDasInstrucoes linhas={linhas} ajustes={{}} onChange={onChange} />);
    const campo = screen.getByLabelText('Valor de INV-03 · Termografia (Inversor 01)');
    fireEvent.change(campo, { target: { value: '850' } });
    fireEvent.blur(campo);
    expect(onChange).toHaveBeenLastCalledWith({ 'tarefa:T1': 850 });

    fireEvent.click(screen.getByRole('button', { name: 'Voltar ao cadastro' }));
    expect(onChange).toHaveBeenLastCalledWith({ 'instrucao:A1': null });
  });

  // Revisão de falha silenciosa: o aviso aparecia no campo e o Salvar gravava calado o valor anterior
  it('valor ilegível (mais de 2 casas) avisa o formulário, que não salva; corrigido, libera', () => {
    const onIlegivel = vi.fn();
    render(<ValoresDasInstrucoes linhas={linhas} ajustes={{}} onChange={vi.fn()} onIlegivel={onIlegivel} />);
    const campo = screen.getByLabelText('Valor de INV-03 · Termografia (Inversor 01)');
    fireEvent.change(campo, { target: { value: '1,005' } });
    fireEvent.blur(campo);
    expect(onIlegivel).toHaveBeenLastCalledWith(true);
    fireEvent.change(campo, { target: { value: '1,01' } });
    fireEvent.blur(campo);
    expect(onIlegivel).toHaveBeenLastCalledWith(false);
  });

  it('na criação, só diz que o valor vem do cadastro e se ajusta depois', () => {
    render(<ValoresDasInstrucoes linhas={[]} ajustes={{}} onChange={vi.fn()} criando />);
    expect(screen.getByText(/Cada instrução entra com o valor do cadastro/)).toBeInTheDocument();
  });

  it('fora de pendente (ou em Visualizar), só leitura', () => {
    render(<ValoresDasInstrucoes linhas={linhas} ajustes={{}} onChange={vi.fn()} disabled />);
    expect(screen.getByLabelText('Valor de INV-03 · Termografia (Inversor 01)')).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Voltar ao cadastro' })).toBeNull();
  });
});
