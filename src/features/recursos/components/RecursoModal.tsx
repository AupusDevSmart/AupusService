// src/features/recursos/components/RecursoModal.tsx
import React, { useRef, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Combobox } from '@aupus/shared-pages';
import { Save, X, Loader2, Package } from 'lucide-react';
import {
  CATEGORIAS_RECURSO,
  UNIDADES_RECURSO,
  unidadePadraoDaCategoria,
  type CategoriaRecurso,
  type CreateRecursoApiData,
  type RecursoApiResponse,
} from '@/services/recursos.services';

interface RecursoModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  recurso: RecursoApiResponse | null;
  salvando: boolean;
  onClose: () => void;
  onSubmit: (dados: CreateRecursoApiData, id?: string) => Promise<boolean>;
}

interface FormRecurso {
  categoria: CategoriaRecurso | '';
  nome: string;
  unidade: string;
  preco_medio: string;
  ativo: boolean;
}

const VAZIO: FormRecurso = {
  categoria: '',
  nome: '',
  unidade: '',
  preco_medio: '',
  ativo: true,
};

/**
 * Cadastro de recurso. Quatro campos e pronto — é o tipo de tela que se abre
 * dez vezes seguidas para cadastrar dez itens, e cada campo a mais custa dez
 * vezes.
 */
export function RecursoModal({
  isOpen,
  mode,
  recurso,
  salvando,
  onClose,
  onSubmit,
}: RecursoModalProps) {
  const [form, setForm] = useState<FormRecurso>(VAZIO);
  const [erro, setErro] = useState<string | null>(null);

  /**
   * Semeia durante o render, e não num efeito: com efeito, o sheet chega a
   * pintar um quadro com os dados do recurso anterior antes de corrigir.
   */
  const chaveAbertura = isOpen ? `${mode}::${recurso?.id?.trim() || 'novo'}` : null;
  const chaveSemeadaRef = useRef<string | null>(null);

  if (chaveSemeadaRef.current !== chaveAbertura) {
    chaveSemeadaRef.current = chaveAbertura;
    setErro(null);
    setForm(
      recurso && mode === 'edit'
        ? {
            categoria: recurso.categoria,
            nome: recurso.nome || '',
            unidade: recurso.unidade || '',
            preco_medio:
              recurso.preco_medio === null || recurso.preco_medio === undefined
                ? ''
                : String(recurso.preco_medio),
            ativo: recurso.ativo,
          }
        : VAZIO,
    );
  }

  const alterar = <C extends keyof FormRecurso>(campo: C, valor: FormRecurso[C]) => {
    setForm((atual) => ({ ...atual, [campo]: valor }));
    setErro(null);
  };

  /**
   * Escolher a categoria já sugere a unidade. Não sobrescreve o que foi
   * escolhido à mão: quem trocou a unidade de propósito fez uma escolha, e
   * mexer na categoria depois não é motivo para desfazê-la.
   */
  const trocarCategoria = (categoria: CategoriaRecurso) => {
    setErro(null);
    setForm((atual) => ({
      ...atual,
      categoria,
      unidade:
        !atual.unidade || atual.unidade === unidadePadraoDaCategoria(atual.categoria)
          ? unidadePadraoDaCategoria(categoria)
          : atual.unidade,
    }));
  };

  /**
   * Unidade fora da lista — vinda de cadastro antigo — entra como opção extra.
   * Sem isso ela sumiria do campo e uma edição de preço apagaria a unidade sem
   * ninguém pedir.
   */
  const opcoesDeUnidade = React.useMemo(() => {
    const base = UNIDADES_RECURSO.map((u) => ({ value: u.value, label: u.label }));
    const atual = form.unidade?.trim();

    if (atual && !base.some((u) => u.value === atual)) {
      return [...base, { value: atual, label: `${atual} (cadastro antigo)` }];
    }

    return base;
  }, [form.unidade]);

  const salvar = async () => {
    if (!form.categoria) {
      setErro('Escolha a categoria');
      return;
    }
    if (!form.nome.trim()) {
      setErro('Nome é obrigatório');
      return;
    }

    const precoTexto = form.preco_medio.replace(',', '.').trim();
    const preco = precoTexto === '' ? null : Number(precoTexto);

    if (preco !== null && (Number.isNaN(preco) || preco < 0)) {
      setErro('Preço inválido');
      return;
    }

    const deuCerto = await onSubmit(
      {
        categoria: form.categoria,
        nome: form.nome.trim(),
        unidade: form.unidade.trim() || null,
        preco_medio: preco,
        ativo: form.ativo,
      },
      mode === 'edit' ? recurso?.id : undefined,
    );

    if (deuCerto) onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={(aberto) => !aberto && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-hidden flex flex-col gap-0 p-0">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4" />
            {mode === 'edit' ? 'Editar Recurso' : 'Novo Recurso'}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {erro && (
            <div className="campo-estatico text-sm text-destructive border-destructive/40">
              <span className="truncate">{erro}</span>
            </div>
          )}

          <div className="space-y-2">
            <div className="linha-rotulo">
              <label className="text-sm font-medium">
                Categoria <span className="text-red-500">*</span>
              </label>
            </div>
            <Combobox
              options={CATEGORIAS_RECURSO.map((c) => ({ value: c.value, label: c.label }))}
              value={form.categoria || undefined}
              onValueChange={(valor) => valor && trocarCategoria(valor as CategoriaRecurso)}
              placeholder="Selecione a categoria"
              searchPlaceholder="Buscar categoria..."
              emptyText="Nenhuma categoria."
            />
          </div>

          <div className="space-y-2">
            <div className="linha-rotulo">
              <label className="text-sm font-medium">
                Nome <span className="text-red-500">*</span>
              </label>
            </div>
            <input
              className="input-minimal"
              value={form.nome}
              onChange={(e) => alterar('nome', e.target.value)}
              placeholder="Ex: Eletricista, Cabo 4mm, Multímetro"
              maxLength={200}
            />
          </div>

          <div className="grid-equal-cols-2 gap-x-2 gap-y-4">
            <div className="space-y-2">
              <div className="linha-rotulo">
                <label className="text-sm font-medium">Unidade</label>
              </div>
              <Combobox
                options={opcoesDeUnidade}
                value={form.unidade || undefined}
                onValueChange={(valor) => alterar('unidade', valor || '')}
                placeholder="Selecione a unidade"
                searchPlaceholder="Buscar unidade..."
                emptyText="Nenhuma unidade."
              />
            </div>

            <div className="space-y-2">
              <div className="linha-rotulo">
                <label className="text-sm font-medium">Custo médio (R$)</label>
              </div>
              <input
                className="input-minimal"
                value={form.preco_medio}
                onChange={(e) => alterar('preco_medio', e.target.value)}
                placeholder="0,00"
                inputMode="decimal"
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            O custo é por unidade — um técnico a R$ 85,00 por hora, um cabo a R$ 12,00 por
            metro. Deixar em branco significa preço desconhecido, e o item aparece como
            pendência no orçamento em vez de entrar como se fosse de graça.
          </p>

          {mode === 'edit' && (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.ativo}
                onChange={(e) => alterar('ativo', e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <span>Ativo</span>
              <span className="text-xs text-muted-foreground">
                — inativo some das listas de escolha, mas as instruções que já o usam continuam
              </span>
            </label>
          )}
        </div>

        <div className="border-t px-6 py-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={salvando}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <button type="button" onClick={salvar} disabled={salvando} className="btn-minimal-primary h-9">
            {salvando ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {mode === 'edit' ? 'Salvar' : 'Cadastrar'}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
