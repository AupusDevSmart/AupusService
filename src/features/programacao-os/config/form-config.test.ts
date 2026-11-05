import { describe, expect, it } from 'vitest';
import { programacaoOSFormFields, programacaoOSFormGroups } from './form-config';

/**
 * Com `groups` declarado, o BaseForm monta cada grupo pela lista `fields` do
 * grupo e ignora o `group:` do campo: o campo que não está na lista não
 * aparece, sem erro. Foi assim que as instruções da origem (e os recursos
 * delas) sumiram do sheet da programação: o campo virou `instrucoes_ids` no
 * SN-86 e a lista continuou dizendo `instrucoes_origem`.
 */
describe('grupos do formulário da programação', () => {
  const chaves = new Set(programacaoOSFormFields.map((campo) => campo.key));

  it('todo nome da lista de um grupo é um campo que existe', () => {
    const fantasmas = programacaoOSFormGroups.flatMap((grupo) =>
      grupo.fields.filter((chave) => !chaves.has(chave)).map((chave) => `${grupo.key}.${chave}`),
    );
    expect(fantasmas).toEqual([]);
  });

  it('todo campo com grupo está na lista do grupo (senão não aparece)', () => {
    const fora = programacaoOSFormFields
      .filter((campo) => campo.group)
      .filter((campo) => !programacaoOSFormGroups.find((g) => g.key === campo.group)?.fields.includes(campo.key))
      .map((campo) => `${campo.group}.${campo.key}`);
    expect(fora).toEqual([]);
  });

  it('as instruções da programação aparecem no grupo da origem', () => {
    expect(programacaoOSFormGroups.find((g) => g.key === 'origem')?.fields).toContain('instrucoes_ids');
  });
});
