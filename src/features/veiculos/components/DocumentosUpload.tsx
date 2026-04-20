// src/features/veiculos/components/DocumentosUpload.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FormFieldProps } from '@/types/base';
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
                <button
                  type="button"
                  onClick={() => handleDownloadDocumento(documento.id, documento.nome_original)}
                  className="btn-minimal-ghost p-2"
                >
                  <Download className="h-4 w-4" />
                </button>
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
        <button
          type="button"
          onClick={() => setShowUploadForm(true)}
          disabled={disabled}
          className="btn-minimal-outline w-full flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar Documento
        </button>
      )}

      {/* Formulário de upload */}
      {showUploadForm && (
        <div className="border border-gray-300 rounded-lg p-4 space-y-4 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Novo Documento</h4>
            <button
              type="button"
              onClick={() => {
                setShowUploadForm(false);
                setNovoDocumento({});
              }}
              className="btn-minimal-ghost p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Categoria</label>
              <select
                value={novoDocumento.categoria || ''}
                onChange={(e) => setNovoDocumento({ ...novoDocumento, categoria: e.target.value as TipoDocumento })}
                className="select-minimal w-full"
              >
                <option value="">Selecione uma categoria</option>
                {Object.entries(CATEGORIAS_DOCUMENTOS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Arquivo</label>
              <div className="relative">
                <label className="btn-minimal w-full cursor-pointer flex items-center justify-center gap-2">
                  <Upload className="h-4 w-4" />
                  {novoDocumento.file ? novoDocumento.file.name : 'Escolher arquivo'}
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Descrição (opcional)</label>
              <input
                type="text"
                value={novoDocumento.descricao || ''}
                onChange={(e) => setNovoDocumento({ ...novoDocumento, descricao: e.target.value })}
                placeholder="Descrição do documento..."
                className="input-minimal w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Data de Vencimento</label>
              <input
                type="date"
                value={novoDocumento.dataVencimento || ''}
                onChange={(e) => setNovoDocumento({ ...novoDocumento, dataVencimento: e.target.value })}
                className="input-minimal w-full"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={adicionarDocumento}
              disabled={!novoDocumento.file || !novoDocumento.categoria || uploading}
              className="btn-minimal-primary flex-1 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando... {uploadProgress}%
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Adicionar
                </>
              )}
            </button>
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
                  <button
                    type="button"
                    onClick={() => removerDocumentoNovo(index)}
                    className="btn-minimal-ghost p-2 hover:bg-red-50 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
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
                  <button
                    type="button"
                    onClick={() => handleDownloadDocumento(documento.id, documento.nome_original)}
                    className="btn-minimal-ghost p-2"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => handleRemoverDocumentoExistente(documento.id)}
                      className="btn-minimal-ghost p-2 hover:bg-red-50 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
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