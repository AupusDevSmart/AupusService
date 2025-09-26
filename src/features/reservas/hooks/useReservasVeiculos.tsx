// src/features/reservas/hooks/useReservasVeiculos.ts
import { useState, useCallback } from 'react';
import { 
  ReservaVeiculo, 
  ReservaFormData, 
  FiltrosDisponibilidade, 
  DisponibilidadeVeiculo,
  TipoSolicitante 
} from '../types';
// Mock data removed - using API now

interface UseReservasVeiculosReturn {
  // Estados
  loading: boolean;
  reservas: ReservaVeiculo[];
  
  // Core - Disponibilidade
  verificarDisponibilidade: (veiculoIds: number[], filtros: FiltrosDisponibilidade) => Promise<DisponibilidadeVeiculo[]>;
  obterVeiculosDisponiveis: (filtros: FiltrosDisponibilidade) => Promise<number[]>;
  
  // CRUD - Reservas
  criarReserva: (dados: ReservaFormData) => Promise<ReservaVeiculo>;
  editarReserva: (id: string, dados: Partial<ReservaFormData>) => Promise<ReservaVeiculo>;
  cancelarReserva: (id: string, motivo: string) => Promise<ReservaVeiculo>;
  finalizarReserva: (id: string, observacoes?: string, kmFinal?: number) => Promise<ReservaVeiculo>;
  
  // Integração - Automática
  criarReservaAutomatica: (solicitanteId: string, dadosReserva: any) => Promise<ReservaVeiculo | null>;
  liberarReservaAutomatica: (solicitanteId: string) => Promise<boolean>;
  
  // Utilitários
  validarPeriodoReserva: (dataInicio: string, dataFim: string, horaInicio: string, horaFim: string) => string | null;
  obterReservaPorSolicitante: (solicitanteId: string, tipo: TipoSolicitante) => ReservaVeiculo | null;
  calcularCustoReserva: (veiculoId: number, dataInicio: string, dataFim: string) => number;
}

