// src/features/anomalias/hooks/useAnomalias.ts
import { useState, useCallback } from 'react';
import { Anomalia, AnomaliaFormData } from '../types';
import { anomaliasService } from '@/services/anomalias.service';

interface UseAnomaliasReturn {
  // Estados
  loading: boolean;
  error: string | null;
  
  // Operações CRUD
  criarAnomalia: (dados: AnomaliaFormData) => Promise<Anomalia>;
  editarAnomalia: (id: string, dados: Partial<AnomaliaFormData>) => Promise<Anomalia>;
  obterAnomalia: (id: string) => Promise<Anomalia | null>;
  excluirAnomalia: (id: string) => Promise<boolean>;
  
  // Operações específicas de anomalias
  gerarOS: (anomaliaId: string) => Promise<Anomalia>;
  resolverAnomalia: (anomaliaId: string, observacoes?: string) => Promise<Anomalia>;
  cancelarAnomalia: (anomaliaId: string, motivo?: string) => Promise<Anomalia>;
  
  // Utilitários
  clearError: () => void;
  testConnection: () => Promise<boolean>;
}

export function useAnomalias(): UseAnomaliasReturn {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Função para limpar erros
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Criar anomalia
  const criarAnomalia = useCallback(async (dados: AnomaliaFormData): Promise<Anomalia> => {
    //console.log('🔄 [useAnomalias] Criando anomalia:', dados);
    
    setLoading(true);
    setError(null);
    
    try {
      const anomalia = await anomaliasService.create(dados);
      //console.log('✅ [useAnomalias] Anomalia criada com sucesso:', anomalia);
      return anomalia;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar anomalia';
      console.error('❌ [useAnomalias] Erro ao criar anomalia:', err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Editar anomalia
  const editarAnomalia = useCallback(async (id: string, dados: Partial<AnomaliaFormData>): Promise<Anomalia> => {
    //console.log('🔄 [useAnomalias] Editando anomalia:', id, dados);
    
    setLoading(true);
    setError(null);
    
    try {
      const anomalia = await anomaliasService.update(id, dados);
      //console.log('✅ [useAnomalias] Anomalia atualizada com sucesso:', anomalia);
      return anomalia;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar anomalia';
      console.error('❌ [useAnomalias] Erro ao atualizar anomalia:', err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Obter anomalia por ID
  const obterAnomalia = useCallback(async (id: string): Promise<Anomalia | null> => {
    //console.log('🔍 [useAnomalias] Buscando anomalia:', id);
    
    setLoading(true);
    setError(null);
    
    try {
      const anomalia = await anomaliasService.findOne(id);
      //console.log('✅ [useAnomalias] Anomalia encontrada:', anomalia);
      return anomalia;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar anomalia';
      console.error('❌ [useAnomalias] Erro ao buscar anomalia:', err);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Excluir anomalia
  const excluirAnomalia = useCallback(async (id: string): Promise<boolean> => {
    //('🗑️ [useAnomalias] Removendo anomalia:', id);
    
    setLoading(true);
    setError(null);
    
    try {
      await anomaliasService.remove(id);
      //console.log('✅ [useAnomalias] Anomalia removida com sucesso');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir anomalia';
      console.error('❌ [useAnomalias] Erro ao excluir anomalia:', err);
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Gerar OS
  const gerarOS = useCallback(async (anomaliaId: string): Promise<Anomalia> => {
    //console.log('🔧 [useAnomalias] Gerando OS para anomalia:', anomaliaId);
    
    setLoading(true);
    setError(null);
    
    try {
      const anomalia = await anomaliasService.gerarOS(anomaliaId);
      //console.log('✅ [useAnomalias] OS gerada com sucesso:', anomalia);
      return anomalia;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao gerar OS';
      console.error('❌ [useAnomalias] Erro ao gerar OS:', err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Resolver anomalia
  const resolverAnomalia = useCallback(async (anomaliaId: string, observacoes?: string): Promise<Anomalia> => {
    //console.log('✅ [useAnomalias] Resolvendo anomalia:', anomaliaId, observacoes);
    
    setLoading(true);
    setError(null);
    
    try {
      const anomalia = await anomaliasService.resolver(anomaliaId, observacoes);
      //console.log('✅ [useAnomalias] Anomalia resolvida com sucesso:', anomalia);
      return anomalia;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao resolver anomalia';
      console.error('❌ [useAnomalias] Erro ao resolver anomalia:', err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cancelar anomalia
  const cancelarAnomalia = useCallback(async (anomaliaId: string, motivo?: string): Promise<Anomalia> => {
    //console.log('❌ [useAnomalias] Cancelando anomalia:', anomaliaId, motivo);
    
    setLoading(true);
    setError(null);
    
    try {
      const anomalia = await anomaliasService.cancelar(anomaliaId, motivo);
      //console.log('❌ [useAnomalias] Anomalia cancelada com sucesso:', anomalia);
      return anomalia;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao cancelar anomalia';
      console.error('❌ [useAnomalias] Erro ao cancelar anomalia:', err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Testar conexão com a API
  const testConnection = useCallback(async (): Promise<boolean> => {
    //console.log('🧪 [useAnomalias] Testando conexão com API...');
    
    try {
      const isConnected = await anomaliasService.testConnection();
      //console.log(isConnected ? '✅ [useAnomalias] API disponível' : '❌ [useAnomalias] API indisponível');
      return isConnected;
    } catch (err) {
      console.error('❌ [useAnomalias] Erro ao testar conexão:', err);
      return false;
    }
  }, []);

  return {
    // Estados
    loading,
    error,
    
    // Operações CRUD
    criarAnomalia,
    editarAnomalia,
    obterAnomalia,
    excluirAnomalia,
    
    // Operações específicas
    gerarOS,
    resolverAnomalia,
    cancelarAnomalia,
    
    // Utilitários
    clearError,
    testConnection,
  };
}