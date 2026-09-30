import { describe, expect, it } from 'vitest';
import { registrosAlterados } from './registro-da-execucao';

/**
 * O editar da execução salva o que a OS em andamento registra: consumo de
 * material e uso de ferramenta (PATCH :id/materiais e :id/ferramentas). Só vai
 * o que mudou — cada gravação entra no histórico da OS.
 */
describe('registrosAlterados', () => {
  const materiaisOriginais = [
    { id: 'MAT1 ', descricao: 'Graxa', quantidade_planejada: 2, quantidade_consumida: 0 },
    { id: 'MAT2', descricao: 'Óleo', quantidade_planejada: 1, quantidade_consumida: 1 },
  ];
  const ferramentasOriginais = [
    { id: 'FER1', descricao: 'Chave 13', quantidade: 1, utilizada: false },
    { id: 'FER2', descricao: 'Multímetro', quantidade: 1, utilizada: true, condicao_depois: 'OK' },
  ];

  it('manda só o material cujo consumo mudou, com id sem espaço', () => {
    const r = registrosAlterados(
      { materiais: materiaisOriginais, ferramentas: ferramentasOriginais },
      {
        materiais: [{ ...materiaisOriginais[0], quantidade_consumida: 1.5 }, materiaisOriginais[1]],
        ferramentas: ferramentasOriginais,
      },
    );

    expect(r.materiais).toEqual([{ id: 'MAT1', quantidade_consumida: 1.5 }]);
    expect(r.ferramentas).toEqual([]);
  });

  it('manda a ferramenta cujo uso ou condição mudou', () => {
    const r = registrosAlterados(
      { materiais: materiaisOriginais, ferramentas: ferramentasOriginais },
      {
        materiais: materiaisOriginais,
        ferramentas: [{ ...ferramentasOriginais[0], utilizada: true }, ferramentasOriginais[1]],
      },
    );

    expect(r.ferramentas).toEqual([{ id: 'FER1', utilizada: true }]);
  });

  it('ignora item sem id do servidor (linha nova ainda não gravada)', () => {
    const r = registrosAlterados(
      { materiais: materiaisOriginais, ferramentas: [] },
      {
        materiais: [...materiaisOriginais, { id: 'temp_123', descricao: 'Novo', quantidade_planejada: 1, quantidade_consumida: 3 }],
        ferramentas: [],
      },
    );

    expect(r.materiais).toEqual([]);
  });

  it('nada alterado: nada a mandar', () => {
    const r = registrosAlterados(
      { materiais: materiaisOriginais, ferramentas: ferramentasOriginais },
      { materiais: materiaisOriginais, ferramentas: ferramentasOriginais },
    );

    expect(r).toEqual({ materiais: [], ferramentas: [] });
  });
});
