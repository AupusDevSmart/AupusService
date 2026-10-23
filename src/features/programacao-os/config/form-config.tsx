// src/features/programacao-os/config/form-config.tsx - CORRIGIDA COM MAPEAMENTO DE GRUPOS
import type { FormField, FormFieldProps } from '@/types/base';
import type { BaseEntity, DadosDoFormulario } from '@/core/types/base';
import type { DadosOrigem, TarefasPorPlano } from '../types';
import type { OrigemOSValue } from '../components/origem-selector/types';
import type { AnomaliaDoCard, SolicitacaoDoCard, TarefaDoCard } from '../components/OrigemOSCard';
import type { ReservaVinculada } from '../components/ReservaVinculadaCard';
import { OrigemOSSelector } from '../components/OrigemOSSelector';
import { InstrucoesDaProgramacao } from '@/features/programacao-os/components/InstrucoesDaProgramacao';
import { HORAS_DA_VAGA, type RecursosDaProgramacao } from '@/features/programacao-os/utils/recursos-das-instrucoes';
import { PrazoDaOrigem } from '../components/PrazoDaOrigem';
import { OrigemOSCard } from '../components/OrigemOSCard';
import { MateriaisCardManager } from '@/components/common/cards/MateriaisCardManager';
import { FerramentasCardManager } from '@/components/common/cards/FerramentasCardManager';
import { TecnicosDaPlanta } from '../components/TecnicosDaPlanta';
import type { TecnicoItem } from '@/components/common/cards/TecnicosCardManager';
import { ResponsavelDaOS } from '../components/ResponsavelDaOS';
import { OrcamentoCardManager, type ItemOrcamento } from '@/components/common/cards/OrcamentoCardManager';
import { ReservaViaturaField } from '../components/ReservaViaturaField';
import { ReservaVinculadaCard } from '../components/ReservaVinculadaCard';
import { ValoresDasInstrucoes } from '@/features/programacao-os/components/ValoresDasInstrucoes';
import { linhasDeValor, type AjustesDeValor } from '@/features/programacao-os/utils/valores-das-instrucoes';

/**
 * A programação aberta no sheet, como o `getModalEntity` da página a monta:
 * `origem` já é o objeto do seletor (com `tipo`), e as relações vêm da API.
 * Só o que estes campos leem.
 */
type ProgramacaoAberta = BaseEntity & {
  status?: string;
  origem?: DadosOrigem | null;
  dados_origem?: DadosOrigem | null;
  anomalia?: AnomaliaDoCard | null;
  anomalia_id?: string;
  /** SN-93: com o valor da instrução nesta programação e o equipamento */
  tarefas_programacao?: Array<TarefaDoCard & { valor?: number | null; valor_original?: number | null; equipamento_nome?: string | null }>;
  plano_manutencao?: { id?: string } | null;
  plano_manutencao_id?: string;
  planos_selecionados?: unknown[];
  tarefas_por_plano?: TarefasPorPlano;
  solicitacao_servico?: SolicitacaoDoCard | null;
  solicitacao_servico_id?: string;
  /** As instruções avulsas gravadas (SN-86) */
  instrucoes?: Array<{
    instrucao_id?: string | null;
    codigo?: string | null;
    nome?: string | null;
    valor?: number | null;
    valor_original?: number | null;
    equipamento_nome?: string | null;
  }>;
  data_previsao_fim?: string;
  reserva_veiculo?: ReservaVinculada | null;
  observacoes_aprovacao?: string;
  data_analise?: string;
  data_aprovacao?: string;
};

