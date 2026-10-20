import { describe, expect, it } from 'vitest';
import { opcionaisApagaveis } from './payload-do-veiculo';

/** SN-78: apagar um opcional do veículo no editar apaga (antes o campo vazio nem ia). */
describe('opcionaisApagaveis', () => {
  it('vazio e ausente vão null; o texto vai aparado', () => {
    expect(opcionaisApagaveis({ cor: '  Prata ', proximaRevisao: '', vencimentoSeguro: '2027-03-01', observacoes: '   ' })).toEqual({
      cor: 'Prata',
      proximaRevisao: null,
      responsavel: null,
      observacoes: null,
      chassi: null,
      renavam: null,
      seguradora: null,
      vencimentoSeguro: '2027-03-01',
    });
  });

  it('null que veio do formulário continua null', () => {
    expect(opcionaisApagaveis({ seguradora: null }).seguradora).toBeNull();
  });
});
