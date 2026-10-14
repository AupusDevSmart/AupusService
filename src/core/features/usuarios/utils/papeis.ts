/**
 * As regras da tela de usuário, iguais às do backend
 * (aupus-service-api/src/core/modules/usuarios/hierarquia-de-papeis.ts):
 *
 * - dar um papel exige `usuarios.create_<papel>`; super_admin dá qualquer um;
 *   papel legado (fora da matriz) não é oferecido
 * - as permissões do papel vêm do papel: não se marcam nem desmarcam; só as
 *   extras (diretas) se escolhem, e só quem gerencia usuários escolhe
 */

export interface PapelDaTela {
  value: string;
  label: string;
  description?: string;
  escopo?: string;
  /** Presente só para os papéis da matriz. */
  ordem?: number;
  permissions?: string[];
}

type TemPermissao = (...permissoes: string[]) => boolean;

/** Os papéis que quem está na tela pode dar; o atual entra sempre, para a tela mostrá-lo. */
export function papeisQuePodeDar(
  papeis: PapelDaTela[],
  temPermissao: TemPermissao,
  ehSuperAdmin: boolean,
  atual?: string,
): PapelDaTela[] {
  return papeis.filter(
    (p) => p.value === atual || (p.ordem !== undefined && (ehSuperAdmin || temPermissao(`usuarios.create_${p.value}`))),
  );
}

/** As permissões marcadas na tela: as do papel mais as extras. */
export function permissoesMarcadas(doPapel: string[], extras: string[]): Set<string> {
  return new Set([...doPapel, ...extras]);
}

/** Só as extras: o que está marcado e o papel não dá (é o que o backend grava como direta). */
export function soAsExtras(marcadas: string[], doPapel: string[]): string[] {
  const papel = new Set(doPapel);
  return [...new Set(marcadas)].filter((p) => !papel.has(p));
}
