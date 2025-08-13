// src/features/reservas/components/VeiculoSelector.tsx
import { useMemo } from 'react';
import { Car, Users, Fuel, AlertTriangle, CheckCircle } from 'lucide-react';
import { Veiculo, ReservaVeiculo, FiltrosDisponibilidade } from '../types';

interface VeiculoSelectorProps {
  veiculos: Veiculo[];
  reservas: ReservaVeiculo[];
  filtrosDisponibilidade: FiltrosDisponibilidade;
  veiculoSelecionado?: number;
  onVeiculoChange: (veiculoId: number) => void;
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
  
  // Verifica disponibilidade de cada veículo
  const veiculosComDisponibilidade = useMemo(() => {
    return veiculos.map(veiculo => {
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

        // Verifica se é o mesmo veículo
        if (reserva.veiculoId !== parseInt(veiculo.id.toString())) {
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

  if (!filtrosDisponibilidade.dataInicio || !filtrosDisponibilidade.dataFim) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-center gap-2 text-amber-700">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm">Selecione as datas para verificar disponibilidade dos veículos</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumo da disponibilidade */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-600">
          Período: {filtrosDisponibilidade.dataInicio} a {filtrosDisponibilidade.dataFim}
          {filtrosDisponibilidade.horaInicio && filtrosDisponibilidade.horaFim && (
            <span> ({filtrosDisponibilidade.horaInicio} às {filtrosDisponibilidade.horaFim})</span>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-green-600 font-medium">
            {veiculosDisponiveis.length} disponíveis
          </span>
          <span className="text-red-600">
            {veiculosIndisponiveis.length} indisponíveis
          </span>
        </div>
      </div>

      {/* Lista de veículos */}
      <div className="grid gap-3 max-h-96 overflow-y-auto">
        {veiculosOrdenados.map((veiculo) => (
          <div
            key={veiculo.id}
            className={`
              p-4 border-2 rounded-lg cursor-pointer transition-all
              ${veiculo.disponivel 
                ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50' 
                : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-75'
              }
              ${veiculoSelecionado === parseInt(veiculo.id.toString()) 
                ? 'border-blue-500 bg-blue-50' 
                : ''
              }
            `}
            onClick={() => {
              if (veiculo.disponivel && !disabled) {
                onVeiculoChange(parseInt(veiculo.id.toString()));
              }
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <Car className={`w-6 h-6 mt-1 ${veiculo.disponivel ? 'text-blue-600' : 'text-gray-400'}`} />
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">{veiculo.nome}</h3>
                    {veiculo.disponivel ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600 mt-1">
                    {veiculo.marca} {veiculo.modelo} • {veiculo.placa}
                  </div>
                  
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{veiculo.numeroPassageiros || veiculo.capacidadePassageiros} passageiros</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Fuel className="w-3 h-3" />
                      <span className="capitalize">{veiculo.tipoCombustivel}</span>
                    </div>
                    {veiculo.valorDiaria && (
                      <span className="font-medium text-green-600">
                        R$ {veiculo.valorDiaria.toFixed(2)}/dia
                      </span>
                    )}
                  </div>

                  {!veiculo.disponivel && veiculo.motivo && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                      {veiculo.motivo}
                    </div>
                  )}
                </div>
              </div>
              
              {veiculoSelecionado === parseInt(veiculo.id.toString()) && (
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {veiculosOrdenados.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          <Car className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Nenhum veículo encontrado</p>
        </div>
      )}
    </div>
  );
}