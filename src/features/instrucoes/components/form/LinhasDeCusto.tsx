// src/features/instrucoes/components/form/LinhasDeCusto.tsx
import React from 'react';
import { Wallet } from 'lucide-react';
import { Combobox } from '@/core';
import { CampoDeNumero } from '@/components/common/CampoDeNumero';
import { ItensOrdenaveisTable, type ColunaItemOrdenavel } from '@/components/common/ItensOrdenaveisTable';
import { ROTULO_DA_BASE, rotuloCategoria, sufixoDaBase, type BaseDeCusto, type RecursoApiResponse } from '@/services/recursos.services';
import { ROTULO_DO_TIPO_DE_MAQUINARIO, type MaquinarioApiResponse } from '@/services/maquinarios.services';
import type { MaquinarioDaLinha, RecursoDaLinha } from '@/services/instrucoes.services';
import {
  pedeDistancia,
  pedeDuracao,
  pedePerda,
  somarSubtotais,
  subtotalDaLinha,
  unidadesDaLinha,
} from '@/features/instrucoes/utils/custo-da-linha';
import { NovoItemDoCatalogo, type GrupoDaLinha } from './NovoItemDoCatalogo';
import { useVeCustos } from '@/hooks/useVeCustos';

export type ItemDoCatalogo = RecursoApiResponse | MaquinarioApiResponse;
/** O item na linha: do cadastro carregado, ou o resumo que a linha trouxe */
type ItemDaLinha = ItemDoCatalogo | RecursoDaLinha | MaquinarioDaLinha;

/** A linha como o formulário a guarda: a da API (com o item embutido) ou uma nova */
export interface LinhaDeCustoDoFormulario {
  id?: string;
  recurso_id?: string | null;
  maquinario_id?: string | null;
  quantidade?: number | null;
  duracao_horas?: number | null;
  fator_perda?: number | null;
  fornecido_pelo_cliente?: boolean;
  distancia_km?: number | null;
  preco_proprio?: number | null;
  /** O item como veio na linha: vale enquanto o catálogo carrega e para o item que saiu dele */
  recurso?: RecursoDaLinha;
  maquinario?: MaquinarioDaLinha;
  /** Os campos com texto que não dá para ler (só na tela): o formulário não salva com eles */
  ilegiveis?: Record<string, boolean>;
}

/** Algum número digitado e ilegível: salvar mandaria o valor anterior calado */
export const temIlegivel = (linhas: unknown) =>
  Array.isArray(linhas) && linhas.some((l: { ilegiveis?: Record<string, boolean> }) => Object.values(l?.ilegiveis ?? {}).some(Boolean));

const moeda = (valor: number) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const decimal = (valor: number) => valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const ehMaquinario = (item: ItemDaLinha): item is MaquinarioApiResponse | MaquinarioDaLinha => !('categoria' in item);

function rotuloDoItem(item: ItemDaLinha, grupo: GrupoDaLinha) {
  if (ehMaquinario(item)) return `${item.nome} · ${ROTULO_DO_TIPO_DE_MAQUINARIO[item.tipo] ?? item.tipo}`;
  if (grupo === 'materiais') return item.unidade ? `${item.nome} (${item.unidade})` : item.nome;
  return `${item.nome} · ${rotuloCategoria(item.categoria)}`;
}

interface Props {
  grupo: GrupoDaLinha;
  titulo: string;
  linhas: LinhaDeCustoDoFormulario[];
  onChange: (linhas: LinhaDeCustoDoFormulario[]) => void;
  /** Os itens ativos do cadastro deste grupo */
  catalogo: ItemDoCatalogo[];
  carregando: boolean;
  /** A soma dos passos: a duração sugerida ao escolher um item cobrado por tempo */
  horasDosPassos: number;
  onItemCriado: (item: ItemDoCatalogo) => void;
  disabled?: boolean;
}

