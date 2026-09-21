// src/features/planos-manutencao/components/TarefasExpandedRow.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/core';
import { Eye, Pencil, Trash2, Plus, Check, X } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';
import { tarefasApi, type TarefaApiResponse } from '@/services/tarefas.services';
import {
  opcaoDaInstrucao,
  type FrequenciaTarefa,
  type OpcaoDeInstrucao,
} from '@/services/instrucoes.services';
import { type SituacaoDaTarefa } from '@/services/historico-equipamento.services';
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

const formatarData = (valor?: string | Date | null): string | null => {
  if (!valor) return null;
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? null : data.toLocaleDateString('pt-BR');
};

/** Negativo é atraso; o backend já devolve a conta pronta. */
const estaAtrasada = (situacao?: SituacaoDaTarefa) =>
  typeof situacao?.dias_ate_proxima === 'number' && situacao.dias_ate_proxima < 0;

/**
 * Quando roda de novo, em dias, porque é assim que se decide o que entra na
 * próxima janela — "vence 12/08/2027" obriga a fazer a conta de cabeça.
 * A data completa fica no bloco de situação, na aba Histórico.
 */
const rotuloProxima = (situacao?: SituacaoDaTarefa): string | null => {
  const dias = situacao?.dias_ate_proxima;
  if (typeof dias !== 'number') return null;
  if (dias < 0) return `atrasada ${Math.abs(dias)} dia${Math.abs(dias) === 1 ? '' : 's'}`;
  if (dias === 0) return 'vence hoje';
  return `vence em ${dias} dia${dias === 1 ? '' : 's'}`;
};

interface TarefasExpandedRowProps {
  planoId: string;
  instrucoesOptions: OpcaoDeInstrucao[];
  /**
   * Abre o cadastro de instrucao e resolve com a que foi criada (ou null se
   * desistiram). Ausente, o botao de nova instrucao nao aparece — e o caso da
   * tela de planos em modo leitura.
   */
  onCriarInstrucao?: () => Promise<OpcaoDeInstrucao | null>;
  /**
   * Quando a tarefa rodou pela ultima vez e quando roda de novo, por id de
   * tarefa. So existe no sheet do equipamento: template nao executa nada.
   *
   * Vem do backend (`/equipamentos/:id/historico-os`) e NAO de
   * `tarefa.data_ultima_execucao` — aquele campo e cache da finalizacao da OS
   * e pode ficar defasado; este e lido das OS finalizadas.
   */
  situacaoPorTarefa?: Record<string, SituacaoDaTarefa>;
  // Muda quando a página salva uma tarefa pelo sheet, forçando o recarregamento.
  refreshToken?: number;
  onVerTarefa: (tarefa: TarefaApiResponse) => void;
  // Avisa a página para atualizar as estatísticas do plano na linha.
  onTarefasChange?: () => void;
  /** Esconde cadastro, edicao e remocao. Usado no modo view do equipamento. */
  somenteLeitura?: boolean;
  /**
   * Onde fica o botao de adicionar tarefa.
   *
   * 'oculto' na tabela de planos, onde ele virou acao da linha do plano; no
   * sheet do equipamento a secao e curta e o topo continua melhor.
   */
  posicaoBotaoAdicionar?: 'topo' | 'rodape' | 'oculto';
  /**
   * Id do plano para o qual o cadastro deve abrir, vindo da acao da tabela.
   * Identifica o ALVO em vez de ser um contador: contador disparava no mount,
   * entao depois do primeiro uso qualquer linha aberta ja mostrava o
   * formulario.
   */
  abrirCadastroPara?: string | null;
  /** Avisa a pagina que o formulario abriu, para ela limpar o alvo. */
  onCadastroAberto?: () => void;
  /**
   * Onde a lista esta montada, o que muda so o recuo.
   *
   * 'linha-expandida': dentro da linha expandida da tabela de planos. Recua
   * para DENTRO do nome do plano, senao a lista nasce a esquerda dele e parece
   * irma, nao filha.
   *
   * 'sheet': dentro do card do sheet do equipamento, onde o nome do plano ja
   * esta no cabecalho do card. Aqui o certo e alinhar com ele, nao recuar.
   */
  variante?: 'linha-expandida' | 'sheet';
}

/**
 * Recuo da lista conforme o contexto.
 *
 * Na tabela, o nome do plano comeca a 52px da borda: celula do chevron
 * (w-10 = 40px) mais o px-3 da celula. A linha expandida vem com p-0, entao
 * pl-16 (64px) poe o nome da tarefa 12px adentro do nome do plano.
 *
 * No sheet, o cabecalho do card usa p-3 — px-3 alinha as tarefas exatamente
 * com o nome do plano logo acima.
 */
const RECUO = {
  'linha-expandida': 'pl-16 pr-4',
  sheet: 'px-3',
} as const;

