// src/features/anomalias/components/AnexosUpload.tsx
import React from 'react';
import { FormFieldProps } from '@/types/base';
import { Button } from '@/components/ui/button';
import { Upload, X, FileText } from 'lucide-react';

export const AnexosUpload = ({ value, onChange, disabled }: FormFieldProps) => {
  // Função para verificar se o value é um array de arquivos válido
  const getInitialFiles = (): File[] => {
    if (!value) return [];
    if (Array.isArray(value) && value.every(item => item instanceof File)) {
      return value as File[];
    }
    return [];
  };

  const [arquivos, setArquivos] = React.useState<File[]>(getInitialFiles());

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const novosArquivos = [...arquivos, ...files];
    setArquivos(novosArquivos);
    onChange(novosArquivos);
  };

  const removerArquivo = (index: number) => {
    const novosArquivos = arquivos.filter((_, i) => i !== index);
    setArquivos(novosArquivos);
    onChange(novosArquivos);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'xls':
      case 'xlsx':
        return <FileText className="h-4 w-4 text-green-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FileText className="h-4 w-4 text-purple-500" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-2">
          Clique para selecionar arquivos ou arraste-os aqui
        </p>
        <input
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          onChange={handleFileChange}
          disabled={disabled}
          className="hidden"
          id="anexos-upload"
        />
        <label
          htmlFor="anexos-upload"
          className={`inline-flex items-center gap-2 px-4 py-2 text-sm border rounded-md cursor-pointer hover:bg-muted transition-colors ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <Upload className="h-4 w-4" />
          Selecionar Arquivos
        </label>
        <p className="text-xs text-muted-foreground mt-2">
          PNG, JPG, PDF, DOC, XLS até 10MB cada
        </p>
      </div>

      {arquivos.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Arquivos Selecionados ({arquivos.length})</label>
          <div className="space-y-2">
            {arquivos.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getFileIcon(file.name)}
                  <div>
                    <p className="text-sm font-medium truncate max-w-48" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                {!disabled && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removerArquivo(index)}
                    className="hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};