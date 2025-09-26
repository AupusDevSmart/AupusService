// src/features/anomalias/types/anexos.ts
export interface AnexoAnomaliaResponse {
  id: string;
  nome: string;                    // Nome gerado único
  nome_original: string;           // Nome original do arquivo
  tipo: string;                    // Extensão do arquivo
  mime_type: string;              // MIME type
  tamanho: number;                // Tamanho em bytes
  descricao?: string;             // Descrição opcional
  caminho_s3: string;             // Caminho do arquivo (local ou S3)
  url_download?: string;          // URL para download
  anomalia_id: string;            // ID da anomalia
  usuario_id?: string;            // ID do usuário que fez upload
  usuario?: {                     // Dados do usuário
    id: string;
    nome: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
}

export interface UploadAnexoDto {
  file: File;
  descricao?: string;
}

export interface AnexoUploadProgress {
  id: string;
  nome_original: string;
  tamanho: number;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

// Constantes baseadas na documentação
export const TIPOS_ANEXOS_PERMITIDOS = [
  'png', 'pdf', 'jpg', 'jpeg', 'doc', 'docx', 'xls', 'xlsx'
] as const;

export const TAMANHO_MAXIMO_ANEXO = 10 * 1024 * 1024; // 10MB

export const MIME_TYPES_PERMITIDOS = {
  'png': 'image/png',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'pdf': 'application/pdf',
  'doc': 'application/msword',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'xls': 'application/vnd.ms-excel',
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
} as const;

export type TipoAnexoPermitido = typeof TIPOS_ANEXOS_PERMITIDOS[number];

// Utilitários para validação
export const validarTipoArquivo = (nomeArquivo: string): boolean => {
  const extensao = nomeArquivo.split('.').pop()?.toLowerCase();
  return extensao ? TIPOS_ANEXOS_PERMITIDOS.includes(extensao as TipoAnexoPermitido) : false;
};

export const validarTamanhoArquivo = (tamanho: number): boolean => {
  return tamanho <= TAMANHO_MAXIMO_ANEXO;
};

export const obterIconeArquivo = (tipo: string): string => {
  switch (tipo.toLowerCase()) {
    case 'pdf':
      return '📄';
    case 'doc':
    case 'docx':
      return '📝';
    case 'xls':
    case 'xlsx':
      return '📊';
    case 'png':
    case 'jpg':
    case 'jpeg':
      return '🖼️';
    default:
      return '📎';
  }
};

export const formatarTamanhoArquivo = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};