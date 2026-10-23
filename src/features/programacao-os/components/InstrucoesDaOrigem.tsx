// src/features/programacao-os/components/InstrucoesDaOrigem.tsx
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { formatApiError } from '@/utils/api-error';

/**
 * A origem é contexto: a anomalia ou a solicitação excluída (a programação
 * cancelada devolve a origem, que pode ser excluída) não pode dar o toast de
 * erro ao abrir a OS. A falha fica no console e a seção some.
 */
const SEM_AVISO = { semAvisoGlobal: true };

type TipoDeOrigem = 'ANOMALIA' | 'PLANO_MANUTENCAO' | 'SOLICITACAO_SERVICO' | string;

export interface OrigemDasInstrucoes {
  tipo: TipoDeOrigem;
  anomaliaId?: string;
  solicitacaoId?: string;
  /** Só as tarefas escolhidas — cada uma aponta para uma instrução. */
  tarefaIds?: string[];
  planoId?: string;
}

export interface InstrucaoResumida {
  id: string;
  codigo?: string;
  nome?: string;
}

/** Tira duplicatas e linhas sem id, preservando a ordem de chegada. */
export function distintas(lista: Array<InstrucaoResumida | null | undefined>): InstrucaoResumida[] {
  const vistas = new Set<string>();
  const saida: InstrucaoResumida[] = [];

  for (const item of lista) {
    const id = String(item?.id ?? '').trim();
    if (!id || vistas.has(id)) continue;
    vistas.add(id);
    saida.push({ ...item!, id });
  }

  return saida;
}

export interface InstrucoesDaOrigemLidas {
  /** As que vêm pelas tarefas escolhidas do plano: saem com a tarefa */
  pelasTarefas: InstrucaoResumida[];
  /** As vinculadas à anomalia ou à solicitação: a programação nasce com elas (SN-86) */
  daOrigem: InstrucaoResumida[];
  /** A chave da origem lida: muda quando a origem muda, e só depois de ler */
  origemLida: string | null;
  /**
   * A anomalia ou solicitação lida (sem as tarefas): é ela que semeia a lista no
   * cadastro. Marcar uma tarefa do plano relê a origem, mas não ressemeia — a
   * avulsa acrescentada sumiria
   */
  semeaduraLida: string | null;
  /** A leitura da origem falhou: as listas vazias não querem dizer "sem instrução" */
  falhou: boolean;
  carregando: boolean;
}

/**
 * As instruções que vêm da origem da OS.
 *
 * As três origens guardam o vínculo de formas diferentes, e nenhuma precisou de
 * endpoint novo:
 *
 *   anomalia    -> `anomalias_instrucoes`, que o GET da anomalia já inclui
 *   solicitação -> `instrucoes`, que o GET da solicitação já traz
 *   plano       -> `tarefa.instrucao`, uma por tarefa escolhida
 *
 *   tarefas     -> `tarefa.instrucao` de cada uma (a programação do cron, de
 *                  vários planos), para a tela não oferecer de novo a instrução
 *                  que já vem por elas
 *
 * A mesma instrução pode chegar por duas tarefas do mesmo plano; aparece uma vez
 * só. A origem excluída (404) dá listas vazias sem toast: abrir a OS cancelada
 * não é erro. Qualquer outra falha avisa, e `falhou` diz que as listas vazias
 * não querem dizer "sem instrução".
 */
const statusDoErro = (erro: unknown) => (erro as { response?: { status?: number } } | null)?.response?.status;

