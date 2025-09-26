// src/features/veiculos/components/DocumentosUpload.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FormFieldProps } from '@/types/base';
import { Button } from '@/components/ui/button';
import {
  Upload,
  X,
  FileText,
  Download,
  Loader2,
  AlertCircle,
  Plus,
  Shield,
  Car,
  FileCheck,
  Receipt
} from 'lucide-react';
import { useDocumentosVeiculos } from '../hooks/useDocumentosVeiculos';
import {
  DocumentoVeiculoResponse,
  TipoDocumento,
  CATEGORIAS_DOCUMENTOS,
  formatarTamanhoArquivo
} from '../types/documentos';

interface DocumentosUploadProps extends FormFieldProps {
  veiculoId?: number;
  mode?: 'create' | 'edit' | 'view';
}

interface NovoDocumento {
  file: File;
  categoria: TipoDocumento;
  descricao: string;
  dataVencimento?: string;
}

const getIconeCategoria = (categoria: TipoDocumento) => {
  const iconProps = { className: "h-4 w-4 text-blue-500" };
  switch (categoria) {
    case 'ipva': return <Receipt {...iconProps} />;
    case 'seguro': return <Shield {...iconProps} />;
    case 'licenciamento': return <Car {...iconProps} />;
    case 'revisao': return <FileCheck {...iconProps} />;
    case 'multa': return <AlertCircle {...iconProps} />;
    case 'outros': return <FileText {...iconProps} />;
    default: return <FileText {...iconProps} />;
  }
};

