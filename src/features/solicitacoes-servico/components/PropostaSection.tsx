// src/features/solicitacoes-servico/components/PropostaSection.tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, Trash2, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { formatApiError } from '@/utils/api-error';
import {
  propostaApi,
  propostaVazia,
  calcularRascunho,
  calcularBdi,
  montarDeInstrucoes,
  moeda,
  type ItemProposta,
  type OutroCusto,
  type Proposta,
} from '@/services/proposta.services';

interface PropostaSectionProps {
  /** Nulo enquanto a solicitação não foi salva. Aí a seção vira rascunho. */
  solicitacaoId: string | null;
  /** As instruções escolhidas acima. São elas que definem as linhas daqui. */
  instrucoesIds?: string[];
  somenteLeitura?: boolean;
  /** Sobe o rascunho para a página persistir depois de criar a solicitação. */
  onRascunhoChange?: (rascunho: Proposta) => void;
  /**
   * Sobe a proposta corrente — nos dois modos — para quem precisa dela fora
   * daqui. Hoje é o botão de PDF, que fecha o formulário. Nulo quando não há
   * nada a imprimir.
   */
  onPropostaChange?: (proposta: Proposta | null) => void;
}

/**
 * A proposta comercial dentro do sheet da solicitação.
 *
 * Uma linha por instrução vinculada, com o VALOR FECHADO daquela instrução —
 * nada é copiado item a item. O valor nasce da soma dos recursos do catálogo,
 * como sugestão, e a pessoa ajusta por cima. Quem quiser mudar a composição
 * edita a instrução, pelo botão no card dela.
 *
 * Funciona nos dois momentos. Com a solicitação já salva, cada mudança vai
 * direto para a API e os totais voltam calculados pelo servidor. No cadastro,
 * quando ainda não há id, a seção trabalha sobre um rascunho local e a página
 * o persiste assim que a solicitação nasce.
 *
 * Segue o vocabulário visual das outras seções deste sheet: moldura
 * `border rounded-lg` sem tint (os tokens deste projeto não têm canal alpha,
 * então o `bg-muted/20` dos vizinhos não pinta nada, e imitá-lo com `bg-muted`
 * deixaria esta seção mais marcada que as outras), cabeçalho em
 * `flex items-center justify-between p-3` e corpo em `border-t px-4 py-3`.
 */
