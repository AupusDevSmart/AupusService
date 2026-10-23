// @vitest-environment node
import type { Worksheet } from 'exceljs';
import { describe, expect, it } from 'vitest';

import { abaComoPreencher } from '@/lib/planilha/como-preencher';
import { novoLivro } from '@/lib/planilha/estilo';
import { montarLivroDeFichas } from '@/lib/planilha/fichas';
import { gravarEReabrir } from '@/test-utils/planilha';
import { definicaoDeEquipamentos, lerEquipamentos } from './planilha';

const inversor = {
  id: 'e1                        ',
  nome: 'Inversor 01',
  tag: 'INV-01',
  classificacao: 'UC',
  status: 'Ativo',
  criticidade: '5',
  // SN-64
  criticidade_impacto: 5,
  criticidade_probabilidade: 1,
  criticidade_motivo: 'Único da usina',
  numero_serie: 'SN-1',
  localizacao: 'Casa de inversores',
  valor_contabil: '15000.50',
  data_imobilizacao: '2026-03-15T00:00:00.000Z',
  // SN-66
  data_instalacao: '2026-04-01T00:00:00.000Z',
  garantia_ate: '2031-04-01T00:00:00.000Z',
  fornecedor: 'Distribuidora Solar',
  centro_custo: 'CC-UFV1',
  mcpse: false,
  tuc: '',
  a1: null,
  fabricante: 'WEG',
  unidade_id: 'u1                        ',
  updated_at: '2026-09-02T20:27:39.000Z',
  unidade: { nome: 'UFV 1', planta: { nome: 'Fazenda' } },
  tipo_equipamento_rel: { id: 'm1', nome: 'Inversor 75kW', codigo: 'INV75', categoria: { nome: 'Inversor' } },
  dados_tecnicos: [{ campo: 'potencia', valor: '75', tipo: 'number', unidade: 'kW' }],
  equipamentos_filhos: [
    {
      id: 'c1', nome: 'String 01', criticidade: 'B', tipo_equipamento_id: 'm2', data_instalacao: '2026-01-10T00:00:00.000Z',
      garantia_ate: '2028-01-10T00:00:00.000Z', centro_custo: 'CC-STR', valor_contabil: null,
    },
    { id: 'c2', nome: 'String velha', deleted_at: '2026-01-01T00:00:00.000Z' },
  ],
  plano: { nome: 'Plano do inversor', origemId: 'p1' },
  tarefasDoPlano: [
    { tag: 'TRF-1', nome: 'Inspeção', frequencia: 'MENSAL', criticidade: 3, origem_status: 'HERDADA', instrucao: { nome: 'Inspeção' } },
  ],
  modeloPorId: new Map([['m2', 'String fotovoltaica']]),
} as never;

