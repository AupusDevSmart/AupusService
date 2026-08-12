// src/features/planos-manutencao/components/HistoricoOSDoEquipamento.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ExternalLink, ChevronDown } from 'lucide-react';
import {
  historicoEquipamentoApi,
  type ItemHistoricoOS,
} from '@/services/historico-equipamento.services';
import { formatApiError } from '@/utils/api-error';

interface HistoricoOSDoEquipamentoProps {
  equipamentoId: string;
}

const formatarData = (valor: string | null) => {
  if (!valor) return '—';
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? '—' : data.toLocaleDateString('pt-BR');
};

/** O status vem em MAIÚSCULO_COM_UNDERLINE do enum do backend. */
const rotuloStatus = (status: string) =>
  status
    .toLowerCase()
    .split('_')
    .join(' ')
    .replace(/^./, (c) => c.toUpperCase());

export function HistoricoOSDoEquipamento({ equipamentoId }: HistoricoOSDoEquipamentoProps) {
  const navigate = useNavigate();

  const [itens, setItens] = useState<ItemHistoricoOS[]>([]);
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
      .listar(id)
      .then((lista) => {
        if (!cancelado) setItens(lista);
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
  }, [id]);

  const abrir = (item: ItemHistoricoOS) => {
    // Nao precisa fechar o sheet: navegar desmonta a pagina de equipamentos
    // inteira, e o modal vai junto.
    const destino =
      item.tipo === 'OS'
        ? `/execucao-os?execucaoId=${item.id.trim()}`
        : `/programacao-os?programacaoId=${item.id.trim()}`;

    navigate(destino);
  };

  if (carregando) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }

  if (erro) {
    return <p className="text-sm text-destructive">{erro}</p>;
  }

  if (itens.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma ordem de serviço ou programação com tarefas deste equipamento.
      </p>
    );
  }

  return (
    <div>
      {itens.map((item) => {
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
                <span className="text-sm text-foreground truncate">
                  {item.numero} · {item.descricao}
                </span>
              </button>

              <span className="hidden md:block w-24 flex-shrink-0 text-xs text-muted-foreground">
                {formatarData(item.data)}
              </span>

              <span className="hidden sm:block w-28 flex-shrink-0 text-xs text-muted-foreground truncate">
                {rotuloStatus(item.status)}
              </span>

              <span className="w-16 flex-shrink-0 text-xs text-muted-foreground">
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
                    <span className="min-w-0 flex-1 text-xs text-muted-foreground truncate">
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
  );
}
