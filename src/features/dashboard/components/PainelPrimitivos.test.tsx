import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { IndicadorApi } from '@/services/dashboard-manutencao.services';
import { CartaoIndicador, LegendaDasFormulas, Quadro } from './PainelPrimitivos';

const mttr: IndicadorApi = {
  id: 'mttr',
  icone: 'clock',
  rotulo: 'MTTR',
  valor: '0,5',
  unidade: 'h',
  nota: 'base: 1 parada',
  status: null,
  formula: 'Média de (fim − início da parada) das corretivas que pararam com horário.',
  base: '3 corretivas concluídas no período: 2 pararam o equipamento (1 com horário, 1 sem).',
};

/** A fórmula de cada indicador visível na tela (SN-80). */
describe('fórmula dos indicadores', () => {
  it('o cartão abre a fórmula e a base no clique', async () => {
    render(<CartaoIndicador indicador={mttr} />);
    // Abre no clique (e no toque): a dica do Radix não abria no celular
    fireEvent.click(screen.getByRole('button', { name: 'Como se calcula: MTTR' }));

    expect((await screen.findAllByText(mttr.formula!)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(mttr.base!).length).toBeGreaterThan(0);
  });

  it('sem fórmula, base nem pendência, o cartão não tem o ícone', () => {
    render(<CartaoIndicador indicador={{ ...mttr, formula: undefined, base: undefined }} />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  // A legenda fica atrás de um botão: a tela não carrega um bloco de texto
  it('"Como se calcula" abre a legenda com os cartões e os gráficos', async () => {
    render(
      <LegendaDasFormulas
        indicadores={[mttr, { ...mttr, id: 'sem', rotulo: 'Sem fórmula', formula: undefined }]}
        graficos={[{ id: 'custo', rotulo: 'Custo de manutenção', formula: 'Mão de obra + material + adicionais.', base: '2 OS concluídas.' }]}
      />,
    );
    expect(screen.queryByText(mttr.formula!)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /Como se calcula/ }));

    expect(await screen.findByRole('dialog', { name: 'Como se calcula' })).toBeInTheDocument();
    expect(screen.getByText('Indicadores')).toBeInTheDocument();
    expect(screen.getByText('Gráficos')).toBeInTheDocument();
    expect(screen.getByText(mttr.formula!)).toBeInTheDocument();
    expect(screen.getByText('Mão de obra + material + adicionais.')).toBeInTheDocument();
    expect(screen.getByText('2 OS concluídas.')).toBeInTheDocument();
    expect(screen.queryByText('Sem fórmula')).toBeNull();
  });

  it('sem nenhuma fórmula, o botão não aparece', () => {
    render(<LegendaDasFormulas indicadores={[{ ...mttr, formula: undefined }]} graficos={[]} />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  // SN-81: o gráfico de custo diz como sai, como o cartão
  it('o gráfico abre a fórmula e a base no ícone, com a pendência junto', async () => {
    render(
      <Quadro titulo="Custo de manutenção" pendencia="Falta o orçado." explicacao={{ formula: 'Mão de obra + material + adicionais.', base: '2 OS concluídas.' }}>
        <div />
      </Quadro>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Como se calcula: Custo de manutenção' }));

    expect(await screen.findByText('Mão de obra + material + adicionais.')).toBeInTheDocument();
    expect(screen.getByText('2 OS concluídas.')).toBeInTheDocument();
    expect(screen.getByText('Falta o orçado.')).toBeInTheDocument();
  });

  it('o gráfico sem fórmula fica só com a pendência na dica', () => {
    render(
      <Quadro titulo="Backlog por idade" pendencia="Falta registrar a equipe.">
        <div />
      </Quadro>,
    );
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByTitle('Falta registrar a equipe.')).toBeInTheDocument();
  });
});
