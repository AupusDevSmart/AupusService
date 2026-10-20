import { useRef, useState } from 'react';
import type { Workbook } from 'exceljs';
import { Download, FileSpreadsheet, Info, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { abrirLivro } from '@/lib/planilha/estilo';
import type {
  CadastroImportavel,
  LeituraDaPlanilha,
  ProblemaDaPlanilha,
  RegistroDaPlanilha,
  ResultadoDaImportacao,
} from '@/lib/planilha/tipos';
import { cn } from '@/lib/utils';
import { ImportacaoService } from '@/services/importacao.services';
import { formatApiError } from '@/utils/api-error';

type Props = {
  cadastro: CadastroImportavel;
  /** "Recursos", para os textos. */
  titulo: string;
  /** Gera e baixa a planilha com o que a tela está filtrando. */
  exportar: () => Promise<void>;
  /** Pode ser assíncrona: a planilha de outro sistema busca os registros daqui para casar pelo nome */
  ler: (livro: Workbook) => LeituraDaPlanilha | Promise<LeituraDaPlanilha>;
  /** Depois de gravar: recarregar a lista da tela. */
  aoImportar: () => void;
  /** Quem só vê a página exporta, mas não importa. */
  podeImportar?: boolean;
  /** O que mais acontece ao confirmar (ex.: replicação no NexOn). */
  aviso?: string;
};

type Previa = {
  arquivo: string;
  registros: RegistroDaPlanilha[];
  resultado: ResultadoDaImportacao | null;
  erros: ProblemaDaPlanilha[];
  /** O que a própria leitura avisa (os do servidor vêm no resultado) */
  avisosDaLeitura: ProblemaDaPlanilha[];
};

/** Quantos problemas listar antes de resumir em "e mais N". */
const LIMITE_NA_TELA = 100;

/**
 * Os dois botões que toda página de cadastro tem (`.claude/CLAUDE.md`, "Toda
 * página de cadastro exporta e importa planilha") e o diálogo da importação:
 * escolher o arquivo, ver a prévia que o servidor apurou, confirmar.
 */
export function PlanilhaDoCadastro({
  cadastro,
  titulo,
  exportar,
  ler,
  aoImportar,
  podeImportar = true,
  aviso,
}: Props) {
  const [exportando, setExportando] = useState(false);
  const [aberto, setAberto] = useState(false);
  const [lendo, setLendo] = useState(false);
  const [gravando, setGravando] = useState(false);
  const [previa, setPrevia] = useState<Previa | null>(null);
  const entrada = useRef<HTMLInputElement>(null);

  const baixarAtual = async () => {
    setExportando(true);
    try {
      await exportar();
    } catch (erro) {
      toast.error(`Não foi possível gerar a planilha: ${formatApiError(erro)}`);
    } finally {
      setExportando(false);
    }
  };

  const fechar = () => {
    if (gravando) return;
    setAberto(false);
    setPrevia(null);
  };

  const escolherArquivo = async (arquivo: File | undefined) => {
    if (!arquivo) return;
    setLendo(true);
    setPrevia(null);

    try {
      let livro: Workbook;
      try {
        livro = await abrirLivro(arquivo);
      } catch {
        toast.error('Não foi possível abrir o arquivo. Envie a planilha em .xlsx.');
        return;
      }
      // Fora do catch de cima: a leitura pode buscar registros na API, e o erro dela não é "arquivo inválido"
      const leitura = await ler(livro);

      const resultado = leitura.registros.length
        ? await ImportacaoService.importar(cadastro, leitura.registros, false)
        : null;

      setPrevia({
        arquivo: arquivo.name,
        registros: leitura.registros,
        resultado,
        erros: [...leitura.erros, ...apontarLinhas(resultado?.erros ?? [], leitura.registros)],
        avisosDaLeitura: leitura.avisos ?? [],
      });
    } catch (erro) {
      toast.error(`Não foi possível conferir a planilha: ${formatApiError(erro)}`);
    } finally {
      setLendo(false);
      if (entrada.current) entrada.current.value = '';
    }
  };

  const confirmar = async () => {
    if (!previa) return;
    setGravando(true);

    try {
      const resultado = await ImportacaoService.importar(cadastro, previa.registros, true);

      if (!resultado.confirmado) {
        // Algo mudou entre a prévia e o confirmar: mostra a prévia nova.
        setPrevia({ ...previa, resultado, erros: apontarLinhas(resultado.erros, previa.registros) });
        toast.error('A importação encontrou erros e nada foi gravado.');
        return;
      }

      toast.success(resumoDoResultado(resultado));
      aoImportar();
      setGravando(false);
      setAberto(false);
      setPrevia(null);
    } catch (erro) {
      toast.error(`Não foi possível importar a planilha: ${formatApiError(erro)}`);
    } finally {
      setGravando(false);
    }
  };

  const resultado = previa?.resultado ?? null;
  const aGravar = (resultado?.novos ?? 0) + (resultado?.alterados ?? 0);
  const podeConfirmar = !!previa && previa.erros.length === 0 && aGravar > 0;

  return (
    <>
      <div className="flex w-full gap-2 lg:w-auto">
        <button
          type="button"
          onClick={() => void baixarAtual()}
          disabled={exportando}
          className="btn-minimal-outline flex-1 whitespace-nowrap lg:flex-none"
        >
          {exportando ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Exportar
        </button>
        {podeImportar && (
          <button
            type="button"
            onClick={() => setAberto(true)}
            className="btn-minimal-outline flex-1 whitespace-nowrap lg:flex-none"
          >
            <Upload className="mr-2 h-4 w-4" />
            Importar
          </button>
        )}
      </div>

      <Dialog open={aberto} onOpenChange={(o) => !o && fechar()}>
        <DialogContent className="flex max-h-[90dvh] max-w-2xl flex-col">
          <DialogHeader>
            <DialogTitle>Importar planilha de {titulo.toLowerCase()}</DialogTitle>
            <DialogDescription>
              Use a planilha exportada desta tela: edite os valores, acrescente registros e envie. A
              aba COMO PREENCHER explica cada campo. Nada é gravado antes de você confirmar a prévia.
            </DialogDescription>
          </DialogHeader>

          {aviso && (
            <p className="flex gap-2 rounded-md border px-3 py-2 text-sm text-muted-foreground">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{aviso}</span>
            </p>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => void baixarAtual()} disabled={exportando}>
              {exportando ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Baixar planilha atual
            </Button>
            <Button onClick={() => entrada.current?.click()} disabled={lendo || gravando}>
              {lendo ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="mr-2 h-4 w-4" />
              )}
              {previa ? 'Escolher outro arquivo' : 'Escolher arquivo .xlsx'}
            </Button>
            <input
              ref={entrada}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              aria-label="Arquivo da planilha"
              onChange={(e) => void escolherArquivo(e.target.files?.[0])}
            />
          </div>

          {previa && (
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
              <p className="truncate text-sm text-muted-foreground">{previa.arquivo}</p>

              {previa.registros.length === 0 && previa.erros.length === 0 ? (
                <p className="text-sm">A planilha não tem nenhum registro preenchido.</p>
              ) : (
                <>
                  {resultado && (
                    <div className="grid grid-cols-3 gap-2">
                      <Contador rotulo="Novos" valor={resultado.novos} />
                      <Contador rotulo="Alterados" valor={resultado.alterados} />
                      <Contador rotulo="Sem mudança" valor={resultado.inalterados} />
                    </div>
                  )}

                  <ListaDeProblemas
                    titulo={
                      previa.erros.length === 1
                        ? '1 erro — corrija na planilha e envie de novo'
                        : `${previa.erros.length} erros — corrija na planilha e envie de novo`
                    }
                    problemas={previa.erros}
                    tom="erro"
                  />

                  <ListaDeProblemas titulo="Avisos" problemas={[...previa.avisosDaLeitura, ...(resultado?.avisos ?? [])]} tom="aviso" />

                  {resultado && aGravar > 0 && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium">O que vai mudar</p>
                      <ul className="divide-y rounded-md border text-sm">
                        {resultado.registros
                          .filter((r) => r.acao !== 'inalterado')
                          .slice(0, LIMITE_NA_TELA)
                          .map((r) => (
                            <li
                              key={`${r.aba}-${r.linha}`}
                              className="flex items-center justify-between gap-3 px-3 py-2"
                            >
                              <span className="min-w-0 truncate">{r.nome}</span>
                              <span className="shrink-0 text-xs text-muted-foreground">
                                {r.acao === 'novo' ? 'novo' : 'alterado'} · {onde(r)}
                              </span>
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={fechar} disabled={gravando}>
              Cancelar
            </Button>
            <Button onClick={() => void confirmar()} disabled={!podeConfirmar || gravando}>
              {gravando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {aGravar > 0 ? `Confirmar importação (${aGravar})` : 'Confirmar importação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Contador({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <div className="rounded-md border px-3 py-2">
      <p className="text-xs text-muted-foreground">{rotulo}</p>
      <p className="text-lg font-semibold tabular-nums">{valor}</p>
    </div>
  );
}

function ListaDeProblemas({
  titulo,
  problemas,
  tom,
}: {
  titulo: string;
  problemas: ProblemaDaPlanilha[];
  tom: 'erro' | 'aviso';
}) {
  if (problemas.length === 0) return null;

  return (
    <div className="space-y-1">
      <p className={cn('text-sm font-medium', tom === 'erro' && 'text-destructive')}>{titulo}</p>
      <ul className="divide-y rounded-md border text-sm">
        {problemas.slice(0, LIMITE_NA_TELA).map((p, i) => (
          <li key={i} className="space-y-0.5 px-3 py-2">
            <p className="text-xs text-muted-foreground">{onde(p)}</p>
            <p>
              {p.mensagem}
              {p.alterado_em && (
                <span className="text-muted-foreground">
                  {' '}
                  ({new Date(p.alterado_em).toLocaleString('pt-BR')})
                </span>
              )}
            </p>
          </li>
        ))}
        {problemas.length > LIMITE_NA_TELA && (
          <li className="px-3 py-2 text-muted-foreground">e mais {problemas.length - LIMITE_NA_TELA}</li>
        )}
      </ul>
    </div>
  );
}

const onde = (p: { aba: string; linha: number }) => `aba ${p.aba}, linha ${p.linha}`;

/**
 * O servidor aponta a linha do registro; na ficha, o campo do cabeçalho tem a
 * própria linha, que só a leitura sabe.
 */
function apontarLinhas(erros: ProblemaDaPlanilha[], registros: RegistroDaPlanilha[]): ProblemaDaPlanilha[] {
  return erros.map((erro) => {
    const registro = registros.find((r) => r.aba === erro.aba && r.linha === erro.linha);
    const linha = erro.campo ? registro?.linhasDosCampos?.[erro.campo.split('.')[0]] : undefined;
    return linha ? { ...erro, linha } : erro;
  });
}

function resumoDoResultado(r: ResultadoDaImportacao): string {
  const partes = [
    r.novos && `${r.novos} ${r.novos === 1 ? 'criado' : 'criados'}`,
    r.alterados && `${r.alterados} ${r.alterados === 1 ? 'alterado' : 'alterados'}`,
  ].filter(Boolean);

  return `Planilha importada: ${partes.join(', ')}.`;
}
