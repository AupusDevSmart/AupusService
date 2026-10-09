// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { montarLivroDeFichas } from '@/lib/planilha/fichas';
import { gravarEReabrir } from '@/test-utils/planilha';
import { definicaoDePlantas, lerPlantas } from './planilha';

const fazenda = {
  id: 'p1                        ',
  nome: 'Fazenda NS Aparecida',
  cnpj: '77.755.667/0001-29',
  localizacao: 'Zona rural',
  horarioFuncionamento: '06:00 às 18:00',
  endereco: { logradouro: 'Fazenda NS Aparecida', bairro: 'Zona rural', cidade: 'Água Fria de Goiás', uf: 'GO', cep: '73780-000' },
  numeroUc: null,
  proprietarioId: 'u1                        ',
  proprietario: { id: 'u1', nome: 'Henrique' },
  criadoEm: null,
  atualizadoEm: null,
  unidades: [
    {
      id: 'un1',
      nome: 'Pivo 7',
      tipo: 'Carga',
      status: 'ativo',
      latitude: -14.8255967,
      longitude: -47.7265545,
      grupo: 'A',
      numeroUc: '4140010035',
      tensaoNominal: null,
      concessionariaId: 'c1',
      nomeDaConcessionaria: 'Equatorial Goiás',
    },
  ],
} as never;

describe('planilha de plantas', { timeout: 30_000 }, () => {
  it('ida e volta: endereço volta aninhado; unidade com a concessionária pelo nome e o ID ao lado', async () => {
    const livro = await gravarEReabrir(await montarLivroDeFichas(definicaoDePlantas, [fazenda]));
    const { registros, erros } = lerPlantas(livro);

    expect(erros).toEqual([]);
    const { unidades, ...cabecalho } = registros[0].dados as { unidades: Array<Record<string, unknown>> };
    expect(cabecalho).toEqual({
      nome: 'Fazenda NS Aparecida',
      cnpj: '77.755.667/0001-29',
      proprietario: 'Henrique',
      proprietario_ref: 'u1',
      numero_uc: null,
      horarioFuncionamento: '06:00 às 18:00',
      localizacao: 'Zona rural',
      endereco: { cep: '73780-000', logradouro: 'Fazenda NS Aparecida', bairro: 'Zona rural', cidade: 'Água Fria de Goiás', uf: 'GO' },
    });
    // Tensão vazia fica de fora ("vazio = mantém"), em vez de ir como null.
    expect(unidades.map(({ _linha, ...u }) => u)).toEqual([
      {
        nome: 'Pivo 7',
        tipo: 'Carga',
        status: 'ativo',
        grupo: 'A',
        numero_uc: '4140010035',
        latitude: -14.8255967,
        longitude: -47.7265545,
        concessionaria: 'Equatorial Goiás',
        id: 'un1',
        concessionaria_ref: 'c1',
      },
    ]);
  });
});
