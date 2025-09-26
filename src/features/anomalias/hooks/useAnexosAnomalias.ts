// src/features/anomalias/hooks/useAnexosAnomalias.ts - VERSÃO LIMPA
import { useState, useCallback } from 'react';
import { 
  AnexoAnomaliaResponse, 
  AnexoUploadProgress,
  validarTipoArquivo,
  validarTamanhoArquivo
} from '../types/anexos';
import { anexosAnomaliasService } from '@/services/anexos-anomalias.service';

interface UseAnexosAnomaliasReturn {
  // Estados
  anexos: AnexoAnomaliaResponse[];
  loading: boolean;
  uploading: boolean;
  error: string | null;
  uploadProgress: AnexoUploadProgress[];

  // Operações
  listarAnexos: (anomaliaId: string) => Promise<void>;
  uploadAnexo: (anomaliaId: string, file: File, descricao?: string) => Promise<AnexoAnomaliaResponse>;
  downloadAnexo: (anexoId: string) => Promise<void>;
  removerAnexo: (anexoId: string) => Promise<boolean>;
  
  // Utilitários
  clearError: () => void;
  validarArquivo: (file: File) => { valido: boolean; erro?: string };
}

export function useAnexosAnomalias(): UseAnexosAnomaliasReturn {
  const [anexos, setAnexos] = useState<AnexoAnomaliaResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<AnexoUploadProgress[]>([]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const validarArquivo = useCallback((file: File): { valido: boolean; erro?: string } => {
    if (!file) {
      return { valido: false, erro: 'Arquivo é obrigatório' };
    }

    if (!validarTipoArquivo(file.name)) {
      return { valido: false, erro: 'Tipo de arquivo não permitido' };
    }

    if (!validarTamanhoArquivo(file.size)) {
      return { valido: false, erro: 'Arquivo muito grande (máximo 10MB)' };
    }

    return { valido: true };
  }, []);

  const listarAnexos = useCallback(async (anomaliaId: string) => {
    const cleanAnomaliaId = anomaliaId?.toString().trim();
    
    if (!cleanAnomaliaId) {
      setAnexos([]);
      setError('ID da anomalia não fornecido');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const anexosEncontrados = await anexosAnomaliasService.listarAnexos(cleanAnomaliaId);
      
      const anexosSanitizados = (anexosEncontrados || []).map(anexo => ({
        ...anexo,
        id: anexo.id?.toString().trim() || '',
        nome: anexo.nome?.toString().trim() || '',
        nome_original: anexo.nome_original?.toString().trim() || '',
        tipo: anexo.tipo?.toString().trim() || '',
        anomalia_id: anexo.anomalia_id?.toString().trim() || '',
      }));
      
      setAnexos(anexosSanitizados);
      
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao carregar anexos';
      setError(errorMessage);
      setAnexos([]);
      
      if (err.response?.status === 404) {
        setError(null);
      }
      
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadAnexo = useCallback(async (
    anomaliaId: string, 
    file: File, 
    descricao?: string
  ): Promise<AnexoAnomaliaResponse> => {
    const cleanAnomaliaId = anomaliaId?.toString().trim();

    const validacao = validarArquivo(file);
    if (!validacao.valido) {
      const erro = new Error(validacao.erro || 'Arquivo inválido');
      setError(erro.message);
      throw erro;
    }

    setUploading(true);
    setError(null);

    const progressId = `${Date.now()}-${Math.random()}`;
    const progressItem: AnexoUploadProgress = {
      id: progressId,
      nome_original: file.name,
      tamanho: file.size,
      progress: 0,
      status: 'uploading'
    };

    setUploadProgress(prev => [...prev, progressItem]);

    try {
      const anexo = await anexosAnomaliasService.uploadAnexo(
        cleanAnomaliaId,
        file,
        descricao,
        (progress) => {
          setUploadProgress(prev => 
            prev.map(item => 
              item.id === progressId 
                ? { ...item, progress }
                : item
            )
          );
        }
      );

      setUploadProgress(prev => 
        prev.map(item => 
          item.id === progressId 
            ? { ...item, progress: 100, status: 'completed' }
            : item
        )
      );

      setAnexos(prev => [...prev, anexo]);
      return anexo;

    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Erro no upload';
      
      setUploadProgress(prev => 
        prev.map(item => 
          item.id === progressId 
            ? { ...item, status: 'error', error: errorMessage }
            : item
        )
      );

      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setUploading(false);
      
      setTimeout(() => {
        setUploadProgress(prev => prev.filter(item => item.id !== progressId));
      }, 3000);
    }
  }, [validarArquivo]);

  const downloadAnexo = useCallback(async (anexoId: string) => {
    const cleanAnexoId = anexoId?.toString().trim();
    setError(null);
    
    try {
      await anexosAnomaliasService.downloadAnexo(cleanAnexoId);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Erro no download';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const removerAnexo = useCallback(async (anexoId: string): Promise<boolean> => {
    const cleanAnexoId = anexoId?.toString().trim();
    setError(null);
    
    try {
      await anexosAnomaliasService.removerAnexo(cleanAnexoId);
      setAnexos(prev => prev.filter(anexo => anexo.id?.trim() !== cleanAnexoId));
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao remover anexo';
      setError(errorMessage);
      return false;
    }
  }, []);

  return {
    anexos,
    loading,
    uploading,
    error,
    uploadProgress,
    listarAnexos,
    uploadAnexo,
    downloadAnexo,
    removerAnexo,
    clearError,
    validarArquivo,
  };
}