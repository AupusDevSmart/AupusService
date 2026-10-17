// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { montarLivroDeFichas } from '@/lib/planilha/fichas';
import { gravarEReabrir } from '@/test-utils/planilha';
import { definicaoDeInstrucoes, lerInstrucoes } from './planilha';

const limpeza = {
  id: 'i1                        ',
  tag: 'INST-006',
  nome: 'Limpeza dos módulos',
  descricao: 'Lavar com água desmineralizada',
  categoria: 'LIMPEZA',
  tipo_manutencao: 'PREVENTIVA',
  condicao_ativo: 'QUALQUER',
  criticidade: 2,
  status: 'ATIVA',
  updated_at: '2026-08-20T17:22:01.000Z',
  total_tarefas_derivadas: 5,
  sub_instrucoes: [
    { id: 's2', descricao: 'Lavar', obrigatoria: false, tempo_estimado: 20, ordem: 2, tipo: 'VERIFICACAO' },
    { id: 's1', descricao: 'Desligar o inversor', obrigatoria: true, tempo_estimado: 90, ordem: 1 },
    // SN-58: a leitura leva unidade e faixa (só mínimo, aqui)
    { id: 's3', descricao: 'Tensão CC da string', obrigatoria: true, tempo_estimado: 5, ordem: 3, tipo: 'LEITURA', unidade: 'V', valor_minimo: 580.5, valor_maximo: null },
  ],
  recursos: [
    {
      tipo: 'TECNICO',
      descricao: 'Eletricista',
      quantidade: '2.000',
      obrigatorio: true,
      recurso_id: 'r1                        ',
      recurso: { nome: 'Eletricista', unidade: 'h' },
    },
  ],
} as never;

const sem = <T extends Record<string, unknown>>(itens: T[]) =>
  itens.map(({ _linha, ...resto }) => ({ linha: _linha, ...resto }));

