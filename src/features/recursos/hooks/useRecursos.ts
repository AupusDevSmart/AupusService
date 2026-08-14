// src/features/recursos/hooks/useRecursos.ts
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { formatApiError } from '@/utils/api-error';
import {
  recursosApi,
  type CreateRecursoApiData,
  type QueryRecursosParams,
  type RecursoApiResponse,
} from '@/services/recursos.services';

const PAGINACAO_VAZIA = { page: 1, limit: 10, total: 0, totalPages: 1 };

export function useRecursos(filtros: QueryRecursosParams) {
  const [recursos, setRecursos] = useState<RecursoApiResponse[]>([]);
  const [paginacao, setPaginacao] = useState(PAGINACAO_VAZIA);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const resposta = await recursosApi.listar(filtros);
      setRecursos(resposta.data);
      setPaginacao(resposta.pagination);
    } catch (erro) {
      toast.error('Erro ao carregar recursos', { description: formatApiError(erro) });
      setRecursos([]);
      setPaginacao(PAGINACAO_VAZIA);
    } finally {
      setCarregando(false);
    }
  }, [filtros]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  /**
   * Devolve true quando deu certo. O modal usa isso para decidir se fecha —
   * fechar sobre um erro esconderia a mensagem e faria o usuário perder o que
   * digitou.
   */
  const salvar = async (
    dados: CreateRecursoApiData,
    id?: string,
  ): Promise<boolean> => {
    setSalvando(true);
    try {
      if (id) {
        await recursosApi.atualizar(id, dados);
        toast.success('Recurso atualizado!');
      } else {
        await recursosApi.criar(dados);
        toast.success('Recurso cadastrado!');
      }
      await carregar();
      return true;
    } catch (erro) {
      toast.error(id ? 'Erro ao atualizar recurso' : 'Erro ao cadastrar recurso', {
        description: formatApiError(erro),
      });
      return false;
    } finally {
      setSalvando(false);
    }
  };

  const remover = async (recurso: RecursoApiResponse): Promise<boolean> => {
    try {
      await recursosApi.remover(recurso.id);
      toast.success('Recurso removido!', { description: recurso.nome });
      await carregar();
      return true;
    } catch (erro) {
      // O backend recusa quando o recurso está em uso e explica onde. A
      // duração é maior porque a mensagem tem instrução a seguir.
      toast.error('Não foi possível remover', {
        description: formatApiError(erro),
        duration: 7000,
      });
      return false;
    }
  };

  return { recursos, paginacao, carregando, salvando, salvar, remover, recarregar: carregar };
}
