// src/features/veiculos/components/ViaturaSelector.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { Car, Clock, Users, Weight, Fuel, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { ViaturaSelectorProps, ViaturaReservada } from '../../reservas/types';
import { useReservasVeiculos } from '../../reservas/hooks/useReservasVeiculos';
import { useVeiculos } from '../hooks/useVeiculos';
import type { VeiculoResponse } from '@/services/veiculos.services';
import { formatCurrency } from '@/lib/utils';
// Mock data removed - using API now

/** A viatura como o cartao le: `numeroPassageiros` e `valorDiaria` sobraram do mock — a API nao manda. */
type VeiculoDoSeletor = VeiculoResponse & { numeroPassageiros?: number; valorDiaria?: number };

export const ViaturaSelector: React.FC<ViaturaSelectorProps> = ({
  value,
  onChange,
  dataInicio,
  dataFim,
  horaInicio,
  horaFim,
  // solicitanteId é usado na destruturação mas não é usado na função
  responsavel,
  finalidade,
  mode = 'complete',
  disabled = false,
  required = false,
  showPeriodSummary = true,
  reservaIdParaExcluir
}) => {
  const [veiculosDisponiveis, setVeiculosDisponiveis] = useState<string[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [carregandoDisponibilidade, setCarregandoDisponibilidade] = useState(false);

  // Hook para obter veículos
  const { veiculos: mockVeiculos } = useVeiculos();
  
  const { validarPeriodoReserva, obterVeiculosDisponiveis, calcularCustoReserva } = useReservasVeiculos();

  // Validar período
  const erroPeriodo = useMemo(() => {
    if (!dataInicio || !dataFim || !horaInicio || !horaFim) {
      return 'Período de reserva incompleto';
    }
    return validarPeriodoReserva(dataInicio, dataFim, horaInicio, horaFim);
  }, [dataInicio, dataFim, horaInicio, horaFim, validarPeriodoReserva]);

  // Buscar veículos disponíveis quando período for válido
  useEffect(() => {
    const buscarVeiculosDisponiveis = async () => {
      if (erroPeriodo) {
        setVeiculosDisponiveis([]);
        return;
      }

      setCarregandoDisponibilidade(true);
      setErro(null);

      try {
        const disponiveis = await obterVeiculosDisponiveis({
          dataInicio,
          dataFim,
          horaInicio,
          horaFim,
          excluirReservaId: reservaIdParaExcluir
        });
        
        setVeiculosDisponiveis(disponiveis);
        
        // Se o veículo selecionado não estiver mais disponível, limpar seleção
        if (value && typeof value === 'object' && !disponiveis.includes(value.veiculoId)) {
          onChange(null);
        } else if (value && typeof value === 'string' && !disponiveis.includes(value)) {
          onChange(null);
        }
      } catch (error) {
        setErro('Erro ao verificar disponibilidade dos veículos');
        console.error('Erro ao buscar veículos disponíveis:', error);
      } finally {
        setCarregandoDisponibilidade(false);
      }
    };

    buscarVeiculosDisponiveis();
  }, [dataInicio, dataFim, horaInicio, horaFim, reservaIdParaExcluir, erroPeriodo, obterVeiculosDisponiveis, value, onChange]);

  // Selecionar veículo
  const selecionarVeiculo = (veiculoId: string) => {
    if (disabled) return;

    const veiculo = mockVeiculos.find((v) => v.id === veiculoId);
    if (!veiculo) return;

    if (mode === 'simple') {
      onChange(veiculoId);
    } else {
      const viaturaReservada: ViaturaReservada = {
        veiculoId,
        dataInicio,
        dataFim,
        horaInicio,
        horaFim,
        responsavel,
        finalidade
      };
      onChange(viaturaReservada);
    }
  };

  // Obter ID do veículo selecionado
  const veiculoSelecionadoId = useMemo(() => {
    if (!value) return null;
    return typeof value === 'string' ? value : value.veiculoId;
  }, [value]);

  // Calcular período em dias
  const periodoEmDias = useMemo(() => {
    if (!dataInicio || !dataFim) return 0;
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    return Math.ceil((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) || 1;
  }, [dataInicio, dataFim]);

  if (erroPeriodo) {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
        <p className="text-gray-600 font-medium">Período de reserva necessário</p>
        <p className="text-sm text-gray-500 mt-1">{erroPeriodo}</p>
        <p className="text-xs text-gray-400 mt-2">
          Defina as datas e horários para ver os veículos disponíveis
        </p>
      </div>
    );
  }

  if (carregandoDisponibilidade) {
    return (
      <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center">
        <Loader className="w-8 h-8 text-blue-500 mx-auto mb-2 animate-spin" />
        <p className="text-gray-600 font-medium">Verificando disponibilidade...</p>
        <p className="text-sm text-gray-500 mt-1">
          Buscando veículos disponíveis para o período selecionado
        </p>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="border-2 border-red-300 rounded-lg p-6 text-center">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-600 font-medium">Erro ao carregar veículos</p>
        <p className="text-sm text-red-500 mt-1">{erro}</p>
      </div>
    );
  }

  if (veiculosDisponiveis.length === 0) {
    return (
      <div className="border-2 border-dashed border-amber-300 rounded-lg p-6 text-center">
        <Car className="w-8 h-8 text-amber-500 mx-auto mb-2" />
        <p className="text-gray-600 font-medium">Nenhum veículo disponível</p>
        <p className="text-sm text-gray-500 mt-1">
          Não há veículos disponíveis para o período de {dataInicio} a {dataFim}
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Tente alterar as datas ou horários da reserva
        </p>
      </div>
    );
  }

  const veiculosParaExibir = mockVeiculos.filter((v) =>
    veiculosDisponiveis.includes(v.id)
  );

  return (
    <div className="space-y-4">
      {/* Resumo do período */}
      {showPeriodSummary && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Período da Reserva</h4>
              <p className="text-sm text-blue-700 mt-1">
                <span className="font-medium">{dataInicio}</span> às {horaInicio} até{' '}
                <span className="font-medium">{dataFim}</span> às {horaFim}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {periodoEmDias} {periodoEmDias === 1 ? 'dia' : 'dias'} • 
                {veiculosDisponiveis.length} {veiculosDisponiveis.length === 1 ? 'veículo disponível' : 'veículos disponíveis'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Lista de veículos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {veiculosParaExibir.map((veiculo: VeiculoDoSeletor) => {
          const isSelected = veiculoSelecionadoId === veiculo.id;
          const custo = calcularCustoReserva(veiculo.id, dataInicio, dataFim);

          return (
            <div
              key={veiculo.id}
              className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : disabled
                  ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                  : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
              }`}
              onClick={() => selecionarVeiculo(veiculo.id)}
            >
              {/* Indicador de seleção */}
              {isSelected && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              )}

              {/* Header do card */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {veiculo.nome}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {veiculo.marca} {veiculo.modelo} • {veiculo.placa}
                  </p>
                </div>
                <Car className={`w-6 h-6 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
              </div>

              {/* Informações principais */}
              <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{veiculo.capacidadePassageiros || veiculo.numeroPassageiros || 0} passageiros</span>
                </div>
                <div className="flex items-center gap-2">
                  <Weight className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{veiculo.capacidadeCarga || 0}kg</span>
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <Fuel className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 capitalize">{veiculo.tipoCombustivel}</span>
                </div>
              </div>

              {/* Responsável */}
              <div className="text-xs text-gray-500 mb-2">
                Responsável: {veiculo.responsavel}
              </div>

              {/* Custo */}
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-sm font-medium text-gray-700">
                  {formatCurrency(veiculo.valorDiaria || 0)}/dia
                </span>
                <span className="text-sm font-bold text-blue-600">
                  Total: {formatCurrency(custo)}
                </span>
              </div>

              {/* Localização */}
              <div className="text-xs text-gray-400 mt-1">
                📍 {veiculo.localizacaoAtual}
              </div>
            </div>
          );
        })}
      </div>

      {/* Informações adicionais */}
      {required && !value && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          Seleção de veículo obrigatória
        </p>
      )}

      {/* Resumo da seleção */}
      {value && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-900">Veículo Selecionado</h4>
              {typeof value === 'object' ? (
                <div className="text-sm text-green-700 mt-1">
                  <p className="font-medium">
                    {mockVeiculos.find((v) => v.id === value.veiculoId)?.nome}
                  </p>
                  <p>Período: {value.dataInicio} às {value.horaInicio} até {value.dataFim} às {value.horaFim}</p>
                  {value.responsavel && <p>Responsável: {value.responsavel}</p>}
                  {value.finalidade && <p>Finalidade: {value.finalidade}</p>}
                  <p className="font-medium mt-1">
                    Custo total: {formatCurrency(calcularCustoReserva(value.veiculoId, value.dataInicio, value.dataFim))}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-green-700 mt-1">
                  {mockVeiculos.find((v) => v.id === value)?.nome} (ID: {value})
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViaturaSelector;