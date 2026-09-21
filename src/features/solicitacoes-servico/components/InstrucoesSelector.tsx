// src/features/solicitacoes-servico/components/InstrucoesSelector.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, X, FileText } from 'lucide-react';
import { Combobox } from '@/core';
import { toast } from 'sonner';
import { instrucoesApi, opcaoDaInstrucao } from '@/services/instrucoes.services';
import { formatApiError } from '@/utils/api-error';
import { InstrucaoExpandableCard } from '@/components/common/InstrucaoExpandableCard';
import { AbrirInstrucaoContext, ValoresDaPropostaContext } from './proposta-contexto';

interface InstrucoesSelectorProps {
  value: any;
  onChange: (value: string[]) => void;
  disabled?: boolean;
  entity?: any;
}

interface InstrucaoMeta {
  tag?: string;
  nome?: string;
}

// Extrai instrucoes do entity - suporta tanto solicitacoes (entity.instrucoes)
// quanto anomalias (entity.anomalias_instrucoes)
function getEntityInstrucoes(entity?: any): any[] {
  if (entity?.instrucoes && Array.isArray(entity.instrucoes)) {
    return entity.instrucoes;
  }
  if (entity?.anomalias_instrucoes && Array.isArray(entity.anomalias_instrucoes)) {
    return entity.anomalias_instrucoes.map((ai: any) => ai.instrucao || ai);
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
function extractIds(value: any, entity?: any): string[] {
  if (Array.isArray(value) && value.length > 0) {
    if (typeof value[0] === 'string') return value.map(apararId).filter(Boolean);
    if (typeof value[0] === 'object' && value[0]?.id)
      return value.map((v: any) => apararId(v.id)).filter(Boolean);
  }
  const instrucoes = getEntityInstrucoes(entity);
  if (instrucoes.length > 0) {
    return instrucoes.map((inst: any) => apararId(inst.id)).filter(Boolean);
  }
  return [];
}

// Extrai tag/nome do entity para usar no card antes de carregar da API
function extractEntityMeta(entity?: any): Record<string, InstrucaoMeta> {
  const meta: Record<string, InstrucaoMeta> = {};
  const instrucoes = getEntityInstrucoes(entity);
  instrucoes.forEach((inst: any) => {
    const id = apararId(inst.id);
    if (id) {
      meta[id] = { tag: inst.tag, nome: inst.nome };
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
  const [options, setOptions] = React.useState<Array<{ value: string; label: string; tag?: string; nome?: string }>>([]);
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
            .map(inst => ({ ...opcaoDaInstrucao(inst), tag: inst.tag, nome: inst.nome })),
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
    if (opt) return { tag: opt.tag, nome: opt.nome };
    return entityMeta[id] || {};
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Instruções Vinculadas</label>
        {!disabled && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setAdding(true)}
            disabled={!loaded || availableOptions.length === 0}
            title="Vincular instrução"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

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

      {selectedIds.length === 0 && !adding && (
        <div className="text-center p-6 border-2 border-dashed border-muted-foreground/25 rounded-lg">
          <FileText className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nenhuma instrução vinculada</p>
        </div>
      )}

      <div className="space-y-2">
        {selectedIds.map((id) => {
          const meta = getMeta(id);
          return (
            <InstrucaoExpandableCard
              key={id}
              id={id}
              tag={meta.tag}
              nome={meta.nome}
              onRemove={disabled ? undefined : () => handleRemove(id)}
              onEditar={abrirInstrucao ?? undefined}
              valor={proposta?.valores[id.trim()]}
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
