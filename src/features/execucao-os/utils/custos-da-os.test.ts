import { describe, expect, it } from 'vitest';
import { diferencaDoPrevisto, nomeDaInstrucao, resumoDasInstrucoes, valorDaInstrucao } from './custos-da-os';
import type { ResumoDoCusto } from '@/features/execucao-os/types/custos';

const sem = (t: string) => t.replace(/\s/g, ' ');

/** A leitura do custo da OS (SN-93): a conta é da API, aqui só o texto */
describe('custo da OS em texto', () => {
  it('a diferença para o previsto, com o sinal e o quanto é do previsto', () => {
    expect(sem(diferencaDoPrevisto(7216.64, 7243.14).texto)).toBe('+R$ 26,50 (+0,4%)');
    expect(diferencaDoPrevisto(7216.64, 7243.14).sentido).toBe('acima');
    expect(sem(diferencaDoPrevisto(1000, 875).texto)).toBe('−R$ 125,00 (−12,5%)');
    expect(diferencaDoPrevisto(500, 500)).toEqual({ texto: 'igual ao previsto', sentido: 'igual' });
    // Sem previsto não há porcentagem: o não previsto e a natureza nova
    expect(diferencaDoPrevisto(0, 85)).toEqual({ texto: 'sem previsto', sentido: 'sem-previsto' });
    expect(diferencaDoPrevisto(0, 0).texto).toBe('—');
  });

  const instrucao = (mudar: Partial<ResumoDoCusto['instrucoes'][number]> = {}): ResumoDoCusto['instrucoes'][number] => ({
    codigo: 'INV-03',
    nome: 'Termografia',
    equipamento: 'Inversor 01',
    status: 'CONCLUIDA',
    feita: true,
    valor: 902.08,
    valor_original: 902.08,
    ajustado: false,
    do_cadastro_hoje: false,
    ...mudar,
  });

  it('o valor da instrução diz quando é ajustado ou do cadastro de hoje', () => {
    expect(valorDaInstrucao(instrucao()).detalhe).toBeNull();
    expect(sem(valorDaInstrucao(instrucao({ valor: 850, ajustado: true })).detalhe!)).toBe('ajustado; cadastro R$ 902,08');
    expect(valorDaInstrucao(instrucao({ do_cadastro_hoje: true })).detalhe).toBe('do cadastro de hoje');
    expect(valorDaInstrucao(instrucao({ valor: null }))).toEqual({ texto: '—', detalhe: 'sem valor no cadastro' });
    expect(nomeDaInstrucao({ codigo: null, nome: null })).toBe('Instrução');
  });

  it('as instruções feitas: quantas e quanto, de quanto', () => {
    const custos = { instrucoes: [instrucao(), instrucao({ feita: false })], instrucoes_feitas: 1, instrucoes_feitas_total: 902.08, instrucoes_total: 1804.16 };
    expect(sem(resumoDasInstrucoes(custos as ResumoDoCusto)!)).toBe('1 de 2 feitas · R$ 902,08 de R$ 1.804,16');
    expect(resumoDasInstrucoes({ ...custos, instrucoes: [] } as unknown as ResumoDoCusto)).toBeNull();
  });
});
