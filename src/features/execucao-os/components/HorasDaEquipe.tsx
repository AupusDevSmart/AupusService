// src/features/execucao-os/components/HorasDaEquipe.tsx
import { useId, type Dispatch, type SetStateAction } from 'react';
import { Button } from '@/components/ui/button';
import { CampoDeNumero } from '@/components/common/CampoDeNumero';
import { Combobox } from '@/core/components/ui/combobox';
import { opcoesDePessoas } from '@/features/programacao-os/utils/pessoas';
import { duracaoLegivel, formatarHoras, lerHorasDigitadas } from '@/utils/horas';
import { usePessoasDaOS } from '@/features/execucao-os/hooks/usePessoasDaOS';
import { JORNADA_MAXIMA_MIN, linhaExtra, passaDoTempo, totalDasHoras, type LinhaDeHoras } from '@/features/execucao-os/utils/horas-da-equipe';

interface HorasDaEquipeProps {
  osId?: string;
  linhas: LinhaDeHoras[];
  onChange: Dispatch<SetStateAction<LinhaDeHoras[]>>;
  tempoEfetivoMinutos?: number | null;
  hhEstimado?: number;
}

const mostrarHoras = (valor: number | null) => (valor === null ? '' : formatarHoras(valor));

/**
 * As horas trabalhadas no painel do Executar (SN-61): uma linha por pessoa da
 * equipe, começando no tempo efetivo da OS, e quem entrou na hora escolhido
 * entre as pessoas que podem atuar na planta.
 */
export function HorasDaEquipe({ osId, linhas, onChange, tempoEfetivoMinutos, hhEstimado }: HorasDaEquipeProps) {
  const idBase = useId();
  const { data: pessoas, isError } = usePessoasDaOS(osId);
  const naTela = new Set(linhas.map((l) => l.tecnicoId).filter(Boolean));
  const opcoes = opcoesDePessoas(pessoas).filter((o) => !naTela.has(o.value));
  const tempo = duracaoLegivel(tempoEfetivoMinutos);

  const mudarLinha = (chave: string, mudanca: Partial<LinhaDeHoras>) =>
    onChange((atuais) => atuais.map((l) => (l.chave === chave ? { ...l, ...mudanca } : l)));
  const acrescentar = (tecnicoId: string) => {
    const nome = opcoes.find((o) => o.value === tecnicoId)?.label;
    if (nome) onChange((atuais) => [...atuais, linhaExtra(tecnicoId, nome, tempoEfetivoMinutos)]);
  };
  const tirar = (chave: string) => onChange((atuais) => atuais.filter((l) => l.chave !== chave));

  return (
    <div className="space-y-3 rounded-md border p-3">
      <div>
        <p className="text-sm font-medium">Horas trabalhadas</p>
        <p className="text-xs text-muted-foreground">
          {tempo ? `Tempo efetivo da OS: ${tempo}, sem as pausas. ` : ''}
          {(tempoEfetivoMinutos ?? 0) > JORNADA_MAXIMA_MIN
            ? 'A OS ficou aberta mais que uma jornada: informe as horas de cada um, e 0 para quem não foi.'
            : 'Ajuste quem saiu antes, e 0 para quem não foi.'}
        </p>
        {/* Reexecutar: sem isto, as horas antigas iam de novo e o trabalho depois da reabertura sumia */}
        {linhas.some((l) => l.registradaAntes) && (
          <p className="text-xs text-muted-foreground">
            As horas marcadas "registradas antes" são da execução anterior: some o que cada um trabalhou depois da reabertura.
          </p>
        )}
      </div>

      {linhas.length === 0 && <p className="text-xs text-muted-foreground">Ninguém escalado. Se alguém trabalhou, registre abaixo.</p>}

      {linhas.map((linha) => (
        <div key={linha.chave} className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <label htmlFor={`${idBase}-${linha.chave}`} className="block truncate text-sm">
              {linha.nome}
            </label>
            {(linha.detalhe || linha.registradaAntes) && (
              <span className="block truncate text-xs text-muted-foreground">
                {[linha.detalhe, linha.registradaAntes && 'registradas antes'].filter(Boolean).join(' · ')}
              </span>
            )}
            {passaDoTempo(linha.horas, tempoEfetivoMinutos) && (
              <span className="block text-xs text-muted-foreground">Mais que o tempo efetivo da OS: confira.</span>
            )}
          </div>
          <CampoDeNumero
            id={`${idBase}-${linha.chave}`}
            value={linha.horas}
            onChange={(horas) => mudarLinha(linha.chave, { horas })}
            onIlegivel={(ilegivel) => mudarLinha(linha.chave, { ilegivel })}
            ler={lerHorasDigitadas}
            mostrar={mostrarHoras}
            aviso="Horas como 3h30, 45min ou 3,5"
            placeholder="ex.: 3h30"
            className="h-8 w-28 text-right"
          />
          {linha.extra && (
            <Button type="button" variant="ghost" size="sm" className="h-8" onClick={() => tirar(linha.chave)}>
              Tirar
            </Button>
          )}
        </div>
      ))}

      {isError ? (
        <p className="text-xs text-destructive">Não foi possível carregar as pessoas da planta para registrar quem entrou na hora.</p>
      ) : (
        opcoes.length > 0 && (
          <Combobox
            options={opcoes}
            value=""
            onValueChange={acrescentar}
            placeholder="Registrar quem trabalhou sem estar escalado"
            searchPlaceholder="Buscar pessoa..."
            emptyText="Ninguém com esse nome."
          />
        )
      )}

      {linhas.length > 0 && (
        <p className="text-right text-xs text-muted-foreground">
          Total: {totalDasHoras(linhas)}
          {hhEstimado ? ` de ${formatarHoras(hhEstimado)} previstas` : ''}
        </p>
      )}
    </div>
  );
}
