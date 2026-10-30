// src/features/solicitacoes-servico/components/InstrucoesSelector.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { ListPlus, Plus, X } from 'lucide-react';
import { Combobox } from '@/core';
import { toast } from 'sonner';
import { instrucoesApi, opcaoDaInstrucao } from '@/services/instrucoes.services';
import { planosManutencaoApi } from '@/services/planos-manutencao.services';
import { formatApiError } from '@/utils/api-error';
import { InstrucaoExpandableCard } from '@/components/common/InstrucaoExpandableCard';
import { AbrirInstrucaoContext, ValoresDaPropostaContext } from './proposta-contexto';
import type { BaseEntity } from '@/core/types/base';

/** A instrução como vem na entidade: solicitação (`instrucoes`) ou vínculo de anomalia. */
interface InstrucaoDaEntidade {
  id?: string;
  codigo?: string;
  nome?: string;
}

interface VinculoDeInstrucao extends InstrucaoDaEntidade {
  instrucao?: InstrucaoDaEntidade | null;
}

/** O que o seletor lê da entidade aberta no sheet. */
type EntidadeComInstrucoes = BaseEntity & {
  instrucoes?: InstrucaoDaEntidade[];
  anomalias_instrucoes?: VinculoDeInstrucao[];
};

interface InstrucoesSelectorProps {
  /** Os ids escolhidos; na abertura pode vir a lista de objetos da API. */
  value: unknown;
  onChange: (value: string[]) => void;
  disabled?: boolean;
  entity?: EntidadeComInstrucoes | null;
}

interface InstrucaoMeta {
  codigo?: string;
  nome?: string;
}

// Extrai instrucoes do entity - suporta tanto solicitacoes (entity.instrucoes)
// quanto anomalias (entity.anomalias_instrucoes)
function getEntityInstrucoes(entity?: EntidadeComInstrucoes | null): InstrucaoDaEntidade[] {
  if (entity?.instrucoes && Array.isArray(entity.instrucoes)) {
    return entity.instrucoes;
  }
  if (entity?.anomalias_instrucoes && Array.isArray(entity.anomalias_instrucoes)) {
    return entity.anomalias_instrucoes.map((ai) => ai.instrucao || ai);
  }
  return [];
}

/**
 * Apara o id na entrada, para todo mundo aqui comparar a mesma coisa.
 *
 * O banco convive com ids de 25 chars (cuid antigo) e de 26, e as opções do
 * combobox são construídas com `id.trim()` (`opcaoDaInstrucao`). Sem aparar
 * aqui, uma instrução já escolhida não sumiria da lista de disponíveis — daria
 * para adicioná-la duas vezes — e `getMeta` erraria a opção.
 */
const apararId = (id: unknown): string => (typeof id === 'string' ? id.trim() : '');

// Extrai IDs de instrucoes a partir de diferentes formatos
function extractIds(value: unknown, entity?: EntidadeComInstrucoes | null): string[] {
  if (Array.isArray(value) && value.length > 0) {
    if (typeof value[0] === 'string') return value.map(apararId).filter(Boolean);
    if (typeof value[0] === 'object' && value[0]?.id)
      return value.map((v: InstrucaoDaEntidade) => apararId(v.id)).filter(Boolean);
  }
  const instrucoes = getEntityInstrucoes(entity);
  if (instrucoes.length > 0) {
    return instrucoes.map((inst) => apararId(inst.id)).filter(Boolean);
  }
  return [];
}

// Extrai codigo/nome do entity para usar no card antes de carregar da API
function extractEntityMeta(entity?: EntidadeComInstrucoes | null): Record<string, InstrucaoMeta> {
  const meta: Record<string, InstrucaoMeta> = {};
  const instrucoes = getEntityInstrucoes(entity);
  instrucoes.forEach((inst) => {
    const id = apararId(inst.id);
    if (id) {
      meta[id] = { codigo: inst.codigo, nome: inst.nome };
    }
  });
  return meta;
}

