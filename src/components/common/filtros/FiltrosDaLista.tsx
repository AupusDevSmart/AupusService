import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Combobox } from '@/core';
import { useEquipamentosDoFiltro } from '@/hooks/useEquipamentosDoFiltro';

const TODOS = 'all';
const comoTexto = (valor: unknown) => (typeof valor === 'string' && valor !== TODOS ? valor.trim() : '');

interface FiltroDeEquipamentoProps {
  value: unknown;
  onChange: (valor: string) => void;
  /** Só os equipamentos desta planta (o filtro de planta escolhido). */
  plantaId?: string;
  disabled?: boolean;
}

/**
 * O equipamento (UC) do filtro: todos, por rolagem infinita, com busca no
 * servidor (o cadastro cresce). O componente vem junto com a UC na API.
 */
export function FiltroDeEquipamento({ value, onChange, plantaId, disabled }: FiltroDeEquipamentoProps) {
  const id = comoTexto(value);
  // O rótulo do escolhido: as páginas carregadas podem não ter ele (trocou a busca)
  const [rotulo, setRotulo] = useState('');
  const { opcoes, paginacao } = useEquipamentosDoFiltro(comoTexto(plantaId) || undefined, id ? { id, rotulo } : undefined);

  return (
    <Combobox
      options={opcoes}
      value={id}
      onValueChange={(valor) => {
        setRotulo(opcoes.find((o) => o.value === valor)?.label ?? '');
        onChange(valor || TODOS);
      }}
      placeholder="Todos os equipamentos"
      searchPlaceholder="Buscar equipamento..."
      emptyText="Nenhum equipamento."
      disabled={disabled}
      paginacao={paginacao}
    />
  );
}

interface CampoDeDataProps {
  rotulo: string;
  value: unknown;
  onChange: (valor: string) => void;
}

/** O campo de data emite cada passo do ano (0002, 0020, 0202...): só vale o ano inteiro. */
const dataCompleta = (dia: string) => dia === '' || (/^\d{4}-\d{2}-\d{2}$/.test(dia) && Number(dia.slice(0, 4)) >= 1900);

/**
 * Um lado do período ("De", "Até"): o campo de data sozinho não diz qual é.
 * Guarda o que se digita e só avisa a data inteira — cada passo do ano virava
 * uma busca, e a resposta de "0202" podia chegar depois da de "2026".
 */
export function CampoDeDataDoFiltro({ rotulo, value, onChange }: CampoDeDataProps) {
  const [digitado, setDigitado] = useState(comoTexto(value));
  // "Limpar filtros" de fora zera o campo
  useEffect(() => setDigitado(comoTexto(value)), [value]);

  return (
    <label className="flex items-center gap-2">
      <span className="shrink-0 text-sm text-muted-foreground">{rotulo}</span>
      <Input
        type="date"
        className="h-9"
        value={digitado}
        onChange={(e) => {
          setDigitado(e.target.value);
          if (dataCompleta(e.target.value)) onChange(e.target.value);
        }}
        aria-label={`Período: ${rotulo.toLowerCase()}`}
      />
    </label>
  );
}
