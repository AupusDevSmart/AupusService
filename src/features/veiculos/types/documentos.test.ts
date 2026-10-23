import { describe, expect, it } from 'vitest';
import { documentoDaApi, resumoDoDocumento } from './documentos';

/**
 * A documentação do veículo aparecia como "• NaN undefined • SEGURO": a tela
 * lia `nome_original`, `tamanho` e `categoria`, e a API manda `nomeArquivoOriginal`,
 * `tamanhoArquivo` e a categoria em `tipo`.
 */
describe('documentação do veículo', () => {
  const daApi = {
    id: 'doc1',
    veiculoId: 'v1',
    tipo: 'seguro' as const,
    descricao: 'Apólice 2026',
    nomeArquivo: 'apolice-2026.pdf',
    nomeArquivoOriginal: 'apolice-2026.pdf',
    tipoArquivo: 'pdf',
    tamanhoArquivo: 1_258_291,
    criadoEm: '2026-10-19T12:00:00.000Z',
    atualizadoEm: '2026-10-19T12:00:00.000Z',
  };

  it('a API no formato da tela: a categoria é o tipo da API; o tipo, a extensão', () => {
    expect(documentoDaApi(daApi)).toMatchObject({
      nome_original: 'apolice-2026.pdf',
      categoria: 'seguro',
      tipo: 'pdf',
      tamanho: 1_258_291,
      descricao: 'Apólice 2026',
    });
  });

  it('o resumo, só com o que se sabe', () => {
    expect(resumoDoDocumento(documentoDaApi(daApi))).toBe('Seguro • 1.2 MB • PDF');
    // Documentação sem arquivo: nem "NaN", nem "undefined", nem "0 Bytes"
    const semArquivo = documentoDaApi({ ...daApi, nomeArquivo: null, nomeArquivoOriginal: null, tipoArquivo: null, tamanhoArquivo: null });
    expect(resumoDoDocumento(semArquivo)).toBe('Seguro');
    expect(semArquivo.nome_original).toBe('Apólice 2026');
  });
});
