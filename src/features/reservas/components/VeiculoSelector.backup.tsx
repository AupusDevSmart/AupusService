// src/features/reservas/components/VeiculoSelector.tsx
import { useMemo } from 'react';
import { Car, Users, Fuel, AlertTriangle, CheckCircle } from 'lucide-react';
import { Veiculo, ReservaVeiculo, FiltrosDisponibilidade } from '../types';

interface VeiculoSelectorProps {
  veiculos: Veiculo[];
  reservas: ReservaVeiculo[];
  filtrosDisponibilidade: FiltrosDisponibilidade;
  veiculoSelecionado?: string; // APENAS STRING
  onVeiculoChange: (veiculoId: string) => void; // APENAS STRING
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
  
  console.log('🚗 [VEICULO SELECTOR] Props recebidas:', {
    veiculosCount: veiculos.length,
    veiculosIds: veiculos.map(v => ({ id: v.id, tipo: typeof v.id, nome: v.nome })),
    reservasCount: reservas.length,
    filtrosDisponibilidade,
    veiculoSelecionado,
    veiculoSelecionadoTipo: typeof veiculoSelecionado,
    disabled
  });

  // Verifica disponibilidade de cada veículo
  const veiculosComDisponibilidade = useMemo(() => {
    console.log('🔍 [VEICULO SELECTOR] Calculando disponibilidade...');
    
    const resultado = veiculos.map(veiculo => {
      console.log(`🔍 [VEICULO SELECTOR] Processando veículo ID: ${veiculo.id} (tipo: ${typeof veiculo.id}) - ${veiculo.nome}`);
      
      // Trabalhar apenas com strings - não converter
      const veiculoId = veiculo.id;
      
      // Veículos inativos ou em manutenção não estão disponíveis
      if (veiculo.status === 'inativo' || veiculo.status === 'manutencao') {
        console.log(`❌ [VEICULO SELECTOR] Veículo ${veiculoId} indisponível: ${veiculo.status}`);
        return {
          ...veiculo,
          disponivel: false,
          motivo: veiculo.status === 'inativo' ? 'Veículo inativo' : 'Em manutenção'
        };
      }

      // Se não há filtros de data, considera disponível
      if (!filtrosDisponibilidade.dataInicio || !filtrosDisponibilidade.dataFim) {
        console.log(`⚠️ [VEICULO SELECTOR] Veículo ${veiculoId} - sem filtros de data, considerando disponível`);
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
      
      console.log(`${temConflito ? '🔴' : '🟢'} [VEICULO SELECTOR] Veículo ${veiculoId}: ${temConflito ? 'INDISPONÍVEL' : 'DISPONÍVEL'} - conflitos: ${conflitos.length}`);
      
      return {
        ...veiculo,
        disponivel: !temConflito,
        motivo: temConflito ? `Reservado até ${conflitos[0].dataFim} ${conflitos[0].horaFim}` : null,
        conflitos
      };
    });
    
    console.log('✅ [VEICULO SELECTOR] Cálculo finalizado:', {
      disponiveis: resultado.filter(v => v.disponivel).length,
      indisponiveis: resultado.filter(v => !v.disponivel).length
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

  // Handler para seleção de veículo
  const handleVeiculoClick = (veiculo: any) => {
    if (!veiculo.disponivel || disabled) {
      console.log('🚫 [VEICULO SELECTOR] Clique ignorado - veículo indisponível ou componente desabilitado');
      return;
    }

    // ID é uma string, usar diretamente
    const veiculoId = veiculo.id;
    
    console.log(`🖱️ [VEICULO SELECTOR] Veículo clicado: ${veiculoId} (${veiculo.nome})`);
    console.log(`🔄 [VEICULO SELECTOR] Chamando onVeiculoChange com:`, veiculoId);
    
    onVeiculoChange(veiculoId);
  };

  // Função para verificar se o veículo está selecionado
  const isVeiculoSelecionado = (veiculo: any): boolean => {
    // Comparar strings diretamente
    const veiculoId = veiculo.id.toString();
    const selecionado = veiculoSelecionado?.toString();
    
    const selected = veiculoId === selecionado;
    
    if (selected) {
      console.log(`✅ [VEICULO SELECTOR] Veículo ${veiculoId} está SELECIONADO`);
    }
    
    return selected;
  };

  if (!filtrosDisponibilidade.dataInicio || !filtrosDisponibilidade.dataFim) {
    return (
      <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm">Selecione as datas para verificar disponibilidade dos veículos</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Debug info - apenas em desenvolvimento */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 p-3 rounded text-xs">
          <strong className="text-blue-900 dark:text-blue-100">Debug:</strong> 
          <span className="text-blue-700 dark:text-blue-300">
            Veículo selecionado: {veiculoSelecionado} | 
            Disponíveis: {veiculosDisponiveis.length} | 
            Total: {veiculos.length}
          </span>
        </div>
      )}

      {/* Resumo da disponibilidade */}
      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-600 dark:text-gray-300">
          Período: {filtrosDisponibilidade.dataInicio} a {filtrosDisponibilidade.dataFim}
          {filtrosDisponibilidade.horaInicio && filtrosDisponibilidade.horaFim && (
            <span> ({filtrosDisponibilidade.horaInicio} às {filtrosDisponibilidade.horaFim})</span>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-green-600 dark:text-green-400 font-medium">
            {veiculosDisponiveis.length} disponíveis
          </span>
          <span className="text-red-600 dark:text-red-400">
            {veiculosIndisponiveis.length} indisponíveis
          </span>
        </div>
      </div>

      {/* Lista de veículos */}
      <div className="grid gap-3 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
        {veiculosOrdenados.map((veiculo) => {
          const isSelected = isVeiculoSelecionado(veiculo);
          
          return (
            <div
              key={veiculo.id}
              className={`
                p-4 border-2 rounded-lg cursor-pointer transition-all relative
                ${veiculo.disponivel 
                  ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20' 
                  : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 cursor-not-allowed opacity-75'
                }
                ${isSelected 
                  ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-950/30 ring-2 ring-blue-200 dark:ring-blue-800' 
                  : ''
                }
              `}
              onClick={() => handleVeiculoClick(veiculo)}
            >
              {/* Indicador visual de seleção */}
              {isSelected && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 dark:bg-blue-400 rounded-full flex items-center justify-center shadow-md">
                  <CheckCircle className="w-4 h-4 text-white dark:text-gray-900" />
                </div>
              )}

              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <Car className={`w-6 h-6 mt-1 ${
                    veiculo.disponivel 
                      ? (isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-blue-600 dark:text-blue-400') 
                      : 'text-gray-400 dark:text-gray-600'
                  }`} />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-medium ${
                        isSelected 
                          ? 'text-blue-900 dark:text-blue-100' 
                          : 'text-gray-900 dark:text-gray-100'
                      }`}>
                        {veiculo.nome}
                      </h3>
                      {veiculo.disponivel ? (
                        <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-500 dark:text-red-400" />
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {veiculo.marca} {veiculo.modelo} • {veiculo.placa}
                    </div>
                    
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{veiculo.capacidadePassageiros || 0} passageiros</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Fuel className="w-3 h-3" />
                        <span className="capitalize">{veiculo.tipoCombustivel}</span>
                      </div>
                      {veiculo.valorDiaria && (
                        <span className="font-medium text-green-600 dark:text-green-400">
                          R$ {veiculo.valorDiaria.toFixed(2)}/dia
                        </span>
                      )}
                    </div>

                    {!veiculo.disponivel && veiculo.motivo && (
                      <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300">
                        {veiculo.motivo}
                      </div>
                    )}
                  </div>
                </div>
                
                {isSelected && (
                  <div className="w-4 h-4 bg-blue-500 dark:bg-blue-400 rounded-full flex items-center justify-center ml-2 shadow-sm">
                    <div className="w-2 h-2 bg-white dark:bg-gray-900 rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {veiculosOrdenados.length === 0 && (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          <Car className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p>Nenhum veículo encontrado</p>
        </div>
      )}
    </div>
  );
}