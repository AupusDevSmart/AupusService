// src/features/execucao-os/utils/fotos-do-pdf.ts
import type { ConteudoDaOS } from '@/services/execucao-os.service';
import { mostraMiniatura } from '@/features/execucao-os/utils/anexos-da-os';
import type { FotoDoPdf } from '@/features/execucao-os/utils/documento-da-os';

/**
 * As fotos da OS para o PDF (SN-62), reduzidas: a foto do celular tem 3 a 5 MB
 * e 4000 px, e 30 delas fariam um PDF de mais de 100 MB. Com 1200 px no lado
 * maior e JPEG a 0,75, cada uma fica perto de 150 kB e continua legível
 * impressa em meia página.
 *
 * Cada foto que não entra no PDF volta com o motivo, e o PDF mostra o motivo
 * no lugar dela: sumir calada parecia que a foto não existia.
 */
export const LADO_MAXIMO = 1200;

export type BaixarFoto = (anexoId: string) => Promise<Blob>;
export type Reduzir = (foto: Blob) => Promise<FotoDoPdf>;
export type Somar = (foto: Blob) => Promise<string>;

/** SHA-256 em hexadecimal, como a API grava. */
export async function somaDaFoto(foto: Blob): Promise<string> {
  const soma = await crypto.subtle.digest('SHA-256', await foto.arrayBuffer());
  return [...new Uint8Array(soma)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function reduzirFoto(foto: Blob, lado = LADO_MAXIMO): Promise<FotoDoPdf> {
  const imagem = await createImageBitmap(foto);
  try {
    const escala = Math.min(1, lado / Math.max(imagem.width, imagem.height));
    const largura = Math.max(1, Math.round(imagem.width * escala));
    const altura = Math.max(1, Math.round(imagem.height * escala));
    const tela = document.createElement('canvas');
    tela.width = largura;
    tela.height = altura;
    const contexto = tela.getContext('2d');
    if (!contexto) throw new Error('O navegador não deu um canvas para reduzir a foto');
    contexto.drawImage(imagem, 0, 0, largura, altura);
    return { src: tela.toDataURL('image/jpeg', 0.75), largura, altura };
  } finally {
    imagem.close();
  }
}

/**
 * Uma de cada vez: 30 downloads juntos disputariam a rede de quem está em campo.
 * A foto baixada tem de ser a registrada: o PDF imprime o código daquele
 * conteúdo, e a imagem trocada depois apareceria ao lado dele como se fosse a
 * mesma. Soma diferente, a foto não entra e o PDF diz por quê.
 */
export async function fotosDoPdf(
  anexos: ConteudoDaOS['anexos'],
  baixar: BaixarFoto,
  reduzir: Reduzir = reduzirFoto,
  somar: Somar = somaDaFoto,
): Promise<Map<string, FotoDoPdf | string>> {
  const fotos = new Map<string, FotoDoPdf | string>();
  for (const anexo of anexos.filter((a) => mostraMiniatura(a.mime_type))) {
    if (!anexo.sha256) {
      fotos.set(anexo.id, 'arquivo não encontrado no servidor');
      continue;
    }
    try {
      const foto = await baixar(anexo.id);
      if ((await somar(foto)) !== anexo.sha256) {
        fotos.set(anexo.id, 'a foto no servidor não é a registrada (mudou depois do registro)');
        continue;
      }
      fotos.set(anexo.id, await reduzir(foto));
    } catch (erro) {
      console.error(`Foto ${anexo.id} não entrou no PDF:`, erro);
      fotos.set(anexo.id, 'não foi possível carregar a foto');
    }
  }
  return fotos;
}