export function TarefasExpandedRow({
  planoId,
  instrucoesOptions,
  onCriarInstrucao,
  situacaoPorTarefa,
  refreshToken = 0,
  onVerTarefa,
  onTarefasChange,
  somenteLeitura = false,
  posicaoBotaoAdicionar = 'topo',
  abrirCadastroPara,
  onCadastroAberto,
  variante = 'linha-expandida'
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

  /**
   * As opções do catálogo MAIS as instruções que as tarefas desta lista já
   * apontam.
   *
   * O catálogo que chega por prop traz só as instruções ATIVAS. Uma tarefa
   * antiga pode apontar para uma instrução que depois foi inativada ou
   * arquivada — e como o `Combobox` casa opção com valor por igualdade exata,
   * sem opção correspondente ele mostrava o placeholder "Selecione uma
   * instrução...". A tarefa TINHA instrução; a tela é que dizia o contrário, e
   * quem editasse a periodicidade nem desconfiava.
   *
   * A instrução vem aninhada na própria tarefa (`tarefa.instrucao`), então
   * reconstruir a opção que falta não custa requisição nenhuma. O sufixo
   * separa o que está fora do catálogo ativo — o que se escolhe para tarefa
   * nova continua sendo só o de cima.
   */
  const opcoesDeInstrucao = useMemo(() => {
    const porValor = new Map(instrucoesOptions.map((opcao) => [opcao.value, opcao]));

    for (const tarefa of tarefas) {
      const id = (tarefa.instrucao_id || '').trim();
      if (!id || porValor.has(id)) continue;

      const base = tarefa.instrucao
        ? opcaoDaInstrucao({ ...tarefa.instrucao, id })
        : { value: id, label: tarefa.nome || 'Instrução removida do catálogo' };

      porValor.set(id, { ...base, label: `${base.label} · fora do catálogo ativo` });
    }

    return [...porValor.values()];
  }, [instrucoesOptions, tarefas]);

  /**
   * Cadastra a instrução sem sair daqui e já a deixa escolhida na linha.
   *
   * Sem isto, faltando uma instrução o caminho era abandonar a tarefa, ir até
   * Manutenção → Instruções e voltar — no sheet do equipamento, perdendo o que
   * estava preenchido.
   */
  const criarInstrucao = async (aplicar: (opcao: OpcaoDeInstrucao) => void) => {
    if (!onCriarInstrucao) return;
    const nova = await onCriarInstrucao();
    if (nova) aplicar(nova);
  };

  useEffect(() => {
    const id = planoId?.trim();
    if (!id || abrirCadastroPara !== id || somenteLeitura) return;
    setMostrandoFormulario(true);
    onCadastroAberto?.();
  }, [abrirCadastroPara, planoId, somenteLeitura, onCadastroAberto]);

  const handleAdicionar = async () => {
    if (!instrucaoId) return;

    setSalvando(true);
    setErro(null);

    try {
      // Sem nome digitado, herda o da instrução — que é o caso comum
      const nomeInstrucao = opcoesDeInstrucao
        .find((o) => o.value === instrucaoId.trim())
        ?.label?.replace(/^[^-]+ - /, '')
        // O sufixo das opções fora do catálogo ativo é rótulo de tela; não
        // pode virar nome de tarefa.
        ?.replace(/ · fora do catálogo ativo$/, '');

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
  const botaoAdicionar = !somenteLeitura &&
    !mostrandoFormulario &&
    posicaoBotaoAdicionar !== 'oculto' && (
    <div className={posicaoBotaoAdicionar === 'rodape' ? 'flex justify-start' : 'flex justify-end'}>
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
    // No sheet o card ja tem border-b no cabecalho; um border-t aqui viraria
    // uma linha de 2px colada na outra.
    <div
      className={`${RECUO[variante]} py-3 space-y-3 ${
        variante === 'linha-expandida' ? 'border-t' : ''
      }`}
    >
      {posicaoBotaoAdicionar === 'topo' && botaoAdicionar}

      {/* Cadastro rápido numa linha so. O nome vem primeiro: e ele que
          identifica a tarefa na lista. A instrucao leva o dobro do espaco
          elastico por ser o unico campo de texto longo, e os dois selects tem
          largura fixa; em tela estreita o flex-wrap quebra sozinho, que e o
          caso do sheet do equipamento. */}
      {!somenteLeitura && mostrandoFormulario && (
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[10rem]">
            <Label className="text-xs text-muted-foreground mb-1 block">Nome</Label>
            <Input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Digite o nome da tarefa"
              className="h-9 text-center"
            />
          </div>

          <div className="flex-[2] min-w-[14rem]">
            {/* O botao de cadastrar sobe para a linha do rotulo, como no
                sheet do equipamento: ao lado da caixa ele encurtaria o unico
                campo de texto longo da linha. */}
            <div className="flex items-center gap-1 mb-1 h-5">
              <Label className="text-xs text-muted-foreground">Instrução</Label>
              {onCriarInstrucao && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 -my-0.5 shrink-0"
                  onClick={() => criarInstrucao((nova) => setInstrucaoId(nova.value))}
                  title="Cadastrar nova instrução"
                  aria-label="Cadastrar nova instrução"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <Combobox
              options={opcoesDeInstrucao}
              value={instrucaoId || undefined}
              onValueChange={(val) => setInstrucaoId((val || '').trim())}
              placeholder="Selecione uma instrução..."
              searchPlaceholder="Buscar instrução..."
              emptyText="Nenhuma instrução encontrada"
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
                className="h-9 text-center"
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
        <p className="py-3 text-sm text-muted-foreground">Nenhuma tarefa neste plano ainda.</p>
      ) : (
        // Sem moldura e sem divisoria entre as tarefas: a caixa competia com a
        // borda da propria linha da tabela e do card do sheet, e as linhas
        // internas transformavam uma lista curta num emaranhado de tracos. O
        // espacamento vertical ja separa uma tarefa da outra.
        <div>
          {tarefas.map((tarefa) => {
            const situacao = situacaoPorTarefa?.[tarefa.id.trim()];
            const ultima = formatarData(situacao?.ultima_execucao);

            return editandoId === tarefa.id ? (
              // Edicao inline com os quatro campos. O sheet completo de tarefa
              // mostrava campos que sairam do DTO e devolvia 400 ao salvar.
              <div key={tarefa.id} className="py-2 bg-muted/30">
                {/* Mesma ordem e mesmo layout do cadastro: quem edita espera
                    encontrar os campos onde acabou de preenche-los. */}
                <div className="flex flex-wrap items-end gap-2">
                <div className="flex-1 min-w-[10rem]">
                  <Label className="text-xs text-muted-foreground mb-1 block">Nome</Label>
                  <Input
                    type="text"
                    value={edicao.nome}
                    onChange={(e) => setEdicao((prev) => ({ ...prev, nome: e.target.value }))}
                    placeholder="Digite o nome da tarefa"
                    className="h-9 text-center"
                  />
                </div>

                <div className="flex-[2] min-w-[14rem]">
                  <div className="flex items-center gap-1 mb-1 h-5">
                    <Label className="text-xs text-muted-foreground">Instrução</Label>
                    {onCriarInstrucao && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 -my-0.5 shrink-0"
                        onClick={() =>
                          criarInstrucao((nova) =>
                            setEdicao((e) => ({ ...e, instrucao_id: nova.value })),
                          )
                        }
                        title="Cadastrar nova instrução"
                        aria-label="Cadastrar nova instrução"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <Combobox
                    options={opcoesDeInstrucao}
                    value={edicao.instrucao_id || undefined}
                    onValueChange={(val) => setEdicao((e) => ({ ...e, instrucao_id: (val || '').trim() }))}
                    placeholder="Selecione uma instrução..."
                    searchPlaceholder="Buscar instrução..."
                    emptyText="Nenhuma instrução encontrada"
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
                      className="h-9 text-center"
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
            <div key={tarefa.id} className="flex items-center gap-3 py-2">
              <div className="min-w-0 flex-1">
                {/* Sem tag e sem numero de ordem: os dois sao identificadores
                    internos e disputavam a atencao com o nome, que e o que
                    identifica a tarefa para quem le. */}
                <p className="text-sm text-foreground truncate">{tarefa.nome}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
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

                  {/* Quando esta tarefa foi feita pela ultima vez.
                      Fica aqui, colado no nome, e nao numa coluna a direita:
                      e a pergunta que se faz olhando a lista ("essa ja foi
                      feita?"), e coluna estreita dentro de sheet corta data.
                      So aparece no equipamento — template nao executa nada. */}
                  {situacao && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span
                        title={
                          ultima
                            ? `${situacao.numero_execucoes} execução(ões) registrada(s) em ordens de serviço finalizadas`
                            : 'Nenhuma ordem de serviço finalizada registrou esta tarefa'
                        }
                      >
                        {ultima ? `última: ${ultima}` : 'nunca executada'}
                      </span>

                      {rotuloProxima(situacao) && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span
                            className={estaAtrasada(situacao) ? 'text-foreground' : undefined}
                            title="Calculada pela mesma regra do agendador que gera as ordens"
                          >
                            {rotuloProxima(situacao)}
                          </span>
                        </>
                      )}
                    </>
                  )}
                </div>
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
            );
          })}
        </div>
      )}

      {posicaoBotaoAdicionar === 'rodape' && botaoAdicionar}
    </div>
  );
}
