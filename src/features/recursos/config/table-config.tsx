// src/features/recursos/config/table-config.tsx
import { Badge } from '@/components/ui/badge';
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
    render: (recurso) => (
      <Badge variant="outline" className="text-xs">
        {rotuloCategoria(recurso.categoria)}
      </Badge>
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
