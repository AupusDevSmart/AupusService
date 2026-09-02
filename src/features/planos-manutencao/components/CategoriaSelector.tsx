// src/features/planos-manutencao/components/CategoriaSelector.tsx
import React from 'react';
import { Combobox } from '@/core';
import { categoriasEquipamentosApi, type CategoriaEquipamento } from '@/services/tipos-equipamentos.services';

interface CategoriaSelectorProps {
  value?: string;
  onChange: (categoriaId: string) => void;
  disabled?: boolean;
  mode?: 'create' | 'edit' | 'view';
  /** Nome vindo do backend, usado no modo view enquanto a lista nao chega. */
  categoriaNome?: string;
}

/**
 * O plano e um template de categoria: vale para todo equipamento cujo modelo
 * pertence a ela. O vinculo com equipamento acontece depois, pelo sheet do
 * equipamento, e ali sim gera a copia.
 */
export function CategoriaSelector({
  value,
  onChange,
  disabled,
  mode = 'create',
  categoriaNome
}: CategoriaSelectorProps) {
  const [categorias, setCategorias] = React.useState<CategoriaEquipamento[]>([]);
  const [carregando, setCarregando] = React.useState(false);

  React.useEffect(() => {
    let ativo = true;
    setCarregando(true);
    categoriasEquipamentosApi
      .getAll()
      .then((lista) => {
        if (ativo) setCategorias(Array.isArray(lista) ? lista : []);
      })
      .catch((error) => {
        console.error('Erro ao carregar categorias de equipamento:', error);
        if (ativo) setCategorias([]);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, []);

  // IDs vem do banco como Char(26), com padding. Sem trim dos dois lados o
  // combobox nao casa o valor selecionado e renderiza vazio.
  const valorSelecionado = (value || '').trim();

  const options = React.useMemo(
    () =>
      categorias
        .filter((c) => c.id && c.nome)
        .map((c) => ({ value: c.id.trim(), label: c.nome })),
    [categorias],
  );

  if (mode === 'view') {
    const nome =
      categoriaNome ||
      options.find((o) => o.value === valorSelecionado)?.label ||
      'Categoria não informada';

    return (
      <div className="p-3 border rounded-md bg-muted/30">
        <div className="text-sm font-medium">{nome}</div>
      </div>
    );
  }

  return (
    <Combobox
      options={options}
      value={valorSelecionado || undefined}
      onValueChange={(val) => onChange((val || '').trim())}
      placeholder={carregando ? 'Carregando categorias...' : 'Selecione a categoria...'}
      searchPlaceholder="Buscar categoria..."
      emptyText="Nenhuma categoria encontrada"
      disabled={disabled || carregando}
    />
  );
}