export function PropostaSection({
  solicitacaoId,
  instrucoesIds = [],
  somenteLeitura = false,
  onRascunhoChange,
  onPropostaChange,
}: PropostaSectionProps) {
  const rascunho = !solicitacaoId;
  const [proposta, setProposta] = useState<Proposta>(propostaVazia);
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    if (!solicitacaoId) return;
    try {
      setCarregando(true);
      setProposta(await propostaApi.obter(solicitacaoId));
    } catch (erro) {
      toast.error('Não foi possível carregar a proposta', {
        description: formatApiError(erro),
      });
    } finally {
      setCarregando(false);
    }
  }, [solicitacaoId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  /**
   * Um caminho para os dois modos.
   *
   * No rascunho, aplica a mudança em memória e recalcula localmente. Com id,
   * manda para a API e ADOTA o retorno: atualizar por conta própria faria a
   * tela mostrar um total que o servidor ainda não confirmou — e é esse número
   * que vai para o PDF.
   */
  const aplicar = async (
    mudanca: (atual: Proposta) => Proposta,
    persistir: (id: string, novo: Proposta) => Promise<Proposta>,
    oQue: string,
  ) => {
    const novo = mudanca(proposta);

    if (rascunho) {
      const calculado = calcularRascunho(novo);
      setProposta(calculado);
      onRascunhoChange?.(calculado);
      return;
    }

    setProposta(novo); // resposta imediata ao clique
    try {
      setSalvando(true);
      setProposta(await persistir(solicitacaoId!, novo));
    } catch (erro) {
      toast.error(`Não foi possível salvar ${oQue}`, { description: formatApiError(erro) });
      await carregar();
    } finally {
      setSalvando(false);
    }
  };

  const salvarItens = (m: (p: Proposta) => Proposta) =>
    void aplicar(m, (id, novo) => propostaApi.salvarItens(id, novo.itens), 'o valor');

  const salvarCustos = (m: (p: Proposta) => Proposta) =>
    void aplicar(m, (id, novo) => propostaApi.salvarOutrosCustos(id, novo.outros_custos), 'o custo');

  /**
   * Uma linha por instrução vinculada — nem mais, nem menos.
   *
   * A comparação é entre o conjunto de instruções do formulário e o conjunto
   * que as linhas dizem representar. Divergiu, refaz. Isso cobre três casos com
   * a mesma regra: vincular, desvincular, e encontrar dados do formato antigo
   * (uma linha por recurso, ou linha avulsa sem instrução) numa proposta salva
   * antes desta mudança.
   *
   * O `?` marca a linha que não pode representar uma instrução: sem
   * `instrucao_id`, ou com `recurso_id` — este último é a assinatura do formato
   * antigo, quando cada recurso virava uma linha. Nenhum id casa com `?`, então
   * o conjunto diverge e a lista é refeita.
   *
   * O `recurso_id` importa no caso estreito de uma instrução com um único
   * recurso: ali havia uma linha só, os conjuntos casariam, e a proposta ficaria
   * mostrando o nome do parafuso onde devia estar o nome da instrução.
   */
  const chaveInstrucoes = [...instrucoesIds]
    .map((x) => String(x).trim())
    .filter(Boolean)
    .sort()
    .join('|');

  const chaveDasLinhas = proposta.itens
    .map((i) => (i.recurso_id ? '?' : String(i.instrucao_id ?? '?').trim() || '?'))
    .sort()
    .join('|');

  // A última chave que tentamos montar. Sem isso, uma instrução que o servidor
  // não devolve deixaria os conjuntos divergentes para sempre, e o efeito
  // ficaria tentando montar a lista em laço.
  const tentadaRef = useRef<string | null>(null);

  useEffect(() => {
    if (somenteLeitura || carregando) return;

    if (chaveDasLinhas === chaveInstrucoes) {
      tentadaRef.current = null;
      return;
    }

    if (tentadaRef.current === chaveInstrucoes) return;
    tentadaRef.current = chaveInstrucoes;

    let cancelado = false;

    void (async () => {
      const ids = chaveInstrucoes ? chaveInstrucoes.split('|') : [];
      const itens = await montarDeInstrucoes(ids, proposta.itens);
      if (cancelado) return;
      salvarItens((p) => ({ ...p, itens }));
    })();

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaveInstrucoes, chaveDasLinhas, carregando, somenteLeitura]);

  const editavel = !somenteLeitura;

  const bdi = calcularBdi(proposta) * 100;

  const faturamentoDireto = proposta.outros_custos
    .filter((c) => c.faturamento_direto)
    .reduce((soma, c) => soma + (c.valor || 0), 0);

  const custoBase = proposta.total_custo - faturamentoDireto;

  /**
   * Sem instrução vinculada não há proposta.
   *
   * A seção nasce do que foi vinculado acima. Mostrar blocos vazios antes disso
   * enche o sheet de campos que só vão se preencher depois, e dá a entender que
   * há algo a fazer ali.
   *
   * A própria proposta também conta: uma solicitação antiga pode ter valores
   * sem o vínculo estar carregado no formulário ainda, e escondê-los apagaria
   * da tela um orçamento que existe.
   */
  const temProposta = proposta.itens.length > 0 || proposta.outros_custos.length > 0;

  // Quem imprime é o pé do formulário; quem TEM a proposta é esta seção.
  useEffect(() => {
    onPropostaChange?.(temProposta ? proposta : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposta, temProposta]);

  if (instrucoesIds.length === 0 && !temProposta) {
    return (
      <p className="text-sm text-muted-foreground">
        Vincule uma instrução acima para montar a proposta.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {rascunho && (
        <p className="text-xs text-muted-foreground">
          A proposta será gravada junto com a solicitação.
        </p>
      )}

      {/* ---------------- INSTRUÇÕES ---------------- */}
      <div className="border rounded-lg">
        <div className="flex items-center justify-between p-3">
          <span className="text-sm font-medium">Instruções</span>
          <div className="flex items-center gap-1">
            {salvando && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
            {editavel && !rascunho && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  void aplicar((p) => p, (id) => propostaApi.recarregar(id), 'a recarga')
                }
                title="Refaz os valores a partir do catálogo. Descarta o que foi ajustado."
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="border-t px-4 py-3 space-y-2">
          {carregando && <p className="text-sm text-muted-foreground">Carregando...</p>}

          {!carregando && proposta.itens.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhuma instrução vinculada.
            </p>
          )}

          {proposta.itens.map((item, indice) => (
            <LinhaInstrucao
              key={item.id ?? item.instrucao_id ?? `novo-${indice}`}
              item={item}
              editavel={editavel}
              onValor={(valor) =>
                salvarItens((p) => ({
                  ...p,
                  itens: p.itens.map((it, i) =>
                    i === indice ? { ...it, preco_unitario: valor } : it,
                  ),
                }))
              }
            />
          ))}
        </div>
      </div>

      {/* ---------------- OUTROS CUSTOS ---------------- */}
      <div className="border rounded-lg">
        <div className="flex items-center justify-between p-3">
          <span className="text-sm font-medium">Outros custos</span>
          {editavel && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                salvarCustos((p) => ({
                  ...p,
                  outros_custos: [
                    ...p.outros_custos,
                    { descricao: '', valor: 0, faturamento_direto: false },
                  ],
                }))
              }
            >
              <Plus className="h-4 w-4 mr-1" />
              Custo
            </Button>
          )}
        </div>

        <div className="border-t px-4 py-3 space-y-2">
          {proposta.outros_custos.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum custo adicional.</p>
          )}

          {proposta.outros_custos.map((custo, indice) => {
            const trocar = (dados: Partial<OutroCusto>) =>
              salvarCustos((p) => ({
                ...p,
                outros_custos: p.outros_custos.map((c, i) =>
                  i === indice ? { ...c, ...dados } : c,
                ),
              }));

            return (
              <div key={custo.id ?? `novo-${indice}`} className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <input
                    className="input-minimal"
                    value={custo.descricao}
                    placeholder="Ex.: frete, hospedagem"
                    disabled={!editavel}
                    onChange={(e) => trocar({ descricao: e.target.value })}
                  />
                </div>
                {/* "R$" fora do campo, e nao como padding interno: o padding do
                    .input-minimal venceria um pl-7 pela ordem do CSS. */}
                <span className="shrink-0 text-xs text-muted-foreground">R$</span>
                <div className="w-24 shrink-0">
                  <input
                    className="input-minimal input-numero text-right"
                    type="number"
                    step="0.01"
                    min="0"
                    value={custo.valor}
                    disabled={!editavel}
                    onChange={(e) => trocar({ valor: Number(e.target.value) || 0 })}
                  />
                </div>
                {/* FD na tela, nome por extenso no hover: cabe na linha e não
                    força quebra num sheet estreito. */}
                <label
                  className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground"
                  title="Faturamento direto — o cliente paga o fornecedor. Fica fora da base do BDI."
                >
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5"
                    checked={custo.faturamento_direto}
                    disabled={!editavel}
                    onChange={(e) => trocar({ faturamento_direto: e.target.checked })}
                  />
                  FD
                </label>
                {editavel && (
                  <BotaoRemover
                    onClick={() =>
                      salvarCustos((p) => ({
                        ...p,
                        outros_custos: p.outros_custos.filter((_, i) => i !== indice),
                      }))
                    }
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ---------------- FECHAMENTO ---------------- */}
      <div className="border rounded-lg">
        <div className="p-3">
          <span className="text-sm font-medium">Fechamento</span>
        </div>

        {/* O BDI fica no padrão da tabela GOINFRA e não é editado aqui. Os nove
            componentes continuam gravados por solicitação — o que saiu foi a
            edição, não o registro: proposta com preço é auditável, e a memória
            de cálculo tem que estar no banco mesmo sem estar na tela.

            O faturamento direto aparece em linha própria porque não recebe BDI:
            o cliente paga o fornecedor, e o dinheiro não passa aqui. */}
        <dl className="border-t px-4 py-3 space-y-1">
          <Total rotulo="Custo" valor={custoBase} />
          <Total rotulo={`BDI (${percentual(bdi)}%)`} valor={proposta.total_bdi} />
          {faturamentoDireto > 0 && (
            <Total rotulo="Faturamento direto" valor={faturamentoDireto} />
          )}
          <Total rotulo="Total da proposta" valor={proposta.total_geral} destaque />
        </dl>
      </div>
    </div>
  );
}

function BotaoRemover({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
      onClick={onClick}
      title="Remover"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}

/**
 * Uma instrução e o valor fechado dela.
 *
 * O texto fica em estado local e só grava no blur: gravar a cada tecla
 * dispararia um PUT por dígito, e duas respostas fora de ordem devolveriam o
 * valor antigo para dentro do campo no meio da digitação.
 */
function LinhaInstrucao({
  item,
  editavel,
  onValor,
}: {
  item: ItemProposta;
  editavel: boolean;
  onValor: (valor: number) => void;
}) {
  const atual = item.preco_unitario ?? 0;
  const [texto, setTexto] = useState(String(atual));

  // Muda por fora quando a recarga refaz os valores a partir do catálogo.
  useEffect(() => {
    setTexto(String(atual));
  }, [atual]);

  const gravar = () => {
    const lido = Number(String(texto).replace(',', '.'));
    const limpo = Number.isFinite(lido) && lido >= 0 ? lido : 0;
    setTexto(String(limpo));
    if (limpo !== atual) onValor(limpo);
  };

  const original = item.preco_unitario_original ?? null;

  // Só compara quando há régua e ela não é zero — dividir por zero daria
  // Infinity, e "aumentou ∞%" não diz nada a ninguém.
  const variacao =
    original !== null && original > 0 && atual !== original
      ? ((atual - original) / original) * 100
      : null;

  return (
    <div className="flex items-center gap-2">
      {/* A descricao recebe toda a sobra: os demais elementos tem largura fixa
          e nao encolhem. */}
      <span className="min-w-0 flex-1 truncate text-sm" title={item.descricao}>
        {item.descricao || <span className="text-muted-foreground">Sem descrição</span>}
      </span>

      {variacao !== null && (
        <span
          className={`shrink-0 text-[11px] tabular-nums ${
            variacao > 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'
          }`}
          title={`Sugerido pelo catálogo: ${moeda(original ?? 0)}`}
        >
          {variacao > 0 ? '+' : ''}
          {percentual(variacao)}%
        </span>
      )}

      <span className="shrink-0 text-xs text-muted-foreground">R$</span>
      <div className="w-24 shrink-0">
        <input
          className="input-minimal input-numero text-right"
          type="number"
          step="0.01"
          min="0"
          value={texto}
          disabled={!editavel}
          onChange={(e) => setTexto(e.target.value)}
          onBlur={gravar}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              (e.target as HTMLInputElement).blur();
            }
          }}
        />
      </div>
    </div>
  );
}

/** Percentual com as duas casas sempre visíveis: 30,44. */
function percentual(valor: number) {
  return (Number.isFinite(valor) ? valor : 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function Total({
  rotulo,
  valor,
  destaque,
}: {
  rotulo: string;
  valor: number;
  destaque?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={destaque ? 'text-sm font-medium' : 'text-sm text-muted-foreground'}>
        {rotulo}
      </dt>
      <dd className={`tabular-nums ${destaque ? 'text-base font-semibold' : 'text-sm'}`}>
        {moeda(valor)}
      </dd>
    </div>
  );
}
