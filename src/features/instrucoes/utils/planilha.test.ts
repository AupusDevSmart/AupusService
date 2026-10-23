// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { montarLivroDeFichas, type PlanilhaDeFichas } from '@/lib/planilha/fichas';
import { gravarEReabrir } from '@/test-utils/planilha';
import type { InstrucaoApiResponse } from '@/services/instrucoes.services';
import { definicaoDeInstrucoes, lerInstrucoes } from './planilha';

/** As instruções daqui, para casar a planilha do Smart Project pelo código ou pelo nome */
const api = vi.hoisted(() => ({ findAll: vi.fn() }));
vi.mock('@/services/instrucoes.services', async (original) => {
  const real = await original<typeof import('@/services/instrucoes.services')>();
  return { ...real, instrucoesApi: { ...real.instrucoesApi, findAll: api.findAll } };
});

const recurso = (extra: Record<string, unknown>) => ({
  id: 'r1                        ',
  categoria: 'MAO_DE_OBRA',
  nome: 'Eletricista',
  base_calculo: 'hora',
  rubrica: 'instrucoes',
  horas_por_diaria: 8,
  preco_base: 80,
  ativo: true,
  ...extra,
});

const limpeza = {
  id: 'i1                        ',
  codigo: 'INST-006',
  nome: 'Limpeza dos módulos',
  descricao: 'Lavar com água desmineralizada',
  frente: 'Elétrica',
  prazo_inicio_relativo: 5,
  duracao_dias: 2,
  status: 'ATIVA',
  ativo: true,
  updated_at: '2026-08-20T17:22:01.000Z',
  total_tarefas_derivadas: 5,
  custo: 1280,
  custo_por_grupo: { recursos: 480, maquinario: 300, materiais: 500 },
  sub_instrucoes: [
    { id: 's2', descricao: 'Lavar', obrigatoria: false, tipo: 'civil', duracao_horas: 0.25, ordem: 2, registro: 'VERIFICACAO', exige_foto: true },
    { id: 's1', descricao: 'Desligar o inversor', obrigatoria: true, tipo: 'eletrico', duracao_horas: 1.5, ordem: 1 },
    // SN-58: a leitura leva unidade e faixa (só mínimo, aqui)
    { id: 's3', descricao: 'Tensão CC da string', obrigatoria: true, duracao_horas: null, ordem: 3, registro: 'LEITURA', unidade: 'V', valor_minimo: 580.5, valor_maximo: null },
  ],
  recursos: [
    {
      id: 'l1',
      recurso_id: 'r1                        ',
      recurso: recurso({}),
      quantidade: 2,
      duracao_horas: 3,
      fator_perda: 0,
      fornecido_pelo_cliente: false,
      distancia_km: null,
      preco_proprio: null,
      preco_cadastro: 80,
      subtotal: 480,
    },
    {
      id: 'l2',
      recurso_id: 'r2',
      recurso: recurso({ id: 'r2', categoria: 'MATERIAL', nome: 'Cabo', base_calculo: 'unidade', unidade: 'm', preco_base: 12.5 }),
      quantidade: 40,
      duracao_horas: 0,
      fator_perda: 0.1,
      fornecido_pelo_cliente: false,
      distancia_km: null,
      preco_proprio: 11.36,
      preco_cadastro: 12.5,
      subtotal: 500,
    },
  ],
  maquinarios: [
    {
      id: 'm1',
      maquinario_id: 'mq1',
      maquinario: { id: 'mq1', nome: 'Munck', tipo: 'locacao', base_calculo: 'km', horas_por_diaria: 8, preco_base: 2.5 },
      quantidade: 1,
      duracao_horas: 0,
      distancia_km: 120,
      preco_proprio: null,
      preco_cadastro: 2.5,
      subtotal: 300,
    },
  ],
} as unknown as InstrucaoApiResponse;

const sem = <T extends Record<string, unknown>>(itens: T[]) => itens.map(({ _linha, ...resto }) => ({ linha: _linha, ...resto }));

/** Os rótulos de uma aba: o cabeçalho da ficha e os títulos de cada seção */
function montagem(ws: import('exceljs').Worksheet) {
  const linhas: string[][] = [];
  ws.eachRow((linha) => {
    const valores: string[] = [];
    linha.eachCell((c) => valores.push(String(typeof c.value === 'object' && c.value && 'text' in c.value ? c.value.text : c.value)));
    linhas.push(valores);
  });
  return linhas;
}

