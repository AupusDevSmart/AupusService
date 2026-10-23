/** O que sai da leitura da planilha e vai para `POST /importacao/{cadastro}`. */
export type RegistroDaPlanilha = {
  /** Vazio = registro novo. Os ids do sistema são texto (Char 26). */
  id: string | null;
  aba: string;
  linha: number;
  /** O `updated_at` do registro quando foi exportado — para o aviso de "mudou depois". */
  atualizado_em: string | null;
  dados: Record<string, unknown>;
  /**
   * Só no front, não vai ao servidor: a linha de cada campo do cabeçalho da
   * ficha, para o erro do servidor (que só sabe o campo) apontar a linha certa.
   */
  linhasDosCampos?: Record<string, number>;
};

export type ProblemaDaPlanilha = {
  aba: string;
  linha: number;
  campo?: string;
  mensagem: string;
  /** Só nos avisos de "alterado depois da exportação" (ISO, UTC). */
  alterado_em?: string;
};

/**
 * Um recurso que a planilha de instruções cita (SN-98): a cobrança e o preço das
 * linhas (COBRANÇA e VALOR DO CADASTRO) e a categoria da aba REFERÊNCIAS. O
 * servidor cria o que não existe e acerta o cadastro do que difere.
 */
export type RecursoDaPlanilha = {
  nome: string;
  /** O ID DO ITEM da linha: desempata o nome repetido no cadastro (o mesmo nome em categorias diferentes) */
  id: string | null;
  grupo: 'recursos' | 'materiais';
  categoria: string | null;
  base_calculo: string | null;
  preco: number | null;
  unidade: string | null;
  aba: string;
  linha: number;
  /** O que a aba REFERÊNCIAS diz deste item e a leitura não reconheceu: o servidor só cobra se for criar o recurso */
  problemas: string[];
};

export type TarefaDoPlanoDaPlanilha = {
  nome: string | null;
  instrucao: string;
  frequencia: string | null;
  frequencia_personalizada: number | null;
  criticidade: number | null;
};

/**
 * O plano que uma aba da planilha de equipamentos cita (coluna PLANO), com as
 * TAREFAS DO PLANO dela: o servidor cria o que não existe (SN-98). Uma entrada
 * por aba, e as linhas que não deu para ler vão em `problemas`: só o servidor
 * sabe se o plano existe, e no que existe as tarefas da planilha não contam.
 */
export type PlanoDaPlanilha = {
  nome: string;
  categoria: string | null;
  tarefas: TarefaDoPlanoDaPlanilha[];
  aba: string;
  linha: number;
  linha_das_tarefas: number;
  /** O ID DO PLANO da ficha: com o nome trocado, o servidor não cria um plano novo calado */
  plano_ref: string | null;
  /** O ID da ficha: o plano de hoje do equipamento não é plano novo */
  equipamento_id: string | null;
  problemas: Array<{ linha: number; mensagem: string }>;
};

/** O que a planilha cita de outros cadastros, para o servidor criar ou atualizar antes dos registros */
export type CatalogosDaPlanilha = {
  recursos?: RecursoDaPlanilha[];
  planos?: PlanoDaPlanilha[];
};

export type LeituraDaPlanilha = {
  registros: RegistroDaPlanilha[];
  /** O que não deu para entender no próprio arquivo, antes de ir ao servidor. */
  erros: ProblemaDaPlanilha[];
  /** O que a leitura fez e a prévia tem de dizer (ex.: a planilha de outro sistema, casada pelo nome) */
  avisos?: ProblemaDaPlanilha[];
  catalogos?: CatalogosDaPlanilha;
};

export type AcaoDaImportacao = 'novo' | 'alterado' | 'inalterado';

/** O que a importação cria ou muda fora do cadastro importado: o bloco "Outros cadastros" da prévia (SN-98) */
export type OutroCadastro = {
  cadastro: 'recurso' | 'plano';
  acao: 'novo' | 'alterado';
  nome: string;
  detalhe: string;
  aba: string;
  linha: number;
};

export type ResultadoDaImportacao = {
  confirmado: boolean;
  novos: number;
  alterados: number;
  inalterados: number;
  registros: Array<{ aba: string; linha: number; id: string; nome: string; acao: AcaoDaImportacao }>;
  erros: ProblemaDaPlanilha[];
  avisos: ProblemaDaPlanilha[];
  /** Ausente na API de antes do SN-98 */
  outros_cadastros?: OutroCadastro[];
};

/** O segmento da URL de importação — uma rota por cadastro no `ImportacaoController`. */
export type CadastroImportavel =
  | 'usuarios'
  | 'plantas'
  | 'equipamentos'
  | 'concessionarias'
  | 'instrucoes'
  | 'planos-manutencao'
  | 'recursos'
  | 'maquinarios'
  | 'veiculos'
  | 'feriados';

/** Abas que não são registro — a importação as pula. */
export const ABAS_RESERVADAS = ['COMO PREENCHER', 'RESUMO', 'MODELO', 'REFERÊNCIAS'] as const;
