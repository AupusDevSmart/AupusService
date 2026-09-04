import { useCallback, useEffect, useState } from 'react';
import { api } from '@/config/api';

export type RecursoSincronizavel = 'usuarios' | 'plantas' | 'unidades' | 'equipamentos';

export interface EstadoSincronizacao {
  registro_id: string;
  compartilhado: boolean;
  versao: number;
  origem: string | null;
  atualizado_em: string | null;
  pendentes: number;
  com_erro: boolean;
}

export interface EloDaCadeia {
  recurso: RecursoSincronizavel;
  registro_id: string;
  /** Como chamar na tela: "o proprietário", "a planta". */
  comoChamar: string;
  nome: string;
  ja_compartilhado: boolean;
}

export interface PreviaDaCadeia {
  alvo: EloDaCadeia;
  /** O que vai JUNTO, do mais basico ao mais especifico. */
  faltando: EloDaCadeia[];
}

/** O nome do outro produto, para os rotulos dizerem para ONDE vai. */
export const OUTRO_PRODUTO = import.meta.env.VITE_OUTRO_PRODUTO || 'NexOn';

/**
 * Estado de compartilhamento dos registros de uma pagina.
 *
 * Em LOTE, uma consulta por pagina, e nao uma por linha. Sao 9 a 23 linhas nas
 * telas de planta e instalacao, mas equipamentos passa de 250 — uma chamada por
 * linha ali seriam 250 requisicoes para desenhar uma coluna.
 *
 * O estado importa porque sem ele o botao pode ser um no-op sem avisar: clicar
 * em "compartilhar" no que ja esta compartilhado nao faz nada visivel, e botao
 * que nao diz o que fez vira desconfianca.
 */
export function useSincronizacao(recurso: RecursoSincronizavel, ids: string[]) {
  const [estados, setEstados] = useState<Record<string, EstadoSincronizacao>>({});
  const [carregando, setCarregando] = useState(false);

  const chave = ids.map(i => i?.trim()).filter(Boolean).sort().join(',');

  const buscar = useCallback(async () => {
    if (!chave) { setEstados({}); return; }

    setCarregando(true);
    try {
      const { data } = await api.get(`/sincronizacao/vinculos/${recurso}`, { params: { ids: chave } });
      const lista: EstadoSincronizacao[] = data?.data ?? data ?? [];
      setEstados(Object.fromEntries(lista.map(e => [e.registro_id, e])));
    } catch {
      // A coluna de estado nao pode derrubar a tabela. Sem resposta, cada linha
      // fica sem selo — melhor do que a pagina inteira falhar por causa de um
      // enfeite.
      setEstados({});
    } finally {
      setCarregando(false);
    }
  }, [recurso, chave]);

  useEffect(() => { void buscar(); }, [buscar]);

  /**
   * O que vai atravessar junto com este registro.
   *
   * Consultado ANTES de compartilhar para a confirmacao poder listar tudo. Nao
   * existe planta sem proprietario nem instalacao sem planta: sem esta consulta
   * a tela pediria consentimento para uma coisa e mandaria quatro.
   */
  const buscarPrevia = useCallback(async (id: string): Promise<PreviaDaCadeia> => {
    const { data } = await api.get(`/sincronizacao/vinculos/${recurso}/${id.trim()}/previa`);
    return data?.data ?? data;
  }, [recurso]);

  const compartilhar = useCallback(async (id: string) => {
    await api.post(`/sincronizacao/vinculos/${recurso}/${id.trim()}`);
    await buscar();
  }, [recurso, buscar]);

  const pararDeCompartilhar = useCallback(async (id: string) => {
    await api.delete(`/sincronizacao/vinculos/${recurso}/${id.trim()}`);
    await buscar();
  }, [recurso, buscar]);

  return { estados, carregando, recarregar: buscar, buscarPrevia, compartilhar, pararDeCompartilhar };
}
