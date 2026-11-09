import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ActionConfirmPanel } from './ActionConfirmPanel';
import { linhasDosOutrosCustos, linhaNaoPrevista } from '@/features/execucao-os/utils/outros-custos';
import { linhasIniciais } from '@/features/execucao-os/utils/horas-da-equipe';

// As pessoas para quem entrou na hora (SN-61) têm o teste delas em HorasDaEquipe.test
vi.mock('@/features/execucao-os/hooks/usePessoasDaOS', () => ({ usePessoasDaOS: () => ({ data: undefined, isError: false }) }));

/**
 * Painéis de Executar e Auditar (docs/SPEC-EXECUCAO-DA-OS.md).
 * Executar tinha 11 campos; agora resultado e problemas, o motivo de cada
 * tarefa não feita e o resto recolhido. Auditar deixa o select por estrelas.
 */
describe('ActionConfirmPanel — executar', () => {
  it('pede só resultado e problemas; recomendações e incidente ficam em "Mais detalhes"', () => {
    render(<ActionConfirmPanel action="executar" entity={{ itens_orcamento: [] }} onConfirm={vi.fn()} />);

    expect(screen.getByText('Resultado do serviço')).toBeInTheDocument();
    expect(screen.getByText('Problemas encontrados')).toBeInTheDocument();
    for (const saiu of ['Atividades realizadas', 'Procedimentos seguidos', 'EPIs utilizados', 'Próxima manutenção']) {
      expect(screen.queryByText(saiu)).toBeNull();
    }
    const detalhes = screen.getByText('Mais detalhes').closest('details')!;
    expect(detalhes).not.toHaveAttribute('open');
    expect(detalhes).toHaveTextContent('Recomendações');
    expect(detalhes).toHaveTextContent('Incidente de segurança');
    // SN-93 (D2): o número único de custos adicionais saiu. As horas e os outros custos se informam
    // nas seções Equipe e Outros custos do sheet, ao lado do previsto (07/nov/2026), não aqui
    expect(screen.queryByText('Custos adicionais (R$)')).toBeNull();
    expect(screen.queryByText('Outros custos')).toBeNull();
    expect(screen.queryByText('Horas trabalhadas')).toBeNull();
  });

  // SN-93 (D2): até aqui veículo, hospedagem e alimentação ficavam só no orçamento, fora do custo real
  it('os outros custos da seção vão no payload, um por item, com o valor conferido', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const itens_orcamento = [
      { id: 'I1', descricao: 'Veículo: Picape 4x4', valor: 1316, natureza: 'VEICULO' as const },
      { id: 'I2', descricao: 'Despesa de campo: Hospedagem', valor: 1380, natureza: 'DESPESA_CAMPO' as const },
    ];
    // O que a seção Outros custos tem: o previsto preenchido, e a picape corrigida
    const outros = linhasDosOutrosCustos(itens_orcamento).map((l) => (l.chave === 'I1' ? { ...l, valor: 1402.5 } : l));
    render(<ActionConfirmPanel action="executar" entity={{ itens_orcamento }} outros={outros} onConfirm={onConfirm} />);
    fireEvent.change(screen.getByLabelText(/Resultado do serviço/), { target: { value: 'Feito' } });
    fireEvent.click(screen.getByRole('button', { name: /Confirmar Execu/i }));

    await waitFor(() => expect(onConfirm).toHaveBeenCalled());
    expect(onConfirm.mock.calls[0][0].outros_custos).toEqual([
      { id: 'I1', valor_real: 1402.5 },
      { id: 'I2', valor_real: 1380 },
    ]);
  });

  it('o não previsto sem descrição ou sem valor trava o confirmar, dizendo a seção', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const semNada = linhaNaoPrevista();
    const { rerender } = render(<ActionConfirmPanel action="executar" entity={{ itens_orcamento: [] }} outros={[semNada]} onConfirm={onConfirm} />);
    fireEvent.change(screen.getByLabelText(/Resultado do serviço/), { target: { value: 'Feito' } });
    const confirmar = screen.getByRole('button', { name: /Confirmar Execu/i });

    expect(confirmar).toBeDisabled();
    expect(screen.getByText('Outros custos: Diga o que é cada custo não previsto.')).toBeInTheDocument();
    rerender(<ActionConfirmPanel action="executar" entity={{ itens_orcamento: [] }} outros={[{ ...semNada, descricao: 'Pedágio' }]} onConfirm={onConfirm} />);
    expect(screen.getByText(/Outros custos: Informe quanto custou Pedágio/)).toBeInTheDocument();
    rerender(<ActionConfirmPanel action="executar" entity={{ itens_orcamento: [] }} outros={[{ ...semNada, descricao: 'Pedágio', valor: 85 }]} onConfirm={onConfirm} />);
    fireEvent.click(confirmar);

    await waitFor(() => expect(onConfirm).toHaveBeenCalled());
    expect(onConfirm.mock.calls[0][0].outros_custos).toEqual([{ descricao: 'Pedágio', natureza: 'OUTRO', valor_real: 85 }]);
  });

  // Revisão de falha silenciosa: o não previsto tirado no reexecutar ficava no custo (a lista vazia não ia)
  it('a lista vai inteira, mesmo vazia; sem a lista da OS, nada vai', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const { unmount } = render(<ActionConfirmPanel action="executar" entity={{ itens_orcamento: [] }} outros={[]} onConfirm={onConfirm} />);
    fireEvent.change(screen.getByLabelText(/Resultado do serviço/), { target: { value: 'Feito' } });
    fireEvent.click(screen.getByRole('button', { name: /Confirmar Execu/i }));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
    expect(onConfirm.mock.calls[0][0].outros_custos).toEqual([]);
    unmount();

    // Sem a lista do orçamento na OS, mandar apagaria os não previstos que já existem
    render(<ActionConfirmPanel action="executar" entity={{}} outros={[]} onConfirm={onConfirm} />);
    fireEvent.change(screen.getByLabelText(/Resultado do serviço/), { target: { value: 'Feito' } });
    fireEvent.click(screen.getByRole('button', { name: /Confirmar Execu/i }));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(2));
    expect(onConfirm.mock.calls[1][0]).not.toHaveProperty('outros_custos');
  });

  it('com tarefa pendente, exige o motivo de cada uma e manda no payload', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(
      <ActionConfirmPanel
        action="executar"
        entity={{}}
        tarefasPendentes={[{ id: 'V1', nome: 'Lubrificar mancal' }]}
        onConfirm={onConfirm}
      />,
    );
    const confirmar = screen.getByRole('button', { name: /Confirmar Execu/i });

    fireEvent.change(screen.getByLabelText(/Resultado do serviço/), { target: { value: 'Feito em parte' } });
    expect(confirmar).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Por que "Lubrificar mancal" não foi feita/), {
      target: { value: 'Faltou graxa' },
    });
    expect(confirmar).toBeEnabled();
    fireEvent.click(confirmar);

    await waitFor(() => expect(onConfirm).toHaveBeenCalled());
    expect(onConfirm.mock.calls[0][0]).toMatchObject({
      resultado_servico: 'Feito em parte',
      tarefas_nao_feitas: [{ id: 'V1', motivo: 'Faltou graxa' }],
    });
  });
});

