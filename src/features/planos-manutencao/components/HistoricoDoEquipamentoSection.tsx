// src/features/planos-manutencao/components/HistoricoDoEquipamentoSection.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, ExternalLink, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlanoDoEquipamento } from './PlanoDoEquipamentoContext';
import {
  historicoEquipamentoApi,
  type HistoricoDoEquipamento,
  type ItemHistoricoOS,
} from '@/services/historico-equipamento.services';
import { formatApiError } from '@/utils/api-error';

interface HistoricoDoEquipamentoSectionProps {
  equipamentoId: string;
  classificacao?: string;
}

/**
 * O histórico do equipamento, em duas perguntas.
 *
 * "Cada tarefa está em dia?" e "o que já passou por aqui?". Os dois blocos vêm
 * calculados do backend numa chamada só — em especial a próxima execução, que
 * usa a mesma função do agendador. Recalcular aqui já tinha feito a tela dizer
 * "atrasada" enquanto o cron considerava a tarefa em dia, porque cancelar uma
 * OS avança a âncora sem registrar execução.
 */

const formatarData = (valor: string | null) => {
  if (!valor) return '—';
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? '—' : data.toLocaleDateString('pt-BR');
};

/** Os enums do backend vêm em MAIÚSCULO_COM_UNDERLINE. */
const humanizar = (valor: string) =>
  valor
    .toLowerCase()
    .split('_')
    .join(' ')
    .replace(/^./, (c) => c.toUpperCase());

/**
 * OS de anomalia é trabalho corretivo — apareceu um problema. As de tarefa e
 * plano são preventivas, saíram do calendário. As duas contam como trabalho
 * feito no equipamento, então as duas aparecem; o rótulo é que separa.
 */
const ROTULO_ORIGEM: Record<string, string> = {
  ANOMALIA: 'Corretiva · anomalia',
  TAREFA: 'Preventiva · tarefa',
  PLANO_MANUTENCAO: 'Preventiva · plano',
  SOLICITACAO_SERVICO: 'Solicitação',
  MANUAL: 'Manual',
};

const rotuloOrigem = (origem: string) => ROTULO_ORIGEM[origem] ?? humanizar(origem || '');

/**
 * Os enums nao tem acento, entao humanizar devolvia "Em execucao". Sao poucos
 * valores e todos aparecem na tela — vale escrever cada um.
 */
const ROTULO_STATUS: Record<string, string> = {
  PENDENTE: 'Pendente',
  EM_EXECUCAO: 'Em execução',
  PAUSADA: 'Pausada',
  EXECUTADA: 'Executada',
  AUDITADA: 'Auditada',
  FINALIZADA: 'Finalizada',
  CANCELADA: 'Cancelada',
  APROVADA: 'Aprovada',
  REJEITADA: 'Rejeitada',
  PROGRAMADA: 'Programada',
  CONCLUIDA: 'Concluída',
};

const rotuloStatus = (status: string) => ROTULO_STATUS[status] ?? humanizar(status || '');

const corrretiva = (origem: string) => origem === 'ANOMALIA';

export function HistoricoDoEquipamentoSection({
  equipamentoId,
  classificacao,
}: HistoricoDoEquipamentoSectionProps) {
  const navigate = useNavigate();
  const { ehUC, refreshTarefas } = usePlanoDoEquipamento(equipamentoId, classificacao);

  const [dados, setDados] = useState<HistoricoDoEquipamento>({ tarefas: [], ordens: [] });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [expandido, setExpandido] = useState<string | null>(null);

  const id = equipamentoId?.trim();

  useEffect(() => {
    if (!id) return;

    let cancelado = false;
    setCarregando(true);
    setErro(null);

    historicoEquipamentoApi
      .obter(id)
      .then((resposta) => {
        if (!cancelado) setDados(resposta);
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
  }, [id, refreshTarefas]);

  const abrir = (item: ItemHistoricoOS) => {
    // Não precisa fechar o sheet: navegar desmonta a página de equipamentos
    // inteira, e o modal vai junto.
    navigate(
      item.tipo === 'OS'
        ? `/execucao-os?execucaoId=${item.id.trim()}`
        : `/programacao-os?programacaoId=${item.id.trim()}`,
    );
  };

  if (!ehUC) return null;

  if (carregando) return <p className="text-sm text-muted-foreground">Carregando...</p>;
  if (erro) return <p className="text-sm text-destructive">{erro}</p>;

  return (
    <div>
      {/* Não depende do plano vinculado: lê o que foi congelado nas ordens,
          então continua ali depois de trocar ou desvincular o plano. */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Ordens de serviço</h3>
        </div>

        {dados.ordens.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma ordem de serviço ou programação com tarefas deste equipamento.
          </p>
        ) : (
          <div>
            {dados.ordens.map((item) => {
              const aberto = expandido === item.id;

              return (
                <div key={`${item.tipo}:${item.id}`} className="py-2">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setExpandido(aberto ? null : item.id)}
                      className="flex items-center gap-2 min-w-0 flex-1 text-left"
                      title="Ver as tarefas deste item"
                    >
                      <ChevronDown
                        className={`h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform ${
                          aberto ? '' : '-rotate-90'
                        }`}
                      />
                      <span className="min-w-0">
                        <span className="text-sm text-foreground truncate block">
                          {item.numero} · {item.descricao}
                        </span>
                        <span
                          className={`text-xs ${
                            corrretiva(item.origem) ? 'text-foreground' : 'text-muted-foreground'
                          }`}
                        >
                          {rotuloOrigem(item.origem)}
                        </span>
                      </span>
                    </button>

                    <span className="hidden md:block w-24 flex-shrink-0 text-xs text-foreground/80">
                      {formatarData(item.data)}
                    </span>

                    <span className="hidden sm:block w-28 flex-shrink-0 text-xs text-foreground/80 truncate">
                      {rotuloStatus(item.status)}
                    </span>

                    <span className="w-16 flex-shrink-0 text-xs text-foreground/80">
                      {item.tipo === 'OS'
                        ? `${item.tarefas_concluidas}/${item.tarefas_total}`
                        : `${item.tarefas_total}`}
                    </span>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 flex-shrink-0"
                      onClick={() => abrir(item)}
                      title={item.tipo === 'OS' ? 'Abrir a ordem de serviço' : 'Abrir a programação'}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {aberto && (
                    <div className="pl-6 pt-1">
                      {item.tarefas.map((tarefa) => (
                        <div key={tarefa.id} className="flex items-center gap-3 py-1">
                          <span className="min-w-0 flex-1 text-xs text-foreground/80 truncate">
                            {tarefa.nome}
                          </span>
                          <span className="w-28 flex-shrink-0 text-xs text-muted-foreground">
                            {tarefa.data_conclusao
                              ? `concluída ${formatarData(tarefa.data_conclusao)}`
                              : rotuloStatus(tarefa.status)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
