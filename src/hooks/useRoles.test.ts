import { describe, expect, it } from 'vitest';
import { papeisDaApi } from './useRoles';

describe('papeisDaApi', () => {
  it('usa o nome exibido e a descrição da matriz, na ordem da hierarquia', () => {
    const papeis = papeisDaApi([
      { name: 'gerente', nome_exibido: 'Gerente de manutenção', descricao: 'Aprova', ordem: 3, permissions: [{ name: 'programacao_os.aprovar' }] },
      { name: 'operador', nome_exibido: 'Técnico de campo', escopo: 'Só as plantas em que está vinculado', ordem: 0, permissions: ['execucao_os.executar'] },
    ]);

    expect(papeis.map((p) => p.label)).toEqual(['Técnico de campo', 'Gerente de manutenção']);
    expect(papeis[0]).toMatchObject({ value: 'operador', escopo: 'Só as plantas em que está vinculado', permissions: ['execucao_os.executar'] });
  });

  it('o mesmo papel em dois guards vira um item só, com as permissões dos dois', () => {
    const papeis = papeisDaApi([
      { name: 'admin', nome_exibido: 'Administrador', ordem: 4, permissions: [{ name: 'usuarios.manage' }] },
      { name: 'admin', nome_exibido: 'Administrador', ordem: 4, role_has_permissions: [{ permissions: { name: 'usuarios.view' } }] },
    ]);
    expect(papeis).toHaveLength(1);
    expect(papeis[0].permissions).toEqual(['usuarios.manage', 'usuarios.view']);
  });

  it('papel legado (fora da matriz) aparece pelo nome técnico, depois dos da matriz', () => {
    const papeis = papeisDaApi([{ name: 'vendedor' }, { name: 'operador', nome_exibido: 'Técnico de campo', ordem: 0 }]);
    expect(papeis.map((p) => p.label)).toEqual(['Técnico de campo', 'vendedor']);
  });
});
