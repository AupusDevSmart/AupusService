/**
 * Como a instalacao de uma OP ou de uma OS aparece numa celula de tabela.
 *
 * A instalacao nao e coluna nem da programacao nem da OS: o backend a DERIVA da
 * origem (equipamento congelado na tarefa, equipamento da anomalia, ou a
 * unidade da solicitacao). Duas consequencias chegam ate aqui:
 *
 * 1. Pode nao existir. A origem MANUAL nao registra equipamento nem unidade —
 *    nao ha de onde tirar. Cair para a planta preencheria a celula com um nivel
 *    acima, respondendo outra pergunta; cair para o texto livre de `local`
 *    seria pior ainda, porque a coluna diz "Instalacao". Entao: "—".
 *
 * 2. Pode ser mais de uma. Uma OP agrupa N tarefas, que podem estar em
 *    equipamentos de instalacoes diferentes. Aqui esta a licao da coluna
 *    "Local", que foi removida por mostrar "Multiplos locais" e nao
 *    identificar servico nenhum: quando ha varias, a celula diz QUANTAS e o
 *    `title` lista os nomes — em vez de uma palavra que nao ajuda ninguem.
 */

export interface InstalacaoDaOrigem {
  id: string;
  nome: string;
}

export interface RotuloDaInstalacao {
  texto: string;
  /** Vai no `title` da celula. Vazio quando o proprio texto ja diz tudo. */
  titulo: string;
  /** Para a celula usar o tom fraco, como faz com "Sem descricao". */
  ausente: boolean;
}

export function rotuloDaInstalacao(instalacoes?: InstalacaoDaOrigem[]): RotuloDaInstalacao {
  if (!instalacoes || instalacoes.length === 0) {
    return { texto: '—', titulo: 'A origem deste registro não aponta instalação', ausente: true };
  }

  if (instalacoes.length === 1) {
    return { texto: instalacoes[0].nome, titulo: instalacoes[0].nome, ausente: false };
  }

  return {
    texto: `${instalacoes.length} instalações`,
    titulo: instalacoes.map((instalacao) => instalacao.nome).join(', '),
    ausente: false,
  };
}
