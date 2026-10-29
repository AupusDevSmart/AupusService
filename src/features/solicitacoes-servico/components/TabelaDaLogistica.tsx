// src/features/solicitacoes-servico/components/TabelaDaLogistica.tsx
import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/core';
import { CampoDeNumero } from '@/components/common/CampoDeNumero';
import { DicaDaConta, type Explicacao } from '@/components/common/ComoSeCalcula';
import { formatApiError } from '@/utils/api-error';
import { AVISO_DE_DINHEIRO, dinheiroNoCampo, lerDinheiroDigitado } from '@/utils/leitura';
import { recursosApi, type CategoriaRecurso, type RecursoApiResponse } from '@/services/recursos.services';
import { moeda, type LinhaDeLogistica, type PlanejamentoDaProposta, type TabelaDeLogistica } from '@/services/proposta.services';

type Coluna = 'quantidade' | 'valor_unitario' | 'dias' | 'km' | 'valor_km' | 'valor_fixo';

/**
 * As colunas de cada tabela (a conta de cada uma está em `totalDaLinha`):
 *   frete:        viagens × km por viagem × R$/km + valor fixo
 *   deslocamento: dias × diária do veículo + km × R$/km
 *   diárias:      quantidade × valor (café, almoço, jantar, pernoite)
 */
const TABELAS: Record<TabelaDeLogistica, { titulo: string; categoria: CategoriaRecurso; colunas: { campo: Coluna; rotulo: string; dinheiro?: boolean }[] }> = {
  FRETE: {
    titulo: 'Frete',
    categoria: 'TERCEIRO',
    colunas: [
      { campo: 'quantidade', rotulo: 'Viagens' },
      { campo: 'km', rotulo: 'km por viagem' },
      { campo: 'valor_km', rotulo: 'R$ por km', dinheiro: true },
      { campo: 'valor_fixo', rotulo: 'Valor fixo', dinheiro: true },
    ],
  },
  DESLOCAMENTO: {
    titulo: 'Deslocamento',
    categoria: 'VEICULO',
    colunas: [
      { campo: 'dias', rotulo: 'Dias' },
      { campo: 'valor_unitario', rotulo: 'Diária do veículo', dinheiro: true },
      { campo: 'km', rotulo: 'km' },
      { campo: 'valor_km', rotulo: 'R$ por km', dinheiro: true },
    ],
  },
  DIARIA: {
    titulo: 'Diárias',
    categoria: 'DESPESA_CAMPO',
    colunas: [
      { campo: 'quantidade', rotulo: 'Quantidade' },
      { campo: 'valor_unitario', rotulo: 'Valor', dinheiro: true },
    ],
  },
};

/** "Hospedagem", "pernoite": a quantidade sugerida é pessoas × noites; o resto, pessoas × dias */
const EH_PERNOITE = /pernoite|hospedagem|hotel/i;

/**
 * A linha nova de um recurso do catálogo (o valor é cópia: o catálogo de amanhã
 * não reescreve a proposta), com as quantidades do planejamento.
 */
function linhaDoRecurso(tabela: TabelaDeLogistica, recurso: RecursoApiResponse, plano: PlanejamentoDaProposta): LinhaDeLogistica {
  const preco = Number(recurso.preco_base ?? recurso.preco_unitario ?? 0) || 0;
  const porKm = recurso.base_calculo === 'km';
  const base = { tabela, ativo: true, recurso_id: recurso.id.trim(), descricao: recurso.nome, total: null };
  const pessoas = plano.pessoas_previstas ?? 1;
  if (tabela === 'DIARIA') {
    const vezes = EH_PERNOITE.test(recurso.nome) ? (plano.noites_fora ?? 0) : (plano.dias_previstos ?? 1);
    return { ...base, quantidade: pessoas * vezes, valor_unitario: preco };
  }
  if (tabela === 'DESLOCAMENTO') {
    return { ...base, dias: plano.dias_previstos ?? 1, km: plano.distancia_ida_volta_km, ...(porKm ? { valor_km: preco } : { valor_unitario: preco }) };
  }
  return { ...base, quantidade: 1, ...(porKm ? { km: plano.distancia_km, valor_km: preco } : { valor_fixo: preco }) };
}

/** A linha em branco, já com o planejamento onde ele cabe */
function linhaEmBranco(tabela: TabelaDeLogistica, plano: PlanejamentoDaProposta): LinhaDeLogistica {
  const base = { tabela, ativo: true, descricao: '', total: null };
  if (tabela === 'DESLOCAMENTO') return { ...base, dias: plano.dias_previstos, km: plano.distancia_ida_volta_km };
  if (tabela === 'FRETE') return { ...base, quantidade: 1, km: plano.distancia_km };
  return { ...base, quantidade: null };
}

interface TabelaDaLogisticaProps {
  tabela: TabelaDeLogistica;
  /** As linhas desta tabela, na ordem */
  linhas: LinhaDeLogistica[];
  editavel: boolean;
  planejamento: PlanejamentoDaProposta;
  /** A lista inteira da tabela, como fica (o servidor recalcula o total) */
  onChange: (linhas: LinhaDeLogistica[]) => void;
  /** Como o total da linha sai (o ícone discreto ao lado do título) */
  explicacao?: Explicacao;
}

