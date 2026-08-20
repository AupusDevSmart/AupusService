// src/features/solicitacoes-servico/components/PropostaSection.tsx
import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, RefreshCw, Loader2, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { formatApiError } from '@/utils/api-error';
import {
  propostaApi,
  moeda,
  type ItemProposta,
  type OutroCusto,
  type Proposta,
} from '@/services/proposta.services';

interface PropostaSectionProps {
  solicitacaoId: string | null;
  somenteLeitura?: boolean;
  /** Cabeçalho da proposta no PDF. */
  numero?: string;
  titulo?: string;
  cliente?: string;
}

/**
 * A proposta comercial dentro do sheet da solicitação.
 *
 * Segue o vocabulário visual das outras seções deste sheet: moldura
 * `border rounded-lg` sem tint (os tokens de cor deste projeto não têm canal
 * alpha, então `bg-muted/20` dos vizinhos não pinta nada e imitar isso com
 * `bg-muted` deixaria esta seção mais marcada que as outras), cabeçalho em
 * `flex items-center justify-between p-3`, corpo em `border-t px-4 py-3` e
 * rótulos como `<label>` solto.
 *
 * Toda escrita devolve os totais recalculados pelo servidor — o componente não
 * repete a fórmula.
 */
export function PropostaSection({
  solicitacaoId,
  somenteLeitura = false,
  numero,
  titulo,
  cliente,
}: PropostaSectionProps) {
  const [proposta, setProposta] = useState<Proposta | null>(null);
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
   * Grava e adota o retorno do servidor como verdade.
   *
   * Atualizar o estado local por conta própria e só depois mandar salvar faria
   * a tela mostrar um total que o servidor ainda não confirmou — e é esse
   * número que vai para o PDF.
   */
  const gravar = async (acao: () => Promise<Proposta>, oQue: string) => {
    if (!solicitacaoId) return;
    try {
      setSalvando(true);
      setProposta(await acao());
    } catch (erro) {
      toast.error(`Não foi possível salvar ${oQue}`, { description: formatApiError(erro) });
      await carregar();
    } finally {
      setSalvando(false);
    }
  };

  if (!solicitacaoId) {
    return (
      <div className="border rounded-lg">
        <div className="flex items-center justify-between p-3">
          <span className="text-sm font-medium">Proposta comercial</span>
        </div>
        <div className="border-t px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Salve a solicitação para montar a proposta.
          </p>
        </div>
      </div>
    );
  }

  const itens = proposta?.itens ?? [];
  const outros = proposta?.outros_custos ?? [];

  const trocarItem = (indice: number, campo: 'quantidade' | 'preco_unitario', valor: number) => {
    const lista = itens.map((item, i) => (i === indice ? { ...item, [campo]: valor } : item));
    void gravar(() => propostaApi.salvarItens(solicitacaoId, lista), 'o item');
  };

  const removerItem = (indice: number) =>
    void gravar(
      () => propostaApi.salvarItens(solicitacaoId, itens.filter((_, i) => i !== indice)),
      'a remoção',
    );

  const adicionarItem = () =>
    void gravar(
      () =>
        propostaApi.salvarItens(solicitacaoId, [
          ...itens,
          { descricao: '', quantidade: 1, preco_unitario: 0 },
        ]),
      'o item',
    );

  const trocarCusto = (indice: number, dados: Partial<OutroCusto>) => {
    const lista = outros.map((c, i) => (i === indice ? { ...c, ...dados } : c));
    void gravar(() => propostaApi.salvarOutrosCustos(solicitacaoId, lista), 'o custo');
  };

  const gerarPdf = async () => {
    if (!proposta) return;
    try {
      setGerando(true);
      // Carregada só aqui: a biblioteca de PDF é pesada e o bundle já é
      // grande. Quem nunca gera proposta não paga por ela.
      const { gerarPropostaPdf } = await import('@/lib/pdf/proposta');
      await gerarPropostaPdf({ proposta, numero, titulo, cliente });
    } catch (erro) {
      toast.error('Não foi possível gerar o PDF', { description: formatApiError(erro) });
    } finally {
      setGerando(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* ---------------- ITENS ---------------- */}
      <div className="border rounded-lg">
        <div className="flex items-center justify-between p-3">
          <span className="text-sm font-medium">Itens da proposta</span>
          <div className="flex items-center gap-1">
            {salvando && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
            {!somenteLeitura && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    void gravar(() => propostaApi.recarregar(solicitacaoId), 'a recarga')
                  }
                  title="Refaz a lista a partir das instruções. Descarta os preços editados."
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={adicionarItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Item
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="border-t px-4 py-3 space-y-3">
          {carregando && <p className="text-sm text-muted-foreground">Carregando...</p>}

          {!carregando && itens.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum item. Vincule uma instrução acima ou adicione à mão.
            </p>
          )}

          {itens.map((item, indice) => (
            <LinhaItem
              key={item.id ?? `novo-${indice}`}
              item={item}
              somenteLeitura={somenteLeitura}
              onQuantidade={(v) => trocarItem(indice, 'quantidade', v)}
              onPreco={(v) => trocarItem(indice, 'preco_unitario', v)}
              onRemover={() => removerItem(indice)}
            />
          ))}
        </div>
      </div>

      {/* ---------------- OUTROS CUSTOS ---------------- */}
      <div className="border rounded-lg">
        <div className="flex items-center justify-between p-3">
          <span className="text-sm font-medium">Outros custos</span>
          {!somenteLeitura && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                void gravar(
                  () =>
                    propostaApi.salvarOutrosCustos(solicitacaoId, [
                      ...outros,
                      { descricao: '', valor: 0, faturamento_direto: false },
                    ]),
                  'o custo',
                )
              }
            >
              <Plus className="h-4 w-4 mr-1" />
              Custo
            </Button>
          )}
        </div>

        <div className="border-t px-4 py-3 space-y-2">
          {outros.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum custo adicional.</p>
          )}

          {outros.map((custo, indice) => (
            <div key={custo.id ?? `novo-${indice}`} className="flex items-center gap-2">
              <input
                className="input-minimal flex-1"
                value={custo.descricao}
                placeholder="Ex.: frete, hospedagem"
                disabled={somenteLeitura}
                onChange={(e) => trocarCusto(indice, { descricao: e.target.value })}
              />
              <input
                className="input-minimal w-28 text-right"
                type="number"
                step="0.01"
                min="0"
                value={custo.valor}
                disabled={somenteLeitura}
                onChange={(e) => trocarCusto(indice, { valor: Number(e.target.value) || 0 })}
              />
              {/* FD: rótulo curto na tela, nome por extenso no hover. Cabe na
                  linha e não força quebra num sheet estreito. */}
              <label
                className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground"
                title="Faturamento direto — o cliente paga o fornecedor. Fica fora da base do imposto."
              >
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5"
                  checked={custo.faturamento_direto}
                  disabled={somenteLeitura}
                  onChange={(e) => trocarCusto(indice, { faturamento_direto: e.target.checked })}
                />
                FD
              </label>
              {!somenteLeitura && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() =>
                    void gravar(
                      () =>
                        propostaApi.salvarOutrosCustos(
                          solicitacaoId,
                          outros.filter((_, i) => i !== indice),
                        ),
                      'a remoção',
                    )
                  }
                  title="Remover"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ---------------- FECHAMENTO ---------------- */}
      <div className="border rounded-lg">
        <div className="flex items-center justify-between p-3">
          <span className="text-sm font-medium">Fechamento</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={gerarPdf}
            disabled={gerando || !proposta}
          >
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
              <input
                className="input-minimal w-20 text-right"
                type="number"
                step="0.01"
                min="0"
                value={proposta?.lucro_percentual ?? 0}
                disabled={somenteLeitura}
                onChange={(e) =>
                  void gravar(
                    () =>
                      propostaApi.salvarCondicoes(solicitacaoId, {
                        lucro_percentual: Number(e.target.value) || 0,
                      }),
                    'o lucro',
                  )
                }
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={proposta?.com_nota_fiscal ?? false}
                disabled={somenteLeitura}
                onChange={(e) =>
                  void gravar(
                    () =>
                      propostaApi.salvarCondicoes(solicitacaoId, {
                        com_nota_fiscal: e.target.checked,
                      }),
                    'a nota fiscal',
                  )
                }
              />
              Com nota fiscal
              {proposta?.com_nota_fiscal && (
                <span className="text-xs text-muted-foreground">
                  ({proposta.aliquota_percentual}% por dentro)
                </span>
              )}
            </label>
          </div>

          <dl className="space-y-1 border-t pt-3">
            <Total rotulo="Custo" valor={proposta?.total_custo ?? 0} />
            {(proposta?.total_imposto ?? 0) > 0 && (
              <Total rotulo="Imposto" valor={proposta?.total_imposto ?? 0} />
            )}
            <Total rotulo="Lucro" valor={proposta?.total_lucro ?? 0} />
            <Total rotulo="Total da proposta" valor={proposta?.total_geral ?? 0} destaque />
          </dl>
        </div>
      </div>
    </div>
  );
}

/** Uma linha de item, com a variação de preço ao lado. */
function LinhaItem({
  item,
  somenteLeitura,
  onQuantidade,
  onPreco,
  onRemover,
}: {
  item: ItemProposta;
  somenteLeitura: boolean;
  onQuantidade: (valor: number) => void;
  onPreco: (valor: number) => void;
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
    <div className="flex flex-wrap items-center gap-2">
      <span className="min-w-0 flex-1 truncate text-sm" title={item.descricao}>
        {item.descricao || <span className="text-muted-foreground">Sem descrição</span>}
      </span>

      <input
        className="input-minimal w-16 text-right"
        type="number"
        step="0.001"
        min="0"
        value={item.quantidade}
        disabled={somenteLeitura}
        onChange={(e) => onQuantidade(Number(e.target.value) || 0)}
        title="Quantidade"
      />
      <span className="w-8 shrink-0 text-xs text-muted-foreground">{item.unidade || ''}</span>

      <input
        className="input-minimal w-24 text-right"
        type="number"
        step="0.01"
        min="0"
        value={atual}
        disabled={somenteLeitura}
        onChange={(e) => onPreco(Number(e.target.value) || 0)}
        title="Preço unitário"
      />

      {/* Verde para cima, vermelho para baixo — o par já usado no resto do
          produto. Discreto de propósito: é uma nota, não um alerta. */}
      <span className="w-16 shrink-0 text-right text-[11px]">
        {variacao !== null && (
          <span
            className={
              variacao > 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-destructive'
            }
            title={`Catálogo: ${moeda(original ?? 0)}`}
          >
            {variacao > 0 ? '+' : ''}
            {variacao.toFixed(1).replace('.', ',')}%
          </span>
        )}
      </span>

      <span className="w-24 shrink-0 text-right text-sm tabular-nums">
        {moeda((item.quantidade || 0) * atual)}
      </span>

      {!somenteLeitura && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={onRemover}
          title="Remover"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
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
