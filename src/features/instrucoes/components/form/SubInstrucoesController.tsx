// src/features/instrucoes/components/form/SubInstrucoesController.tsx
import React from 'react';
import { FormFieldProps } from '@/types/base';
import { Input } from '@/components/ui/input';
import { Clock } from 'lucide-react';
import { ItensOrdenaveisTable, type ColunaItemOrdenavel } from '@/components/common/ItensOrdenaveisTable';
import { formatarHoras } from '@/utils/horas';

interface SubInstrucao {
  id?: string;
  descricao: string;
  obrigatoria: boolean;
  tempo_estimado?: number;
}

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
      header: 'Tempo (h)',
      width: 'w-28',
      align: 'center',
      // A coluna do banco continua em MINUTOS (Int) — so a tela trabalha em
      // horas. Converter aqui evita migracao e mantem compativel o que o
      // gerarChecklistPadrao ja le de sub_instrucoes.tempo_estimado.
      render: (item, index) => (
        <Input
          type="number"
          min={0}
          step={0.25}
          value={item.tempo_estimado ? item.tempo_estimado / 60 : ''}
          onChange={(e) => {
            const horas = Number(e.target.value);
            atualizar(index, 'tempo_estimado', horas > 0 ? Math.round(horas * 60) : 0);
          }}
          disabled={disabled}
          className="h-8 w-16 mx-auto text-center"
          placeholder="0"
        />
      )
    }
  ];

  /**
   * Quanto a instrução dura por completo: a soma das etapas.
   *
   * O banco guarda minutos; a tela trabalha em horas. Somo em minutos e
   * converto uma vez só no fim — dividir cada etapa por 60 antes de somar
   * acumularia erro de arredondamento a cada linha.
   */
  const totalMinutos = subInstrucoes.reduce(
    (soma, item) => soma + (Number(item.tempo_estimado) || 0),
    0,
  );
  const totalHoras = totalMinutos / 60;

  // Titulo proprio: assim ele e o botao de adicionar ficam na mesma linha.
  return (
    <ItensOrdenaveisTable
      itens={subInstrucoes}
      colunas={colunas}
      onReordenar={reordenar}
      onRemover={remover}
      onAdicionar={adicionar}
      textoAdicionar="Adicionar sub-instrução"
      titulo="Sub-instruções"
      resumo={[
        {
          icone: <Clock className="h-3.5 w-3.5" />,
          label: 'Duração total',
          valor: formatarHoras(totalHoras),
        },
      ]}
      disabled={disabled}
    />
  );
}
