// src/features/reservas/components/VeiculoSelector.tsx
import { useMemo, useState, useEffect } from 'react';
import { Car, Users, Fuel, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Veiculo, ReservaVeiculo, FiltrosDisponibilidade } from '../types';

interface VeiculoSelectorProps {
  veiculos: Veiculo[];
  reservas: ReservaVeiculo[];
  filtrosDisponibilidade: FiltrosDisponibilidade;
  veiculoSelecionado?: string;
  onVeiculoChange: (veiculoId: string) => void;
  disabled?: boolean;
}

export function VeiculoSelector({
  veiculos,
  reservas,
  filtrosDisponibilidade,
  veiculoSelecionado,
  onVeiculoChange,
  disabled = false
}: VeiculoSelectorProps) {
  const [mostrarLista, setMostrarLista] = useState(!veiculoSelecionado);

  // Quando o modal abre com um veículo já selecionado (edit/view), colapsar
  useEffect(() => {
    setMostrarLista(!veiculoSelecionado);
  }, []);

  // Verifica disponibilidade de cada veículo
  const veiculosComDisponibilidade = useMemo(() => {
    const resultado = veiculos.map(veiculo => {
      const veiculoId = veiculo.id;

      // Veículos inativos ou em manutenção não estão disponíveis
      if (veiculo.status === 'inativo' || veiculo.status === 'manutencao') {
        return {
          ...veiculo,
          disponivel: false,
          motivo: veiculo.status === 'inativo' ? 'Veículo inativo' : 'Em manutenção'
        };
      }

      // Se não há filtros de data, considera disponível
      if (!filtrosDisponibilidade.dataInicio || !filtrosDisponibilidade.dataFim) {
        return {
          ...veiculo,
          disponivel: true,
          motivo: null
        };
      }

      // Verifica conflitos com reservas existentes
      const conflitos = reservas.filter(reserva => {
        // Ignora reservas canceladas/finalizadas
        if (reserva.status === 'cancelada' || reserva.status === 'finalizada') {
          return false;
        }

        // Ignora a própria reserva se estivermos editando
        if (filtrosDisponibilidade.excluirReservaId &&
            reserva.id.toString() === filtrosDisponibilidade.excluirReservaId) {
          return false;
        }

        // Verifica se é o mesmo veículo - COMPARAR COMO STRING
        const reservaVeiculoId = reserva.veiculoId.toString();
        if (reservaVeiculoId !== veiculoId.toString()) {
          return false;
        }

        // Verifica sobreposição de datas
        const inicioNovo = new Date(`${filtrosDisponibilidade.dataInicio}T${filtrosDisponibilidade.horaInicio || '00:00'}`);
        const fimNovo = new Date(`${filtrosDisponibilidade.dataFim}T${filtrosDisponibilidade.horaFim || '23:59'}`);
        const inicioExistente = new Date(`${reserva.dataInicio}T${reserva.horaInicio}`);
        const fimExistente = new Date(`${reserva.dataFim}T${reserva.horaFim}`);

        return (inicioNovo < fimExistente && fimNovo > inicioExistente);
      });

      const temConflito = conflitos.length > 0;

      return {
        ...veiculo,
        disponivel: !temConflito,
        motivo: temConflito ? `Reservado até ${conflitos[0].dataFim} ${conflitos[0].horaFim}` : null,
        conflitos
      };
    });

    return resultado;
  }, [veiculos, reservas, filtrosDisponibilidade]);

  // Ordena veículos: disponíveis primeiro
  const veiculosOrdenados = useMemo(() => {
    return [...veiculosComDisponibilidade].sort((a, b) => {
      if (a.disponivel && !b.disponivel) return -1;
      if (!a.disponivel && b.disponivel) return 1;
      return a.nome.localeCompare(b.nome);
    });
  }, [veiculosComDisponibilidade]);

  const veiculosDisponiveis = veiculosComDisponibilidade.filter(v => v.disponivel);
  const veiculosIndisponiveis = veiculosComDisponibilidade.filter(v => !v.disponivel);

  // Encontrar o veículo selecionado
  const veiculoAtual = useMemo(() => {
    if (!veiculoSelecionado) return null;
    return veiculos.find(v => v.id.toString() === veiculoSelecionado.toString()) || null;
  }, [veiculos, veiculoSelecionado]);

  // Handler para seleção de veículo
  const handleVeiculoClick = (veiculo: any) => {
    if (!veiculo.disponivel || disabled) {
      return;
    }

    onVeiculoChange(veiculo.id);
    setMostrarLista(false);
  };

  // Função para verificar se o veículo está selecionado
  const isVeiculoSelecionado = (veiculo: any): boolean => {
    const veiculoId = veiculo.id.toString();
    const selecionado = veiculoSelecionado?.toString();
    return veiculoId === selecionado;
  };

  if (!filtrosDisponibilidade.dataInicio || !filtrosDisponibilidade.dataFim) {
    return (
      <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded">
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm">Selecione as datas para verificar disponibilidade dos veículos</span>
        </div>
      </div>
    );
  }

  // Veículo já escolhido: resumo, com o botão de voltar à lista.
  if (veiculoAtual && !mostrarLista) {
    return (
      <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <Car className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{veiculoAtual.nome}</p>
            <p className="truncate text-xs text-muted-foreground">
              {[veiculoAtual.marca, veiculoAtual.modelo, veiculoAtual.placa]
                .filter(Boolean)
                .join(' · ')}
            </p>
            <FichaDoVeiculo veiculo={veiculoAtual} />
          </div>
        </div>

        {!disabled && (
          <Button type="button" variant="ghost" size="sm" onClick={() => setMostrarLista(true)}>
            <RefreshCw className="mr-1 h-3.5 w-3.5" />
            Trocar
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Quantos livres, quantos ocupados. O verde e o vermelho são os únicos
          acentos: o resto sai dos tokens, para a seção não destoar do sheet. */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-muted-foreground">
          {filtrosDisponibilidade.dataInicio} a {filtrosDisponibilidade.dataFim}
          {filtrosDisponibilidade.horaInicio && filtrosDisponibilidade.horaFim && (
            <> · {filtrosDisponibilidade.horaInicio} às {filtrosDisponibilidade.horaFim}</>
          )}
        </span>
        <span className="flex items-center gap-3">
          <span className="text-emerald-600 dark:text-emerald-500">
            {veiculosDisponiveis.length} livres
          </span>
          {veiculosIndisponiveis.length > 0 && (
            <span className="text-muted-foreground">
              {veiculosIndisponiveis.length} ocupados
            </span>
          )}
        </span>
      </div>

      <div className="max-h-72 space-y-0.5 overflow-y-auto overscroll-contain">
        {veiculosOrdenados.map((veiculo) => {
          const escolhido = isVeiculoSelecionado(veiculo);
          const livre = veiculo.disponivel;

          return (
            <button
              key={veiculo.id}
              type="button"
              onClick={() => handleVeiculoClick(veiculo)}
              disabled={!livre || disabled}
              className={`flex w-full items-start gap-3 rounded-md px-3 py-2 text-left transition-colors ${
                escolhido ? 'bg-muted' : 'hover:bg-muted'
              } ${!livre || disabled ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <Car className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm">{veiculo.nome}</p>
                  {!livre && (
                    <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">
                      ocupado
                    </span>
                  )}
                </div>

                <p className="truncate text-xs text-muted-foreground">
                  {[veiculo.marca, veiculo.modelo, veiculo.placa].filter(Boolean).join(' · ')}
                </p>

                <FichaDoVeiculo veiculo={veiculo} />

                {!livre && veiculo.motivo && (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{veiculo.motivo}</p>
                )}
              </div>

              {escolhido && <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
            </button>
          );
        })}

        {veiculosOrdenados.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">Nenhum veículo encontrado</p>
        )}
      </div>
    </div>
  );
}

/** Passageiros e combustível, a linha que decide entre dois veículos parecidos. */
function FichaDoVeiculo({
  veiculo,
}: {
  veiculo: { capacidadePassageiros?: number; tipoCombustivel?: string };
}) {
  return (
    <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
      <span className="flex items-center gap-1">
        <Users className="h-3 w-3" />
        {veiculo.capacidadePassageiros || 0}
      </span>
      <span className="flex items-center gap-1 capitalize">
        <Fuel className="h-3 w-3" />
        {veiculo.tipoCombustivel}
      </span>
    </div>
  );
}