// 120 s: o primeiro teste carrega o exceljs; sozinho leva ~3 s, mas na suíte inteira
// (12 workers carregando ao mesmo tempo) passava dos 30 s e falhava sem defeito nenhum.
describe('planilha de equipamentos', { timeout: 120_000 }, () => {
  it('ida e volta: criticidade em código (a antiga segue como está), tarefas do plano ficam de fora', async () => {
    const livro = await gravarEReabrir(await montarLivroDeFichas(definicaoDeEquipamentos, [inversor]));
    const { registros, erros } = lerEquipamentos(livro);

    expect(erros).toEqual([]);
    const { dados_tecnicos, componentes, ...uc } = registros[0].dados as Record<string, Array<Record<string, unknown>>>;
    expect(uc).toEqual({
      nome: 'Inversor 01',
      tag: 'INV-01',
      planta: 'Fazenda',
      unidade: 'UFV 1',
      modelo: 'Inversor 75kW',
      criticidade: '5',
      criticidade_impacto: 5,
      criticidade_probabilidade: 1,
      criticidade_motivo: 'Único da usina',
      numero_serie: 'SN-1',
      localizacao: 'Casa de inversores',
      valor_contabil: 15000.5,
      data_imobilizacao: '2026-03-15',
      data_instalacao: '2026-04-01',
      garantia_ate: '2031-04-01',
      fornecedor: 'Distribuidora Solar',
      centro_custo: 'CC-UFV1',
      status: 'Ativo',
      mcpse: false,
      tuc: null,
      a1: null,
      a2: null,
      a3: null,
      a4: null,
      a5: null,
      a6: null,
      plano: 'Plano do inversor',
      unidade_ref: 'u1',
      modelo_ref: 'm1',
      plano_ref: 'p1',
    });
    expect(dados_tecnicos.map(({ _linha, ...d }) => d)).toEqual([{ campo: 'potencia', valor: '75', unidade: 'kW', tipo: 'number' }]);
    // O componente excluído não sai; a criticidade antiga ("B") volta como está.
    expect(componentes.map(({ _linha, ...c }) => c)).toEqual([
      {
        nome: 'String 01',
        modelo: 'String fotovoltaica',
        numero_serie: null,
        data_instalacao: '2026-01-10',
        garantia_ate: '2028-01-10',
        criticidade: 'B',
        criticidade_impacto: null,
        criticidade_probabilidade: null,
        criticidade_motivo: null,
        localizacao_especifica: null,
        fornecedor: null,
        centro_custo: 'CC-STR',
        valor_imobilizado: null,
        valor_depreciacao: null,
        valor_contabil: null,
        observacoes: null,
        id: 'c1',
        modelo_ref: 'm2',
      },
    ]);
  });

  it('a seção de tarefas sai em cinza, com a origem de cada uma', async () => {
    const livro = await gravarEReabrir(await montarLivroDeFichas(definicaoDeEquipamentos, [inversor]));
    const ws = livro.getWorksheet('01')!;
    let linhaDaSecao = 0;
    ws.eachRow((linha, n) => {
      if (linha.getCell(1).value === 'TAREFAS DO PLANO') linhaDaSecao = n;
    });

    expect(linhaDaSecao).toBeGreaterThan(0);
    expect(ws.getRow(linhaDaSecao + 1).getCell(7).value).toBe('Herdada do plano');
  });
});

/** A linha (na coluna A) de um rótulo da ficha */
function linhaDe(ws: Worksheet, rotulo: string) {
  let n = 0;
  ws.eachRow((l, i) => {
    if (!n && l.getCell(1).value === rotulo) n = i;
  });
  return n;
}

const textoDaNota = (nota: unknown) =>
  typeof nota === 'string' ? nota : ((nota as { texts?: Array<{ text: string }> })?.texts ?? []).map((t) => t.text).join('');