/**
 * As linhas de um grupo da instrução (SN-85), como no AupusProject: recursos,
 * maquinário ou materiais. A cobrança do item decide os campos da linha —
 * duração na hora e na diária, distância no km, perda e "fornecido pelo
 * cliente" (FD) no material — e o total segue a conta do servidor
 * (`custo-da-linha.ts`). A ordem não se edita: o banco não guarda ordem, a
 * lista volta pelo nome do item.
 */
export function LinhasDeCusto({ grupo, titulo, linhas, onChange, catalogo, carregando, horasDosPassos, onItemCriado, disabled }: Props) {
  // O valor e o total só para quem vê custos: o cliente e o técnico leem a instrução sem preço (28/out/2026)
  const veCusto = useVeCustos();
  const comPreco = <T,>(...colunas: T[]) => (veCusto ? colunas : []);
  const chave = grupo === 'maquinario' ? 'maquinario_id' : 'recurso_id';

  const porId = React.useMemo(() => new Map(catalogo.map((i) => [i.id.trim(), i])), [catalogo]);

  const itemDaLinha = (linha: LinhaDeCustoDoFormulario): ItemDaLinha | undefined => {
    const id = linha[chave]?.trim();
    return (id && porId.get(id)) || (grupo === 'maquinario' ? linha.maquinario : linha.recurso);
  };

  // O item que a linha já tem entra nas opções mesmo fora do catálogo ativo: sem
  // opção que case com o valor, o combobox aparece vazio com o item salvo
  const opcoes = React.useMemo(() => {
    const mapa = new Map(catalogo.map((i) => [i.id.trim(), rotuloDoItem(i, grupo)]));
    for (const linha of linhas) {
      const item = grupo === 'maquinario' ? linha.maquinario : linha.recurso;
      if (item && !mapa.has(item.id.trim())) mapa.set(item.id.trim(), `${rotuloDoItem(item, grupo)} · fora do cadastro ativo`);
    }
    return [...mapa].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
  }, [catalogo, linhas, grupo]);

  const mudar = (index: number, mudanca: Partial<LinhaDeCustoDoFormulario>) =>
    onChange(linhas.map((linha, i) => (i === index ? { ...linha, ...mudanca } : linha)));

  /**
   * Os props de um campo numérico da linha. O ilegível marca a linha e trava o
   * salvar (o CampoDeNumero não grava o texto que não lê: sem a marca, salvar
   * mandaria o valor anterior calado). `paraLinha` converte (a perda em %).
   */
  const numerico = (index: number, campo: keyof LinhaDeCustoDoFormulario, paraLinha: (v: number | null) => number | null = (v) => v) => ({
    onChange: (v: number | null) => mudar(index, { [campo]: paraLinha(v), ilegiveis: { ...linhas[index].ilegiveis, [campo]: false } }),
    onIlegivel: (sim: boolean) => {
      if (Boolean(linhas[index].ilegiveis?.[campo]) !== sim) mudar(index, { ilegiveis: { ...linhas[index].ilegiveis, [campo]: sim } });
    },
  });

  /** Escolher o item limpa o que a cobrança dele não usa, como a tela do AupusProject */
  const escolher = (index: number, id: string, item?: ItemDoCatalogo) => {
    const escolhido = item ?? porId.get(id.trim());
    const linha = linhas[index];
    if (!escolhido) {
      mudar(index, { [chave]: null, recurso: undefined, maquinario: undefined });
      return;
    }
    const base = escolhido.base_calculo;
    const duracao = pedeDuracao(base) ? (linha.duracao_horas || (horasDosPassos > 0 ? horasDosPassos : null)) : null;
    mudar(index, {
      [chave]: escolhido.id.trim(),
      ...(ehMaquinario(escolhido) ? { maquinario: escolhido } : { recurso: escolhido }),
      duracao_horas: duracao,
      distancia_km: pedeDistancia(base) ? linha.distancia_km : null,
      fator_perda: pedePerda(base) ? linha.fator_perda : null,
      fornecido_pelo_cliente: pedePerda(base) ? linha.fornecido_pelo_cliente : false,
    });
  };

  const adicionar = () => onChange([...linhas, { [chave]: null, quantidade: 1 }]);
  const remover = (index: number) => onChange(linhas.filter((_, i) => i !== index));

  const subtotal = (linha: LinhaDeCustoDoFormulario) => {
    const item = itemDaLinha(linha);
    return item ? subtotalDaLinha(item, linha) : null;
  };

  const colunaDoItem: ColunaItemOrdenavel<LinhaDeCustoDoFormulario> = {
    key: 'item',
    header: grupo === 'maquinario' ? 'Maquinário' : grupo === 'materiais' ? 'Material' : 'Recurso',
    render: (linha, index) => {
      const item = itemDaLinha(linha);
      const diarias = item?.base_calculo === 'diaria' ? unidadesDaLinha(item, linha) : 0;
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Combobox
              options={opcoes}
              value={linha[chave]?.trim() || undefined}
              onValueChange={(valor) => escolher(index, valor)}
              placeholder={carregando ? 'Carregando...' : 'Selecione...'}
              searchPlaceholder="Buscar..."
              emptyText="Nada com esse nome. Use o + ao lado para cadastrar."
              disabled={disabled || carregando}
              className="h-8"
            />
            {!disabled && (
              <NovoItemDoCatalogo
                grupo={grupo}
                onCriado={(criado) => {
                  onItemCriado(criado);
                  escolher(index, criado.id, criado);
                }}
              />
            )}
          </div>
          {item && (
            <p className="text-xs text-muted-foreground">
              {ROTULO_DA_BASE[item.base_calculo as BaseDeCusto] ?? item.base_calculo}
              {diarias > 0 && ` · ${diarias} ${diarias === 1 ? 'diária' : 'diárias'} de ${Math.max(item.horas_por_diaria ?? 8, 1)} h`}
            </p>
          )}
        </div>
      );
    },
  };

  const colunaDaQuantidade: ColunaItemOrdenavel<LinhaDeCustoDoFormulario> = {
    key: 'quantidade',
    header: 'Qnt',
    width: 'w-16',
    align: 'center',
    render: (linha, index) => (
      <CampoDeNumero
        aria-label="Quantidade (vazio = 1)"
        placeholder="1"
        value={linha.quantidade ?? null}
        {...numerico(index, 'quantidade')}
        avisoCurto
        disabled={disabled}
        className="h-8 w-14 text-center"
      />
    ),
  };

  const colunaDoUso: ColunaItemOrdenavel<LinhaDeCustoDoFormulario> = {
    key: 'uso',
    header: 'Uso',
    width: 'w-24',
    align: 'center',
    render: (linha, index) => {
      const base = itemDaLinha(linha)?.base_calculo;
      if (pedeDuracao(base))
        return (
          <CampoDeNumero
            aria-label="Duração em horas de cada um"
            placeholder="horas"
            value={linha.duracao_horas ?? null}
            {...numerico(index, 'duracao_horas')}
            avisoCurto
            disabled={disabled}
            className="h-8 w-20 text-center"
          />
        );
      if (pedeDistancia(base))
        return (
          <CampoDeNumero
            aria-label="Distância em km"
            placeholder="km"
            value={linha.distancia_km ?? null}
            {...numerico(index, 'distancia_km')}
            avisoCurto
            disabled={disabled}
            className="h-8 w-20 text-center"
          />
        );
      return <span className="text-xs text-muted-foreground">—</span>;
    },
  };

  const colunaDaPerda: ColunaItemOrdenavel<LinhaDeCustoDoFormulario> = {
    key: 'perda',
    header: 'Perda %',
    width: 'w-16',
    align: 'center',
    // Na tela em %, na API em fração (0,10)
    render: (linha, index) => (
      <CampoDeNumero
        aria-label="Perda em %"
        placeholder="0"
        value={linha.fator_perda == null ? null : Math.round(linha.fator_perda * 10_000) / 100}
        {...numerico(index, 'fator_perda', (v) => (v === null ? null : Math.round(v * 100) / 10_000))}
        avisoCurto
        disabled={disabled}
        className="h-8 w-14 text-center"
      />
    ),
  };

  const colunaDoFd: ColunaItemOrdenavel<LinhaDeCustoDoFormulario> = {
    key: 'fd',
    header: 'FD',
    width: 'w-12',
    align: 'center',
    render: (linha, index) => (
      <input
        type="checkbox"
        checked={Boolean(linha.fornecido_pelo_cliente)}
        onChange={(e) => mudar(index, { fornecido_pelo_cliente: e.target.checked })}
        disabled={disabled}
        className="accent-foreground"
        aria-label="Faturamento direto: o cliente compra (fora do custo)"
        title="FD: o cliente compra direto do fornecedor; fica no escopo e fora do custo"
      />
    ),
  };

  const colunaDoValor: ColunaItemOrdenavel<LinhaDeCustoDoFormulario> = {
    key: 'valor',
    header: 'Valor',
    width: 'w-28',
    align: 'center',
    // Vazio segue o cadastro (o preço dele aparece como dica); digitado, vale só nesta instrução
    render: (linha, index) => {
      const item = itemDaLinha(linha);
      const doCadastro = item?.preco_base == null ? null : Number(item.preco_base);
      return (
        <CampoDeNumero
          aria-label={`Valor${sufixoDaBase(item && !ehMaquinario(item) ? item : null)} só nesta instrução (vazio = o do cadastro)`}
          placeholder={doCadastro === null ? 'sem preço' : decimal(doCadastro)}
          value={linha.preco_proprio ?? null}
          {...numerico(index, 'preco_proprio')}
          avisoCurto
          disabled={disabled}
          className="h-8 w-24 text-right"
        />
      );
    },
  };

  const colunaDoTotal: ColunaItemOrdenavel<LinhaDeCustoDoFormulario> = {
    key: 'total',
    header: 'Total',
    width: 'w-24',
    align: 'center',
    render: (linha) => {
      if (!itemDaLinha(linha)) return <span className="text-sm text-muted-foreground">—</span>;
      const valor = subtotal(linha);
      if (linha.fornecido_pelo_cliente) return <span className="text-xs text-muted-foreground">do cliente</span>;
      return valor === null ? (
        <span className="text-xs text-destructive">sem preço</span>
      ) : (
        <span className="text-sm text-foreground">{moeda(valor)}</span>
      );
    },
  };

  const colunas =
    grupo === 'materiais'
      ? [colunaDoItem, colunaDaQuantidade, colunaDaPerda, colunaDoFd, ...comPreco(colunaDoValor, colunaDoTotal)]
      : [colunaDoItem, colunaDaQuantidade, colunaDoUso, ...comPreco(colunaDoValor, colunaDoTotal)];

  const totalDoGrupo = somarSubtotais(linhas.filter((l) => itemDaLinha(l)).map(subtotal));

  return (
    <ItensOrdenaveisTable
      itens={linhas}
      colunas={colunas}
      onRemover={remover}
      onAdicionar={adicionar}
      textoAdicionar={`Adicionar ${grupo === 'maquinario' ? 'maquinário' : grupo === 'materiais' ? 'material' : 'recurso'}`}
      titulo={titulo}
      resumo={
        linhas.length && veCusto
          ? [
              {
                icone: <Wallet className="h-3.5 w-3.5" />,
                label: 'Subtotal',
                valor: totalDoGrupo === null ? 'falta preço' : moeda(totalDoGrupo),
              },
            ]
          : undefined
      }
      disabled={disabled}
    />
  );
}