describe('ActionConfirmPanel — auditar', () => {
  it('avalia em estrelas e só confirma com nota', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<ActionConfirmPanel action="auditar" entity={{}} onConfirm={onConfirm} />);
    const confirmar = screen.getByRole('button', { name: /Confirmar Auditoria/i });

    expect(confirmar).toBeDisabled();
    fireEvent.click(screen.getByRole('radio', { name: /4 estrelas/i }));
    fireEvent.click(confirmar);

    await waitFor(() => expect(onConfirm).toHaveBeenCalled());
    expect(onConfirm.mock.calls[0][0]).toMatchObject({ avaliacao_qualidade: 4 });
  });
});

describe('ActionConfirmPanel — km da viatura', () => {
  it('iniciar com reserva ativa pede o km inicial (opcional) e manda no payload', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<ActionConfirmPanel action="iniciar" entity={{ reserva_veiculo: { status: 'ativa' } }} onConfirm={onConfirm} />);

    // O campo lê ao sair dele (no navegador, o clique no botão já tira o foco)
    fireEvent.change(screen.getByLabelText('KM inicial do veículo'), { target: { value: '1200' } });
    fireEvent.blur(screen.getByLabelText('KM inicial do veículo'));
    fireEvent.click(screen.getByRole('button', { name: /Confirmar início/i }));

    await waitFor(() => expect(onConfirm).toHaveBeenCalled());
    expect(onConfirm.mock.calls[0][0]).toMatchObject({ km_inicial: 1200 });
  });

  it('"45.230" é quarenta e cinco mil km (era type="number": o navegador em português devolvia vazio e o KM sumia)', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<ActionConfirmPanel action="iniciar" entity={{ reserva_veiculo: { status: 'ativa' } }} onConfirm={onConfirm} />);

    const km = screen.getByLabelText('KM inicial do veículo');
    fireEvent.change(km, { target: { value: '45.230' } });
    fireEvent.blur(km);
    expect(km).toHaveValue('45.230');
    fireEvent.click(screen.getByRole('button', { name: /Confirmar início/i }));

    await waitFor(() => expect(onConfirm).toHaveBeenCalled());
    expect(onConfirm.mock.calls[0][0]).toMatchObject({ km_inicial: 45230 });
  });

  it('KM ilegível trava o confirmar, com aviso; apagado, confirma sem KM', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<ActionConfirmPanel action="iniciar" entity={{ reserva_veiculo: { status: 'ativa' } }} onConfirm={onConfirm} />);

    const km = screen.getByLabelText('KM inicial do veículo');
    fireEvent.change(km, { target: { value: '45230,5' } });
    fireEvent.blur(km);
    expect(screen.getByRole('alert')).toHaveTextContent('KM em número inteiro');
    expect(screen.getByRole('button', { name: /Confirmar início/i })).toBeDisabled();

    fireEvent.change(km, { target: { value: '' } });
    fireEvent.blur(km);
    const confirmar = screen.getByRole('button', { name: /Confirmar início/i });
    expect(confirmar).toBeEnabled();
    fireEvent.click(confirmar);
    await waitFor(() => expect(onConfirm).toHaveBeenCalled());
    expect(onConfirm.mock.calls[0][0]).not.toHaveProperty('km_inicial');
  });

  it('reserva já finalizada não pede km no executar', () => {
    render(<ActionConfirmPanel action="executar" entity={{ reserva_veiculo: { status: 'finalizada' } }} onConfirm={vi.fn()} />);

    expect(screen.queryByLabelText(/KM final/)).toBeNull();
  });
});

