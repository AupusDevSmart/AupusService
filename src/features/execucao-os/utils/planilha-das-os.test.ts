// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import type { ExecucaoOSListApiResponse, OrdemServicoDaApi } from '@/services/execucao-os.service';
import { gravarEReabrir } from '@/test-utils/planilha';
import { COLUNAS, FiltroGrandeDemais, dataNaCelula, descricaoDoFiltro, planilhaDasOS, todasAsOS } from './planilha-das-os';

/** A lista de OS exportada (SN-63): todas as do filtro, não só a página aberta. */
const os = (n: number, mudar: Partial<OrdemServicoDaApi> = {}) =>
  ({
    id: `OS${n} `,
    numero_os: `OS-2026-${String(n).padStart(4, '0')}`,
    tipo: 'CORRETIVA',
    prioridade: 'ALTA',
    status: 'FINALIZADA',
    origem: 'ANOMALIA',
    planta: { id: 'P1', nome: 'Planta Norte' },
    equipamento: { id: 'E1 ', nome: 'Inversor 3' },
    instalacoes: [{ id: 'U1', nome: 'UFV Norte' }],
    descricao: 'Inversor desligando',
    data_hora_programada: '2026-10-16T11:00:00.000Z',
    data_hora_inicio_real: '2026-10-16T15:30:00.000Z',
    data_hora_fim_real: '2026-10-16T18:00:00.000Z',
    finalizada_em: '2026-10-17T12:00:00.000Z',
    responsavel: 'Ana Técnica',
    tempo_efetivo_minutos: 150,
    hh_real: 5.5,
    hh_estimado: 8,
    custo_real: 234.5,
    resultado_servico: 'Ventilador trocado',
    parada_inicio: '2026-10-16T09:00:00.000Z',
    parada_fim: '2026-10-16T18:00:00.000Z',
    minutos_parado: 540,
    falha_sintoma: 'Alarme',
    falha_causa: 'Ventilador travado',
    falha_acao: 'Troca',
    ...mudar,
  }) as unknown as OrdemServicoDaApi;

const pagina = (dados: OrdemServicoDaApi[], page: number, total: number, totalPages: number): ExecucaoOSListApiResponse => ({
  data: dados,
  pagination: { page, limit: 100, total, totalPages },
});

describe('todas as OS do filtro', () => {
  it('lê página por página com o filtro da tela; a lista parada não "mudou"', async () => {
    const buscar = vi
      .fn()
      .mockResolvedValueOnce(pagina([os(1), os(2)], 1, 3, 2))
      .mockResolvedValueOnce(pagina([os(3)], 2, 3, 2));

    const { ordens, total, mudou } = await todasAsOS({ status: 'FINALIZADA', page: 4, limit: 10 }, buscar);

    expect(ordens.map((o) => o.numero_os)).toEqual(['OS-2026-0001', 'OS-2026-0002', 'OS-2026-0003']);
    expect(total).toBe(3);
    expect(mudou).toBe(false);
    // A página e o tamanho da tela são trocados; o resto do filtro vai igual
    expect(buscar).toHaveBeenNthCalledWith(1, { status: 'FINALIZADA', page: 1, limit: 100 });
    expect(buscar).toHaveBeenNthCalledWith(2, { status: 'FINALIZADA', page: 2, limit: 100 });
  });

  // Revisão do SN-63: a OS que mudava de página no meio sumia ou se repetia calada
  it('a lista que muda no meio da leitura é dita, e a repetida fica uma vez só', async () => {
    const empurrada = vi
      .fn()
      .mockResolvedValueOnce(pagina([os(1), os(2)], 1, 3, 2))
      // Uma OS nova no meio empurra a 2 para a página seguinte
      .mockResolvedValueOnce(pagina([os(2), os(3)], 2, 4, 2));
    const repetida = await todasAsOS({}, empurrada);
    expect(repetida.ordens.map((o) => o.numero_os)).toEqual(['OS-2026-0001', 'OS-2026-0002', 'OS-2026-0003']);
    expect(repetida.mudou).toBe(true);

    // Uma OS iniciada sai do filtro "pendentes": a que subiu de posição não é lida
    const saiu = vi
      .fn()
      .mockResolvedValueOnce(pagina([os(1), os(2)], 1, 4, 2))
      .mockResolvedValueOnce(pagina([os(4)], 2, 3, 2));
    expect((await todasAsOS({}, saiu)).mudou).toBe(true);
  });

  it('acima do teto recusa logo na primeira página (refinar o filtro), sem ler as outras', async () => {
    const buscar = vi.fn(async () => pagina([os(1)], 1, 20_000, 200));

    await expect(todasAsOS({}, buscar)).rejects.toBeInstanceOf(FiltroGrandeDemais);
    expect(buscar).toHaveBeenCalledTimes(1);
  });

  it('resposta sem a paginação é erro, não "era tudo"', async () => {
    await expect(todasAsOS({}, vi.fn(async () => ({ data: [os(1)] }) as unknown as ExecucaoOSListApiResponse))).rejects.toThrow(/sem a paginação/);
  });
});

