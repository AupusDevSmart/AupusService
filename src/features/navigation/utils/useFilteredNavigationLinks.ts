import { useUserStore } from '@/store/useUserStore';
import { NavigationLink, navigationLinks } from './navigation-links';

/**
 * Retorna apenas os itens de navegacao que o usuario tem permissao de ver.
 * - Item com featureKey: requer que o usuario tenha essa permissao em `acessivel`.
 * - Item sem featureKey: sempre incluido.
 * - Grupos (com `links`) sao filtrados recursivamente e removidos se nenhum filho restar.
 */
export function useFilteredNavigationLinks() {
  const { acessivel } = useUserStore();

  const isAllowed = (link: NavigationLink): boolean => {
    if (!link.featureKey) return true;
    return acessivel.includes(link.featureKey);
  };

  const filterLinks = (links: NavigationLink[]): NavigationLink[] => {
    return links
      .map((link) => {
        const children = link.links ? filterLinks(link.links) : undefined;
        return { ...link, links: children };
      })
      .filter((link) => {
        // Grupo (tinha `links` no original): so aparece se sobrou pelo menos um filho visivel
        if (Array.isArray(link.links)) return link.links.length > 0;
        // Item folha: precisa ter permissao direta
        return isAllowed(link);
      });
  };

  return filterLinks(navigationLinks);
}
