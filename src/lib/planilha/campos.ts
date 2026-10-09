import type { Cell, DataValidation } from 'exceljs';

import { calculada, moeda } from '@/lib/planilha/estilo';
import {
  data,
  dataParaCelula,
  numero,
  opcao,
  rotulosAceitos,
  simOuNao,
  texto,
} from '@/lib/planilha/leitura';

/**
 * Um campo da planilha de cadastro — coluna do RESUMO, linha do cabeçalho da
 * ficha ou coluna de uma seção. A mesma definição exporta, lê de volta e
 * escreve a explicação da aba COMO PREENCHER: três lugares que, separados,
 * divergiriam.
 */

export type TipoDeCampo =
  | 'texto'
  | 'numero'
  | 'inteiro'
  | 'moeda'
  | 'simnao'
  | 'opcao'
  | 'data';

export type Campo<T> = {
  /** Como aparece na planilha: título da coluna ou rótulo da linha. */
  titulo: string;
  /**
   * Onde o valor vai no payload (`nome`, `endereco.cep`). Sem caminho, o campo
   * é só informação: sai em cinza na exportação e a importação não o lê.
   */
  caminho?: string;
  tipo: TipoDeCampo;
  /** Código → rótulo da tela, para `opcao`. A planilha mostra o rótulo. */
  rotulos?: Record<string, string>;
  /** Fórmula de lista de validação (ex.: nomes da aba REFERÊNCIAS). */
  lista?: string;
  largura?: number;
  /** Para a aba COMO PREENCHER: "Sim", "Só no registro novo"... Ausente = não. */
  obrigatorio?: string;
  /** Vazio não manda nada e o sistema mantém o valor (ou usa o padrão) — em vez de limpar o campo. */
  vazioEhPadrao?: boolean;
  /**
   * Preenchido pelo sistema e lido de volta (o ID do registro ou do item
   * referenciado): sai em cinza como o calculado, mas a importação usa. Não se
   * altera; em linha nova fica vazio.
   */
  identificador?: boolean;
  explicacao: string;
  exemplo?: string;
  /**
   * O valor do registro, na forma do sistema: código da opção, booleano,
   * `AAAA-MM-DD` na data. A conversão para a planilha é daqui.
   */
  valor: (registro: T) => unknown;
};

export const ehCalculado = <T>(campo: Campo<T>) => !campo.caminho;

/** O valor do sistema na forma em que a planilha mostra. */
export function paraPlanilha<T>(campo: Campo<T>, registro: T): string | number | Date | null {
  const v = campo.valor(registro);
  if (v === null || v === undefined || v === '') return null;

  switch (campo.tipo) {
    case 'simnao':
      return v ? 'SIM' : 'NÃO';
    case 'opcao':
      return campo.rotulos?.[String(v)] ?? String(v);
    case 'numero':
    case 'inteiro':
    case 'moeda':
      return Number(v);
    case 'data':
      return dataParaCelula(String(v)) ?? String(v);
    default:
      return String(v);
  }
}

/** `semLista`: na ficha só de leitura a célula não ganha lista suspensa. */
export function escreverCelula<T>(
  celula: Cell,
  campo: Campo<T>,
  registro: T | null,
  { semLista = false }: { semLista?: boolean } = {},
) {
  celula.value = registro === null ? null : paraPlanilha(campo, registro);

  if (campo.tipo === 'moeda') moeda(celula);
  if (campo.tipo === 'data') celula.numFmt = 'dd/mm/yyyy';
  // Texto fica texto: sem isso o Excel troca "1.0" por 1, come o zero à
  // esquerda do CEP e mostra telefone em notação científica.
  if (campo.tipo === 'texto') celula.numFmt = '@';
  if (ehCalculado(campo) || campo.identificador) calculada(celula);

  const validacao = semLista ? null : validacaoDe(campo);
  if (validacao && !ehCalculado(campo) && !campo.identificador) celula.dataValidation = validacao;
}

