// src/features/maquinarios/hooks/useMaquinarios.ts
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { formatApiError } from '@/utils/api-error';
import {
  maquinariosApi,
  type CreateMaquinarioApiData,
  type MaquinarioApiResponse,
  type QueryMaquinariosParams,
} from '@/services/maquinarios.services';

const PAGINACAO_VAZIA = { page: 1, limit: 10, total: 0, totalPages: 1 };

/** A lista e as gravações do cadastro de maquinários (o mesmo desenho de `useRecursos`) */
export function useMaquinarios(filtros: QueryMaquinariosParams) {
  const [maquinarios, setMaquinarios] = useState<MaquinarioApiResponse[]>([]);
  const [paginacao, setPaginacao] = useState(() => ({ ...PAGINACAO_VAZIA, limit: filtros.limit ?? PAGINACAO_VAZIA.limit }));
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const resposta = await maquinariosApi.listar(filtros);
      setMaquinarios(resposta.data);
      setPaginacao(resposta.pagination);
    } catch (erro) {
      toast.error('Erro ao carregar maquinários', { description: formatApiError(erro) });
      setMaquinarios([]);
      setPaginacao({ ...PAGINACAO_VAZIA, limit: filtros.limit ?? PAGINACAO_VAZIA.limit });
    } finally {
      setCarregando(false);
    }
  }, [filtros]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  /** Devolve true quando deu certo: o modal só fecha assim (fechar sobre o erro perderia o que foi digitado) */
  const salvar = async (dados: CreateMaquinarioApiData, id?: string): Promise<boolean> => {
    setSalvando(true);
    try {
      if (id) {
        await maquinariosApi.atualizar(id, dados);
        toast.success('Maquinário atualizado!');
      } else {
        await maquinariosApi.criar(dados);
        toast.success('Maquinário cadastrado!');
      }
      await carregar();
      return true;
    } catch (erro) {
      toast.error(id ? 'Erro ao atualizar maquinário' : 'Erro ao cadastrar maquinário', { description: formatApiError(erro) });
      return false;
    } finally {
      setSalvando(false);
    }
  };

  const remover = async (maquinario: MaquinarioApiResponse): Promise<boolean> => {
    try {
      await maquinariosApi.remover(maquinario.id);
      toast.success('Maquinário removido!', { description: maquinario.nome });
      await carregar();
      return true;
    } catch (erro) {
      toast.error('Não foi possível remover', { description: formatApiError(erro), duration: 7000 });
      return false;
    }
  };

  return { maquinarios, paginacao, carregando, salvando, salvar, remover, recarregar: carregar };
}