/**
 * SN-60: os dados de falha. Na corretiva, o painel pergunta se o equipamento
 * parou; sintoma, causa e ação são obrigatórios, e a parada só se parou. Nos
 * outros tipos, tudo em "Mais detalhes" e opcional.
 */
describe('ActionConfirmPanel — dados de falha', () => {
  const preencher = (rotulo: RegExp, valor: string) => fireEvent.change(screen.getByLabelText(rotulo), { target: { value: valor } });
  const confirmar = () => screen.getByRole('button', { name: /Confirmar Execu/i });
  const pad = (n: number) => String(n).padStart(2, '0');
  const local = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  it('na corretiva, pergunta se parou; sem resposta, não confirma', () => {
    render(<ActionConfirmPanel action="executar" entity={{ tipo: 'CORRETIVA' }} onConfirm={vi.fn()} />);

    preencher(/Resultado do serviço/, 'ok');
    preencher(/Sintoma/, 'Ruído');
    preencher(/Causa/, 'Folga');
    preencher(/Ação tomada/, 'Reaperto');

    expect(screen.getByText('O equipamento parou?')).toBeInTheDocument();
    expect(screen.queryByLabelText(/O equipamento parou em/)).toBeNull();
    expect(confirmar()).toBeDisabled();
  });

  it('parou: pede parada e retorno, mostra a duração e manda tudo', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<ActionConfirmPanel action="executar" entity={{ tipo: 'CORRETIVA' }} onConfirm={onConfirm} />);

    preencher(/Resultado do serviço/, 'Inversor religado');
    fireEvent.click(screen.getByRole('radio', { name: 'Sim' }));
    preencher(/O equipamento parou em/, '2026-10-16T08:20');
    preencher(/Voltou a funcionar em/, '2026-10-16T10:05');
    preencher(/Sintoma/, 'Alarme de sobretemperatura');
    preencher(/Causa/, 'Ventilador travado');
    preencher(/Ação tomada/, 'Ventilador limpo');

    expect(screen.getByText('Parado por 1 h 45 min')).toBeInTheDocument();
    fireEvent.click(confirmar());
    await waitFor(() => expect(onConfirm).toHaveBeenCalled());
    expect(onConfirm.mock.calls[0][0]).toMatchObject({
      equipamento_parou: true,
      // O datetime-local é a hora de quem está na tela; vai como o instante em UTC
      parada_inicio: new Date('2026-10-16T08:20').toISOString(),
      parada_fim: new Date('2026-10-16T10:05').toISOString(),
      falha_causa: 'Ventilador travado',
    });
  });

  // Decisão do usuário (19/out/2026): o técnico nem sempre sabe a hora
  it('parou sem saber a hora: confirma sem as datas, e o "sim" vai', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<ActionConfirmPanel action="executar" entity={{ tipo: 'CORRETIVA' }} onConfirm={onConfirm} />);

    preencher(/Resultado do serviço/, 'Inversor religado');
    fireEvent.click(screen.getByRole('radio', { name: 'Sim' }));
    preencher(/Sintoma/, 'Alarme de sobretemperatura');
    preencher(/Causa/, 'Ventilador travado');
    preencher(/Ação tomada/, 'Ventilador limpo');

    // As datas à vista, sem asterisco: quem souber, informa
    expect(screen.getByLabelText(/O equipamento parou em/)).toHaveValue('');
    fireEvent.click(confirmar());
    await waitFor(() => expect(onConfirm).toHaveBeenCalled());
    const payload = onConfirm.mock.calls[0][0];
    expect(payload).toMatchObject({ equipamento_parou: true });
    expect(payload).not.toHaveProperty('parada_inicio');
  });

  it('a resposta gravada na OS vem marcada, também sem datas', () => {
    render(<ActionConfirmPanel action="executar" entity={{ tipo: 'CORRETIVA', equipamento_parou: true }} onConfirm={vi.fn()} />);
    expect(screen.getByRole('radio', { name: 'Sim' })).toBeChecked();
  });

  // A anomalia nasce "funcionando": exigir parada obrigava a inventar uma
  it('não parou: sem datas, só sintoma, causa e ação', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<ActionConfirmPanel action="executar" entity={{ tipo: 'CORRETIVA', anomalia: { data: '2026-10-10T11:20:00.000Z' } }} onConfirm={onConfirm} />);

    preencher(/Resultado do serviço/, 'Ajustado');
    fireEvent.click(screen.getByRole('radio', { name: 'Não' }));
    preencher(/Sintoma/, 'Geração abaixo do esperado');
    preencher(/Causa/, 'String desconectada');
    preencher(/Ação tomada/, 'Conector refeito');

    expect(screen.queryByLabelText(/O equipamento parou em/)).toBeNull();
    fireEvent.click(confirmar());
    await waitFor(() => expect(onConfirm).toHaveBeenCalled());
    const payload = onConfirm.mock.calls[0][0];
    expect(payload).toMatchObject({ equipamento_parou: false, falha_sintoma: 'Geração abaixo do esperado' });
    expect(payload).not.toHaveProperty('parada_inicio');
  });

  it('a anomalia que disse "parado" já responde que parou, e a data dela é o início; o que está na OS tem preferência', () => {
    const { unmount } = render(
      <ActionConfirmPanel
        action="executar"
        entity={{ tipo: 'CORRETIVA', anomalia: { data: '2026-10-16T11:20:00.000Z', condicao: 'PARADO' } }}
        onConfirm={vi.fn()}
      />,
    );
    expect(screen.getByRole('radio', { name: 'Sim' })).toBeChecked();
    expect(screen.getByLabelText(/O equipamento parou em/)).toHaveValue(local('2026-10-16T11:20:00.000Z'));
    unmount();

    render(
      <ActionConfirmPanel
        action="executar"
        entity={{ tipo: 'CORRETIVA', anomalia: { data: '2026-10-16T11:20:00.000Z' }, parada_inicio: '2026-10-15T09:00:00.000Z', falha_causa: 'Poeira' }}
        onConfirm={vi.fn()}
      />,
    );
    expect(screen.getByLabelText(/O equipamento parou em/)).toHaveValue(local('2026-10-15T09:00:00.000Z'));
    expect(screen.getByLabelText(/Causa/)).toHaveValue('Poeira');
  });

  it('na preventiva, tudo opcional em "Mais detalhes", sem puxar a anomalia; a parada vai inteira, com o aviso à vista', () => {
    render(<ActionConfirmPanel action="executar" entity={{ tipo: 'PREVENTIVA', anomalia: { data: '2026-10-16T11:20:00.000Z' } }} onConfirm={vi.fn()} />);
    expect(screen.getByText('Mais detalhes').closest('details')).toHaveTextContent('Sintoma');
    expect(screen.getByLabelText(/O equipamento parou em/)).toHaveValue('');

    preencher(/Resultado do serviço/, 'ok');
    expect(confirmar()).toBeEnabled();

    preencher(/O equipamento parou em/, '2026-10-16T08:20');
    expect(confirmar()).toBeDisabled();
    const aviso = screen.getByRole('alert');
    expect(aviso).toHaveTextContent('os dois');
    expect(aviso.closest('details')).toBeNull();
  });

  it('retorno antes da parada: avisa e não confirma', () => {
    render(<ActionConfirmPanel action="executar" entity={{ tipo: 'CORRETIVA', anomalia: { condicao: 'PARADO' } }} onConfirm={vi.fn()} />);

    preencher(/O equipamento parou em/, '2026-10-16T10:00');
    preencher(/Voltou a funcionar em/, '2026-10-16T09:00');

    expect(screen.getByRole('alert')).toHaveTextContent('voltou a funcionar antes de parar');
    expect(confirmar()).toBeDisabled();
  });

  // Reexecutar depois de reabrir: o texto antigo vinha vazio e ficava gravado calado
  it('problemas e recomendações vêm da OS; apagados, vão como null', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<ActionConfirmPanel action="executar" entity={{ tipo: 'PREVENTIVA', problemas_encontrados: 'Folga no mancal' }} onConfirm={onConfirm} />);

    expect(screen.getByLabelText(/Problemas encontrados/)).toHaveValue('Folga no mancal');
    preencher(/Resultado do serviço/, 'ok');
    preencher(/Problemas encontrados/, '');
    fireEvent.click(confirmar());

    await waitFor(() => expect(onConfirm).toHaveBeenCalled());
    expect(onConfirm.mock.calls[0][0]).toMatchObject({ problemas_encontrados: null });
    expect(onConfirm.mock.calls[0][0]).not.toHaveProperty('recomendacoes');
  });
});

