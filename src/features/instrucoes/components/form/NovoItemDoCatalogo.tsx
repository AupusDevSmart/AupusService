// src/features/instrucoes/components/form/NovoItemDoCatalogo.tsx
import React from 'react';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatApiError } from '@/utils/api-error';
import { lerNumeroDigitado } from '@/utils/leitura';
import {
  CATEGORIAS_RECURSO,
  UNIDADES_RECURSO,
  recursosApi,
  type CategoriaRecurso,
  type RecursoApiResponse,
} from '@/services/recursos.services';
import {
  ROTULO_DO_TIPO_DE_MAQUINARIO,
  maquinariosApi,
  type MaquinarioApiResponse,
  type TipoDeMaquinario,
} from '@/services/maquinarios.services';

export type GrupoDaLinha = 'recursos' | 'maquinario' | 'materiais';

const classeDoSelect =
  'h-8 w-full rounded-[0.25rem] border border-input bg-transparent px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

const SEM_MATERIAL = CATEGORIAS_RECURSO.filter((c) => c.value !== 'MATERIAL');

const O_QUE: Record<GrupoDaLinha, string> = { recursos: 'recurso', maquinario: 'maquinário', materiais: 'material' };

interface Props {
  grupo: GrupoDaLinha;
  /** O item criado: a linha já o escolhe */
  onCriado: (item: RecursoApiResponse | MaquinarioApiResponse) => void;
}

/**
 * Cadastrar o item que falta sem sair da instrução (o caminho era abandonar o
 * sheet, ir no cadastro e voltar, perdendo o que estava preenchido). Popover, e
 * não modal: são três campos e a instrução já é um sheet. A cobrança e a rubrica
 * saem do padrão da categoria (ou do tipo, no maquinário); o resto se completa
 * no cadastro.
 */
export function NovoItemDoCatalogo({ grupo, onCriado }: Props) {
  const [aberto, setAberto] = React.useState(false);
  const [nome, setNome] = React.useState('');
  const [categoria, setCategoria] = React.useState<CategoriaRecurso>('MAO_DE_OBRA');
  const [unidade, setUnidade] = React.useState('un');
  const [tipo, setTipo] = React.useState<TipoDeMaquinario>('locacao');
  const [preco, setPreco] = React.useState('');
  const [salvando, setSalvando] = React.useState(false);

  const abrir = (sim: boolean) => {
    setAberto(sim);
    if (sim) {
      setNome('');
      setPreco('');
    }
  };

  const criar = async () => {
    const nomeLimpo = nome.trim();
    if (!nomeLimpo || salvando) return;
    // Vazio é "não sei quanto custa", não zero: o total da instrução diz que falta preço
    const lido = lerNumeroDigitado(preco);
    if (lido === undefined) {
      toast.error('Preço ilegível', { description: 'Use vírgula decimal, como 85,50.' });
      return;
    }

    setSalvando(true);
    try {
      const criado =
        grupo === 'maquinario'
          ? await maquinariosApi.criar({ nome: nomeLimpo, tipo, preco_unitario: lido })
          : await recursosApi.criar({
              categoria: grupo === 'materiais' ? 'MATERIAL' : categoria,
              nome: nomeLimpo,
              unidade: grupo === 'materiais' ? unidade : null,
              preco_unitario: lido,
            });
      onCriado(criado);
      setAberto(false);
      toast.success(`${grupo === 'maquinario' ? 'Maquinário' : 'Recurso'} "${criado.nome}" cadastrado`);
    } catch (erro) {
      // O popover fica aberto: nome repetido devolve 409 e a pessoa precisa do que digitou
      toast.error(`Erro ao cadastrar o ${O_QUE[grupo]}`, { description: formatApiError(erro) });
    } finally {
      setSalvando(false);
    }
  };

  const enter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      criar();
    }
  };

  return (
    <Popover open={aberto} onOpenChange={abrir}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0 dark:bg-black"
          title={`Cadastrar ${O_QUE[grupo]}`}
          aria-label={`Cadastrar ${O_QUE[grupo]}`}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-72" align="end">
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Novo {O_QUE[grupo]}</h4>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Nome</label>
            <Input autoFocus value={nome} onChange={(e) => setNome(e.target.value)} onKeyDown={enter} className="h-8" />
          </div>

          <div className="flex gap-2">
            {grupo === 'recursos' && (
              <div className="flex-1 space-y-1">
                <label className="text-xs text-muted-foreground">Categoria</label>
                <select value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaRecurso)} className={classeDoSelect}>
                  {SEM_MATERIAL.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {grupo === 'materiais' && (
              <div className="flex-1 space-y-1">
                <label className="text-xs text-muted-foreground">Unidade</label>
                <select value={unidade} onChange={(e) => setUnidade(e.target.value)} className={classeDoSelect}>
                  {UNIDADES_RECURSO.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {grupo === 'maquinario' && (
              <div className="flex-1 space-y-1">
                <label className="text-xs text-muted-foreground">Tipo</label>
                <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoDeMaquinario)} className={classeDoSelect}>
                  {Object.entries(ROTULO_DO_TIPO_DE_MAQUINARIO).map(([valor, rotulo]) => (
                    <option key={valor} value={valor}>
                      {rotulo}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex-1 space-y-1">
              <label className="text-xs text-muted-foreground">
                {grupo === 'maquinario' ? 'Preço da diária' : 'Preço unitário'}
              </label>
              <Input value={preco} onChange={(e) => setPreco(e.target.value)} onKeyDown={enter} placeholder="opcional" className="h-8" />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" className="h-8 text-xs dark:bg-black" onClick={() => setAberto(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button type="button" className="h-8 text-xs" onClick={criar} disabled={salvando || !nome.trim()}>
              {salvando ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                'Cadastrar'
              )}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
