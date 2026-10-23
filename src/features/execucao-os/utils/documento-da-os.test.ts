import { describe, expect, it } from 'vitest';
import type { ConteudoDaOS, RelatorioDaOS } from '@/services/execucao-os.service';
import type { ResumoDoCusto } from '@/features/execucao-os/types/custos';
import { codigoAgrupado, documentoDaOS } from './documento-da-os';

/** O PDF da OS (SN-62) montado do conteúdo gravado na finalização. */
const CODIGO = 'ab12cd34'.repeat(8);

const conteudo = (mudar: Partial<ConteudoDaOS> = {}): ConteudoDaOS => ({
  versao: 2,
  os: {
    numero_os: 'OS-2026-0042',
    tipo: 'CORRETIVA',
    prioridade: 'ALTA',
    origem: 'ANOMALIA',
    descricao: 'Inversor 3 desligando',
    local: 'Usina Norte',
    ativo: 'INV-03',
    condicoes: 'PARADO',
    data_hora_programada: null,
    data_hora_inicio_real: '2026-10-16T11:00:00.000Z',
    data_hora_fim_real: '2026-10-16T14:00:00.000Z',
    tempo_efetivo_minutos: 170,
    responsavel: 'Ana Técnica',
    resultado_servico: 'Ventilador trocado',
    problemas_encontrados: null,
    recomendacoes: 'Limpar o filtro a cada 3 meses',
    incidentes_seguranca: null,
    parada_inicio: '2026-10-16T09:00:00.000Z',
    parada_fim: '2026-10-16T14:00:00.000Z',
    falha_sintoma: 'Alarme de sobretemperatura',
    falha_causa: 'Ventilador travado',
    falha_acao: 'Ventilador trocado',
    custo_real: 234.5,
    avaliacao_qualidade: 4,
    observacoes_qualidade: null,
    aprovado_por: 'Gil Gerente',
    data_aprovacao: '2026-10-16T18:00:00.000Z',
    finalizado_por: 'Gil Gerente',
    finalizada_em: '2026-10-17T12:00:00.000Z',
  },
  tarefas: [
    { id: 'T1', nome: 'Trocar ventilador', instrucao_tag: 'INS-7', instrucao_nome: 'Ventilação', status: 'CONCLUIDA', data_conclusao: '2026-10-16T13:00:00.000Z', concluida_por: 'Ana Técnica', observacoes: null, equipamento: 'Inversor 03', valor: 902.08, valor_original: 902.08 },
    { id: 'T2', nome: 'Termografia', instrucao_tag: null, instrucao_nome: null, status: 'CANCELADA', data_conclusao: null, concluida_por: null, observacoes: 'Câmera sem bateria', equipamento: null, valor: null, valor_original: null },
  ],
  checklist: [
    { id: 'C1', tarefa_os_id: 'T1', atividade: 'Medir a tensão de saída', obrigatoria: true, concluida: true, concluida_em: '2026-10-16T12:30:00.000Z', concluida_por: 'Ana Técnica', tipo: 'LEITURA', unidade: 'V', valor_minimo: 580, valor_maximo: 620, valor_lido: 640, observacoes: 'Rede alta' },
    { id: 'C2', tarefa_os_id: 'T1', atividade: 'Trocar ventilador: Conferir o aperto', obrigatoria: true, concluida: false, concluida_em: null, concluida_por: null, tipo: 'VERIFICACAO', unidade: null, valor_minimo: null, valor_maximo: null, valor_lido: null, observacoes: null },
    { id: 'C3', tarefa_os_id: null, atividade: 'Isolar a área', obrigatoria: false, concluida: true, concluida_em: null, concluida_por: null, tipo: 'VERIFICACAO', unidade: null, valor_minimo: null, valor_maximo: null, valor_lido: null, observacoes: null },
  ],
  anexos: [
    { id: 'A1', nome_original: 'antes.jpg', tipo: 'FOTO_ANTES', mime_type: 'image/jpeg', tamanho: 10, descricao: null, tarefa_os_id: 'T1', checklist_item_id: 'C1', uploaded_at: '2026-10-16T12:00:00.000Z', uploaded_by: 'Ana Técnica', sha256: 'f'.repeat(64) },
    { id: 'A2', nome_original: 'sumiu.jpg', tipo: 'FOTO_DEPOIS', mime_type: 'image/jpeg', tamanho: 10, descricao: null, tarefa_os_id: null, checklist_item_id: null, uploaded_at: null, uploaded_by: null, sha256: null },
    { id: 'A3', nome_original: 'laudo.pdf', tipo: 'LAUDO', mime_type: 'application/pdf', tamanho: 10, descricao: null, tarefa_os_id: 'T2', checklist_item_id: null, uploaded_at: null, uploaded_by: 'Gil Gerente', sha256: 'e'.repeat(64) },
  ],
  equipe: [
    { id: 'E1', nome: 'Ana Técnica', especialidade: 'Técnico Elétrico', horas_estimadas: 4, horas_trabalhadas: 3.5, presente: true, custo_hora: 78 },
    { id: 'E2', nome: null, especialidade: 'Auxiliar', horas_estimadas: 4, horas_trabalhadas: 0, presente: false, custo_hora: null },
  ],
  materiais: [{ id: 'M1', descricao: 'Ventilador 120 mm', unidade: 'UN', quantidade_planejada: 1, quantidade_consumida: 1, observacoes: 'do estoque', custo_unitario: 180 }],
  ferramentas: [{ id: 'F1', descricao: 'Multímetro', quantidade: 1, utilizada: true, condicao_antes: 'boa', condicao_depois: 'boa', observacoes: null }],
  ...mudar,
});

