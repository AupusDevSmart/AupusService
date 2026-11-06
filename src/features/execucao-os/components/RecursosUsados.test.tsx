import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FerramentaOS, MaterialOS } from '../types';

const api = {
  registrarMateriais: vi.fn().mockResolvedValue(undefined),
  registrarFerramentas: vi.fn().mockResolvedValue(undefined),
};
vi.mock('@/services/execucao-os.service', () => ({ execucaoOSApi: api }));
const toast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({ toast }));

const { RecursosUsados } = await import('./RecursosUsados');

// O id volta da API com espaço (Char(26)) e a quantidade como texto (Decimal)
const materiais = [
  { id: 'M1  ', descricao: 'Graxa', quantidade_planejada: '2.5' as unknown as number, quantidade_consumida: undefined, unidade: 'kg', observacoes: 'lote 7' },
  { id: 'M2', descricao: 'Abraçadeira', quantidade_planejada: 10, quantidade_consumida: 10, unidade: 'un' },
] as MaterialOS[];
const ferramentas = [
  { id: 'F1', descricao: 'Termovisor', quantidade: 1, utilizada: false },
] as FerramentaOS[];

/**
 * O que foi usado, registrado no próprio sheet da OS em andamento (06/nov/2026).
 * Antes só o modo Editar registrava, num cartão no fim do formulário.
 */
