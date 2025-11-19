// src/features/programacao-os/components/ReservaViaturaField.tsx
import React, { useState, useEffect } from 'react';
import { Car, Calendar, Clock, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { VeiculoSelector } from '@/features/reservas/components/VeiculoSelector';
import { useVeiculos } from '@/features/veiculos/hooks/useVeiculos';
import { useReservas } from '@/features/reservas/hooks/useReservas';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ReservaViaturaFieldProps {
  value?: {
    veiculo_id?: string;
    reserva_data_inicio?: string;
    reserva_data_fim?: string;
    reserva_hora_inicio?: string;
    reserva_hora_fim?: string;
    reserva_finalidade?: string;
  };
  onChange: (value: any) => void;
  disabled?: boolean;
  dataProgramada?: string; // Data de programação da OS para usar como padrão
}

export const ReservaViaturaField: React.FC<ReservaViaturaFieldProps> = ({
  value = {},
  onChange,
  disabled = false,
  dataProgramada
}) => {
  // Estado local
  const [localValue, setLocalValue] = useState({
    veiculo_id: value?.veiculo_id || '',
    reserva_data_inicio: value?.reserva_data_inicio || '',
    reserva_data_fim: value?.reserva_data_fim || '',
    reserva_hora_inicio: value?.reserva_hora_inicio || '08:00',
    reserva_hora_fim: value?.reserva_hora_fim || '18:00',
    reserva_finalidade: value?.reserva_finalidade || ''
  });

  // Hooks - desabilitar autoFetch para evitar carregamento desnecessário
  const { veiculos, loading: loadingVeiculos, fetchVeiculos } = useVeiculos({ autoFetch: false });
  const { reservas, loading: loadingReservas, fetchReservas } = useReservas({ autoFetch: false });

  // Atualizar estado local quando value externo mudar
  useEffect(() => {
    if (value) {
      setLocalValue(prev => ({
        ...prev,
        ...value
      }));
    }
  }, [value]);

  // Carregar dados inicialmente apenas uma vez
  useEffect(() => {
    fetchVeiculos();
    fetchReservas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Executar apenas uma vez na montagem

  // Usar data programada como padrão se disponível
  useEffect(() => {
    if (dataProgramada && !localValue.reserva_data_inicio) {
      const dataProgramadaFormatted = dataProgramada.split('T')[0]; // YYYY-MM-DD
      const updated = {
        ...localValue,
        reserva_data_inicio: dataProgramadaFormatted,
        reserva_data_fim: dataProgramadaFormatted
      };
      setLocalValue(updated);
      onChange(updated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataProgramada]); // Só reagir a mudanças em dataProgramada

  // Handler para mudanças nos campos
  const handleFieldChange = (field: string, newValue: any) => {
    const updated = {
      ...localValue,
      [field]: newValue
    };
    setLocalValue(updated);
    onChange(updated);
  };

  // Handler para seleção de veículo
  const handleVeiculoChange = (veiculoId: string) => {
    handleFieldChange('veiculo_id', veiculoId);
  };

  // Verificar se os dados estão completos para mostrar o seletor
  const dadosCompletos =
    localValue.reserva_data_inicio &&
    localValue.reserva_data_fim &&
    localValue.reserva_hora_inicio &&
    localValue.reserva_hora_fim;

  return (
    <div className="space-y-6">
      {/* Campos de período da reserva */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Data Início */}
          <div className="space-y-2">
            <Label htmlFor="reserva_data_inicio" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Data Início da Reserva <span className="text-red-500">*</span>
            </Label>
            <Input
              id="reserva_data_inicio"
              type="date"
              value={localValue.reserva_data_inicio}
              onChange={(e) => handleFieldChange('reserva_data_inicio', e.target.value)}
              disabled={disabled}
              className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
            />
          </div>

          {/* Hora Início */}
          <div className="space-y-2">
            <Label htmlFor="reserva_hora_inicio" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Hora Início <span className="text-red-500">*</span>
            </Label>
            <Input
              id="reserva_hora_inicio"
              type="time"
              value={localValue.reserva_hora_inicio}
              onChange={(e) => handleFieldChange('reserva_hora_inicio', e.target.value)}
              disabled={disabled}
              className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
            />
          </div>

          {/* Data Fim */}
          <div className="space-y-2">
            <Label htmlFor="reserva_data_fim" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Data Fim da Reserva <span className="text-red-500">*</span>
            </Label>
            <Input
              id="reserva_data_fim"
              type="date"
              value={localValue.reserva_data_fim}
              onChange={(e) => handleFieldChange('reserva_data_fim', e.target.value)}
              disabled={disabled}
              className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
            />
          </div>

          {/* Hora Fim */}
          <div className="space-y-2">
            <Label htmlFor="reserva_hora_fim" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Hora Fim <span className="text-red-500">*</span>
            </Label>
            <Input
              id="reserva_hora_fim"
              type="time"
              value={localValue.reserva_hora_fim}
              onChange={(e) => handleFieldChange('reserva_hora_fim', e.target.value)}
              disabled={disabled}
              className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
            />
          </div>
        </div>

        {/* Finalidade */}
        <div className="space-y-2">
          <Label htmlFor="reserva_finalidade">
            Finalidade da Reserva
          </Label>
          <Textarea
            id="reserva_finalidade"
            value={localValue.reserva_finalidade}
            onChange={(e) => handleFieldChange('reserva_finalidade', e.target.value)}
            placeholder="Ex: Transporte de equipe para manutenção em planta remota"
            disabled={disabled}
            rows={2}
            className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
          />
        </div>
      </div>

      {/* Seletor de Veículo */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <div className="mb-4">
          <Label className="text-base font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Car className="w-5 h-5" />
            Selecionar Veículo <span className="text-red-500">*</span>
          </Label>
          {!dadosCompletos && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Configure as datas e horários acima para ver os veículos disponíveis
            </p>
          )}
        </div>

        {dadosCompletos ? (
          loadingVeiculos || loadingReservas ? (
            <div className="flex items-center justify-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Carregando veículos...</p>
              </div>
            </div>
          ) : (
            <VeiculoSelector
              veiculos={veiculos || []}
              reservas={reservas || []}
              filtrosDisponibilidade={{
                dataInicio: localValue.reserva_data_inicio,
                dataFim: localValue.reserva_data_fim,
                horaInicio: localValue.reserva_hora_inicio,
                horaFim: localValue.reserva_hora_fim
              }}
              veiculoSelecionado={localValue.veiculo_id}
              onVeiculoChange={handleVeiculoChange}
              disabled={disabled}
            />
          )
        ) : (
          <div className="p-8 bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-center">
            <AlertCircle className="w-8 h-8 text-gray-400 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Preencha as datas e horários para visualizar os veículos disponíveis
            </p>
          </div>
        )}
      </div>

      {/* Resumo da seleção */}
      {localValue.veiculo_id && dadosCompletos && (
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-green-900 dark:text-green-100">Veículo Selecionado</h4>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                {veiculos?.find(v => v.id === localValue.veiculo_id)?.nome || 'Veículo selecionado'}
              </p>
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                Período: {localValue.reserva_data_inicio} às {localValue.reserva_hora_inicio} até{' '}
                {localValue.reserva_data_fim} às {localValue.reserva_hora_fim}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
