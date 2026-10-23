// src/features/veiculos/types/documentos.ts
export interface DocumentoVeiculoResponse {
  id: string;
  veiculoId: string;
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

/** O que a API devolve (DocumentacaoVeiculoResponseDto do backend, em camelCase) */
export interface DocumentacaoDaApi {
  id: string;
  veiculoId: string;
  /** A categoria (ipva, seguro...) */
  tipo: TipoDocumento;
  descricao: string;
  nomeArquivo?: string | null;
  nomeArquivoOriginal?: string | null;
  /** A extensão do arquivo */
  tipoArquivo?: string | null;
  tamanhoArquivo?: number | null;
  criadoEm?: string;
  atualizadoEm?: string;
}

/**
 * A documentação da API no formato da tela. A tela lia `nome_original`,
 * `tamanho` e `categoria`, que a API nunca mandou: o documento aparecia como
 * "• NaN undefined • SEGURO" (a categoria no lugar do tipo do arquivo).
 */
export function documentoDaApi(d: DocumentacaoDaApi): DocumentoVeiculoResponse {
  return {
    id: d.id,
    veiculoId: d.veiculoId,
    nome_original: d.nomeArquivoOriginal || d.nomeArquivo || d.descricao,
    nome_arquivo: d.nomeArquivo || '',
    tipo: d.tipoArquivo || '',
    tamanho: d.tamanhoArquivo ?? 0,
    categoria: d.tipo,
    descricao: d.descricao,
    data_upload: d.criadoEm ?? '',
    createdAt: d.criadoEm ?? '',
    updatedAt: d.atualizadoEm ?? '',
  };
}

/** "Seguro • 1.2 MB • PDF", só com o que se sabe (documento sem arquivo não tem tamanho nem tipo) */
export function resumoDoDocumento(documento: Pick<DocumentoVeiculoResponse, 'categoria' | 'tamanho' | 'tipo'>): string {
  return [
    CATEGORIAS_DOCUMENTOS[documento.categoria],
    documento.tamanho > 0 ? formatarTamanhoArquivo(documento.tamanho) : null,
    documento.tipo ? documento.tipo.toUpperCase() : null,
  ]
    .filter(Boolean)
    .join(' • ');
}

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