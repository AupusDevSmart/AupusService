// src/features/tarefas/components/AnexosManager.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Upload,
  Download,
  FileText,
  Trash2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useTarefasApi } from '../hooks/useTarefasApi';
import { AnexoTarefaDetalhesDto, TipoAnexo } from '@/services/tarefas.services';

interface AnexosManagerProps {
  tarefaId: string | null; // Permitir null para modo create
  readonly?: boolean;
  onFilesChange?: (files: File[]) => void; // Callback para modo create
}

export function AnexosManager({ tarefaId, readonly = false, onFilesChange }: AnexosManagerProps) {
  const [anexos, setAnexos] = useState<AnexoTarefaDetalhesDto[]>([]);
  const [localFiles, setLocalFiles] = useState<File[]>([]); // Para modo create
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { getAnexos, uploadAnexo, downloadAnexo, deleteAnexo } = useTarefasApi();
  const isCreateMode = tarefaId === null;

  useEffect(() => {
    if (tarefaId) {
      loadAnexos();
    }
  }, [tarefaId]);

  const loadAnexos = async () => {
    try {
      setLoading(true);
      setError(null);
      const anexosList = await getAnexos(tarefaId!);
      setAnexos(anexosList);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar anexos');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validações
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/png', 'application/pdf', 'image/jpeg', 'image/jpg', 
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'];

    if (file.size > maxSize) {
      setError('Arquivo muito grande. Máximo 10MB.');
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setError('Tipo de arquivo não permitido.');
      return;
    }

    if (isCreateMode) {
      // Modo create: apenas adicionar aos arquivos locais
      const newFiles = [...localFiles, file];
      setLocalFiles(newFiles);
      onFilesChange?.(newFiles);

      // Limpar input
      event.target.value = '';
    } else {
      // Modo edit: fazer upload imediato
      try {
        setUploading(true);
        setError(null);
        await uploadAnexo(tarefaId!, file, `Anexo: ${file.name}`);
        await loadAnexos();

        // Limpar input
        event.target.value = '';
      } catch (err: any) {
        setError(err.message || 'Erro ao fazer upload do arquivo');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleDownload = async (anexo: AnexoTarefaDetalhesDto) => {
    try {
      const blob = await downloadAnexo(tarefaId!, anexo.id);
      
      // Criar URL para download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = anexo.nome;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer download do arquivo');
    }
  };

  const handleDelete = async (anexo: AnexoTarefaDetalhesDto) => {
    if (!confirm(`Tem certeza que deseja excluir o anexo "${anexo.nome}"?`)) {
      return;
    }

    try {
      await deleteAnexo(tarefaId!, anexo.id);
      await loadAnexos();
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir anexo');
    }
  };

  const handleRemoveLocalFile = (index: number) => {
    const newFiles = localFiles.filter((_, i) => i !== index);
    setLocalFiles(newFiles);
    onFilesChange?.(newFiles);
  };

  const getTipoLabel = (tipo: TipoAnexo): string => {
    const labels = {
      MANUAL: 'Manual',
      PROCEDIMENTO: 'Procedimento',
      MODELO_RELATORIO: 'Modelo Relatório',
      OUTROS: 'Outros'
    };
    return labels[tipo] || 'Outros';
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        <span>Carregando anexos...</span>
      </div>
    );
  }

  const totalFiles = isCreateMode ? localFiles.length : anexos.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Anexos ({totalFiles})</h4>
        
        {!readonly && (
          <Button 
            variant="outline" 
            size="sm" 
            disabled={uploading}
            asChild
          >
            <label className="cursor-pointer">
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Upload className="h-4 w-4 mr-1" />
              )}
              Upload
              <input
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                accept=".png,.pdf,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.txt"
              />
            </label>
          </Button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded-md text-red-700 dark:text-red-400">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Renderizar arquivos baseado no modo */}
      {isCreateMode ? (
        // Modo Create: mostrar arquivos locais
        localFiles.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum arquivo selecionado</p>
          </div>
        ) : (
          <div className="space-y-2">
            {localFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-muted/50 border rounded-md hover:bg-muted/80"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {file.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        Novo
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {!readonly && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveLocalFile(index)}
                      title="Remover"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        // Modo Edit/View: mostrar anexos existentes
        anexos.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum anexo encontrado</p>
          </div>
        ) : (
          <div className="space-y-2">
            {anexos.map((anexo) => (
              <div
                key={anexo.id}
                className="flex items-center justify-between p-3 bg-muted/50 border rounded-md hover:bg-muted/80"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {anexo.nome}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {getTipoLabel(anexo.tipo)}
                      </Badge>
                      {anexo.tamanho && (
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(anexo.tamanho)}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(anexo.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(anexo)}
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  
                  {!readonly && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(anexo)}
                      title="Excluir"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {!readonly && (
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Tamanho máximo: 10MB</p>
          <p>• Tipos permitidos: PNG, PDF, JPG, DOC, DOCX, XLS, XLSX, TXT</p>
        </div>
      )}
    </div>
  );
}