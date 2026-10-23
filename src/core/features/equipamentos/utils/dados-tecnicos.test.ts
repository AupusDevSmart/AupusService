import { describe, expect, it } from 'vitest';
import { separarDadosTecnicos } from './dados-tecnicos';

/**
 * Os campos técnicos vêm da categoria (SN-42). Na edição, o equipamento abre
 * com os campos padrão da categoria preenchidos com o gravado; o gravado fora
 * do padrão segue como personalizado, para nada sumir no próximo salvar.
 */
describe('separarDadosTecnicos', () => {
  it('os campos da categoria vêm preenchidos com o que está gravado', () => {
    const { padrao } = separarDadosTecnicos('Motor Elétrico', [{ campo: 'potencia', valor: '75' }]);

    expect(padrao.find((c) => c.campo === 'potencia')).toMatchObject({ rotulo: 'Potência', valor: '75', unidade: 'kW' });
    expect(padrao.find((c) => c.campo === 'tensao_nominal')?.valor).toBe('');
  });

  it('o gravado que não é da categoria segue como personalizado', () => {
    const extra = { campo: 'capacidade_ruptura', valor: '1' };
    const { personalizados } = separarDadosTecnicos('Motor Elétrico', [{ campo: 'potencia', valor: '75' }, extra]);

    expect(personalizados).toEqual([extra]);
  });

  it('o nome da categoria vale sem acento nem caixa', () => {
    expect(separarDadosTecnicos('motor eletrico').padrao.length).toBeGreaterThan(0);
  });

  it('categoria sem mapeamento: nada padrão, tudo gravado vira personalizado', () => {
    const gravados = [{ campo: 'x', valor: '1' }];
    expect(separarDadosTecnicos('Categoria que não existe', gravados)).toEqual({ padrao: [], personalizados: gravados });
    expect(separarDadosTecnicos(undefined, gravados)).toEqual({ padrao: [], personalizados: gravados });
  });

  it('campo de seleção leva as opções da categoria', () => {
    const { padrao } = separarDadosTecnicos('MG – Módulo Geral');
    expect(padrao[0]).toMatchObject({ tipo: 'select', opcoes: ['Abrigo', 'Cercamento', 'Casa Comando', 'Pátio'] });
  });
});
