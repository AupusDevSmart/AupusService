import { useUserStore } from '@/store/useUserStore';

/**
 * Quem vê o dinheiro (da OS, da programação, dos preços de instrução e plano):
 * quem programa ou gerencia. O cliente (SERV-10) e, desde 28/out/2026, o técnico
 * de campo não veem — a API já não manda; aqui a tela tira as colunas e os
 * quadros que ficariam vazios. O técnico ainda confere as despesas de campo no
 * Executar (a API as manda só para quem executa). A mesma lista do
 * `quem-ve-os-custos.ts` da API.
 */
// Quem edita instrução ou monta proposta também: sem o preço, salvaria de volta o preço vazio
export const PERMISSOES_QUE_VEEM_CUSTOS = ['execucao_os.manage', 'programacao_os.manage', 'manutencao.manage', 'solicitacoes.manage'];

const podeVer = (acessivel: string[]) => PERMISSOES_QUE_VEEM_CUSTOS.some((p) => acessivel.includes(p));

/** Para config fora de componente (a `condition` de um campo do formulário) */
export const veCustos = (): boolean => podeVer(useUserStore.getState().acessivel);

export function useVeCustos(): boolean {
  return useUserStore((s) => podeVer(s.acessivel));
}
