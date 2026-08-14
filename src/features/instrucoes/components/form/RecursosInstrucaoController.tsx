// src/features/instrucoes/components/form/RecursosInstrucaoController.tsx
import React from 'react';
import { FormFieldProps } from '@/types/base';
import { Input } from '@/components/ui/input';
import { Combobox } from '@aupus/shared-pages';
import { AlertCircle, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { formatApiError } from '@/utils/api-error';
import { ItensOrdenaveisTable, type ColunaItemOrdenavel } from '@/components/common/ItensOrdenaveisTable';
import { diariasDaDuracao } from '@/utils/horas';
import {
  recursosApi,
  rotuloCategoria,
  CATEGORIAS_RECURSO,
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
  const [recursos, setRecursos] = React.useState<Recurso[]>(
    Array.isArray(value) ? value : []
  );
  const [catalogo, setCatalogo] = React.useState<RecursoApiResponse[]>([]);
  const [carregando, setCarregando] = React.useState(true);

  React.useEffect(() => {
    if (Array.isArray(value)) {
      setRecursos(value);
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
  const horasDeDiaria = React.useMemo(() => {
    const minutos = (subInstrucoes || []).reduce(
      (soma, item) => soma + (Number(item?.tempo_estimado) || 0),
      0,
    );
    return diariasDaDuracao(minutos / 60).horas;
  }, [subInstrucoes]);

  /**
   * Escolher no catálogo traz junto nome e unidade, e sugere a quantidade.
   *
   * A sugestão só vale para o que se mede em hora: material se conta por peça,
   * e encher a quantidade dele com as horas da instrução seria besteira.
   */
  const escolherRecurso = (index: number, recursoId: string) => {
    const doCatalogo = porId.get(recursoId?.trim());
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
              emptyText="Nenhum recurso nesta categoria. Cadastre em Administração › Recursos."
              disabled={disabled || carregando || opcoes.length === 0}
              className="h-8"
            />
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
      resumo={[
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
