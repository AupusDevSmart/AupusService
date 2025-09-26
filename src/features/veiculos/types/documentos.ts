// src/features/veiculos/types/documentos.ts
export interface DocumentoVeiculoResponse {
  id: string;
  veiculoId: number;
  nome_original: string;
  nome_arquivo: string;
  tipo: string;
  tamanho: number;
  categoria: TipoDocumento;
  descricao?: string;
  data_upload: string;
  createdAt: string;
  updatedAt: string;
}

export type TipoDocumento =
  | 'ipva'
  | 'seguro'
  | 'licenciamento'
  | 'revisao'
  | 'multa'
  | 'outros';

export interface UploadDocumentoDto {
  file: File;
  categoria: TipoDocumento;
  descricao?: string;
  dataVencimento?: string; // YYYY-MM-DD
}

// Validações
export const TAMANHO_MAXIMO_DOCUMENTO = 10 * 1024 * 1024; // 10MB
export const TIPOS_DOCUMENTOS_PERMITIDOS = [
  'pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'
];

export const CATEGORIAS_DOCUMENTOS: Record<TipoDocumento, string> = {
  ipva: 'IPVA',
  seguro: 'Seguro',
  licenciamento: 'Licenciamento',
  revisao: 'Revisão',
  multa: 'Multa',
  outros: 'Outros'
};

export function validarTipoArquivo(nomeArquivo: string): boolean {
  const extensao = nomeArquivo.split('.').pop()?.toLowerCase();
  return extensao ? TIPOS_DOCUMENTOS_PERMITIDOS.includes(extensao) : false;
}

export function validarTamanhoArquivo(tamanho: number): boolean {
  return tamanho <= TAMANHO_MAXIMO_DOCUMENTO;
}

export function obterExtensaoArquivo(nomeArquivo: string): string {
  return nomeArquivo.split('.').pop()?.toLowerCase() || '';
}

export function formatarTamanhoArquivo(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}