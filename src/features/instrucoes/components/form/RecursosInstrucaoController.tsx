// src/features/instrucoes/components/form/RecursosInstrucaoController.tsx
import React from 'react';
import { FormFieldProps } from '@/types/base';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Combobox } from '@/core';
import { AlertCircle, Wallet, Clock, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatApiError } from '@/utils/api-error';
import { ItensOrdenaveisTable, type ColunaItemOrdenavel } from '@/components/common/ItensOrdenaveisTable';
import { diariasDaDuracao } from '@/utils/horas';
import {
  recursosApi,
  rotuloCategoria,
  unidadePadraoDaCategoria,
  CATEGORIAS_RECURSO,
  UNIDADES_RECURSO,
  type CategoriaRecurso,
  type RecursoApiResponse,
} from '@/services/recursos.services';

// Mesmo raio e borda do Input padrao para o select nao destoar da linha.
const selectClassName =
  'h-8 w-full rounded-[0.25rem] border border-input bg-transparent px-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

interface Recurso {
  id?: string;
  /** Aponta para o catálogo. Vazio nas linhas antigas, digitadas antes dele existir. */
  recurso_id?: string | null;
  tipo: 'INSTRUMENTO' | 'MATERIAL' | 'FERRAMENTA' | 'TECNICO' | 'VIATURA';
  descricao: string;
  quantidade?: string | number;
  unidade?: string;
  obrigatorio: boolean;
}

const numero = (valor?: string | number | null) => {
  if (valor === null || valor === undefined || valor === '') return null;
  const n = typeof valor === 'string' ? parseFloat(String(valor).replace(',', '.')) : valor;
  return Number.isNaN(n) ? null : n;
};

const moeda = (valor: number) =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/**
 * Apara o `recurso_id` assim que a lista entra no componente.
 *
 * `recursos.id` é `Char(26)` e o banco convive com duas gerações de id: os
 * antigos, de `cuid()`, têm 25 caracteres e voltam do Postgres **com um espaço
 * à direita**; os novos, em hex, têm 26 e voltam limpos.
 *
 * As opções do combobox são construídas com `id.trim()`. Passando o valor sem
 * aparar, o id de 25 não casava com opção nenhuma e a caixa aparecia vazia —
 * mesmo com o recurso salvo e o custo aparecendo na linha, porque aquela outra
 * leitura aparava. Dois jeitos de ler o mesmo campo na mesma linha.
 *
 * Aparar na entrada resolve para todos os consumidores de uma vez, em vez de
 * espalhar `.trim()` por cada leitura e esquecer de um.
 */
function normalizar(lista: unknown): Recurso[] {
  if (!Array.isArray(lista)) return [];
  return lista.map((item: Recurso) => ({
    ...item,
    recurso_id: item?.recurso_id?.trim() || null,
  }));
}

/**
 * Os recursos de uma instrução, escolhidos do catálogo.
 *
 * Categoria, nome e unidade vêm do recurso; a instrução decide a quantidade e
 * se é obrigatório. O preço é lido ao vivo, de propósito: reajustar um custo
 * tem que se refletir aqui. O que congela é a OS, quando é gerada.
 */
interface RecursosInstrucaoControllerProps extends FormFieldProps {
  /** As sub-instruções em edição. É a soma delas que sugere a quantidade. */
  subInstrucoes?: { tempo_estimado?: number }[];
}

