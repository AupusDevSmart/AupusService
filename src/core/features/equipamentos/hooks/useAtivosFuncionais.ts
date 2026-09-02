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

export interface VinculoDaPosicao {
  id: string;
  equipamento_id: string;
  instalado_em: string;
  removido_em: string | null;
  motivo_remocao: string | null;
  equipamento?: EquipamentoDaPosicao & { fabricante?: string | null };
}

export interface PosicaoDetalhada extends AtivoFuncional {
  unidade?: { id: string; nome: string };
  anteriores: VinculoDaPosicao[];
}

/**
 * As operacoes do vinculo: ver o historico, remover e transferir.
 *
 * Separado de `useAtivosFuncionais` porque este e por POSICAO, nao por
 * instalacao — e o sheet so precisa dele quando ja existe uma posicao escolhida.
 */
export function useVinculoDaPosicao() {
  const httpClient = useHttpClient();
  const [carregando, setCarregando] = useState(false);

  const buscar = useCallback(async (posicaoId: string): Promise<PosicaoDetalhada | null> => {
    const id = posicaoId?.trim();
    if (!id) return null;
    setCarregando(true);
    try {
      const resp = await httpClient.get(`/ativos-funcionais/${id}`);
      return resp.data?.data ?? resp.data ?? null;
    } finally {
      setCarregando(false);
    }
  }, [httpClient]);

  /** Fecha o vinculo aberto e libera a posicao. O motivo fica no historico. */
  const remover = useCallback(async (posicaoId: string, motivo?: string) => {
    return httpClient.post(`/ativos-funcionais/${posicaoId.trim()}/remover`, { motivo });
  }, [httpClient]);

  /** Fecha o vinculo de origem e abre o de destino, na mesma transacao. */
  const transferir = useCallback(async (equipamentoId: string, destinoId: string, motivo?: string) => {
    return httpClient.post(`/ativos-funcionais/equipamentos/${equipamentoId.trim()}/transferir`, {
      ativo_funcional_id: destinoId.trim(),
      motivo,
    });
  }, [httpClient]);

  return { buscar, remover, transferir, carregando };
}