export function useInstrucoesDaOrigem({ tipo, anomaliaId, solicitacaoId, tarefaIds = [], planoId }: OrigemDasInstrucoes): InstrucoesDaOrigemLidas {
  const [lidas, setLidas] = useState<Omit<InstrucoesDaOrigemLidas, 'carregando'>>({
    pelasTarefas: [],
    daOrigem: [],
    origemLida: null,
    semeaduraLida: null,
    falhou: false,
  });
  const [carregando, setCarregando] = useState(false);

  // Chaves em texto: o pai recria os arrays a cada render, e comparar por
  // referência dispararia a busca sem parar.
  const chaveTarefas = [...tarefaIds].map((t) => String(t).trim()).sort().join('|');
  const chaveDaSemeadura = [tipo, anomaliaId?.trim(), solicitacaoId?.trim()].join('#');
  const chaveDaOrigem = [chaveDaSemeadura, planoId?.trim(), chaveTarefas].join('#');

  useEffect(() => {
    let cancelado = false;

    const buscar = async (): Promise<Pick<InstrucoesDaOrigemLidas, 'pelasTarefas' | 'daOrigem'>> => {
      if (tipo === 'ANOMALIA' && anomaliaId) {
        const { anomaliasService } = await import('@/services/anomalias.service');
        const anomalia = await anomaliasService.findOne(anomaliaId.trim(), SEM_AVISO);
        const vinculos = (anomalia as { anomalias_instrucoes?: Array<{ instrucao?: InstrucaoResumida }> })
          .anomalias_instrucoes;
        return { pelasTarefas: [], daOrigem: distintas((vinculos ?? []).map((v) => v.instrucao)) };
      }

      if (tipo === 'SOLICITACAO_SERVICO' && solicitacaoId) {
        const { solicitacoesServicoService } = await import('@/services/solicitacoes-servico.service');
        const solicitacao = await solicitacoesServicoService.findOne(solicitacaoId.trim(), SEM_AVISO);
        const lista = (solicitacao as { instrucoes?: InstrucaoResumida[] }).instrucoes;
        return { pelasTarefas: [], daOrigem: distintas(lista ?? []) };
      }

      if (tipo === 'PLANO_MANUTENCAO' && planoId && chaveTarefas) {
        const escolhidas = new Set(chaveTarefas.split('|'));
        const { tarefasApi } = await import('@/services/tarefas.services');
        const tarefas = await tarefasApi.findByPlano(planoId.trim());
        return {
          daOrigem: [],
          pelasTarefas: distintas(
            (tarefas ?? [])
              .filter((t: { id: string }) => escolhidas.has(String(t.id).trim()))
              .map((t: { instrucao?: InstrucaoResumida }) => t.instrucao),
          ),
        };
      }

      if (chaveTarefas) {
        // Sem plano (a do cron junta tarefas de vários): uma a uma. A cópia apagada
        // do plano (404) só fica de fora; o servidor também não a acha
        const { tarefasApi } = await import('@/services/tarefas.services');
        const lidas = await Promise.allSettled(chaveTarefas.split('|').map((id) => tarefasApi.findOne(id, SEM_AVISO)));
        const outraFalha = lidas.find((l) => l.status === 'rejected' && statusDoErro(l.reason) !== 404);
        if (outraFalha?.status === 'rejected') throw outraFalha.reason;
        return {
          daOrigem: [],
          pelasTarefas: distintas(
            lidas.map((l) => (l.status === 'fulfilled' ? (l.value as { instrucao?: InstrucaoResumida }).instrucao : null)),
          ),
        };
      }

      return { pelasTarefas: [], daOrigem: [] };
    };

    setCarregando(true);
    void buscar()
      // Instrução é contexto, não bloqueio: se a busca falhar, a OS continua
      // sendo criada com o que o planejador acrescentar.
      .then((achadas) => ({ ...achadas, falhou: false }))
      .catch((erro: unknown) => {
        // A origem excluída é contexto e fica calada; o resto avisa
        if (!cancelado && statusDoErro(erro) !== 404) {
          toast.error('Não foi possível ler as instruções da origem', { description: formatApiError(erro) });
        }
        return { pelasTarefas: [], daOrigem: [], falhou: true };
      })
      .then((achadas) => {
        if (cancelado) return;
        setLidas({ ...achadas, origemLida: chaveDaOrigem, semeaduraLida: chaveDaSemeadura });
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
    };
    // A chave da origem resume as cinco
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaveDaOrigem]);

  return { ...lidas, carregando: carregando || lidas.origemLida !== chaveDaOrigem };
}
