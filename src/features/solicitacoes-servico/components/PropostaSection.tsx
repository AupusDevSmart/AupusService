// src/features/solicitacoes-servico/components/PropostaSection.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Trash2, RefreshCw, Loader2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CampoDeNumero } from '@/components/common/CampoDeNumero';
import { formatApiError } from '@/utils/api-error';
import { AVISO_DE_DINHEIRO, dinheiroNoCampo, lerDinheiroDigitado, numeroNoCampo } from '@/utils/leitura';
import {
  propostaApi,
  propostaVazia,
  calcularRascunho,
  calcularBdi,
  montarDeInstrucoes,
  linhaDaInstrucao,
  componentesDe,
  percentualNaTela,
  somaImpostos,
  moeda,
  type ComponentesDoBdi,
  type ItemProposta,
  type OutroCusto,
  type Proposta,
  type TipoDeDesconto,
} from '@/services/proposta.services';
import { instrucoesApi } from '@/services/instrucoes.services';
import { useUserStore } from '@/store/useUserStore';
import { ComponentesDoBdiCampos } from './ComponentesDoBdi';
import type { ValoresDaProposta } from './proposta-contexto';

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
  /**
   * Sobe os valores por instrução, para o card de cada uma poder editá-los.
   *
   * O valor mora aqui, mas é editado lá em cima — os dois campos são irmãos no
   * formulário e não se alcançam. A página faz a ponte.
   */
  onValoresChange?: (valores: ValoresDaProposta | null) => void;
}

/**
 * A proposta comercial dentro do sheet da solicitação.
 *
 * Guarda um VALOR FECHADO por instrução vinculada — nada é copiado item a item.
 * O valor nasce da soma dos recursos do catálogo, como sugestão, e é editado no
 * card da própria instrução, logo depois do nome: listá-las de novo aqui faria
 * cada instrução aparecer duas vezes na tela, uma para ser lida e outra para
 * ser precificada.
 *
 * Restam então dois blocos visíveis: os outros custos e o fechamento.
 *
 * Funciona nos dois momentos. Com a solicitação já salva, cada mudança vai
 * direto para a API e os totais voltam calculados pelo servidor. No cadastro,
 * quando ainda não há id, a seção trabalha sobre um rascunho local e a página
 * o persiste assim que a solicitação nasce.
 */
