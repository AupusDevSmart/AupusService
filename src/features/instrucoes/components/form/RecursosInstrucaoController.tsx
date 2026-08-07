// src/features/instrucoes/components/form/RecursosInstrucaoController.tsx
import React from 'react';
import { FormFieldProps } from '@/types/base';
import { Input } from '@/components/ui/input';
import { ItensOrdenaveisTable, type ColunaItemOrdenavel } from '@/components/common/ItensOrdenaveisTable';

interface Recurso {
  id?: string;
  tipo: 'PECA' | 'MATERIAL' | 'FERRAMENTA' | 'TECNICO' | 'VIATURA';
  descricao: string;
  quantidade?: string | number;
  unidade?: string;
  obrigatorio: boolean;
}

const tipoOptions = [
  { value: 'PECA', label: 'Peça' },
  { value: 'MATERIAL', label: 'Material' },
  { value: 'FERRAMENTA', label: 'Ferramenta' },
  { value: 'TECNICO', label: 'Técnico' },
  { value: 'VIATURA', label: 'Viatura' }
];

// Mesmo raio e borda do Input padrao (rounded-[0.25rem]) para o select nao
// destoar dos outros campos da linha.
const selectClassName =
  'h-8 w-full rounded-[0.25rem] border border-input bg-transparent px-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

export function RecursosInstrucaoController({ value, onChange, disabled }: FormFieldProps) {
  const [recursos, setRecursos] = React.useState<Recurso[]>(
    Array.isArray(value) ? value : []
  );

  React.useEffect(() => {
    if (Array.isArray(value)) {
      setRecursos(value);
    }
  }, [value]);

  const aplicar = (lista: Recurso[]) => {
    setRecursos(lista);
    onChange(lista);
  };

  const adicionar = () => {
    aplicar([
      ...recursos,
      { tipo: 'MATERIAL', descricao: '', quantidade: '1', unidade: '', obrigatorio: false }
    ]);
  };

  const remover = (index: number) => {
    aplicar(recursos.filter((_, i) => i !== index));
  };

  const atualizar = (index: number, campo: keyof Recurso, valor: unknown) => {
    aplicar(recursos.map((item, i) => (i === index ? { ...item, [campo]: valor } : item)));
  };

  const reordenar = (origem: number, destino: number) => {
    const lista = [...recursos];
    const [movido] = lista.splice(origem, 1);
    lista.splice(destino, 0, movido);
    aplicar(lista);
  };

  const colunas: Array<ColunaItemOrdenavel<Recurso>> = [
    {
      key: 'tipo',
      header: 'Tipo',
      width: 'w-32',
      render: (item, index) => (
        <select
          value={item.tipo}
          onChange={(e) => atualizar(index, 'tipo', e.target.value)}
          disabled={disabled}
          className={selectClassName}
        >
          {tipoOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )
    },
    {
      key: 'descricao',
      header: 'Descrição',
      render: (item, index) => (
        <Input
          placeholder="Descrição do recurso..."
          type="text"
          value={item.descricao}
          onChange={(e) => atualizar(index, 'descricao', e.target.value)}
          disabled={disabled}
          className="h-8"
        />
      )
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
          value={item.quantidade || ''}
          onChange={(e) => atualizar(index, 'quantidade', e.target.value)}
          disabled={disabled}
          className="h-8 w-16 mx-auto text-center"
        />
      )
    },
    {
      key: 'unidade',
      header: 'Unidade',
      width: 'w-24',
      align: 'center',
      render: (item, index) => (
        <Input
          placeholder="un"
          type="text"
          value={item.unidade || ''}
          onChange={(e) => atualizar(index, 'unidade', e.target.value)}
          disabled={disabled}
          className="h-8 w-20 mx-auto text-center"
        />
      )
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
      )
    }
  ];

  // Titulo proprio: assim ele e o botao de adicionar ficam na mesma linha.
  return (
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
  );
}