/** O formulário vivo da programação: só as chaves que estes campos leem. */
type CamposDaProgramacao = DadosDoFormulario & {
  origem?: OrigemOSValue | null;
  status?: string;
  data_previsao_fim?: string;
  data_previsao_inicio?: string;
  data_hora_programada?: string;
  reserva_id?: string | null;
  reserva_veiculo?: { id?: string } | null;
  observacoes_aprovacao?: string;
  materiais?: RecursosDaProgramacao['materiais'];
  tecnicos?: RecursosDaProgramacao['tecnicos'];
  ferramentas?: RecursosDaProgramacao['ferramentas'];
  itens_orcamento?: RecursosDaProgramacao['itens_orcamento'];
  instrucoes_ids?: string[];
  /** SN-93: o valor das instruções ajustado nesta programação, pela chave da linha */
  valores_das_instrucoes?: AjustesDeValor;
  /** Fora do payload (o handleSubmit monta o dele): uma troca de instrução ainda calculando os recursos */
  recursos_em_calculo?: boolean;
  /** Fora do payload: um valor de instrução que não dá para ler (SN-93) */
  valores_ilegiveis?: boolean;
  /** Algum outro custo com valor ilegível: o Salvar mandaria o anterior calado */
  orcamento_ilegivel?: boolean;
};

/** O render de um campo: o fieldProps inteiro, com a entidade e o formulário da programação. */
type PropsDoRender = FormFieldProps & {
  entity?: ProgramacaoAberta | null;
  formData?: CamposDaProgramacao;
};