export function RecursosInstrucaoController({
  value,
  onChange,
  disabled,
  subInstrucoes,
}: RecursosInstrucaoControllerProps) {
  const [recursos, setRecursos] = React.useState<Recurso[]>(() => normalizar(value));
  const [catalogo, setCatalogo] = React.useState<RecursoApiResponse[]>([]);
  const [carregando, setCarregando] = React.useState(true);

  /**
   * Cadastro de recurso sem sair da instrução.
   *
   * O recurso que falta se descobre no momento de escolhê-lo: o combobox da
   * categoria não tem o item, e o caminho era abandonar a instrução, ir em
   * Administração → Recursos, cadastrar e voltar — perdendo o que já estava
   * preenchido no sheet.
   *
   * É um popover, e não um modal: o formulário do recurso tem três campos e a
   * instrução já é um sheet. Modal dentro de sheet, para três campos, é peso
   * que a tela não precisa carregar.
   *
   * O índice da linha faz as vezes de "qual popover está aberto": abrir só faz
   * sentido a partir de uma linha, e é nela que o recurso criado é escolhido.
   */
  const [criandoNaLinha, setCriandoNaLinha] = React.useState<number | null>(null);
  const [novoNome, setNovoNome] = React.useState('');
  const [novaUnidade, setNovaUnidade] = React.useState('h');
  const [novoPreco, setNovoPreco] = React.useState('');
  const [salvandoNovo, setSalvandoNovo] = React.useState(false);

  React.useEffect(() => {
    if (Array.isArray(value)) {
      setRecursos(normalizar(value));
    }
  }, [value]);

  React.useEffect(() => {
    let cancelado = false;

    // Limite alto porque o combobox filtra do lado do cliente: um catálogo de
    // manutenção tem dezenas de itens, não milhares.
    recursosApi
      .listar({ apenas_ativos: true, limit: 500 })
      .then((resposta) => {
        if (!cancelado) setCatalogo(resposta.data);
      })
      .catch((erro) => {
        if (cancelado) return;
        toast.error('Erro ao carregar o catálogo de recursos', {
          description: formatApiError(erro),
        });
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
    };
  }, []);

  const porId = React.useMemo(
    () => new Map(catalogo.map((r) => [r.id.trim(), r])),
    [catalogo],
  );

  /**
   * Opções por categoria: escolhida a categoria da linha, o combobox mostra só
   * o que pertence a ela. Com o catálogo inteiro numa lista só, achar "Cabo
   * 4mm" no meio de técnicos e viaturas é trabalho à toa.
   */
  const opcoesPorCategoria = React.useMemo(() => {
    const mapa = new Map<string, { value: string; label: string }[]>();

    for (const recurso of catalogo) {
      const lista = mapa.get(recurso.categoria) || [];
      lista.push({ value: recurso.id.trim(), label: recurso.nome });
      mapa.set(recurso.categoria, lista);
    }

    return mapa;
  }, [catalogo]);

  const aplicar = (lista: Recurso[]) => {
    setRecursos(lista);
    onChange(lista);
  };

  const adicionar = () => {
    aplicar([
      ...recursos,
      { recurso_id: null, tipo: 'MATERIAL', descricao: '', quantidade: '1', obrigatorio: false },
    ]);
  };

  const remover = (index: number) => {
    aplicar(recursos.filter((_, i) => i !== index));
  };

  const atualizar = (index: number, campo: keyof Recurso, valor: unknown) => {
    aplicar(recursos.map((item, i) => (i === index ? { ...item, [campo]: valor } : item)));
  };

  /**
   * Quantas horas a instrução ocupa em diárias fechadas.
   *
   * A soma das sub-instruções dá a duração real; ela é arredondada para cima em
   * dias de 8h porque é assim que se aloca e se paga — uma instrução de 10h
   * ocupa dois dias de técnico, não um dia e um quarto.
   */
  const { dias: diarias, horas: horasDeDiaria } = React.useMemo(() => {
    const minutos = (subInstrucoes || []).reduce(
      (soma, item) => soma + (Number(item?.tempo_estimado) || 0),
      0,
    );
    return diariasDaDuracao(minutos / 60);
  }, [subInstrucoes]);

  /**
   * Mantém a quantidade das linhas em hora acompanhando a duração da instrução.
   *
   * Sugerir só na hora de escolher o recurso não bastava: quem monta a
   * instrução costuma listar os recursos ANTES de detalhar as etapas, e nesse
   * caminho a sugestão nunca chegava. Agora ela também alcança as linhas já
   * escolhidas quando as sub-instruções mudam.
   *
   * Só mexe no que ninguém editou — quantidade vazia, ainda no 1 do padrão, ou
   * igual à sugestão anterior. Quem digitou um número fica com ele.
   */
  const sugestaoAnteriorRef = React.useRef(horasDeDiaria);

  React.useEffect(() => {
    const anterior = sugestaoAnteriorRef.current;
    sugestaoAnteriorRef.current = horasDeDiaria;

    if (horasDeDiaria <= 0 || anterior === horasDeDiaria) return;

    let mudou = false;
    const proximos = recursos.map((item) => {
      if ((item.unidade || '').trim() !== 'h') return item;

      const atual = String(item.quantidade ?? '').trim();
      // O "1" entra como intocado porque é o valor com que a linha nasce. Uma
      // hora cravada é quantidade improvável para um serviço medido em diárias,
      // então o risco de atropelar uma escolha real é pequeno perto do ganho.
      const intocada = atual === '' || atual === '1' || atual === String(anterior);
      if (!intocada) return item;

      mudou = true;
      return { ...item, quantidade: String(horasDeDiaria) };
    });

    if (mudou) aplicar(proximos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [horasDeDiaria, recursos]);

  /**
   * Escolher no catálogo traz junto nome e unidade, e sugere a quantidade.
   *
   * A sugestão só vale para o que se mede em hora: material se conta por peça,
   * e encher a quantidade dele com as horas da instrução seria besteira.
   */
  const escolherRecurso = (index: number, recursoId: string) => {
    // O Combobox alterna: clicar na opção já marcada devolve string vazia. Isso
    // caía num `return` silencioso — nada mudava e nada era dito. Limpar a
    // linha é o que o clique pediu.
    if (!recursoId?.trim()) {
      aplicar(
        recursos.map((item, i) =>
          i === index ? { ...item, recurso_id: null, descricao: '', unidade: '' } : item,
        ),
      );
      return;
    }

    const doCatalogo = porId.get(recursoId.trim());
    if (!doCatalogo) return;

    const emHoras = (doCatalogo.unidade || '').trim() === 'h';
    const sugestao = emHoras && horasDeDiaria > 0 ? String(horasDeDiaria) : undefined;

    aplicar(
      recursos.map((item, i) =>
        i === index
          ? {
              ...item,
              recurso_id: doCatalogo.id.trim(),
              tipo: doCatalogo.categoria,
              descricao: doCatalogo.nome,
              unidade: doCatalogo.unidade || '',
              quantidade: sugestao ?? item.quantidade,
            }
          : item,
      ),
    );
  };

  /**
   * Trocar a categoria descarta o recurso escolhido: ele pertencia à categoria
   * anterior e continuaria ali, invisível no combobox já filtrado, mas contando
   * no custo — o pior tipo de resto.
   */
  const trocarCategoria = (index: number, categoria: Recurso['tipo']) => {
    aplicar(
      recursos.map((item, i) =>
        i === index
          ? { ...item, tipo: categoria, recurso_id: null, descricao: '', unidade: '' }
          : item,
      ),
    );
  };

  /**
   * Abre o cadastro já com o que a linha define.
   *
   * A categoria vem da linha (o combobox está filtrado por ela) e a unidade
   * padrão vem da categoria — quase tudo se mede em hora porque o que custa é
   * o tempo alocado; material é o que se conta por peça.
   */
  const abrirCadastroDeRecurso = (index: number, categoria: Recurso['tipo']) => {
    setNovoNome('');
    setNovaUnidade(unidadePadraoDaCategoria(categoria as CategoriaRecurso));
    setNovoPreco('');
    setCriandoNaLinha(index);
  };

  const fecharCadastroDeRecurso = () => {
    setCriandoNaLinha(null);
    setNovoNome('');
    setNovoPreco('');
  };

  /**
   * Cadastra no catálogo e já deixa escolhido na linha.
   *
   * Preço vazio vira `null`, e não zero: o catálogo distingue "não sei quanto
   * custa" de "é de graça", e o custo estimado da instrução mostra traço em
   * vez de R$ 0,00 no primeiro caso.
   */
  const criarRecurso = async (index: number) => {
    const nome = novoNome.trim();
    if (!nome || salvandoNovo) return;

    const categoria = recursos[index]?.tipo as CategoriaRecurso;
    const precoDigitado = numero(novoPreco);

    setSalvandoNovo(true);
    try {
      const criado = await recursosApi.criar({
        categoria,
        nome,
        unidade: novaUnidade || null,
        preco_medio: precoDigitado,
      });

      // Entra no catálogo em memória para o combobox enxergar sem recarregar a
      // lista inteira — e é dali que sai o preço no custo estimado.
      setCatalogo((atual) => [...atual.filter((r) => r.id.trim() !== criado.id.trim()), criado]);

      const emHoras = (criado.unidade || '').trim() === 'h';
      const sugestao = emHoras && horasDeDiaria > 0 ? String(horasDeDiaria) : undefined;

      aplicar(
        recursos.map((item, i) =>
          i === index
            ? {
                ...item,
                recurso_id: criado.id.trim(),
                tipo: criado.categoria,
                descricao: criado.nome,
                unidade: criado.unidade || '',
                quantidade: sugestao ?? item.quantidade,
              }
            : item,
        ),
      );

      fecharCadastroDeRecurso();
      toast.success(`Recurso "${criado.nome}" cadastrado`);
    } catch (erro) {
      // O popover fica aberto: nome duplicado na categoria devolve 409 e o
      // usuário precisa do que digitou para corrigir.
      toast.error('Erro ao cadastrar o recurso', { description: formatApiError(erro) });
    } finally {
      setSalvandoNovo(false);
    }
  };

  const reordenar = (origem: number, destino: number) => {
    const lista = [...recursos];
    const [movido] = lista.splice(origem, 1);
    lista.splice(destino, 0, movido);
    aplicar(lista);
  };

  const subtotal = (item: Recurso): number | null => {
    const doCatalogo = item.recurso_id ? porId.get(item.recurso_id.trim()) : undefined;
    const preco = numero(doCatalogo?.preco_medio);
    if (preco === null) return null;
    return preco * (numero(item.quantidade) ?? 1);
  };

  const total = recursos.reduce((soma, item) => soma + (subtotal(item) ?? 0), 0);

  const colunas: Array<ColunaItemOrdenavel<Recurso>> = [
    {
      key: 'categoria',
      header: 'Categoria',
      width: 'w-36',
      render: (item, index) => (
        <select
          value={item.tipo}
          onChange={(e) => trocarCategoria(index, e.target.value as Recurso['tipo'])}
          disabled={disabled}
          className={selectClassName}
        >
          {CATEGORIAS_RECURSO.map((opcao) => (
            <option key={opcao.value} value={opcao.value}>
              {opcao.label}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: 'recurso',
      header: 'Recurso',
      render: (item, index) => {
        const opcoes = opcoesPorCategoria.get(item.tipo) || [];
        // Linha antiga, de antes do catálogo: mostra o que foi digitado e deixa
        // trocar por um item do catálogo.
        const legado = !item.recurso_id && item.descricao;

        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Combobox
                options={opcoes}
                value={item.recurso_id || undefined}
                onValueChange={(valor) => escolherRecurso(index, valor)}
                placeholder={
                  carregando
                    ? 'Carregando...'
                    : opcoes.length === 0
                      ? `Nenhum recurso em ${rotuloCategoria(item.tipo)}`
                      : 'Selecione o recurso...'
                }
                searchPlaceholder="Buscar recurso..."
                emptyText="Nenhum recurso nesta categoria. Use o + ao lado para cadastrar."
                // Continua desabilitado com a categoria vazia, mas NAO por
                // falta de opcoes: categoria sem nenhum recurso e exatamente
                // quando se quer cadastrar o primeiro, e travar a linha ali
                // era o que obrigava a sair da instrucao.
                disabled={disabled || carregando}
                className="h-8"
              />

              {!disabled && (
                <Popover
                  open={criandoNaLinha === index}
                  onOpenChange={(aberto) =>
                    aberto ? abrirCadastroDeRecurso(index, item.tipo) : fecharCadastroDeRecurso()
                  }
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 shrink-0 dark:bg-black"
                      title={`Cadastrar recurso em ${rotuloCategoria(item.tipo)}`}
                      aria-label={`Cadastrar recurso em ${rotuloCategoria(item.tipo)}`}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent className="w-72" align="end">
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium">Novo recurso</h4>
                        {/* A categoria nao se escolhe aqui: ela vem da linha, e
                            deixar trocar criaria um recurso que o combobox ja
                            filtrado nao mostraria em seguida. */}
                        <p className="text-xs text-muted-foreground">
                          Em {rotuloCategoria(item.tipo)}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Nome</label>
                        <Input
                          autoFocus
                          value={novoNome}
                          onChange={(e) => setNovoNome(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              criarRecurso(index);
                            }
                          }}
                          placeholder="Ex: Eletricista"
                          className="h-8"
                        />
                      </div>

                      <div className="flex gap-2">
                        <div className="flex-1 space-y-1">
                          <label className="text-xs text-muted-foreground">Unidade</label>
                          <select
                            value={novaUnidade}
                            onChange={(e) => setNovaUnidade(e.target.value)}
                            className={selectClassName}
                          >
                            {UNIDADES_RECURSO.map((opcao) => (
                              <option key={opcao.value} value={opcao.value}>
                                {opcao.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex-1 space-y-1">
                          <label className="text-xs text-muted-foreground">Preço médio</label>
                          <Input
                            value={novoPreco}
                            onChange={(e) => setNovoPreco(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                criarRecurso(index);
                              }
                            }}
                            // Vazio e "nao sei quanto custa", nao zero — por
                            // isso o placeholder nao sugere um numero.
                            placeholder="opcional"
                            className="h-8"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-8 text-xs dark:bg-black"
                          onClick={fecharCadastroDeRecurso}
                          disabled={salvandoNovo}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="button"
                          className="h-8 text-xs"
                          onClick={() => criarRecurso(index)}
                          disabled={salvandoNovo || !novoNome.trim()}
                        >
                          {salvandoNovo ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Cadastrando...
                            </>
                          ) : (
                            'Cadastrar'
                          )}
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>

            {legado && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <AlertCircle className="h-3 w-3 shrink-0" />
                Cadastrado antes do catálogo: {item.descricao}
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: 'quantidade',
      header: 'Qtd',
      width: 'w-28',
      align: 'center',
      render: (item, index) => (
        <div className="flex items-center justify-center gap-1">
          <Input
            placeholder="1"
            type="text"
            value={item.quantidade ?? ''}
            onChange={(e) => atualizar(index, 'quantidade', e.target.value)}
            disabled={disabled}
            className="h-8 w-14 text-center"
          />
          {/* A unidade vem do recurso e não se edita aqui — encostada na
              quantidade ela se lê como "2 h", que é o que se quer saber. */}
          <span className="text-xs text-muted-foreground w-8 text-left">
            {item.unidade || ''}
          </span>
        </div>
      ),
    },
    {
      key: 'subtotal',
      header: 'Custo',
      width: 'w-28',
      align: 'center',
      render: (item) => {
        const valor = subtotal(item);
        // Traço neutro, e não um aviso: recurso sem preço no catálogo é comum e
        // não é problema da instrução resolver.
        return valor === null ? (
          <span className="text-sm text-muted-foreground">—</span>
        ) : (
          <span className="text-sm text-foreground">{moeda(valor)}</span>
        );
      },
    },
    {
      key: 'obrigatorio',
      header: 'Obrigatório',
      width: 'w-28',
      align: 'center',
      render: (item, index) => (
        <input
          type="checkbox"
          checked={item.obrigatorio}
          onChange={(e) => atualizar(index, 'obrigatorio', e.target.checked)}
          disabled={disabled}
          className="accent-foreground"
          title="Obrigatório"
        />
      ),
    },
  ];

  return (
    <ItensOrdenaveisTable
      itens={recursos}
      colunas={colunas}
      onReordenar={reordenar}
      onRemover={remover}
      onAdicionar={adicionar}
      textoAdicionar="Adicionar recurso"
      titulo="Recursos Necessários"
      // No rodapé da tabela, como a duração nas sub-instruções: o total é
      // resultado da lista e pertence a ela, não a uma linha solta embaixo.
      // A duração aparece aqui também, e não só nas sub-instruções: é de onde
      // sai a quantidade das linhas em hora, e sem dizer isso o número que
      // aparece sozinho no campo vira mistério.
      resumo={[
        ...(horasDeDiaria > 0
          ? [
              {
                icone: <Clock className="h-3.5 w-3.5" />,
                label: 'Alocação',
                valor: `${diarias} ${diarias === 1 ? 'dia' : 'dias'} (${horasDeDiaria}h)`,
              },
            ]
          : []),
        {
          icone: <Wallet className="h-3.5 w-3.5" />,
          label: 'Custo estimado',
          valor: moeda(total),
        },
      ]}
      disabled={disabled}
    />
  );
}