export const useReservasVeiculos = (): UseReservasVeiculosReturn => {
  const [loading, setLoading] = useState(false);
  const [reservasState, setReservasState] = useState<ReservaVeiculo[]>([]);
  const [veiculosState] = useState<any[]>([]);

  // Função para verificar sobreposição de períodos
  const verificarSobreposicao = useCallback((
    inicio1: string, fim1: string, horaInicio1: string, horaFim1: string,
    inicio2: string, fim2: string, horaInicio2: string, horaFim2: string
  ): boolean => {
    const dataHoraInicio1 = new Date(`${inicio1}T${horaInicio1}:00`);
    const dataHoraFim1 = new Date(`${fim1}T${horaFim1}:00`);
    const dataHoraInicio2 = new Date(`${inicio2}T${horaInicio2}:00`);
    const dataHoraFim2 = new Date(`${fim2}T${horaFim2}:00`);

    return dataHoraInicio1 < dataHoraFim2 && dataHoraInicio2 < dataHoraFim1;
  }, []);

  // Validar período de reserva
  const validarPeriodoReserva = useCallback((
    dataInicio: string, 
    dataFim: string, 
    horaInicio: string, 
    horaFim: string
  ): string | null => {
    const agora = new Date();
    const inicioReserva = new Date(`${dataInicio}T${horaInicio}:00`);
    const fimReserva = new Date(`${dataFim}T${horaFim}:00`);

    // Verificar se é no passado
    if (inicioReserva < agora) {
      return 'A data/hora de início não pode ser no passado';
    }

    // Verificar se fim é após início
    if (fimReserva <= inicioReserva) {
      return 'A data/hora de fim deve ser posterior ao início';
    }

    // Verificar duração mínima (30 minutos)
    const duracaoMs = fimReserva.getTime() - inicioReserva.getTime();
    const duracaoMinutos = duracaoMs / (1000 * 60);
    if (duracaoMinutos < 30) {
      return 'A duração mínima da reserva é de 30 minutos';
    }

    // Verificar duração máxima (30 dias)
    const duracaoDias = duracaoMs / (1000 * 60 * 60 * 24);
    if (duracaoDias > 30) {
      return 'A duração máxima da reserva é de 30 dias';
    }

    return null;
  }, []);

  // Verificar disponibilidade de veículos específicos
  const verificarDisponibilidade = useCallback(async (
    veiculoIds: number[], 
    filtros: FiltrosDisponibilidade
  ): Promise<DisponibilidadeVeiculo[]> => {
    setLoading(true);
    
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const resultado: DisponibilidadeVeiculo[] = [];

      for (const veiculoId of veiculoIds) {
        const veiculo = veiculosState.find((v: any) => v.id === veiculoId);
        
        // Verificar se veículo existe e está disponível
        if (!veiculo || veiculo.status !== 'disponivel') {
          resultado.push({
            veiculoId,
            disponivel: false,
            conflitos: [],
          });
          continue;
        }

        // Buscar reservas ativas no período
        const reservasAtivas = reservasState.filter(r => 
          r.veiculoId === veiculoId && 
          r.status === 'ativa' &&
          r.id.toString() !== filtros.excluirReservaId
        );

        // Verificar conflitos
        const conflitos = reservasAtivas.filter(reserva => 
          verificarSobreposicao(
            filtros.dataInicio, filtros.dataFim, 
            filtros.horaInicio || '00:00', filtros.horaFim || '23:59',
            reserva.dataInicio, reserva.dataFim, 
            reserva.horaInicio, reserva.horaFim
          )
        );

        const disponivel = conflitos.length === 0;
        
        // Calcular próxima disponibilidade se houver conflito
        let proximaDisponibilidade;
        if (!disponivel && conflitos.length > 0) {
          const proximoFim = conflitos
            .map(c => new Date(`${c.dataFim}T${c.horaFim}:00`))
            .sort((a, b) => a.getTime() - b.getTime())[0];
          
          proximaDisponibilidade = {
            dataInicio: proximoFim.toISOString().split('T')[0],
            horaInicio: proximoFim.toTimeString().slice(0,5)
          };
        }

        resultado.push({
          veiculoId,
          disponivel,
          conflitos,
          proximaDisponibilidade
        });
      }

      return resultado;
    } finally {
      setLoading(false);
    }
  }, [reservasState, verificarSobreposicao]);

  // Obter apenas IDs dos veículos disponíveis
  const obterVeiculosDisponiveis = useCallback(async (
    filtros: FiltrosDisponibilidade
  ): Promise<number[]> => {
    const veiculosAtivos = veiculosState
      .filter((v: any) => v.status === 'disponivel')
      .map((v: any) => v.id);

    const disponibilidades = await verificarDisponibilidade(veiculosAtivos, filtros);
    
    return disponibilidades
      .filter(d => d.disponivel)
      .map(d => d.veiculoId);
  }, [verificarDisponibilidade]);

  // Criar nova reserva
  const criarReserva = useCallback(async (dados: ReservaFormData): Promise<ReservaVeiculo> => {
    setLoading(true);
    
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      // Validar se veiculoId foi fornecido
      if (!dados.veiculoId) {
        throw new Error('Veículo deve ser selecionado');
      }

      // Validar período
      const erroValidacao = validarPeriodoReserva(
        dados.dataInicio, dados.dataFim, 
        dados.horaInicio, dados.horaFim
      );
      
      if (erroValidacao) {
        throw new Error(erroValidacao);
      }

      // Verificar disponibilidade
      const disponibilidades = await verificarDisponibilidade([dados.veiculoId], {
        dataInicio: dados.dataInicio,
        dataFim: dados.dataFim,
        horaInicio: dados.horaInicio,
        horaFim: dados.horaFim
      });

      if (!disponibilidades[0]?.disponivel) {
        throw new Error('Veículo não está disponível no período solicitado');
      }

      // Criar nova reserva
      const novaReserva: ReservaVeiculo = {
        id: Date.now().toString(),
        criadoEm: new Date().toISOString(),
        ...dados,
        veiculoId: dados.veiculoId, // TypeScript agora sabe que não é undefined por causa da validação acima
        status: 'ativa',
        criadoPor: 'Usuário Atual', // Em produção, viria do contexto de auth
        dataReserva: new Date().toISOString().split('T')[0]
      };

      setReservasState(prev => [...prev, novaReserva]);
      return novaReserva;
    } finally {
      setLoading(false);
    }
  }, [validarPeriodoReserva, verificarDisponibilidade]);

  // Editar reserva existente
  const editarReserva = useCallback(async (
    id: string, 
    dados: Partial<ReservaFormData>
  ): Promise<ReservaVeiculo> => {
    setLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 600));

    try {
      const reservaAtual = reservasState.find(r => r.id.toString() === id);
      if (!reservaAtual) {
        throw new Error('Reserva não encontrada');
      }

      if (reservaAtual.status !== 'ativa') {
        throw new Error('Apenas reservas ativas podem ser editadas');
      }

      // Se mudou dados de período ou veículo, validar novamente
      if (dados.dataInicio || dados.dataFim || dados.horaInicio || dados.horaFim || dados.veiculoId) {
        const novosDados = { ...reservaAtual, ...dados };
        
        const erroValidacao = validarPeriodoReserva(
          novosDados.dataInicio, novosDados.dataFim, 
          novosDados.horaInicio, novosDados.horaFim
        );
        
        if (erroValidacao) {
          throw new Error(erroValidacao);
        }

        // Verificar se veiculoId está definido
        if (!novosDados.veiculoId) {
          throw new Error('Veículo deve ser selecionado');
        }

        // Verificar disponibilidade excluindo a reserva atual
        const disponibilidades = await verificarDisponibilidade([novosDados.veiculoId], {
          dataInicio: novosDados.dataInicio,
          dataFim: novosDados.dataFim,
          horaInicio: novosDados.horaInicio,
          horaFim: novosDados.horaFim,
          excluirReservaId: id
        });

        if (!disponibilidades[0]?.disponivel) {
          throw new Error('Veículo não está disponível no novo período solicitado');
        }
      }

      // Atualizar reserva
      const reservaAtualizada = { ...reservaAtual, ...dados };
      
      setReservasState(prev => 
        prev.map(r => r.id.toString() === id ? reservaAtualizada : r)
      );

      return reservaAtualizada;
    } finally {
      setLoading(false);
    }
  }, [reservasState, validarPeriodoReserva, verificarDisponibilidade]);

  // Cancelar reserva
  const cancelarReserva = useCallback(async (
    id: string, 
    motivo: string
  ): Promise<ReservaVeiculo> => {
    setLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 400));

    try {
      const reserva = reservasState.find(r => r.id.toString() === id);
      if (!reserva) {
        throw new Error('Reserva não encontrada');
      }

      if (reserva.status !== 'ativa') {
        throw new Error('Apenas reservas ativas podem ser canceladas');
      }

      const reservaCancelada = {
        ...reserva,
        status: 'cancelada' as const,
        motivoCancelamento: motivo,
        dataCancelamento: new Date().toISOString().split('T')[0]
      };

      setReservasState(prev => 
        prev.map(r => r.id.toString() === id ? reservaCancelada : r)
      );

      return reservaCancelada;
    } finally {
      setLoading(false);
    }
  }, [reservasState]);

  // Finalizar reserva
  const finalizarReserva = useCallback(async (
    id: string, 
    observacoes?: string, 
    kmFinal?: number
  ): Promise<ReservaVeiculo> => {
    setLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 400));

    try {
      const reserva = reservasState.find(r => r.id.toString() === id);
      if (!reserva) {
        throw new Error('Reserva não encontrada');
      }

      if (reserva.status !== 'ativa') {
        throw new Error('Apenas reservas ativas podem ser finalizadas');
      }

      const reservaFinalizada = {
        ...reserva,
        status: 'finalizada' as const,
        observacoesFinalizacao: observacoes,
        kmFinal
      };

      setReservasState(prev => 
        prev.map(r => r.id.toString() === id ? reservaFinalizada : r)
      );

      return reservaFinalizada;
    } finally {
      setLoading(false);
    }
  }, [reservasState]);

  // Criar reserva automática (para integração com OS, viagens, etc.)
  const criarReservaAutomatica = useCallback(async (
    solicitanteId: string, 
    dadosReserva: any
  ): Promise<ReservaVeiculo | null> => {
    try {
      const dadosCompletos: ReservaFormData = {
        veiculoId: dadosReserva.viatura.veiculoId,
        solicitanteId,
        tipoSolicitante: dadosReserva.tipo,
        dataInicio: dadosReserva.viatura.dataInicio,
        dataFim: dadosReserva.viatura.dataFim,
        horaInicio: dadosReserva.viatura.horaInicio,
        horaFim: dadosReserva.viatura.horaFim,
        responsavel: dadosReserva.responsavel,
        finalidade: dadosReserva.viatura.finalidade || `Reserva automática para ${solicitanteId}`,
        observacoes: `Reserva criada automaticamente pelo sistema`
      };

      return await criarReserva(dadosCompletos);
    } catch (error) {
      console.error('Erro ao criar reserva automática:', error);
      return null;
    }
  }, [criarReserva]);

  // Liberar reserva automática
  const liberarReservaAutomatica = useCallback(async (
    solicitanteId: string
  ): Promise<boolean> => {
    try {
      const reserva = reservasState.find(r => 
        r.solicitanteId === solicitanteId && r.status === 'ativa'
      );

      if (reserva) {
        await cancelarReserva(reserva.id.toString(), 'Liberação automática pelo sistema');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erro ao liberar reserva automática:', error);
      return false;
    }
  }, [reservasState, cancelarReserva]);

  // Obter reserva por solicitante
  const obterReservaPorSolicitante = useCallback((
    solicitanteId: string, 
    tipo: TipoSolicitante
  ): ReservaVeiculo | null => {
    return reservasState.find(r => 
      r.solicitanteId === solicitanteId && 
      r.tipoSolicitante === tipo && 
      r.status === 'ativa'
    ) || null;
  }, [reservasState]);

  // Calcular custo da reserva
  const calcularCustoReserva = useCallback((
    veiculoId: number, 
    dataInicio: string, 
    dataFim: string
  ): number => {
    const veiculo = veiculosState.find((v: any) => v.id === veiculoId);
    if (!veiculo || !veiculo.valorDiaria) return 0;

    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    const diasReserva = Math.ceil((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) || 1;
    
    return diasReserva * veiculo.valorDiaria;
  }, []);

  return {
    loading,
    reservas: reservasState,
    verificarDisponibilidade,
    obterVeiculosDisponiveis,
    criarReserva,
    editarReserva,
    cancelarReserva,
    finalizarReserva,
    criarReservaAutomatica,
    liberarReservaAutomatica,
    validarPeriodoReserva,
    obterReservaPorSolicitante,
    calcularCustoReserva
  };
};