/** Lista suspensa para SIM/NÃO, opções fixas e nomes de referência. */
export function validacaoDe<T>(campo: Campo<T>): DataValidation | null {
  const formula =
    campo.lista ??
    (campo.tipo === 'simnao'
      ? '"SIM,NÃO"'
      : campo.tipo === 'opcao' && campo.rotulos
        ? `"${Object.values(campo.rotulos).join(',')}"`
        : null);

  if (!formula) return null;

  return {
    type: 'list',
    allowBlank: true,
    formulae: [formula],
    showErrorMessage: true,
    // Aviso e não bloqueio: quem cola um valor de outro lugar decide, e a
    // importação recusa o que não servir dizendo o que esperava.
    errorStyle: 'warning',
    errorTitle: campo.titulo,
    error: 'Valor fora da lista. A importação vai recusar esta linha.',
  };
}

/** `erro` preenchido quando a célula não diz o que o campo espera. */
export type LeituraDoCampo = { valor: unknown; erro: string | null };

/** Lê a célula na forma do sistema; a mensagem diz o que se esperava. */
export function daPlanilha<T>(campo: Campo<T>, celula: Cell): LeituraDoCampo {
  switch (campo.tipo) {
    case 'texto':
      return { valor: texto(celula), erro: null };

    case 'numero':
    case 'moeda': {
      const v = numero(celula);
      return v === undefined
        ? { valor: null, erro: `${campo.titulo}: esperava um número (ex.: 12,50).` }
        : { valor: v, erro: null };
    }

    case 'inteiro': {
      const v = numero(celula);
      return v === undefined || (v !== null && !Number.isInteger(v))
        ? { valor: null, erro: `${campo.titulo}: esperava um número inteiro.` }
        : { valor: v, erro: null };
    }

    case 'simnao': {
      const v = simOuNao(celula);
      return v === undefined
        ? { valor: null, erro: `${campo.titulo}: use SIM ou NÃO.` }
        : { valor: v, erro: null };
    }

    case 'opcao': {
      const v = opcao(celula, campo.rotulos ?? {});
      return v === undefined
        ? {
            valor: null,
            erro: `${campo.titulo}: "${texto(celula)}" não é um valor aceito. Use: ${rotulosAceitos(campo.rotulos ?? {})}.`,
          }
        : { valor: v, erro: null };
    }

    case 'data': {
      const v = data(celula);
      return v === undefined
        ? { valor: null, erro: `${campo.titulo}: esperava uma data como 25/12/2026.` }
        : { valor: v, erro: null };
    }
  }
}

/**
 * A leitura que os formatos usam: a do tipo e, em cima dela, o obrigatório da
 * COMO PREENCHER ("Sim"). Obrigatório só no registro novo diz outra coisa e
 * fica com o servidor, que sabe se o registro é novo.
 */
export function lerCampo<T>(campo: Campo<T>, celula: Cell): LeituraDoCampo {
  const lido = daPlanilha(campo, celula);
  if (!lido.erro && lido.valor === null && campo.obrigatorio === 'Sim') {
    return { valor: null, erro: `${campo.titulo}: obrigatório.` };
  }
  return lido;
}

/** Grava `valor` em `alvo` seguindo o caminho com pontos (`endereco.cep`). */
export function definir(alvo: Record<string, unknown>, caminho: string, valor: unknown) {
  const partes = caminho.split('.');
  let atual = alvo;

  partes.slice(0, -1).forEach((parte) => {
    if (typeof atual[parte] !== 'object' || atual[parte] === null) atual[parte] = {};
    atual = atual[parte] as Record<string, unknown>;
  });

  atual[partes[partes.length - 1]] = valor;
}

/** Os valores aceitos, como a aba COMO PREENCHER escreve. */
export function valoresAceitos<T>(campo: Campo<T>): string {
  switch (campo.tipo) {
    case 'simnao':
      return 'SIM ou NÃO';
    case 'opcao':
      return rotulosAceitos(campo.rotulos ?? {});
    case 'moeda':
      return 'Número em reais, sem "R$" (ex.: 1250,50)';
    case 'inteiro':
      return 'Número inteiro';
    case 'numero':
      return 'Número (vírgula ou ponto decimal)';
    case 'data':
      return 'Data no formato DD/MM/AAAA';
    default:
      return 'Texto livre';
  }
}