/**
 * Uma tabelinha da proposta (29/out/2026): frete, deslocamento ou diárias. Sem
 * linha nenhuma, só o título e os botões: a proposta local não precisa de frete.
 * Cada linha se empilha (descrição em cima, números embaixo): o sheet não pede
 * arrasto para o lado no celular.
 */
export function TabelaDaLogistica({ tabela, linhas, editavel, planejamento, onChange, explicacao }: TabelaDaLogisticaProps) {
  const config = TABELAS[tabela];
  const [recursos, setRecursos] = useState<RecursoApiResponse[]>([]);

  useEffect(() => {
    if (!editavel) return;
    let cancelado = false;
    // Todas as páginas (a API dá até 100 por vez): uma só cortava o catálogo calada
    void (async () => {
      try {
        const todos: RecursoApiResponse[] = [];
        for (let page = 1; page <= 50; page++) {
          const resposta = await recursosApi.listar({ categoria: config.categoria, apenas_ativos: true, limit: 100, page });
          todos.push(...resposta.data);
          if (page >= (resposta.pagination?.totalPages ?? 1)) break;
        }
        if (!cancelado) setRecursos(todos);
      } catch (erro) {
        if (!cancelado) toast.error(`Não foi possível ler o catálogo de ${config.titulo.toLowerCase()}`, { description: formatApiError(erro) });
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [editavel, config.categoria, config.titulo]);

  const trocar = (indice: number, dados: Partial<LinhaDeLogistica>) => onChange(linhas.map((l, i) => (i === indice ? { ...l, ...dados } : l)));
  const doCatalogo = (id: string) => {
    const recurso = recursos.find((r) => r.id.trim() === id);
    if (!recurso) return;
    if (recurso.preco_base == null && recurso.preco_unitario == null) {
      toast.warning(`${recurso.nome} não tem preço no catálogo`, { description: 'A linha entrou com R$ 0,00: digite o valor.' });
    }
    onChange([...linhas, linhaDoRecurso(tabela, recurso, planejamento)]);
  };
  const total = linhas.filter((l) => l.ativo).reduce((s, l) => s + (l.total ?? 0), 0);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-sm font-medium">
          {config.titulo}
          {explicacao && <DicaDaConta {...explicacao} />}
          {linhas.length > 0 && <span className="ml-1 text-xs font-normal text-muted-foreground tabular-nums">{moeda(total)}</span>}
        </span>
        {editavel && (
          <div className="flex items-center gap-1">
            {recursos.length > 0 && (
              <Combobox
                className="h-8 w-44"
                options={recursos.map((r) => ({ value: r.id.trim(), label: r.nome }))}
                value=""
                onValueChange={doCatalogo}
                placeholder="Do catálogo"
                searchPlaceholder="Buscar recurso"
                emptyText="Nenhum recurso"
              />
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title={`Adicionar linha de ${config.titulo.toLowerCase()}`}
              aria-label={`Adicionar linha de ${config.titulo.toLowerCase()}`}
              onClick={() => onChange([...linhas, linhaEmBranco(tabela, planejamento)])}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {linhas.map((linha, indice) => (
        <div key={linha.id ?? `nova-${indice}`} className={`space-y-1.5 rounded-md border p-2 ${linha.ativo ? '' : 'opacity-60'}`}>
          <div className="flex items-center gap-2">
            <label className="flex shrink-0 items-center" title="Desativada fica na proposta, fora da conta">
              <input
                type="checkbox"
                className="h-3.5 w-3.5"
                checked={linha.ativo}
                disabled={!editavel}
                aria-label="Linha na conta"
                onChange={(e) => trocar(indice, { ativo: e.target.checked })}
              />
            </label>
            <TextoDaLinha
              valor={linha.descricao}
              editavel={editavel}
              placeholder={tabela === 'DIARIA' ? 'Ex.: almoço, pernoite' : tabela === 'FRETE' ? 'Ex.: frete do gerador' : 'Ex.: picape da equipe'}
              onChange={(descricao) => trocar(indice, { descricao })}
            />
            <span className="shrink-0 text-sm tabular-nums">{moeda(linha.total ?? 0)}</span>
            {editavel && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                title="Remover"
                aria-label="Remover linha"
                onClick={() => onChange(linhas.filter((_, i) => i !== indice))}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {config.colunas.map(({ campo, rotulo, dinheiro }) => (
              <label key={campo} className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                {rotulo}
                <CampoDeNumero
                  className="h-8 text-right"
                  value={linha[campo] ?? null}
                  disabled={!editavel}
                  onChange={(valor) => trocar(indice, { [campo]: valor })}
                  {...(dinheiro && { ler: lerDinheiroDigitado, mostrar: dinheiroNoCampo, aviso: AVISO_DE_DINHEIRO })}
                  avisoCurto
                  aria-label={`${rotulo} (${config.titulo.toLowerCase()})`}
                />
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** O texto da linha grava ao sair do campo (por tecla, cada letra era uma escrita na API) */
export function TextoDaLinha({ valor, editavel, placeholder, onChange }: { valor: string; editavel: boolean; placeholder?: string; onChange: (texto: string) => void }) {
  const [texto, setTexto] = useState(valor);
  useEffect(() => setTexto(valor), [valor]);
  return (
    <input
      className="input-minimal min-w-0 flex-1"
      value={texto}
      placeholder={placeholder}
      disabled={!editavel}
      maxLength={200}
      onChange={(e) => setTexto(e.target.value)}
      onBlur={() => texto !== valor && onChange(texto)}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
    />
  );
}
