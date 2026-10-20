// src/features/recursos/components/RecursoModal.tsx
import React, { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/core';
import { Save, X, Loader2, Package } from 'lucide-react';
import {
  CATEGORIAS_RECURSO,
  ROTULO_DA_BASE,
  ROTULO_DA_ORIGEM,
  ROTULO_DA_RUBRICA,
  UNIDADES_RECURSO,
  recursosApi,
  sufixoDaBase,
  type BaseDeCusto,
  type CategoriaRecurso,
  type CreateRecursoApiData,
  type RecursoApiResponse,
  type RubricaDeCusto,
} from '@/services/recursos.services';

interface RecursoModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  recurso: RecursoApiResponse | null;
  salvando: boolean;
  onClose: () => void;
  onSubmit: (dados: CreateRecursoApiData, id?: string) => Promise<boolean>;
}

/** Os números ficam em texto enquanto se digita: vazio é "sem valor", não zero */
interface FormRecurso {
  categoria: CategoriaRecurso | '';
  nome: string;
  funcao: string;
  descricao: string;
  unidade: string;
  base_calculo: BaseDeCusto | '';
  rubrica: RubricaDeCusto | '';
  preco_unitario: string;
  horas_por_diaria: string;
  valor_aquisicao: string;
  prazo_retorno_meses: string;
  custos_anuais: string;
  meta_utilizacao_horas: string;
  ativo: boolean;
}

const VAZIO: FormRecurso = {
  categoria: '',
  nome: '',
  funcao: '',
  descricao: '',
  unidade: '',
  base_calculo: '',
  rubrica: '',
  preco_unitario: '',
  horas_por_diaria: '8',
  valor_aquisicao: '',
  prazo_retorno_meses: '',
  custos_anuais: '',
  meta_utilizacao_horas: '',
  ativo: true,
};

const texto = (v: string | number | null | undefined) => (v === null || v === undefined ? '' : String(v));

/** O rótulo do preço na base escolhida: "Preço por hora", "Valor fechado" */
const ROTULO_DO_PRECO: Record<BaseDeCusto, string> = {
  hora: 'Preço por hora (R$)',
  diaria: 'Preço por diária (R$)',
  unidade: 'Preço por unidade (R$)',
  km: 'Preço por km (R$)',
  fechado: 'Valor fechado (R$)',
};

const formatarMoeda = (n: number | null | undefined) =>
  n === null || n === undefined ? '—' : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/**
 * Cadastro de recurso, com os campos do AupusProject (SN-83). Cada campo só
 * aparece na categoria a que pertence — função na mão de obra, unidade no
 * material, a aquisição no instrumento — e a API limpa o resto ao gravar. As
 * bases que a categoria aceita vêm do servidor (`/recursos/catalogo`): a tela
 * não oferece o que a API recusa.
 */
