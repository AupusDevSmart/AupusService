// src/features/instrucoes/components/form/SubInstrucoesController.tsx
import React from 'react';
import { FormFieldProps } from '@/types/base';
import { Input } from '@/components/ui/input';
import { Clock } from 'lucide-react';
import { ItensOrdenaveisTable, type ColunaItemOrdenavel } from '@/components/common/ItensOrdenaveisTable';
import { formatarHoras } from '@/utils/horas';
import type { TipoDePasso } from '@/services/instrucoes.services';
import { CampoDeNumero } from '@/components/common/CampoDeNumero';

interface SubInstrucao {
  id?: string;
  descricao: string;
  obrigatoria: boolean;
  tempo_estimado?: number;
  /** SN-58: a leitura pede o valor medido na OS, com unidade e faixa */
  tipo?: TipoDePasso;
  /** SN-59: o item da OS só é marcado com uma foto dele */
  exige_foto?: boolean;
  unidade?: string | null;
  valor_minimo?: number | null;
  valor_maximo?: number | null;
}

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
    aplicar([...subInstrucoes, { descricao: '', obrigatoria: false, tempo_estimado: 0 }]);
  };

  const remover = (index: number) => {
    aplicar(subInstrucoes.filter((_, i) => i !== index));
  };

  const atualizar = (index: number, campo: keyof SubInstrucao, valor: unknown) => {
    aplicar(subInstrucoes.map((item, i) => (i === index ? { ...item, [campo]: valor } : item)));
  };

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
            placeholder="Descrição da sub-instrução..."
            type="text"
            value={item.descricao}
            onChange={(e) => atualizar(index, 'descricao', e.target.value)}
            disabled={disabled}
            className="h-8"
          />
          {item.tipo === 'LEITURA' && (
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
                onChange={(v) => atualizar(index, 'valor_minimo', v)}
                disabled={disabled}
                avisoCurto
                className={CAMPO_DA_FAIXA}
              />
              <span className="pt-1.5">a</span>
              <CampoDeNumero
                aria-label="Máximo aceitável"
                placeholder="máx."
                value={item.valor_maximo ?? null}
                onChange={(v) => atualizar(index, 'valor_maximo', v)}
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
    },
    {
      key: 'tipo',
      header: 'Leitura',
      width: 'w-16',
      align: 'center',
      render: (item, index) => (
        <input
          type="checkbox"
          checked={item.tipo === 'LEITURA'}
          onChange={(e) => atualizar(index, 'tipo', e.target.checked ? 'LEITURA' : 'VERIFICACAO')}
          disabled={disabled}
          className="accent-foreground"
          aria-label="Passo de leitura (a equipe digita o valor medido)"
          title="Leitura: a equipe digita o valor medido, com unidade e faixa"
        />
      )
    },
    {
      key: 'obrigatoria',
      header: 'Obrigatória',
      width: 'w-24',
      align: 'center',
      render: (item, index) => (
        <input
          type="checkbox"
          checked={item.obrigatoria}
          onChange={(e) => atualizar(index, 'obrigatoria', e.target.checked)}
          disabled={disabled}
          className="accent-foreground"
          title="Obrigatória"
        />
      )
    },
    {
      key: 'tempo_estimado',
      header: 'Tempo (h)',
      width: 'w-28',
      align: 'center',
      // A coluna do banco continua em MINUTOS (Int) — so a tela trabalha em
      // horas. Converter aqui evita migracao e mantem compativel o que o
      // gerarChecklistPadrao ja le de sub_instrucoes.tempo_estimado.
      render: (item, index) => (
        <Input
          type="number"
          min={0}
          step={0.25}
          value={item.tempo_estimado ? item.tempo_estimado / 60 : ''}
          onChange={(e) => {
            const horas = Number(e.target.value);
            atualizar(index, 'tempo_estimado', horas > 0 ? Math.round(horas * 60) : 0);
          }}
          disabled={disabled}
          className="h-8 w-16 mx-auto text-center"
          placeholder="0"
        />
      )
    }
  ];

  /**
   * Quanto a instrução dura por completo: a soma das etapas.
   *
   * O banco guarda minutos; a tela trabalha em horas. Somo em minutos e
   * converto uma vez só no fim — dividir cada etapa por 60 antes de somar
   * acumularia erro de arredondamento a cada linha.
   */
  const totalMinutos = subInstrucoes.reduce(
    (soma, item) => soma + (Number(item.tempo_estimado) || 0),
    0,
  );
  const totalHoras = totalMinutos / 60;

  // Titulo proprio: assim ele e o botao de adicionar ficam na mesma linha.
  return (
    <ItensOrdenaveisTable
      itens={subInstrucoes}
      colunas={colunas}
      onReordenar={reordenar}
      onRemover={remover}
      onAdicionar={adicionar}
      textoAdicionar="Adicionar sub-instrução"
      titulo="Sub-instruções"
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
