import { describe, expect, it } from 'vitest';
import { rotuloDaInstalacao } from './instalacao';

describe('rotuloDaInstalacao', () => {
  it('mostra o nome quando ha uma instalacao', () => {
    const rotulo = rotuloDaInstalacao([{ id: 'u1', nome: 'Subestação Norte' }]);

    expect(rotulo).toEqual({
      texto: 'Subestação Norte',
      titulo: 'Subestação Norte',
      ausente: false,
    });
  });

  /**
   * O caso que a coluna "Local" errava: ela dizia "Múltiplos locais", que nao
   * identifica servico nenhum. Contar e listar no `title` custa o mesmo espaco
   * e responde a pergunta.
   */
  it('conta e lista no titulo quando ha mais de uma', () => {
    const rotulo = rotuloDaInstalacao([
      { id: 'u1', nome: 'Subestação Norte' },
      { id: 'u2', nome: 'Subestação Sul' },
    ]);

    expect(rotulo.texto).toBe('2 instalações');
    expect(rotulo.titulo).toBe('Subestação Norte, Subestação Sul');
    expect(rotulo.ausente).toBe(false);
  });

  /**
   * A OP manual nao registra equipamento nem unidade. Vazio nao e falha de
   * consulta — e o dado nao existir, e a celula precisa dizer isso em vez de
   * cair para a planta ou para o texto livre de `local`.
   */
  it('marca como ausente quando a origem nao tem instalacao', () => {
    for (const entrada of [undefined, []]) {
      const rotulo = rotuloDaInstalacao(entrada);

      expect(rotulo.texto).toBe('—');
      expect(rotulo.ausente).toBe(true);
      expect(rotulo.titulo).toContain('não aponta instalação');
    }
  });
});
