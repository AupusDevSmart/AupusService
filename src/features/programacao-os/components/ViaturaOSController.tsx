// src/features/programacao-os/components/ViaturaOSController.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Truck, 
  Users, 
  Fuel, 
  Package, 
  CheckSquare, 
  AlertTriangle, 
  Clock,
  Car,
  Calendar,
  Loader2
} from 'lucide-react';
import { VeiculosService, type VeiculoResponse } from '@/services/veiculos.services';
import { ReservasService, type ReservaResponse } from '@/services/reservas.services';

interface FormFieldProps {
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  entity?: any;
  mode?: string;
}

// Input component com dark mode
const SimpleInput = ({ 
  type = 'text', 
  value, 
  onChange, 
  placeholder, 
  disabled, 
  className = '',
  ...props 
}: any) => (
  <input
    type={type}
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    disabled={disabled}
    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
      bg-white dark:bg-gray-800 
      text-gray-900 dark:text-gray-100 
      placeholder-gray-500 dark:placeholder-gray-400
      focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 
      focus:border-blue-500 dark:focus:border-blue-400
      disabled:bg-gray-100 dark:disabled:bg-gray-700 
      disabled:text-gray-500 dark:disabled:text-gray-400
      ${className}`}
    {...props}
  />
);

export const ViaturaOSController: React.FC<FormFieldProps> = ({ 
  value, 
  onChange, 
  disabled, 
  entity 
}) => {
  // Estados principais
  const [veiculos, setVeiculos] = useState<VeiculoResponse[]>([]);
  const [reservas, setReservas] = useState<ReservaResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [carregandoDisponibilidade, setCarregandoDisponibilidade] = useState(false);
  
  // Estados locais para programação
  const [dataProgramada, setDataProgramada] = useState('');
  const [horaProgramada, setHoraProgramada] = useState('');
  const [duracao, setDuracao] = useState(8);

  // Inicializar com dados padrão
  useEffect(() => {
    // Extrair dados existentes
    const dataExistente = entity?.programacao?.dataProgramada || 
                         entity?.dataProgramada || 
                         entity?.data_programada ||
                         value?.dataInicio || '';
                         
    const horaExistente = entity?.programacao?.horaProgramada || 
                         entity?.horaProgramada || 
                         entity?.hora_programada ||
                         value?.horaInicio || '';
                         
    const duracaoExistente = parseFloat(entity?.duracaoEstimada || entity?.duracao_estimada) || 
                            parseFloat(entity?.tempoEstimado || entity?.tempo_estimado) || 
                            8;

    if (dataExistente) setDataProgramada(dataExistente);
    if (horaExistente) setHoraProgramada(horaExistente);
    setDuracao(duracaoExistente);

    // Se não tem data, sugerir amanhã
    if (!dataExistente) {
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      const dataAmanha = amanha.toISOString().split('T')[0];
      setDataProgramada(dataAmanha);
    }

    // Se não tem hora, sugerir 08:00
    if (!horaExistente) {
      setHoraProgramada('08:00');
    }
  }, [entity, value]);

  // Carregar veículos disponíveis
  const carregarVeiculosDisponiveis = async () => {
    if (!dataProgramada || !horaProgramada) return;

    setCarregandoDisponibilidade(true);
    try {
      // console.log('🚗 [ViaturaController] Carregando veículos disponíveis...');
      
      // Calcular data/hora fim
      const dataFim = dataProgramada; // Mesmo dia por enquanto

      // Buscar veículos disponíveis
      const veiculosDisponiveis = await VeiculosService.getVeiculosDisponiveis(
        dataProgramada,
        dataFim
      );

      // Buscar reservas para verificar conflitos
      const todasReservas = await ReservasService.getAllReservas({
        dataInicioFrom: dataProgramada,
        dataFimTo: dataFim,
        status: 'ativa',
        limit: 1000
      });

      // console.log('✅ [ViaturaController] Veículos carregados:', veiculosDisponiveis.length);
      // console.log('📋 [ViaturaController] Reservas ativas:', todasReservas.data.length);

      setVeiculos(veiculosDisponiveis);
      setReservas(todasReservas.data);

    } catch (error) {
      // console.error('❌ [ViaturaController] Erro ao carregar veículos:', error);
      // Em caso de erro, buscar todos os veículos como fallback
      try {
        const todosVeiculos = await VeiculosService.getAllVeiculos({
          status: 'disponivel',
          limit: 100
        });
        setVeiculos(todosVeiculos.data);
        setReservas([]);
      } catch (fallbackError) {
        // console.error('❌ [ViaturaController] Erro no fallback:', fallbackError);
        setVeiculos([]);
        setReservas([]);
      }
    } finally {
      setCarregandoDisponibilidade(false);
    }
  };

  // Carregar dados quando dependências mudarem
  useEffect(() => {
    carregarVeiculosDisponiveis();
  }, [dataProgramada, horaProgramada, duracao]);

  // Carregar veículos inicialmente
  useEffect(() => {
    const carregarVeiculosIniciais = async () => {
      setLoading(true);
      try {
        const response = await VeiculosService.getAllVeiculos({
          limit: 100,
          status: 'disponivel'
        });
        setVeiculos(response.data);
      } catch (error) {
        // console.error('❌ [ViaturaController] Erro ao carregar veículos iniciais:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarVeiculosIniciais();
  }, []);

  // Verificar disponibilidade dos veículos
  const veiculosComDisponibilidade = useMemo(() => {
    if (!dataProgramada || !horaProgramada) {
      return veiculos.map(v => ({ 
        ...v, 
        disponivel: v.status === 'disponivel', 
        motivo: v.status !== 'disponivel' ? `Status: ${v.status}` : null,
        conflitos: []
      }));
    }

    return veiculos.map(veiculo => {
      // Veículos não disponíveis
      if (veiculo.status !== 'disponivel') {
        return {
          ...veiculo,
          disponivel: false,
          motivo: `Status: ${veiculo.status}`,
          conflitos: []
        };
      }

      // Calcular hora fim baseada na duração
      const horaFimCalculada = (() => {
        const [hora, minuto] = horaProgramada.split(':');
        const horaFim = Math.min(23, parseInt(hora) + Math.ceil(duracao));
        return String(horaFim).padStart(2, '0') + ':' + (minuto || '00');
      })();

      // Verifica conflitos com reservas existentes
      const conflitos = reservas.filter(reserva => {
        if (reserva.status !== 'ativa') return false;
        if (reserva.veiculoId !== veiculo.id) return false;

        // Verifica sobreposição de datas/horários
        const inicioNovo = new Date(`${dataProgramada}T${horaProgramada}:00`);
        const fimNovo = new Date(`${dataProgramada}T${horaFimCalculada}:00`);
        const inicioExistente = new Date(`${reserva.dataInicio}T${reserva.horaInicio}:00`);
        const fimExistente = new Date(`${reserva.dataFim}T${reserva.horaFim}:00`);

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
  }, [veiculos, reservas, dataProgramada, horaProgramada, duracao]);

  const veiculosDisponiveis = veiculosComDisponibilidade.filter(v => v.disponivel);

  // Calcular hora fim
  const horaFimCalculada = useMemo(() => {
    if (!horaProgramada) return null;
    const [hora, minuto] = horaProgramada.split(':');
    const horaFim = Math.min(23, parseInt(hora) + Math.ceil(duracao));
    return String(horaFim).padStart(2, '0') + ':' + (minuto || '00');
  }, [horaProgramada, duracao]);

  // Handlers
  const handleDataChange = (novaData: string) => {
    setDataProgramada(novaData);
  };

  const handleHoraChange = (novaHora: string) => {
    setHoraProgramada(novaHora);
  };

  const handleVeiculoSelect = async (veiculo: VeiculoResponse) => {
    if (disabled) return;
    
    try {
      // Verificar conflitos uma última vez
      const conflitos = await ReservasService.verificarConflitos(
        veiculo.id,
        dataProgramada,
        dataProgramada,
        horaProgramada,
        horaFimCalculada || '23:59'
      );

      if (conflitos.length > 0) {
        alert(`Conflito detectado! O veículo já está reservado para:\n${conflitos[0].finalidade}\nPor: ${conflitos[0].responsavel}`);
        return;
      }

      // Criar objeto de reserva completo
      const viaturaReservada = {
        veiculoId: veiculo.id,
        dataInicio: dataProgramada,
        dataFim: dataProgramada,
        horaInicio: horaProgramada,
        horaFim: horaFimCalculada || '23:59',
        solicitanteId: entity?.id || 'temp-id',
        tipoSolicitante: 'ordem_servico' as const,
        responsavel: entity?.responsavel || 'Responsável não definido',
        finalidade: `Execução de OS - ${entity?.descricao?.substring(0, 50) || 'Manutenção'}`,
        status: 'ativa' as const,
        veiculo: {
          nome: veiculo.nome,
          placa: veiculo.placa
        }
      };
      
      onChange(viaturaReservada);
      
    } catch (error) {
      // console.error('❌ [ViaturaController] Erro ao verificar conflitos:', error);
      alert('Erro ao verificar disponibilidade. Tente novamente.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">Carregando veículos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Reserva de Viatura</label>
      </div>
      
      {/* Seção de Programação */}
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Programação da OS</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Data da Programação <span className="text-red-500">*</span>
            </label>
            <SimpleInput
              type="date"
              value={dataProgramada}
              onChange={handleDataChange}
              disabled={disabled}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Hora da Programação <span className="text-red-500">*</span>
            </label>
            <SimpleInput
              type="time"
              value={horaProgramada}
              onChange={handleHoraChange}
              disabled={disabled}
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Duração (horas)
            </label>
            <SimpleInput
              type="number"
              value={duracao}
              onChange={(valor: string) => setDuracao(parseFloat(valor) || 8)}
              disabled={disabled}
              min="1"
              max="24"
              step="0.5"
            />
          </div>
        </div>
      </div>

      {/* Condicionais baseadas no estado */}
      {(!dataProgramada || !horaProgramada) && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-medium text-amber-900 dark:text-amber-100">
              Configure a Programação
            </span>
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
            Preencha a data e hora acima para ver as viaturas disponíveis
          </p>
        </div>
      )}

      {dataProgramada && horaProgramada && (
        <>
          {/* Resumo do período */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100">Período da Reserva</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  <span className="font-medium">{dataProgramada}</span> às {horaProgramada} até{' '}
                  <span className="font-medium">{dataProgramada}</span> às {horaFimCalculada}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Duração: {duracao}h • {carregandoDisponibilidade ? 'Verificando...' : `${veiculosDisponiveis.length} veículos disponíveis`}
                </p>
              </div>
            </div>
          </div>
          
          {/* Loading state */}
          {carregandoDisponibilidade && (
            <div className="border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-lg p-6 text-center">
              <Loader2 className="w-8 h-8 border-4 border-blue-500 rounded-full animate-spin mx-auto mb-2" />
              <p className="text-gray-600 dark:text-gray-300 font-medium">Verificando disponibilidade...</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Consultando agenda de viaturas...</p>
            </div>
          )}
          
          {/* Nenhum veículo disponível */}
          {!carregandoDisponibilidade && veiculosDisponiveis.length === 0 && (
            <div className="border-2 border-dashed border-amber-300 dark:border-amber-700 rounded-lg p-6 text-center">
              <Truck className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="text-gray-600 dark:text-gray-300 font-medium">Nenhum veículo disponível</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Não há veículos disponíveis para o período de {dataProgramada} das {horaProgramada} às {horaFimCalculada}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                Tente alterar o horário ou escolher outro dia
              </p>
            </div>
          )}
          
          {/* Grid de veículos disponíveis */}
          {!carregandoDisponibilidade && veiculosDisponiveis.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                Selecione uma Viatura ({veiculosDisponiveis.length} disponíveis):
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {veiculosDisponiveis.map(veiculo => {
                  const isSelected = (typeof value === 'object' && value?.veiculoId === veiculo.id);
                  const passageiros = veiculo.capacidadePassageiros || 0;

                  return (
                    <div
                      key={veiculo.id}
                      className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 shadow-md'
                          : disabled
                          ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 cursor-not-allowed'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm bg-white dark:bg-gray-800'
                      }`}
                      onClick={() => handleVeiculoSelect(veiculo)}
                    >
                      {/* Indicador de seleção */}
                      {isSelected && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <CheckSquare className="w-4 h-4 text-white" />
                        </div>
                      )}

                      {/* Header do card */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{veiculo.nome}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{veiculo.placa}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">{veiculo.marca} {veiculo.modelo} {veiculo.ano}</p>
                        </div>
                        <Car className={`w-6 h-6 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
                      </div>

                      {/* Informações do veículo */}
                      <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">{passageiros} passageiros</span>
                        </div>
                        {veiculo.capacidadeCarga && (
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">{veiculo.capacidadeCarga}kg</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 col-span-2">
                          <Fuel className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400 capitalize">{veiculo.tipoCombustivel}</span>
                        </div>
                      </div>

                      {/* Status e localização */}
                      <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Disponível</span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-500">
                          {veiculo.localizacaoAtual}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Resumo da seleção */}
          {value && typeof value === 'object' && value.veiculoId && (
            <div className="bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckSquare className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900 dark:text-green-100">✅ Viatura Reservada</h4>
                  <div className="text-sm text-green-700 dark:text-green-300 mt-1 space-y-1">
                    {value.veiculo && (
                      <p className="font-medium">{value.veiculo.nome} - {value.veiculo.placa}</p>
                    )}
                    <p>📅 {value.dataInicio} das {value.horaInicio} às {value.horaFim}</p>
                    <p>👤 Responsável: {value.responsavel || 'A definir'}</p>
                    <p>🎯 {value.finalidade}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-green-800 dark:text-green-200 font-medium">Reserva confirmada para o período</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};