/** O resumo como a API o manda (a conta é dela: aqui só a leitura) */
const custos = (mudar: Partial<ResumoDoCusto> = {}): ResumoDoCusto => ({
  previsto: 1802,
  real: 1855.5,
  orcamento_previsto: 1802,
  ajuste_do_orcamento: 0,
  outros_fora_do_total: false,
  naturezas: [
    { natureza: 'MAO_DE_OBRA', rotulo: 'Mão de obra', previsto: 312, real: 273 },
    { natureza: 'MATERIAL', rotulo: 'Material', previsto: 180, real: 180 },
    { natureza: 'VEICULO', rotulo: 'Veículo', previsto: 1310, real: 1402.5 },
    { natureza: 'DESPESA_CAMPO', rotulo: 'Despesas de campo', previsto: 0, real: 0 },
  ],
  equipe: [
    { nome: 'Ana Técnica', especialidade: 'Técnico Elétrico', horas_previstas: 4, horas_trabalhadas: 3.5, valor_hora: 78, previsto: 312, real: 273 },
    { nome: 'Auxiliar (sem pessoa)', especialidade: 'Auxiliar', horas_previstas: 4, horas_trabalhadas: 0, valor_hora: null, previsto: 0, real: 0 },
  ],
  materiais: [{ descricao: 'Ventilador 120 mm', unidade: 'UN', quantidade_planejada: 1, quantidade_consumida: 1, custo_unitario: 180, previsto: 180, real: 180 }],
  outros: [
    { descricao: 'Veículo: Picape 4x4', natureza: 'VEICULO', rotulo: 'Veículo', previsto: 1310, real: 1402.5, no_real: 1402.5, conferido: true, nao_previsto: false },
    { descricao: 'Pedágio', natureza: 'VEICULO', rotulo: 'Veículo', previsto: 0, real: null, no_real: 0, conferido: false, nao_previsto: true },
  ],
  instrucoes: [
    { codigo: 'INS-7', nome: 'Trocar ventilador', equipamento: 'Inversor 03', status: 'CONCLUIDA', feita: true, valor: 850, valor_original: 902.08, ajustado: true, do_cadastro_hoje: false },
    { codigo: null, nome: 'Termografia', equipamento: null, status: 'CANCELADA', feita: false, valor: 400, valor_original: null, ajustado: false, do_cadastro_hoje: true },
  ],
  instrucoes_total: 1250,
  instrucoes_feitas: 1,
  instrucoes_feitas_total: 850,
  pendencias: ['Sem valor/hora, fora do custo: Auxiliar (sem pessoa) (0 h).'],
  ...mudar,
});

