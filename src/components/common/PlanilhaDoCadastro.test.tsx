import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { LeituraDaPlanilha, ResultadoDaImportacao } from '@/lib/planilha/tipos';
import { PlanilhaDoCadastro } from './PlanilhaDoCadastro';

/** O diálogo da importação: a prévia com "Outros cadastros" (SN-98) e o motivo do arquivo que não abre */
const servico = vi.hoisted(() => ({ importar: vi.fn() }));
const livro = vi.hoisted(() => ({ abrir: vi.fn() }));
const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock('@/services/importacao.services', () => ({ ImportacaoService: servico }));
vi.mock('@/lib/planilha/estilo', async (original) => ({ ...(await original<typeof import('@/lib/planilha/estilo')>()), abrirLivro: livro.abrir }));
vi.mock('sonner', () => ({ toast }));

const leitura: LeituraDaPlanilha = {
  registros: [{ id: 'i1', aba: '01', linha: 1, atualizado_em: null, dados: { nome: 'Limpeza' } }],
  erros: [],
  catalogos: { recursos: [{ nome: 'Ajudante', id: null, grupo: 'recursos', categoria: 'MAO_DE_OBRA', base_calculo: 'hora', preco: 30.77, unidade: null, aba: '01', linha: 16, problemas: [] }] },
};

const resultado = (extra: Partial<ResultadoDaImportacao> = {}): ResultadoDaImportacao => ({
  confirmado: false,
  novos: 0,
  alterados: 0,
  inalterados: 1,
  erros: [],
  avisos: [],
  registros: [{ aba: '01', linha: 1, id: 'i1', nome: 'Limpeza', acao: 'inalterado' }],
  outros_cadastros: [
    { cadastro: 'recurso', acao: 'alterado', nome: 'Ajudante', detalhe: 'preço R$ 25,00 → R$ 30,77', aba: '01', linha: 16 },
  ],
  ...extra,
});

const aoImportar = vi.fn();
function abrirEEnviar() {
  render(
    <PlanilhaDoCadastro cadastro="instrucoes" titulo="Instruções" exportar={vi.fn()} ler={() => leitura} aoImportar={aoImportar} />,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Importar' }));
  fireEvent.change(screen.getByLabelText('Arquivo da planilha'), { target: { files: [new File(['x'], 'Instruções.xlsx')] } });
}

describe('PlanilhaDoCadastro', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    livro.abrir.mockResolvedValue({});
  });

  it('mostra o que muda em outros cadastros, e só isso já deixa confirmar; os catálogos vão de novo no confirmar', async () => {
    servico.importar.mockResolvedValueOnce(resultado()).mockResolvedValueOnce(resultado({ confirmado: true }));
    abrirEEnviar();

    await screen.findByText('Outros cadastros');
    expect(screen.getByText('Ajudante')).toBeInTheDocument();
    expect(screen.getByText('preço R$ 25,00 → R$ 30,77')).toBeInTheDocument();
    expect(screen.getByText(/Recurso alterado · aba 01, linha 16/)).toBeInTheDocument();
    expect(servico.importar).toHaveBeenLastCalledWith('instrucoes', leitura.registros, false, leitura.catalogos);

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar importação (1)' }));

    await waitFor(() => expect(aoImportar).toHaveBeenCalled());
    expect(servico.importar).toHaveBeenLastCalledWith('instrucoes', leitura.registros, true, leitura.catalogos);
    expect(toast.success).toHaveBeenCalledWith('Planilha importada: 1 em outros cadastros.');
  });

  it('sem nada a gravar em lugar nenhum, não deixa confirmar', async () => {
    servico.importar.mockResolvedValue(resultado({ outros_cadastros: [] }));
    abrirEEnviar();

    await screen.findByText('Sem mudança');
    expect(screen.queryByText('Outros cadastros')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirmar importação' })).toBeDisabled();
  });

  it('o arquivo que não abre porque a página é de antes do deploy pede para recarregar, não "envie .xlsx"', async () => {
    const { ArquivoNaoAbriu } = await vi.importActual<typeof import('@/lib/planilha/estilo')>('@/lib/planilha/estilo');
    livro.abrir.mockRejectedValue(new ArquivoNaoAbriu('pagina-desatualizada', 'Failed to fetch dynamically imported module'));
    abrirEEnviar();

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('recarregue a página (Ctrl+F5)')));
    expect(servico.importar).not.toHaveBeenCalled();
  });
});
