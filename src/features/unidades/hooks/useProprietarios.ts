// src/features/unidades/hooks/useProprietarios.ts

import { useState, useEffect } from 'react';
import { isAxiosError } from 'axios';
import { api } from '@/config/api';
import { mensagemDoBackend } from '@/utils/api-error';

export interface ProprietarioOption {
  id: string;
  nome: string;
}

/** Usuario da listagem /usuarios, no que este hook le. */
interface UsuarioDaListagem {
  id: string;
  nome: string;
  /** O papel vem como nome ou como objeto { name }. */
  roles?: Array<string | { name?: string } | null>;
}

interface UseProprietariosReturn {
  proprietarios: ProprietarioOption[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook para buscar TODOS os usuários que podem ser proprietários
 * (roles: proprietario, admin, super_admin)
 * Busca sem paginação para garantir que todos sejam carregados
 */
export function useProprietarios(): UseProprietariosReturn {
  const [proprietarios, setProprietarios] = useState<ProprietarioOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProprietarios = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🔍 [useProprietarios] Buscando usuarios proprietarios...');

        // Backend tem cap de limit=100 no endpoint /usuarios.
        const response = await api.get('/usuarios', {
          params: {
            limit: 100,
            includeInactive: false,
          },
        });

        console.log('📨 [useProprietarios] Resposta da API:', response.data);

        // Extrair dados da resposta
        const data: UsuarioDaListagem[] = response.data?.data?.data || response.data?.data || response.data || [];

        console.log('🔍 [useProprietarios] Total de usuários retornados:', Array.isArray(data) ? data.length : 0);

        // Filtrar usuários com roles: proprietario, admin, super_admin
        const proprietariosFiltrados = data.filter((usuario) => {
          const roles = usuario.roles || [];

          const hasRole = roles.some((role) => {
            const roleName = typeof role === 'string' ? role : role?.name || '';
            return ['proprietario', 'admin', 'super_admin'].includes(roleName.toLowerCase());
          });

          return hasRole;
        });

        console.log('✅ [useProprietarios] Proprietários filtrados:', proprietariosFiltrados.length);

        // Mapear para formato esperado
        const proprietariosFormatados: ProprietarioOption[] = proprietariosFiltrados.map((usuario) => ({
          id: usuario.id,
          nome: usuario.nome,
        }));

        setProprietarios(proprietariosFormatados);
      } catch (err) {
        const resposta = isAxiosError<{ message?: string }>(err) ? err.response : undefined;
        // 403 e esperado para roles sem `usuarios.view` (ex: operador). Nao reportar
        // como erro - o filtro de proprietario simplesmente nao aparece preenchido.
        if (resposta?.status === 403) {
          console.warn('[useProprietarios] Sem permissao para listar usuarios (403). Filtro de proprietario ficara vazio.');
          setError(null);
        } else {
          console.error('❌ [useProprietarios] Erro ao buscar proprietários:', err);
          setError(mensagemDoBackend(err) || 'Erro ao carregar proprietários');
        }
        setProprietarios([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProprietarios();
  }, []);

  return { proprietarios, loading, error };
}
