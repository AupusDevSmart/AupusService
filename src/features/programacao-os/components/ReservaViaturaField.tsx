// src/features/programacao-os/components/ReservaViaturaField.tsx
import { useEffect, useRef, useState } from 'react';
import { Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AssistentePassos, type PassoDoAssistente } from '@/components/common/AssistentePassos';
import { VeiculoSelector } from '@/features/reservas/components/VeiculoSelector';
import { VeiculosService } from '@/services/veiculos.services';

interface ValorDaReserva {
  veiculo_id?: string;
  reserva_data_inicio?: string;
  reserva_data_fim?: string;
  reserva_hora_inicio?: string;
  reserva_hora_fim?: string;
  reserva_finalidade?: string;
}

interface ReservaViaturaFieldProps {
  value?: ValorDaReserva;
  onChange: (value: ValorDaReserva) => void;
  disabled?: boolean;
  /** Data de programação da OS, usada como padrão do período. */
  dataProgramada?: string;
  /** Reserva atual da programação (edição): não conta como conflito com ela mesma */
  reservaId?: string;
}

interface ResumoDaViatura {
  id: string;
  nome?: string;
  modelo?: string;
  placa?: string;
}

const PADRAO: ValorDaReserva = {
  veiculo_id: '',
  reserva_data_inicio: '',
  reserva_data_fim: '',
  reserva_hora_inicio: '08:00',
  reserva_hora_fim: '18:00',
  reserva_finalidade: '',
};

/**
 * A reserva de veículo, em dois passos.
 *
 * O período vem primeiro porque é ele que decide quais veículos estão livres —
 * antes, a lista aparecia junto de uma caixa tracejada dizendo "preencha as
 * datas para ver os veículos", ocupando meia tela para não mostrar nada.
 *
 * Escolhido o veículo, o assistente sai e fica um resumo, como na origem da OS.
 */
