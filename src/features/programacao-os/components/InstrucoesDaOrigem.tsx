// src/features/programacao-os/components/InstrucoesDaOrigem.tsx
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { InstrucaoExpandableCard } from '@/components/common/InstrucaoExpandableCard';

type TipoDeOrigem = 'ANOMALIA' | 'PLANO_MANUTENCAO' | 'SOLICITACAO_SERVICO' | string;

interface InstrucoesDaOrigemProps {
  tipo: TipoDeOrigem;
  anomaliaId?: string;
  solicitacaoId?: string;
  /** Só as tarefas escolhidas — cada uma aponta para uma instrução. */
  tarefaIds?: string[];
  planoId?: string;
}

interface InstrucaoResumida {
  id: string;
  tag?: string;
  nome?: string;
}

/** Tira duplicatas e linhas sem id, preservando a ordem de chegada. */
function distintas(lista: Array<InstrucaoResumida | null | undefined>): InstrucaoResumida[] {
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
 * A mesma instrução pode chegar por duas tarefas do mesmo plano; aparece uma vez
 * só. E o card busca o próprio detalhe pelo id, então basta o id daqui.
 */
export function InstrucoesDaOrigem({
  tipo,
  anomaliaId,
  solicitacaoId,
  tarefaIds = [],
  planoId,
}: InstrucoesDaOrigemProps) {
  const [instrucoes, setInstrucoes] = useState<InstrucaoResumida[]>([]);
  const [carregando, setCarregando] = useState(false);

  // Chaves em texto: o pai recria os arrays a cada render, e comparar por
  // referência dispararia a busca sem parar.
  const chaveTarefas = [...tarefaIds].map((t) => String(t).trim()).sort().join('|');

  useEffect(() => {
    let cancelado = false;

    const buscar = async (): Promise<InstrucaoResumida[]> => {
      if (tipo === 'ANOMALIA' && anomaliaId) {
        const { anomaliasService } = await import('@/services/anomalias.service');
        const anomalia = await anomaliasService.findOne(anomaliaId.trim());
        const vinculos = (anomalia as { anomalias_instrucoes?: Array<{ instrucao?: InstrucaoResumida }> })
          .anomalias_instrucoes;
        return distintas((vinculos ?? []).map((v) => v.instrucao));
      }

      if (tipo === 'SOLICITACAO_SERVICO' && solicitacaoId) {
        const { solicitacoesServicoService } = await import('@/services/solicitacoes-servico.service');
        const solicitacao = await solicitacoesServicoService.findOne(solicitacaoId.trim());
        const lista = (solicitacao as { instrucoes?: InstrucaoResumida[] }).instrucoes;
        return distintas(lista ?? []);
      }

      if (tipo === 'PLANO_MANUTENCAO' && planoId && chaveTarefas) {
        const escolhidas = new Set(chaveTarefas.split('|'));
        const { tarefasApi } = await import('@/services/tarefas.services');
        const tarefas = await tarefasApi.findByPlano(planoId.trim());
        return distintas(
          (tarefas ?? [])
            .filter((t: { id: string }) => escolhidas.has(String(t.id).trim()))
            .map((t: { instrucao?: InstrucaoResumida }) => t.instrucao),
        );
      }

      return [];
    };

    setCarregando(true);
    void buscar()
      // Instrução é contexto, não bloqueio: se a busca falhar, a OS continua
      // sendo criada sem esta seção.
      .catch(() => [])
      .then((achadas) => {
        if (!cancelado) setInstrucoes(achadas);
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [tipo, anomaliaId, solicitacaoId, planoId, chaveTarefas]);

  // Sem origem escolhida ainda, ou origem sem instrução: não ocupa espaço.
  if (!carregando && instrucoes.length === 0) return null;

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium">Instruções</span>

      {carregando ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Carregando...
        </div>
      ) : (
        <div className="space-y-2">
          {instrucoes.map((instrucao) => (
            <InstrucaoExpandableCard
              key={instrucao.id}
              id={instrucao.id}
              tag={instrucao.tag}
              nome={instrucao.nome}
              disabled
            />
          ))}
        </div>
      )}
    </div>
  );
}