export function InstrucoesSelector({ value, onChange, disabled, entity }: InstrucoesSelectorProps) {
  const abrirInstrucao = React.useContext(AbrirInstrucaoContext);
  const proposta = React.useContext(ValoresDaPropostaContext);
  const [initialized, setInitialized] = React.useState(false);
  const selectedIds = extractIds(value, entity);
  const entityMeta = React.useMemo(() => extractEntityMeta(entity), [entity]);

  const [adding, setAdding] = React.useState(false);
  const [options, setOptions] = React.useState<Array<{ value: string; label: string; codigo?: string; nome?: string }>>([]);
  const [loaded, setLoaded] = React.useState(false);

  // Sincronizar IDs do entity pro formData na primeira vez
  React.useEffect(() => {
    if (initialized) return;
    const ids = extractIds(value, entity);
    if (ids.length > 0 && (!Array.isArray(value) || value.length === 0 || typeof value[0] !== 'string')) {
      onChange(ids);
      setInitialized(true);
    }
  }, [entity, value, initialized]);

  React.useEffect(() => {
    if (loaded) return;
    // `listarTodasAtivas` pagina. Pedir uma página de 100 (o teto do DTO)
    // truncava o catálogo em silêncio a partir da 101ª instrução: quem
    // procurasse uma das de fora concluía que ela não existia.
    instrucoesApi
      .listarTodasAtivas()
      .then(lista => {
        setOptions(
          lista
            .filter(inst => inst.id && inst.nome)
            .map(inst => ({ ...opcaoDaInstrucao(inst), codigo: inst.codigo, nome: inst.nome })),
        );
        setLoaded(true);
      })
      .catch(err => {
        // Sem aviso, a lista vazia se lê como "não há instruções cadastradas"
        // quando na verdade a busca falhou.
        toast.error('Erro ao carregar as instruções', { description: formatApiError(err) });
        setLoaded(true);
      });
  }, [loaded]);

  const availableOptions = options.filter(opt => !selectedIds.includes(opt.value));

  // Importar de um plano (29/out/2026): as instruções das tarefas do plano entram de uma vez,
  // cada uma uma vez só (a repetida no plano e a que já estava não se repetem). Atalho: depois
  // de importadas, são instruções como as outras, e se tiram uma a uma
  const [escolhendoPlano, setEscolhendoPlano] = React.useState(false);
  const [planos, setPlanos] = React.useState<Array<{ value: string; label: string }> | null>(null);
  const [importando, setImportando] = React.useState(false);

  const abrirPlanos = () => {
    setEscolhendoPlano(true);
    setAdding(false);
    if (planos) return;
    void (async () => {
      try {
        // Todos os planos (os modelos), página a página: uma página só escondia o 101º
        const todos: Array<{ value: string; label: string }> = [];
        for (let page = 1; page <= 50; page++) {
          const resposta = await planosManutencaoApi.findAll({ page, limit: 100, sort_by: 'nome', sort_order: 'asc' });
          todos.push(...resposta.data.map((p) => ({ value: String(p.id).trim(), label: p.nome })));
          if (page >= (resposta.pagination?.pages ?? 1)) break;
        }
        setPlanos(todos);
      } catch (erro) {
        toast.error('Erro ao carregar os planos de manutenção', { description: formatApiError(erro) });
        setEscolhendoPlano(false);
      }
    })();
  };

  const importarDoPlano = async (planoId: string) => {
    setEscolhendoPlano(false);
    if (!planoId) return;
    setImportando(true);
    try {
      const plano = await planosManutencaoApi.findOne(planoId.trim(), true);
      const doPlano = [...new Set((plano.tarefas ?? []).map((t) => apararId(t.instrucao_id)).filter(Boolean))];
      const novas = doPlano.filter((id) => !selectedIds.includes(id));
      if (doPlano.length === 0) {
        toast.info(`O plano ${plano.nome} não tem tarefa com instrução`);
        return;
      }
      if (novas.length > 0) onChange([...selectedIds, ...novas]);
      const jaEstavam = doPlano.length - novas.length;
      toast.success(`${novas.length} ${novas.length === 1 ? 'instrução vinculada' : 'instruções vinculadas'} do plano ${plano.nome}`, {
        description: jaEstavam > 0 ? `${jaEstavam} já ${jaEstavam === 1 ? 'estava' : 'estavam'} na solicitação.` : undefined,
      });
    } catch (erro) {
      toast.error('Não foi possível importar as instruções do plano', { description: formatApiError(erro) });
    } finally {
      setImportando(false);
    }
  };

  const handleAdd = (id: string) => {
    if (id && !selectedIds.includes(id)) {
      onChange([...selectedIds, id]);
    }
    setAdding(false);
  };

  const handleRemove = (id: string) => {
    onChange(selectedIds.filter(i => i !== id));
  };

  const getMeta = (id: string): InstrucaoMeta => {
    const opt = options.find(o => o.value === id);
    if (opt) return { codigo: opt.codigo, nome: opt.nome };
    return entityMeta[id] || {};
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        {/* O título é o da seção do sheet ("Instruções", 30/out/2026); aqui, só de onde vem o quê */}
        <span className="text-xs text-muted-foreground">Os passos, as horas e o valor vêm do cadastro de cada instrução.</span>
        {!disabled && (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={abrirPlanos}
              disabled={importando}
              title="Importar as instruções de um plano de manutenção"
              aria-label="Importar as instruções de um plano de manutenção"
            >
              <ListPlus className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setEscolhendoPlano(false);
                setAdding(true);
              }}
              disabled={!loaded || availableOptions.length === 0}
              title="Vincular instrução"
              aria-label="Vincular instrução"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {escolhendoPlano && !disabled && (
        <div className="flex items-center gap-2">
          <div className="flex-1">
            {planos ? (
              <Combobox
                options={planos}
                value={undefined}
                onValueChange={(val) => void importarDoPlano(val)}
                placeholder="Buscar plano de manutenção..."
                searchPlaceholder="Digite para buscar..."
                emptyText="Nenhum plano"
              />
            ) : (
              <p className="text-sm text-muted-foreground">Carregando os planos...</p>
            )}
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => setEscolhendoPlano(false)} aria-label="Cancelar">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {adding && !disabled && (
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Combobox
              options={availableOptions}
              value={undefined}
              onValueChange={(val) => { if (val) handleAdd(val); else setAdding(false); }}
              placeholder="Buscar instrução..."
              searchPlaceholder="Digite para buscar..."
              emptyText="Nenhuma instrução disponível"
            />
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Sem instrução, nada: o quadro tracejado de "nenhuma vinculada" ocupava meio sheet para dizer o que o + já diz */}
      <div className="space-y-2">
        {selectedIds.map((id) => {
          const meta = getMeta(id);
          return (
            <InstrucaoExpandableCard
              key={id}
              id={id}
              codigo={meta.codigo}
              nome={meta.nome}
              onRemove={disabled ? undefined : () => handleRemove(id)}
              onEditar={abrirInstrucao ?? undefined}
              valor={proposta?.valores[id.trim()]}
              semPrecoNoCadastro={proposta?.semPreco?.includes(id.trim())}
              onValor={(valor) => proposta?.definir(id.trim(), valor)}
              valorEditavel={proposta?.editavel ?? false}
              disabled={disabled}
            />
          );
        })}
      </div>
    </div>
  );
}
