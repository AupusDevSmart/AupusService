import { useUserStore } from '@/store/useUserStore';

/**
 * Quem vê o dinheiro da OS e da programação (SERV-10): quem executa (o técnico de
 * campo confere os outros custos no Executar) e quem programa ou gerencia. O
 * cliente só lê e não vê dinheiro nenhum — a API já não manda; aqui a tela tira
 * as colunas e os quadros que ficariam vazios. A mesma lista do
 * `quem-ve-os-custos.ts` da API.
 */
export const PERMISSOES_QUE_VEEM_CUSTOS = ['execucao_os.executar', 'execucao_os.manage', 'programacao_os.manage'];

const podeVer = (acessivel: string[]) => PERMISSOES_QUE_VEEM_CUSTOS.some((p) => acessivel.includes(p));

/** Para config fora de componente (a `condition` de um campo do formulário) */
export const veCustos = (): boolean => podeVer(useUserStore.getState().acessivel);

export function useVeCustos(): boolean {
  return useUserStore((s) => podeVer(s.acessivel));
}
