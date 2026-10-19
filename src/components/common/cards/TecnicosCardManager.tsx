// src/components/common/cards/TecnicosCardManager.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Users, Trash2 } from 'lucide-react';
import { Combobox, type ComboboxOption } from '@/core/components/ui/combobox';
import { CardLista, CardLinha, campoCard, selectCard, type ColunaCard } from './card-lista';
import { formatarHoras } from '@/utils/horas';

export interface TecnicoItem {
  id?: string;
  nome: string;
  especialidade: string;
  horas_estimadas: number;
  horas_trabalhadas?: number;
  custo_hora?: number;
  custo_total?: number;
  presente?: boolean;
  tecnico_id?: string;
  observacoes?: string;
}

interface TecnicosCardManagerProps {
  value: TecnicoItem[];
  onChange: (tecnicos: TecnicoItem[]) => void;
  disabled?: boolean;
  mode?: 'planejamento' | 'execucao' | 'view';
  showCustos?: boolean;
  showStatus?: boolean;
  showHorasReais?: boolean;
  title?: string;
  /**
   * Com isto, o técnico é escolhido entre usuários (SN-31) em vez de digitado:
   * a opção grava `tecnico_id` e o nome. Sem isto, o campo segue texto livre.
   */
  opcoesDoTecnico?: (tecnico: TecnicoItem) => ComboboxOption[];
}

const especialidadesComuns = [
  'Técnico Mecânico',
  'Técnico Elétrico',
  'Técnico Eletrônico',
  'Soldador',
  'Operador de Guindastes',
  'Técnico em Instrumentação',
  'Técnico em Segurança',
  'Engenheiro',
  'Auxiliar',
  'Outros'
];

/**
 * A lista comum mais a especialidade que a linha já tem. O recurso da
 * instrução ("Eletricista") e o tipo de quem entrou na execução (SN-61) não
 * estão na lista, e o select sem a opção mostrava "Selecione..." numa linha
 * preenchida.
 */
const opcoesDeEspecialidade = (atual?: string) =>
  atual?.trim() && !especialidadesComuns.includes(atual) ? [atual, ...especialidadesComuns] : especialidadesComuns;

