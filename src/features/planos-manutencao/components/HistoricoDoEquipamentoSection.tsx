// src/features/planos-manutencao/components/HistoricoDoEquipamentoSection.tsx
import { useEffect, useState } from 'react';
import { History, ClipboardCheck } from 'lucide-react';
import { HistoricoOSDoEquipamento } from './HistoricoOSDoEquipamento';
import { usePlanoDoEquipamento } from './PlanoDoEquipamentoContext';
import { TarefasApiService, type TarefaApiResponse } from '@/services/tarefas.services';
import { formatApiError } from '@/utils/api-error';

const tarefasApi = new TarefasApiService();

interface HistoricoDoEquipamentoSectionProps {
  equipamentoId: string;
  classificacao?: string;
}

/**
 * O histórico do equipamento, em duas perguntas.
 *
 * "Cada tarefa está em dia?" — resolvido com o que a própria tarefa guarda
 * (`data_ultima_execucao`, `numero_execucoes`, periodicidade). É a visão de
 * quem quer saber o que falta fazer.
 *
 * "O que já passou por aqui?" — a lista de ordens de serviço e programações,
 * em HistoricoOSDoEquipamento. É a visão de quem quer rastrear o que foi feito
 * e abrir a OS. Essa consulta usa o `equipamento_id` congelado em
 * `tarefas_os`/`tarefas_programacao_os`, e não o join com a tarefa viva: trocar
 * o plano de um equipamento apaga as cópias das tarefas (hard delete
 * deliberado, porque a OS congela o conteúdo), e um histórico apoiado no join
 * se esvaziaria sozinho a cada troca.
 */

const DIAS_POR_FREQUENCIA: Record<string, number> = {
  DIARIA: 1,
  SEMANAL: 7,
  QUINZENAL: 15,
  MENSAL: 30,
  BIMESTRAL: 60,
  TRIMESTRAL: 90,
  SEMESTRAL: 180,
  ANUAL: 365,
};

const intervaloEmDias = (tarefa: TarefaApiResponse): number | null => {
  if (tarefa.frequencia === 'PERSONALIZADA') return tarefa.frequencia_personalizada ?? null;
  return DIAS_POR_FREQUENCIA[tarefa.frequencia as string] ?? null;
};

const formatarData = (valor?: Date | string | null) => {
  if (!valor) return null;
  const data = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(data.getTime())) return null;
  return data.toLocaleDateString('pt-BR');
};

/** Dias até a próxima execução; negativo quer dizer atrasada. */
const diasAteProxima = (tarefa: TarefaApiResponse): number | null => {
  const intervalo = intervaloEmDias(tarefa);
  if (!intervalo) return null;

  const base = tarefa.data_ultima_execucao ?? (tarefa as any).data_ancora;
  if (!base) return null;

  const inicio = base instanceof Date ? base : new Date(base);
  if (Number.isNaN(inicio.getTime())) return null;

  const proxima = new Date(inicio);
  proxima.setDate(proxima.getDate() + intervalo);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  proxima.setHours(0, 0, 0, 0);

  return Math.round((proxima.getTime() - hoje.getTime()) / 86400000);
};

const rotuloProxima = (tarefa: TarefaApiResponse) => {
  const dias = diasAteProxima(tarefa);
  if (dias === null) return { texto: '—', atrasada: false };
  if (dias < 0) return { texto: `atrasada ${Math.abs(dias)}d`, atrasada: true };
  if (dias === 0) return { texto: 'hoje', atrasada: true };
  return { texto: `em ${dias}d`, atrasada: false };
};

export function HistoricoDoEquipamentoSection({
  equipamentoId,
  classificacao,
}: HistoricoDoEquipamentoSectionProps) {
  const { planoAtual, refreshTarefas, ehUC } = usePlanoDoEquipamento(equipamentoId, classificacao);

  const [tarefas, setTarefas] = useState<TarefaApiResponse[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const planoId = planoAtual?.id?.trim();

  useEffect(() => {
    if (!planoId) {
      setTarefas([]);
      return;
    }

    let cancelado = false;
    setCarregando(true);
    setErro(null);

    tarefasApi
      .findAll({ plano_id: planoId, limit: 100 })
      .then((res) => {
        if (!cancelado) setTarefas(res.data || []);
      })
      .catch((error) => {
        if (!cancelado) setErro(formatApiError(error));
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [planoId, refreshTarefas]);

  if (!ehUC) return null;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
      <div className="flex items-center gap-2">
        <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">Situação das tarefas</h3>
      </div>

      {!planoId ? (
        <p className="text-sm text-muted-foreground">
          Nenhum plano vinculado. Escolha um plano em Dados técnicos para acompanhar as execuções.
        </p>
      ) : carregando ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : erro ? (
        <p className="text-sm text-destructive">{erro}</p>
      ) : tarefas.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma tarefa neste plano ainda.</p>
      ) : (
        <div>
          <div className="flex items-center gap-3 py-2 text-xs text-muted-foreground">
            <span className="min-w-0 flex-1">Tarefa</span>
            <span className="w-28 flex-shrink-0">Última execução</span>
            <span className="w-20 flex-shrink-0">Execuções</span>
            <span className="w-28 flex-shrink-0">Próxima</span>
          </div>

          {tarefas.map((tarefa) => {
            const ultima = formatarData(tarefa.data_ultima_execucao);
            const proxima = rotuloProxima(tarefa);

            return (
              <div key={tarefa.id} className="flex items-center gap-3 py-2">
                <p className="min-w-0 flex-1 text-sm text-foreground truncate">{tarefa.nome}</p>

                <span className="w-28 flex-shrink-0 text-xs text-muted-foreground">
                  {ultima ?? 'nunca'}
                </span>

                <span className="w-20 flex-shrink-0 text-xs text-muted-foreground">
                  {tarefa.numero_execucoes ?? 0}
                </span>

                <span
                  className={`w-28 flex-shrink-0 text-xs ${
                    proxima.atrasada ? 'text-foreground font-medium' : 'text-muted-foreground'
                  }`}
                >
                  {proxima.texto}
                </span>
              </div>
            );
          })}
        </div>
      )}
      </div>

      {/* A lista de OS não depende do plano vinculado: ela olha o que foi
          congelado nas ordens, então continua ali mesmo depois de trocar ou
          desvincular o plano. */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Ordens de serviço</h3>
        </div>

        <HistoricoOSDoEquipamento equipamentoId={equipamentoId} />
      </div>
    </div>
  );
}
