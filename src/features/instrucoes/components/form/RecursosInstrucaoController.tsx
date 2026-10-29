// src/features/instrucoes/components/form/RecursosInstrucaoController.tsx
import React from 'react';
import { Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { formatApiError } from '@/utils/api-error';
import { todasAsPaginas } from '@/lib/planilha/todas-as-paginas';
import { recursosApi, type RecursoApiResponse } from '@/services/recursos.services';
import { maquinariosApi, type MaquinarioApiResponse } from '@/services/maquinarios.services';
import { somarSubtotais, subtotalDaLinha } from '@/features/instrucoes/utils/custo-da-linha';
import { LinhasDeCusto, type ItemDoCatalogo, type LinhaDeCustoDoFormulario } from './LinhasDeCusto';
import { useVeCustos } from '@/hooks/useVeCustos';

const moeda = (valor: number) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** O `recurso_id` chega do Char(26) com espaço no id de 25: aparado na entrada, casa com as opções */
function normalizar(lista: unknown, chave: 'recurso_id' | 'maquinario_id'): LinhaDeCustoDoFormulario[] {
  if (!Array.isArray(lista)) return [];
  return (lista as LinhaDeCustoDoFormulario[]).map((linha) => ({ ...linha, [chave]: linha?.[chave]?.trim() || null }));
}

const ehMaterial = (linha: LinhaDeCustoDoFormulario, porId: Map<string, RecursoApiResponse>) =>
  (porId.get(linha.recurso_id?.trim() ?? '') ?? linha.recurso)?.categoria === 'MATERIAL';

interface Props {
  /** As linhas de recurso (recursos e materiais juntos: é uma lista só na API) */
  value: unknown;
  onChange: (linhas: LinhaDeCustoDoFormulario[]) => void;
  maquinarios: unknown;
  onMaquinarios: (linhas: LinhaDeCustoDoFormulario[]) => void;
  /** Os passos em edição: a soma deles sugere a duração da linha cobrada por tempo */
  passos?: unknown;
  disabled?: boolean;
}

/**
 * O que a instrução consome, nos três grupos do AupusProject (SN-85): os
 * recursos (mão de obra, instrumento, veículo, terceiro, despesa de campo), o
 * maquinário e os materiais. O preço é lido ao vivo do cadastro, de propósito:
 * reajustar um custo se reflete aqui; o que congela é a OS. O total é a conta do
 * servidor espelhada na tela (`custo-da-linha.ts`); ao salvar, vale a do servidor.
 */
export function RecursosInstrucaoController({ value, onChange, maquinarios, onMaquinarios, passos, disabled }: Props) {
  const veCusto = useVeCustos();
  const [recursos, setRecursos] = React.useState<RecursoApiResponse[]>([]);
  const [maquinas, setMaquinas] = React.useState<MaquinarioApiResponse[]>([]);
  const [carregando, setCarregando] = React.useState(true);

  React.useEffect(() => {
    let cancelado = false;
    // Todas as páginas: o DTO limita a 100 por página, e o `limit: 500` de antes dava 400 (o combobox vinha vazio)
    Promise.all([
      todasAsPaginas((page, limit) => recursosApi.listar({ apenas_ativos: true, page, limit })),
      todasAsPaginas((page, limit) => maquinariosApi.listar({ apenas_ativos: true, page, limit })),
    ])
      .then(([r, m]) => {
        if (cancelado) return;
        setRecursos(r);
        setMaquinas(m);
      })
      .catch((erro) => {
        if (!cancelado) toast.error('Erro ao carregar os cadastros de recursos e maquinários', { description: formatApiError(erro) });
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  const recursoPorId = React.useMemo(() => new Map(recursos.map((r) => [r.id.trim(), r])), [recursos]);
  const linhasDeRecurso = React.useMemo(() => normalizar(value, 'recurso_id'), [value]);
  const linhasDeMaquinario = React.useMemo(() => normalizar(maquinarios, 'maquinario_id'), [maquinarios]);

  /**
   * Recursos e materiais são uma lista só na API; aqui, duas seções. A linha nova
   * ainda sem item fica na seção em que foi criada (`grupo` só na tela: a lista
   * branca do service não o manda).
   */
  type ComGrupo = LinhaDeCustoDoFormulario & { grupo?: 'recursos' | 'materiais' };
  const grupoDe = (l: ComGrupo) => l.grupo ?? (ehMaterial(l, recursoPorId) ? 'materiais' : 'recursos');
  const comGrupo = linhasDeRecurso as ComGrupo[];
  const doGrupo = (grupo: 'recursos' | 'materiais') => comGrupo.filter((l) => grupoDe(l) === grupo);
  const trocarGrupo = (grupo: 'recursos' | 'materiais', novas: LinhaDeCustoDoFormulario[]) => {
    const outro = grupo === 'recursos' ? 'materiais' : 'recursos';
    const marcadas = novas.map((l) => ({ ...l, grupo }));
    onChange(grupo === 'recursos' ? [...marcadas, ...doGrupo(outro)] : [...doGrupo(outro), ...marcadas]);
  };

  const horasDosPassos = Array.isArray(passos)
    ? (passos as Array<{ duracao_horas?: number | null }>).reduce((h, p) => h + (Number(p?.duracao_horas) || 0), 0)
    : 0;

  const aoCriar = (item: ItemDoCatalogo) => {
    if ('categoria' in item) setRecursos((atual) => [...atual.filter((r) => r.id.trim() !== item.id.trim()), item]);
    else setMaquinas((atual) => [...atual.filter((m) => m.id.trim() !== item.id.trim()), item]);
  };

  const maquinaPorId = new Map(maquinas.map((m) => [m.id.trim(), m]));
  const subtotais = [
    ...linhasDeRecurso.map((l) => {
      const item = recursoPorId.get(l.recurso_id?.trim() ?? '') ?? l.recurso;
      return item ? subtotalDaLinha(item, l) : undefined;
    }),
    ...linhasDeMaquinario.map((l) => {
      const item = maquinaPorId.get(l.maquinario_id?.trim() ?? '') ?? l.maquinario;
      return item ? subtotalDaLinha(item, l) : undefined;
    }),
  ].filter((s): s is number | null => s !== undefined);
  const total = somarSubtotais(subtotais);

  const comum = { carregando, horasDosPassos, onItemCriado: aoCriar, disabled };

  return (
    <div className="space-y-4">
      <LinhasDeCusto
        {...comum}
        grupo="recursos"
        titulo="Recursos"
        linhas={doGrupo('recursos')}
        onChange={(novas) => trocarGrupo('recursos', novas)}
        catalogo={recursos.filter((r) => r.categoria !== 'MATERIAL')}
      />
      <LinhasDeCusto
        {...comum}
        grupo="maquinario"
        titulo="Maquinário"
        linhas={linhasDeMaquinario}
        onChange={onMaquinarios}
        catalogo={maquinas}
      />
      <LinhasDeCusto
        {...comum}
        grupo="materiais"
        titulo="Materiais"
        linhas={doGrupo('materiais')}
        onChange={(novas) => trocarGrupo('materiais', novas)}
        catalogo={recursos.filter((r) => r.categoria === 'MATERIAL')}
      />
      {/* Para quem não vê custos o preço não vem: "falta preço" seria mentira (28/out/2026) */}
      {veCusto && subtotais.length > 0 && (
        <p className="flex items-center justify-end gap-1.5 text-sm text-muted-foreground">
          <Wallet className="h-4 w-4" />
          Valor da instrução:
          <span className="font-medium text-foreground">{total === null ? 'falta preço em alguma linha' : moeda(total)}</span>
        </p>
      )}
    </div>
  );
}