describe('ActionConfirmPanel — horas trabalhadas (SN-61)', () => {
  // As horas se digitam na seção Equipe (HorasDaEquipe.test); o painel confere e manda
  const equipe = [
    { id: 'T1', nome: 'Ana Técnica', especialidade: 'Técnico Elétrico', tecnico_id: 'U1', horas_trabalhadas: null },
    { id: 'T2', nome: null, especialidade: 'Auxiliar', horas_trabalhadas: null },
  ];
  const confirmar = () => screen.getByRole('button', { name: /Confirmar Execu/i });
  const comResultado = () => fireEvent.change(screen.getByLabelText(/Resultado do serviço/), { target: { value: 'ok' } });

  it('as horas da seção Equipe vão no payload', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const horas = linhasIniciais(equipe, null).map((l) => ({ ...l, horas: l.id === 'T1' ? 2.5 : 0 }));
    render(<ActionConfirmPanel action="executar" entity={{ id: 'OS1' }} horas={horas} onConfirm={onConfirm} />);
    comResultado();
    fireEvent.click(confirmar());

    await waitFor(() => expect(onConfirm).toHaveBeenCalled());
    expect(onConfirm.mock.calls[0][0]).toMatchObject({
      horas_dos_tecnicos: [
        { id: 'T1', horas: 2.5 },
        { id: 'T2', horas: 0 },
      ],
      tecnicos_extras: [],
    });
  });

  it('sem as horas de alguém, ou com texto ilegível, não confirma e diz onde corrigir', () => {
    const [ana] = linhasIniciais([equipe[0]], null);
    const { rerender } = render(<ActionConfirmPanel action="executar" entity={{ id: 'OS1' }} horas={[ana]} onConfirm={vi.fn()} />);
    comResultado();
    expect(confirmar()).toBeDisabled();
    expect(screen.getByText('Equipe: Informe as horas de Ana Técnica (0 se não trabalhou).')).toBeInTheDocument();

    // O texto ilegível ficava na tela e o confirmar mandava o valor de antes, calado
    rerender(<ActionConfirmPanel action="executar" entity={{ id: 'OS1' }} horas={[{ ...ana, horas: 1, ilegivel: true }]} onConfirm={vi.fn()} />);
    expect(confirmar()).toBeDisabled();
    expect(screen.getByText('Equipe: Corrija as horas de Ana Técnica (ex.: 3h30, 45min ou 3,5).')).toBeInTheDocument();

    rerender(<ActionConfirmPanel action="executar" entity={{ id: 'OS1' }} horas={[{ ...ana, horas: 0.75 }]} onConfirm={vi.fn()} />);
    expect(confirmar()).toBeEnabled();
  });

  it('OS sem equipe: confirma sem horas', () => {
    render(<ActionConfirmPanel action="executar" entity={{ id: 'OS1' }} horas={[]} onConfirm={vi.fn()} />);
    comResultado();
    expect(confirmar()).toBeEnabled();
  });
});
