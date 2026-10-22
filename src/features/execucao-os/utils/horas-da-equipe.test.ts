import { describe, expect, it } from 'vitest';
import {
  descreverCustoReal,
  descreverHorasHomem,
  horasDoPedido,
  linhaExtra,
  linhasIniciais,
  passaDoTempo,
  pendenciaDasHoras,
  tempoEfetivoAgora,
  totalDasHoras,
} from './horas-da-equipe';

/** As horas trabalhadas no painel do Executar (SN-61). */
describe('horas da equipe', () => {
  const equipe = [
    { id: 'T1 ', nome: 'Ana Técnica', especialidade: 'Técnico Elétrico', tecnico_id: 'U1', horas_trabalhadas: null },
    { id: 'T2', nome: null, especialidade: 'Auxiliar', horas_trabalhadas: null },
  ];

  it('cada linha começa no tempo efetivo; a linha de perfil aparece pelo perfil', () => {
    expect(linhasIniciais(equipe, 200)).toEqual([
      { chave: 'T1', id: 'T1', tecnicoId: 'U1', nome: 'Ana Técnica', detalhe: 'Técnico Elétrico', horas: 3.33, extra: false, registradaAntes: false },
      { chave: 'T2', id: 'T2', nome: 'Auxiliar (sem pessoa)', detalhe: '', horas: 3.33, extra: false, registradaAntes: false },
    ]);
  });

  it('as horas já registradas (reexecutar) valem mais que a sugestão; sem tempo, vazio', () => {
    const [ana] = linhasIniciais([{ ...equipe[0], horas_trabalhadas: 2 }], 200);
    expect(ana).toMatchObject({ horas: 2, registradaAntes: true });
    expect(linhasIniciais(equipe, null)[0].horas).toBeNull();
  });

  it('OS aberta mais que uma jornada não sugere horas (uma de dev, aberta desde abril, sugeria 4.614 h)', () => {
    expect(linhasIniciais(equipe, 12 * 60)[0].horas).toBe(12);
    expect(linhasIniciais(equipe, 276855)[0].horas).toBeNull();
    expect(linhaExtra('U9', 'Paula', 276855).horas).toBeNull();
  });

  it('não confirma sem as horas de cada um, nem com texto ilegível, nem com extra sem horas', () => {
    const linhas = linhasIniciais(equipe, null);
    expect(pendenciaDasHoras(linhas)).toBe('Informe as horas de Ana Técnica, Auxiliar (sem pessoa) (0 se não trabalhou).');
    expect(pendenciaDasHoras(linhas.map((l) => ({ ...l, horas: 0 })))).toBeNull();
    expect(pendenciaDasHoras([{ ...linhas[0], horas: 2, ilegivel: true }])).toBe('Corrija as horas de Ana Técnica (ex.: 3h30, 45min ou 3,5).');
    expect(pendenciaDasHoras([{ ...linhaExtra('U9', 'Paula'), horas: 0 }])).toBe('Paula entrou na execução: as horas precisam ser maiores que zero.');
  });

  it('o pedido separa a equipe de quem entrou na hora', () => {
    const linhas = [...linhasIniciais(equipe, 120), linhaExtra(' U9 ', 'Paula', 60)];
    expect(horasDoPedido(linhas)).toEqual({
      horas_dos_tecnicos: [
        { id: 'T1', horas: 2 },
        { id: 'T2', horas: 2 },
      ],
      tecnicos_extras: [{ tecnico_id: 'U9', horas: 1 }],
    });
    expect(totalDasHoras(linhas)).toBe('5h');
  });

  // SN-93: sem o valor da hora, o custo de quem entrou saía R$ 0, calado
  it('quem entrou na hora leva o valor da hora digitado, em centavos; sem ele, vai sem (a API usa o da equipe)', () => {
    const com = { ...linhaExtra('U9', 'Paula', 60), custoHora: 62.555 };
    expect(horasDoPedido([com]).tecnicos_extras).toEqual([{ tecnico_id: 'U9', horas: 1, custo_hora: 62.56 }]);
    expect(horasDoPedido([linhaExtra('U9', 'Paula', 60)]).tecnicos_extras).toEqual([{ tecnico_id: 'U9', horas: 1 }]);
    expect(pendenciaDasHoras([{ ...com, custoHoraIlegivel: true }])).toBe('Corrija o valor da hora de Paula (ex.: 78,50).');
  });

  it('mais horas que o tempo efetivo pede conferência (não bloqueia)', () => {
    expect(passaDoTempo(3.5, 200)).toBe(true);
    // Um minuto de folga: a sugestão arredonda em 2 casas
    expect(passaDoTempo(3.34, 200)).toBe(false);
    expect(passaDoTempo(3.33, 200)).toBe(false);
    expect(passaDoTempo(5, null)).toBe(false);
  });

  it('na leitura: HH real com o previsto; sem registro, nada', () => {
    expect(descreverHorasHomem(5.5, 8)).toBe('5h30 (8h previstas)');
    expect(descreverHorasHomem(2, 0)).toBe('2h');
    expect(descreverHorasHomem(null, 8)).toBeUndefined();
  });

  // Revisão do SN-61: a sugestão saía do tempo de quando o sheet abriu
  it('o tempo efetivo continua correndo em execução, não na pausa', () => {
    const lido = Date.UTC(2026, 9, 17, 8, 5);
    const quatroHorasDepois = lido + 4 * 3_600_000;
    expect(tempoEfetivoAgora({ tempo_efetivo_minutos: 5, tempo_efetivo_lido_em: lido, statusExecucao: 'EM_EXECUCAO' }, quatroHorasDepois)).toBe(245);
    expect(tempoEfetivoAgora({ tempo_efetivo_minutos: 5, tempo_efetivo_lido_em: lido, statusExecucao: 'PAUSADA' }, quatroHorasDepois)).toBe(5);
    expect(tempoEfetivoAgora({ tempo_efetivo_minutos: null }, quatroHorasDepois)).toBeNull();
  });

  it('o custo real diz o que não cobre', () => {
    const ana = { custo_hora: 50, horas_trabalhadas: 4 };
    const joao = { custo_hora: null, horas_trabalhadas: 4 };
    expect(descreverCustoReal(200, 8, [ana, joao])).toBe('R$ 200,00 (4h sem custo da hora)');
    expect(descreverCustoReal(200, 4, [ana])).toBe('R$ 200,00');
    // OS executada antes do SN-61: o custo saiu da hora estimada
    expect(descreverCustoReal(800, null, [{ custo_hora: 50, horas_trabalhadas: null }])).toBe('R$ 800,00 (mão de obra pela hora estimada)');
    expect(descreverCustoReal(0, null, [])).toBeUndefined();
    expect(descreverCustoReal(0, 4, [joao])).toBe('R$ 0,00 (4h sem custo da hora)');
  });
});
