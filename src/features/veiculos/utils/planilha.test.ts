// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { montarLivroPlano } from '@/lib/planilha/plana';
import { gravarEReabrir } from '@/test-utils/planilha';
import { definicaoDeVeiculos, lerVeiculos } from './planilha';

const golzin = {
  id: 'cmfo9cvba00022f2ogx71huj6',
  nome: 'Golzin',
  placa: 'NKD-1880',
  marca: 'Volksvaggen',
  modelo: 'Gol',
  anoFabricacao: 2008,
  cor: 'Branco',
  chassi: null,
  renavam: null,
  tipo: 'carro',
  tipoCombustivel: 'gasolina',
  capacidadePassageiros: 5,
  capacidadeCarga: 200,
  status: 'disponivel',
  localizacaoAtual: 'Garagem Principal',
  quilometragem: 113080,
  proximaRevisao: '2026-04-23T00:00:00.000Z',
  responsavel: 'Nicolas',
  seguradora: null,
  vencimentoSeguro: null,
  observacoes: 'sem obs',
  criadoEm: '2025-09-17T17:30:50.371Z',
  atualizadoEm: '2026-10-01T13:16:42.151Z',
} as never;

describe('planilha de veículos', () => {
  it('ida e volta: data no dia certo, STATUS fica de fora (é só informação)', async () => {
    const livro = await gravarEReabrir(await montarLivroPlano(definicaoDeVeiculos, [golzin]));
    const { registros, erros } = lerVeiculos(livro);

    expect(erros).toEqual([]);
    expect(registros).toEqual([
      {
        id: 'cmfo9cvba00022f2ogx71huj6',
        aba: 'RESUMO',
        linha: 2,
        atualizado_em: '2026-10-01T13:16:42.151Z',
        dados: {
          nome: 'Golzin',
          placa: 'NKD-1880',
          marca: 'Volksvaggen',
          modelo: 'Gol',
          anoFabricacao: 2008,
          tipo: 'carro',
          tipoCombustivel: 'gasolina',
          capacidadePassageiros: 5,
          capacidadeCarga: 200,
          quilometragem: 113080,
          localizacaoAtual: 'Garagem Principal',
          responsavel: 'Nicolas',
          proximaRevisao: '2026-04-23',
          chassi: null,
          renavam: null,
          seguradora: null,
          vencimentoSeguro: null,
          cor: 'Branco',
          observacoes: 'sem obs',
        },
      },
    ]);
  });

  it('placa vai em maiúsculas; data digitada como texto dd/mm/aaaa vale', async () => {
    const livro = await gravarEReabrir(await montarLivroPlano(definicaoDeVeiculos, [golzin]));
    const ws = livro.getWorksheet('RESUMO')!;
    const coluna = (titulo: string) => (ws.getRow(1).values as unknown[]).indexOf(titulo);
    ws.getRow(2).getCell(coluna('PLACA')).value = 'abc1d23';
    ws.getRow(2).getCell(coluna('PRÓXIMA REVISÃO')).value = '05/01/2027';

    const { registros } = lerVeiculos(livro);

    expect(registros[0].dados).toMatchObject({ placa: 'ABC1D23', proximaRevisao: '2027-01-05' });
  });

  it('obrigatório vazio é erro da planilha, sem ir ao servidor', async () => {
    const livro = await gravarEReabrir(await montarLivroPlano(definicaoDeVeiculos, [golzin]));
    const ws = livro.getWorksheet('RESUMO')!;
    ws.getRow(2).getCell((ws.getRow(1).values as unknown[]).indexOf('QUILOMETRAGEM')).value = null;

    const { registros, erros } = lerVeiculos(livro);

    expect(registros).toEqual([]);
    expect(erros).toEqual([expect.objectContaining({ linha: 2, mensagem: 'QUILOMETRAGEM: obrigatório.' })]);
  });
});
