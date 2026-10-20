import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { IndicadorApi } from '@/services/dashboard-manutencao.services';
import { CartaoIndicador, ComoSeCalcula } from './PainelPrimitivos';

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

  it('a seção "Como cada número é calculado" lista todas as fórmulas', () => {
    render(<ComoSeCalcula indicadores={[mttr, { ...mttr, id: 'outro', rotulo: 'Backlog', formula: 'Soma do tempo estimado das OS abertas.' }, { ...mttr, id: 'sem', rotulo: 'Sem fórmula', formula: undefined }]} />);

    expect(screen.getByText('Como cada número é calculado')).toBeInTheDocument();
    expect(screen.getByText(mttr.formula!)).toBeInTheDocument();
    expect(screen.getByText('Soma do tempo estimado das OS abertas.')).toBeInTheDocument();
    expect(screen.queryByText('Sem fórmula')).toBeNull();
  });
});
