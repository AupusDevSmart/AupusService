// src/features/planos-manutencao/components/TarefasExpandedRow.tsx
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox } from '@aupus/shared-pages';
import { Eye, Pencil, Trash2, Plus, ClipboardList } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';
import { tarefasApi, type TarefaApiResponse } from '@/services/tarefas.services';
import { instrucoesApi, type FrequenciaTarefa } from '@/services/instrucoes.services';
import { toast } from '@/hooks/use-toast';

const frequenciaOptions: Array<{ value: FrequenciaTarefa; label: string }> = [
  { value: 'DIARIA', label: 'Diária' },
  { value: 'SEMANAL', label: 'Semanal' },
  { value: 'QUINZENAL', label: 'Quinzenal' },
  { value: 'MENSAL', label: 'Mensal' },
  { value: 'BIMESTRAL', label: 'Bimestral' },
  { value: 'TRIMESTRAL', label: 'Trimestral' },
  { value: 'SEMESTRAL', label: 'Semestral' },
  { value: 'ANUAL', label: 'Anual' },
  { value: 'PERSONALIZADA', label: 'Personalizada' }
];

const criticidadeOptions = [
  { value: 1, label: 'Muito Baixa' },
  { value: 2, label: 'Baixa' },
  { value: 3, label: 'Média' },
  { value: 4, label: 'Alta' },
  { value: 5, label: 'Muito Alta' }
];

const labelFrequencia = (tarefa: TarefaApiResponse): string => {
  if (tarefa.frequencia === 'PERSONALIZADA') {
    return tarefa.frequencia_personalizada
      ? `A cada ${tarefa.frequencia_personalizada} dias`
      : 'Personalizada';
  }
  return frequenciaOptions.find(opt => opt.value === tarefa.frequencia)?.label || 'Sem periodicidade';
};

const labelCriticidade = (criticidade?: number): string =>
  criticidadeOptions.find(opt => opt.value === criticidade)?.label || 'N/A';

// O backend responde ora com `message` string, ora com array (class-validator),
// ora aninhado em `error.message`.
const extrairMensagemErro = (error: unknown, fallback: string): string => {
  const resposta = (error as {
    response?: { data?: { error?: { message?: unknown }; message?: unknown } };
    message?: unknown;
  })?.response?.data;

  const mensagem =
    resposta?.error?.message ?? resposta?.message ?? (error as { message?: unknown })?.message;

  if (Array.isArray(mensagem)) return mensagem.join(', ');
  return typeof mensagem === 'string' && mensagem ? mensagem : fallback;
};

interface TarefasExpandedRowProps {
  planoId: string;
  instrucoesOptions: Array<{ value: string; label: string }>;
  // Muda quando a página salva uma tarefa pelo sheet, forçando o recarregamento.
  refreshToken?: number;
  onVerTarefa: (tarefa: TarefaApiResponse) => void;
  onEditarTarefa: (tarefa: TarefaApiResponse) => void;
  // Avisa a página para atualizar as estatísticas do plano na linha.
  onTarefasChange?: () => void;
}

