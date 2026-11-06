import { describe, expect, it } from 'vitest';
import type { ResumoDoCusto } from '../types/custos';
import { maoDeObraDasHoras, naturezasAteAgora, outrosDoPainel, totalAteAgora } from './custo-ate-agora';
import type { LinhaDeHoras } from './horas-da-equipe';
import type { LinhaDeOutroCusto } from './outros-custos';

// A OS do print do usuário (06/nov/2026): só equipe, instrumentos e o L200, nada de material
const naturezas: ResumoDoCusto['naturezas'] = [
  { natureza: 'MAO_DE_OBRA', rotulo: 'Mão de obra', previsto: 1376.12, real: 1376.12 },
  { natureza: 'MATERIAL', rotulo: 'Material', previsto: 0, real: 0 },
  { natureza: 'INSTRUMENTO', rotulo: 'Instrumentos', previsto: 297.17, real: 297.17 },
  { natureza: 'VEICULO', rotulo: 'Veículo', previsto: 75, real: 75 },
];

const hora = (l: Partial<LinhaDeHoras>): LinhaDeHoras => ({ chave: l.id ?? 'x', nome: 'X', detalhe: '', horas: null, extra: false, ...l });
const outro = (l: Partial<LinhaDeOutroCusto>): LinhaDeOutroCusto => ({
  chave: 'k',
  descricao: 'd',
  natureza: 'INSTRUMENTO',
  previsto: null,
  valor: null,
  naoPrevisto: false,
  ...l,
});

/** O custo até agora, na tela, sem confirmar a execução (pedido do usuário, 06/nov/2026) */
describe('custo até agora', () => {
  it('sem nada registrado, é a conta da API: o total já aparece (antes ficava "—")', () => {
    const linhas = naturezasAteAgora(naturezas, { material: 0 });
    expect(totalAteAgora(linhas)).toBe(1748.29);
  });

  it('o material registrado na tela entra na linha dele e no total', () => {
    const linhas = naturezasAteAgora(naturezas, { material: 120 });
    expect(linhas.find((n) => n.natureza === 'MATERIAL')!.real).toBe(120);
    expect(totalAteAgora(linhas)).toBe(1868.29);
  });

  it('com o painel de concluir aberto: as horas digitadas e os outros custos conferidos', () => {
    const tecnicos = [
      { id: 'T1', custo_hora: 127.39 },
      { id: 'T2', custo_hora: 30.77 },
    ];
    const maoDeObra = maoDeObraDasHoras(
      [hora({ id: 'T1', horas: 4 }), hora({ id: 'T2', horas: 0 }), hora({ chave: 'extra:U9', extra: true, horas: 2, custoHora: 50 })],
      tecnicos,
    );
    expect(maoDeObra).toBe(609.56); // 4 × 127,39 + 0 + 2 × 50

    const outros = outrosDoPainel([
      outro({ natureza: 'INSTRUMENTO', previsto: 200, valor: 180 }),
      outro({ natureza: 'INSTRUMENTO', previsto: 97.17, valor: null }), // vazio: o previsto
      outro({ natureza: 'VEICULO', previsto: 75, valor: 90 }),
      outro({ natureza: 'OUTRO', naoPrevisto: true, valor: 40 }),
    ]);
    expect(outros).toEqual({ INSTRUMENTO: 277.17, VEICULO: 90, NAO_PREVISTO: 40 });

    const linhas = naturezasAteAgora(naturezas, { material: 0, maoDeObra, outros });
    expect(linhas.find((n) => n.natureza === 'MAO_DE_OBRA')!.real).toBe(609.56);
    // O não previsto lançado agora ganha a linha dele
    expect(linhas.find((n) => n.natureza === 'NAO_PREVISTO')).toMatchObject({ rotulo: 'Não previstos', previsto: 0, real: 40 });
    expect(totalAteAgora(linhas)).toBe(1016.73);
  });

  it('natureza que saiu do painel fica em zero, não com o previsto antigo', () => {
    const linhas = naturezasAteAgora(naturezas, { material: 0, outros: { INSTRUMENTO: 297.17 } });
    expect(linhas.find((n) => n.natureza === 'VEICULO')!.real).toBe(0);
  });

  it('natureza fora do total (OS antiga) continua fora', () => {
    const antigas = naturezas.map((n) => (n.natureza === 'VEICULO' ? { ...n, real: null } : n));
    const linhas = naturezasAteAgora(antigas, { material: 0, outros: { VEICULO: 90 } });
    expect(linhas.find((n) => n.natureza === 'VEICULO')!.real).toBeNull();
  });
});
