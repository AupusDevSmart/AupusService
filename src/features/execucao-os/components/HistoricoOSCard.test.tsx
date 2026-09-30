import { describe, expect, it } from 'vitest';
import { rotuloDaAcao } from './HistoricoOSCard';

describe('rotuloDaAcao', () => {
  it('traduz as ações da OS, inclusive as das tarefas', () => {
    expect(rotuloDaAcao('INICIO_EXECUCAO')).toBe('Iniciada');
    expect(rotuloDaAcao('TAREFA_NAO_FEITA')).toBe('Tarefa não feita');
    expect(rotuloDaAcao('CRIACAO_AUTO')).toBe('OS gerada');
  });

  it('as da programação vêm com prefixo e viram "Programação …"', () => {
    expect(rotuloDaAcao('[PROGRAMAÇÃO] APROVACAO')).toBe('Programação aprovada');
    expect(rotuloDaAcao('[PROGRAMAÇÃO] CRIACAO')).toBe('Programação criada');
  });

  it('código desconhecido vira texto legível, não o código cru', () => {
    expect(rotuloDaAcao('ALGO_NOVO')).toBe('Algo novo');
  });
});
