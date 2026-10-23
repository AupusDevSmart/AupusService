// src/features/instrucoes/components/form/SubInstrucoesController.tsx
import React from 'react';
import { FormFieldProps } from '@/types/base';
import { Input } from '@/components/ui/input';
import { Clock } from 'lucide-react';
import { ItensOrdenaveisTable, type ColunaItemOrdenavel } from '@/components/common/ItensOrdenaveisTable';
import { formatarHoras, horasNoCampo, lerHorasDigitadas } from '@/utils/horas';
import {
  ROTULO_DA_DISCIPLINA,
  type DisciplinaDoPasso,
  type RegistroDoPasso,
} from '@/services/instrucoes.services';
import { CampoDeNumero } from '@/components/common/CampoDeNumero';

/**
 * O passo da instrução: os campos do AupusProject (descrição, disciplina,
 * duração em horas, obrigatório, SN-85) e os que só o Service tem (a leitura
 * com unidade e faixa, SN-58, e a foto, SN-59).
 */
interface SubInstrucao {
  id?: string;
  descricao: string;
  obrigatoria: boolean;
  tipo?: DisciplinaDoPasso | null;
  duracao_horas?: number | null;
  registro?: RegistroDoPasso;
  exige_foto?: boolean;
  unidade?: string | null;
  valor_minimo?: number | null;
  valor_maximo?: number | null;
  /** Os campos com texto que não dá para ler (só na tela): o formulário não salva com eles */
  ilegiveis?: Record<string, boolean>;
}

/** Mesmo raio e borda do Input padrão para o select não destoar da linha */
const classeDoSelect =
  'h-8 w-full rounded-[0.25rem] border border-input bg-transparent px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

/** A linha cabe na coluna estreita do sheet */
const CAMPO_DA_FAIXA = 'h-7 w-16 px-2 text-xs';

const faixaInvertida = (s: SubInstrucao) =>
  s.valor_minimo != null && s.valor_maximo != null && s.valor_minimo > s.valor_maximo;