// 120 s: o primeiro teste carrega o exceljs; sozinho leva ~3 s, mas na suíte inteira
// (12 workers carregando ao mesmo tempo) passava dos 30 s e falhava sem defeito nenhum.
describe('planilha de instruções', { timeout: 120_000 }, () => {
  it('ida e volta: passos na ordem, minutos voltam exatos, leitura com unidade e faixa, recurso pelo nome com o ID ao lado', async () => {
    const livro = await gravarEReabrir(await montarLivroDeFichas(definicaoDeInstrucoes, [limpeza]));
    const { registros, erros } = lerInstrucoes(livro);

    expect(erros).toEqual([]);
    expect(livro.worksheets.map((w) => w.name)).toEqual(['COMO PREENCHER', 'RESUMO', '01', 'MODELO']);
    expect(registros).toHaveLength(1);

    const [r] = registros;
    expect(r).toMatchObject({ id: 'i1', aba: '01', linha: 1, atualizado_em: '2026-08-20T17:22:01.000Z' });
    const { sub_instrucoes, recursos, ...cabecalho } = r.dados as Record<string, Array<Record<string, unknown>>>;
    expect(cabecalho).toEqual({ nome: 'Limpeza dos módulos', descricao: 'Lavar com água desmineralizada', status: 'ATIVA' });
    // Verificação sai como "Verificação" ou vazio; os dois voltam ao padrão da API
    const verificacao = { unidade: null, valor_minimo: null, valor_maximo: null };
    expect(sem(sub_instrucoes)).toEqual([
      { linha: expect.any(Number), descricao: 'Desligar o inversor', obrigatoria: true, tempo_estimado: 90, ...verificacao },
      { linha: expect.any(Number), descricao: 'Lavar', obrigatoria: false, tempo_estimado: 20, tipo: 'VERIFICACAO', ...verificacao },
      {
        linha: expect.any(Number),
        descricao: 'Tensão CC da string',
        obrigatoria: true,
        tempo_estimado: 5,
        tipo: 'LEITURA',
        unidade: 'V',
        valor_minimo: 580.5,
        valor_maximo: null,
      },
    ]);
    expect(sem(recursos)).toEqual([
      { linha: expect.any(Number), tipo: 'TECNICO', recurso: 'Eletricista', quantidade: 2, obrigatorio: true, recurso_ref: 'r1' },
    ]);
  });

  // A lista de passos é trocada inteira: arquivo de antes do SN-58 (sem TIPO,
  // UNIDADE, MÍNIMO, MÁXIMO) transformaria as leituras em verificação calado
  it('seção sem uma coluna editável é erro, não descarte calado', async () => {
    const livro = await gravarEReabrir(await montarLivroDeFichas(definicaoDeInstrucoes, [limpeza]));
    const aba = livro.getWorksheet('01')!;
    let cabecalhoDosPassos = 0;
    aba.eachRow((linha, n) => {
      if (linha.getCell(1).value === 'PASSOS') cabecalhoDosPassos = n;
    });
    const linha = aba.getRow(cabecalhoDosPassos);
    linha.eachCell((celula) => {
      if (celula.value === 'TIPO') celula.value = null;
    });

    const { erros } = lerInstrucoes(livro);

    expect(erros).toEqual([
      expect.objectContaining({ aba: '01', linha: cabecalhoDosPassos, mensagem: expect.stringContaining('sem a coluna TIPO') }),
    ]);
  });

  it('cópia da aba MODELO com outro nome vira instrução nova; aba vazia é ignorada; aba fora do formato é erro', async () => {
    const livro = await gravarEReabrir(await montarLivroDeFichas(definicaoDeInstrucoes, []));
    const modelo = livro.getWorksheet('MODELO')!;

    const nova = livro.addWorksheet('NOVA 1');
    modelo.eachRow({ includeEmpty: true }, (linha, n) => {
      linha.eachCell({ includeEmpty: true }, (celula, c) => {
        nova.getRow(n).getCell(c).value = celula.value;
      });
    });
    const linhaDe = (rotulo: string) => {
      let achada = 0;
      nova.eachRow((linha, n) => {
        if (linha.getCell(1).value === rotulo) achada = n;
      });
      return achada;
    };
    nova.getRow(linhaDe('NOME')).getCell(2).value = 'Inspeção termográfica';
    nova.getRow(linhaDe('DESCRIÇÃO')).getCell(2).value = 'Com câmera térmica';
    nova.getRow(linhaDe('STATUS')).getCell(2).value = 'Ativa';
    nova.getRow(linhaDe('PASSOS') + 1).getCell(2).value = 'Fotografar o quadro';
    nova.getRow(linhaDe('PASSOS') + 1).getCell(4).value = 0.5;

    livro.addWorksheet('Planilha1');
    livro.addWorksheet('Rascunho').getCell('A1').value = 'anotações soltas';

    const { registros, erros } = lerInstrucoes(await gravarEReabrir(livro));

    expect(registros).toHaveLength(1);
    expect(registros[0]).toMatchObject({ id: null, aba: 'NOVA 1' });
    expect(registros[0].dados).toMatchObject({
      nome: 'Inspeção termográfica',
      sub_instrucoes: [expect.objectContaining({ descricao: 'Fotografar o quadro', tempo_estimado: 30 })],
      recursos: [],
    });
    expect(erros).toEqual([
      expect.objectContaining({ aba: 'Rascunho', mensagem: expect.stringContaining('não está no formato da ficha') }),
    ]);
  });

  it('o campo do cabeçalho lembra a sua linha, para o erro do servidor apontar o lugar certo', async () => {
    const livro = await gravarEReabrir(await montarLivroDeFichas(definicaoDeInstrucoes, [limpeza]));
    const { registros } = lerInstrucoes(livro);

    expect(registros[0].linhasDosCampos).toMatchObject({ nome: expect.any(Number), status: expect.any(Number) });
    expect(registros[0].linhasDosCampos?.nome).toBeGreaterThan(1);
  });
});
