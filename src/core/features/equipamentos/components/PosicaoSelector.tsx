import { useState } from 'react';
import { Plus, AlertTriangle } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Combobox } from '@/core/components/ui/combobox';
import { Popover, PopoverContent, PopoverTrigger } from '@/core/components/ui/popover';
import { useAtivosFuncionais, type AtivoFuncional } from '../hooks/useAtivosFuncionais';

interface Props {
  unidadeId?: string | null;
  /** Id da posicao escolhida. */
  value?: string;
  onChange: (posicao: AtivoFuncional | null) => void;
  categorias: Array<{ id: string; nome: string }>;
  readOnly?: boolean;
  /** Id do equipamento sendo editado, para nao acusar ocupacao por ele mesmo. */
  equipamentoAtualId?: string;
}

/**
 * Escolha da POSICAO onde o equipamento vai.
 *
 * Vem antes do equipamento no sheet porque e a ordem em que a pessoa pensa:
 * primeiro onde, depois o que. E e a posicao que define categoria e
 * localizacao — o equipamento so traz modelo, serie e fabricante.
 *
 * A ocupacao chega junto da lista, entao o aviso aparece no momento da escolha e
 * nao como erro depois do submit, que e quando o formulario ja foi preenchido
 * inteiro.
 */
export function PosicaoSelector({
  unidadeId, value, onChange, categorias, readOnly, equipamentoAtualId,
}: Props) {
  const { ativos, loading, criar } = useAtivosFuncionais(unidadeId);
  const [abrirNova, setAbrirNova] = useState(false);
  const [nome, setNome] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [localizacao, setLocalizacao] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const escolhida = ativos.find(a => a.id?.trim() === value?.trim()) ?? null;

  // Ocupada por OUTRO equipamento. Sem esta checagem, editar o equipamento que
  // ja esta na posicao acusaria conflito com ele mesmo.
  const ocupadaPorOutro =
    !!escolhida?.ocupada &&
    escolhida.equipamento_ativo?.id?.trim() !== equipamentoAtualId?.trim();

  const salvarNova = async () => {
    if (!nome.trim()) { setErro('Nome da posicao e obrigatorio'); return; }
    if (!categoriaId) { setErro('Categoria e obrigatoria'); return; }
    if (!unidadeId) { setErro('Escolha a instalacao antes'); return; }

    setSalvando(true);
    setErro(null);
    try {
      const criada = await criar({
        nome: nome.trim(),
        categoria_id: categoriaId,
        unidade_id: unidadeId,
        localizacao: localizacao.trim() || undefined,
      });
      onChange(criada);
      setAbrirNova(false);
      setNome(''); setCategoriaId(''); setLocalizacao('');
    } catch (e: any) {
      // A instalacao nao aceita dois nomes iguais — o banco recusa, e a mensagem
      // precisa dizer isso, nao "erro ao salvar".
      const msg = e?.response?.data?.message ?? '';
      setErro(/unique|duplicad/i.test(String(msg))
        ? 'Ja existe uma posicao com este nome nesta instalacao'
        : (msg || 'Nao foi possivel criar a posicao'));
    } finally {
      setSalvando(false);
    }
  };

  // Sem instalacao o campo continua VISIVEL, so que inerte com a explicacao.
  // Sumir com ele esconde do usuario que a posicao existe e e obrigatoria — ele
  // preenche o resto e so descobre no submit.
  if (!unidadeId) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Posição <span className="text-red-500">*</span>
        </label>
        <p className="text-sm text-muted-foreground">
          Escolha a planta e a instalação para ver as posições.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        <label className="text-sm font-medium">
          Posição <span className="text-red-500">*</span>
        </label>
        {!readOnly && (
          <Popover open={abrirNova} onOpenChange={setAbrirNova}>
            <PopoverTrigger asChild>
              <Button
                type="button" variant="ghost" size="icon"
                className="h-6 w-6 -my-0.5 shrink-0"
                title="Nova posição" aria-label="Nova posição"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Nova posição</h4>
                <input
                  className="w-full h-9 px-3 rounded-md border bg-background text-sm"
                  placeholder="Nome — ex.: Inversor 1"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                />
                <Combobox
                  options={categorias.map(c => ({ value: c.id?.trim() || '', label: c.nome }))}
                  value={categoriaId}
                  onValueChange={setCategoriaId}
                  placeholder="Categoria"
                  searchPlaceholder="Buscar categoria..."
                  emptyText="Nenhuma categoria encontrada."
                />
                <input
                  className="w-full h-9 px-3 rounded-md border bg-background text-sm"
                  placeholder="Localização (opcional)"
                  value={localizacao}
                  onChange={e => setLocalizacao(e.target.value)}
                />
                {erro && <p className="text-xs text-destructive">{erro}</p>}
                <Button
                  type="button" size="sm" className="w-full"
                  onClick={salvarNova} disabled={salvando}
                >
                  {salvando ? 'Criando...' : 'Criar posição'}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      <Combobox
        options={ativos.map(a => ({ value: a.id?.trim() || '', label: a.nome }))}
        value={(value || '').trim()}
        onValueChange={(id) => onChange(ativos.find(a => a.id?.trim() === id?.trim()) ?? null)}
        placeholder={loading ? 'Carregando...' : 'Selecione a posição'}
        searchPlaceholder="Buscar posição..."
        emptyText="Nenhuma posição nesta instalação."
        disabled={readOnly || loading}
      />

      {escolhida && (
        <div className="text-xs text-muted-foreground space-y-0.5">
          <p>Categoria: {escolhida.categoria?.nome ?? '—'}</p>
          {escolhida.localizacao && <p>Localização: {escolhida.localizacao}</p>}
        </div>
      )}

      {ocupadaPorOutro && (
        <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-2.5">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-medium text-foreground">Esta posição já tem equipamento ativo</p>
            <p className="text-muted-foreground">
              {escolhida?.equipamento_ativo?.nome}
              {escolhida?.equipamento_ativo?.numero_serie
                ? ` — série ${escolhida.equipamento_ativo.numero_serie}` : ''}.
              {' '}Remova o atual antes de instalar outro.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
