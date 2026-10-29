// src/features/solicitacoes-servico/utils/como-se-calcula.ts
import type { Explicacao } from '@/components/common/ComoSeCalcula';
import { percentualNaTela, type Proposta } from '@/services/proposta.services';

const pct = (valor: number | null | undefined) => `${percentualNaTela(valor ?? 0)}%`;

/**
 * As legendas da proposta (29/out/2026): como cada número sai, com os percentuais
 * DESTA proposta. A conta é a do servidor (`conta-da-proposta.ts` dos dois lados).
 * `interna`: quem monta a proposta vê a conta inteira; o cliente, só o que os
 * totais querem dizer (a margem e o custo são da empresa, como no PDF dele).
 */
export function explicacoesDaProposta(p: Proposta, interna: boolean) {
  const imposto = pct(p.imposto_percentual);
  const margem = pct(p.margem_percentual);

  const planejamento: Explicacao = {
    rotulo: 'Planejamento',
    linhas: [
      'Dias sugeridos: as horas dos passos das instruções, uma depois da outra, em jornadas de 8 h, arredondado para cima (6h20 dá 1 dia; 9 h, 2).',
      'Ida e volta: o dobro da distância, até você mudar.',
      'Os números enchem as linhas novas das tabelas: deslocamento com os dias e o km de ida e volta; diárias com pessoas × dias (pernoite e hospedagem: pessoas × noites fora).',
      'Equipe, reserva do veículo e km de verdade são da programação e da execução.',
    ],
  };
  const tabelas: Explicacao[] = [
    { rotulo: 'Frete', linhas: ['Total = viagens × km por viagem × R$ por km + valor fixo.'] },
    { rotulo: 'Deslocamento', linhas: ['Total = dias × diária do veículo + km × R$ por km.'] },
    { rotulo: 'Diárias', linhas: ['Total = quantidade × valor (café, almoço, jantar, pernoite).'] },
    {
      rotulo: 'As três tabelas',
      linhas: [
        '"Do catálogo" copia o nome e o preço do recurso: reajustar o catálogo depois não muda esta proposta.',
        'A linha desmarcada fica na proposta, fora da conta. A linha sem nome não se grava.',
        'No PDF do cliente, as três viram uma linha só: "Logística e mobilização", pelo preço de venda.',
      ],
    },
  ];
  const adicionais: Explicacao = {
    rotulo: 'Custos adicionais',
    linhas: [
      'Somam ao custo dos serviços (ART, locação, terceiros).',
      'FD (faturamento direto): o cliente paga o fornecedor. Entra no investimento global sem imposto, margem nem desconto; leva só a administração do faturamento direto.',
    ],
  };

  const conta: Explicacao[] = interna
    ? [
        { rotulo: 'Custo dos serviços', linhas: ['Instruções + frete, deslocamento e diárias + custos adicionais (sem o faturamento direto).'] },
        {
          rotulo: 'Preço dos serviços',
          linhas: [
            `Custo dos serviços ÷ (1 − imposto ${imposto} − margem ${margem}). Imposto e margem "por dentro": saem do preço, não do custo.`,
            'O preço de venda de cada instrução é a parte dela nesse preço, na proporção do custo (o resto dos centavos vai para a maior).',
          ],
        },
        {
          rotulo: 'Administração',
          linhas: [
            `(${pct(p.adm_servicos_percentual)} do custo dos serviços + ${pct(p.adm_fd_percentual)} do faturamento direto) ÷ (1 − imposto ${imposto}).`,
            'Leva só o imposto, sem margem: a administração já é receita da Aupus.',
          ],
        },
        {
          rotulo: 'Desconto',
          linhas: [
            'Em % ou em R$, sobre o investimento global (com o faturamento direto). Sai do faturamento da Aupus, até ele: o direto é nota do fornecedor.',
            'O imposto e a margem efetiva se recalculam depois do desconto.',
          ],
        },
        { rotulo: 'Total faturado pela Aupus', linhas: ['Preço dos serviços + administração − desconto.'] },
        { rotulo: 'Imposto', linhas: [`${imposto} do total faturado pela Aupus.`] },
        {
          rotulo: 'Margem efetiva',
          linhas: [
            '(Total faturado pela Aupus − imposto − custo dos serviços) ÷ total faturado pela Aupus.',
            `Passa da margem definida (${margem}) por causa da administração; fica abaixo quando há desconto (aviso em vermelho).`,
          ],
        },
        { rotulo: 'Investimento global', linhas: ['Total faturado pela Aupus + faturamento direto.'] },
      ]
    : [
        { rotulo: 'Total faturado pela Aupus', linhas: ['Os serviços, a logística, os custos adicionais e a administração, já com o desconto e os impostos.'] },
        { rotulo: 'Faturamento direto', linhas: ['Pago por você direto ao fornecedor, não à Aupus.'] },
        { rotulo: 'Investimento global', linhas: ['Total faturado pela Aupus + faturamento direto.'] },
      ];

  const fluxo: Explicacao[] = [
    { rotulo: 'Registrada', linhas: ['A proposta está em edição: valores, tabelas e percentuais mudam à vontade.'] },
    {
      rotulo: 'Proposta revisada',
      linhas: [
        'Revisar trava a proposta e libera a programação. Quem monta a proposta também revisa.',
        'A programação herda dela o valor de cada instrução, o frete, o deslocamento, as diárias, os custos adicionais (sem o faturamento direto) e o pedido de veículo.',
      ],
    },
    { rotulo: 'Reabrir', linhas: ['A revisada ou a não aprovada volta a registrada, para editar; para programar, revise de novo.'] },
    { rotulo: 'Não aprovada', linhas: ['O cliente recusou: o motivo fica no histórico. Reaberta, a proposta volta à edição.'] },
    { rotulo: 'Programada e finalizada', linhas: ['A proposta fica como documento. Cancelada a programação, a solicitação volta a revisada.'] },
  ];

  return { planejamento, tabelas, adicionais, conta, fluxo };
}
