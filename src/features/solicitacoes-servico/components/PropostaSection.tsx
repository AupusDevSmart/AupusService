// src/features/solicitacoes-servico/components/PropostaSection.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatApiError } from '@/utils/api-error';
import {
  propostaApi,
  propostaVazia,
  calcularRascunho,
  montarDeInstrucoes,
  linhaDaInstrucao,
  moeda,
  percentualNaTela,
  type CondicoesDaProposta,
  type ItemProposta,
  type LinhaDeLogistica,
  type OutroCusto,
  type Proposta,
  type TabelaDeLogistica,
} from '@/services/proposta.services';
import { instrucoesApi } from '@/services/instrucoes.services';
import { comLogisticaAutomatica, padroesDaLogistica, type PadroesDaLogistica } from '@/services/planejamento-da-proposta';
import { useUserStore } from '@/store/useUserStore';
import type { ValoresDaProposta } from './proposta-contexto';
import { PlanejamentoDaProposta } from './PlanejamentoDaProposta';
import { TabelaDaLogistica } from './TabelaDaLogistica';
import { CustosAdicionais } from './CustosAdicionais';
import { FechamentoDaProposta } from './FechamentoDaProposta';
import { PainelComoSeCalcula, type Explicacao } from '@/components/common/ComoSeCalcula';
import { TituloDaSecao } from './TituloDaSecao';
import { explicacoesDaProposta } from '../utils/como-se-calcula';

/** A linha sem nome fica só na tela até ganhar um: a API a recusaria */
const semNome = (linha: { descricao: string }) => !linha.descricao.trim();
const comNome = <T extends { descricao: string }>(linhas: T[]) => linhas.filter((l) => !semNome(l));
const mesmas = (a: unknown[], b: unknown[]) => JSON.stringify(a) === JSON.stringify(b);

/**
 * A resposta do servidor com as linhas sem nome que só estavam na tela: sem isso,
 * qualquer escrita (o planejamento, outra tabela) as apagava, com o que já tinha
 * sido digitado nelas.
 */
const comAsPendentes = (doServidor: Proposta, daTela: Proposta): Proposta => ({
  ...doServidor,
  outros_custos: [...doServidor.outros_custos, ...daTela.outros_custos.filter(semNome)],
  logistica: [...doServidor.logistica, ...daTela.logistica.filter(semNome)],
});
const TABELAS: TabelaDeLogistica[] = ['FRETE', 'DESLOCAMENTO', 'DIARIA'];
const TITULO_DA_TABELA: Record<TabelaDeLogistica, string> = { FRETE: 'Frete', DESLOCAMENTO: 'Deslocamento', DIARIA: 'Diárias' };

