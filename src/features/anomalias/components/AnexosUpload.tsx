// src/features/anomalias/components/AnexosUpload.tsx - VERSÃO LIMPA
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FormFieldProps } from '@/types/base';
import { Button } from '@/components/ui/button';
import { Upload, X, FileText, Download, Loader2, AlertCircle } from 'lucide-react';
import { useAnexosAnomalias } from '../hooks/useAnexosAnomalias';

interface AnexosUploadProps extends FormFieldProps {
  anomaliaId?: string;
  mode?: 'create' | 'edit' | 'view';
}

export const AnexosUpload = ({ 
  value, 
  onChange, 
  disabled, 
  anomaliaId, 
  mode = 'create' 
}: AnexosUploadProps) => {
  const [arquivosNovos, setArquivosNovos] = useState<File[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [anexosCarregados, setAnexosCarregados] = useState(false);
  const lastAnomaliaIdRef = useRef<string | undefined>(undefined);
  
  const { 
    anexos: anexosExistentes, 
    loading: loadingAnexos,
    uploadAnexo,
    downloadAnexo,
    removerAnexo,
    listarAnexos,
    error: anexosError
  } = useAnexosAnomalias();
  
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const cleanAnomaliaId = anomaliaId?.toString().trim();

  // Inicialização controlada
  useEffect(() => {
    if (!initialized && value && Array.isArray(value)) {
      setArquivosNovos(value);
      setInitialized(true);
    }
  }, [value, initialized]);

  // Reset quando anomaliaId muda
  useEffect(() => {
    if (lastAnomaliaIdRef.current !== cleanAnomaliaId) {
      setAnexosCarregados(false);
      lastAnomaliaIdRef.current = cleanAnomaliaId;
    }
  }, [cleanAnomaliaId]);

  // Carregar anexos existentes
  useEffect(() => {
    const shouldLoadAnexos = (
      mode !== 'create' && 
      cleanAnomaliaId && 
      !anexosCarregados &&
      !loadingAnexos
    );

    if (shouldLoadAnexos) {
      setAnexosCarregados(true);
      listarAnexos(cleanAnomaliaId);
    }
  }, [mode, cleanAnomaliaId, anexosCarregados, loadingAnexos, listarAnexos]);

  // onChange estável
  const handleOnChange = useCallback((novosArquivos: File[]) => {
    if (mode === 'create') {
      onChangeRef.current(novosArquivos);
    }
  }, [mode]);

  useEffect(() => {
    if (initialized) {
      handleOnChange(arquivosNovos);
    }
  }, [arquivosNovos, handleOnChange, initialized]);

  // Handlers
  const handleUploadAnexoExistente = async (file: File) => {
    if (!cleanAnomaliaId) return;
    
    try {
      await uploadAnexo(cleanAnomaliaId, file);
      await listarAnexos(cleanAnomaliaId);
    } catch (error) {
      console.error('Erro no upload:', error);
    }
  };

  const handleRemoverAnexoExistente = async (anexoId: string) => {
    const cleanAnexoId = anexoId?.toString().trim();
    try {
      await removerAnexo(cleanAnexoId);
      if (cleanAnomaliaId) {
        await listarAnexos(cleanAnomaliaId);
      }
    } catch (error) {
      console.error('Erro ao remover anexo:', error);
    }
  };

  const handleDownloadAnexo = async (anexoId: string, _nomeArquivo: string) => {
    const cleanAnexoId = anexoId?.toString().trim();
    try {
      await downloadAnexo(cleanAnexoId);
    } catch (error) {
      console.error('Erro no download:', error);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (mode === 'edit' && cleanAnomaliaId) {
      for (const file of files) {
        await handleUploadAnexoExistente(file);
      }
      return;
    }
    
    const arquivosValidos = files.filter(file => {
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      const isValidType = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'].some(ext => 
        file.name.toLowerCase().endsWith(ext)
      );
      
      if (!isValidSize) {
        alert(`Arquivo "${file.name}" muito grande (máximo 10MB)`);
        return false;
      }
      if (!isValidType) {
        alert(`Arquivo "${file.name}" tem tipo não permitido`);
        return false;
      }
      return true;
    });

    if (arquivosValidos.length > 0) {
      setArquivosNovos(prev => [...prev, ...arquivosValidos]);
    }

    event.target.value = '';
  };

  const removerArquivo = (index: number) => {
    setArquivosNovos(prev => prev.filter((_, i) => i !== index));
  };

  const formatarTamanho = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isViewMode = mode === 'view';

  // VIEW MODE
  if (isViewMode) {
    if (loadingAnexos) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Carregando anexos...</span>
          </div>
        </div>
      );
    }

    if (anexosError) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>Erro ao carregar anexos: {anexosError}</span>
          </div>
        </div>
      );
    }

    if (anexosExistentes.length === 0) {
      return (
        <div className="space-y-4">
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum anexo encontrado</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          {anexosExistentes.map((anexo) => (
            <div 
              key={anexo.id?.trim() || Math.random()}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {anexo.nome_original || anexo.nome || 'Arquivo sem nome'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatarTamanho(anexo.tamanho || 0)} • {(anexo.tipo || '').toUpperCase()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownloadAnexo(anexo.id, anexo.nome_original)}
                  className="h-8 w-8 p-0"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mostrar erro se houver */}
      {anexosError && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded">
          <AlertCircle className="h-4 w-4" />
          <span>Erro: {anexosError}</span>
        </div>
      )}

      {/* Área de Upload */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-600 mb-2">
          Clique para selecionar arquivos ou arraste-os aqui
        </p>
        <input
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          onChange={handleFileChange}
          disabled={disabled}
          className="hidden"
          id="anexos-upload"
        />
        <label
          htmlFor="anexos-upload"
          className={`inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <Upload className="h-4 w-4" />
          Selecionar Arquivos
        </label>
        <p className="text-xs text-gray-500 mt-2">
          PDF, JPG, PNG, DOC, DOCX até 10MB cada
        </p>
      </div>

      {/* Lista de Arquivos Novos */}
      {arquivosNovos.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Arquivos Selecionados ({arquivosNovos.length})
          </label>
          <div className="space-y-2">
            {arquivosNovos.map((file, index) => (
              <div
                key={`file-${index}-${file.name}`}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium truncate max-w-64" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatarTamanho(file.size)}
                    </p>
                  </div>
                </div>
                {!disabled && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removerArquivo(index)}
                    className="hover:bg-red-50 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de Anexos Existentes (modo EDIT) */}
      {mode === 'edit' && anexosExistentes.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Anexos Existentes ({anexosExistentes.length})
          </label>
          <div className="space-y-2">
            {anexosExistentes.map((anexo) => (
              <div
                key={anexo.id?.trim() || Math.random()}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium truncate max-w-64" title={anexo.nome_original || anexo.nome}>
                      {anexo.nome_original || anexo.nome || 'Arquivo sem nome'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatarTamanho(anexo.tamanho || 0)} • {(anexo.tipo || '').toUpperCase()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownloadAnexo(anexo.id, anexo.nome_original)}
                    className="h-8 w-8 p-0"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  {!disabled && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoverAnexoExistente(anexo.id)}
                      className="hover:bg-red-50 hover:text-red-600 h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading dos anexos existentes */}
      {mode === 'edit' && loadingAnexos && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Carregando anexos existentes...</span>
        </div>
      )}
    </div>
  );
};