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

  // Apagar o campo no sheet não apagava nada: vazio não ia ao servidor, e o
  // backend mantinha o valor antigo — não dava para tirar o telefone de alguém
  // (achado no SN-46). Vazio vai como null; campo que o formulário nem tem, não vai.
  it('campo opcional apagado vai como null, para o servidor apagar', () => {
    const dto = mapFormDataToCreateDto(base({ telefone: '', instagram: '  ', cidade: '' }));

    expect(dto).toMatchObject({ telefone: null, instagram: null, cidade: null });
  });

  it('campo opcional preenchido vai como está; ausente do formulário, não vai', () => {
    const dto = mapFormDataToCreateDto(base({ telefone: '+5562999998888' }));

    expect(dto.telefone).toBe('+5562999998888');
    expect(dto).not.toHaveProperty('instagram');
  });
});
