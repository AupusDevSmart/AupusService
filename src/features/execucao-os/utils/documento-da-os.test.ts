import { describe, expect, it } from 'vitest';
import type { ConteudoDaOS, RelatorioDaOS } from '@/services/execucao-os.service';
import { codigoAgrupado, documentoDaOS } from './documento-da-os';

/** O PDF da OS (SN-62) montado do conteúdo gravado na finalização. */
const CODIGO = 'ab12cd34'.repeat(8);

const conteudo = (mudar: Partial<ConteudoDaOS> = {}): ConteudoDaOS => ({
  versao: 1,
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
    { id: 'T1', nome: 'Trocar ventilador', instrucao_tag: 'INS-7', instrucao_nome: 'Ventilação', status: 'CONCLUIDA', data_conclusao: '2026-10-16T13:00:00.000Z', concluida_por: 'Ana Técnica', observacoes: null },
    { id: 'T2', nome: 'Termografia', instrucao_tag: null, instrucao_nome: null, status: 'CANCELADA', data_conclusao: null, concluida_por: null, observacoes: 'Câmera sem bateria' },
  ],
  checklist: [
    { id: 'C1', tarefa_os_id: 'T1', atividade: 'Medir a tensão de saída', obrigatoria: true, concluida: true, concluida_em: '2026-10-16T12:30:00.000Z', concluida_por: 'Ana Técnica', tipo: 'LEITURA', unidade: 'V', valor_minimo: 580, valor_maximo: 620, valor_lido: 640, observacoes: 'Rede alta' },
    { id: 'C2', tarefa_os_id: 'T1', atividade: 'Conferir o aperto', obrigatoria: true, concluida: false, concluida_em: null, concluida_por: null, tipo: 'VERIFICACAO', unidade: null, valor_minimo: null, valor_maximo: null, valor_lido: null, observacoes: null },
    { id: 'C3', tarefa_os_id: null, atividade: 'Isolar a área', obrigatoria: false, concluida: true, concluida_em: null, concluida_por: null, tipo: 'VERIFICACAO', unidade: null, valor_minimo: null, valor_maximo: null, valor_lido: null, observacoes: null },
  ],
  anexos: [
    { id: 'A1', nome_original: 'antes.jpg', tipo: 'FOTO_ANTES', mime_type: 'image/jpeg', tamanho: 10, descricao: null, tarefa_os_id: 'T1', checklist_item_id: 'C1', uploaded_at: '2026-10-16T12:00:00.000Z', uploaded_by: 'Ana Técnica', sha256: 'f'.repeat(64) },
    { id: 'A2', nome_original: 'sumiu.jpg', tipo: 'FOTO_DEPOIS', mime_type: 'image/jpeg', tamanho: 10, descricao: null, tarefa_os_id: null, checklist_item_id: null, uploaded_at: null, uploaded_by: null, sha256: null },
    { id: 'A3', nome_original: 'laudo.pdf', tipo: 'LAUDO', mime_type: 'application/pdf', tamanho: 10, descricao: null, tarefa_os_id: 'T2', checklist_item_id: null, uploaded_at: null, uploaded_by: 'Gil Gerente', sha256: 'e'.repeat(64) },
  ],
  equipe: [
    { id: 'E1', nome: 'Ana Técnica', especialidade: 'Técnico Elétrico', horas_estimadas: 4, horas_trabalhadas: 3.5, presente: true },
    { id: 'E2', nome: null, especialidade: 'Auxiliar', horas_estimadas: 4, horas_trabalhadas: 0, presente: false },
  ],
  materiais: [{ id: 'M1', descricao: 'Ventilador 120 mm', unidade: 'UN', quantidade_planejada: 1, quantidade_consumida: 1, observacoes: 'do estoque' }],
  ferramentas: [{ id: 'F1', descricao: 'Multímetro', quantidade: 1, utilizada: true, condicao_antes: 'boa', condicao_depois: 'boa', observacoes: null }],
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

  it('tarefa não feita com o motivo; checklist por tarefa, leitura fora da faixa, obrigatório não feito, itens gerais', () => {
    const d = montar();

    expect(d.tarefas[1]).toEqual({ nome: 'Termografia', situacao: 'Não feita', quem: '', observacao: 'Motivo: Câmera sem bateria' });
    expect(d.tarefas[0].nome).toBe('INS-7 · Trocar ventilador');
    expect(d.checklist.map((g) => g.tarefa)).toEqual(['INS-7 · Trocar ventilador', 'Itens gerais']);
    expect(d.checklist[0].itens[0]).toMatchObject({ leitura: '640 V — fora da faixa (580 a 620 V)', observacao: 'Rede alta' });
    expect(d.checklist[0].itens[0].feito).toMatch(/^Feito · Ana Técnica · 16\/10\/2026/);
    expect(d.checklist[0].itens[1].feito).toBe('Não feito (obrigatório)');
  });

  it('equipe com as horas e o total; custo e auditoria', () => {
    const d = montar();

    expect(d.equipe).toEqual([
      { nome: 'Ana Técnica · Técnico Elétrico', estimadas: '4h', trabalhadas: '3h30', presente: 'Sim' },
      { nome: 'Auxiliar (sem pessoa)', estimadas: '4h', trabalhadas: '0h', presente: 'Não' },
    ]);
    expect(d.totalDaEquipe).toBe('Horas-homem: 3h30 (8h previstas)');
    expect(d.auditoria).toEqual(expect.arrayContaining([['Custo real', 'R$ 234,50'], ['Nota da auditoria', '4 de 5']]));
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
