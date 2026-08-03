// src/features/instrucoes/components/form/SubInstrucoesController.tsx
import React from 'react';
import { FormFieldProps } from '@/types/base';
import { Input } from '@/components/ui/input';
import { ClipboardList, CheckCircle2, Clock } from 'lucide-react';
import { ItensOrdenaveisTable, type ColunaItemOrdenavel } from '@/components/common/ItensOrdenaveisTable';

interface SubInstrucao {
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

export function SubInstrucoesController({ value, onChange, disabled }: FormFieldProps) {
  const [subInstrucoes, setSubInstrucoes] = React.useState<SubInstrucao[]>(
    Array.isArray(value) ? value : []
  );

  React.useEffect(() => {
    if (Array.isArray(value)) {
      setSubInstrucoes(value);
    }
  }, [value]);

  const aplicar = (lista: SubInstrucao[]) => {
    setSubInstrucoes(lista);
    onChange(lista);
  };

  const adicionar = () => {
    aplicar([...subInstrucoes, { descricao: '', obrigatoria: false, tempo_estimado: 0 }]);
  };

  const remover = (index: number) => {
    aplicar(subInstrucoes.filter((_, i) => i !== index));
  };

  const atualizar = (index: number, campo: keyof SubInstrucao, valor: unknown) => {
    aplicar(subInstrucoes.map((item, i) => (i === index ? { ...item, [campo]: valor } : item)));
  };

  const reordenar = (origem: number, destino: number) => {
    const lista = [...subInstrucoes];
    const [movido] = lista.splice(origem, 1);
    lista.splice(destino, 0, movido);
    aplicar(lista);
  };

  const colunas: Array<ColunaItemOrdenavel<SubInstrucao>> = [
    {
      key: 'descricao',
      header: 'Descrição',
      render: (item, index) => (
        <Input
          placeholder="Descrição da sub-instrução..."
          type="text"
          value={item.descricao}
          onChange={(e) => atualizar(index, 'descricao', e.target.value)}
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
          onChange={(e) => atualizar(index, 'obrigatoria', e.target.checked)}
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
          onChange={(e) => atualizar(index, 'tempo_estimado', Number(e.target.value))}
          disabled={disabled}
          className="h-8 w-20 mx-auto text-center"
          placeholder="0"
        />
      )
    }
  ];

  const tempoTotal = subInstrucoes.reduce((acc, item) => acc + (Number(item.tempo_estimado) || 0), 0);

  // Sem título próprio: o BaseModal ja renderiza o cabecalho do grupo.
  return (
    <ItensOrdenaveisTable
      itens={subInstrucoes}
      colunas={colunas}
      onReordenar={reordenar}
      onRemover={remover}
      onAdicionar={adicionar}
      textoAdicionar="Adicionar"
      vazioTexto="Nenhuma sub-instrução adicionada"
      vazioIcone={<ClipboardList className="h-8 w-8" />}
      disabled={disabled}
      resumo={[
        { icone: <ClipboardList className="h-3.5 w-3.5" />, label: 'Total de etapas', valor: subInstrucoes.length },
        {
          icone: <CheckCircle2 className="h-3.5 w-3.5" />,
          label: 'Etapas obrigatórias',
          valor: subInstrucoes.filter((item) => item.obrigatoria).length
        },
        { icone: <Clock className="h-3.5 w-3.5" />, label: 'Tempo estimado total', valor: formatarTempo(tempoTotal) }
      ]}
    />
  );
}
