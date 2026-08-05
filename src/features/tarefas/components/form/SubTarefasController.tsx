// src/features/tarefas/components/form/SubTarefasController.tsx
import React from 'react';
import { FormFieldProps } from '@/types/base';
import { Input } from '@/components/ui/input';
import { ClipboardList, CheckCircle2, Clock } from 'lucide-react';
import { ItensOrdenaveisTable, type ColunaItemOrdenavel } from '@/components/common/ItensOrdenaveisTable';

interface SubTarefa {
  id?: string;
  descricao: string;
  obrigatoria: boolean;
  tempo_estimado?: number;
}

const formatarTempo = (minutos: number): string => {
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto > 0 ? `${horas}h ${resto}min` : `${horas}h`;
};

export function SubTarefasController({ value, onChange, disabled }: FormFieldProps) {
  const [subTarefas, setSubTarefas] = React.useState<SubTarefa[]>(
    Array.isArray(value) ? value : []
  );

  // Atualizar quando o value muda (importante para modos view/edit)
  React.useEffect(() => {
    if (Array.isArray(value)) {
      setSubTarefas(value);
    }
  }, [value]);

  const aplicar = (lista: SubTarefa[]) => {
    setSubTarefas(lista);
    onChange(lista);
  };

  const adicionarSubTarefa = () => {
    aplicar([...subTarefas, { descricao: '', obrigatoria: false, tempo_estimado: 0 }]);
  };

  const removerSubTarefa = (index: number) => {
    aplicar(subTarefas.filter((_, i) => i !== index));
  };

  const atualizarSubTarefa = (index: number, campo: keyof SubTarefa, valor: unknown) => {
    aplicar(subTarefas.map((item, i) => (i === index ? { ...item, [campo]: valor } : item)));
  };

  const reordenar = (origem: number, destino: number) => {
    const lista = [...subTarefas];
    const [movido] = lista.splice(origem, 1);
    lista.splice(destino, 0, movido);
    aplicar(lista);
  };

  const colunas: Array<ColunaItemOrdenavel<SubTarefa>> = [
    {
      key: 'descricao',
      header: 'Descrição',
      render: (item, index) => (
        <Input
          placeholder="Descrição da sub-tarefa..."
          type="text"
          value={item.descricao}
          onChange={(e) => atualizarSubTarefa(index, 'descricao', e.target.value)}
          disabled={disabled}
          className="h-8"
        />
      )
    },
    {
      key: 'obrigatoria',
      header: 'Obrigatória',
      width: 'w-28',
      align: 'center',
      render: (item, index) => (
        <input
          type="checkbox"
          checked={item.obrigatoria}
          onChange={(e) => atualizarSubTarefa(index, 'obrigatoria', e.target.checked)}
          disabled={disabled}
          className="accent-foreground"
          title="Obrigatória"
        />
      )
    },
    {
      key: 'tempo_estimado',
      header: 'Tempo (min)',
      width: 'w-28',
      align: 'center',
      render: (item, index) => (
        <Input
          type="number"
          min={0}
          value={item.tempo_estimado || ''}
          onChange={(e) => atualizarSubTarefa(index, 'tempo_estimado', Number(e.target.value))}
          disabled={disabled}
          className="h-8 w-20 mx-auto text-center"
          placeholder="0"
        />
      )
    }
  ];

  const tempoTotal = subTarefas.reduce((acc, item) => acc + (Number(item.tempo_estimado) || 0), 0);

  return (
    <ItensOrdenaveisTable
      itens={subTarefas}
      colunas={colunas}
      onReordenar={reordenar}
      onRemover={removerSubTarefa}
      onAdicionar={adicionarSubTarefa}
      textoAdicionar="Adicionar sub-tarefa"
      disabled={disabled}
      resumo={[
        { icone: <ClipboardList className="h-3.5 w-3.5" />, label: 'Total de etapas', valor: subTarefas.length },
        {
          icone: <CheckCircle2 className="h-3.5 w-3.5" />,
          label: 'Etapas obrigatórias',
          valor: subTarefas.filter((item) => item.obrigatoria).length
        },
        { icone: <Clock className="h-3.5 w-3.5" />, label: 'Tempo estimado total', valor: formatarTempo(tempoTotal) }
      ]}
    />
  );
}
