// src/features/planos-manutencao/components/TarefasExpandedRow.tsx
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox } from '@aupus/shared-pages';
import { Eye, Pencil, Trash2, Plus, ClipboardList, Check, X } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';
import { tarefasApi, type TarefaApiResponse } from '@/services/tarefas.services';
import { type FrequenciaTarefa } from '@/services/instrucoes.services';
import { toast } from '@/hooks/use-toast';
import { formatApiError } from '@/utils/api-error';

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

interface TarefasExpandedRowProps {
  planoId: string;
  instrucoesOptions: Array<{ value: string; label: string }>;
  // Muda quando a página salva uma tarefa pelo sheet, forçando o recarregamento.
  refreshToken?: number;
  onVerTarefa: (tarefa: TarefaApiResponse) => void;
  // Avisa a página para atualizar as estatísticas do plano na linha.
  onTarefasChange?: () => void;
  /** Esconde cadastro, edicao e remocao. Usado no modo view do equipamento. */
  somenteLeitura?: boolean;
  /**
   * Coloca o botao de adicionar abaixo da lista, alinhado a esquerda.
   *
   * Na tabela de planos a linha expandida ja vem logo abaixo do plano, entao
   * o botao no topo competia com a lista pela primeira coisa que se ve. No
   * sheet do equipamento a secao e curta e o botao no topo continua melhor.
   */
  botaoAdicionarNoRodape?: boolean;
}

