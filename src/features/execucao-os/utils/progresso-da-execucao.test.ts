import { describe, expect, it } from 'vitest';
import {
  aplicarItem,
  aplicarStatusDaTarefa,
  geraisObrigatoriosPendentes,
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

  it('item sem tarefa vai para os gerais', () => {
    const p = montarProgresso(tarefasOs, checklist);

    expect(p.gerais.map((i) => i.id)).toEqual(['C9']);
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
    const p = aplicarItem(montarProgresso(tarefasOs, checklist), 'C1', true);

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

describe('geraisObrigatoriosPendentes', () => {
  it('lista os itens gerais obrigatórios ainda desmarcados (os das tarefas não entram)', () => {
    expect(geraisObrigatoriosPendentes(montarProgresso(tarefasOs, checklist))).toEqual([
      'Verificar equipamentos de segurança',
    ]);
  });

  it('some quando o item é marcado', () => {
    const p = aplicarItem(montarProgresso(tarefasOs, checklist), 'C9', true);

    expect(geraisObrigatoriosPendentes(p)).toEqual([]);
  });
});