/** A conta da tabela e o que vale para as três (o catálogo, a linha desmarcada, o PDF), no ícone dela */
const explicacaoDaTabela = (tabelas: Explicacao[], tabela: TabelaDeLogistica): Explicacao => ({
  rotulo: TITULO_DA_TABELA[tabela],
  linhas: tabelas.filter((e) => e.rotulo === TITULO_DA_TABELA[tabela] || e.rotulo === 'As três tabelas').flatMap((e) => e.linhas),
});

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
 * A proposta comercial dentro do sheet da solicitação (29/out/2026: imposto e
 * margem no lugar do BDI). O caminho é o da conversa com quem orça: o km, as
 * instruções, as tabelinhas de frete, deslocamento e diárias, os custos
 * adicionais; depois a administração, o desconto, o imposto e a margem.
 *
 * Guarda um VALOR FECHADO (o custo) por instrução vinculada — nada é copiado
 * item a item. O valor nasce da soma dos recursos do catálogo, como sugestão, e
 * é editado no card da própria instrução, logo depois do nome.
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
  /** Os padrões da logística: no rascunho as linhas automáticas se calculam aqui (com id, no servidor) */
  const [padroesLogistica, setPadroesLogistica] = useState<PadroesDaLogistica | null>(null);
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

  // O rascunho nasce com os percentuais padrão da empresa, os mesmos que o servidor
  // dá à solicitação ao criá-la. Só quem monta proposta os lê (é a margem da empresa)
  const montaProposta = useUserStore((st) => st.hasPermission('solicitacoes.manage'));
  useEffect(() => {
    if (!rascunho || somenteLeitura || !montaProposta) return;
    let cancelado = false;
    propostaApi
      .obterPadroes()
      .then((padroes) => {
        if (cancelado) return;
        const logistica = padroesDaLogistica(padroes);
        setPadroesLogistica(logistica);
        const { imposto_percentual, margem_percentual, adm_servicos_percentual, adm_fd_percentual } = padroes;
        setProposta((atual) => {
          const calculado = calcularRascunho(comLogisticaAutomatica({ ...atual, imposto_percentual, margem_percentual, adm_servicos_percentual, adm_fd_percentual }, logistica));
          onRascunhoChange?.(calculado);
          return calculado;
        });
      })
      .catch((erro) => {
        if (!cancelado) {
          toast.error('Não foi possível ler os padrões da proposta', {
            description: `${formatApiError(erro)}. Ajuste o imposto e a margem no fechamento; o km e as refeições automáticos só aparecem depois de salvar.`,
          });
        }
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
    /** `null`: a mudança fica só na tela (a linha sem nome, que a API recusaria) */
    persistir: ((id: string, novo: Proposta) => Promise<Proposta>) | null,
    oQue: string,
  ) => {
    if (rascunho) {
      // Sobre a proposta de agora, não a do render que chamou: a montagem das
      // linhas e o BDI padrão chegam de awaits diferentes, e um apagava o outro
      setProposta((atual) => {
        // As linhas automáticas seguem o planejamento, como o servidor fará ao gravar
        const calculado = calcularRascunho(comLogisticaAutomatica(mudanca(atual), padroesLogistica));
        onRascunhoChange?.(calculado);
        return calculado;
      });
      return;
    }

    const novo = mudanca(proposta);

    setProposta(novo); // resposta imediata ao clique
    if (!persistir) return;
    try {
      setSalvando(true);
      setProposta(comAsPendentes(await persistir(solicitacaoId!, novo), novo));
    } catch (erro) {
      toast.error(`Não foi possível salvar ${oQue}`, { description: formatApiError(erro) });
      await carregar();
    } finally {
      setSalvando(false);
    }
  };

  const salvarItens = (m: (p: Proposta) => Proposta) =>
    void aplicar(m, (id, novo) => propostaApi.salvarItens(id, novo.itens), 'o valor');

  // As linhas com nome vão para a API (a sem nome espera na tela, sem travar as outras);
  // só a linha sem nome que entrou ou mudou não escreve nada
  const salvarCustos = (custos: OutroCusto[]) =>
    void aplicar(
      (p) => ({ ...p, outros_custos: custos }),
      mesmas(comNome(custos), comNome(proposta.outros_custos)) ? null : (id) => propostaApi.salvarOutrosCustos(id, comNome(custos)),
      'o custo',
    );

  /** Uma tabela de logística inteira */
  const salvarLogistica = (tabela: TabelaDeLogistica, linhas: LinhaDeLogistica[]) =>
    void aplicar(
      (p) => ({ ...p, logistica: [...p.logistica.filter((l) => l.tabela !== tabela), ...linhas] }),
      mesmas(comNome(linhas), comNome(proposta.logistica.filter((l) => l.tabela === tabela)))
        ? null
        : (id) => propostaApi.salvarLogistica(id, tabela, comNome(linhas)),
      `a tabela de ${tabela === 'DIARIA' ? 'diárias' : tabela.toLowerCase()}`,
    );

  const salvarCondicoes = (dados: CondicoesDaProposta, oQue: string) =>
    void aplicar((p) => ({ ...p, ...dados }), (id) => propostaApi.salvarCondicoes(id, dados), oQue);

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
    if (somenteLeitura || carregando || !montaProposta) return;

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
      if (id && !item.recurso_id && item.preco_unitario !== null) mapa[id] = item.preco_unitario;
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
    // As horas dos passos dão os dias do rascunho (30/out/2026): só elas mudando, a linha também se refaz
    const mudouAsHoras = (atual.horas_dos_passos ?? 0) !== (linha.horas_dos_passos ?? 0);
    if (!mudouOValor && !mudouONome && !mudouAsHoras) return;
    salvarItens((p) => ({
      ...p,
      itens: p.itens.map((it) =>
        daInstrucao(it)
          ? mudouOValor
            ? { ...it, ...linha, sem_preco_no_cadastro: linha.sem_preco_no_cadastro }
            : { ...it, descricao: linha.descricao, horas_dos_passos: linha.horas_dos_passos }
          : it,
      ),
    }));
    if (mudouOValor && centavos(atual.preco_unitario) !== centavos(linha.preco_unitario)) {
      toast.info(`Valor de ${linha.descricao} na proposta: ${moeda(atual.preco_unitario ?? 0)} -> ${moeda(linha.preco_unitario ?? 0)}`, {
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

  // Os percentuais, o desconto e as condições são de quem monta proposta: o cliente que cadastra não grava
  const ajusta = editavel && montaProposta;
  const deAntes = proposta.conta_da_proposta === 'BDI';
  // As legendas, com os percentuais desta proposta: a conta inteira para quem a monta, o sentido dos totais para o cliente
  const explicacoes = useMemo(() => explicacoesDaProposta(proposta, montaProposta), [proposta, montaProposta]);

  /**
   * Sem instrução vinculada não há proposta.
   *
   * A seção nasce do que foi vinculado acima. A própria proposta também conta:
   * uma solicitação antiga pode ter valores sem o vínculo estar carregado no
   * formulário ainda, e escondê-los apagaria da tela um orçamento que existe.
   */
  const temProposta = proposta.itens.length > 0 || proposta.outros_custos.length > 0 || proposta.logistica.length > 0;

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

  // A proposta de antes (BDI) ficou como documento: só leitura, com os números da época
  if (deAntes) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Proposta na conta de antes (BDI), como foi enviada ao cliente. Editada, ela passa para imposto e margem, com os percentuais padrão.
        </p>
        {ajusta && !rascunho && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => void aplicar((p) => p, (id) => propostaApi.salvarCondicoes(id, {}), 'a conversão da proposta')}
          >
            Passar para imposto e margem
          </Button>
        )}
        <dl className="space-y-1">
          <Total rotulo="Custo" valor={(proposta.total_custo ?? 0) - (proposta.total_fd ?? 0)} />
          <Total rotulo={`BDI (${percentualNaTela(proposta.bdi_percentual ?? 0)}%)`} valor={proposta.total_bdi ?? 0} />
          {proposta.total_desconto > 0 && <Total rotulo="Desconto" valor={-proposta.total_desconto} />}
          <Total rotulo="Total da proposta" valor={proposta.total_geral ?? 0} destaque />
        </dl>
      </div>
    );
  }

  const linhasDa = (tabela: TabelaDeLogistica) => proposta.logistica.filter((l) => l.tabela === tabela);
  const custoDaLogistica = proposta.logistica.filter((l) => l.ativo).reduce((s, l) => s + (l.total ?? 0), 0);

  // Uma linha só separa a proposta do formulário de cima; dentro dela, as partes se separam
  // pelo espaço e pelo título discreto, e só o fechamento tem fundo (30/out/2026: menos borda)
  return (
    <section className="space-y-6 border-t border-border pt-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold">Proposta comercial</h3>
          <p className="text-xs text-muted-foreground">
            {rascunho ? 'Gravada junto com a solicitação.' : 'O valor de cada instrução se edita no card dela, acima.'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {(salvando || carregando) && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          <PainelComoSeCalcula
            descricao="Como cada número da proposta é calculado, com os percentuais desta proposta, e o caminho dela até a programação."
            secoes={[
              { titulo: 'O fechamento', itens: explicacoes.conta },
              ...(montaProposta
                ? [
                    { titulo: 'O planejamento e as tabelas', itens: [explicacoes.planejamento, ...explicacoes.tabelas, explicacoes.adicionais] },
                    { titulo: 'Da proposta à programação', itens: explicacoes.fluxo },
                  ]
                : []),
            ]}
          />
          {editavel && !rascunho && montaProposta && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => void aplicar((p) => p, (id) => propostaApi.recarregar(id), 'a recarga')}
              title="Refaz os valores das instruções pelo catálogo. Descarta o que foi ajustado."
              aria-label="Refazer os valores das instruções pelo catálogo"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {montaProposta && (
        <>
          <PlanejamentoDaProposta
            proposta={proposta}
            editavel={ajusta}
            onChange={(dados) => salvarCondicoes(dados, 'o planejamento')}
            explicacao={explicacoes.planejamento}
          />
          <div className="space-y-3">
            <TituloDaSecao titulo="Logística" explicacao={explicacoes.tabelas.find((e) => e.rotulo === 'Linhas automáticas')} valor={custoDaLogistica} />
            {TABELAS.map((tabela) => (
              <TabelaDaLogistica
                key={tabela}
                tabela={tabela}
                linhas={linhasDa(tabela)}
                editavel={editavel}
                planejamento={proposta}
                onChange={(linhas) => salvarLogistica(tabela, linhas)}
                explicacao={explicacaoDaTabela(explicacoes.tabelas, tabela)}
              />
            ))}
          </div>
          <CustosAdicionais custos={proposta.outros_custos} editavel={editavel} onChange={salvarCustos} explicacao={explicacoes.adicionais} />
        </>
      )}

      <FechamentoDaProposta proposta={proposta} ajusta={ajusta} onChange={salvarCondicoes} explicacoes={explicacoes.conta} />

      <CondicoesComerciais proposta={proposta} ajusta={ajusta} onChange={salvarCondicoes} />
    </section>
  );
}

/** A validade e as condições comerciais (pagamento, exclusões, garantias): vão ao PDF */
function CondicoesComerciais({ proposta, ajusta, onChange }: { proposta: Proposta; ajusta: boolean; onChange: (dados: CondicoesDaProposta, oQue: string) => void }) {
  const [texto, setTexto] = useState(proposta.condicoes_comerciais ?? '');
  useEffect(() => setTexto(proposta.condicoes_comerciais ?? ''), [proposta.condicoes_comerciais]);
  if (!ajusta && !proposta.validade_proposta && !proposta.condicoes_comerciais) return null;

  return (
    <div className="space-y-2">
      <TituloDaSecao titulo="Validade e condições" />
      <label className="flex flex-col gap-1 text-xs text-muted-foreground sm:w-48">
        Válida até
        <input
          type="date"
          className="input-minimal"
          value={proposta.validade_proposta ?? ''}
          disabled={!ajusta}
          onChange={(e) => onChange({ validade_proposta: e.target.value || null }, 'a validade')}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        Condições comerciais
        <Textarea
          value={texto}
          disabled={!ajusta}
          rows={3}
          maxLength={4000}
          className="resize-none text-sm"
          placeholder="Pagamento, exclusões, garantias"
          onChange={(e) => setTexto(e.target.value)}
          onBlur={() => texto !== (proposta.condicoes_comerciais ?? '') && onChange({ condicoes_comerciais: texto.trim() || null }, 'as condições comerciais')}
        />
      </label>
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
