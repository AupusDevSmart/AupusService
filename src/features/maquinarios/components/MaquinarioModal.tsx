// src/features/maquinarios/components/MaquinarioModal.tsx
import React, { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/core';
import { Save, X, Loader2, Construction } from 'lucide-react';
import { ROTULO_DA_ORIGEM, ROTULO_DA_RUBRICA, type RubricaDeCusto } from '@/services/recursos.services';
import {
  ROTULO_DA_BASE_DO_MAQUINARIO,
  ROTULO_DO_TIPO_DE_MAQUINARIO,
  maquinariosApi,
  type BaseDoMaquinario,
  type CreateMaquinarioApiData,
  type MaquinarioApiResponse,
  type TipoDeMaquinario,
} from '@/services/maquinarios.services';

interface MaquinarioModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  maquinario: MaquinarioApiResponse | null;
  salvando: boolean;
  onClose: () => void;
  onSubmit: (dados: CreateMaquinarioApiData, id?: string) => Promise<boolean>;
}

interface FormMaquinario {
  nome: string;
  tipo: TipoDeMaquinario | '';
  descricao: string;
  base_calculo: BaseDoMaquinario;
  rubrica: RubricaDeCusto | '';
  preco_unitario: string;
  horas_por_diaria: string;
  valor_aquisicao: string;
  prazo_retorno_meses: string;
  custos_anuais: string;
  meta_utilizacao_horas: string;
  ativo: boolean;
}