export function ReservaViaturaField({
  value,
  onChange,
  disabled = false,
  dataProgramada,
  reservaId,
}: ReservaViaturaFieldProps) {
  const [dados, setDados] = useState<ValorDaReserva>({ ...PADRAO, ...value });
  const [passo, setPasso] = useState(0);
  const [trocando, setTrocando] = useState(false);

  // A viatura escolhida vem pelo id. Antes era procurada numa lista de 10
  // viaturas, e a que ficasse de fora nunca aparecia no resumo.
  const [viatura, setViatura] = useState<ResumoDaViatura | null>(null);
  const veiculoId = String(dados.veiculo_id ?? '').trim();
  useEffect(() => {
    if (!veiculoId || viatura?.id === veiculoId) return;
    let ativo = true;
    VeiculosService.getVeiculoById(veiculoId)
      .then((v) => ativo && setViatura({ id: veiculoId, nome: v.nome, modelo: v.modelo, placa: v.placa }))
      .catch(() => ativo && setViatura({ id: veiculoId }));
    return () => {
      ativo = false;
    };
  }, [veiculoId, viatura?.id]);

  // Absorve mudança vinda de fora sem entrar em laço.
  //
  // O pai recria o objeto `value` a cada render; comparar por referência faria
  // este efeito gravar estado em toda passagem, e gravar estado provoca outra.
  // A comparação é pelo conteúdo.
  const assinaturaExterna = JSON.stringify(value ?? {});
  useEffect(() => {
    if (!value) return;
    setDados((atual) => ({ ...atual, ...value }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assinaturaExterna]);

  // A data da OS vira o período sugerido, uma vez só. Sem a trava, reabrir o
  // sheet reescreveria por cima de um período que a pessoa já tinha ajustado.
  const sugeridoRef = useRef(false);
  useEffect(() => {
    if (!dataProgramada || sugeridoRef.current) return;
    if (dados.reserva_data_inicio) return;

    sugeridoRef.current = true;
    const dia = dataProgramada.split('T')[0];
    atualizar({ reserva_data_inicio: dia, reserva_data_fim: dia });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataProgramada]);

  const atualizar = (mudanca: Partial<ValorDaReserva>) => {
    const novo = { ...dados, ...mudanca };
    setDados(novo);
    onChange(novo);
  };

  const periodoCompleto = Boolean(
    dados.reserva_data_inicio &&
      dados.reserva_data_fim &&
      dados.reserva_hora_inicio &&
      dados.reserva_hora_fim,
  );

  const veiculoEscolhido = viatura && viatura.id === veiculoId ? viatura : null;

  // ==================== RESUMO ====================

  if (veiculoEscolhido && periodoCompleto && !trocando) {
    const v = veiculoEscolhido;
    const periodo =
      dados.reserva_data_inicio === dados.reserva_data_fim
        ? `${formatarData(dados.reserva_data_inicio)} · ${dados.reserva_hora_inicio} às ${dados.reserva_hora_fim}`
        : `${formatarData(dados.reserva_data_inicio)} ${dados.reserva_hora_inicio} até ${formatarData(dados.reserva_data_fim)} ${dados.reserva_hora_fim}`;

    return (
      <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Car className="h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="truncate text-sm font-medium">
              {[v.nome || v.modelo, v.placa].filter(Boolean).join(' · ')}
            </p>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{periodo}</p>
          {dados.reserva_finalidade && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {dados.reserva_finalidade}
            </p>
          )}
        </div>

        {!disabled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setTrocando(true);
              setPasso(0);
            }}
          >
            Trocar
          </Button>
        )}
      </div>
    );
  }

  // ==================== PASSOS ====================

  const passos: PassoDoAssistente[] = [
    {
      rotulo: 'Período',
      titulo: 'Quando o veículo será usado?',
      concluido: periodoCompleto,
      conteudo: (
        <div className="grid gap-3 sm:grid-cols-2">
          <CampoDeData
            rotulo="Início"
            data={dados.reserva_data_inicio}
            hora={dados.reserva_hora_inicio}
            disabled={disabled}
            onData={(d) => atualizar({ reserva_data_inicio: d })}
            onHora={(h) => atualizar({ reserva_hora_inicio: h })}
          />
          <CampoDeData
            rotulo="Fim"
            data={dados.reserva_data_fim}
            hora={dados.reserva_hora_fim}
            disabled={disabled}
            onData={(d) => atualizar({ reserva_data_fim: d })}
            onHora={(h) => atualizar({ reserva_hora_fim: h })}
          />
        </div>
      ),
    },
    {
      rotulo: 'Veículo',
      titulo: 'Qual veículo?',
      concluido: Boolean(dados.veiculo_id),
      conteudo: (
          <div className="space-y-4">
            <VeiculoSelector
              filtrosDisponibilidade={{
                dataInicio: dados.reserva_data_inicio || '',
                dataFim: dados.reserva_data_fim || '',
                horaInicio: dados.reserva_hora_inicio || '',
                horaFim: dados.reserva_hora_fim || '',
                excluirReservaId: reservaId?.trim() || undefined,
              }}
              veiculoSelecionado={dados.veiculo_id}
              onVeiculoChange={(id: string) => atualizar({ veiculo_id: id })}
              disabled={disabled}
            />

            <div className="space-y-1.5">
              <Label htmlFor="reserva_finalidade" className="text-sm">
                Finalidade
              </Label>
              <Textarea
                id="reserva_finalidade"
                value={dados.reserva_finalidade}
                onChange={(e) => atualizar({ reserva_finalidade: e.target.value })}
                placeholder="Ex.: transporte da equipe até a planta"
                disabled={disabled}
                rows={2}
              />
            </div>
          </div>
        ),
    },
  ];

  return (
    <AssistentePassos
      passos={passos}
      atual={passo}
      onAtualChange={setPasso}
      disabled={disabled}
      rotuloFinal="Concluir"
      onFinalizar={() => setTrocando(false)}
    />
  );
}

/** Data e hora na mesma linha: elas só fazem sentido juntas. */
function CampoDeData({
  rotulo,
  data,
  hora,
  disabled,
  onData,
  onHora,
}: {
  rotulo: string;
  data?: string;
  hora?: string;
  disabled?: boolean;
  onData: (valor: string) => void;
  onHora: (valor: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{rotulo}</Label>
      <div className="flex gap-2">
        <input
          className="input-minimal"
          type="date"
          value={data || ''}
          disabled={disabled}
          onChange={(e) => onData(e.target.value)}
        />
        <div className="w-24 shrink-0">
          <input
            className="input-minimal input-hora"
            type="time"
            value={hora || ''}
            disabled={disabled}
            onChange={(e) => onHora(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

/** AAAA-MM-DD para DD/MM. O ano só aparece quando não é o corrente. */
function formatarData(iso?: string): string {
  if (!iso) return '';
  const [ano, mes, dia] = iso.split('-');
  if (!ano || !mes || !dia) return iso;

  const atual = String(new Date().getFullYear());
  return ano === atual ? `${dia}/${mes}` : `${dia}/${mes}/${ano}`;
}
