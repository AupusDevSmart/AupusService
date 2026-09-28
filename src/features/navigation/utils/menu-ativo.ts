import type { NavigationLink } from './navigation-links';

/** Cor do item ativo do menu (item, subitem e painel flutuante). */
export const COR_ATIVA =
  'bg-service-verde/15 text-service-link-claro hover:bg-service-verde/20 hover:text-service-link-claro ' +
  'dark:bg-service-verde/25 dark:text-service-verde dark:hover:bg-service-verde/35 dark:hover:text-service-verde';

/**
 * `hover:bg-accent/60` nao existe aqui: os tokens do tema sao `var()` sem canal
 * de alpha, e o Tailwind nao gera a classe. O valor arbitrario aplica a
 * opacidade direto no HSL cru da sidebar.
 */
export const COR_INATIVA =
  'text-muted-foreground hover:bg-[hsl(var(--sidebar-accent)/0.6)] hover:text-foreground';

/**
 * Peso da rota para a pagina atual: o tamanho da rota se ela casa (igual ou
 * prefixo por segmento), -1 se nao casa. Mais longa = mais especifica.
 */
function casa(rota: string, pathname: string): number {
  if (pathname === rota || pathname.startsWith(rota.endsWith('/') ? rota : `${rota}/`)) {
    return rota.length;
  }
  return -1;
}

/**
 * Folha do menu que corresponde a pagina; se varias servem, ganha a mais
 * especifica. Telas internas (`/cadastros/plantas/123/operadores`) marcam o item
 * de onde vieram; `ativoEm` cobre as que tem outro nome.
 */
export function acharAtivo(links: NavigationLink[], pathname: string): string | null {
  let melhorKey: string | null = null;
  let melhorPeso = -1;
  const visitar = (itens: NavigationLink[]) => {
    for (const item of itens) {
      if (item.links?.length) {
        visitar(item.links);
        continue;
      }
      for (const rota of [item.path, ...(item.ativoEm ?? [])]) {
        const peso = casa(rota, pathname);
        if (peso > melhorPeso) {
          melhorPeso = peso;
          melhorKey = item.key;
        }
      }
    }
  };
  visitar(links);
  return melhorKey;
}

/** Grupo ativo: algum descendente e o item ativo. */
export function contemAtivo(item: NavigationLink, ativoKey: string | null): boolean {
  if (!ativoKey) return false;
  if (item.key === ativoKey) return true;
  return item.links?.some((filho) => contemAtivo(filho, ativoKey)) ?? false;
}
