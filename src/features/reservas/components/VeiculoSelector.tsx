// src/features/reservas/components/VeiculoSelector.tsx
import { useMemo, useState, useEffect } from 'react';
import { Car, Users, Fuel, AlertTriangle, CheckCircle, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VeiculosService, type ViaturaComDisponibilidade } from '@/services/veiculos.services';
import { formatApiError } from '@/utils/api-error';
import { FiltrosDisponibilidade } from '../types';
import { formatarDiaDaReserva } from '../utils/dia-da-reserva';

interface VeiculoSelectorProps {
  filtrosDisponibilidade: FiltrosDisponibilidade;
  veiculoSelecionado?: string;
  onVeiculoChange: (veiculoId: string) => void;
  disabled?: boolean;
}

interface ViaturaNaLista {
  id: string;
  nome: string;
  marca: string;
  modelo: string;
  placa: string;
  capacidadePassageiros: number;
  tipoCombustivel: string;
  disponivel: boolean;
  motivo: string | null;
}

const paraLista = (v: ViaturaComDisponibilidade): ViaturaNaLista => ({
  id: v.id.trim(),
  nome: v.nome,
  marca: v.marca,
  modelo: v.modelo,
  placa: v.placa,
  capacidadePassageiros: v.capacidade_passageiros,
  tipoCombustivel: v.tipo_combustivel,
  disponivel: v.disponivel,
  motivo: v.motivo,
});

/**
 * Escolha da viatura com a ocupação real na janela.
 *
 * A ocupação vem do servidor (`/veiculos/disponibilidade`), pela mesma regra
 * que recusa a gravação. Antes era calculada aqui, com 10 reservas e datas
 * inválidas, e nenhuma viatura aparecia ocupada.
 */
export function VeiculoSelector({
  filtrosDisponibilidade,
  veiculoSelecionado,
  onVeiculoChange,
  disabled = false
}: VeiculoSelectorProps) {
  const [mostrarLista, setMostrarLista] = useState(!veiculoSelecionado);
  const [viaturas, setViaturas] = useState<ViaturaNaLista[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Quando o modal abre com um veículo já selecionado (edit/view), colapsar
  useEffect(() => {
    setMostrarLista(!veiculoSelecionado);
  }, []);

  const { dataInicio, dataFim, horaInicio, horaFim, excluirReservaId } = filtrosDisponibilidade;
  useEffect(() => {
    if (!dataInicio || !dataFim) return;
    let ativo = true;
    setCarregando(true);
    setErro(null);
    VeiculosService.getDisponibilidade({ dataInicio, dataFim, horaInicio, horaFim, excluirReservaId })
      .then((lista) => ativo && setViaturas(lista.map(paraLista)))
      .catch((e) => ativo && setErro(formatApiError(e)))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
  }, [dataInicio, dataFim, horaInicio, horaFim, excluirReservaId]);

  const veiculosComDisponibilidade = viaturas;

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
    return viaturas.find(v => v.id === veiculoSelecionado.trim()) || null;
  }, [viaturas, veiculoSelecionado]);

  // Handler para seleção de veículo
  const handleVeiculoClick = (veiculo: ViaturaNaLista) => {
    if (!veiculo.disponivel || disabled) {
      return;
    }

    onVeiculoChange(veiculo.id);
    setMostrarLista(false);
  };

  // Função para verificar se o veículo está selecionado
  const isVeiculoSelecionado = (veiculo: ViaturaNaLista): boolean => veiculo.id === veiculoSelecionado?.trim();

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
            {/* Trocou o horário e a viatura escolhida ficou ocupada: avisa
                aqui, antes do Salvar recusar */}
            {!veiculoAtual.disponivel && veiculoAtual.motivo && (
              <p className="mt-1 text-xs text-destructive">Ocupada neste horário: {veiculoAtual.motivo}</p>
            )}
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

  if (erro) {
    return <p className="text-sm text-destructive">Não foi possível ver as viaturas livres: {erro}</p>;
  }

  if (carregando && viaturas.length === 0) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Verificando viaturas livres…
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {/* Quantos livres, quantos ocupados. O verde e o vermelho são os únicos
          acentos: o resto sai dos tokens, para a seção não destoar do sheet. */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-muted-foreground">
          {formatarDiaDaReserva(filtrosDisponibilidade.dataInicio)}
          {filtrosDisponibilidade.dataFim !== filtrosDisponibilidade.dataInicio && (
            <> a {formatarDiaDaReserva(filtrosDisponibilidade.dataFim)}</>
          )}
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