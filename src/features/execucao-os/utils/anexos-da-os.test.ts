import { describe, expect, it } from 'vitest';
import type { AnexoOS } from '@/features/execucao-os/types';
import { agruparAnexos, mostraMiniatura, podeMexerNosAnexos, tipoSugerido } from './anexos-da-os';

const anexo = (tipo: AnexoOS['tipo'], id = tipo): AnexoOS => ({
  id,
  os_id: 'os1',
  nome: `${id}.jpg`,
  nome_original: `${id}.jpg`,
  tipo,
  mime_type: 'image/jpeg',
  tamanho: 10,
  caminho_s3: '',
  uploaded_at: '2026-10-14T13:00:00.000Z',
});

describe('agruparAnexos', () => {
  it('separa as fotos em antes, durante e depois, e o resto em documentos', () => {
    const grupos = agruparAnexos([
      anexo('FOTO_DEPOIS'),
      anexo('LAUDO'),
      anexo('FOTO_ANTES'),
      anexo('FOTO_DURANTE'),
      anexo('CERTIFICADO'),
    ]);

    expect(grupos.map((g) => [g.titulo, g.anexos.map((a) => a.tipo)])).toEqual([
      ['Antes', ['FOTO_ANTES']],
      ['Durante', ['FOTO_DURANTE']],
      ['Depois', ['FOTO_DEPOIS']],
      ['Documentos', ['LAUDO', 'CERTIFICADO']],
    ]);
  });

  it('grupo sem anexo não aparece', () => {
    expect(agruparAnexos([anexo('FOTO_ANTES')]).map((g) => g.titulo)).toEqual(['Antes']);
    expect(agruparAnexos([])).toEqual([]);
  });
});

describe('tipoSugerido', () => {
  it('acompanha o momento da OS: antes de começar, durante a execução, depois de executada', () => {
    expect(tipoSugerido('PENDENTE')).toBe('FOTO_ANTES');
    expect(tipoSugerido('EM_EXECUCAO')).toBe('FOTO_DURANTE');
    expect(tipoSugerido('PAUSADA')).toBe('FOTO_DURANTE');
    expect(tipoSugerido('EXECUTADA')).toBe('FOTO_DEPOIS');
    expect(tipoSugerido('AUDITADA')).toBe('DOCUMENTO');
  });
});

describe('podeMexerNosAnexos', () => {
  it('OS finalizada ou cancelada é registro fechado', () => {
    expect(podeMexerNosAnexos('FINALIZADA')).toBe(false);
    expect(podeMexerNosAnexos('CANCELADA')).toBe(false);
    expect(podeMexerNosAnexos('PENDENTE')).toBe(true);
    expect(podeMexerNosAnexos('AUDITADA')).toBe(true);
    expect(podeMexerNosAnexos(undefined)).toBe(false);
  });
});

describe('mostraMiniatura', () => {
  // Revisão do SN-59: o tipo dos anexos antigos veio do cliente; SVG aberto num
  // blob da própria origem rodava script
  it('SVG e qualquer tipo fora da lista fechada não abrem na tela', () => {
    expect(mostraMiniatura('image/svg+xml')).toBe(false);
    expect(mostraMiniatura('text/html')).toBe(false);
    expect(mostraMiniatura('IMAGE/PNG')).toBe(true);
    expect(mostraMiniatura(undefined)).toBe(false);
  });

  it('só imagem que o navegador desenha (a foto HEIC do iPhone vai como arquivo)', () => {
    expect(mostraMiniatura('image/jpeg')).toBe(true);
    expect(mostraMiniatura('image/webp')).toBe(true);
    expect(mostraMiniatura('image/heic')).toBe(false);
    expect(mostraMiniatura('application/pdf')).toBe(false);
  });
});