export function PropostaSection({
  solicitacaoId,
  instrucoesIds = [],
  somenteLeitura = false,
  onRascunhoChange,
  onPropostaChange,
  onValoresChange,
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

  // O rascunho nasce com o BDI padrão da empresa, o mesmo que o servidor dá à
  // solicitação ao criá-la: sem isso, a tela mostraria o GOINFRA e gravaria outro.
  // Só quem monta proposta o lê (é a margem da empresa: o cliente não)
  const montaProposta = useUserStore((st) => st.hasPermission('solicitacoes.manage'));
  useEffect(() => {
    if (!rascunho || somenteLeitura || !montaProposta) return;
    let cancelado = false;
    propostaApi
      .obterBdiPadrao()
      .then((padrao) => {
        if (cancelado) return;
        setProposta((atual) => {
          const calculado = calcularRascunho({ ...atual, ...componentesDe(padrao) });
          onRascunhoChange?.(calculado);
          return calculado;
        });
      })
      .catch((erro) => {
        if (!cancelado) toast.error('Não foi possível ler o BDI padrão', { description: `${formatApiError(erro)}. A proposta segue com o GOINFRA (30,44%).` });
      });
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rascunho, somenteLeitura, montaProposta]);

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
    if (rascunho) {
      // Sobre a proposta de agora, não a do render que chamou: a montagem das
      // linhas e o BDI padrão chegam de awaits diferentes, e um apagava o outro
      setProposta((atual) => {
        const calculado = calcularRascunho(mudanca(atual));
        onRascunhoChange?.(calculado);
        return calculado;
      });
      return;
    }

    const novo = mudanca(proposta);

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

  const salvarCondicoes = (
    m: (p: Proposta) => Proposta,
    dados: Parameters<typeof propostaApi.salvarCondicoes>[1],
    oQue: string,
  ) => void aplicar(m, (id) => propostaApi.salvarCondicoes(id, dados), oQue);

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
      try {
        const itens = await montarDeInstrucoes(ids, proposta.itens);
        if (cancelado) return;
        salvarItens((p) => ({ ...p, itens }));
        if (itens.length < ids.length) {
          toast.warning('Uma instrução vinculada não existe mais', { description: 'Ela ficou fora da proposta: desvincule-a.' });
        }
      } catch (erro) {
        if (cancelado) return;
        // Nada se grava (a lista sem a instrução nova apagaria a linha dela calada); o
        // próximo vínculo ou desvínculo tenta de novo
        tentadaRef.current = null;
        toast.error('Não foi possível montar o valor da instrução vinculada', { description: formatApiError(erro) });
      }
    })();

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaveInstrucoes, chaveDasLinhas, carregando, somenteLeitura]);

  const editavel = !somenteLeitura;

  // ------------------------------------------------------------------
  // Os valores, publicados para o card de cada instrução.
  // ------------------------------------------------------------------

  const valores = useMemo(() => {
    const mapa: Record<string, number> = {};
    for (const item of proposta.itens) {
      const id = String(item.instrucao_id ?? '').trim();
      if (id && !item.recurso_id) mapa[id] = item.preco_unitario ?? 0;
    }
    return mapa;
  }, [proposta.itens]);

  // O setter precisa enxergar a proposta do render atual, mas mudar de
  // identidade a cada tecla remontaria o contexto inteiro. O ref resolve os
  // dois: a função exposta é estável, o que ela chama é sempre o mais recente.
  const definirRef = useRef<(instrucaoId: string, valor: number) => void>(() => {});
  definirRef.current = (instrucaoId, valor) => {
    salvarItens((p) => ({
      ...p,
      itens: p.itens.map((it) =>
        String(it.instrucao_id ?? '').trim() === instrucaoId
          ? { ...it, preco_unitario: valor }
          : it,
      ),
    }));
  };

  const definir = useCallback(
    (instrucaoId: string, valor: number) => definirRef.current(instrucaoId, valor),
    [],
  );

  // A linha refeita pelo cadastro da instrução. Pelo ref, como o `definir`:
  // depois do await vale a proposta de agora, não a do clique
  const trocarLinhaRef = useRef<(linha: ItemProposta) => void>(() => {});
  trocarLinhaRef.current = (linha) => {
    if (somenteLeitura) return;
    const daInstrucao = (it: ItemProposta) => String(it.instrucao_id ?? '').trim() === linha.instrucao_id && !it.recurso_id;
    const atual = proposta.itens.find(daInstrucao);
    if (!atual) return;
    // O valor só se refaz quando o do cadastro mudou: editar só o texto da instrução
    // não desfaz o preço negociado nesta proposta
    const centavos = (v: number | null | undefined) => Math.round((v ?? 0) * 100);
    const mudouOValor = centavos(atual.preco_unitario_original ?? atual.preco_unitario) !== centavos(linha.preco_unitario);
    const mudouONome = atual.descricao !== linha.descricao;
    if (!mudouOValor && !mudouONome) return;
    salvarItens((p) => ({
      ...p,
      itens: p.itens.map((it) =>
        daInstrucao(it)
          ? mudouOValor
            ? { ...it, ...linha, sem_preco_no_cadastro: linha.sem_preco_no_cadastro }
            : { ...it, descricao: linha.descricao }
          : it,
      ),
    }));
    if (mudouOValor && centavos(atual.preco_unitario) !== centavos(linha.preco_unitario)) {
      toast.info(`Valor de ${linha.descricao} na proposta: ${moeda(atual.preco_unitario)} -> ${moeda(linha.preco_unitario)}`, {
        description: 'O valor do cadastro da instrução mudou.',
      });
    }
  };

  const refazer = useCallback(async (instrucaoId: string) => {
    try {
      trocarLinhaRef.current(linhaDaInstrucao(await instrucoesApi.findOne(instrucaoId.trim())));
    } catch (erro) {
      toast.error('A instrução foi salva, mas o valor dela na proposta não se atualizou', {
        description: `${formatApiError(erro)}. Use "Refaz os valores" no fechamento.`,
      });
    }
  }, []);

  // Salva, a lista é a da leitura do servidor; no rascunho, a marca de cada item montado aqui
  const semPreco = useMemo(
    () => [
      ...new Set([
        ...(proposta.instrucoes_sem_preco ?? []).map((id) => id.trim()),
        ...proposta.itens.filter((i) => i.sem_preco_no_cadastro && i.instrucao_id).map((i) => String(i.instrucao_id).trim()),
      ]),
    ],
    [proposta.instrucoes_sem_preco, proposta.itens],
  );

  useEffect(() => {
    onValoresChange?.({ valores, definir, editavel, semPreco, refazer: (id) => void refazer(id) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valores, definir, editavel, semPreco, refazer]);

  // Salva, o percentual do servidor: o cliente não recebe os componentes (a margem), só o resultado
  const bdi = rascunho ? calcularBdi(proposta) * 100 : proposta.bdi_percentual;
  // O BDI e o desconto são de quem monta proposta: o cliente que cadastra não grava a proposta
  const ajustaCondicoes = editavel && montaProposta;

  // ------------------------------------------------------------------
  // O BDI desta proposta: nasce do padrão da empresa e se ajusta aqui.
  // ------------------------------------------------------------------

  const [editandoBdi, setEditandoBdi] = useState<ComponentesDoBdi | null>(null);
  const editorDoBdi = useRef<HTMLDivElement>(null);

  const aplicarBdi = () => {
    if (!editandoBdi) return;
    // O campo ilegível ("6,5%") fica com o número de antes: aplicar gravaria aquele calado
    if (editorDoBdi.current?.querySelector('[data-ilegivel="true"]')) {
      toast.error('Há um percentual que não dá para ler', { description: 'Corrija o campo marcado antes de aplicar.' });
      return;
    }
    const componentes = editandoBdi;
    salvarCondicoes((p) => ({ ...p, ...componentes }), componentes, 'o BDI');
    setEditandoBdi(null);
  };

  const usarOPadrao = () =>
    propostaApi
      .obterBdiPadrao()
      .then((padrao) => setEditandoBdi(componentesDe(padrao)))
      .catch((erro) => toast.error('Não foi possível ler o BDI padrão', { description: formatApiError(erro) }));

  // ------------------------------------------------------------------
  // O desconto, sobre o total inteiro (o faturamento direto junto).
  // ------------------------------------------------------------------

  // O tipo escolhido antes de digitar o valor: sem valor, não há o que gravar
  const [tipoNovo, setTipoNovo] = useState<TipoDeDesconto | null>(null);
  const tipoDoDesconto = proposta.desconto_tipo ?? tipoNovo;
  const totalSemDesconto = Math.round((proposta.total_geral + proposta.total_desconto) * 100) / 100;
  // Remonta o campo do desconto recusado: senão ele seguia mostrando o número que não valeu
  const [versaoDoDesconto, setVersaoDoDesconto] = useState(0);

  const tirarDesconto = () => {
    setTipoNovo(null);
    if (proposta.desconto_tipo) {
      salvarCondicoes((p) => ({ ...p, desconto_tipo: null, desconto_valor: null }), { desconto_tipo: null }, 'o desconto');
    }
  };

  const gravarDesconto = (tipo: TipoDeDesconto, valor: number | null) => {
    if (valor === null || valor === 0) return tirarDesconto();
    // A mesma regra do servidor, antes de mandar (e no rascunho, que não tem servidor)
    if (tipo === 'PERCENTUAL' && valor > 100) {
      toast.error('O desconto em percentual vai até 100%');
      setVersaoDoDesconto((v) => v + 1);
      return;
    }
    if (tipo === 'VALOR' && Math.round(valor * 100) > Math.round(totalSemDesconto * 100)) {
      toast.error('O desconto passa do total da proposta', { description: `O total é ${moeda(totalSemDesconto)}.` });
      setVersaoDoDesconto((v) => v + 1);
      return;
    }
    setTipoNovo(null);
    salvarCondicoes((p) => ({ ...p, desconto_tipo: tipo, desconto_valor: valor }), { desconto_tipo: tipo, desconto_valor: valor }, 'o desconto');
  };

  /** Trocar % por R$ (ou o contrário) com desconto gravado mantém os reais descontados */
  const trocarTipoDeDesconto = (escolha: string) => {
    if (escolha === 'NENHUM') return tirarDesconto();
    const tipo = escolha as TipoDeDesconto;
    if (!proposta.desconto_tipo) return setTipoNovo(tipo);
    if (tipo === proposta.desconto_tipo) return;
    const emReais = proposta.total_desconto;
    const valor =
      tipo === 'VALOR' ? emReais : totalSemDesconto > 0 ? Math.round((emReais / totalSemDesconto) * 100 * 100) / 100 : 0;
    gravarDesconto(tipo, valor);
  };

  // O total caiu abaixo do desconto em reais: vale até o total, e a tela diz
  const descontoLimitado =
    proposta.desconto_tipo === 'VALOR' && (proposta.desconto_valor ?? 0) > proposta.total_desconto + 0.005;

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
    <div className="space-y-5">
      {rascunho && (
        <p className="text-xs text-muted-foreground">
          A proposta será gravada junto com a solicitação.
        </p>
      )}

      {/* ---------------- OUTROS CUSTOS ---------------- */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Outros custos</span>
          {editavel && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Adicionar custo"
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
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>

        {proposta.outros_custos.map((custo, indice) => {
          const trocar = (dados: Partial<OutroCusto>) =>
            salvarCustos((p) => ({
              ...p,
              outros_custos: p.outros_custos.map((c, i) => (i === indice ? { ...c, ...dados } : c)),
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

      {/* ---------------- FECHAMENTO ---------------- */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Fechamento</span>
          <div className="flex items-center gap-1">
            {(salvando || carregando) && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            )}
            {editavel && !rascunho && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
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

        {/* O BDI nasce do padrão da empresa (o botão "BDI padrão" da página) e
            se ajusta aqui, só para esta proposta: os nove componentes ficam
            gravados por solicitação, e a memória de cálculo é auditável.

            O faturamento direto aparece em linha própria porque não recebe BDI:
            o cliente paga o fornecedor, e o dinheiro não passa aqui. O desconto
            sai do total inteiro, o FD junto (decisão do usuário, 28/out/2026). */}
        <dl className="space-y-1">
          <Total rotulo="Custo" valor={custoBase} />
          <div className="flex items-baseline justify-between gap-4">
            <dt className="flex items-center gap-1 text-sm text-muted-foreground">
              BDI ({percentualNaTela(bdi)}%)
              {ajustaCondicoes && !editandoBdi && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  title="Ajustar o BDI desta proposta"
                  aria-label="Ajustar o BDI desta proposta"
                  onClick={() => setEditandoBdi(componentesDe(proposta))}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
            </dt>
            <dd className="text-sm tabular-nums">{moeda(proposta.total_bdi)}</dd>
          </div>
        </dl>

        {editandoBdi && (
          <div ref={editorDoBdi} className="space-y-3 rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Só para esta proposta. O padrão da empresa se troca no botão "BDI padrão" da página.</p>
            <ComponentesDoBdiCampos value={editandoBdi} onChange={setEditandoBdi} />
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => void usarOPadrao()}>
                Usar o padrão
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setEditandoBdi(null)}>
                Cancelar
              </Button>
              <Button type="button" size="sm" disabled={somaImpostos(editandoBdi) >= 100} onClick={aplicarBdi}>
                Aplicar
              </Button>
            </div>
          </div>
        )}

        <dl className="space-y-1">
          {faturamentoDireto > 0 && (
            <Total rotulo="Faturamento direto" valor={faturamentoDireto} />
          )}
          {(ajustaCondicoes || proposta.desconto_tipo) && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                Desconto
                {ajustaCondicoes ? (
                  <>
                    <Select value={tipoDoDesconto ?? 'NENHUM'} onValueChange={trocarTipoDeDesconto}>
                      <SelectTrigger className="h-8 w-[92px]" aria-label="Como é o desconto">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NENHUM">Nenhum</SelectItem>
                        <SelectItem value="PERCENTUAL">%</SelectItem>
                        <SelectItem value="VALOR">R$</SelectItem>
                      </SelectContent>
                    </Select>
                    {tipoDoDesconto && (
                      <CampoDeNumero
                        key={versaoDoDesconto}
                        className="h-8 w-24 text-right"
                        value={proposta.desconto_tipo ? proposta.desconto_valor : null}
                        onChange={(valor) => gravarDesconto(tipoDoDesconto, valor)}
                        ler={lerDinheiroDigitado}
                        mostrar={tipoDoDesconto === 'VALOR' ? dinheiroNoCampo : numeroNoCampo}
                        aviso={tipoDoDesconto === 'VALOR' ? AVISO_DE_DINHEIRO : 'Percentual com vírgula e até 2 casas (ex.: 12,5)'}
                        avisoCurto
                        placeholder={tipoDoDesconto === 'VALOR' ? '0,00' : '0'}
                        aria-label={tipoDoDesconto === 'VALOR' ? 'Desconto em reais' : 'Desconto em percentual'}
                      />
                    )}
                  </>
                ) : (
                  proposta.desconto_tipo === 'PERCENTUAL' && <span>({percentualNaTela(proposta.desconto_valor ?? 0)}%)</span>
                )}
              </dt>
              <dd className="text-sm tabular-nums">
                {proposta.total_desconto > 0 ? `− ${moeda(proposta.total_desconto)}` : moeda(0)}
              </dd>
            </div>
          )}
          {descontoLimitado && (
            <p className="text-xs text-muted-foreground">
              O desconto de {moeda(proposta.desconto_valor ?? 0)} passa do total de agora: vale até o total.
            </p>
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
