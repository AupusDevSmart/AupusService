import type { Equipamento } from '@/core/features/equipamentos/types';

export type DadoTecnicoDoPayload = { campo: string; valor: string; tipo: string; unidade?: string };

/** O que o sheet devolve por `onSubmit`: o componente no formato da API (snake_case). */
export type DadosDoComponenteUAR = {
  /** Obrigatorio: o sheet nao submete sem ele. */
  nome: string;
  tag?: string;
  classificacao: 'UAR';
  equipamento_pai_id?: string;
  unidade_id?: string;
  fabricante?: string;
  fabricante_custom?: string;
  modelo?: string;
  numero_serie?: string;
  criticidade?: Equipamento['criticidade'];
  /** O CODIGO do tipo (compatibilidade); o id vai em `tipo_equipamento_id`. */
  tipo_equipamento?: string;
  tipo_equipamento_id?: string;
  data_instalacao?: string;
  localizacao_especifica?: string;
  fornecedor?: string;
  valor_imobilizado?: number;
  valor_depreciacao?: number;
  valor_contabil?: number;
  observacoes?: string;
  dados_tecnicos: DadoTecnicoDoPayload[];
};

/**
 * O formulario do sheet: o componente em camelCase, como os inputs guardam,
 * mais os campos tecnicos — cada um pela propria chave (`formData[campo]`).
 */
export type FormularioDoUAR = {
  id?: string;
  nome?: string;
  tag?: string;
  classificacao?: 'UC' | 'UAR';
  criticidade?: Equipamento['criticidade'];
  numeroSerie?: string;
  localizacaoEspecifica?: string;
  /** O CODIGO do tipo escolhido. */
  tipoComponente?: string;
  tipoEquipamentoId?: string;
  fabricante?: string;
  fabricanteCustom?: string;
  modelo?: string;
  dataInstalacao?: string;
  equipamentoPaiId?: string;
  /** So para exibir: o componente herda a planta do UC pela unidade. */
  plantaId?: string;
  unidadeId?: string;
  /** So para exibir, como a planta. */
  proprietarioId?: string;
  fornecedor?: string;
  valorImobilizado?: number | string;
  valorDepreciacao?: number | string;
  valorContabil?: number | string;
  observacoes?: string;
  fotoUrl?: string | null;
} & { [campoTecnico: string]: unknown };

const valor = (v: number | string | undefined) => (v ? parseFloat(String(v)) : undefined);

/**
 * O componente no formato da API. Sem `planta_id` nem `proprietario_id`: o
 * CreateEquipamentoDto nao os aceita (400 com o pai numa planta) e o
 * componente herda a planta do UC pela unidade (SN-12).
 */
export function payloadDoComponente(
  formData: FormularioDoUAR,
  tipoEquipamentoId: string | undefined,
  dadosTecnicos: DadoTecnicoDoPayload[],
): DadosDoComponenteUAR {
  return {
    nome: formData.nome ?? '', // validateForm ja exigiu o nome
    tag: formData.tag || undefined,
    classificacao: 'UAR',
    equipamento_pai_id: formData.equipamentoPaiId,
    unidade_id: formData.unidadeId, // Herdado do equipamento pai
    fabricante: formData.fabricante,
    fabricante_custom: formData.fabricanteCustom || undefined, // Fabricante customizado se divergir do modelo
    modelo: formData.modelo,
    numero_serie: formData.numeroSerie,
    criticidade: formData.criticidade,
    tipo_equipamento: formData.tipoComponente, // Codigo (compatibilidade)
    tipo_equipamento_id: tipoEquipamentoId, // ID do tipo (correto)
    // A data do input e de calendario: meia-noite UTC
    data_instalacao: formData.dataInstalacao ? new Date(formData.dataInstalacao + 'T00:00:00.000Z').toISOString() : undefined,
    localizacao_especifica: formData.localizacaoEspecifica,
    fornecedor: formData.fornecedor,
    valor_imobilizado: valor(formData.valorImobilizado),
    valor_depreciacao: valor(formData.valorDepreciacao),
    valor_contabil: valor(formData.valorContabil),
    observacoes: formData.observacoes,
    dados_tecnicos: dadosTecnicos,
  };
}
