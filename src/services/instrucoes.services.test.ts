import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/config/api';
import { instrucoesApi } from '@/services/instrucoes.services';

vi.mock('@/config/api', () => ({
  api: { put: vi.fn(async () => ({ data: {} })), post: vi.fn(async () => ({ data: {} })) },
}));

/**
 * A ordem das sub-instruções é a posição na lista (SN-12). Arrastar só
 * reordenava o array, e o payload reenviava o `ordem` antigo de cada passo:
 * o backend grava `ordem` quando vem, e a ordem nova se perdia ao salvar.
 */
describe('instrucoesApi: ordem das sub-instruções', () => {
  beforeEach(() => vi.mocked(api.put).mockClear());

  const passo = (descricao: string, ordem: number) => ({ descricao, ordem, obrigatoria: false });
  const enviadas = () => vi.mocked(api.put).mock.calls[0][1] as { sub_instrucoes: { descricao: string; ordem: number }[] };

  it('a ordem enviada é a posição na lista (arrastar grava)', async () => {
    // "Desligar" foi arrastado para o topo: o array mudou, o `ordem` antigo não
    await instrucoesApi.update('i1', { sub_instrucoes: [passo('Desligar', 3), passo('Limpar', 1), passo('Religar', 2)] });

    expect(enviadas().sub_instrucoes.map((s) => [s.descricao, s.ordem])).toEqual([
      ['Desligar', 1],
      ['Limpar', 2],
      ['Religar', 3],
    ]);
  });

  it('o que o servidor gerencia não vai no payload', async () => {
    const vindaDaApi = { ...passo('Limpar', 1), id: 's1', instrucao_id: 'i1', created_at: 'x' };
    await instrucoesApi.update('i1', { sub_instrucoes: [vindaDaApi] });

    expect(enviadas().sub_instrucoes[0]).not.toHaveProperty('id');
  });
});

/**
 * O payload por lista BRANCA (SN-85). O BaseModal semeia o formulário com a
 * instrução inteira, e o `forbidNonWhitelisted` do backend recusa o que o DTO
 * não tem: com a lista negra de antes, o custo e o total de maquinários que a
 * resposta passou a trazer voltariam no PUT e o salvar quebraria.
 */
describe('instrucoesApi: só o que o DTO aceita vai no payload', () => {
  beforeEach(() => vi.mocked(api.put).mockClear());
  const enviado = () => vi.mocked(api.put).mock.calls[0][1] as Record<string, unknown>;

  it('a instrução que veio da API volta sem os campos do servidor, e as linhas sem o item embutido', async () => {
    await instrucoesApi.update('i1', {
      id: 'i1',
      codigo: 'INST-006',
      nome: 'Limpeza',
      descricao: 'x',
      frente: 'Elétrica',
      prazo_inicio_relativo: '5',
      duracao_dias: '',
      status: 'ATIVA',
      ativo: true,
      custo: 480,
      custo_por_grupo: { recursos: 480, maquinario: 0, materiais: 0 },
      horas_dos_passos: 2,
      total_maquinarios: 1,
      created_at: 'x',
      anexos: [],
      recursos: [
        {
          id: 'l1',
          recurso_id: 'r1                        ',
          recurso: { id: 'r1', nome: 'Eletricista' },
          quantidade: '2',
          duracao_horas: 3,
          fator_perda: 0,
          fornecido_pelo_cliente: false,
          distancia_km: null,
          preco_proprio: '',
          subtotal: 480,
          unidades: 3,
          grupo: 'recursos',
        },
      ],
      maquinarios: [{ id: 'm1', maquinario_id: 'mq1 ', maquinario: { nome: 'Munck' }, quantidade: 1, duracao_horas: 8, subtotal: 300 }],
    });

    expect(enviado()).toEqual({
      codigo: 'INST-006',
      nome: 'Limpeza',
      descricao: 'x',
      frente: 'Elétrica',
      // O número do formulário vem em texto; apagado é o padrão (1 dia), não "mantém"
      prazo_inicio_relativo: 5,
      duracao_dias: 1,
      status: 'ATIVA',
      ativo: true,
      recursos: [
        { recurso_id: 'r1', quantidade: 2, duracao_horas: 3, fator_perda: 0, fornecido_pelo_cliente: false, distancia_km: null, preco_proprio: null },
      ],
      maquinarios: [{ maquinario_id: 'mq1', quantidade: 1, duracao_horas: 8, distancia_km: null, preco_proprio: null }],
    });
  });

  it('o passo leva a disciplina, as horas e o registro; unidade e faixa só na leitura', async () => {
    await instrucoesApi.update('i1', {
      sub_instrucoes: [
        { descricao: 'Medir', obrigatoria: true, tipo: 'eletrico', duracao_horas: 0.5, registro: 'LEITURA', unidade: ' V ', valor_minimo: 10, valor_maximo: 20 },
        { descricao: 'Limpar', obrigatoria: false, tipo: null, duracao_horas: null, unidade: 'sobrou', valor_minimo: 1 },
      ],
    });

    expect((enviado().sub_instrucoes as unknown[])).toEqual([
      { descricao: 'Medir', obrigatoria: true, tipo: 'eletrico', duracao_horas: 0.5, ordem: 1, registro: 'LEITURA', exige_foto: false, unidade: 'V', valor_minimo: 10, valor_maximo: 20 },
      { descricao: 'Limpar', obrigatoria: false, tipo: null, duracao_horas: null, ordem: 2, registro: 'VERIFICACAO', exige_foto: false },
    ]);
  });
});
