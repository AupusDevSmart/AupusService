import { describe, expect, it } from 'vitest';
import type { Workbook } from 'exceljs';
import type { LeituraDaPlanilha, RegistroDaPlanilha } from '@/lib/planilha/tipos';
import { casarPelaChave, separarOutroSistema } from './outro-sistema';

/**
 * A planilha de outro sistema (SN-83/84): só o arquivo do Smart Project, ou
 * com TODOS os IDs só de dígitos, perde os IDs e casa pelo nome. Um autor
 * qualquer não basta: o livro montado por script grava "openpyxl", e descartar
 * os IDs daqui faria a linha casar com outro registro e editá-lo calado.
 */
const livro = (creator: string) => ({ creator }) as Workbook;
const registro = (id: string | null, nome: string, linha = 2): RegistroDaPlanilha => ({
  id,
  aba: 'RESUMO',
  linha,
  atualizado_em: '2026-10-01T00:00:00.000Z',
  dados: { nome },
});
const leitura = (...registros: RegistroDaPlanilha[]): LeituraDaPlanilha => ({ registros, erros: [] });

describe('separarOutroSistema', () => {
  it('o autor "Smart Project" é do outro sistema', () => {
    expect(separarOutroSistema(livro('Smart Project'), leitura(registro('cdaqui', 'X'))).deOutroSistema).toBe(true);
  });

  it('todos os IDs só de dígitos também (o autor se perdeu numa regravação)', () => {
    expect(separarOutroSistema(livro(''), leitura(registro('17', 'X'), registro(null, 'Y', 3))).deOutroSistema).toBe(true);
  });

  it('um livro montado por script, com os IDs daqui, NÃO é: os IDs valem', () => {
    const { deOutroSistema, leitura: lida } = separarOutroSistema(livro('openpyxl'), leitura(registro('cdaqui1', 'X'), registro(null, 'Novo', 3)));
    expect(deOutroSistema).toBe(false);
    expect(lida.registros.map((r) => r.id)).toEqual(['cdaqui1', null]);
  });

  it('ID só de dígitos no meio dos daqui é erro na linha (digitado por engano), não descarte calado', () => {
    const { deOutroSistema, leitura: lida } = separarOutroSistema(livro('Aupus Service'), leitura(registro('cdaqui1', 'X'), registro('123', 'Y', 3)));
    expect(deOutroSistema).toBe(false);
    expect(lida.registros.map((r) => r.id)).toEqual(['cdaqui1']);
    expect(lida.erros).toEqual([expect.objectContaining({ linha: 3, mensagem: expect.stringContaining('O ID "123" não é deste sistema') })]);
  });
});

describe('casarPelaChave', () => {
  const daqui = [
    { id: 'a1 ', chave: 'Rompedor elétrico', nome: 'Rompedor elétrico' },
    { id: 'a2', chave: 'Rompedor eletrico', nome: 'Rompedor eletrico' },
    { id: 'b1', chave: 'Munck 12 t', nome: 'Munck 12 t' },
  ];
  const casar = (...registros: RegistroDaPlanilha[]) =>
    casarPelaChave(leitura(...registros), daqui, (r) => String(r.dados.nome), { singular: 'maquinário' });

  it('casa sem caixa e sem acento; o que não existe cria; a data de lá sai', () => {
    const r = casar(registro('7', 'MUNCK 12 T'), registro('8', 'Gerador', 3));
    expect(r.registros.map((x) => [x.id, x.atualizado_em])).toEqual([
      ['b1', null],
      [null, null],
    ]);
  });

  it('a prévia diz com quem cada linha casou', () => {
    const r = casar(registro('7', 'munck 12 t'));
    expect(r.avisos).toContainEqual(expect.objectContaining({ linha: 2, mensagem: 'Casou com "Munck 12 t" daqui: a linha edita esse registro.' }));
  });

  it('dois daqui na mesma chave: vale a grafia exata; sem ela, erro na linha (nunca a escolha calada)', () => {
    expect(casar(registro('7', 'rompedor elétrico')).registros[0].id).toBe('a1');
    const ambiguo = casar(registro('7', 'ROMPEDOR  ELÉTRICO ', 2), registro('8', 'Rompédor eletrico', 3));
    expect(ambiguo.registros.map((x) => x.id)).toEqual(['a1']);
    expect(ambiguo.erros).toEqual([expect.objectContaining({ linha: 3, mensagem: expect.stringContaining('Nome ambíguo') })]);
  });
});
