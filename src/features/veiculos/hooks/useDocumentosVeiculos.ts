// src/features/veiculos/hooks/useDocumentosVeiculos.ts
import { useState, useCallback } from 'react';
import { documentosVeiculosService } from '@/services/documentos-veiculos.service';
import {
  DocumentoVeiculoResponse,
  UploadDocumentoDto
} from '../types/documentos';

interface UseDocumentosVeiculosReturn {
  // Estado
  documentos: DocumentoVeiculoResponse[];
  loading: boolean;
  uploading: boolean;
  uploadProgress: number;
  error: string | null;

  // Ações
  listarDocumentos: (veiculoId: number) => Promise<void>;
  uploadDocumento: (veiculoId: number, uploadData: UploadDocumentoDto) => Promise<DocumentoVeiculoResponse>;
  downloadDocumento: (veiculoId: number, documentoId: string) => Promise<void>;
  removerDocumento: (veiculoId: number, documentoId: string) => Promise<void>;

  // Utilitários
  clearError: () => void;
  resetUploadProgress: () => void;
}

export const useDocumentosVeiculos = (): UseDocumentosVeiculosReturn => {
  // Estados
  const [documentos, setDocumentos] = useState<DocumentoVeiculoResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Limpar erro
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Reset do progresso de upload
  const resetUploadProgress = useCallback(() => {
    setUploadProgress(0);
  }, []);

  // Listar documentos de um veículo
  const listarDocumentos = useCallback(async (veiculoId: number) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 [useDocumentosVeiculos] Carregando documentos do veículo:', veiculoId);

      const documentosCarregados = await documentosVeiculosService.listarDocumentos(veiculoId);

      console.log('✅ [useDocumentosVeiculos] Documentos carregados:', documentosCarregados.length);
      setDocumentos(documentosCarregados);
    } catch (err: any) {
      const errorMessage = err?.message || 'Erro ao carregar documentos';
      console.error('❌ [useDocumentosVeiculos] Erro ao carregar documentos:', err);
      setError(errorMessage);
      setDocumentos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Upload de documento
  const uploadDocumento = useCallback(async (
    veiculoId: number,
    uploadData: UploadDocumentoDto
  ): Promise<DocumentoVeiculoResponse> => {
    try {
      setUploading(true);
      setUploadProgress(0);
      setError(null);

      console.log('📤 [useDocumentosVeiculos] Iniciando upload:', {
        veiculoId,
        fileName: uploadData.file.name,
        categoria: uploadData.categoria
      });

      const novoDocumento = await documentosVeiculosService.uploadDocumento(
        veiculoId,
        uploadData,
        (progress) => {
          setUploadProgress(progress);
        }
      );

      console.log('✅ [useDocumentosVeiculos] Upload concluído:', novoDocumento);

      // Adicionar à lista local
      setDocumentos(prev => [novoDocumento, ...prev]);

      return novoDocumento;
    } catch (err: any) {
      const errorMessage = err?.message || 'Erro ao fazer upload do documento';
      console.error('❌ [useDocumentosVeiculos] Erro no upload:', err);
      setError(errorMessage);
      throw err;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, []);

  // Download de documento
  const downloadDocumento = useCallback(async (veiculoId: number, documentoId: string) => {
    try {
      setError(null);

      console.log('⬇️ [useDocumentosVeiculos] Iniciando download:', { veiculoId, documentoId });
      await documentosVeiculosService.downloadDocumento(veiculoId, documentoId);

      console.log('✅ [useDocumentosVeiculos] Download concluído');
    } catch (err: any) {
      const errorMessage = err?.message || 'Erro ao fazer download do documento';
      console.error('❌ [useDocumentosVeiculos] Erro no download:', err);
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Remover documento
  const removerDocumento = useCallback(async (veiculoId: number, documentoId: string) => {
    try {
      setError(null);

      console.log('🗑️ [useDocumentosVeiculos] Removendo documento:', { veiculoId, documentoId });
      await documentosVeiculosService.removerDocumento(veiculoId, documentoId);

      // Remover da lista local
      setDocumentos(prev => prev.filter(doc => doc.id !== documentoId));

      console.log('✅ [useDocumentosVeiculos] Documento removido');
    } catch (err: any) {
      const errorMessage = err?.message || 'Erro ao remover documento';
      console.error('❌ [useDocumentosVeiculos] Erro ao remover:', err);
      setError(errorMessage);
      throw err;
    }
  }, []);

  return {
    // Estado
    documentos,
    loading,
    uploading,
    uploadProgress,
    error,

    // Ações
    listarDocumentos,
    uploadDocumento,
    downloadDocumento,
    removerDocumento,

    // Utilitários
    clearError,
    resetUploadProgress
  };
};