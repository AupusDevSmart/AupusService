import { describe, expect, it, vi } from 'vitest';
import type { ConteudoDaOS } from '@/services/execucao-os.service';
import { fotosDoPdf, somaDaFoto } from './fotos-do-pdf';

/** As fotos do PDF da OS (SN-62): reduzidas, e só as registradas. */
type Anexo = ConteudoDaOS['anexos'][number];
const anexo = (id: string, mudar: Partial<Anexo> = {}): Anexo => ({
  id,
  nome_original: `${id}.jpg`,
  tipo: 'FOTO_DURANTE',
  mime_type: 'image/jpeg',
  tamanho: 3,
  descricao: null,
  tarefa_os_id: null,
  checklist_item_id: null,
  uploaded_at: null,
  uploaded_by: null,
  sha256: `soma-${id}`,
  ...mudar,
});

const reduzida = { src: 'data:image/jpeg;base64,AA', largura: 10, altura: 10 };

describe('fotos do PDF', () => {
  it('SHA-256 da foto como a API grava', async () => {
    expect(await somaDaFoto(new Blob(['abc']))).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('a registrada entra reduzida; a que mudou, a que sumiu e a que falhou dizem por quê; documento fica de fora', async () => {
    const baixar = vi.fn(async (id: string) => {
      if (id === 'falha') throw new Error('rede');
      return new Blob([id]);
    });
    const somar = vi.fn(async (b: Blob) => `soma-${await b.text()}`);
    const reduzir = vi.fn(async () => reduzida);

    const fotos = await fotosDoPdf(
      [
        anexo('boa'),
        anexo('trocada', { sha256: 'soma-da-original' }),
        anexo('sumiu', { sha256: null }),
        anexo('falha'),
        anexo('laudo', { mime_type: 'application/pdf' }),
      ],
      baixar,
      reduzir,
      somar,
    );

    expect(fotos.get('boa')).toBe(reduzida);
    expect(fotos.get('trocada')).toBe('a foto no servidor não é a registrada (mudou depois do registro)');
    expect(fotos.get('sumiu')).toBe('arquivo não encontrado no servidor');
    expect(fotos.get('falha')).toBe('não foi possível carregar a foto');
    expect(fotos.has('laudo')).toBe(false);
    // A que sumiu nem é baixada; a trocada não é reduzida
    expect(baixar).not.toHaveBeenCalledWith('sumiu');
    expect(reduzir).toHaveBeenCalledTimes(1);
  });
});
