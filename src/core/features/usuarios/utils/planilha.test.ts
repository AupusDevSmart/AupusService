// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { montarLivroPlano } from '@/lib/planilha/plana';
import { gravarEReabrir } from '@/test-utils/planilha';
import { definicaoDeUsuarios, lerUsuarios } from './planilha';

const usuario = (extra: Record<string, unknown> = {}) =>
  ({
    id: 'u1                        ',
    nome: 'Maria',
    email: 'maria@empresa.com.br',
    status: 'Ativo',
    telefone: '62999998888',
    cpf_cnpj: null,
    cep: '01001-000',
    estado: 'SP',
    cidade: 'São Paulo',
    endereco: null,
    roles: ['operador'],
    updated_at: null,
    plantasOperadas: ['Planta A', 'Planta B'],
    ...extra,
  }) as never;

describe('planilha de usuários', { timeout: 30_000 }, () => {
  it('ida e volta: TIPO volta como o nome do papel; plantas operadas ficam de fora', async () => {
    const livro = await gravarEReabrir(await montarLivroPlano(definicaoDeUsuarios, [usuario()]));
    const { registros, erros } = lerUsuarios(livro);

    expect(erros).toEqual([]);
    expect(registros[0]).toMatchObject({ id: 'u1', atualizado_em: null });
    expect(registros[0].dados).toEqual({
      nome: 'Maria',
      status: 'Ativo',
      tipo: 'operador',
      email: 'maria@empresa.com.br',
      telefone: '62999998888',
      cpfCnpj: null,
      cep: '01001-000',
      estado: 'SP',
      cidade: 'São Paulo',
      endereco: null,
    });
  });

  it('papel legado que a tela não oferece volta como veio (o servidor só troca se mudar)', async () => {
    const livro = await gravarEReabrir(await montarLivroPlano(definicaoDeUsuarios, [usuario({ roles: ['vendedor'] })]));

    expect(lerUsuarios(livro).registros[0].dados.tipo).toBe('vendedor');
  });

  it('telefone e CEP continuam texto (o Excel não come zero nem vira número)', async () => {
    const livro = await gravarEReabrir(
      await montarLivroPlano(definicaoDeUsuarios, [usuario({ telefone: '06299998888', cep: '01001000' })]),
    );

    expect(lerUsuarios(livro).registros[0].dados).toMatchObject({ telefone: '06299998888', cep: '01001000' });
  });
});
