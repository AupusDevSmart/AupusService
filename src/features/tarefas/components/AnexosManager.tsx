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
      event.target.value = '';
    } else {
      // Modo edit: fazer upload imediato
      try {
        setUploading(true);
        setError(null);
        await uploadAnexo(tarefaId!, file, `Anexo: ${file.name}`);
        await loadAnexos();
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
      <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Carregando anexos...
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded text-red-700 dark:text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {isCreateMode
        ? localFiles.length > 0 && (
            <div className="space-y-1.5">
              {localFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between gap-3 p-2 border rounded bg-muted/30">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm truncate">{file.name}</span>
                    <Badge variant="secondary" className="text-xs flex-shrink-0">Novo</Badge>
                    <span className="text-xs text-muted-foreground flex-shrink-0">{(file.size / 1024).toFixed(1)} KB</span>
                  </div>
                  {!readonly && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveLocalFile(index)}
                      title="Remover"
                      className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )
        : anexos.length > 0 && (
            <div className="space-y-1.5">
              {anexos.map((anexo) => (
                <div key={anexo.id} className="flex items-center justify-between gap-3 p-2 border rounded bg-muted/30">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm truncate">{anexo.nome}</span>
                    <Badge variant="secondary" className="text-xs flex-shrink-0">{getTipoLabel(anexo.tipo)}</Badge>
                    {anexo.tamanho && (
                      <span className="text-xs text-muted-foreground flex-shrink-0">{formatFileSize(anexo.tamanho)}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownload(anexo)}
                      title="Download"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                    {!readonly && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(anexo)}
                        title="Excluir"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

      {readonly && anexos.length === 0 && (
        <div className="text-xs text-muted-foreground">Nenhum anexo encontrado</div>
      )}

      {!readonly && (
        <Button
          variant="outline"
          size="sm"
          disabled={uploading}
          asChild
          className="w-full h-8 border-dashed text-muted-foreground"
        >
          <label className="cursor-pointer">
            {uploading ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-1.5" />
            )}
            Adicionar anexo
            <input
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              accept=".png,.pdf,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.txt"
            />
          </label>
        </Button>
      )}

      {!readonly && (
        <p className="text-xs text-muted-foreground">
          Máx. 10MB · PNG, PDF, JPG, DOC, DOCX, XLS, XLSX, TXT
        </p>
      )}
    </div>
  );
}