export function RecursoModal({ isOpen, mode, recurso, salvando, onClose, onSubmit }: RecursoModalProps) {
  const [form, setForm] = useState<FormRecurso>(VAZIO);
  const [erro, setErro] = useState<string | null>(null);

  const { data: catalogo } = useQuery({
    queryKey: ['recursos', 'catalogo'],
    queryFn: () => recursosApi.catalogo(),
    staleTime: Infinity,
    enabled: isOpen,
  });

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
            funcao: recurso.funcao || '',
            descricao: recurso.descricao || '',
            unidade: recurso.unidade || '',
            base_calculo: recurso.base_calculo,
            rubrica: recurso.rubrica,
            preco_unitario: texto(recurso.preco_unitario),
            horas_por_diaria: texto(recurso.horas_por_diaria ?? 8),
            valor_aquisicao: texto(recurso.valor_aquisicao),
            prazo_retorno_meses: texto(recurso.prazo_retorno_meses),
            custos_anuais: Number(recurso.custos_anuais) ? texto(recurso.custos_anuais) : '',
            meta_utilizacao_horas: texto(recurso.meta_utilizacao_horas),
            ativo: recurso.ativo,
          }
        : VAZIO,
    );
  }

  const alterar = <C extends keyof FormRecurso>(campo: C, valor: FormRecurso[C]) => {
    setForm((atual) => ({ ...atual, [campo]: valor }));
    setErro(null);
  };

  const basesDaCategoria: BaseDeCusto[] = form.categoria
    ? (catalogo?.bases_por_categoria[form.categoria] ?? recurso?.bases_disponiveis ?? [])
    : [];

  /** Trocar a categoria leva a base e a rubrica para o padrão dela (a escolha da outra não vale aqui) */
  const trocarCategoria = (categoria: CategoriaRecurso) => {
    setErro(null);
    setForm((atual) => {
      const bases = catalogo?.bases_por_categoria[categoria] ?? [];
      return {
        ...atual,
        categoria,
        base_calculo: bases.includes(atual.base_calculo as BaseDeCusto) ? atual.base_calculo : (bases[0] ?? ''),
        rubrica: catalogo?.rubrica_padrao[categoria] ?? atual.rubrica,
        unidade: categoria === 'MATERIAL' ? atual.unidade || 'un' : atual.unidade,
      };
    });
  };

  /** Unidade fora da lista (cadastro antigo) entra como opção extra: sem isso uma edição de preço a apagaria */
  const opcoesDeUnidade = React.useMemo(() => {
    const base = UNIDADES_RECURSO.map((u) => ({ value: u.value, label: u.label }));
    const atual = form.unidade?.trim();
    return atual && !base.some((u) => u.value === atual) ? [...base, { value: atual, label: `${atual} (cadastro antigo)` }] : base;
  }, [form.unidade]);

  /**
   * O número digitado: "1.234,56" (com vírgula, o ponto é de milhar) ou "12.5";
   * vazio = sem valor. Devolve undefined quando não é número.
   */
  const numero = (valor: string): number | null | undefined => {
    const t = (valor.includes(',') ? valor.replace(/\./g, '').replace(',', '.') : valor).trim();
    if (t === '') return null;
    const n = Number(t);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  };

  const ehInstrumento = form.categoria === 'INSTRUMENTO';
  const base = (form.base_calculo || basesDaCategoria[0]) as BaseDeCusto | undefined;

  const salvar = async () => {
    if (!form.categoria) return setErro('Escolha a categoria');
    if (!form.nome.trim()) return setErro('Nome é obrigatório');

    const numeros = {
      preco_unitario: numero(form.preco_unitario),
      horas_por_diaria: numero(form.horas_por_diaria),
      valor_aquisicao: numero(form.valor_aquisicao),
      prazo_retorno_meses: numero(form.prazo_retorno_meses),
      custos_anuais: numero(form.custos_anuais),
      meta_utilizacao_horas: numero(form.meta_utilizacao_horas),
    };
    const invalido = Object.entries(numeros).find(([, v]) => v === undefined);
    if (invalido) return setErro('Há um número inválido no formulário');

    const deuCerto = await onSubmit(
      {
        categoria: form.categoria,
        nome: form.nome.trim(),
        funcao: form.categoria === 'MAO_DE_OBRA' ? form.funcao.trim() || null : null,
        descricao: form.descricao.trim() || null,
        unidade: form.unidade.trim() || null,
        base_calculo: base,
        rubrica: form.rubrica || undefined,
        preco_unitario: numeros.preco_unitario,
        horas_por_diaria: numeros.horas_por_diaria ?? 8,
        valor_aquisicao: ehInstrumento ? numeros.valor_aquisicao : null,
        prazo_retorno_meses: ehInstrumento ? numeros.prazo_retorno_meses : null,
        custos_anuais: ehInstrumento ? numeros.custos_anuais : null,
        meta_utilizacao_horas: ehInstrumento ? numeros.meta_utilizacao_horas : null,
        ativo: form.ativo,
      },
      mode === 'edit' ? recurso?.id : undefined,
    );

    if (deuCerto) onClose();
  };

  const campo = (rotulo: string, filho: React.ReactNode, obrigatorio = false) => (
    <div className="space-y-2">
      <div className="linha-rotulo">
        <label className="text-sm font-medium">
          {rotulo} {obrigatorio && <span className="text-red-500">*</span>}
        </label>
      </div>
      {filho}
    </div>
  );

  const entradaNumero = (chave: keyof FormRecurso, placeholder = '0,00') => (
    <input
      className="input-minimal"
      value={form[chave] as string}
      onChange={(e) => alterar(chave, e.target.value as never)}
      placeholder={placeholder}
      inputMode="decimal"
    />
  );

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

          {campo(
            'Categoria',
            <Combobox
              options={CATEGORIAS_RECURSO.map((c) => ({ value: c.value, label: c.label }))}
              value={form.categoria || undefined}
              onValueChange={(valor) => valor && trocarCategoria(valor as CategoriaRecurso)}
              placeholder="Selecione a categoria"
              searchPlaceholder="Buscar categoria..."
              emptyText="Nenhuma categoria."
            />,
            true,
          )}

          {campo(
            'Nome',
            <input
              className="input-minimal"
              value={form.nome}
              onChange={(e) => alterar('nome', e.target.value)}
              placeholder="Ex: Técnico eletricista, Cabo 4mm, Megôhmetro"
              maxLength={200}
            />,
            true,
          )}

          {form.categoria === 'MAO_DE_OBRA' &&
            campo(
              'Função',
              <input
                className="input-minimal"
                value={form.funcao}
                onChange={(e) => alterar('funcao', e.target.value)}
                placeholder="Ex: Eletricista"
                maxLength={255}
              />,
            )}

          <div className="grid-equal-cols-2 gap-x-2 gap-y-4">
            {/* Onde a categoria aceita uma base só, o campo nem aparece (como no AupusProject) */}
            {basesDaCategoria.length > 1 &&
              campo(
                'Cobrança',
                <Combobox
                  options={basesDaCategoria.map((b) => ({ value: b, label: ROTULO_DA_BASE[b] }))}
                  value={form.base_calculo || undefined}
                  onValueChange={(v) => v && alterar('base_calculo', v as BaseDeCusto)}
                  placeholder="Como é cobrado"
                  searchPlaceholder="Buscar..."
                  emptyText="Nenhuma."
                />,
              )}

            {campo(
              'Rubrica',
              <Combobox
                options={(catalogo?.rubricas ?? (Object.keys(ROTULO_DA_RUBRICA) as RubricaDeCusto[])).map((r) => ({ value: r, label: ROTULO_DA_RUBRICA[r] }))}
                value={form.rubrica || undefined}
                onValueChange={(v) => v && alterar('rubrica', v as RubricaDeCusto)}
                placeholder="Padrão da categoria"
                searchPlaceholder="Buscar rubrica..."
                emptyText="Nenhuma."
              />,
            )}

            {campo(base ? ROTULO_DO_PRECO[base] : 'Preço (R$)', entradaNumero('preco_unitario'))}

            {form.categoria === 'MATERIAL' &&
              campo(
                'Unidade',
                <Combobox
                  options={opcoesDeUnidade}
                  value={form.unidade || undefined}
                  onValueChange={(valor) => alterar('unidade', valor || '')}
                  placeholder="Selecione a unidade"
                  searchPlaceholder="Buscar unidade..."
                  emptyText="Nenhuma unidade."
                />,
              )}

            {base === 'diaria' && campo('Horas por diária', entradaNumero('horas_por_diaria', '8'))}
          </div>

          {ehInstrumento && (
            <div className="space-y-3 rounded border border-border p-3">
              <p className="text-xs font-medium text-foreground">Custo do item próprio (amortização)</p>
              <div className="grid-equal-cols-2 gap-x-2 gap-y-4">
                {campo('Valor de aquisição (R$)', entradaNumero('valor_aquisicao'))}
                {campo('Prazo de retorno (meses)', entradaNumero('prazo_retorno_meses', '12'))}
                {campo('Custos anuais (R$)', entradaNumero('custos_anuais'))}
                {campo('Meta de utilização (h/ano)', entradaNumero('meta_utilizacao_horas', '0'))}
              </div>
              <p className="text-xs text-muted-foreground">
                Custo por hora = (aquisição ÷ anos de retorno + custos anuais) ÷ meta de utilização. Com ele, a diária
                sai da amortização vezes as horas por diária; sem ele, vale o preço digitado.
              </p>
            </div>
          )}

          {mode === 'edit' && recurso && (
            <p className="text-xs text-muted-foreground">
              Custo apurado hoje: <span className="text-foreground">{formatarMoeda(recurso.preco_base)}{sufixoDaBase(recurso)}</span>
              {recurso.custo_origem ? ` · ${ROTULO_DA_ORIGEM[recurso.custo_origem]}` : ' · falta preço para apurar'}
              {recurso.custo_hora != null && ` · ${formatarMoeda(recurso.custo_hora)}/h de uso`}. Recalculado ao salvar.
            </p>
          )}

          {campo(
            'Descrição',
            <textarea
              className="input-minimal min-h-[64px]"
              value={form.descricao}
              onChange={(e) => alterar('descricao', e.target.value)}
              placeholder="Observação livre"
              maxLength={5000}
            />,
          )}

          <p className="text-xs text-muted-foreground">
            Preço em branco é preço desconhecido: o item aparece como pendência no orçamento em vez de entrar como se
            fosse de graça.
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
            {salvando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {mode === 'edit' ? 'Salvar' : 'Cadastrar'}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
