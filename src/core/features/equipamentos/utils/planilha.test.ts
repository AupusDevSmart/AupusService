// @vitest-environment node
import { describe, expect, it } from 'vitest';

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
