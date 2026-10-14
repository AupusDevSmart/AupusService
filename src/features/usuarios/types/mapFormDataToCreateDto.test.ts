import { describe, expect, it } from 'vitest';
import { mapFormDataToCreateDto, type UsuarioFormData } from './index';

const base = (dados: Partial<UsuarioFormData> = {}) =>
  ({ nome: 'Fulano', email: 'f@x.com', status: 'Ativo', roleNames: 'operador', ...dados }) as UsuarioFormData;

describe('mapFormDataToCreateDto', () => {
  it('manda o tipo escolhido; sem tipo, não inventa "vendedor"', () => {
    expect(mapFormDataToCreateDto(base()).roleNames).toEqual(['operador']);
    expect(mapFormDataToCreateDto(base({ roleNames: undefined }))).not.toHaveProperty('roleNames');
  });

  it('sem mexer nas permissões, não manda a lista (o sheet pode ter aberto antes de carregá-las)', () => {
    expect(mapFormDataToCreateDto(base({ permissions: [] as never }))).not.toHaveProperty('permissions');
    expect(mapFormDataToCreateDto(base({ permissions: ['execucao_os.view'] as never }))).not.toHaveProperty('permissions');
  });

  it('mexeu: manda a lista inteira pelo nome, até vazia (é como se tiram todas as extras)', () => {
    expect(mapFormDataToCreateDto(base({ permissions: [] as never, permissoesAlteradas: true })).permissions).toEqual([]);
    expect(
      mapFormDataToCreateDto(base({ permissions: ['equipes.manage', { name: 'equipes.manage' }] as never, permissoesAlteradas: true }))
        .permissions,
    ).toEqual(['equipes.manage']);
  });

  it('o marcador da tela não vai ao servidor (o backend recusa campo fora do DTO)', () => {
    expect(mapFormDataToCreateDto(base({ permissoesAlteradas: true }))).not.toHaveProperty('permissoesAlteradas');
  });
});