// SN-98: o plano que não existe é criado pela planilha, com as TAREFAS DO PLANO
describe('planos citados pela planilha de equipamentos', { timeout: 120_000 }, () => {
  it('ida e volta: o plano de cada aba vai ao servidor com a categoria e as tarefas em código', async () => {
    const livro = await gravarEReabrir(await montarLivroDeFichas(definicaoDeEquipamentos, [inversor]));
    const ws = livro.getWorksheet('01')!;

    const { catalogos, erros } = lerEquipamentos(livro);

    expect(erros).toEqual([]);
    expect(catalogos?.planos).toEqual([
      {
        nome: 'Plano do inversor',
        categoria: 'Inversor',
        tarefas: [{ nome: 'Inspeção', instrucao: 'Inspeção', frequencia: 'MENSAL', frequencia_personalizada: null, criticidade: 3 }],
        aba: '01',
        linha: linhaDe(ws, 'PLANO'),
        linha_das_tarefas: linhaDe(ws, 'TAREFAS DO PLANO'),
        // Por eles o servidor reconhece o plano de hoje e o plano renomeado depois da exportação
        plano_ref: 'p1',
        equipamento_id: 'e1',
        problemas: [],
      },
    ]);
  });

  it('"A cada N dias" é a personalizada; a linha que não dá para ler vai em problemas, nunca em erro (o servidor decide)', async () => {
    const livro = await gravarEReabrir(await montarLivroDeFichas(definicaoDeEquipamentos, [inversor]));
    const ws = livro.getWorksheet('01')!;
    const secao = linhaDe(ws, 'TAREFAS DO PLANO');
    // TAG, NOME, INSTRUÇÃO, PERIODICIDADE, CRITICIDADE nas colunas B a F
    const linhas = [
      [null, 'Termografia', 'CS-63', 'a cada 45 dias', 'muito alta'],
      [null, 'Limpeza', 'CS-264', 'Toda hora', 'Alta'],
      [null, 'Reaperto', 'CS-265', 'Anual', 'Urgente'],
      [null, 'Sem instrução', null, 'Mensal', 'Baixa'],
      [null, 'Nunca', 'CS-63', 'A cada 0 dias', 'Baixa'],
    ];
    linhas.forEach((valores, i) => valores.forEach((v, c) => (ws.getRow(secao + 2 + i).getCell(c + 2).value = v)));

    const { catalogos, erros } = lerEquipamentos(await gravarEReabrir(livro));

    expect(erros).toEqual([]);
    const [plano] = catalogos!.planos!;
    expect(plano.tarefas).toEqual([
      expect.objectContaining({ nome: 'Inspeção' }),
      { nome: 'Termografia', instrucao: 'CS-63', frequencia: 'PERSONALIZADA', frequencia_personalizada: 45, criticidade: 5 },
    ]);
    expect(plano.problemas).toEqual([
      { linha: secao + 3, mensagem: expect.stringContaining('PERIODICIDADE "Toda hora"') },
      { linha: secao + 4, mensagem: expect.stringContaining('CRITICIDADE "Urgente"') },
      { linha: secao + 5, mensagem: expect.stringContaining('"Sem instrução" está sem a INSTRUÇÃO') },
      { linha: secao + 6, mensagem: expect.stringContaining('PERIODICIDADE "A cada 0 dias"') },
    ]);
  });

  it('uma entrada por aba, sem juntar nem julgar; aba sem PLANO não cita nada', async () => {
    const semPlano = { ...(inversor as object), id: 'e2', nome: 'Inversor 02', plano: null, tarefasDoPlano: [] } as never;
    const outra = { ...(inversor as object), id: 'e3', nome: 'Inversor 03', tarefasDoPlano: [] } as never;
    const livro = await gravarEReabrir(await montarLivroDeFichas(definicaoDeEquipamentos, [inversor, semPlano, outra]));

    const { catalogos, erros } = lerEquipamentos(livro);

    expect(erros).toEqual([]);
    expect(catalogos?.planos?.map((p) => [p.aba, p.nome, p.tarefas.length])).toEqual([
      ['01', 'Plano do inversor', 1],
      ['03', 'Plano do inversor', 0],
    ]);
  });

  it('a COMO PREENCHER e a nota da seção dizem que as tarefas criam o plano que não existe', async () => {
    const livro = await gravarEReabrir(await montarLivroDeFichas(definicaoDeEquipamentos, [inversor]));
    const como: string[] = [];
    livro.getWorksheet('COMO PREENCHER')!.eachRow((l) => l.eachCell((c) => como.push(String(c.value ?? ''))));
    const ws = livro.getWorksheet('01')!;

    expect(como.some((t) => t.includes('Seções em cinza são só informação: a importação as ignora — exceto TAREFAS DO PLANO'))).toBe(true);
    expect(como.some((t) => t.includes('Plano que já existe só é vinculado'))).toBe(true);
    expect(textoDaNota(ws.getRow(linhaDe(ws, 'TAREFAS DO PLANO')).getCell(1).note)).toContain('Só vale para o plano que ainda não existe');

    // A regra das referências só sai com a aba REFERÊNCIAS (a exportação de verdade tem)
    const comReferencias = await novoLivro();
    await abaComoPreencher(comReferencias, {
      cadastro: 'Equipamentos',
      formato: 'fichas',
      tituloDaFicha: 'EQUIPAMENTO (UC)',
      comoTirarDeUso: 'escreva Inativo em STATUS',
      tabelas: [],
      temReferencias: true,
      excecoes: definicaoDeEquipamentos.excecoes,
    });
    const regras: string[] = [];
    comReferencias.getWorksheet('COMO PREENCHER')!.eachRow((l) => regras.push(String(l.getCell(2).value ?? '')));
    expect(regras.some((t) => t.includes('exceto o plano (coluna PLANO), que a importação cria'))).toBe(true);
  });
});
