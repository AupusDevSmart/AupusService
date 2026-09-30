// src/features/planos-manutencao/components/HistoricoDoEquipamentoSection.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, ExternalLink, ChevronDown, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlanoDoEquipamento } from './PlanoDoEquipamentoContext';
import { type ItemHistoricoOS, type SituacaoDaTarefa } from '@/services/historico-equipamento.services';
import { Expandir } from '@/components/ui/expandir';

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

/**
 * Quando a tarefa roda de novo, em dias.
 *
 * Em dias e não em data porque é a forma que responde à pergunta de quem abre
 * esta tela — "o que está vencendo?" — sem obrigar a contar no calendário. A
 * data continua na coluna ao lado.
 */
const rotuloPrazo = (dias: number | null): string => {
  if (dias === null) return 'sem periodicidade';
  if (dias < 0) return `atrasada ${Math.abs(dias)} dia${Math.abs(dias) === 1 ? '' : 's'}`;
  if (dias === 0) return 'vence hoje';
  return `em ${dias} dia${dias === 1 ? '' : 's'}`;
};

/** Frequências do backend, sem acento e em maiúsculas. */
const ROTULO_FREQUENCIA: Record<string, string> = {
  DIARIA: 'Diária',
  SEMANAL: 'Semanal',
  QUINZENAL: 'Quinzenal',
  MENSAL: 'Mensal',
  BIMESTRAL: 'Bimestral',
  TRIMESTRAL: 'Trimestral',
  SEMESTRAL: 'Semestral',
  ANUAL: 'Anual',
  PERSONALIZADA: 'Personalizada',
};

const rotuloFrequencia = (frequencia: string | null) =>
  frequencia ? (ROTULO_FREQUENCIA[frequencia] ?? humanizar(frequencia)) : 'Sem periodicidade';

/**
 * A situação de UMA tarefa: quando foi feita e quando roda de novo.
 *
 * A última execução NÃO sai de `tarefas.data_ultima_execucao` — aquela coluna é
 * cache gravado ao finalizar a OS e pode ficar para trás. O backend lê as OS
 * finalizadas (`tarefas_os.data_conclusao`), que é o registro de que o trabalho
 * aconteceu.
 */
function LinhaDeSituacao({ situacao }: { situacao: SituacaoDaTarefa }) {
  const atrasada = situacao.dias_ate_proxima !== null && situacao.dias_ate_proxima < 0;
  const nunca = !situacao.ultima_execucao;

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground truncate">{situacao.nome}</p>
        <p className="text-xs text-muted-foreground">
          {rotuloFrequencia(situacao.frequencia)}
          {situacao.numero_execucoes > 0 &&
            ` · ${situacao.numero_execucoes} execução${situacao.numero_execucoes === 1 ? '' : 'ões'}`}
        </p>
      </div>

      {/* Última execução: a coluna que esta tela existe para responder. Fica
          antes da próxima porque é dela que a próxima é derivada. */}
      <span
        className={`w-28 flex-shrink-0 text-xs ${nunca ? 'text-muted-foreground' : 'text-foreground/80'}`}
        title={nunca ? 'Nenhuma ordem de serviço finalizada registrou esta tarefa' : undefined}
      >
        {nunca ? 'nunca executada' : formatarData(situacao.ultima_execucao)}
      </span>

      <span className="hidden sm:block w-24 flex-shrink-0 text-xs text-foreground/80">
        {formatarData(situacao.proxima_execucao)}
      </span>

      <span
        className={`w-28 flex-shrink-0 text-xs ${atrasada ? 'text-foreground' : 'text-muted-foreground'}`}
      >
        {rotuloPrazo(situacao.dias_ate_proxima)}
      </span>
    </div>
  );
}

export function HistoricoDoEquipamentoSection({
  equipamentoId,
  classificacao,
}: HistoricoDoEquipamentoSectionProps) {
  const navigate = useNavigate();
  // O histórico é carregado pelo contexto, e não aqui: a aba Tarefas mostra a
  // última execução ao lado de cada tarefa e precisa exatamente destes dados.
  // Duas buscas do mesmo endpoint dariam, depois de finalizar uma OS, duas
  // respostas divergentes nas duas abas do mesmo sheet.
  const {
    ehUC,
    historico: dados,
    carregandoHistorico: carregando,
    erroHistorico: erro,
  } = usePlanoDoEquipamento(equipamentoId, classificacao);

  const [expandido, setExpandido] = useState<string | null>(null);

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
    <div className="space-y-6">
      {/* Primeiro bloco: "cada tarefa está em dia?".
          Vem antes das ordens porque é a pergunta do presente — o que precisa
          ser feito. A lista de ordens é o passado, e serve para conferir. */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Situação das tarefas</h3>
        </div>

        {dados.tarefas.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma tarefa de manutenção neste equipamento. Vincule um plano em Dados técnicos.
          </p>
        ) : (
          <div>
            {/* Cabeçalho das colunas: sem ele, "12/08/2026 · 12/08/2027" são
                duas datas sem papel definido. */}
            <div className="flex items-center gap-3 pb-1 border-b text-xs text-muted-foreground">
              <span className="min-w-0 flex-1">Tarefa</span>
              <span className="w-28 flex-shrink-0">Última execução</span>
              <span className="hidden sm:block w-24 flex-shrink-0">Próxima</span>
              <span className="w-28 flex-shrink-0">Prazo</span>
            </div>

            {dados.tarefas.map((situacao) => (
              <LinhaDeSituacao key={situacao.id} situacao={situacao} />
            ))}
          </div>
        )}
      </div>

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
                        className={`h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform duration-200 ${
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

                  <Expandir aberto={aberto}>
                    <div className="pl-6 pt-1">
                      {item.tarefas.map((tarefa) => (
                        <div key={tarefa.id} className="py-1">
                          <div className="flex items-center gap-3">
                            <span className="min-w-0 flex-1 text-xs text-foreground/80 truncate">
                              {tarefa.nome}
                            </span>
                            <span className="w-28 flex-shrink-0 text-xs text-muted-foreground">
                              {tarefa.data_conclusao
                                ? `concluída ${formatarData(tarefa.data_conclusao)}`
                                : tarefa.status === 'CANCELADA'
                                  ? 'não feita'
                                  : rotuloStatus(tarefa.status)}
                            </span>
                          </div>
                          {/* Tarefa não feita: o motivo que a equipe registrou ao
                              executar. Ela continua devendo e volta na agenda. */}
                          {tarefa.status === 'CANCELADA' && tarefa.motivo_nao_feita && (
                            <p className="text-xs text-muted-foreground">Motivo: {tarefa.motivo_nao_feita}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </Expandir>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
