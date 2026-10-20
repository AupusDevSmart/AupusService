// src/features/recursos/config/table-config.tsx
import type { TableColumn } from '@/types/base';
import { ROTULO_DA_BASE, rotuloCategoria, sufixoDaBase, type RecursoApiResponse } from '@/services/recursos.services';

/** Preço vazio é preço desconhecido — e a tabela precisa dizer isso, não somar zero. */
export const formatarPreco = (valor?: string | number | null) => {
  if (valor === null || valor === undefined || valor === '') return null;
  const numero = typeof valor === 'string' ? parseFloat(valor) : valor;
  if (Number.isNaN(numero)) return null;
  return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const recursosTableColumns: TableColumn<RecursoApiResponse>[] = [
  {
    key: 'categoria',
    label: 'Categoria',
    // Texto puro: a moldura não separava nada que a coluna já não separasse, e
    // numa lista inteira de pastilhas o olho perde o nome, que é o que se
    // procura.
    render: (recurso) => (
      <span className="text-sm text-foreground">{rotuloCategoria(recurso.categoria)}</span>
    ),
  },
  {
    key: 'nome',
    label: 'Nome',
    render: (recurso) => (
      <span className="text-sm text-foreground">{recurso.nome}</span>
    ),
  },
  {
    key: 'base_calculo',
    label: 'Cobrança',
    hideOnMobile: true,
    render: (recurso) => (
      <span className="text-sm text-muted-foreground">{ROTULO_DA_BASE[recurso.base_calculo] ?? '—'}</span>
    ),
  },
  {
    // O preço de uma unidade da cobrança, como a conta usa: no instrumento, pela amortização
    key: 'preco_base',
    label: 'Custo apurado',
    render: (recurso) => {
      const preco = formatarPreco(recurso.preco_base);

      if (!preco) {
        return <span className="text-sm text-muted-foreground">Sem preço</span>;
      }

      return (
        <span className="text-sm text-foreground">
          {preco}
          <span className="text-muted-foreground">{sufixoDaBase(recurso)}</span>
        </span>
      );
    },
  },
  {
    key: 'ativo',
    label: 'Situação',
    hideOnMobile: true,
    render: (recurso) => (
      <span className={`text-sm ${recurso.ativo ? 'text-foreground' : 'text-muted-foreground'}`}>
        {recurso.ativo ? 'Ativo' : 'Inativo'}
      </span>
    ),
  },
];
