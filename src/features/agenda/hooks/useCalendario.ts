// src/features/agenda/hooks/useCalendario.ts
import { useState, useCallback } from 'react';
import { agendaService } from '@/services/agenda.services';
import { toast } from '@/hooks/use-toast';
import {
  VerificacaoDiaUtilResponse,
  ProximosDiasUteisResponse,
  CalendarioMesResponse
} from '@/services/agenda.services';

interface CalendarioLoadingState {
  isLoadingVerificacao: boolean;
  isLoadingProximosDias: boolean;
  isLoadingCalendarioMes: boolean;
  error?: string;
}

interface UseCalendarioResult {
  loading: CalendarioLoadingState;
  verificarDiaUtil: (data: string, plantaId?: string) => Promise<VerificacaoDiaUtilResponse | null>;
  getProximosDiasUteis: (quantidade: number, dataInicio?: string, plantaId?: string) => Promise<ProximosDiasUteisResponse | null>;
  getCalendarioMes: (ano: number, mes: number, plantaId?: string) => Promise<CalendarioMesResponse[] | null>;
}

export function useCalendario(): UseCalendarioResult {
  const [loading, setLoading] = useState<CalendarioLoadingState>({
    isLoadingVerificacao: false,
    isLoadingProximosDias: false,
    isLoadingCalendarioMes: false
  });

  // Função para verificar se um dia é útil
  const verificarDiaUtil = useCallback(async (data: string, plantaId?: string): Promise<VerificacaoDiaUtilResponse | null> => {
    try {
      setLoading(prev => ({ ...prev, isLoadingVerificacao: true, error: undefined }));

      console.log('🔍 [useCalendario] Verificando dia útil:', { data, plantaId });

      const resultado = await agendaService.verificarDiaUtil(data, plantaId);

      console.log('✅ [useCalendario] Verificação concluída:', resultado);

      return resultado;

    } catch (error) {
      console.error('❌ [useCalendario] Erro ao verificar dia útil:', error);
      setLoading(prev => ({ ...prev, error: error instanceof Error ? error.message : undefined }));

      toast({
        title: "Erro ao verificar dia útil",
        description: (error instanceof Error && error.message) || "Não foi possível verificar se o dia é útil.",
        variant: "destructive",
      });

      return null;
    } finally {
      setLoading(prev => ({ ...prev, isLoadingVerificacao: false }));
    }
  }, []);

  // Função para obter próximos dias úteis
  const getProximosDiasUteis = useCallback(async (
    quantidade: number,
    dataInicio?: string,
    plantaId?: string
  ): Promise<ProximosDiasUteisResponse | null> => {
    try {
      setLoading(prev => ({ ...prev, isLoadingProximosDias: true, error: undefined }));

      console.log('🔍 [useCalendario] Buscando próximos dias úteis:', { quantidade, dataInicio, plantaId });

      const resultado = await agendaService.getProximosDiasUteis(quantidade, dataInicio, plantaId);

      console.log('✅ [useCalendario] Próximos dias úteis encontrados:', resultado);

      return resultado;

    } catch (error) {
      console.error('❌ [useCalendario] Erro ao buscar próximos dias úteis:', error);
      setLoading(prev => ({ ...prev, error: error instanceof Error ? error.message : undefined }));

      toast({
        title: "Erro ao buscar próximos dias úteis",
        description: (error instanceof Error && error.message) || "Não foi possível buscar os próximos dias úteis.",
        variant: "destructive",
      });

      return null;
    } finally {
      setLoading(prev => ({ ...prev, isLoadingProximosDias: false }));
    }
  }, []);

  // Função para obter calendário de um mês
  const getCalendarioMes = useCallback(async (
    ano: number,
    mes: number,
    plantaId?: string
  ): Promise<CalendarioMesResponse[] | null> => {
    try {
      setLoading(prev => ({ ...prev, isLoadingCalendarioMes: true, error: undefined }));

      console.log('🔍 [useCalendario] Carregando calendário do mês:', { ano, mes, plantaId });

      const resultado = await agendaService.getCalendarioMes(ano, mes, plantaId);

      console.log('✅ [useCalendario] Calendário carregado:', resultado.length, 'dias');

      return resultado;

    } catch (error) {
      console.error('❌ [useCalendario] Erro ao carregar calendário:', error);
      setLoading(prev => ({ ...prev, error: error instanceof Error ? error.message : undefined }));

      toast({
        title: "Erro ao carregar calendário",
        description: (error instanceof Error && error.message) || "Não foi possível carregar o calendário do mês.",
        variant: "destructive",
      });

      return null;
    } finally {
      setLoading(prev => ({ ...prev, isLoadingCalendarioMes: false }));
    }
  }, []);

  return {
    loading,
    verificarDiaUtil,
    getProximosDiasUteis,
    getCalendarioMes
  };
}

// Hook específico para verificação rápida de dia útil
export function useDiaUtilQuick() {
  const { verificarDiaUtil, loading } = useCalendario();

  const verificar = useCallback(async (data: string, plantaId?: string) => {
    const resultado = await verificarDiaUtil(data, plantaId);
    return resultado?.ehDiaUtil || false;
  }, [verificarDiaUtil]);

  return {
    verificar,
    loading: loading.isLoadingVerificacao
  };
}

// Hook específico para próximos dias úteis
export function useProximosDiasUteis() {
  const { getProximosDiasUteis, loading } = useCalendario();

  const buscar = useCallback(async (
    quantidade: number = 5,
    dataInicio?: string,
    plantaId?: string
  ) => {
    const resultado = await getProximosDiasUteis(quantidade, dataInicio, plantaId);
    return resultado?.diasUteis || [];
  }, [getProximosDiasUteis]);

  return {
    buscar,
    loading: loading.isLoadingProximosDias
  };
}

// Hook específico para calendário mensal
export function useCalendarioMensal() {
  const { getCalendarioMes, loading } = useCalendario();
  const [calendarioAtual, setCalendarioAtual] = useState<CalendarioMesResponse[]>([]);

  const carregarMes = useCallback(async (
    ano: number,
    mes: number,
    plantaId?: string
  ) => {
    const resultado = await getCalendarioMes(ano, mes, plantaId);
    if (resultado) {
      setCalendarioAtual(resultado);
    }
    return resultado;
  }, [getCalendarioMes]);

  const proximoMes = useCallback(async (plantaId?: string) => {
    const hoje = new Date();
    const proximoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1);
    return carregarMes(proximoMes.getFullYear(), proximoMes.getMonth() + 1, plantaId);
  }, [carregarMes]);

  const mesAtual = useCallback(async (plantaId?: string) => {
    const hoje = new Date();
    return carregarMes(hoje.getFullYear(), hoje.getMonth() + 1, plantaId);
  }, [carregarMes]);

  return {
    calendarioAtual,
    carregarMes,
    proximoMes,
    mesAtual,
    loading: loading.isLoadingCalendarioMes
  };
}