export const DocumentosUpload = ({
  value,
  onChange,
  disabled,
  veiculoId,
  mode = 'create'
}: DocumentosUploadProps) => {
  const [documentosNovos, setDocumentosNovos] = useState<NovoDocumento[]>([]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [novoDocumento, setNovoDocumento] = useState<Partial<NovoDocumento>>({});
  const [initialized, setInitialized] = useState(false);
  const [documentosCarregados, setDocumentosCarregados] = useState(false);
  const lastVeiculoIdRef = useRef<number | undefined>(undefined);

  const {
    documentos: documentosExistentes,
    loading: loadingDocumentos,
    uploading,
    uploadProgress,
    uploadDocumento,
    downloadDocumento,
    removerDocumento,
    listarDocumentos,
    error: documentosError,
    clearError
  } = useDocumentosVeiculos();

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Inicialização controlada
  useEffect(() => {
    if (!initialized && value && Array.isArray(value)) {
      setDocumentosNovos(value);
      setInitialized(true);
    }
  }, [value, initialized]);

  // Reset quando veiculoId muda
  useEffect(() => {
    if (lastVeiculoIdRef.current !== veiculoId) {
      setDocumentosCarregados(false);
      lastVeiculoIdRef.current = veiculoId;
    }
  }, [veiculoId]);

  // Carregar documentos existentes
  useEffect(() => {
    const shouldLoadDocumentos = (
      mode !== 'create' &&
      veiculoId &&
      !documentosCarregados &&
      !loadingDocumentos
    );

    if (shouldLoadDocumentos) {
      setDocumentosCarregados(true);
      listarDocumentos(veiculoId);
    }
  }, [mode, veiculoId, documentosCarregados, loadingDocumentos, listarDocumentos]);

  // onChange estável
  const handleOnChange = useCallback((novosDocumentos: NovoDocumento[]) => {
    if (mode === 'create') {
      onChangeRef.current(novosDocumentos);
    }
  }, [mode]);

  useEffect(() => {
    if (initialized) {
      handleOnChange(documentosNovos);
    }
  }, [documentosNovos, handleOnChange, initialized]);

  // Handlers
  const handleUploadDocumentoExistente = async (documento: NovoDocumento) => {
    if (!veiculoId) return;

    try {
      await uploadDocumento(veiculoId, {
        file: documento.file,
        categoria: documento.categoria,
        descricao: documento.descricao
      });
      await listarDocumentos(veiculoId);
    } catch (error) {
      console.error('Erro no upload:', error);
    }
  };

  const handleRemoverDocumentoExistente = async (documentoId: string) => {
    if (!veiculoId) return;

    try {
      await removerDocumento(veiculoId, documentoId);
      await listarDocumentos(veiculoId);
    } catch (error) {
      console.error('Erro ao remover documento:', error);
    }
  };

  const handleDownloadDocumento = async (documentoId: string, _nomeArquivo: string) => {
    if (!veiculoId) return;

    try {
      await downloadDocumento(veiculoId, documentoId);
    } catch (error) {
      console.error('Erro no download:', error);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validações
    const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
    const isValidType = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'].some(ext =>
      file.name.toLowerCase().endsWith(ext)
    );

    if (!isValidSize) {
      alert(`Arquivo "${file.name}" muito grande (máximo 10MB)`);
      return;
    }
    if (!isValidType) {
      alert(`Arquivo "${file.name}" tem tipo não permitido`);
      return;
    }

    setNovoDocumento({ ...novoDocumento, file });
    event.target.value = '';
  };

  const adicionarDocumento = async () => {
    if (!novoDocumento.file || !novoDocumento.categoria) {
      alert('Selecione um arquivo e uma categoria');
      return;
    }

    const documento: NovoDocumento = {
      file: novoDocumento.file,
      categoria: novoDocumento.categoria,
      descricao: novoDocumento.descricao || '',
      dataVencimento: novoDocumento.dataVencimento
    };

    if (mode === 'edit' && veiculoId) {
      await handleUploadDocumentoExistente(documento);
    } else {
      setDocumentosNovos(prev => [...prev, documento]);
    }

    setNovoDocumento({});
    setShowUploadForm(false);
  };

  const removerDocumentoNovo = (index: number) => {
    setDocumentosNovos(prev => prev.filter((_, i) => i !== index));
  };

  const isViewMode = mode === 'view';

  // VIEW MODE
  if (isViewMode) {
    if (loadingDocumentos) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Carregando documentos...</span>
          </div>
        </div>
      );
    }

    if (documentosError) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>Erro ao carregar documentos: {documentosError}</span>
          </div>
        </div>
      );
    }

    if (documentosExistentes.length === 0) {
      return (
        <div className="space-y-4">
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum documento encontrado</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          {documentosExistentes.map((documento) => (
            <div
              key={documento.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border"
            >
              <div className="flex items-center gap-3">
                {getIconeCategoria(documento.categoria)}
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {documento.nome_original}
                  </p>
                  <p className="text-xs text-gray-500">
                    {CATEGORIAS_DOCUMENTOS[documento.categoria]} • {formatarTamanhoArquivo(documento.tamanho)} • {documento.tipo.toUpperCase()}
                  </p>
                  {documento.descricao && (
                    <p className="text-xs text-gray-600 mt-1">{documento.descricao}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownloadDocumento(documento.id, documento.nome_original)}
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
      {documentosError && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded">
          <AlertCircle className="h-4 w-4" />
          <span>Erro: {documentosError}</span>
        </div>
      )}

      {/* Botão para adicionar documento */}
      {!showUploadForm && (
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowUploadForm(true)}
          disabled={disabled}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Documento
        </Button>
      )}

      {/* Formulário de upload */}
      {showUploadForm && (
        <div className="border border-gray-300 rounded-lg p-4 space-y-4 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Novo Documento</h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowUploadForm(false);
                setNovoDocumento({});
              }}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Categoria</label>
              <select
                value={novoDocumento.categoria || ''}
                onChange={(e) => setNovoDocumento({ ...novoDocumento, categoria: e.target.value as TipoDocumento })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-500 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              >
                <option value="" className="text-gray-500 dark:text-gray-400">Selecione uma categoria</option>
                {Object.entries(CATEGORIAS_DOCUMENTOS).map(([key, label]) => (
                  <option key={key} value={key} className="text-gray-900 bg-white dark:text-gray-100 dark:bg-gray-700">{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Arquivo</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-500 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Descrição (opcional)</label>
              <input
                type="text"
                value={novoDocumento.descricao || ''}
                onChange={(e) => setNovoDocumento({ ...novoDocumento, descricao: e.target.value })}
                placeholder="Descrição do documento..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Data de Vencimento</label>
              <input
                type="date"
                value={novoDocumento.dataVencimento || ''}
                onChange={(e) => setNovoDocumento({ ...novoDocumento, dataVencimento: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-500 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              onClick={adicionarDocumento}
              disabled={!novoDocumento.file || !novoDocumento.categoria || uploading}
              className="flex-1"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando... {uploadProgress}%
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Adicionar
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Lista de Documentos Novos */}
      {documentosNovos.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Documentos Selecionados ({documentosNovos.length})
          </label>
          <div className="space-y-2">
            {documentosNovos.map((documento, index) => (
              <div
                key={`doc-${index}-${documento.file.name}`}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getIconeCategoria(documento.categoria)}
                  <div>
                    <p className="text-sm font-medium truncate max-w-64" title={documento.file.name}>
                      {documento.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {CATEGORIAS_DOCUMENTOS[documento.categoria]} • {formatarTamanhoArquivo(documento.file.size)}
                    </p>
                    {documento.descricao && (
                      <p className="text-xs text-gray-600 mt-1">{documento.descricao}</p>
                    )}
                    {documento.dataVencimento && (
                      <p className="text-xs text-gray-600 mt-1">Vencimento: {new Date(documento.dataVencimento).toLocaleDateString('pt-BR')}</p>
                    )}
                  </div>
                </div>
                {!disabled && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removerDocumentoNovo(index)}
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

      {/* Lista de Documentos Existentes (modo EDIT) */}
      {mode === 'edit' && documentosExistentes.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Documentos Existentes ({documentosExistentes.length})
          </label>
          <div className="space-y-2">
            {documentosExistentes.map((documento) => (
              <div
                key={documento.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getIconeCategoria(documento.categoria)}
                  <div>
                    <p className="text-sm font-medium truncate max-w-64" title={documento.nome_original}>
                      {documento.nome_original}
                    </p>
                    <p className="text-xs text-gray-500">
                      {CATEGORIAS_DOCUMENTOS[documento.categoria]} • {formatarTamanhoArquivo(documento.tamanho)} • {documento.tipo.toUpperCase()}
                    </p>
                    {documento.descricao && (
                      <p className="text-xs text-gray-600 mt-1">{documento.descricao}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownloadDocumento(documento.id, documento.nome_original)}
                    className="h-8 w-8 p-0"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  {!disabled && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoverDocumentoExistente(documento.id)}
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

      {/* Loading dos documentos existentes */}
      {mode === 'edit' && loadingDocumentos && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Carregando documentos existentes...</span>
        </div>
      )}
    </div>
  );
};