/**
 * A planilha do Smart Project: a montagem de lá, sem as colunas só daqui
 * (STATUS, TAREFAS DERIVADAS, o registro de leitura e a foto), com os IDs de lá
 * (números) e o autor de lá.
 */
async function daquelaPlanilha(instrucoes: InstrucaoApiResponse[]) {
  const def = definicaoDeInstrucoes as PlanilhaDeFichas<InstrucaoApiResponse>;
  const deLa: PlanilhaDeFichas<InstrucaoApiResponse> = {
    ...def,
    id: () => '17',
    campos: def.campos.filter((c) => c.titulo !== 'STATUS' && c.titulo !== 'TAREFAS DERIVADAS'),
    secoes: def.secoes.map((s) => ({ ...s, colunas: s.colunas.filter((c) => !c.soDesteSistema) })),
  };
  const livro = await montarLivroDeFichas(deLa, instrucoes);
  livro.creator = 'Smart Project';
  return gravarEReabrir(livro);
}

// 120 s: o primeiro teste carrega o exceljs; sozinho leva ~3 s, mas na suíte inteira
// (12 workers carregando ao mesmo tempo) passava dos 30 s e falhava sem defeito nenhum.
describe('planilha de instruções', { timeout: 120_000 }, () => {
  beforeEach(() => vi.clearAllMocks());

  it('a montagem é a do AupusProject: o cabeçalho e as seções com as mesmas colunas, as daqui no fim', async () => {
    const livro = await gravarEReabrir(await montarLivroDeFichas(definicaoDeInstrucoes, [limpeza]));
    const linhas = montagem(livro.getWorksheet('01')!);
    const rotulos = linhas.map((l) => l[0]);

    expect(rotulos.slice(1, 11)).toEqual([
      'ID', 'CÓDIGO', 'NOME', 'DESCRIÇÃO', 'FRENTE', 'INÍCIO (D+X, DIAS)', 'DURAÇÃO (DIAS)', 'ATIVO', 'STATUS', 'TAREFAS DERIVADAS',
    ]);
    const secao = (titulo: string) => linhas.find((l) => l[0] === titulo)!;
    expect(secao('PASSOS')).toEqual(['PASSOS', 'DESCRIÇÃO', 'TIPO', 'DURAÇÃO [H]', 'OBRIGATÓRIO', 'REGISTRO', 'UNIDADE', 'MÍNIMO', 'MÁXIMO', 'EXIGE FOTO']);
    const itens = ['ITEM', 'COBRANÇA', 'QNT', 'DURAÇÃO [H]', 'DISTÂNCIA [KM]', 'VALOR PRÓPRIO', 'VALOR DO CADASTRO', 'TOTAL', 'ID DO ITEM'];
    expect(secao('RECURSOS')).toEqual(['RECURSOS', ...itens]);
    expect(secao('MAQUINÁRIO')).toEqual(['MAQUINÁRIO', ...itens]);
    expect(secao('MATERIAIS')).toEqual(['MATERIAIS', 'ITEM', 'QNT', 'PERDA (%)', 'FD', 'VALOR PRÓPRIO', 'VALOR DO CADASTRO', 'TOTAL', 'ID DO ITEM']);
    // Os subtotais e o valor, calculados, depois das seções
    expect(linhas.find((l) => l[0] === 'VALOR DA INSTRUÇÃO')).toEqual(['VALOR DA INSTRUÇÃO', '1280']);
  });

  it('ida e volta: o cabeçalho, os passos na ordem, cada item pelo nome com o ID ao lado, a perda em fração', async () => {
    const livro = await gravarEReabrir(await montarLivroDeFichas(definicaoDeInstrucoes, [limpeza]));
    const { registros, erros, catalogos } = await lerInstrucoes(livro);

    expect(erros).toEqual([]);
    expect(api.findAll).not.toHaveBeenCalled();
    // SN-98: os recursos citados vão junto, para o servidor acertar o cadastro (recursos-da-planilha.test.ts)
    expect(catalogos?.recursos?.map((x) => [x.nome, x.id, x.base_calculo, x.preco])).toEqual([
      ['Eletricista', 'r1', 'hora', 80],
      ['Cabo', 'r2', null, 12.5],
    ]);
    expect(livro.worksheets.map((w) => w.name)).toEqual(['COMO PREENCHER', 'RESUMO', '01', 'MODELO']);
    const [r] = registros;
    expect(r).toMatchObject({ id: 'i1', aba: '01', linha: 1, atualizado_em: '2026-08-20T17:22:01.000Z' });
    const { sub_instrucoes, recursos, maquinarios, ...cabecalho } = r.dados as Record<string, Array<Record<string, unknown>>>;
    expect(cabecalho).toEqual({
      codigo: 'INST-006',
      nome: 'Limpeza dos módulos',
      descricao: 'Lavar com água desmineralizada',
      frente: 'Elétrica',
      prazo_inicio_relativo: 5,
      duracao_dias: 2,
      ativo: true,
      status: 'ATIVA',
    });
    // Verificação sai como "Verificação" ou vazio; os dois voltam ao padrão da API
    const verificacao = { unidade: null, valor_minimo: null, valor_maximo: null };
    expect(sem(sub_instrucoes)).toEqual([
      { linha: expect.any(Number), descricao: 'Desligar o inversor', tipo: 'eletrico', duracao_horas: 1.5, obrigatoria: true, registro: null, exige_foto: null, ...verificacao },
      { linha: expect.any(Number), descricao: 'Lavar', tipo: 'civil', duracao_horas: 0.25, obrigatoria: false, registro: 'VERIFICACAO', exige_foto: true, ...verificacao },
      {
        linha: expect.any(Number),
        descricao: 'Tensão CC da string',
        tipo: null,
        duracao_horas: null,
        obrigatoria: true,
        registro: 'LEITURA',
        unidade: 'V',
        valor_minimo: 580.5,
        valor_maximo: null,
        exige_foto: null,
      },
    ]);
    expect(sem(recursos)).toEqual([
      // O preço próprio vazio (segue o cadastro) volta nulo: nunca vira o preço vigente
      { linha: expect.any(Number), recurso: 'Eletricista', quantidade: 2, duracao_horas: 3, distancia_km: null, preco_proprio: null, recurso_ref: 'r1', grupo: 'recursos' },
      { linha: expect.any(Number), recurso: 'Cabo', quantidade: 40, fator_perda: 0.1, fornecido_pelo_cliente: false, preco_proprio: 11.36, recurso_ref: 'r2', grupo: 'materiais' },
    ]);
    expect(sem(maquinarios)).toEqual([
      { linha: expect.any(Number), maquinario: 'Munck', quantidade: 1, duracao_horas: 0, distancia_km: 120, preco_proprio: null, maquinario_ref: 'mq1' },
    ]);
  });

  // A lista de passos é trocada inteira: arquivo daqui sem uma coluna dela apagaria o dado calado
  it('no arquivo daqui, seção sem uma coluna editável é erro, não descarte calado', async () => {
    const livro = await gravarEReabrir(await montarLivroDeFichas(definicaoDeInstrucoes, [limpeza]));
    const aba = livro.getWorksheet('01')!;
    let cabecalhoDosPassos = 0;
    aba.eachRow((linha, n) => {
      if (linha.getCell(1).value === 'PASSOS') cabecalhoDosPassos = n;
    });
    aba.getRow(cabecalhoDosPassos).eachCell((celula) => {
      if (celula.value === 'REGISTRO') celula.value = null;
    });

    const { erros } = await lerInstrucoes(livro);

    expect(erros).toEqual([
      expect.objectContaining({ aba: '01', linha: cabecalhoDosPassos, mensagem: expect.stringContaining('sem a coluna REGISTRO') }),
    ]);
  });

  it('recursos e materiais vão juntos: sem uma das duas seções, é erro (a importação apagaria a outra metade)', async () => {
    const livro = await gravarEReabrir(await montarLivroDeFichas(definicaoDeInstrucoes, [limpeza]));
    const aba = livro.getWorksheet('01')!;
    // A seção inteira some: o cabeçalho e as linhas dela, até o rodapé
    let apagando = false;
    aba.eachRow((linha) => {
      if (linha.getCell(1).value === 'MATERIAIS') apagando = true;
      if (String(linha.getCell(1).value ?? '').startsWith('Subtotal')) apagando = false;
      if (apagando) linha.eachCell((celula) => (celula.value = null));
    });

    const { registros, erros } = await lerInstrucoes(livro);

    expect(registros).toEqual([]);
    expect(erros).toEqual([expect.objectContaining({ mensagem: expect.stringContaining('A seção MATERIAIS sumiu desta aba') })]);
  });

  // Decisão do usuário (SN-85): a planilha de instruções do AupusProject importa aqui
  it('a planilha do Smart Project: sem as colunas daqui não é erro, e cada instrução casa pelo código (sem ele, pelo nome)', async () => {
    const semCodigo = { ...limpeza, codigo: '', nome: 'Inspeção termográfica' } as InstrucaoApiResponse;
    const nova = { ...limpeza, codigo: 'CS-99', nome: 'Lançamento de cabo' } as InstrucaoApiResponse;
    const livro = await daquelaPlanilha([limpeza, semCodigo, nova]);
    api.findAll.mockResolvedValue({
      data: [
        { id: 'aqui-limpeza ', codigo: 'INST-006', nome: 'Outro nome daqui' },
        { id: 'aqui-termo', codigo: 'INST-010', nome: 'INSPEÇÃO TERMOGRÁFICA' },
      ],
      pagination: { page: 1, limit: 100, total: 2, pages: 1, totalPages: 1 },
    });

    const leitura = await lerInstrucoes(livro);

    expect(leitura.erros).toEqual([]);
    expect(leitura.registros.map((r) => [r.id, r.atualizado_em])).toEqual([
      ['aqui-limpeza', null],
      ['aqui-termo', null],
      [null, null],
    ]);
    // Sem as colunas daqui, o passo chega SEM as chaves: o servidor mantém a leitura e a foto do passo daqui
    const passos = (leitura.registros[0].dados as { sub_instrucoes: Array<Record<string, unknown>> }).sub_instrucoes;
    expect(passos[0]).not.toHaveProperty('registro');
    expect(passos[0]).not.toHaveProperty('exige_foto');
    expect(leitura.avisos?.[0].mensagem).toContain('2 instruções casado(s) pelo nome com os daqui (edita), 1 novo(s) (cria)');
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
    nova.getRow(linhaDe('PASSOS') + 1).getCell(2).value = 'Fotografar o quadro';
    nova.getRow(linhaDe('PASSOS') + 1).getCell(4).value = 0.5;
    nova.getRow(linhaDe('MATERIAIS') + 1).getCell(2).value = 'Fita isolante';
    nova.getRow(linhaDe('MATERIAIS') + 1).getCell(4).value = 15;

    livro.addWorksheet('Planilha1');
    livro.addWorksheet('Rascunho').getCell('A1').value = 'anotações soltas';

    const { registros, erros } = await lerInstrucoes(await gravarEReabrir(livro));

    expect(registros).toHaveLength(1);
    expect(registros[0]).toMatchObject({ id: null, aba: 'NOVA 1' });
    expect(registros[0].dados).toMatchObject({
      nome: 'Inspeção termográfica',
      sub_instrucoes: [expect.objectContaining({ descricao: 'Fotografar o quadro', duracao_horas: 0.5 })],
      recursos: [expect.objectContaining({ recurso: 'Fita isolante', fator_perda: 0.15, grupo: 'materiais' })],
      maquinarios: [],
    });
    expect(registros[0].dados).not.toHaveProperty('codigo');
    expect(erros).toEqual([expect.objectContaining({ aba: 'Rascunho', mensagem: expect.stringContaining('não está no formato da ficha') })]);
  });

  // "15%" digitado no Excel vira 0,15 com formato de %: dividir por 100 daria 0,15% de perda
  it('a perda digitada com % no Excel é lida como a fração, e a digitada como número como o percentual', async () => {
    const livro = await gravarEReabrir(await montarLivroDeFichas(definicaoDeInstrucoes, [limpeza]));
    const aba = livro.getWorksheet('01')!;
    let linhaDoCabo = 0;
    let colunaDaPerda = 0;
    aba.eachRow((linha, n) => {
      if (linha.getCell(1).value === 'MATERIAIS') linha.eachCell((c, col) => { if (c.value === 'PERDA (%)') colunaDaPerda = col; });
      if (linha.getCell(2).value === 'Cabo') linhaDoCabo = n;
    });
    const celula = aba.getRow(linhaDoCabo).getCell(colunaDaPerda);
    celula.value = 0.15;
    celula.numFmt = '0%';

    const { registros } = await lerInstrucoes(await gravarEReabrir(livro));
    const cabo = (registros[0].dados.recursos as Array<Record<string, unknown>>).find((l) => l.recurso === 'Cabo');
    expect(cabo?.fator_perda).toBe(0.15);
  });

  it('o campo do cabeçalho lembra a sua linha, para o erro do servidor apontar o lugar certo', async () => {
    const livro = await gravarEReabrir(await montarLivroDeFichas(definicaoDeInstrucoes, [limpeza]));
    const { registros } = await lerInstrucoes(livro);

    expect(registros[0].linhasDosCampos).toMatchObject({ nome: expect.any(Number), status: expect.any(Number), ativo: expect.any(Number) });
    expect(registros[0].linhasDosCampos?.nome).toBeGreaterThan(1);
  });
});