export const programacaoOSFormFields: FormField[] = [
  // Informações básicas - GRUPO: identificacao
  {
    key: 'numeroOS',
    label: 'Número da OS',
    type: 'text',
    placeholder: 'Gerado automaticamente',
    disabled: true,
    group: 'identificacao',
    width: 'half',
    showOnlyOnMode: ['view', 'edit'],
  },
  {
    key: 'status',
    label: 'Status Atual',
    type: 'select',
    disabled: true,
    options: [
      { value: 'PENDENTE', label: 'Pendente' },
      { value: 'APROVADA', label: 'Aprovada' },
      { value: 'FINALIZADA', label: 'Finalizada' },
      { value: 'CANCELADA', label: 'Cancelada' }
    ],
    group: 'identificacao',
    showOnlyOnMode: ['view', 'edit'],
    width: 'half'
  },
  {
    key: 'descricao',
    label: 'Descrição',
    type: 'textarea',
    required: true,
    placeholder: 'Descreva o serviço a ser executado',
    group: 'identificacao',
    colSpan:2,
    computeDisabled: (entity?: ProgramacaoAberta | null) => {
      return entity?.status && entity.status !== 'PENDENTE';
    }
  },
  // Origem da OS - GRUPO: origem
  {
    key: 'origem',
    label: '', // duplicava o titulo do grupo
    type: 'custom',
    component: OrigemOSSelector,
    required: true,
    defaultValue: {
      tipo: 'ANOMALIA',
      anomaliaId: undefined,
      planoId: undefined,
      tarefasSelecionadas: [],
      plantaId: undefined,
      planosSelecionados: [],
      tarefasPorPlano: {}
    },
    group: 'origem',
    showOnlyOnMode: 'create',
    colSpan: 2 // Ocupar largura total no sheet
  },
  {
    key: 'origemCard',
    label: '', // duplicava o titulo do grupo
    type: 'custom',
    group: 'origem',
    showOnlyOnMode: ['view', 'edit'],
    colSpan: 2, // Ocupar largura total no sheet
    render: (props: PropsDoRender) => {
      const { entity } = props;
      return (
        <OrigemOSCard
          origem={entity?.origem?.tipo || 'MANUAL'}
          dadosOrigem={entity?.origem || entity?.dados_origem}
          anomalia={entity?.anomalia}
          tarefas={entity?.tarefas_programacao}
          planoManutencao={entity?.plano_manutencao}
          planosSelecionados={entity?.planos_selecionados}
          tarefasPorPlano={entity?.tarefas_por_plano}
          solicitacaoServico={entity?.solicitacao_servico}
        />
      );
    }
  },
  {
    // SN-86: as instruções da programação, as das tarefas e as avulsas. É delas
    // que a OS tira o checklist, e os recursos planejados as acompanham
    key: 'instrucoes_ids',
    label: '',
    type: 'custom',
    group: 'origem',
    colSpan: 2,
    render: ({ entity, formData, value, onChange, onMultipleChange, mode, disabled }: PropsDoRender) => {
      // No cadastro a origem esta no formulario; numa OS ja salva, na entidade.
      const origem = formData?.origem;
      const tipo = origem?.tipo || entity?.origem?.tipo || 'MANUAL';

      const tarefaIds: string[] = origem?.tarefasSelecionadas?.length
        ? origem.tarefasSelecionadas
        : (entity?.tarefas_programacao || [])
            .map((t) => t?.tarefa_id || t?.tarefa?.id || t?.id)
            .filter((id): id is string => Boolean(id));
      const editavel = mode !== 'view' && !disabled;

      return (
        <InstrucoesDaProgramacao
          tipo={tipo}
          anomaliaId={origem?.anomaliaId || entity?.anomalia?.id || entity?.anomalia_id}
          solicitacaoId={
            origem?.solicitacaoServicoId ||
            entity?.solicitacao_servico?.id ||
            entity?.solicitacao_servico_id
          }
          planoId={origem?.planoId || entity?.plano_manutencao?.id || entity?.plano_manutencao_id}
          tarefaIds={tarefaIds}
          valor={Array.isArray(value) ? (value as string[]) : undefined}
          onValor={editavel ? (ids) => onChange(ids) : undefined}
          semearDaOrigem={mode === 'create'}
          gravadas={(entity?.instrucoes ?? [])
            .filter((i) => i.instrucao_id)
            .map((i) => ({ id: String(i.instrucao_id).trim(), codigo: i.codigo ?? undefined, nome: i.nome ?? undefined }))}
          recursos={{
            materiais: formData?.materiais ?? [],
            ferramentas: formData?.ferramentas ?? [],
            tecnicos: formData?.tecnicos ?? [],
            itens_orcamento: formData?.itens_orcamento ?? [],
          }}
          onRecursos={onMultipleChange ? (recursos) => onMultipleChange({ ...recursos }) : undefined}
          onCalculando={onMultipleChange ? (sim) => onMultipleChange({ recursos_em_calculo: sim }) : undefined}
        />
      );
    },
    // Salvar com a troca ainda calculando gravaria a instrução sem os recursos dela
    validation: (_valor: unknown, formData?: CamposDaProgramacao) =>
      formData?.recursos_em_calculo ? 'Aguarde: os recursos das instruções ainda estão sendo calculados.' : null,
  },


  // Classificação - GRUPO: classificacao
  {
    key: 'tipo',
    label: 'Tipo de OS',
    type: 'select',
    required: true,
    options: [
      { value: 'PREVENTIVA', label: 'Preventiva' },
      { value: 'PREDITIVA', label: 'Preditiva' },
      { value: 'CORRETIVA', label: 'Corretiva' },
      { value: 'INSPECAO', label: 'Inspeção' },
      { value: 'VISITA_TECNICA', label: 'Visita Técnica' }
    ],
    group: 'classificacao',
    width: 'third', // 33.33% em desktop (3 campos na linha)
    computeDisabled: (entity?: ProgramacaoAberta | null) => {
      return entity?.status && entity.status !== 'PENDENTE';
    }
  },
  {
    key: 'prioridade',
    label: 'Prioridade',
    type: 'select',
    required: true,
    // Os valores de PrioridadeOS no backend. "Urgente" estava aqui e nao existe
    // la (400 ao salvar), e "Critica" faltava.
    options: [
      { value: 'BAIXA', label: 'Baixa' },
      { value: 'MEDIA', label: 'Média' },
      { value: 'ALTA', label: 'Alta' },
      { value: 'CRITICA', label: 'Crítica' }
    ],
    group: 'classificacao',
    width: 'third', // 33.33% em desktop (3 campos na linha)
    computeDisabled: (entity?: ProgramacaoAberta | null) => {
      return entity?.status && entity.status !== 'PENDENTE';
    }
  },
  {
    key: 'condicoes',
    label: 'Condições do Ativo',
    type: 'select',
    required: true,
    options: [
      { value: 'PARADO', label: 'Parado' },
      { value: 'FUNCIONANDO', label: 'Funcionando' }
    ],
    group: 'classificacao',
    width: 'third', // 33.33% em desktop (3 campos na linha)
    computeDisabled: (entity?: ProgramacaoAberta | null) => {
      return entity?.status && entity.status !== 'PENDENTE';
    }
  },

  // Planejamento - GRUPO: planejamento
  {
    key: 'data_previsao_inicio',
    label: 'Data e Hora Prevista Início',
    type: 'datetime-local',
    group: 'planejamento',
    width: 'half', // 50% em desktop
    computeDisabled: (entity?: ProgramacaoAberta | null) => {
      return entity?.status && entity.status !== 'PENDENTE';
    }
  },
  {
    key: 'data_previsao_fim',
    label: 'Data e Hora Prevista Fim',
    type: 'datetime-local',
    group: 'planejamento',
    width: 'half', // 50% em desktop
    computeDisabled: (entity?: ProgramacaoAberta | null) => {
      return entity?.status && entity.status !== 'PENDENTE';
    }
  },
  {
    /**
     * O prazo que a origem impoe, ao lado das datas de planejamento.
     *
     * Sem isto o prazo so pintava uma celula na lista de anomalias, que ninguem
     * abre para programar — a cobranca nao alcancava o momento da decisao. Dava
     * para agendar para o dia 30 uma anomalia que vence dia 25, sem aviso.
     *
     * Avisa, nao impede: as vezes nao da mesmo, e uma trava faria a pessoa
     * contornar por fora, tirando do sistema a informacao de que aquela OS
     * nasceu atrasada.
     */
    key: 'prazo_origem',
    label: '',
    type: 'custom',
    group: 'planejamento',
    colSpan: 2,
    excludeFromSubmit: true,
    render: ({ entity, formData }: PropsDoRender) => {
      const origem = formData?.origem;
      const tipo = origem?.tipo || entity?.origem?.tipo;

      return (
        <PrazoDaOrigem
          tipo={tipo}
          anomaliaId={origem?.anomaliaId || entity?.anomalia?.id || entity?.anomalia_id}
          solicitacaoId={
            origem?.solicitacaoServicoId ||
            entity?.solicitacao_servico?.id ||
            entity?.solicitacao_servico_id
          }
          previsaoFim={formData?.data_previsao_fim || entity?.data_previsao_fim}
        />
      );
    },
  },
  {
    key: 'duracao_estimada',
    label: 'Duração Estimada (horas)',
    type: 'number',
    required: true,
    placeholder: 'Ex: 6',
    group: 'planejamento',
    width: 'half', // 50% em desktop
    computeDisabled: (entity?: ProgramacaoAberta | null) => {
      return entity?.status && entity.status !== 'PENDENTE';
    }
  },

  // ============================
  // CAMPOS DE PROGRAMAÇÃO - COMENTADOS POR ENQUANTO
  // ============================

  // TODO: Descomentar quando for implementada a programação detalhada
  /*
  // Programação - GRUPO: programacao
  {
    key: 'data_hora_programada',
    label: 'Data e Hora Programada',
    type: 'datetime-local',
    group: 'programacao',
    computeDisabled: (entity: any) => {
      return entity?.status && entity.status !== 'PENDENTE';
    }
  },
  {
    key: 'responsavel',
    label: 'Responsável',
    type: 'text',
    placeholder: 'Nome do responsável',
    group: 'programacao',
    computeDisabled: (entity: any) => {
      return entity?.status && entity.status !== 'PENDENTE';
    }
  },
  {
    key: 'responsavel_id',
    label: 'ID do Responsável',
    type: 'text',
    placeholder: 'ID do usuário responsável',
    group: 'programacao',
    computeDisabled: (entity: any) => {
      return entity?.status && entity.status !== 'PENDENTE';
    }
  },
  {
    key: 'time_equipe',
    label: 'Time/Equipe',
    type: 'text',
    placeholder: 'Ex: Equipe de Manutenção A',
    group: 'programacao',
    computeDisabled: (entity: any) => {
      return entity?.status && entity.status !== 'PENDENTE';
    }
  },
  */

  // Veículo - GRUPO: veiculo
  {
    key: 'necessita_veiculo',
    label: 'Necessita Veículo',
    type: 'checkbox',
    defaultValue: false, // ✅ Sempre iniciar com false para evitar uncontrolled
    group: 'veiculo',
    computeDisabled: (entity?: ProgramacaoAberta | null) => {
      return entity?.status && entity.status !== 'PENDENTE';
    }
  },
  {
    key: 'reserva_veiculo',
    label: 'Reserva de Veículo',
    type: 'custom',
    component: ReservaViaturaField,
    componentProps: (formData: CamposDaProgramacao) => ({
      dataProgramada: formData?.data_hora_programada || formData?.data_previsao_inicio,
      reservaId: formData?.reserva_id || formData?.reserva_veiculo?.id
    }),
    showOnlyWhen: {
      field: 'necessita_veiculo',
      value: true
    },
    showOnlyOnMode: ['create', 'edit'],
    group: 'veiculo',
    colSpan: 2, // Ocupar largura total no sheet
    computeDisabled: (entity?: ProgramacaoAberta | null) => {
      return entity?.status && entity.status !== 'PENDENTE';
    }
  },
  {
    key: 'reserva_vinculada',
    label: 'Reserva de Veículo Vinculada',
    type: 'custom',
    showOnlyWhen: {
      field: 'necessita_veiculo',
      value: true
    },
    showOnlyOnMode: 'view',
    group: 'veiculo',
    colSpan: 2, // Ocupar largura total no sheet
    render: (props: PropsDoRender) => {
      const { entity } = props;
      return (
        <ReservaVinculadaCard
          reserva={entity?.reserva_veiculo}
        />
      );
    }
  },

  // Recursos - Materiais - GRUPO: recursos
  {
    key: 'materiais',
    label: 'Materiais Necessários',
    type: 'custom',
    component: MateriaisCardManager,
    componentProps: {
      mode: 'planejamento',
      showCustos: true,
      showStatus: true,
      title: 'Materiais Planejados'
    },
    defaultValue: [],
    group: 'recursos',
    colSpan: 2, // Ocupar largura total no sheet
    computeDisabled: (entity?: ProgramacaoAberta | null) => {
      return entity?.status && entity.status !== 'PENDENTE';
    }
  },

  // Recursos - Ferramentas - GRUPO: recursos
  {
    key: 'ferramentas',
    label: 'Ferramentas Necessárias',
    type: 'custom',
    component: FerramentasCardManager,
    componentProps: {
      mode: 'planejamento',
      showStatus: true,
      showCalibracao: true,
      title: 'Ferramentas Planejadas'
    },
    defaultValue: [],
    group: 'recursos',
    colSpan: 2, // Ocupar largura total no sheet
    computeDisabled: (entity?: ProgramacaoAberta | null) => {
      return entity?.status && entity.status !== 'PENDENTE';
    }
  },

  // Responsável e equipe - GRUPO: equipe (SN-31: pessoas são usuários)
  // `render`, e não `component`: só o render recebe o formData (de onde sai a
  // planta) e o onMultipleChange (id e nome do responsável juntos)
  {
    key: 'responsavel_id',
    label: 'Responsável',
    type: 'custom',
    // Embrulhado: o ResponsavelDaOS nao recebe onChange, e o valor do campo e o id (texto).
    render: (props: FormFieldProps) => (
      <ResponsavelDaOS
        value={props.value as string | null | undefined}
        formData={props.formData}
        onMultipleChange={props.onMultipleChange}
        disabled={props.disabled}
      />
    ),
    group: 'equipe',
    colSpan: 2,
    computeDisabled: (entity?: ProgramacaoAberta | null) => {
      return entity?.status && entity.status !== 'PENDENTE';
    }
  },
  {
    key: 'tecnicos',
    label: 'Técnicos Necessários',
    type: 'custom',
    render: ({ value, onChange, formData, disabled }: FormFieldProps & { value?: TecnicoItem[] }) => (
      <TecnicosDaPlanta
        value={value ?? []}
        onChange={onChange}
        formData={formData}
        disabled={disabled}
        mode="planejamento"
        showCustos
        showStatus
        title="Equipe Planejada"
      />
    ),
    defaultValue: [],
    // As horas de cada técnico, de 0,25 a 24 (o servidor recusa fora disso). A
    // vaga que a instrução abre sem duração vem com 0 h para a programação
    // preencher; antes o salvar trocava o vazio por 8 h, calado
    validation: (value: unknown) => {
      const sem = (Array.isArray(value) ? (value as TecnicoItem[]) : []).filter((t) => {
        const horas = Number(t?.horas_estimadas);
        return !Number.isFinite(horas) || horas < HORAS_DA_VAGA.minimo || horas > HORAS_DA_VAGA.maximo;
      });
      if (!sem.length) return null;
      const quem = [...new Set(sem.map((t) => t.nome?.trim() || t.especialidade?.trim() || 'técnico'))].join(', ');
      return `Informe as horas de cada técnico, de 0,25 a 24 h: ${quem}`;
    },
    group: 'equipe',
    colSpan: 2, // Ocupar largura total no sheet
    computeDisabled: (entity?: ProgramacaoAberta | null) => {
      return entity?.status && entity.status !== 'PENDENTE';
    }
  },

  // Orçamento - GRUPO: orcamento
  // SN-93 (D1): o valor de cada instrução, o do cadastro no vínculo, ajustável só nesta programação
  {
    key: 'valores_das_instrucoes',
    label: '',
    type: 'custom',
    group: 'orcamento',
    colSpan: 2,
    render: ({ entity, formData, value, onChange, onMultipleChange, mode, disabled }: PropsDoRender) => (
      <ValoresDasInstrucoes
        linhas={linhasDeValor(entity)}
        ajustes={(value as AjustesDeValor | undefined) ?? formData?.valores_das_instrucoes ?? {}}
        onChange={onChange}
        onIlegivel={onMultipleChange ? (sim) => onMultipleChange({ valores_ilegiveis: sim }) : undefined}
        criando={mode === 'create'}
        disabled={disabled || mode === 'view' || (entity?.status !== undefined && entity.status !== 'PENDENTE')}
      />
    ),
    // Salvar com um valor ilegível gravaria o anterior calado
    validation: (_valor: unknown, formData?: CamposDaProgramacao) =>
      formData?.valores_ilegiveis ? 'Corrija o valor da instrução marcado em vermelho (ex.: 1.402,50).' : null,
  },
  {
    key: 'itens_orcamento',
    label: '', // duplicava o titulo do grupo
    type: 'custom',
    // `render`, não `component`: só o render recebe o formData e o onMultipleChange, e o valor
    // ilegível tem de travar o Salvar
    render: ({ entity, formData, value, onChange, onMultipleChange, mode, disabled }: PropsDoRender) => (
      <OrcamentoCardManager
        title="Outros Custos"
        value={(value as ItemOrcamento[] | undefined) ?? []}
        onChange={onChange}
        disabled={disabled || mode === 'view' || (entity?.status !== undefined && entity.status !== 'PENDENTE')}
        custoMateriais={(formData?.materiais || []).reduce((acc: number, m) => acc + (m.custo_unitario || 0) * (m.quantidade_planejada || 0), 0)}
        custoEquipe={(formData?.tecnicos || []).reduce((acc: number, t) => acc + (t.custo_hora || 0) * (t.horas_estimadas || 0), 0)}
        onIlegivel={onMultipleChange ? (sim) => onMultipleChange({ orcamento_ilegivel: sim }) : undefined}
      />
    ),
    validation: (_valor: unknown, formData?: CamposDaProgramacao) =>
      formData?.orcamento_ilegivel ? 'Corrija o valor do outro custo marcado em vermelho (ex.: 1.402,50).' : null,
    defaultValue: [],
    group: 'orcamento',
    colSpan: 2,
    computeDisabled: (entity?: ProgramacaoAberta | null) => {
      return entity?.status && entity.status !== 'PENDENTE';
    }
  },

  // Observações - GRUPO: observacoes

  // ============================
  // CAMPOS DE WORKFLOW ESPECÍFICOS
  // ============================

  // ============================
  // CAMPOS DE VISUALIZAÇÃO POR STATUS
  // ============================

  // Campos de aprovacao - mostrar quando aprovada ou finalizada
  {
    key: 'observacoes_aprovacao',
    label: 'Observações da Aprovação',
    type: 'textarea',
    placeholder: 'Observações da aprovação',
    disabled: true,
    group: 'workflow',
    colSpan: 2,
    condition: (entity?: ProgramacaoAberta | null, data?: CamposDaProgramacao) => {
      const status = data?.status || entity?.status;
      return ['APROVADA', 'FINALIZADA'].includes(status ?? '') && (data?.observacoes_aprovacao || entity?.observacoes_aprovacao);
    }
  },

  // Campos de finalizacao - mostrar quando finalizada
  {
    key: 'observacoes_finalizacao',
    label: 'Observações da Finalização',
    type: 'textarea',
    placeholder: 'Sem observações',
    disabled: true,
    group: 'workflow',
    colSpan: 2,
    showOnlyOnMode: ['view'],
    condition: (entity?: ProgramacaoAberta | null, data?: CamposDaProgramacao) => {
      const status = data?.status || entity?.status;
      return status === 'FINALIZADA';
    }
  },
  {
    key: 'finalizado_por',
    label: 'Finalizado Por',
    type: 'text',
    disabled: true,
    group: 'workflow',
    colSpan: 1,
    showOnlyOnMode: ['view'],
    condition: (entity?: ProgramacaoAberta | null, data?: CamposDaProgramacao) => {
      const status = data?.status || entity?.status;
      return status === 'FINALIZADA';
    }
  },
  {
    key: 'data_finalizacao',
    label: 'Data da Finalização',
    type: 'datetime-local',
    disabled: true,
    group: 'workflow',
    colSpan: 1,
    showOnlyOnMode: ['view'],
    condition: (entity?: ProgramacaoAberta | null, data?: CamposDaProgramacao) => {
      const status = data?.status || entity?.status;
      return status === 'FINALIZADA';
    }
  },

  // Campo de cancelamento - mostrar sempre quando cancelada
  {
    key: 'motivo_cancelamento',
    label: 'Motivo do Cancelamento',
    type: 'textarea',
    placeholder: 'Motivo do cancelamento',
    disabled: true,
    group: 'workflow',
    colSpan: 2,
    condition: (entity?: ProgramacaoAberta | null, data?: CamposDaProgramacao) => {
      const status = data?.status || entity?.status;
      return status === 'CANCELADA';
    }
  },


  // Campos de auditoria - GRUPO: auditoria
  {
    key: 'criado_por',
    label: 'Criado Por',
    type: 'text',
    disabled: true,
    showOnlyOnMode: ['view', 'edit'],
    group: 'auditoria',
    width: 'half' // 50% em desktop
  },
  {
    key: 'data_criacao',
    label: 'Data de Criação',
    type: 'datetime-local',
    disabled: true,
    showOnlyOnMode: ['view'],
    group: 'auditoria',
    width: 'half' // 50% em desktop
  },
  {
    key: 'analisado_por',
    label: 'Analisado Por',
    type: 'text',
    disabled: true,
    showOnlyOnMode: ['view'],
    group: 'auditoria',
    width: 'half', // 50% em desktop
    condition: (entity?: ProgramacaoAberta | null) => entity?.data_analise
  },
  {
    key: 'data_analise',
    label: 'Data da Análise',
    type: 'datetime-local',
    disabled: true,
    showOnlyOnMode: ['view'],
    group: 'auditoria',
    width: 'half', // 50% em desktop
    condition: (entity?: ProgramacaoAberta | null) => entity?.data_analise
  },
  {
    key: 'aprovado_por',
    label: 'Aprovado Por',
    type: 'text',
    disabled: true,
    showOnlyOnMode: ['view'],
    group: 'auditoria',
    width: 'half', // 50% em desktop
    condition: (entity?: ProgramacaoAberta | null) => entity?.data_aprovacao
  },
  {
    key: 'data_aprovacao',
    label: 'Data da Aprovação',
    type: 'datetime-local',
    disabled: true,
    showOnlyOnMode: ['view'],
    group: 'auditoria',
    width: 'half', // 50% em desktop
    condition: (entity?: ProgramacaoAberta | null) => entity?.data_aprovacao
  }
];

