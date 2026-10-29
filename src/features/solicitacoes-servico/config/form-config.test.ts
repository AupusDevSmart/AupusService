import { afterEach, describe, expect, it } from 'vitest';
import { useUserStore } from '@/store/useUserStore';
import { solicitacoesFormFields } from './form-config';

/**
 * A seção da proposta no sheet da solicitação (28/out/2026): quem monta proposta
 * a vê sempre; o cliente dono, na solicitação dele (como no PDF); o técnico não
 * vê dinheiro, então a seção nem aparece para ele.
 */
describe('a proposta no sheet da solicitação', () => {
  const proposta = solicitacoesFormFields.find((c) => c.key === 'proposta')!;
  const aparece = (entidade: unknown) => Boolean(proposta.condition?.(entidade as never, {}));
  const como = (acessivel: string[], id = 'u1') => useUserStore.setState({ acessivel: acessivel as never, user: { id } as never });

  afterEach(() => useUserStore.setState({ acessivel: [], user: null }));

  it('quem monta proposta a vê no cadastro e na edição', () => {
    como(['solicitacoes.manage']);
    expect([aparece(null), aparece({ proprietario_id: 'outro' })]).toEqual([true, true]);
  });

  it('o cliente dono a vê na solicitação dele (id aparado); a de outro e o cadastro, não', () => {
    como(['solicitacoes.view', 'solicitacoes.create'], 'dono');
    expect([aparece({ proprietario_id: 'dono ' }), aparece({ proprietario_id: 'outro' }), aparece(null)]).toEqual([true, false, false]);
  });

  it('o técnico não a vê', () => {
    como(['solicitacoes.view', 'solicitacoes.create', 'execucao_os.executar'], 't');
    expect([aparece(null), aparece({ proprietario_id: 'dono' })]).toEqual([false, false]);
  });
});
