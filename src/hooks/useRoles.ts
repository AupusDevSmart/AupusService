// src/hooks/useRoles.ts

import { useState, useEffect } from 'react';
import { api } from '@/config/api';
import { formatApiError } from '@/utils/api-error';

export interface Role {
  /** Nome técnico (operador, analista...). */
  value: string;
  /** Como a tela mostra (Técnico de campo, Planejador PCM...). */
  label: string;
  description?: string;
  /** O que o papel enxerga (só as plantas vinculadas, todas...). */
  escopo?: string;
  /** Posição na hierarquia; papel fora da matriz (legado) vem depois. */
  ordem?: number;
  permissions?: string[];
}

interface UseRolesReturn {
  roles: Role[];
  loading: boolean;
  error: string | null;
}

interface PapelDaApi {
  name: string;
  nome_exibido?: string;
  descricao?: string;
  escopo?: string;
  ordem?: number;
  permissions?: Array<string | { name?: string }>;
  role_has_permissions?: Array<{ permissions?: { name?: string } }>;
}

/**
 * A lista de `GET /roles` como a tela usa: nome e descrição vindos da matriz
 * do backend, um item por papel (o mesmo nome pode existir em dois guards) e
 * na ordem da hierarquia.
 */
export function papeisDaApi(dados: PapelDaApi[]): Role[] {
  const porNome = new Map<string, Role>();
  for (const papel of dados) {
    const permissoes = [
      ...(papel.role_has_permissions ?? []).map((v) => v.permissions?.name),
      ...(papel.permissions ?? []).map((p) => (typeof p === 'string' ? p : p?.name)),
    ].filter((n): n is string => !!n);
    const anterior = porNome.get(papel.name);
    porNome.set(papel.name, {
      value: papel.name,
      label: papel.nome_exibido ?? papel.name,
      description: papel.descricao,
      escopo: papel.escopo,
      ordem: papel.ordem,
      permissions: [...new Set([...(anterior?.permissions ?? []), ...permissoes])],
    });
  }
  return [...porNome.values()].sort((a, b) => (a.ordem ?? 99) - (b.ordem ?? 99) || a.label.localeCompare(b.label));
}

export function useRoles(): UseRolesReturn {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    api
      .get<PapelDaApi[]>('/roles')
      .then((resposta) => {
        if (ativo) setRoles(papeisDaApi(Array.isArray(resposta.data) ? resposta.data : []));
      })
      .catch((erro) => {
        // Sem lista inventada: um papel que não existe no banco viraria usuário sem papel.
        if (ativo) setError(formatApiError(erro));
      })
      .finally(() => {
        if (ativo) setLoading(false);
      });
    return () => {
      ativo = false;
    };
  }, []);

  return { roles, loading, error };
}
