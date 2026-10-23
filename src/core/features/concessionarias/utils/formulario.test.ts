import { describe, expect, it } from 'vitest';
import { doFormulario, horarioObrigatorio, paraApi } from '@/core/features/concessionarias/utils/formulario';
import type { ConcessionariaResponse } from '@/services/concessionarias.services';

/**
 * Os horários de ponta e reservado viajam (SN-11). A tela mostrava os campos,
 * mas não os carregava nem os enviava: o banco ficava sempre no padrão.
 */
describe('formulário de concessionária: horários', () => {
  const daApi = {
    id: 'c1 ',
    nome: 'Equatorial',
    estado: 'GO',
    numero_reh: '',
    data_inicio: '2026-01-01T00:00:00.000Z',
    data_validade: '2026-12-31T00:00:00.000Z',
    // O Decimal do banco chega como texto no JSON
    hora_inicio_ponta: '17.5',
    hora_fim_ponta: '20.5',
    hora_inicio_reservado: '21',
    hora_fim_reservado: '6',
    anexos: [],
  } as unknown as ConcessionariaResponse;

  it('carrega os horários da API como número', () => {
    expect(doFormulario(daApi)).toMatchObject({
      hora_inicio_ponta: 17.5,
      hora_fim_ponta: 20.5,
      hora_inicio_reservado: 21,
      hora_fim_reservado: 6,
    });
  });

  it('envia os horários no payload', () => {
    expect(paraApi({ ...doFormulario(daApi), hora_fim_ponta: 21 })).toMatchObject({
      hora_inicio_ponta: 17.5,
      hora_fim_ponta: 21,
      hora_inicio_reservado: 21,
      hora_fim_reservado: 6,
    });
  });

  it('horário apagado não vai no payload (o backend mantém o que tem)', () => {
    const payload = paraApi({ ...doFormulario(daApi), hora_inicio_ponta: null });
    expect(payload).not.toHaveProperty('hora_inicio_ponta');
  });

  it('00:00 é horário, não vazio', () => {
    expect(paraApi({ ...doFormulario(daApi), hora_fim_reservado: 0 }).hora_fim_reservado).toBe(0);
    expect(horarioObrigatorio(0)).toBeUndefined();
  });

  it('horário apagado barra o salvar (a coluna não aceita vazio; sem isso o "salvo" mentia)', () => {
    expect(horarioObrigatorio(null)).toBe('Informe o horário');
    expect(horarioObrigatorio(undefined)).toBe('Informe o horário');
    expect(horarioObrigatorio(17.5)).toBeUndefined();
  });

  it('horário sem valor na API fica vazio no formulário', () => {
    expect(doFormulario({ ...daApi, hora_fim_reservado: null } as unknown as ConcessionariaResponse).hora_fim_reservado).toBeUndefined();
  });
});