export function TarefasExpandedRow({
  planoId,
  instrucoesOptions,
  refreshToken = 0,
  onVerTarefa,
  onEditarTarefa,
  onTarefasChange
}: TarefasExpandedRowProps) {
  const { user } = useUserStore();

  const [tarefas, setTarefas] = useState<TarefaApiResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Cadastro rápido: só instrução, periodicidade e criticidade.
  // O restante da tarefa é copiado da instrução pelo backend.
  const [instrucaoId, setInstrucaoId] = useState('');
  const [frequencia, setFrequencia] = useState<FrequenciaTarefa>('MENSAL');
  const [frequenciaPersonalizada, setFrequenciaPersonalizada] = useState(30);
  const [criticidade, setCriticidade] = useState(3);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregarTarefas = useCallback(async () => {
    setLoading(true);
    try {
      const lista = await tarefasApi.findByPlano(planoId.trim());
      setTarefas(Array.isArray(lista) ? lista : []);
    } catch (error) {
      console.error('Erro ao carregar tarefas do plano:', error);
      setTarefas([]);
    } finally {
      setLoading(false);
    }
  }, [planoId]);

  useEffect(() => {
    carregarTarefas();
  }, [carregarTarefas, refreshToken]);

  const handleAdicionar = async () => {
    if (!instrucaoId) return;

    setSalvando(true);
    setErro(null);

    try {
      await instrucoesApi.adicionarAoPlano(instrucaoId.trim(), {
        plano_manutencao_id: planoId.trim(),
        frequencia,
        criticidade,
        ...(frequencia === 'PERSONALIZADA' && { frequencia_personalizada: frequenciaPersonalizada }),
        ...(user?.id && { criado_por: user.id })
      });

      // Periodicidade e criticidade ficam como estão: em cadastro em massa a
      // sequência costuma repetir os dois e variar só a instrução.
      setInstrucaoId('');
      toast({ title: 'Tarefa adicionada ao plano' });
      await carregarTarefas();
      onTarefasChange?.();
    } catch (error) {
      setErro(extrairMensagemErro(error, 'Erro ao adicionar tarefa'));
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async (tarefa: TarefaApiResponse) => {
    const nome = tarefa.nome || tarefa.tag || 'esta tarefa';
    if (!confirm(`Deseja remover a tarefa "${nome}" deste plano?`)) return;

    try {
      await tarefasApi.remove(tarefa.id.trim());
      toast({ title: 'Tarefa removida' });
      await carregarTarefas();
      onTarefasChange?.();
    } catch (error) {
      console.error('Erro ao remover tarefa:', error);
      toast({ title: 'Erro ao remover tarefa', variant: 'destructive' });
    }
  };

  return (
    <div className="px-4 py-3 space-y-3 border-t">
      {/* Cadastro rápido */}
      <div className="flex flex-col lg:flex-row lg:items-end gap-2">
        <div className="flex-1 min-w-0">
          <Label className="text-xs text-muted-foreground mb-1 block">Instrução</Label>
          <Combobox
            options={instrucoesOptions}
            value={instrucaoId || undefined}
            onValueChange={(val) => setInstrucaoId(val || '')}
            placeholder="Selecione uma instrução..."
            searchPlaceholder="Buscar instrução..."
            emptyText="Nenhuma instrução encontrada"
          />
        </div>

        <div className="w-full lg:w-44">
          <Label className="text-xs text-muted-foreground mb-1 block">Periodicidade</Label>
          <select
            value={frequencia}
            onChange={(e) => setFrequencia(e.target.value as FrequenciaTarefa)}
            className="w-full h-9 px-2 text-sm border rounded bg-background text-foreground"
          >
            {frequenciaOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {frequencia === 'PERSONALIZADA' && (
          <div className="w-full lg:w-32">
            <Label className="text-xs text-muted-foreground mb-1 block">Dias</Label>
            <Input
              type="number"
              min={1}
              value={frequenciaPersonalizada}
              onChange={(e) => setFrequenciaPersonalizada(Number(e.target.value))}
              className="h-9"
            />
          </div>
        )}

        <div className="w-full lg:w-40">
          <Label className="text-xs text-muted-foreground mb-1 block">Criticidade</Label>
          <select
            value={criticidade}
            onChange={(e) => setCriticidade(Number(e.target.value))}
            className="w-full h-9 px-2 text-sm border rounded bg-background text-foreground"
          >
            {criticidadeOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <Button
          onClick={handleAdicionar}
          disabled={!instrucaoId || salvando}
          size="sm"
          className="h-9 flex-shrink-0"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          {salvando ? 'Adicionando...' : 'Adicionar'}
        </Button>
      </div>

      {erro && (
        <div className="p-2 text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded">
          {erro}
        </div>
      )}

      {/* Lista de tarefas */}
      {loading ? (
        <p className="py-4 text-center text-sm text-muted-foreground">Carregando tarefas...</p>
      ) : tarefas.length === 0 ? (
        <div className="py-6 text-center">
          <ClipboardList className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">Nenhuma tarefa neste plano ainda.</p>
        </div>
      ) : (
        <div className="border rounded divide-y">
          {tarefas.map((tarefa) => (
            <div key={tarefa.id} className="flex items-center gap-3 px-3 py-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-mono">{tarefa.tag}</span>
                  <span>#{tarefa.ordem}</span>
                </div>
                <p className="text-sm text-foreground truncate">{tarefa.nome}</p>
              </div>

              <div className="hidden md:block w-40 flex-shrink-0 text-xs text-muted-foreground truncate">
                {labelFrequencia(tarefa)}
              </div>

              <div className="hidden md:block w-32 flex-shrink-0 text-xs text-muted-foreground truncate">
                Crit. {labelCriticidade(tarefa.criticidade)}
              </div>

              <div className="flex items-center gap-0.5 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onVerTarefa(tarefa)}
                  title="Ver detalhes"
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onEditarTarefa(tarefa)}
                  title="Editar"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => handleExcluir(tarefa)}
                  title="Remover do plano"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
