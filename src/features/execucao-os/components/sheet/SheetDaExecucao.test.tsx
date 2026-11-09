import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { OSDoSheet } from './SecoesDeLeitura';

// As peças que buscam na API viram marcas: aqui se testa a ordem do sheet
vi.mock('../AnexosDaOS', () => ({ AnexosDaOS: () => <h3>Fotos e documentos</h3> }));
vi.mock('../BotaoPdfDaOS', () => ({ BotaoPdfDaOS: () => <button type="button">PDF</button> }));
vi.mock('../OrigemOSCardWrapper', () => ({ OrigemOSCardWrapper: () => <p>Origem</p> }));
vi.mock('@/features/comentarios/components/ComentariosDoRegistro', () => ({ ComentariosDoRegistro: () => <h3>Comentários</h3> }));
vi.mock('../CustosDaOS', () => ({ CustosDaOS: () => <h3>Custos</h3> }));
vi.mock('@/features/execucao-os/hooks/usePessoasDaOS', () => ({ usePessoasDaOS: () => ({ data: [], isError: false }) }));
vi.mock('../OQueFoiFeito', () => ({ OQueFoiFeito: () => <h3>O que foi feito</h3> }));

const { SheetDaExecucao } = await import('./SheetDaExecucao');

const os = (mudar: Partial<OSDoSheet> = {}): OSDoSheet =>
  ({
    id: 'OS1',
    numero_os: 'OSS-2026-0002',
    descricao: 'O&M Preventiva usina de telhado/residencial',
    status: 'EM_EXECUCAO',
    statusExecucao: 'EM_EXECUCAO',
    tipo: 'PREVENTIVA',
    prioridade: 'MEDIA',
    data_hora_programada: '2026-11-06T13:00:00.000Z',
    data_hora_inicio_real: '2026-11-06T13:10:00.000Z',
    tarefas_os: [{ id: 'V1', nome_snapshot: 'Limpeza', status: 'PENDENTE', ordem: 1 }],
    checklist: [],
    materiaisConsumidos: [{ id: 'M1', descricao: 'Graxa', quantidade_planejada: 2, unidade: 'kg' }],
    ferramentasUtilizadas: [],
    tecnicos: [{ id: 'T1', nome: '', especialidade: 'Eletricista', horas_estimadas: 5.25 }],
    custos: { naturezas: [] },
    historico: [],
    ...mudar,
  }) as unknown as OSDoSheet;

const montar = (o: OSDoSheet, pendingAction: 'executar' | null = null) =>
  render(
    <SheetDaExecucao
      os={o}
      pendingAction={pendingAction}
      onAcao={vi.fn()}
      onConfirmar={vi.fn()}
      temPermissao={() => true}
      ehCliente={false}
      onRecarregar={vi.fn()}
      onRascunhoDoComentario={vi.fn()}
    />,
  );

/** Os títulos das seções, na ordem em que aparecem */
const ordem = () =>
  screen
    .getAllByRole('heading', { level: 3 })
    .map((h) => h.textContent?.trim())
    .filter(Boolean);

/**
 * Uma ordem só, em qualquer status (revisão com o usuário, 07/nov/2026):
 * Resumo · Ações · O que foi feito · Materiais · Equipe · Viatura · Fotos ·
 * Resultado · Avaliação · Custos · Comentários · Histórico · Verificação · Concluir
 */
describe('SheetDaExecucao', () => {
  it('em execução: o que é a OS primeiro, o trabalho no meio e o concluir por último', () => {
    montar(os());

    expect(ordem()).toEqual([
      'Resumo',
      'Ações',
      'O que foi feito',
      'Materiais e ferramentas usados',
      'Equipe',
      'Fotos e documentos',
      'Custos',
      'Comentários',
      'Concluir a execução',
    ]);
    // O Executar não fica no topo
    expect(screen.queryByRole('button', { name: /^Executar$/ })).toBeNull();
  });

  it('concluindo: os custos vão para dentro do painel, logo antes do botão', () => {
    montar(os(), 'executar');

    const titulos = ordem();
    expect(titulos.indexOf('Custos')).toBeGreaterThan(titulos.indexOf('Concluir a execução'));
    expect(titulos.filter((t) => t === 'Custos')).toHaveLength(1);
    const custos = screen.getByRole('heading', { name: 'Custos' });
    const confirmar = screen.getByRole('button', { name: /Confirmar execução/ });
    expect(custos.compareDocumentPosition(confirmar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('executada: o resultado antes dos custos, e nada de concluir', () => {
    montar(
      os({
        status: 'EXECUTADA',
        statusExecucao: 'EXECUTADA',
        resultado_servico: 'Limpeza feita',
        tarefas_os: [{ id: 'V1', nome_snapshot: 'Limpeza', status: 'CONCLUIDA', ordem: 1 }] as OSDoSheet['tarefas_os'],
      }),
    );

    const titulos = ordem();
    expect(titulos.indexOf('Resultado')).toBeLessThan(titulos.indexOf('Custos'));
    expect(titulos).not.toContain('Concluir a execução');
    expect(screen.getByText('Limpeza feita')).toBeInTheDocument();
  });

  it('pendente: os materiais planejados, sem "usado"', () => {
    montar(os({ status: 'PENDENTE', statusExecucao: 'PENDENTE', data_hora_inicio_real: undefined }));

    expect(ordem()).toContain('Materiais e ferramentas planejados');
    expect(screen.queryByLabelText(/Quantidade usada/)).toBeNull();
  });

  it('nenhuma ação rola o sheet (o Executar da tabela abria rolando até o fim)', () => {
    const rolar = vi.fn();
    Element.prototype.scrollIntoView = rolar;
    montar(os(), 'executar');
    expect(rolar).not.toHaveBeenCalled();
  });
});
