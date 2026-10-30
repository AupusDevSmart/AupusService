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
      'Basta a distância de ida: o resto se calcula com os valores do botão "Padrões" da página. Campo vazio usa o calculado (em cinza); o digitado manda.',
      'Ida e volta: o dobro da ida. Interno na obra: vazio, uma parte da ida e volta. Pessoas: vazio, as do padrão.',
      'Estrada: o tempo a cada 100 km do padrão. Se a ida passa do limite do bate-volta, a equipe dorme no local; as noites digitadas mandam (com noites, dorme; com zero, volta todo dia).',
      'Dias: as horas dos passos das instruções, uma depois da outra, em jornadas de 8 h, para cima. Dormindo no local, a viagem de ida e de volta soma às horas; no bate-volta, sai de cada dia.',
      'Noites fora: dormindo no local, os dias menos um; no bate-volta, nenhuma.',
      'Veículos: as pessoas ÷ as pessoas por veículo do padrão, para cima. Km de cada um: a ida e volta (no bate-volta, uma por dia) + o interno.',
      'A revisão grava o calculado nos campos: a proposta revisada e o PDF dela não mudam com os padrões de depois.',
      'Equipe, reserva do veículo e km de verdade são da programação e da execução.',
    ],
  };
  const tabelas: Explicacao[] = [
    { rotulo: 'Frete', linhas: ['Total = viagens × km por viagem × R$ por km + valor fixo.'] },
    { rotulo: 'Deslocamento', linhas: ['Total = veículos × km × R$ por km. Veículos vazio é 1.'] },
    { rotulo: 'Diárias', linhas: ['Total = unidades × valor (café, almoço, jantar, pernoite).'] },
    {
      rotulo: 'Linhas automáticas',
      linhas: [
        'Calculadas pelo planejamento (o ícone de varinha): "Veículo da equipe" (veículos × km por veículo × R$ por km), almoço (pessoas × dias), café da manhã, jantar e pernoite (pessoas × noites fora).',
        'Acompanham quando o km, os dias, as pessoas ou as noites mudam. O preço é o padrão do dia em que a linha nasceu, e se ajusta na linha. A que o planejamento não pede mais (sem noites, o pernoite) fica com zero e volta com o preço que tinha.',
        'Mudar a quantidade, os dias ou o km de uma delas a deixa "ajustada": ela para de acompanhar até você clicar em "ajustada" para voltar ao automático.',
        'Para tirar uma da conta, desmarque-a: removida, ela voltaria no próximo cálculo.',
      ],
    },
    {
      rotulo: 'As três tabelas',
      linhas: [
        'A linha desmarcada fica na proposta, fora da conta. A linha sem nome não se grava.',
        'No PDF do cliente vão o nome e as quantidades de cada linha, sem valor: de valor, só o investimento global.',
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
