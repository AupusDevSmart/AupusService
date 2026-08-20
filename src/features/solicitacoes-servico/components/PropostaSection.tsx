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
  somaImpostos,
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
          bdi_regime: novo.bdi_regime,
          bdi_administracao_central: novo.bdi_administracao_central,
          bdi_seguro_garantia: novo.bdi_seguro_garantia,
          bdi_taxa_risco: novo.bdi_taxa_risco,
          bdi_despesas_financeiras: novo.bdi_despesas_financeiras,
          bdi_lucro: novo.bdi_lucro,
          bdi_pis: novo.bdi_pis,
          bdi_cofins: novo.bdi_cofins,
          bdi_cprb: novo.bdi_cprb,
          bdi_issqn: novo.bdi_issqn,
        }),
      'o BDI',
    );

  /** Troca um componente do BDI. */
  const mudarBdi = (campo: keyof Proposta) => (valor: number) =>
    salvarCondicoes((p) => ({ ...p, [campo]: valor }));

  /**
   * O REIDI desonera PIS e COFINS.
   *
   * Marcar zera os dois; desmarcar devolve os padrões. Depois disso cada um
   * continua editável — o regime é um atalho, não uma trava.
   */
  const trocarRegime = (comReidi: boolean) =>
    salvarCondicoes((p) => ({
      ...p,
      bdi_regime: comReidi ? 'COM_REIDI' : 'SEM_REIDI',
      bdi_pis: comReidi ? 0 : 0.65,
      bdi_cofins: comReidi ? 0 : 3,
    }));

  // O percentual sai da conta local, e não de `bdi_percentual`: enquanto a
  // resposta do servidor não chega, o campo gravado ainda é o anterior, e o
  // número piscaria para o valor velho a cada ajuste. A fórmula é a mesma.
  const bdi = calcularBdi(proposta) * 100;
  const impostos = somaImpostos(proposta);

  const faturamentoDireto = proposta.outros_custos
    .filter((c) => c.faturamento_direto)
    .reduce((soma, c) => soma + (c.valor || 0), 0);

  const custoBase = proposta.total_custo - faturamentoDireto;

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

  // Quem imprime é o pé do formulário; quem TEM a proposta é esta seção. O
  // efeito fica aqui, depois do `temProposta`, porque é a mesma condição que
  // decide se existe algo na tela para imprimir.
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
              {/* Em HORAS na tela, minutos no banco.
                  `sub_instrucoes.tempo_estimado` guarda minutos, e o sheet de
                  instrucao ja converte assim — mostrar minuto cru aqui faria o
                  mesmo dado aparecer como "90" num lugar e "1,5" no outro. */}
              <div className="w-14 shrink-0">
                <input
                  className="input-minimal input-numero text-center"
                  type="number"
                  min="0"
                  step="0.25"
                  placeholder="0"
                  value={etapa.tempo_estimado ? etapa.tempo_estimado / 60 : ''}
                  disabled={!editavel}
                  onChange={(e) => {
                    const horas = Number(e.target.value);
                    salvarEtapas((p) => ({
                      ...p,
                      subinstrucoes: p.subinstrucoes.map((s, i) =>
                        i === indice
                          ? { ...s, tempo_estimado: horas > 0 ? Math.round(horas * 60) : null }
                          : s,
                      ),
                    }));
                  }}
                />
              </div>
              <span className="w-6 shrink-0 text-xs text-muted-foreground">h</span>
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
                {/* "R$" fora do campo, e nao como padding interno: o padding do
                    .input-minimal venceria um pl-7 pela ordem do CSS. */}
                <span className="shrink-0 text-xs text-muted-foreground">R$</span>
                <div className="w-20 shrink-0">
                  <input
                    className="input-minimal input-numero text-center"
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
        <div className="p-3">
          <span className="text-sm font-medium">Fechamento</span>
        </div>

        <div className="border-t px-4 py-3 space-y-4">
          {/* O BDI, pela fórmula do acórdão 2.622/2013 do TCU. Os componentes
              ficam à vista porque proposta com preço é auditável: quem pergunta
              de onde veio o percentual precisa ver a memória de cálculo, e não
              um número pronto. */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium">BDI</span>
                <span className="text-base font-semibold tabular-nums">{percentual(bdi)}%</span>
              </div>

              <label
                className="flex items-center gap-2 text-sm"
                title="Regime Especial de Incentivos para o Desenvolvimento da Infraestrutura — desonera PIS e COFINS"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={proposta.bdi_regime === 'COM_REIDI'}
                  disabled={!editavel}
                  onChange={(e) => trocarRegime(e.target.checked)}
                />
                Com REIDI
              </label>
            </div>

            <div className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2">
              <div className="space-y-2">
                <CampoPercentual
                  rotulo="Administração central"
                  valor={proposta.bdi_administracao_central}
                  editavel={editavel}
                  onCommit={mudarBdi('bdi_administracao_central')}
                />
                <CampoPercentual
                  rotulo="Seguro e garantia"
                  valor={proposta.bdi_seguro_garantia}
                  editavel={editavel}
                  onCommit={mudarBdi('bdi_seguro_garantia')}
                />
                <CampoPercentual
                  rotulo="Taxa de risco"
                  valor={proposta.bdi_taxa_risco}
                  editavel={editavel}
                  onCommit={mudarBdi('bdi_taxa_risco')}
                />
                <CampoPercentual
                  rotulo="Despesas financeiras"
                  valor={proposta.bdi_despesas_financeiras}
                  editavel={editavel}
                  onCommit={mudarBdi('bdi_despesas_financeiras')}
                />
                <CampoPercentual
                  rotulo="Lucro"
                  valor={proposta.bdi_lucro}
                  editavel={editavel}
                  onCommit={mudarBdi('bdi_lucro')}
                />
              </div>

              <div className="space-y-2">
                <CampoPercentual
                  rotulo="PIS"
                  valor={proposta.bdi_pis}
                  editavel={editavel}
                  onCommit={mudarBdi('bdi_pis')}
                />
                <CampoPercentual
                  rotulo="COFINS"
                  valor={proposta.bdi_cofins}
                  editavel={editavel}
                  onCommit={mudarBdi('bdi_cofins')}
                />
                <CampoPercentual
                  rotulo="CPRB"
                  titulo="Contribuição Previdenciária sobre a Receita Bruta"
                  valor={proposta.bdi_cprb}
                  editavel={editavel}
                  onCommit={mudarBdi('bdi_cprb')}
                />
                <CampoPercentual
                  rotulo="ISSQN"
                  titulo="Imposto Sobre Serviços de Qualquer Natureza"
                  valor={proposta.bdi_issqn}
                  editavel={editavel}
                  onCommit={mudarBdi('bdi_issqn')}
                />

                <div className="flex items-center justify-between gap-2 border-t pt-2">
                  <span className="text-sm text-muted-foreground">Impostos (I)</span>
                  <span className="pr-5 text-sm tabular-nums">{percentual(impostos)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* O faturamento direto aparece em linha própria porque não recebe
              BDI: o cliente paga o fornecedor, e o dinheiro não passa aqui. */}
          <dl className="space-y-1 border-t pt-3">
            <Total rotulo="Custo" valor={custoBase} />
            <Total rotulo={`BDI (${percentual(bdi)}%)`} valor={proposta.total_bdi} />
            {faturamentoDireto > 0 && (
              <Total rotulo="Faturamento direto" valor={faturamentoDireto} />
            )}
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

      <div className="w-14 shrink-0">
        <input
          className="input-minimal input-numero text-center"
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

      <span className="shrink-0 text-xs text-muted-foreground">R$</span>
      <div className="w-20 shrink-0">
        <input
          className="input-minimal input-numero text-center"
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

/**
 * Um percentual do BDI.
 *
 * O texto fica em estado local e só é gravado no blur. Com nove campos, gravar
 * a cada tecla dispararia um PUT por dígito — e duas respostas fora de ordem
 * devolveriam o valor antigo para dentro do campo no meio da digitação.
 */
function CampoPercentual({
  rotulo,
  titulo,
  valor,
  editavel,
  onCommit,
}: {
  rotulo: string;
  titulo?: string;
  valor: number;
  editavel: boolean;
  onCommit: (valor: number) => void;
}) {
  const [texto, setTexto] = useState(String(valor ?? 0));

  // Muda por fora quando o REIDI zera PIS e COFINS.
  useEffect(() => {
    setTexto(String(valor ?? 0));
  }, [valor]);

  const gravar = () => {
    const lido = Number(String(texto).replace(',', '.'));
    const limpo = Number.isFinite(lido) && lido >= 0 ? lido : 0;
    setTexto(String(limpo));
    if (limpo !== valor) onCommit(limpo);
  };

  return (
    <div className="flex items-center justify-between gap-2">
      <label className="min-w-0 truncate text-sm text-muted-foreground" title={titulo || rotulo}>
        {rotulo}
      </label>
      <div className="flex shrink-0 items-center gap-1">
        <div className="w-16">
          <input
            className="input-minimal input-numero text-center"
            type="number"
            step="0.01"
            min="0"
            max="100"
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
        <span className="w-4 text-xs text-muted-foreground">%</span>
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

export type { SubinstrucaoProposta };
