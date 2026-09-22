// src/core/components/common/base-table/linhas-por-pagina.ts

/**
 * Quantas linhas por pagina o usuario pode escolher numa BaseTable.
 *
 * O teto e 100 porque e o menor `@Max` entre os DTOs de listagem do
 * aupus-service-api (instrucoes, equipamentos, planos, veiculos, ferramentas,
 * reservas, agenda, tarefas). Pedir acima disso devolve 400 nessas telas.
 *
 * Mora aqui, junto da tabela, e nao no store da aplicacao: o `core/` nao
 * depende de quem o consome. O store de preferencias importa daqui.
 */
export const OPCOES_LINHAS_POR_PAGINA = [10, 25, 50, 100] as const;

export const LINHAS_POR_PAGINA_PADRAO = 50;