const TecnicosCardManager: React.FC<TecnicosCardManagerProps> = ({
  value = [],
  onChange,
  disabled = false,
  mode = 'planejamento',
  showCustos = false,
  showStatus = false,
  showHorasReais = false,
  title = "Técnicos",
  opcoesDoTecnico,
}) => {
  const [tecnicos, setTecnicos] = useState<TecnicoItem[]>(value);

  useEffect(() => {
    setTecnicos(value);
  }, [value]);

  const updateTecnicos = (newTecnicos: TecnicoItem[]) => {
    setTecnicos(newTecnicos);
    onChange(newTecnicos);
  };

  const adicionarTecnico = () => {
    const novoTecnico: TecnicoItem = {
      id: `temp_${Date.now()}`,
      nome: '',
      especialidade: '',
      horas_estimadas: 8,
      custo_hora: 0,
      custo_total: 0,
      presente: false
    };
    updateTecnicos([...tecnicos, novoTecnico]);
  };

  const removerTecnico = (index: number) => {
    updateTecnicos(tecnicos.filter((_, i) => i !== index));
  };

  const atualizarTecnico = <K extends keyof TecnicoItem>(index: number, campo: K, valor: TecnicoItem[K]) => {
    const novosTecnicos = [...tecnicos];
    novosTecnicos[index] = { ...novosTecnicos[index], [campo]: valor };

    if (campo === 'horas_estimadas' || campo === 'horas_trabalhadas' || campo === 'custo_hora') {
      const tecnico = novosTecnicos[index];
      const horas = mode === 'execucao' && tecnico.horas_trabalhadas !== undefined
        ? tecnico.horas_trabalhadas
        : tecnico.horas_estimadas;
      if (horas && tecnico.custo_hora) {
        tecnico.custo_total = horas * tecnico.custo_hora;
      }
    }

    updateTecnicos(novosTecnicos);
  };

  const escolherPessoa = (index: number, id: string, opcoes: ComboboxOption[]) => {
    const novosTecnicos = [...tecnicos];
    novosTecnicos[index] = {
      ...novosTecnicos[index],
      tecnico_id: id || undefined,
      nome: id ? opcoes.find((o) => o.value === id)?.label ?? '' : '',
    };
    updateTecnicos(novosTecnicos);
  };

  const calcularCustoTotal = () => {
    return tecnicos.reduce((total, tecnico) => total + (tecnico.custo_total || 0), 0);
  };

  const calcularHorasTotal = () => {
    if (mode === 'execucao' && showHorasReais) {
      return tecnicos.reduce((total, tecnico) => total + (tecnico.horas_trabalhadas || 0), 0);
    }
    return tecnicos.reduce((total, tecnico) => total + (tecnico.horas_estimadas || 0), 0);
  };

  // As colunas variam com o modo, entao o template do grid e montado aqui e
  // compartilhado entre o cabecalho e as linhas — e o que garante alinhamento.
  const colunas: ColunaCard[] = [
    { label: 'Técnico', largura: 'minmax(9rem, 1fr)' },
    { label: 'Especialidade', largura: '11rem' },
    { label: 'Horas', largura: '4rem', alinhamento: 'center' },
    ...(showHorasReais && mode === 'execucao'
      ? [{ label: 'H. trab.', largura: '4.5rem', alinhamento: 'center' as const }]
      : []),
    ...(showCustos
      ? [
          { label: 'R$/h', largura: '5rem', alinhamento: 'center' as const },
          { label: 'Custo', largura: '5.5rem', alinhamento: 'right' as const },
        ]
      : []),
    ...(mode === 'execucao' && showStatus
      ? [{ label: 'Presente', largura: '4.5rem', alinhamento: 'center' as const }]
      : []),
    ...(!disabled ? [{ label: '', largura: '2rem' }] : []),
  ];

  if (disabled && tecnicos.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <Users className="h-5 w-5 mx-auto mb-1 opacity-40" />
        <p className="text-sm">Nenhum técnico cadastrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium text-foreground">{title}</Label>
          {tecnicos.length > 0 && (
            <span className="text-xs text-muted-foreground">({tecnicos.length})</span>
          )}
        </div>
        {!disabled && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="Adicionar técnico"
            onClick={adicionarTecnico}
            className="h-8 w-8"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Lista */}
      {tecnicos.length > 0 && (
        <CardLista colunas={colunas}>
          {tecnicos.map((tecnico, index) => (
            <CardLinha key={tecnico.id || index} colunas={colunas}>
              {opcoesDoTecnico ? (
                <Combobox
                  options={opcoesDoTecnico(tecnico)}
                  value={tecnico.tecnico_id?.trim() ?? ''}
                  onValueChange={(id) => escolherPessoa(index, id, opcoesDoTecnico(tecnico))}
                  placeholder={tecnico.nome?.trim() && !tecnico.tecnico_id?.trim() ? `${tecnico.nome.trim()} (sem usuário)` : 'A definir'}
                  searchPlaceholder="Buscar pessoa..."
                  emptyText="Ninguém com esse nome."
                  className={campoCard}
                />
              ) : (
                <Input
                  value={tecnico.nome}
                  onChange={(e) => atualizarTecnico(index, 'nome', e.target.value)}
                  placeholder="Nome..."
                  disabled={disabled}
                  className={campoCard}
                />
              )}
              <select
                value={tecnico.especialidade}
                onChange={(e) => atualizarTecnico(index, 'especialidade', e.target.value)}
                disabled={disabled}
                className={selectCard}
              >
                <option value="">Selecione...</option>
                {opcoesDeEspecialidade(tecnico.especialidade).map(esp => (
                  <option key={esp} value={esp}>{esp}</option>
                ))}
              </select>
              <Input
                type="number"
                min="0"
                step="0.5"
                value={tecnico.horas_estimadas}
                onChange={(e) => atualizarTecnico(index, 'horas_estimadas', parseFloat(e.target.value) || 0)}
                disabled={disabled}
                className={`${campoCard} text-center`}
              />
              {showHorasReais && mode === 'execucao' && (
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={tecnico.horas_trabalhadas ?? ''}
                  onChange={(e) => atualizarTecnico(index, 'horas_trabalhadas', parseFloat(e.target.value) || 0)}
                  disabled={disabled}
                  className={`${campoCard} text-center`}
                />
              )}
              {showCustos && (
                <>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={tecnico.custo_hora || ''}
                    onChange={(e) => atualizarTecnico(index, 'custo_hora', parseFloat(e.target.value) || 0)}
                    disabled={disabled}
                    className={`${campoCard} text-center`}
                  />
                  <span className="text-sm text-muted-foreground text-right truncate">
                    R$ {(tecnico.custo_total || 0).toFixed(2)}
                  </span>
                </>
              )}
              {mode === 'execucao' && showStatus && (
                <div className="flex justify-center">
                  <input
                    type="checkbox"
                    checked={tecnico.presente}
                    onChange={(e) => atualizarTecnico(index, 'presente', e.target.checked)}
                    disabled={disabled}
                    className="rounded border-border"
                    aria-label="Presente"
                  />
                </div>
              )}
              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removerTecnico(index)}
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  title="Remover"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </CardLinha>
          ))}
        </CardLista>
      )}

      {/* Resumo */}
      {tecnicos.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground text-right justify-end pr-1">
          <span>Total: {formatarHoras(calcularHorasTotal())}</span>
          {showCustos && <span>Custo: R$ {calcularCustoTotal().toFixed(2)}</span>}
        </div>
      )}

    </div>
  );
};

export { TecnicosCardManager };