const VAZIO: FormMaquinario = {
  nome: '',
  tipo: '',
  descricao: '',
  base_calculo: 'diaria',
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

const ROTULO_DO_PRECO: Record<BaseDoMaquinario, string> = {
  diaria: 'Preço por diária (R$)',
  hora: 'Preço por hora (R$)',
  km: 'Preço por km (R$)',
  fechado: 'Valor fechado (R$)',
};

const moeda = (n: number | null | undefined) =>
  n === null || n === undefined ? '—' : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/**
 * Cadastro de maquinário (SN-84), com os campos do AupusProject: a máquina que
 * uma instrução usa. A própria pode ter o custo pela amortização (como o
 * instrumento); a locação, pelo preço da locação.
 */
export function MaquinarioModal({ isOpen, mode, maquinario, salvando, onClose, onSubmit }: MaquinarioModalProps) {
  const [form, setForm] = useState<FormMaquinario>(VAZIO);
  const [erro, setErro] = useState<string | null>(null);

  const { data: catalogo } = useQuery({
    queryKey: ['maquinarios', 'catalogo'],
    queryFn: () => maquinariosApi.catalogo(),
    staleTime: Infinity,
    enabled: isOpen,
  });

  // Semeia durante o render, não num efeito: com efeito o sheet pintava um quadro com o registro anterior
  const chaveAbertura = isOpen ? `${mode}::${maquinario?.id?.trim() || 'novo'}` : null;
  const chaveSemeadaRef = useRef<string | null>(null);
  if (chaveSemeadaRef.current !== chaveAbertura) {
    chaveSemeadaRef.current = chaveAbertura;
    setErro(null);
    setForm(
      maquinario && mode === 'edit'
        ? {
            nome: maquinario.nome,
            tipo: maquinario.tipo,
            descricao: maquinario.descricao || '',
            base_calculo: maquinario.base_calculo,
            rubrica: maquinario.rubrica,
            preco_unitario: texto(maquinario.preco_unitario),
            horas_por_diaria: texto(maquinario.horas_por_diaria ?? 8),
            valor_aquisicao: texto(maquinario.valor_aquisicao),
            prazo_retorno_meses: texto(maquinario.prazo_retorno_meses),
            custos_anuais: Number(maquinario.custos_anuais) ? texto(maquinario.custos_anuais) : '',
            meta_utilizacao_horas: texto(maquinario.meta_utilizacao_horas),
            ativo: maquinario.ativo,
          }
        : VAZIO,
    );
  }

  const alterar = <C extends keyof FormMaquinario>(campo: C, valor: FormMaquinario[C]) => {
    setForm((atual) => ({ ...atual, [campo]: valor }));
    setErro(null);
  };

  /** Trocar o tipo leva a rubrica para o padrão dele (a locação é terceirizada) */
  const trocarTipo = (tipo: TipoDeMaquinario) =>
    setForm((atual) => ({ ...atual, tipo, rubrica: catalogo?.rubrica_padrao[tipo] ?? atual.rubrica }));

  /** "1.234,56" (com vírgula, o ponto é de milhar) ou "12.5"; vazio = sem valor; undefined quando não é número */
  const numero = (valor: string): number | null | undefined => {
    const t = (valor.includes(',') ? valor.replace(/\./g, '').replace(',', '.') : valor).trim();
    if (t === '') return null;
    const n = Number(t);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  };

  const salvar = async () => {
    if (!form.nome.trim()) return setErro('Nome é obrigatório');
    if (!form.tipo) return setErro('Escolha o tipo');
    const numeros = {
      preco_unitario: numero(form.preco_unitario),
      horas_por_diaria: numero(form.horas_por_diaria),
      valor_aquisicao: numero(form.valor_aquisicao),
      prazo_retorno_meses: numero(form.prazo_retorno_meses),
      custos_anuais: numero(form.custos_anuais),
      meta_utilizacao_horas: numero(form.meta_utilizacao_horas),
    };
    if (Object.values(numeros).some((v) => v === undefined)) return setErro('Há um número inválido no formulário');

    const proprio = form.tipo === 'proprio';
    const deuCerto = await onSubmit(
      {
        nome: form.nome.trim(),
        tipo: form.tipo,
        descricao: form.descricao.trim() || null,
        base_calculo: form.base_calculo,
        rubrica: form.rubrica || undefined,
        preco_unitario: numeros.preco_unitario,
        horas_por_diaria: numeros.horas_por_diaria ?? 8,
        // A amortização é da máquina própria: na locação vale o preço da locação
        valor_aquisicao: proprio ? numeros.valor_aquisicao : null,
        prazo_retorno_meses: proprio ? numeros.prazo_retorno_meses : null,
        custos_anuais: proprio ? numeros.custos_anuais : null,
        meta_utilizacao_horas: proprio ? numeros.meta_utilizacao_horas : null,
        ativo: form.ativo,
      },
      mode === 'edit' ? maquinario?.id : undefined,
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

  const entradaNumero = (chave: keyof FormMaquinario, placeholder = '0,00') => (
    <input
      className="input-minimal"
      value={form[chave] as string}
      onChange={(e) => alterar(chave, e.target.value as never)}
      placeholder={placeholder}
      inputMode="decimal"
    />
  );

  const bases = catalogo?.bases ?? (Object.keys(ROTULO_DA_BASE_DO_MAQUINARIO) as BaseDoMaquinario[]);
  const rubricas = catalogo?.rubricas ?? (Object.keys(ROTULO_DA_RUBRICA) as RubricaDeCusto[]);

  return (
    <Sheet open={isOpen} onOpenChange={(aberto) => !aberto && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-hidden flex flex-col gap-0 p-0">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Construction className="h-4 w-4" />
            {mode === 'edit' ? 'Editar Maquinário' : 'Novo Maquinário'}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {erro && (
            <div className="campo-estatico text-sm text-destructive border-destructive/40">
              <span className="truncate">{erro}</span>
            </div>
          )}

          {campo(
            'Nome',
            <input
              className="input-minimal"
              value={form.nome}
              onChange={(e) => alterar('nome', e.target.value)}
              placeholder="Ex: Betoneira 400 L, Munck 12 t"
              maxLength={200}
            />,
            true,
          )}

          <div className="grid-equal-cols-2 gap-x-2 gap-y-4">
            {campo(
              'Tipo',
              <Combobox
                options={Object.entries(ROTULO_DO_TIPO_DE_MAQUINARIO).map(([value, label]) => ({ value, label }))}
                value={form.tipo || undefined}
                onValueChange={(v) => v && trocarTipo(v as TipoDeMaquinario)}
                placeholder="Próprio ou locação"
                searchPlaceholder="Buscar..."
                emptyText="Nenhum."
              />,
              true,
            )}
            {campo(
              'Cobrança',
              <Combobox
                options={bases.map((b) => ({ value: b, label: ROTULO_DA_BASE_DO_MAQUINARIO[b] }))}
                value={form.base_calculo}
                onValueChange={(v) => v && alterar('base_calculo', v as BaseDoMaquinario)}
                placeholder="Como é cobrado"
                searchPlaceholder="Buscar..."
                emptyText="Nenhuma."
              />,
            )}
            {campo(
              'Rubrica',
              <Combobox
                options={rubricas.map((r) => ({ value: r, label: ROTULO_DA_RUBRICA[r] }))}
                value={form.rubrica || undefined}
                onValueChange={(v) => v && alterar('rubrica', v as RubricaDeCusto)}
                placeholder="Padrão do tipo"
                searchPlaceholder="Buscar rubrica..."
                emptyText="Nenhuma."
              />,
            )}
            {campo(ROTULO_DO_PRECO[form.base_calculo], entradaNumero('preco_unitario'))}
            {form.base_calculo === 'diaria' && campo('Horas por diária', entradaNumero('horas_por_diaria', '8'))}
          </div>

          {form.tipo === 'proprio' && (
            <div className="space-y-3 rounded border border-border p-3">
              <p className="text-xs font-medium text-foreground">Custo da máquina própria (amortização)</p>
              <div className="grid-equal-cols-2 gap-x-2 gap-y-4">
                {campo('Valor de aquisição (R$)', entradaNumero('valor_aquisicao'))}
                {campo('Prazo de retorno (meses)', entradaNumero('prazo_retorno_meses', '12'))}
                {campo('Custos anuais (R$)', entradaNumero('custos_anuais'))}
                {campo('Meta de utilização (h/ano)', entradaNumero('meta_utilizacao_horas', '0'))}
              </div>
              <p className="text-xs text-muted-foreground">
                Custo por hora = (aquisição ÷ anos de retorno + custos anuais) ÷ meta de utilização. Na cobrança por
                diária, ele vezes as horas por diária; sem ele, vale o preço digitado.
              </p>
            </div>
          )}

          {mode === 'edit' && maquinario && (
            <p className="text-xs text-muted-foreground">
              Custo apurado hoje: <span className="text-foreground">{moeda(maquinario.preco_base)}</span>
              {maquinario.custo_origem ? ` · ${ROTULO_DA_ORIGEM[maquinario.custo_origem]}` : ' · falta preço para apurar'}
              {maquinario.custo_hora != null && ` · ${moeda(maquinario.custo_hora)}/h de uso`}. Recalculado ao salvar.
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

          {mode === 'edit' && (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.ativo}
                onChange={(e) => alterar('ativo', e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <span>Ativo</span>
              <span className="text-xs text-muted-foreground">— inativo some das listas de escolha</span>
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