export function SubInstrucoesController({ value, onChange, disabled }: FormFieldProps) {
  const [subInstrucoes, setSubInstrucoes] = React.useState<SubInstrucao[]>(
    Array.isArray(value) ? value : []
  );

  React.useEffect(() => {
    if (Array.isArray(value)) {
      setSubInstrucoes(value);
    }
  }, [value]);

  const aplicar = (lista: SubInstrucao[]) => {
    setSubInstrucoes(lista);
    onChange(lista);
  };

  const adicionar = () => {
    aplicar([...subInstrucoes, { descricao: '', obrigatoria: false, tipo: null, duracao_horas: null }]);
  };

  const remover = (index: number) => {
    aplicar(subInstrucoes.filter((_, i) => i !== index));
  };

  const atualizar = (index: number, campo: keyof SubInstrucao, valor: unknown) => {
    aplicar(subInstrucoes.map((item, i) => (i === index ? { ...item, [campo]: valor } : item)));
  };

  /** Os props de um campo numérico do passo: o ilegível marca o passo e trava o salvar (como nas linhas) */
  const numerico = (index: number, campo: keyof SubInstrucao) => ({
    onChange: (v: number | null) =>
      aplicar(subInstrucoes.map((item, i) => (i === index ? { ...item, [campo]: v, ilegiveis: { ...item.ilegiveis, [campo]: false } } : item))),
    onIlegivel: (sim: boolean) => {
      if (Boolean(subInstrucoes[index].ilegiveis?.[campo]) === sim) return;
      aplicar(subInstrucoes.map((item, i) => (i === index ? { ...item, ilegiveis: { ...item.ilegiveis, [campo]: sim } } : item)));
    },
  });

  const reordenar = (origem: number, destino: number) => {
    const lista = [...subInstrucoes];
    const [movido] = lista.splice(origem, 1);
    lista.splice(destino, 0, movido);
    aplicar(lista);
  };

  const colunas: Array<ColunaItemOrdenavel<SubInstrucao>> = [
    {
      key: 'descricao',
      header: 'Descrição',
      render: (item, index) => (
        <div className="space-y-1.5">
          <Input
            placeholder="O que se faz neste passo..."
            type="text"
            value={item.descricao}
            onChange={(e) => atualizar(index, 'descricao', e.target.value)}
            disabled={disabled}
            className="h-8"
          />
          {item.registro === 'LEITURA' && (
            <div className="flex flex-wrap items-start gap-1 text-xs text-muted-foreground">
              <Input
                aria-label="Unidade da leitura"
                placeholder="unid."
                maxLength={20}
                value={item.unidade ?? ''}
                onChange={(e) => atualizar(index, 'unidade', e.target.value)}
                disabled={disabled}
                className="h-7 w-14 px-2 text-xs"
              />
              {/* Texto com vírgula, não type="number": "12,5" num navegador em inglês
                  voltava "" e a faixa salvava sem o limite, calada */}
              <CampoDeNumero
                aria-label="Mínimo aceitável"
                placeholder="mín."
                value={item.valor_minimo ?? null}
                {...numerico(index, 'valor_minimo')}
                disabled={disabled}
                avisoCurto
                className={CAMPO_DA_FAIXA}
              />
              <span className="pt-1.5">a</span>
              <CampoDeNumero
                aria-label="Máximo aceitável"
                placeholder="máx."
                value={item.valor_maximo ?? null}
                {...numerico(index, 'valor_maximo')}
                disabled={disabled}
                avisoCurto
                className={CAMPO_DA_FAIXA}
              />
              {faixaInvertida(item) && <span className="pt-1.5 text-destructive">o mínimo passa do máximo</span>}
            </div>
          )}
        </div>
      )
    },
    {
      // A disciplina de lá (SN-85): administrativo, civil, elétrico, mecânico
      key: 'tipo',
      header: 'Disciplina',
      width: 'w-32',
      render: (item, index) => (
        <select
          aria-label="Disciplina do passo"
          value={item.tipo ?? ''}
          onChange={(e) => atualizar(index, 'tipo', (e.target.value || null) as DisciplinaDoPasso | null)}
          disabled={disabled}
          className={classeDoSelect}
        >
          <option value="">—</option>
          {Object.entries(ROTULO_DA_DISCIPLINA).map(([valor, rotulo]) => (
            <option key={valor} value={valor}>
              {rotulo}
            </option>
          ))}
        </select>
      )
    },
    {
      // Em horas, como lá: "1h30", "45min" ou "1,5"
      key: 'duracao_horas',
      header: 'Duração',
      width: 'w-24',
      align: 'center',
      render: (item, index) => (
        <CampoDeNumero
          aria-label="Duração do passo"
          value={item.duracao_horas ?? null}
          {...numerico(index, 'duracao_horas')}
          ler={lerHorasDigitadas}
          mostrar={horasNoCampo}
          aviso="Horas como 1h30, 45min ou 1,5"
          avisoCurto
          placeholder="1h30"
          disabled={disabled}
          className="h-8 w-20 text-center"
        />
      )
    },
    {
      key: 'obrigatoria',
      header: 'Obrig.',
      width: 'w-14',
      align: 'center',
      render: (item, index) => (
        <input
          type="checkbox"
          checked={item.obrigatoria}
          onChange={(e) => atualizar(index, 'obrigatoria', e.target.checked)}
          disabled={disabled}
          className="accent-foreground"
          aria-label="Obrigatório: a tarefa não fecha sem este passo"
          title="Obrigatório: a tarefa não fecha sem este passo"
        />
      )
    },
    {
      key: 'registro',
      header: 'Leitura',
      width: 'w-14',
      align: 'center',
      render: (item, index) => (
        <input
          type="checkbox"
          checked={item.registro === 'LEITURA'}
          onChange={(e) => atualizar(index, 'registro', e.target.checked ? 'LEITURA' : 'VERIFICACAO')}
          disabled={disabled}
          className="accent-foreground"
          aria-label="Passo de leitura (a equipe digita o valor medido)"
          title="Leitura: a equipe digita o valor medido, com unidade e faixa"
        />
      )
    },
    {
      key: 'exige_foto',
      header: 'Foto',
      width: 'w-14',
      align: 'center',
      render: (item, index) => (
        <input
          type="checkbox"
          checked={Boolean(item.exige_foto)}
          onChange={(e) => atualizar(index, 'exige_foto', e.target.checked)}
          disabled={disabled}
          className="accent-foreground"
          aria-label="Exige foto (o item da OS só é marcado com uma foto dele)"
          title="Exige foto: na OS, o item só é marcado com uma foto dele"
        />
      )
    }
  ];

  /** Quanto a instrução leva: a soma dos passos (é o que a programação sugere de duração) */
  const totalHoras = subInstrucoes.reduce((soma, item) => soma + (Number(item.duracao_horas) || 0), 0);

  // Titulo proprio: assim ele e o botao de adicionar ficam na mesma linha.
  return (
    <ItensOrdenaveisTable
      itens={subInstrucoes}
      colunas={colunas}
      onReordenar={reordenar}
      onRemover={remover}
      onAdicionar={adicionar}
      textoAdicionar="Adicionar passo"
      titulo="Passos"
      resumo={[
        {
          icone: <Clock className="h-3.5 w-3.5" />,
          label: 'Duração total',
          valor: formatarHoras(totalHoras),
        },
      ]}
      disabled={disabled}
    />
  );
}
