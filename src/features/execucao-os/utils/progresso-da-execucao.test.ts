import { describe, expect, it } from 'vitest';
import {
  aplicarItem,
  aplicarStatusDaTarefa,
  montarProgresso,
  tarefasPendentes,
} from './progresso-da-execucao';

/**
 * Tarefas da OS e o checklist de cada uma, no formato da seção "O que foi
 * feito" (docs/SPEC-EXECUCAO-DA-OS.md). A API manda `tarefas_os` e `checklist`
 * (com `tarefa_os_id` desde 2026-09-30).
 */
const tarefasOs = [
  { id: 'V1', nome_snapshot: 'Lubrificar mancal', status: 'PENDENTE', observacoes: null, ordem: 1 },
  { id: 'V2', nome_snapshot: 'Inspeção visual', status: 'CANCELADA', observacoes: 'Chuva forte', ordem: 2 },
];
const checklist = [
  { id: 'C1', atividade: 'Lubrificar mancal: Limpar o mancal', obrigatoria: true, concluida: false, tarefa_os_id: 'V1', ordem: 1 },
  { id: 'C2', atividade: 'Lubrificar mancal: Aplicar graxa', obrigatoria: true, concluida: true, tarefa_os_id: 'V1', ordem: 2 },
  { id: 'C3', atividade: 'Lubrificar mancal: Fotografar', obrigatoria: false, concluida: false, tarefa_os_id: 'V1', ordem: 3 },
  { id: 'C9', atividade: 'Verificar equipamentos de segurança', obrigatoria: true, concluida: false, tarefa_os_id: null, ordem: 9 },
];

describe('montarProgresso', () => {
  it('agrupa os itens por tarefa, sem repetir o nome da tarefa no texto', () => {
    const p = montarProgresso(tarefasOs, checklist);

    expect(p.tarefas.map((t) => t.nome)).toEqual(['Lubrificar mancal', 'Inspeção visual']);
    expect(p.tarefas[0].itens.map((i) => i.texto)).toEqual(['Limpar o mancal', 'Aplicar graxa', 'Fotografar']);
    expect(p.tarefas[1].itens).toEqual([]);
  });

  it('item sem tarefa (genérico de segurança das OS antigas) é ignorado', () => {
    const p = montarProgresso(tarefasOs, checklist);

    expect(p.tarefas.flatMap((t) => t.itens).map((i) => i.id)).not.toContain('C9');
    expect(Object.keys(p)).toEqual(['tarefas']);
  });

  it('conta os obrigatórios pendentes de cada tarefa', () => {
    const p = montarProgresso(tarefasOs, checklist);

    expect(p.tarefas[0].obrigatoriosPendentes).toBe(1);
  });

  it('traz o motivo da tarefa não feita', () => {
    const p = montarProgresso(tarefasOs, checklist);

    expect(p.tarefas[1]).toMatchObject({ status: 'CANCELADA', motivo: 'Chuva forte' });
  });

  it('aceita ids com espaço (Char(26)) nos dois lados', () => {
    const p = montarProgresso(
      [{ id: 'V1 ', nome_snapshot: 'X', status: 'PENDENTE' }],
      [{ id: 'C1', atividade: 'X: a', obrigatoria: false, concluida: false, tarefa_os_id: 'V1' }],
    );

    expect(p.tarefas[0].itens).toHaveLength(1);
  });
});

describe('aplicarItem / aplicarStatusDaTarefa / tarefasPendentes', () => {
  it('marcar o último obrigatório zera os pendentes da tarefa', () => {
    const p = aplicarItem(montarProgresso(tarefasOs, checklist), 'C1', { concluida: true });

    expect(p.tarefas[0].obrigatoriosPendentes).toBe(0);
  });

  it('muda o status da tarefa sem mexer nas outras', () => {
    const p = aplicarStatusDaTarefa(montarProgresso(tarefasOs, checklist), 'V1', 'CONCLUIDA');

    expect(p.tarefas.map((t) => t.status)).toEqual(['CONCLUIDA', 'CANCELADA']);
  });

  it('pendentes são só as que não foram feitas nem marcadas como não feitas', () => {
    expect(tarefasPendentes(montarProgresso(tarefasOs, checklist)).map((t) => t.id)).toEqual(['V1']);
  });
});

/** SN-58: o passo de leitura, com a mesma regra da API */
describe('leituras', () => {
  const medicao = [{ id: 'V1', nome_snapshot: 'Medir', status: 'PENDENTE', ordem: 1 }];
  // A faixa pode chegar como texto (Decimal) e a leitura sem valor
  const itens = [
    { id: 'L1', atividade: 'Medir: Tensão', obrigatoria: true, concluida: false, tarefa_os_id: 'V1', ordem: 1, tipo: 'LEITURA', unidade: 'V', valor_minimo: '580.0000', valor_maximo: 620, valor_lido: null },
    { id: 'L2', atividade: 'Medir: Temperatura', obrigatoria: false, concluida: true, tarefa_os_id: 'V1', ordem: 2, tipo: 'LEITURA', unidade: '°C', valor_minimo: null, valor_maximo: 70.5, valor_lido: 82, observacoes: null },
  ];

  it('lê tipo, unidade, faixa e valor; marca o fora da faixa', () => {
    const [tensao, temperatura] = montarProgresso(medicao, itens).tarefas[0].itens;

    expect(tensao).toMatchObject({ tipo: 'LEITURA', unidade: 'V', minimo: 580, maximo: 620, valorLido: null, concluida: false, foraDaFaixa: false });
    expect(temperatura).toMatchObject({ valorLido: 82, foraDaFaixa: true });
  });

  it('a leitura fora da faixa sem observação segura a tarefa; a observação libera', () => {
    let p = montarProgresso(medicao, itens);
    expect(p.tarefas[0]).toMatchObject({ obrigatoriosPendentes: 1, leiturasSemExplicacao: 1 });

    p = aplicarItem(p, 'L1', { valorLido: 600 });
    p = aplicarItem(p, 'L2', { observacao: 'Ventilador travado' });
    expect(p.tarefas[0]).toMatchObject({ obrigatoriosPendentes: 0, leiturasSemExplicacao: 0 });
  });

  it('digitar o valor marca; apagar (null) desmarca; o fora da faixa segue o valor novo', () => {
    let p = aplicarItem(montarProgresso(medicao, itens), 'L1', { valorLido: 650 });
    expect(p.tarefas[0].itens[0]).toMatchObject({ concluida: true, foraDaFaixa: true });

    p = aplicarItem(p, 'L1', { valorLido: 620 });
    expect(p.tarefas[0].itens[0]).toMatchObject({ concluida: true, foraDaFaixa: false });

    p = aplicarItem(p, 'L1', { valorLido: null });
    expect(p.tarefas[0].itens[0]).toMatchObject({ concluida: false, foraDaFaixa: false });
  });

  it('item sem tipo (OS de antes do SN-58) é verificação', () => {
    expect(montarProgresso(tarefasOs, checklist).tarefas[0].itens[0].tipo).toBe('VERIFICACAO');
  });
});