const relatorio = (mudar: Partial<RelatorioDaOS> = {}): RelatorioDaOS => ({
  os_id: 'OS1',
  numero_os: 'OS-2026-0042',
  status: 'FINALIZADA',
  codigo: CODIGO,
  finalizada_em: '2026-10-17T12:00:00.000Z',
  previa: false,
  conteudo: conteudo(),
  custos: custos(),
  ...mudar,
});

const foto = { src: 'data:image/jpeg;base64,AAAA', largura: 1200, altura: 900 };
const montar = (r = relatorio(), fotos = new Map<string, typeof foto | string>([['A1', foto]])) =>
  documentoDaOS(r, { planta: 'Planta Norte', equipamento: 'Inversor 3' }, fotos, `https://app/execucao-os?conferir=${CODIGO}`);

describe('documento da OS (PDF)', () => {
  it('o código em grupos de 8', () => {
    expect(codigoAgrupado(CODIGO)).toBe(Array(8).fill('ab12cd34').join(' '));
    expect(codigoAgrupado(null)).toBe('');
  });

  it('identificação no horário de Brasília, o tempo efetivo do conteúdo e a verificação com o código', () => {
    const d = montar();

    expect(d.meta).toEqual(['Nº OS-2026-0042', 'Finalizada em 17/10/2026, 09:00', expect.stringMatching(/^Emitido em /), 'Horários de Brasília']);
    expect(d.identificacao).toEqual(
      expect.arrayContaining([
        ['Tipo', 'Corretiva'],
        ['Local', 'Usina Norte · INV-03'],
        ['Início', '16/10/2026, 08:00'],
        ['Tempo efetivo', '2 h 50 min, sem as pausas'],
      ]),
    );
    // Os nomes do cadastro de hoje, à parte: não entram no código
    expect(d.cadastro).toEqual([
      ['Planta', 'Planta Norte'],
      ['Equipamento', 'Inversor 3'],
    ]);
    expect(d.aviso).toBeNull();
    expect(d.verificacao).toEqual({ codigo: CODIGO, agrupado: codigoAgrupado(CODIGO), url: `https://app/execucao-os?conferir=${CODIGO}` });
  });

  it('falha com o tempo parado; só os textos preenchidos', () => {
    const d = montar();
    expect(d.falha).toEqual(expect.arrayContaining([['Tempo parado', '5 h'], ['Causa', 'Ventilador travado']]));
    expect(d.textos.map((t) => t.titulo)).toEqual(['Resultado do serviço', 'Recomendações']);
  });

  // SN-60 (19/out/2026): o horário da parada é opcional; o "sim" sem ele aparece
  it('parou sem o horário: o PDF diz que parou, sem as datas nem o tempo parado', () => {
    const c = conteudo();
    const d = montar(relatorio({ conteudo: { ...c, os: { ...c.os, equipamento_parou: true, parada_inicio: null, parada_fim: null } } }));
    expect(d.falha).toEqual(expect.arrayContaining([['Equipamento parou', 'Sim, sem o horário da parada']]));
    expect(d.falha.map(([rotulo]) => rotulo)).not.toContain('Tempo parado');
  });

  it('tarefa não feita com o motivo; checklist por tarefa, leitura fora da faixa, obrigatório não feito, itens gerais', () => {
    const d = montar();

    expect(d.tarefas[1]).toEqual({ nome: 'Termografia', equipamento: '', situacao: 'Não feita', quem: '', observacao: 'Motivo: Câmera sem bateria' });
    expect(d.tarefas[0]).toMatchObject({ nome: 'INS-7 · Trocar ventilador', equipamento: 'Inversor 03' });
    // SN-93: o grupo diz de qual equipamento (nove "Termografia e reaperto" iguais não diziam)
    expect(d.checklist.map((g) => g.tarefa)).toEqual(['INS-7 · Trocar ventilador · Inversor 03', 'Itens gerais']);
    expect(d.checklist[0].itens[0]).toMatchObject({ leitura: '640 V — fora da faixa (580 a 620 V)', observacao: 'Rede alta' });
    expect(d.checklist[0].itens[0].feito).toMatch(/^Feito · Ana Técnica · 16\/10\/2026/);
    expect(d.checklist[0].itens[1].feito).toBe('Não feito (obrigatório)');
    // O nome da tarefa na frente do item sai: o título do grupo já o tem
    expect(d.checklist[0].itens[1].atividade).toBe('Conferir o aperto');
  });

  it('equipe com as horas, o valor da hora e o custo (D3); a auditoria sem o custo, que tem seção própria', () => {
    const d = montar();
    const sem = (t: string) => t.replace(/\s/g, ' ');

    expect(d.equipe.map((t) => ({ ...t, valorHora: sem(t.valorHora), custo: sem(t.custo) }))).toEqual([
      { nome: 'Ana Técnica · Técnico Elétrico', estimadas: '4h', trabalhadas: '3h30', valorHora: 'R$ 78,00', custo: 'R$ 273,00', presente: 'Sim' },
      { nome: 'Auxiliar (sem pessoa)', estimadas: '4h', trabalhadas: '0h', valorHora: '—', custo: 'sem valor/hora', presente: 'Não' },
    ]);
    expect(d.totalDaEquipe).toBe('Horas-homem: 3h30 (8h previstas)');
    expect(sem(d.materiais[0].unitario)).toBe('R$ 180,00');
    expect(d.auditoria.map(([r]) => r)).not.toContain('Custo real');
    expect(d.auditoria).toEqual(expect.arrayContaining([['Nota da auditoria', '4 de 5']]));
  });

  // SN-93: o custo aberto, com o real em destaque contra o previsto
  it('custos: o real contra o previsto, as naturezas com valor, as instruções e os outros custos', () => {
    const c = montar().custos!;
    const sem = (t: string) => t.replace(/\s/g, ' ');

    expect([sem(c.real), sem(c.previsto), sem(c.diferenca)]).toEqual(['R$ 1.855,50', 'R$ 1.802,00', '+R$ 53,50 (+3%)']);
    // A natureza sem previsto nem real não ocupa linha
    expect(c.naturezas.map((n) => n.rotulo)).toEqual(['Mão de obra', 'Material', 'Veículo']);
    expect(sem(c.naturezas[0].diferenca)).toBe('−R$ 39,00 (−12,5%)');
    expect(c.instrucoes.map((i) => [i.nome, i.equipamento, i.situacao, sem(i.valor), i.detalhe && sem(i.detalhe)])).toEqual([
      ['INS-7 · Trocar ventilador', 'Inversor 03', 'Feita', 'R$ 850,00', 'ajustado; cadastro R$ 902,08'],
      ['Termografia', '', 'Não feita', 'R$ 400,00', 'do cadastro de hoje'],
    ]);
    expect(sem(c.resumoDasInstrucoes!)).toBe('1 de 2 feitas · R$ 850,00 de R$ 1.250,00');
    expect(c.outros.map((o) => [o.natureza, sem(o.previsto), sem(o.real)])).toEqual([
      ['Veículo', 'R$ 1.310,00', 'R$ 1.402,50'],
      ['Veículo · não previsto', '—', 'R$ 0,00 (não conferido)'],
    ]);
    expect(c.pendencias).toEqual(['Sem valor/hora, fora do custo: Auxiliar (sem pessoa) (0 h).']);
  });

  it('custos da OS finalizada antes do SN-93: os outros custos fora do total, sem "−100%"', () => {
    const sem = (t: string) => t.replace(/\s/g, ' ');
    const antiga = custos({
      previsto: 312,
      real: 273,
      orcamento_previsto: 1802,
      outros_fora_do_total: true,
      naturezas: [
        { natureza: 'MAO_DE_OBRA', rotulo: 'Mão de obra', previsto: 312, real: 273 },
        { natureza: 'VEICULO', rotulo: 'Veículo', previsto: 1310, real: null },
      ],
      outros: [{ descricao: 'Veículo: Picape', natureza: 'VEICULO', rotulo: 'Veículo', previsto: 1310, real: null, no_real: null, conferido: false, nao_previsto: false }],
    });
    const c = montar(relatorio({ custos: antiga })).custos!;
    expect([sem(c.previsto), sem(c.diferenca), c.ajuste]).toEqual(['R$ 312,00', '−R$ 39,00 (−12,5%)', null]);
    expect(c.naturezas[1]).toMatchObject({ rotulo: 'Veículo', real: 'fora do total', diferenca: '—' });
    expect(c.outros[0].real).toBe('não conferido, fora do total');
  });

  it('sem custo nenhum (OS sem recurso nem instrução), a seção não sai', () => {
    const zerado = custos({ previsto: 0, real: 0, orcamento_previsto: null, naturezas: [], instrucoes: [], outros: [], equipe: [], materiais: [] });
    expect(montar(relatorio({ custos: zerado })).custos).toBeNull();
  });

  it('cada foto que não entra diz por quê; documento vai para a lista', () => {
    const d = montar();

    expect(d.fotos[0]).toMatchObject({ legenda: 'Foto de antes · Medir a tensão de saída', foto, falha: null });
    expect(d.fotos[0].detalhe).toContain(`SHA-256 ${'f'.repeat(16)}…`);
    expect(d.fotos[1]).toMatchObject({ foto: null, falha: 'arquivo não encontrado no servidor' });
    expect(d.documentos).toEqual([{ nome: 'laudo.pdf · Laudo', detalhe: expect.stringContaining('Termografia') }]);
  });

  it('antes da auditoria, quem aprovou foi a programação, não o auditor', () => {
    const naoAuditada = montar(relatorio({ status: 'EXECUTADA', previa: true, codigo: null, conteudo: conteudo({ os: { ...conteudo().os, avaliacao_qualidade: null } }) }));
    expect(naoAuditada.auditoria.map(([r]) => r)).toContain('Programação aprovada por');
    expect(montar().auditoria.map(([r]) => r)).toContain('Auditada por');
  });

  it('prévia e finalizada antes do código: aviso, sem verificação', () => {
    const previa = montar(relatorio({ status: 'AUDITADA', previa: true, codigo: null }));
    expect(previa.aviso).toMatch(/^Prévia: a OS ainda não foi finalizada/);
    expect(previa.verificacao).toBeNull();
    expect(previa.meta[1]).toBe('Prévia');

    const antiga = montar(relatorio({ codigo: null }));
    expect(antiga.aviso).toMatch(/^OS finalizada antes de o código de verificação existir/);
    expect(antiga.verificacao).toBeNull();
  });

  it('equipe sem horas registradas (OS antiga): diz que não foram registradas', () => {
    const d = montar(
      relatorio({ conteudo: conteudo({ equipe: [{ id: 'E1', nome: 'Ana', especialidade: 'Soldador', horas_estimadas: 8, horas_trabalhadas: null, presente: false }] }) }),
    );
    expect(d.equipe[0]).toMatchObject({ trabalhadas: '—', presente: '—' });
    expect(d.totalDaEquipe).toBe('Horas-homem não registradas (8h previstas)');
  });

  it('o que o código prova e o PDF não imprimia: observação do material, condição antes da ferramenta', () => {
    const d = montar();
    expect(d.materiais[0].descricao).toBe('Ventilador 120 mm · do estoque');
    expect(d.ferramentas[0].utilizada).toBe('Sim · antes: boa · depois: boa');
  });
});