// Configuração dos grupos para o modal - ATUALIZADA COM WORKFLOW
/**
 * A ordem dos grupos e a ordem em que a pessoa decide:
 *
 *   1. de onde vem o servico (origem) — define local, ativo, instrucoes e prazo
 *   2. o que sera feito (descricao, tipo, prioridade, condicao do ativo)
 *   3. quando (planejamento, com o prazo da origem ao lado)
 *   4. com que veiculo, recursos e custo
 *
 * A descricao vinha antes da origem, entao se escrevia o servico sem saber
 * ainda a que anomalia ou solicitacao ele respondia. Numero e status so
 * existem depois de salvo (view/edit) e ficam no topo para identificar o
 * registro; na criacao o grupo fica vazio e some.
 */
export const programacaoOSFormGroups = [
  {
    key: 'identificacao',
    title: 'Identificação da OS',
    fields: ['numeroOS', 'status']
  },
  {
    key: 'origem',
    title: 'Origem da Ordem de Serviço',
    // ATENCAO: com `groups` declarado, o BaseForm monta cada grupo por ESTA
    // lista, e ignora o `group:` do campo. Campo que nao esta aqui simplesmente
    // nao renderiza, sem erro nenhum.
    fields: ['origem', 'origemCard', 'instrucoes_origem', 'planosManutencaoDetalhes']
  },
  {
    key: 'classificacao',
    title: 'Serviço',
    // Descricao em largura total; tipo, prioridade e condicao cabem numa linha
    // so, sao escolhas curtas de uma palavra.
    columns: 3,
    fields: ['descricao', 'tipo', 'prioridade', 'condicoes']
  },
  {
    key: 'planejamento',
    title: 'Planejamento',
    // Inicio, fim e duracao lado a lado — a duracao so faz sentido lida
    // junto das datas que ela mede.
    columns: 3,
    fields: ['data_previsao_inicio', 'data_previsao_fim', 'duracao_estimada', 'prazo_origem']
  },
  // TODO: Descomentar quando implementar programação detalhada
  /*
  {
    key: 'programacao',
    title: 'Programação',
    fields: ['data_hora_programada', 'responsavel', 'responsavel_id', 'time_equipe']
  },
  */
  {
    key: 'equipe',
    title: 'Responsável e equipe',
    // Quem responde pela OS e quem vai a campo, escolhidos entre os usuários
    // da equipe da planta ou do planejamento (SN-31)
    fields: ['responsavel_id', 'tecnicos']
  },
  {
    key: 'veiculo',
    title: 'Requisitos de Veículo',
    fields: ['necessita_veiculo', 'reserva_veiculo', 'reserva_vinculada']
  },
  {
    key: 'recursos',
    title: 'Recursos Necessários',
    fields: ['materiais', 'ferramentas']
  },
  {
    key: 'orcamento',
    title: 'Orçamento',
    fields: ['valores_das_instrucoes', 'itens_orcamento']
  },
  {
    key: 'workflow',
    title: 'Histórico de Ações',
    fields: [
      'observacoes_aprovacao',
      'observacoes_finalizacao', 'finalizado_por', 'data_finalizacao',
      'motivo_cancelamento'
    ],
    conditional: {
      field: 'status',
      value: function(entity?: ProgramacaoAberta | null) {
        // Mostrar grupo sempre que o status indica que passou por alguma ação de workflow
        return entity?.status && entity.status !== 'PENDENTE';
      }
    }
  },
  {
    key: 'auditoria',
    title: 'Informações de Auditoria',
    fields: [
      'criado_por', 'data_criacao', 'analisado_por', 'data_analise',
      'aprovado_por', 'data_aprovacao'
    ],
    conditional: {
      field: 'status',
      value: function() {
        return true;
      }
    }
  }
];