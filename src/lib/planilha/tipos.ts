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

export type LeituraDaPlanilha = {
  registros: RegistroDaPlanilha[];
  /** O que não deu para entender no próprio arquivo, antes de ir ao servidor. */
  erros: ProblemaDaPlanilha[];
  /** O que a leitura fez e a prévia tem de dizer (ex.: a planilha de outro sistema, casada pelo nome) */
  avisos?: ProblemaDaPlanilha[];
};

export type AcaoDaImportacao = 'novo' | 'alterado' | 'inalterado';

export type ResultadoDaImportacao = {
  confirmado: boolean;
  novos: number;
  alterados: number;
  inalterados: number;
  registros: Array<{ aba: string; linha: number; id: string; nome: string; acao: AcaoDaImportacao }>;
  erros: ProblemaDaPlanilha[];
  avisos: ProblemaDaPlanilha[];
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