describe('a planilha das OS', { timeout: 120_000 }, () => {
  it('a hora na célula é a de Brasília (o Excel não tem fuso)', () => {
    expect(dataNaCelula('2026-10-16T15:30:00.000Z')!.toISOString()).toBe('2026-10-16T12:30:00.000Z');
    expect(dataNaCelula(null)).toBeNull();
  });

  it('cada OS numa linha, com rótulos, datas, horas, custo e a falha; ida e volta pelo arquivo', async () => {
    const livro = await gravarEReabrir(
      await planilhaDasOS(
        [
          os(1),
          os(2, { tipo: 'PREVENTIVA', parada_inicio: null, parada_fim: null, falha_sintoma: null, minutos_parado: null, custo_real: undefined }),
          os(3, { custo_real: 0 }),
          // SN-60: parou sem o horário (opcional desde 19/out/2026)
          os(4, { equipamento_parou: true, parada_inicio: null, parada_fim: null, minutos_parado: null }),
        ],
        [],
      ),
    );
    const aba = livro.getWorksheet('OS')!;
    const coluna = (titulo: string) => COLUNAS.findIndex((c) => c.titulo === titulo) + 1;
    const valor = (linha: number, titulo: string) => aba.getRow(linha).getCell(coluna(titulo)).value;

    expect(aba.getRow(1).getCell(1).value).toBe('Nº da OS');
    expect(valor(2, 'Tipo')).toBe('Corretiva');
    expect(valor(2, 'Status')).toBe('Finalizada');
    expect(valor(2, 'Origem')).toBe('Anomalia');
    expect(valor(2, 'Planta')).toBe('Planta Norte');
    expect(valor(2, 'Instalação')).toBe('UFV Norte');
    expect(valor(2, 'Equipamento')).toBe('Inversor 3');
    expect((valor(2, 'Início') as Date).toISOString()).toBe('2026-10-16T12:30:00.000Z');
    expect(aba.getRow(2).getCell(coluna('Início')).numFmt).toBe('dd/mm/yyyy hh:mm');
    expect(valor(2, 'Tempo efetivo (h)')).toBe(2.5);
    expect(valor(2, 'HH real (h)')).toBe(5.5);
    expect(valor(2, 'Custo real')).toBe(234.5);
    expect(valor(2, 'Equipamento parou')).toBe('Sim');
    expect(valor(2, 'Tempo parado (h)')).toBe(9);
    expect(valor(2, 'Causa')).toBe('Ventilador travado');
    // A preventiva sem falha: as colunas da falha vazias, não "Não"
    expect(valor(3, 'Equipamento parou')).toBeNull();
    expect(valor(3, 'Custo real')).toBeNull();
    // Custo 0 é R$ 0,00, não vazio (a média do Excel pularia a linha)
    expect(valor(4, 'Custo real')).toBe(0);
    expect(valor(5, 'Equipamento parou')).toBe('Sim');
    expect(valor(5, 'Parou em')).toBeNull();
  });

  it('sem custos (o cliente, SERV-10), a coluna de custo não sai', async () => {
    const livro = await gravarEReabrir(await planilhaDasOS([os(1)], [], { comCustos: false }));
    const cabecalho = (livro.worksheets[0].getRow(1).values as unknown[]).slice(1).map(String);
    expect(cabecalho).not.toContain('Custo real');
    expect(cabecalho).toContain('Nº da OS');
  });

  it('a aba FILTRO diz o que foi pedido, a ordem, e avisa quando a lista mudou na leitura', async () => {
    const livro = await gravarEReabrir(await planilhaDasOS([os(1)], [['Status', 'Finalizada']], { mudou: true }));
    const linhas = livro.getWorksheet('FILTRO')!.getSheetValues().slice(1).map((l) => (l as unknown[]).slice(1, 3));

    expect(linhas).toContainEqual(['OS na planilha', 1]);
    expect(linhas).toContainEqual(['Ordem', 'da mais nova para a mais antiga (criação)']);
    expect(linhas).toContainEqual([
      'Atenção',
      'A lista mudou durante a exportação (OS criada, iniciada ou excluída no meio): exporte de novo para ter o retrato exato.',
    ]);
    expect(linhas).toContainEqual(['Status', 'Finalizada']);
  });

  it('o filtro em palavras: o rótulo da tela e o nome da opção, não o id', () => {
    const filtros = [
      { key: 'search' },
      { key: 'statusExecucao', label: 'Status', options: [{ value: 'all', label: 'Todos' }, { value: 'FINALIZADA', label: 'Finalizada' }] },
      { key: 'planta', label: 'Planta', options: [{ value: 'P1', label: 'Planta Norte' }] },
      { key: 'equipamento', label: 'Equipamento' },
      { key: 'dataInicio', label: 'De' },
      { key: 'prioridade', label: 'Prioridade', options: [{ value: 'all', label: 'Todas' }] },
    ];

    expect(
      descricaoDoFiltro({ search: 'inversor', statusExecucao: 'FINALIZADA', planta: 'P1', equipamento: 'E1', dataInicio: '2026-10-01', prioridade: 'all' }, filtros, [os(1)]),
    ).toEqual([
      ['Busca', 'inversor'],
      ['Status', 'Finalizada'],
      ['Planta', 'Planta Norte'],
      ['Equipamento', 'Inversor 3'],
      ['De', '01/10/2026'],
    ]);
  });

  // Revisão do SN-63: o card "Atrasadas" filtrava a API e a aba FILTRO não dizia
  it('o que a API recebeu de fora dos campos da tela também entra', () => {
    expect(descricaoDoFiltro({}, [], [], { atrasadas: true, tipo: 'CORRETIVA', page: 1, limit: 10 })).toEqual([
      ['Só as atrasadas', 'Sim'],
      ['Tipo', 'Corretiva'],
    ]);
  });
});
