import type { Workbook } from 'exceljs';
import { chave } from '@/lib/planilha/leitura';
import type { LeituraDaPlanilha, RegistroDaPlanilha } from '@/lib/planilha/tipos';

/** O autor que o Smart Project (AupusProject) grava no livro */
export const AUTOR_DO_SMART_PROJECT = 'Smart Project';

const soDigitos = (id: string) => /^\d+$/.test(id.trim());

/**
 * A planilha que veio de OUTRO sistema — o Smart Project (AupusProject), que
 * tem as mesmas planilhas de recursos, maquinários e instruções (SN-83/84/85:
 * decisão do usuário, as de um importam no outro). Os IDs de lá não são daqui:
 * lidos como estão, cada linha seria "não existe".
 *
 * Reconhece pelo autor do livro (o de lá grava "Smart Project") ou por TODOS os
 * IDs serem só de dígitos (os daqui são texto). Um autor qualquer não basta: o
 * livro montado por script ou por IA grava "openpyxl", o do Excel o nome da
 * pessoa — e descartar os IDs daqui faria a linha casar pelo nome com outro
 * registro e editá-lo calado. ID só de dígitos no meio de IDs daqui é erro na
 * linha (digitado por engano), não descarte.
 */
export function separarOutroSistema(livro: Workbook, leitura: LeituraDaPlanilha): { deOutroSistema: boolean; leitura: LeituraDaPlanilha } {
  const comId = leitura.registros.filter((r) => r.id !== null && r.id.trim() !== '');
  const numericos = comId.filter((r) => soDigitos(r.id!));
  const autor = livro.creator?.trim();
  if (autor === AUTOR_DO_SMART_PROJECT || (comId.length > 0 && numericos.length === comId.length)) {
    return { deOutroSistema: true, leitura };
  }
  if (numericos.length === 0) return { deOutroSistema: false, leitura };
  return {
    deOutroSistema: false,
    leitura: {
      ...leitura,
      // Fora do que vai ao servidor: o erro daqui já diz o que fazer
      registros: leitura.registros.filter((r) => !numericos.includes(r)),
      erros: [
        ...leitura.erros,
        ...numericos.map((r) => ({
          aba: r.aba,
          linha: r.linha,
          mensagem: `O ID "${r.id!.trim()}" não é deste sistema. Para criar, apague o ID; para editar, exporte de novo e edite a planilha exportada.`,
        })),
      ],
    },
  };
}

/** Sem caixa, como o índice único do banco (lower), mas COM acento: o desempate do nome */
const exato = (t: string) => t.replace(/\s+/g, ' ').trim().toLowerCase();

/**
 * Cada registro do outro sistema vira o daqui de mesma chave (edita) ou um novo
 * (cria). A chave casa sem caixa e sem acento; havendo dois daqui na mesma
 * chave, vale o de grafia exata (sem caixa) e, sem ele, é erro na linha — nunca
 * a escolha calada de um deles. A data de "alterado depois da exportação" é do
 * outro sistema e sai. A prévia diz com quem cada linha casou: nada é gravado
 * sem a pessoa ver.
 */
export function casarPelaChave(
  leitura: LeituraDaPlanilha,
  existentes: { id: string; chave: string; nome: string }[],
  chaveDo: (registro: RegistroDaPlanilha) => string,
  { origem = 'do Smart Project', singular, plural = `${singular}s` }: { origem?: string; singular: string; plural?: string },
): LeituraDaPlanilha {
  const porChave = new Map<string, { id: string; chave: string; nome: string }[]>();
  for (const e of existentes) porChave.set(chave(e.chave), [...(porChave.get(chave(e.chave)) ?? []), e]);

  const registros: RegistroDaPlanilha[] = [];
  const erros = [...leitura.erros];
  const casamentos: { registro: RegistroDaPlanilha; nome: string }[] = [];
  for (const r of leitura.registros) {
    const alvo = chaveDo(r);
    const candidatos = porChave.get(chave(alvo)) ?? [];
    const escolhidos = candidatos.length > 1 ? candidatos.filter((c) => exato(c.chave) === exato(alvo)) : candidatos;
    if (escolhidos.length > 1 || (candidatos.length > 1 && escolhidos.length === 0)) {
      erros.push({
        aba: r.aba,
        linha: r.linha,
        mensagem: `Nome ambíguo: casa com ${candidatos.map((c) => `"${c.nome}"`).join(' e ')} daqui. Renomeie um deles antes de importar.`,
      });
      continue;
    }
    const casado = escolhidos[0];
    if (casado) casamentos.push({ registro: r, nome: casado.nome });
    registros.push({ ...r, id: casado ? casado.id.trim() : null, atualizado_em: null });
  }

  const novos = registros.length - casamentos.length;
  return {
    ...leitura,
    registros,
    erros,
    avisos: [
      ...(leitura.avisos ?? []),
      {
        aba: leitura.registros[0]?.aba ?? 'RESUMO',
        linha: 1,
        mensagem: `Planilha ${origem}: os IDs de lá foram ignorados. ${casamentos.length} ${casamentos.length === 1 ? singular : plural} casado(s) pelo nome com os daqui (edita), ${novos} novo(s) (cria).`,
      },
      ...casamentos.map(({ registro, nome }) => ({
        aba: registro.aba,
        linha: registro.linha,
        mensagem: `Casou com "${nome}" daqui: a linha edita esse registro.`,
      })),
    ],
  };
}
