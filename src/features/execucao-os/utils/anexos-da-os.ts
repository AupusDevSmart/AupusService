import type { AnexoOS, TipoAnexoOS } from '@/features/execucao-os/types';

/**
 * Os anexos da OS são a prova do que foi feito: fotos de antes, durante e
 * depois, e os documentos (laudo, certificado). A regra de quando se mexe
 * neles espelha o backend (os-alteravel.ts): OS finalizada ou cancelada é
 * registro fechado.
 */

export const ROTULO_DO_TIPO: Record<TipoAnexoOS, string> = {
  FOTO_ANTES: 'Foto de antes',
  FOTO_DURANTE: 'Foto de durante',
  FOTO_DEPOIS: 'Foto de depois',
  DOCUMENTO: 'Documento',
  LAUDO: 'Laudo',
  CERTIFICADO: 'Certificado',
  MANUAL: 'Manual',
};

const GRUPOS: { titulo: string; tipos: TipoAnexoOS[] }[] = [
  { titulo: 'Antes', tipos: ['FOTO_ANTES'] },
  { titulo: 'Durante', tipos: ['FOTO_DURANTE'] },
  { titulo: 'Depois', tipos: ['FOTO_DEPOIS'] },
  { titulo: 'Documentos', tipos: ['DOCUMENTO', 'LAUDO', 'CERTIFICADO', 'MANUAL'] },
];

/** Extensões que o backend aceita (anexos-os.service.ts). */
export const ARQUIVOS_ACEITOS = '.png,.jpg,.jpeg,.webp,.heic,.heif,.pdf,.doc,.docx,.xls,.xlsx';

export function agruparAnexos(anexos: AnexoOS[]): { titulo: string; anexos: AnexoOS[] }[] {
  return GRUPOS.map((g) => ({ titulo: g.titulo, anexos: anexos.filter((a) => g.tipos.includes(a.tipo)) })).filter(
    (g) => g.anexos.length > 0,
  );
}

/** O tipo que a tela já deixa escolhido, pelo momento da OS. */
export function tipoSugerido(status: string | undefined): TipoAnexoOS {
  switch (status) {
    case 'PENDENTE':
      return 'FOTO_ANTES';
    case 'EM_EXECUCAO':
    case 'PAUSADA':
      return 'FOTO_DURANTE';
    case 'EXECUTADA':
      return 'FOTO_DEPOIS';
    default:
      return 'DOCUMENTO';
  }
}

export function podeMexerNosAnexos(status: string | undefined): boolean {
  return !!status && status !== 'FINALIZADA' && status !== 'CANCELADA';
}

/**
 * Os tipos que a tela desenha e abre numa aba. Lista fechada (revisão do
 * SN-59): o tipo dos anexos antigos veio do cliente, e um SVG com script aberto
 * num `blob:` da própria origem lia a sessão. HEIC/HEIF (foto do iPhone) o
 * navegador não desenha; esses e o resto baixam como arquivo.
 */
const TIPOS_QUE_ABREM = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

export function mostraMiniatura(mime: string | null | undefined): boolean {
  return TIPOS_QUE_ABREM.includes(mime?.toLowerCase() ?? '');
}
