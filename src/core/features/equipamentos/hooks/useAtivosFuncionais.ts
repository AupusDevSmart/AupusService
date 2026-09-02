import { useCallback, useEffect, useState } from 'react';
import { useHttpClient } from '@/core/context/hooks';

export interface EquipamentoDaPosicao {
  id: string;
  nome: string;
  modelo?: string | null;
  numero_serie?: string | null;
}

export interface AtivoFuncional {
  id: string;
  nome: string;
  categoria_id: string;
  unidade_id: string;
  localizacao?: string | null;
  localizacao_especifica?: string | null;
  categoria?: { id: string; nome: string };
  /** Vem da API junto da lista: e o que permite avisar antes de salvar. */
  ocupada: boolean;
  equipamento_ativo: EquipamentoDaPosicao | null;
}

/**
 * As posicoes de uma instalacao.
 *
 * Carrega por instalacao, e nao a lista inteira, porque a escolha no sheet ja
 * vem depois da cascata planta -> instalacao. Sem o filtro seriam 204 posicoes
 * numa lista so, com nomes que se repetem entre instalacoes — a cascata e o que
 * torna a escolha inequivoca.
 */
export function useAtivosFuncionais(unidadeId?: string | null) {
  const httpClient = useHttpClient();
  const [ativos, setAtivos] = useState<AtivoFuncional[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const buscar = useCallback(async (id?: string | null) => {
    const unidade = (id ?? unidadeId)?.trim();
    if (!unidade) { setAtivos([]); return []; }

    setLoading(true);
    setErro(null);
    try {
      const resp = await httpClient.get('/ativos-funcionais', {
        params: { unidade_id: unidade },
      });
      // A API do projeto envelopa em `data` — e as vezes em `data.data`.
      const lista: AtivoFuncional[] = resp.data?.data ?? resp.data ?? [];
      setAtivos(Array.isArray(lista) ? lista : []);
      return lista;
    } catch (e: any) {
      setErro(e?.response?.data?.message ?? 'Nao foi possivel carregar as posicoes');
      setAtivos([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [httpClient, unidadeId]);

  useEffect(() => { void buscar(); }, [buscar]);

  const criar = useCallback(async (dados: {
    nome: string;
    categoria_id: string;
    unidade_id: string;
    localizacao?: string;
    localizacao_especifica?: string;
  }) => {
    const resp = await httpClient.post('/ativos-funcionais', dados);
    const criada: AtivoFuncional = resp.data?.data ?? resp.data;
    await buscar(dados.unidade_id);
    return criada;
  }, [httpClient, buscar]);

  return { ativos, loading, erro, refetch: buscar, criar };
}
