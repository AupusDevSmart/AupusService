// src/features/programacao-os/components/origem-selector/filtrar-opcoes.ts

export interface OpcaoDaLista {
  id: string;
  titulo: string;
  /** Uma linha abaixo do título. Local, ativo, tipo — o que situa a escolha. */
  subtitulo?: string;
  /** Marcadores curtos antes do título: prioridade, status, número. */
  etiquetas?: Array<{ texto: string; alerta?: boolean }>;
}

/**
 * O filtro da lista sem paginação. Varre tudo que a linha mostra: buscar só
 * pelo título fazia a pessoa procurar por "casa de bombas" e não achar nada.
 */
export function filtrarOpcoes(opcoes: OpcaoDaLista[], busca: string): OpcaoDaLista[] {
  const termo = busca.trim().toLowerCase();
  if (!termo) return opcoes;

  return opcoes.filter((o) =>
    [o.titulo, o.subtitulo, ...(o.etiquetas ?? []).map((e) => e.texto)]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(termo),
  );
}
