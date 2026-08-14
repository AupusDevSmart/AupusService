// src/features/recursos/config/table-config.tsx
import type { TableColumn } from '@/types/base';
import { rotuloCategoria, type RecursoApiResponse } from '@/services/recursos.services';

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
    key: 'unidade',
    label: 'Unidade',
    hideOnMobile: true,
    render: (recurso) => (
      <span className="text-sm text-muted-foreground">{recurso.unidade || '—'}</span>
    ),
  },
  {
    key: 'preco_medio',
    label: 'Custo médio',
    render: (recurso) => {
      const preco = formatarPreco(recurso.preco_medio);

      if (!preco) {
        return <span className="text-sm text-muted-foreground">Sem preço</span>;
      }

      return (
        <span className="text-sm text-foreground">
          {preco}
          {recurso.unidade && (
            <span className="text-muted-foreground"> / {recurso.unidade}</span>
          )}
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
