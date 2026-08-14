// src/features/instrucoes/components/form/RecursosInstrucaoController.tsx
import React from 'react';
import { FormFieldProps } from '@/types/base';
import { Input } from '@/components/ui/input';
import { Combobox } from '@aupus/shared-pages';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatApiError } from '@/utils/api-error';
import { ItensOrdenaveisTable, type ColunaItemOrdenavel } from '@/components/common/ItensOrdenaveisTable';
import {
  recursosApi,
  rotuloCategoria,
  type RecursoApiResponse,
} from '@/services/recursos.services';

interface Recurso {
  id?: string;
  /** Aponta para o catálogo. Vazio nas linhas antigas, digitadas antes dele existir. */
  recurso_id?: string | null;
  tipo: 'PECA' | 'MATERIAL' | 'FERRAMENTA' | 'TECNICO' | 'VIATURA';
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
export function RecursosInstrucaoController({ value, onChange, disabled }: FormFieldProps) {
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

  const opcoes = React.useMemo(
    () =>
      catalogo.map((r) => ({
        value: r.id.trim(),
        label: `${rotuloCategoria(r.categoria)} · ${r.nome}`,
      })),
    [catalogo],
  );

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

  /** Escolher no catálogo traz junto categoria, nome e unidade. */
  const escolherRecurso = (index: number, recursoId: string) => {
    const doCatalogo = porId.get(recursoId?.trim());
    if (!doCatalogo) return;

    aplicar(
      recursos.map((item, i) =>
        i === index
          ? {
              ...item,
              recurso_id: doCatalogo.id.trim(),
              tipo: doCatalogo.categoria,
              descricao: doCatalogo.nome,
              unidade: doCatalogo.unidade || '',
            }
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
  const semPreco = recursos.filter((item) => subtotal(item) === null).length;

  const colunas: Array<ColunaItemOrdenavel<Recurso>> = [
    {
      key: 'recurso',
      header: 'Recurso',
      render: (item, index) => {
        // Linha antiga, de antes do catálogo: mostra o que foi digitado e deixa
        // trocar por um item do catálogo.
        const legado = !item.recurso_id && item.descricao;

        return (
          <div className="space-y-1">
            <Combobox
              options={opcoes}
              value={item.recurso_id || undefined}
              onValueChange={(valor) => escolherRecurso(index, valor)}
              placeholder={carregando ? 'Carregando...' : 'Selecione o recurso...'}
              searchPlaceholder="Buscar recurso..."
              emptyText="Nenhum recurso cadastrado. Cadastre em Administração › Recursos."
              disabled={disabled || carregando}
              className="h-8"
            />
            {legado && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <AlertCircle className="h-3 w-3 shrink-0" />
                Cadastrado antes do catálogo: {rotuloCategoria(item.tipo)} · {item.descricao}
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: 'quantidade',
      header: 'Qtd',
      width: 'w-20',
      align: 'center',
      render: (item, index) => (
        <Input
          placeholder="1"
          type="text"
          value={item.quantidade ?? ''}
          onChange={(e) => atualizar(index, 'quantidade', e.target.value)}
          disabled={disabled}
          className="h-8 w-16 mx-auto text-center"
        />
      ),
    },
    {
      key: 'unidade',
      header: 'Unidade',
      width: 'w-24',
      align: 'center',
      render: (item) => (
        <span className="text-sm text-muted-foreground">{item.unidade || '—'}</span>
      ),
    },
    {
      key: 'subtotal',
      header: 'Custo',
      width: 'w-28',
      align: 'center',
      render: (item) => {
        const valor = subtotal(item);
        return valor === null ? (
          <span className="text-xs text-muted-foreground">sem preço</span>
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
    <div className="space-y-2">
      <ItensOrdenaveisTable
        itens={recursos}
        colunas={colunas}
        onReordenar={reordenar}
        onRemover={remover}
        onAdicionar={adicionar}
        textoAdicionar="Adicionar recurso"
        titulo="Recursos Necessários"
        disabled={disabled}
      />

      {recursos.length > 0 && (
        <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-sm">
          {semPreco > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <AlertCircle className="h-3 w-3 shrink-0" />
              {semPreco} {semPreco === 1 ? 'item sem preço' : 'itens sem preço'} — fora do total
            </span>
          )}
          <span className="text-muted-foreground">
            Custo estimado: <span className="text-foreground font-medium">{moeda(total)}</span>
          </span>
        </div>
      )}
    </div>
  );
}
