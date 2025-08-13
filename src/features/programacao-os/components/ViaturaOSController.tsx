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
  Calendar
} from 'lucide-react';

interface FormFieldProps {
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  entity?: any;
  mode?: string;
}

interface Veiculo {
  id: number | string;
  nome: string;
  placa: string;
  marca?: string;
  modelo?: string;
  capacidadeCarga?: number;
  numeroPassageiros?: number;
  capacidadePassageiros?: number;
  tipoCombustivel: string;
  status: string;
  disponivel?: boolean;
  localizacaoAtual?: string;
  responsavel?: string;
}

interface ReservaVeiculo {
  id: number | string;
  veiculoId: number;
  dataInicio: string;
  dataFim: string;
  horaInicio: string;
  horaFim: string;
  status: string;
  responsavel?: string;
  finalidade?: string;
}

// ✅ COMPONENTE MELHORADO: Input com dark mode
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

// Mock de dados - substitua pela sua fonte real
const mockVeiculos: Veiculo[] = [
  {
    id: 1,
    nome: 'Strada Adventure CD',
    placa: 'ABC-1234',
    marca: 'Fiat',
    modelo: 'Strada Adventure',
    capacidadeCarga: 650,
    numeroPassageiros: 2,
    tipoCombustivel: 'flex',
    status: 'disponivel',
    localizacaoAtual: 'Garagem Principal',
    responsavel: 'João Silva'
  },
  {
    id: 2,
    nome: 'Hilux SR 4x4',
    placa: 'DEF-5678',
    marca: 'Toyota',
    modelo: 'Hilux SR',
    capacidadeCarga: 1000,
    numeroPassageiros: 4,
    tipoCombustivel: 'diesel',
    status: 'disponivel',
    localizacaoAtual: 'Pátio Externo',
    responsavel: 'Maria Santos'
  },
  {
    id: 3,
    nome: 'Transit Van',
    placa: 'GHI-9012',
    marca: 'Ford',
    modelo: 'Transit',
    capacidadeCarga: 1400,
    numeroPassageiros: 3,
    tipoCombustivel: 'diesel',
    status: 'em_uso',
    localizacaoAtual: 'Em Campo',
    responsavel: 'Carlos Lima'
  },
  {
    id: 4,
    nome: 'Corolla XEi',
    placa: 'JKL-3456',
    marca: 'Toyota',
    modelo: 'Corolla XEi',
    capacidadeCarga: 470,
    numeroPassageiros: 5,
    tipoCombustivel: 'flex',
    status: 'disponivel',
    localizacaoAtual: 'Garagem Principal',
    responsavel: 'Ana Costa'
  }
];

const mockReservas: ReservaVeiculo[] = [
  {
    id: 1,
    veiculoId: 3,
    dataInicio: '2025-08-01',
    dataFim: '2025-08-01',
    horaInicio: '08:00',
    horaFim: '17:00',
    status: 'ativa',
    responsavel: 'Pedro Oliveira',
    finalidade: 'Manutenção equipamento 001'
  }
];

