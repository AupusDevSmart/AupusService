// src/features/solicitacoes-servico/components/PropostaSection.tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, Trash2, RefreshCw, Loader2, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { formatApiError } from '@/utils/api-error';
import {
  propostaApi,
  propostaVazia,
  calcularRascunho,
  montarDeInstrucoes,
  moeda,
  type ItemProposta,
  type OutroCusto,
  type Proposta,
  type SubinstrucaoProposta,
} from '@/services/proposta.services';

interface PropostaSectionProps {
  /** Nulo enquanto a solicitação não foi salva. Aí a seção vira rascunho. */
  solicitacaoId: string | null;
  /** As instruções escolhidas acima. Mudou aqui, a proposta se refaz. */
  instrucoesIds?: string[];
  somenteLeitura?: boolean;
  numero?: string;
  titulo?: string;
  cliente?: string;
  /** Sobe o rascunho para a página persistir depois de criar a solicitação. */
  onRascunhoChange?: (rascunho: Proposta) => void;
}

/**
 * A proposta comercial dentro do sheet da solicitação.
 *
 * Funciona nos dois momentos. Com a solicitação já salva, cada mudança vai
 * direto para a API e os totais voltam calculados pelo servidor. No cadastro,
 * quando ainda não há id, a seção trabalha sobre um rascunho local e a página
 * o persiste assim que a solicitação nasce — antes, ela simplesmente sumia, e
 * o lucro, a nota fiscal e os outros custos ficavam invisíveis justamente na
 * hora de montar o orçamento.
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
  numero,
  titulo,
  cliente,
  onRascunhoChange,
}: PropostaSectionProps) {
  const rascunho = !solicitacaoId;
  const [proposta, setProposta] = useState<Proposta>(propostaVazia);
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [gerando, setGerando] = useState(false);

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
    void aplicar(m, (id, novo) => propostaApi.salvarItens(id, novo.itens), 'o item');

  const salvarCustos = (m: (p: Proposta) => Proposta) =>
    void aplicar(m, (id, novo) => propostaApi.salvarOutrosCustos(id, novo.outros_custos), 'o custo');

  const salvarEtapas = (m: (p: Proposta) => Proposta) =>
    void aplicar(m, (id, novo) => propostaApi.salvarSubinstrucoes(id, novo.subinstrucoes), 'a etapa');

  /** Grava itens e etapas juntos — é o que a troca de instrução mexe. */
  const salvarTudo = (m: (p: Proposta) => Proposta) =>
    void aplicar(
      m,
      async (id, novo) => {
        await propostaApi.salvarSubinstrucoes(id, novo.subinstrucoes);
        return propostaApi.salvarItens(id, novo.itens);
      },
      'a proposta',
    );

  const salvarCondicoes = (m: (p: Proposta) => Proposta) =>
    void aplicar(
      m,
      (id, novo) =>
        propostaApi.salvarCondicoes(id, {
          lucro_percentual: novo.lucro_percentual,
          com_nota_fiscal: novo.com_nota_fiscal,
        }),
      'as condições',
    );

  /**
   * Preenche itens e etapas quando o conjunto de instruções muda.
   *
   * A chave é a lista ordenada, e não o array: o pai recria esse array a cada
   * render, e comparar por referência dispararia o efeito sem parar.
   *
   * Só age quando muda de verdade — e nunca no primeiro render de uma proposta
   * já salva, senão sobrescreveria os preços que a pessoa ajustou antes.
   */
  const chaveInstrucoes = [...instrucoesIds].map((x) => String(x).trim()).sort().join('|');
  const chaveAnteriorRef = useRef<string | null>(null);

  useEffect(() => {
    if (somenteLeitura) return;
    if (carregando) return;

    // Primeira passagem: só registra o que já está lá.
    if (chaveAnteriorRef.current === null) {
      chaveAnteriorRef.current = chaveInstrucoes;
      return;
    }

    if (chaveAnteriorRef.current === chaveInstrucoes) return;
    chaveAnteriorRef.current = chaveInstrucoes;

    let cancelado = false;

    void (async () => {
      const ids = chaveInstrucoes ? chaveInstrucoes.split('|') : [];
      const { itens, subinstrucoes } = await montarDeInstrucoes(ids);
      if (cancelado) return;

      // Os itens avulsos sobrevivem: não vieram de instrução nenhuma e não
      // são da conta desta troca.
      salvarTudo((p) => ({
        ...p,
        subinstrucoes,
        itens: [...itens, ...p.itens.filter((i) => !i.instrucao_id)],
      }));
    })();

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaveInstrucoes, somenteLeitura]);

  const gerarPdf = async () => {
    try {
      setGerando(true);
      // Carregada só aqui: a biblioteca é pesada e o bundle já é grande. Quem
      // nunca gera proposta não paga por ela.
      const { gerarPropostaPdf } = await import('@/lib/pdf/proposta');
      await gerarPropostaPdf({ proposta, numero, titulo, cliente });
    } catch (erro) {
      toast.error('Não foi possível gerar o PDF', { description: formatApiError(erro) });
    } finally {
      setGerando(false);
    }
  };

  const editavel = !somenteLeitura;

  /**
   * Sem instrucao vinculada nao ha proposta.
   *
   * As secoes nascem do que a instrucao traz — etapas e recursos. Mostrar tres
   * blocos vazios antes disso enche o sheet de campos que so vao se preencher
   * depois, e da a entender que ha algo a fazer ali.
   *
   * A propria proposta tambem conta: uma solicitacao antiga pode ter itens sem
   * o vinculo estar carregado no formulario ainda, e escondel-los apagaria da
   * tela um orcamento que existe.
   */
  const temProposta =
    proposta.itens.length > 0 ||
    proposta.subinstrucoes.length > 0 ||
    proposta.outros_custos.length > 0;

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

      {/* ---------------- ETAPAS ---------------- */}
      <div className="border rounded-lg">
        <div className="flex items-center justify-between p-3">
          <span className="text-sm font-medium">
            Etapas do serviço{proposta.subinstrucoes.length > 0 && ` (${proposta.subinstrucoes.length})`}
          </span>
          {editavel && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                salvarEtapas((p) => ({
                  ...p,
                  subinstrucoes: [...p.subinstrucoes, { descricao: '', tempo_estimado: null }],
                }))
              }
            >
              <Plus className="h-4 w-4 mr-1" />
              Etapa
            </Button>
          )}
        </div>

        <div className="border-t px-4 py-3 space-y-2">
          {proposta.subinstrucoes.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhuma etapa. Vincule uma instrução acima ou adicione à mão.
            </p>
          )}

          {/* Mesmo formato do sheet de instrução: número, descrição e tempo em
              campos — e não uma lista somente-leitura. Editar aqui ajusta o
              escopo DESTA proposta, sem tocar na instrução de origem. */}
          {proposta.subinstrucoes.map((etapa, indice) => (
            <div key={indice} className="flex items-center gap-2">
              <span className="w-5 shrink-0 text-right text-xs text-muted-foreground">
                {indice + 1}.
              </span>
              {/* O tamanho vai no container, e o input ocupa 100% dele: a
                  classe .input-minimal traz width:100% e ganharia de um w-14
                  aplicado no proprio campo. */}
              <div className="min-w-0 flex-1">
                <input
                  className="input-minimal"
                  value={etapa.descricao}
                  placeholder="O que será feito nesta etapa"
                  disabled={!editavel}
                  onChange={(e) =>
                    salvarEtapas((p) => ({
                      ...p,
                      subinstrucoes: p.subinstrucoes.map((s, i) =>
                        i === indice ? { ...s, descricao: e.target.value } : s,
                      ),
                    }))
                  }
                />
              </div>
              <div className="w-16 shrink-0">
                <input
                  className="input-minimal text-right"
                  type="number"
                  min="0"
                  placeholder="min"
                  value={etapa.tempo_estimado ?? ''}
                  disabled={!editavel}
                  onChange={(e) =>
                    salvarEtapas((p) => ({
                      ...p,
                      subinstrucoes: p.subinstrucoes.map((s, i) =>
                        i === indice
                          ? { ...s, tempo_estimado: e.target.value === '' ? null : Number(e.target.value) }
                          : s,
                      ),
                    }))
                  }
                />
              </div>
              {/* Sem rotulo "min" separado: ele repetia o placeholder do campo
                  e custava mais largura do que informacao. */}
              {editavel && (
                <BotaoRemover
                  onClick={() =>
                    salvarEtapas((p) => ({
                      ...p,
                      subinstrucoes: p.subinstrucoes.filter((_, i) => i !== indice),
                    }))
                  }
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ---------------- ITENS ---------------- */}
      <div className="border rounded-lg">
        <div className="flex items-center justify-between p-3">
          <span className="text-sm font-medium">Itens</span>
          <div className="flex items-center gap-1">
            {salvando && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
            {editavel && (
              <>
                {!rascunho && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      void aplicar(
                        (p) => p,
                        (id) => propostaApi.recarregar(id),
                        'a recarga',
                      )
                    }
                    title="Refaz a lista a partir das instruções. Descarta os preços editados."
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    salvarItens((p) => ({
                      ...p,
                      itens: [...p.itens, { descricao: '', quantidade: 1, preco_unitario: 0 }],
                    }))
                  }
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Item
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="border-t px-4 py-3 space-y-2">
          {carregando && <p className="text-sm text-muted-foreground">Carregando...</p>}

          {!carregando && proposta.itens.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum item. Vincule uma instrução acima ou adicione à mão.
            </p>
          )}

          {proposta.itens.map((item, indice) => (
            <LinhaItem
              key={item.id ?? `novo-${indice}`}
              item={item}
              editavel={editavel}
              onCampo={(campo, valor) =>
                salvarItens((p) => ({
                  ...p,
                  itens: p.itens.map((it, i) => (i === indice ? { ...it, [campo]: valor } : it)),
                }))
              }
              onRemover={() =>
                salvarItens((p) => ({ ...p, itens: p.itens.filter((_, i) => i !== indice) }))
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
                <div className="w-24 shrink-0">
                  <input
                    className="input-minimal text-right"
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
                  title="Faturamento direto — o cliente paga o fornecedor. Fica fora da base do imposto."
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
        <div className="flex items-center justify-between p-3">
          <span className="text-sm font-medium">Fechamento</span>
          <Button type="button" variant="outline" size="sm" onClick={gerarPdf} disabled={gerando}>
            {gerando ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4 mr-1" />
            )}
            Gerar PDF
          </Button>
        </div>

        <div className="border-t px-4 py-3 space-y-3">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Lucro</label>
              <div className="w-20 shrink-0">
                <input
                  className="input-minimal text-right"
                  type="number"
                  step="0.01"
                  min="0"
                  value={proposta.lucro_percentual}
                  disabled={!editavel}
                  onChange={(e) =>
                    salvarCondicoes((p) => ({ ...p, lucro_percentual: Number(e.target.value) || 0 }))
                  }
                />
              </div>
              <span className="text-sm text-muted-foreground">%</span>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={proposta.com_nota_fiscal}
                disabled={!editavel}
                onChange={(e) =>
                  salvarCondicoes((p) => ({ ...p, com_nota_fiscal: e.target.checked }))
                }
              />
              Com nota fiscal
              {proposta.com_nota_fiscal && (
                <span className="text-xs text-muted-foreground">
                  ({proposta.aliquota_percentual}% por dentro)
                </span>
              )}
            </label>
          </div>

          <dl className="space-y-1 border-t pt-3">
            <Total rotulo="Custo" valor={proposta.total_custo} />
            {proposta.total_imposto > 0 && (
              <Total rotulo="Imposto" valor={proposta.total_imposto} />
            )}
            <Total rotulo="Lucro" valor={proposta.total_lucro} />
            <Total rotulo="Total da proposta" valor={proposta.total_geral} destaque />
          </dl>
        </div>
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

/** Uma linha de item, com a variação de preço ao lado. */
function LinhaItem({
  item,
  editavel,
  onCampo,
  onRemover,
}: {
  item: ItemProposta;
  editavel: boolean;
  onCampo: (campo: 'quantidade' | 'preco_unitario', valor: number) => void;
  onRemover: () => void;
}) {
  const original = item.preco_unitario_original ?? null;
  const atual = item.preco_unitario ?? 0;

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

      <div className="w-16 shrink-0">
        <input
          className="input-minimal text-right"
          type="number"
          step="0.001"
          min="0"
          value={item.quantidade}
          disabled={!editavel}
          onChange={(e) => onCampo('quantidade', Number(e.target.value) || 0)}
          title="Quantidade"
        />
      </div>
      <span className="w-6 shrink-0 text-xs text-muted-foreground">{item.unidade || ''}</span>

      <div className="w-24 shrink-0">
        <input
          className="input-minimal text-right"
          type="number"
          step="0.01"
          min="0"
          value={atual}
          disabled={!editavel}
          onChange={(e) => onCampo('preco_unitario', Number(e.target.value) || 0)}
          title="Preço unitário"
        />
      </div>

      {/* Verde para cima, vermelho para baixo — o par já usado no resto do
          produto. Discreto: é uma nota, não um alerta. */}
      <span className="w-12 shrink-0 text-right text-[11px]">
        {variacao !== null && (
          <span
            className={
              variacao > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'
            }
            title={`Catálogo: ${moeda(original ?? 0)}`}
          >
            {variacao > 0 ? '+' : ''}
            {variacao.toFixed(1).replace('.', ',')}%
          </span>
        )}
      </span>

      <span className="w-20 shrink-0 text-right text-sm tabular-nums">
        {moeda((item.quantidade || 0) * atual)}
      </span>

      {editavel && <BotaoRemover onClick={onRemover} />}
    </div>
  );
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

export type { SubinstrucaoProposta };
