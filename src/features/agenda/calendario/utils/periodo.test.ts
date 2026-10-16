import { describe, expect, it } from 'vitest';
import { formatarEmBrasilia } from '@/utils/brasilia';
import { agruparPorDia, deslocar, diaDoEvento, diaParaApi, periodoDaVisao, tituloDoPeriodo } from './periodo';

/** As datas são montadas no fuso de quem roda (como no navegador). */
const dia = (a: number, m: number, d: number) => new Date(a, m - 1, d, 12);

describe('período do calendário', () => {
  it('o mês desenha semanas inteiras, de domingo a sábado', () => {
    // Novembro de 2026: começa num domingo e termina numa segunda
    const { inicio, fim, dias } = periodoDaVisao('mes', dia(2026, 11, 15));

    expect(diaParaApi(inicio)).toBe('2026-11-01');
    expect(diaParaApi(fim)).toBe('2026-12-05');
    expect(dias).toHaveLength(35);
    expect(dias[0].getDay()).toBe(0);
  });

  it('a semana vai de domingo a sábado, mesmo atravessando o mês', () => {
    const { inicio, fim } = periodoDaVisao('semana', dia(2026, 10, 1));

    expect([diaParaApi(inicio), diaParaApi(fim)]).toEqual(['2026-09-27', '2026-10-03']);
  });

  it('a lista é o mês exato', () => {
    const { inicio, fim } = periodoDaVisao('lista', dia(2026, 2, 10));

    expect([diaParaApi(inicio), diaParaApi(fim)]).toEqual(['2026-02-01', '2026-02-28']);
  });

  it('andar: mês a mês, ou semana a semana', () => {
    expect(diaParaApi(deslocar('mes', dia(2026, 1, 31), 1))).toBe('2026-02-28');
    expect(diaParaApi(deslocar('semana', dia(2026, 10, 1), -1))).toBe('2026-09-24');
  });

  // O backend lê o período em Brasília: pelo fuso do aparelho, em Cuiabá a OS
  // de 00:30 de domingo caía no sábado, fora da semana que a API mandou
  it('agrupa os eventos pelo dia de Brasília, qualquer que seja o fuso do aparelho', () => {
    const grupos = agruparPorDia([
      { id: 'a', data: '2026-11-03T11:00:00.000Z' }, // 08:00 em Brasília
      { id: 'b', data: '2026-11-04T01:00:00.000Z' }, // 22:00 do dia 3 em Brasília
      { id: 'c', data: '2026-11-04T03:30:00.000Z' }, // 00:30 do dia 4 em Brasília
    ]);

    expect(grupos.get('2026-11-03')?.map((e) => e.id)).toEqual(['a', 'b']);
    expect(grupos.get('2026-11-04')?.map((e) => e.id)).toEqual(['c']);
    expect(diaDoEvento('2026-11-08T02:59:00.000Z')).toBe('2026-11-07');
    expect(formatarEmBrasilia('2026-09-15T06:00:00.000Z', 'dd/MM HH:mm')).toBe('15/09 03:00');
  });

  it('o título diz o mês ou a semana', () => {
    expect(tituloDoPeriodo('mes', dia(2026, 11, 15))).toBe('Novembro de 2026');
    expect(tituloDoPeriodo('semana', dia(2026, 11, 4))).toBe('1 a 7 de nov de 2026');
    expect(tituloDoPeriodo('semana', dia(2026, 10, 1))).toBe('27 de set a 3 de out de 2026');
  });
});