export const ViaturaOSController: React.FC<FormFieldProps> = ({ 
  value, 
  onChange, 
  disabled, 
  entity 
  // mode 
}) => {
  const [veiculos] = useState<Veiculo[]>(mockVeiculos);
  const [reservas] = useState<ReservaVeiculo[]>(mockReservas);
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
                         value?.dataInicio || '';
                         
    const horaExistente = entity?.programacao?.horaProgramada || 
                         entity?.horaProgramada || 
                         value?.horaInicio || '';
                         
    const duracaoExistente = parseFloat(entity?.duracaoEstimada) || 
                            parseFloat(entity?.tempoEstimado) || 
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

  // Verificar disponibilidade dos veículos
  const veiculosComDisponibilidade = useMemo(() => {
    if (!dataProgramada || !horaProgramada) {
      return veiculos.map(v => ({ ...v, disponivel: v.status === 'disponivel', motivo: null }));
    }

    return veiculos.map(veiculo => {
      // Veículos inativos ou em manutenção não estão disponíveis
      if (veiculo.status === 'inativo' || veiculo.status === 'manutencao') {
        return {
          ...veiculo,
          disponivel: false,
          motivo: veiculo.status === 'inativo' ? 'Veículo inativo' : 'Em manutenção'
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
        if (reserva.status === 'cancelada' || reserva.status === 'finalizada') {
          return false;
        }

        if (reserva.veiculoId !== parseInt(veiculo.id.toString())) {
          return false;
        }

        // Verifica sobreposição de datas
        const inicioNovo = new Date(`${dataProgramada}T${horaProgramada}`);
        const fimNovo = new Date(`${dataProgramada}T${horaFimCalculada}`);
        const inicioExistente = new Date(`${reserva.dataInicio}T${reserva.horaInicio}`);
        const fimExistente = new Date(`${reserva.dataFim}T${reserva.horaFim}`);

        return (inicioNovo < fimExistente && fimNovo > inicioExistente);
      });

      const temConflito = conflitos.length > 0;
      
      return {
        ...veiculo,
        disponivel: !temConflito && veiculo.status === 'disponivel',
        motivo: temConflito ? `Reservado até ${conflitos[0].dataFim} ${conflitos[0].horaFim}` : null,
        conflitos
      };
    });
  }, [veiculos, reservas, dataProgramada, horaProgramada, duracao]);

  // Simular loading quando dados de programação mudam
  useEffect(() => {
    if (dataProgramada && horaProgramada) {
      setCarregandoDisponibilidade(true);
      const timer = setTimeout(() => {
        setCarregandoDisponibilidade(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [dataProgramada, horaProgramada]);

  const veiculosDisponiveis = veiculosComDisponibilidade.filter(v => v.disponivel);

  // Calcular hora fim
  const horaFimCalculada = useMemo(() => {
    if (!horaProgramada) return null;
    const [hora, minuto] = horaProgramada.split(':');
    const horaFim = Math.min(23, parseInt(hora) + Math.ceil(duracao));
    return String(horaFim).padStart(2, '0') + ':' + (minuto || '00');
  }, [horaProgramada, duracao]);

  // Handler para mudança de data
  const handleDataChange = (novaData: string) => {
    setDataProgramada(novaData);
  };

  // Handler para mudança de hora
  const handleHoraChange = (novaHora: string) => {
    setHoraProgramada(novaHora);
  };

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

      {/* Se não tem data/hora, mostrar aviso */}
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
          <div className="text-xs text-amber-600 dark:text-amber-400 mt-2 space-y-1">
            <div>• Data programada: {dataProgramada ? '✅' : '❌'}</div>
            <div>• Hora programada: {horaProgramada ? '✅' : '❌'}</div>
          </div>
        </div>
      )}

      {/* Se tem dados, mostrar resumo e seletor */}
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
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
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
                  const isSelected = (typeof value === 'object' && value?.veiculoId === veiculo.id) || 
                                    (typeof value === 'number' && value === veiculo.id);
                  const passageiros = veiculo.numeroPassageiros || veiculo.capacidadePassageiros || 0;

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
                      onClick={() => {
                        if (disabled) return;
                        
                        // Criar objeto de reserva completo
                        const viaturaReservada = {
                          veiculoId: parseInt(veiculo.id.toString()),
                          dataInicio: dataProgramada,
                          dataFim: dataProgramada,
                          horaInicio: horaProgramada,
                          horaFim: horaFimCalculada,
                          responsavel: entity?.responsavel || '',
                          finalidade: `Execução de OS - ${entity?.descricao?.substring(0, 50) || 'Manutenção'}`,
                          veiculo: {
                            nome: veiculo.nome,
                            placa: veiculo.placa
                          }
                        };
                        
                        onChange(viaturaReservada);
                      }}
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
                          {veiculo.marca && veiculo.modelo && (
                            <p className="text-xs text-gray-500 dark:text-gray-500">{veiculo.marca} {veiculo.modelo}</p>
                          )}
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