describe('RecursosUsados', () => {
  beforeEach(() => vi.clearAllMocks());

  it('grava o consumo ao sair do campo, com o id aparado e a observação que o item já tinha', async () => {
    render(<RecursosUsados osId="OS1" materiais={materiais} ferramentas={ferramentas} editavel />);

    expect(screen.getByText('Planejado: 2,5 kg')).toBeInTheDocument();
    const campo = screen.getByLabelText('Quantidade usada de Graxa');
    fireEvent.change(campo, { target: { value: '1,5' } });
    fireEvent.blur(campo);

    await waitFor(() =>
      expect(api.registrarMateriais).toHaveBeenCalledWith('OS1', [{ id: 'M1', quantidade_consumida: 1.5, observacoes: 'lote 7' }]),
    );
  });

  it('marca a ferramenta usada na hora', async () => {
    render(<RecursosUsados osId="OS1" materiais={materiais} ferramentas={ferramentas} editavel />);

    fireEvent.click(screen.getByLabelText('Termovisor usada'));

    await waitFor(() => expect(api.registrarFerramentas).toHaveBeenCalledWith('OS1', [{ id: 'F1', utilizada: true }]));
    expect(screen.getByLabelText('Termovisor usada')).toBeChecked();
  });

  it('"Usei tudo como planejado" preenche só o que ninguém registrou', async () => {
    const comParcial = [...materiais, { id: 'M3', descricao: 'Fita', quantidade_planejada: 5, quantidade_consumida: 2, unidade: 'm' }] as MaterialOS[];
    render(<RecursosUsados osId="OS1" materiais={comParcial} ferramentas={ferramentas} editavel />);

    fireEvent.click(screen.getByRole('button', { name: /Usei tudo como planejado/ }));

    await waitFor(() => expect(api.registrarFerramentas).toHaveBeenCalled());
    // A abraçadeira já estava registrada, e a fita (usou 2 de 5) também: as duas ficam
    expect(api.registrarMateriais).toHaveBeenCalledWith('OS1', [{ id: 'M1', quantidade_consumida: 2.5, observacoes: 'lote 7' }]);
    expect(api.registrarFerramentas).toHaveBeenCalledWith('OS1', [{ id: 'F1', utilizada: true }]);
    await waitFor(() => expect(screen.queryByRole('button', { name: /Usei tudo como planejado/ })).not.toBeInTheDocument());
  });

  it('consumo não registrado fica vazio, e informar 0 ("não usei") grava', async () => {
    render(<RecursosUsados osId="OS1" materiais={materiais} ferramentas={ferramentas} editavel />);

    const campo = screen.getByLabelText('Quantidade usada de Graxa');
    expect(campo).toHaveValue('');
    fireEvent.change(campo, { target: { value: '0' } });
    fireEvent.blur(campo);

    await waitFor(() =>
      expect(api.registrarMateriais).toHaveBeenCalledWith('OS1', [{ id: 'M1', quantidade_consumida: 0, observacoes: 'lote 7' }]),
    );
  });

  it('um pedido por vez, na ordem em que se mexeu: o banco fica com o último', async () => {
    let liberarPrimeiro = () => {};
    api.registrarMateriais.mockImplementationOnce(() => new Promise<void>((ok) => (liberarPrimeiro = ok)));
    render(<RecursosUsados osId="OS1" materiais={materiais} ferramentas={ferramentas} editavel />);

    const campo = screen.getByLabelText('Quantidade usada de Graxa');
    fireEvent.change(campo, { target: { value: '1' } });
    fireEvent.blur(campo);
    fireEvent.click(screen.getByRole('button', { name: 'Tudo' }));

    // O segundo só sai depois que o primeiro volta
    await waitFor(() => expect(api.registrarMateriais).toHaveBeenCalledTimes(1));
    liberarPrimeiro();
    await waitFor(() => expect(api.registrarMateriais).toHaveBeenCalledTimes(2));
    expect(api.registrarMateriais.mock.calls[1][1]).toEqual([{ id: 'M1', quantidade_consumida: 2.5, observacoes: 'lote 7' }]);
  });

  it('a falha de um pedido velho não desfaz o valor que a pessoa já trocou de novo', async () => {
    let falharPrimeiro = (_: Error) => {};
    api.registrarMateriais.mockImplementationOnce(() => new Promise<void>((_, falha) => (falharPrimeiro = falha)));
    render(<RecursosUsados osId="OS1" materiais={materiais} ferramentas={ferramentas} editavel />);

    const campo = screen.getByLabelText('Quantidade usada de Graxa');
    fireEvent.change(campo, { target: { value: '1' } });
    fireEvent.blur(campo);
    fireEvent.change(campo, { target: { value: '2' } });
    fireEvent.blur(campo);
    await waitFor(() => expect(api.registrarMateriais).toHaveBeenCalledTimes(1));
    falharPrimeiro(new Error('rede'));

    await waitFor(() => expect(api.registrarMateriais).toHaveBeenCalledTimes(2));
    expect(toast).toHaveBeenCalled();
    expect(screen.getByLabelText('Quantidade usada de Graxa')).toHaveValue('2');
  });

  it('a falha desfaz a marca e avisa', async () => {
    api.registrarFerramentas.mockRejectedValueOnce(new Error('A OS está finalizada'));
    render(<RecursosUsados osId="OS1" materiais={materiais} ferramentas={ferramentas} editavel />);

    fireEvent.click(screen.getByLabelText('Termovisor usada'));

    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' })));
    expect(screen.getByLabelText('Termovisor usada')).not.toBeChecked();
  });

  it('repassa o material da tela a cada registro (o custo até agora vem daqui)', async () => {
    const onMateriais = vi.fn();
    const comPreco = [{ ...materiais[0], custo_unitario: '40' as unknown as number }] as MaterialOS[];
    render(<RecursosUsados osId="OS1" materiais={comPreco} ferramentas={[]} editavel onMateriais={onMateriais} />);

    const campo = screen.getByLabelText('Quantidade usada de Graxa');
    fireEvent.change(campo, { target: { value: '2' } });
    fireEvent.blur(campo);

    await waitFor(() => expect(onMateriais).toHaveBeenLastCalledWith([expect.objectContaining({ consumida: 2, custoUnitario: 40 })]));
    const { custoDoMaterialUsado } = await import('../utils/recursos-usados');
    expect(custoDoMaterialUsado(onMateriais.mock.lastCall![0])).toBe(80);
  });

  it('sem permissão, só leitura', () => {
    render(<RecursosUsados osId="OS1" materiais={materiais} ferramentas={ferramentas} editavel={false} />);

    expect(screen.queryByLabelText('Quantidade usada de Graxa')).not.toBeInTheDocument();
    expect(screen.getByText('Usado: 10 un')).toBeInTheDocument();
    expect(screen.getByLabelText('Termovisor usada')).toBeDisabled();
    expect(screen.queryByRole('button', { name: /Usei tudo/ })).not.toBeInTheDocument();
  });

  it('OS sem material nem ferramenta diz isso, sem lista vazia', () => {
    render(<RecursosUsados osId="OS1" materiais={[]} ferramentas={[]} editavel />);
    expect(screen.getByText(/Nenhum material ou ferramenta planejado/)).toBeInTheDocument();
  });
});