export function TarefasExpandedRow({
  planoId,
  instrucoesOptions,
  refreshToken = 0,
  onVerTarefa,
  onTarefasChange,
  somenteLeitura = false,
  botaoAdicionarNoRodape = false
}: TarefasExpandedRowProps) {
  const { user } = useUserStore();

  const [tarefas, setTarefas] = useState<TarefaApiResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Cadastro rápido: só instrução, periodicidade e criticidade.
  // O restante da tarefa é copiado da instrução pelo backend.
  const [nome, setNome] = useState('');
  const [instrucaoId, setInstrucaoId] = useState('');
  const [frequencia, setFrequencia] = useState<FrequenciaTarefa>('MENSAL');
  const [frequenciaPersonalizada, setFrequenciaPersonalizada] = useState(30);
  const [criticidade, setCriticidade] = useState(3);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // O formulario de cadastro so aparece quando pedido
  const [mostrandoFormulario, setMostrandoFormulario] = useState(false);

  // Edicao inline: os mesmos quatro campos, na propria linha
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [edicao, setEdicao] = useState({
    nome: '',
    instrucao_id: '',
    frequencia: 'MENSAL' as FrequenciaTarefa,
    frequencia_personalizada: 30,
    criticidade: 3
  });

  const abrirEdicao = (tarefa: TarefaApiResponse) => {
    setErro(null);
    setEditandoId(tarefa.id);
    setEdicao({
      nome: tarefa.nome || '',
      instrucao_id: (tarefa.instrucao_id || '').trim(),
      frequencia: (tarefa.frequencia || 'MENSAL') as FrequenciaTarefa,
      frequencia_personalizada: tarefa.frequencia_personalizada || 30,
      criticidade: tarefa.criticidade || 3
    });
  };

  const handleSalvarEdicao = async () => {
    if (!editandoId) return;

    setSalvando(true);
    setErro(null);

    try {
      await tarefasApi.update(editandoId.trim(), {
        nome: edicao.nome.trim(),
        instrucao_id: edicao.instrucao_id,
        frequencia: edicao.frequencia,
        criticidade: edicao.criticidade,
        ...(edicao.frequencia === 'PERSONALIZADA' && {
          frequencia_personalizada: edicao.frequencia_personalizada
        })
      });

      setEditandoId(null);
      toast({ title: 'Tarefa atualizada' });
      await carregarTarefas();
      onTarefasChange?.();
    } catch (error) {
      setErro(formatApiError(error));
    } finally {
      setSalvando(false);
    }
  };

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
      // Sem nome digitado, herda o da instrução — que é o caso comum
      const nomeInstrucao = instrucoesOptions
        .find((o) => o.value === instrucaoId.trim())
        ?.label?.replace(/^[^-]+ - /, '');

      await tarefasApi.create({
        nome: (nome || nomeInstrucao || '').trim(),
        instrucao_id: instrucaoId.trim(),
        frequencia,
        criticidade,
        plano_manutencao_id: planoId.trim(),
        ...(frequencia === 'PERSONALIZADA' && { frequencia_personalizada: frequenciaPersonalizada }),
        ...(user?.id && { criado_por: user.id })
      });

      // Periodicidade e criticidade ficam como estão: em cadastro em massa a
      // sequência costuma repetir os dois e variar só a instrução.
      setInstrucaoId('');
      setNome('');
      toast({ title: 'Tarefa adicionada ao plano' });
      await carregarTarefas();
      onTarefasChange?.();
    } catch (error) {
      setErro(formatApiError(error));
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
      toast({ title: 'Erro ao remover tarefa', description: formatApiError(error), variant: 'destructive' });
    }
  };

  // O formulario fica escondido ate o usuario pedir: aberto por padrao, ele
  // domina a area e a lista de tarefas — que e o que interessa ao abrir —
  // fica empurrada para baixo. So o icone: o title carrega o significado.
  const botaoAdicionar = !somenteLeitura && !mostrandoFormulario && (
    <div className={botaoAdicionarNoRodape ? 'flex justify-start' : 'flex justify-end'}>
      <Button
        size="icon"
        variant="outline"
        className="h-8 w-8 dark:bg-black"
        onClick={() => setMostrandoFormulario(true)}
        title="Adicionar tarefa"
        aria-label="Adicionar tarefa"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="px-4 py-3 space-y-3 border-t">
      {!botaoAdicionarNoRodape && botaoAdicionar}

      {/* Cadastro rápido numa linha so. Instrucao e o unico campo de texto
          longo, entao leva o dobro do espaco elastico do nome e os dois
          selects ficam com largura fixa; em tela estreita o flex-wrap quebra
          sozinho, que e o caso do sheet do equipamento. */}
      {!somenteLeitura && mostrandoFormulario && (
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-[2] min-w-[14rem]">
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

          <div className="flex-1 min-w-[10rem]">
            <Label className="text-xs text-muted-foreground mb-1 block">Nome</Label>
            <Input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Herda o da instrução"
              className="h-9"
            />
          </div>

          <div className="w-36">
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
            <div className="w-20">
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

          <div className="w-36">
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

          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              onClick={handleAdicionar}
              disabled={!instrucaoId || salvando}
              size="icon"
              className="h-9 w-9"
              title={salvando ? 'Adicionando...' : 'Adicionar'}
              aria-label="Adicionar"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-9 w-9 dark:bg-black"
              onClick={() => {
                setMostrandoFormulario(false);
                setErro(null);
              }}
              disabled={salvando}
              title="Fechar"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

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
          {tarefas.map((tarefa) =>
            editandoId === tarefa.id ? (
              // Edicao inline com os quatro campos. O sheet completo de tarefa
              // mostrava campos que sairam do DTO e devolvia 400 ao salvar.
              <div key={tarefa.id} className="space-y-2 px-3 py-2 bg-muted/30">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Instrução</Label>
                  <Combobox
                    options={instrucoesOptions}
                    value={edicao.instrucao_id || undefined}
                    onValueChange={(val) => setEdicao((e) => ({ ...e, instrucao_id: (val || '').trim() }))}
                    placeholder="Selecione uma instrução..."
                    searchPlaceholder="Buscar instrução..."
                    emptyText="Nenhuma instrução encontrada"
                  />
                </div>

                <div className="flex flex-wrap items-end gap-2">
                <div className="flex-1 min-w-[10rem]">
                  <Label className="text-xs text-muted-foreground mb-1 block">Nome</Label>
                  <Input
                    type="text"
                    value={edicao.nome}
                    onChange={(e) => setEdicao((prev) => ({ ...prev, nome: e.target.value }))}
                    className="h-9"
                  />
                </div>

                <div className="w-36">
                  <Label className="text-xs text-muted-foreground mb-1 block">Periodicidade</Label>
                  <select
                    value={edicao.frequencia}
                    onChange={(e) => setEdicao((prev) => ({ ...prev, frequencia: e.target.value as FrequenciaTarefa }))}
                    className="w-full h-9 px-2 text-sm border rounded bg-background text-foreground"
                  >
                    {frequenciaOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {edicao.frequencia === 'PERSONALIZADA' && (
                  <div className="w-20">
                    <Label className="text-xs text-muted-foreground mb-1 block">Dias</Label>
                    <Input
                      type="number"
                      min={1}
                      value={edicao.frequencia_personalizada}
                      onChange={(e) =>
                        setEdicao((prev) => ({ ...prev, frequencia_personalizada: Number(e.target.value) }))
                      }
                      className="h-9"
                    />
                  </div>
                )}

                <div className="w-36">
                  <Label className="text-xs text-muted-foreground mb-1 block">Criticidade</Label>
                  <select
                    value={edicao.criticidade}
                    onChange={(e) => setEdicao((prev) => ({ ...prev, criticidade: Number(e.target.value) }))}
                    className="w-full h-9 px-2 text-sm border rounded bg-background text-foreground"
                  >
                    {criticidadeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    size="icon"
                    className="h-9 w-9"
                    onClick={handleSalvarEdicao}
                    disabled={salvando}
                    title="Salvar"
                    aria-label="Salvar"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-9 w-9 dark:bg-black"
                    onClick={() => setEditandoId(null)}
                    disabled={salvando}
                    title="Cancelar"
                    aria-label="Cancelar"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                </div>
              </div>
            ) : (
            <div key={tarefa.id} className="flex items-center gap-3 px-3 py-2">
              <div className="min-w-0 flex-1">
                {/* Sem a tag: e identificador interno e roubava a atencao do
                    nome, que e o que identifica a tarefa para quem le. */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>#{tarefa.ordem}</span>
                  {/* Diz se a tarefa acompanha o plano geral ou se divergiu.
                      Sem isso o usuário não tem como saber por que uma tarefa
                      mudou sozinha (herdada) e outra não (customizada). */}
                  {tarefa.origem_status === 'HERDADA' && (
                    <span title="Segue o plano geral">herdada</span>
                  )}
                  {tarefa.origem_status === 'CUSTOMIZADA' && (
                    <span
                      className="text-foreground"
                      title="Ajustada neste equipamento; não é mais atualizada pelo plano geral"
                    >
                      customizada
                    </span>
                  )}
                  {tarefa.origem_status === 'PROPRIA' && (
                    <span title="Criada neste equipamento">própria</span>
                  )}
                </div>
                <p className="text-sm text-foreground truncate">{tarefa.nome}</p>
              </div>

              <div className="hidden md:block w-40 flex-shrink-0 text-xs text-muted-foreground truncate">
                {labelFrequencia(tarefa)}
              </div>

              <div className="hidden md:block w-32 flex-shrink-0 text-xs text-muted-foreground truncate">
                Crit. {labelCriticidade(tarefa.criticidade)}
              </div>

              {!somenteLeitura && (
              <div className="flex items-center gap-0.5 flex-shrink-0">
                {/* O detalhe util e a INSTRUCAO: a tarefa em si so tem os
                    quatro campos que ja estao visiveis na linha. */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onVerTarefa(tarefa)}
                  title="Ver instrução"
                  disabled={!tarefa.instrucao_id}
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => abrirEdicao(tarefa)}
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
              )}
            </div>
            )
          )}
        </div>
      )}

      {botaoAdicionarNoRodape && botaoAdicionar}
    </div>
  );
}
