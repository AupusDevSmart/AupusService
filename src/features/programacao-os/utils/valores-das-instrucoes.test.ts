import { describe, expect, it } from 'vitest';
import { linhasDeValor, valorNaTela, valoresDoPedido } from './valores-das-instrucoes';

/** O valor de cada instrução na programação (SN-93, D1) */
describe('valores das instruções', () => {
  const programacao = {
    tarefas_programacao: [
      { tarefa_id: 'T1 ', instrucao_tag: 'INV-03', nome_snapshot: 'Termografia', equipamento_nome: 'Inversor 01', valor: 902.08, valor_original: 902.08 },
    ],
    instrucoes: [{ instrucao_id: 'A1', codigo: 'TR-01', nome: 'Inspeção', equipamento_nome: null, valor: 120, valor_original: 10 }],
  };

  it('a linha da tarefa e a da avulsa, cada uma com a chave que a API entende', () => {
    expect(linhasDeValor(programacao)).toEqual([
      { chave: 'tarefa:T1', nome: 'INV-03 · Termografia', equipamento: 'Inversor 01', valor: 902.08, original: 902.08 },
      { chave: 'instrucao:A1', nome: 'TR-01 · Inspeção', equipamento: null, valor: 120, original: 10 },
    ]);
    expect(linhasDeValor(null)).toEqual([]);
  });

  it('a tela mostra o digitado; apagar (null) volta ao do cadastro', () => {
    const [tarefa, avulsa] = linhasDeValor(programacao);
    expect(valorNaTela(tarefa, {})).toBe(902.08);
    expect(valorNaTela(tarefa, { 'tarefa:T1': 850 })).toBe(850);
    expect(valorNaTela(avulsa, { 'instrucao:A1': null })).toBe(10);
  });

  it('o pedido pela chave, em centavos', () => {
    expect(valoresDoPedido({ 'tarefa:T1': 850.555, 'instrucao:A1': null })).toEqual([
      { tarefa_id: 'T1', valor: 850.56 },
      { instrucao_id: 'A1', valor: null },
    ]);
  });
});
