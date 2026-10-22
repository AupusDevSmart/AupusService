import type { MaterialItem } from '@/components/common/cards/MateriaisCardManager';
import type { FerramentaItem } from '@/components/common/cards/FerramentasCardManager';
import type { TecnicoItem } from '@/components/common/cards/TecnicosCardManager';
import type { ItemOrcamento } from '@/components/common/cards/OrcamentoCardManager';
import type {
  InstrucaoApiResponse,
  MaquinarioInstrucaoApiResponse,
  RecursoInstrucaoApiResponse,
} from '@/services/instrucoes.services';
import { rotuloCategoria } from '@/services/recursos.services';
import type { NaturezaDoOutroCusto } from '@/features/execucao-os/types/custos';

/**
 * O planejado que as instruções da programação sugerem (SN-86: "sugerem, e o
 * planejador ajusta"). Cada instrução contribui com as suas linhas; acrescentar
 * uma instrução soma a contribuição dela, tirar subtrai — e o que o planejador
 * ajustou nas outras linhas fica. Antes, trocar a lista apagava e recarregava
 * tudo, e o custo não vinha (o material entrava sem preço).
 *
 * As 6 categorias do recurso (SN-83) e os quatro campos da programação:
 *
 *   MATERIAL                    -> materiais, com o custo unitário
 *   MAO_DE_OBRA                 -> técnicos: uma vaga por pessoa, com o custo da hora
 *   INSTRUMENTO e o maquinário  -> ferramentas, e o custo no orçamento
 *   VEICULO, TERCEIRO,
 *   DESPESA_CAMPO               -> orçamento (a viatura em si é a reserva)
 *
 * O custo é o da instrução (o subtotal do servidor, com o preço próprio da
 * linha e a base de cálculo), repartido pela quantidade que a OS planeja. A
 * linha sem preço no cadastro entra sem custo, e no orçamento com a marca
 * "(sem preço no cadastro)": valor zero ali se leria como de graça.
 */
export interface RecursosDaProgramacao {
  materiais: MaterialItem[];
  ferramentas: FerramentaItem[];
  tecnicos: TecnicoItem[];
  itens_orcamento: ItemOrcamento[];
}

export const SEM_PRECO = '(sem preço no cadastro)';

/** As casas que o servidor aceita em cada campo (CreateProgramacaoDto) */
const casas = (x: number, n: number) => {
  const fator = 10 ** n;
  return Math.round((x + Number.EPSILON) * fator) / fator;
};
const numero = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);
/** Perto de zero conta como zero: a subtração em ponto flutuante deixa 1e-15 */
const zerou = (x: number) => x <= 0.0005;

const vazio = (): RecursosDaProgramacao => ({ materiais: [], ferramentas: [], tecnicos: [], itens_orcamento: [] });

/** O custo da linha para a OS: nulo sem preço; zero no que o cliente fornece */
const custoDaLinha = (linha: { subtotal: number | null }) => (linha.subtotal == null ? null : numero(linha.subtotal));

/** Uma linha do orçamento: com o valor, ou marcada quando não há preço; nada quando é zero (o cliente fornece) */
/**
 * O item do orçamento com a natureza do custo (SN-93): é ela que o custo da OS
 * agrupa (veículo, despesa de campo...) e que o Executar confere. Sem ela, a API
 * tira do prefixo da descrição; com ela, a descrição pode mudar à vontade.
 */
function noOrcamento(descricao: string, custo: number | null, natureza: NaturezaDoOutroCusto): ItemOrcamento[] {
  if (custo == null) return [{ descricao: `${descricao} ${SEM_PRECO}`, valor: 0, natureza }];
  return custo > 0 ? [{ descricao, valor: casas(custo, 2), natureza }] : [];
}

/** A natureza do custo pela categoria do recurso; a categoria nova, que ninguém previu, é OUTRO */
const naturezaDaCategoria = (categoria?: string | null): NaturezaDoOutroCusto =>
  categoria === 'INSTRUMENTO' || categoria === 'VEICULO' || categoria === 'TERCEIRO' || categoria === 'DESPESA_CAMPO' ? categoria : 'OUTRO';

/** O que a linha de técnico aceita (TecnicoProgramacaoDto): de 0,25 a 24 h */
export const HORAS_DA_VAGA = { minimo: 0.25, maximo: 24 };

/** As horas de uma pessoa em vagas que o servidor aceita: até 24 h cada, e nenhuma abaixo de 0,25 h */
function emVagas(horas: number): number[] {
  if (horas <= 0) return [0];
  const vagas: number[] = [];
  let resto = horas;
  while (resto > HORAS_DA_VAGA.maximo + 0.0005) {
    vagas.push(HORAS_DA_VAGA.maximo);
    resto -= HORAS_DA_VAGA.maximo;
  }
  vagas.push(Math.max(casas(resto, 2), HORAS_DA_VAGA.minimo));
  return vagas;
}

/** A vaga já tem alguém escalado: não sai calada com a instrução */
const escalada = (t: TecnicoItem) => Boolean(t.nome?.trim() || t.tecnico_id?.trim());

/**
 * As vagas de técnico de uma linha de mão de obra: uma por pessoa, com as horas
 * de cada uma. A linha da programação é uma pessoa (ganha nome ao ser
 * escalada) e aceita de 0,25 a 24 h: "3 eletricistas × 10 h" numa linha só de
 * 30 h dava 400 ao salvar. Pessoa fracionada (1,5) vira duas vagas, a segunda
 * com metade das horas (no mínimo 0,25); mais de 24 h por pessoa vira mais vagas.
 */
function vagasDaMaoDeObra(linha: RecursoInstrucaoApiResponse): TecnicoItem[] {
  const pessoas = Math.max(numero(linha.quantidade), 0) || 1;
  const horas = Math.max(numero(linha.duracao_horas), 0);
  const custo = custoDaLinha(linha);
  const horasDeEquipe = pessoas * horas;
  // Sem horas, o preço da hora do cadastro (se a base for hora): as horas a programação preenche
  const custoHora =
    custo != null && horasDeEquipe > 0
      ? casas(custo / horasDeEquipe, 2)
      : linha.recurso?.base_calculo === 'hora' && linha.preco_base != null
        ? casas(numero(linha.preco_base), 2)
        : undefined;
  const inteiras = Math.floor(pessoas);
  const fracao = pessoas - inteiras;
  const vagas = Array.from({ length: inteiras }, () => emVagas(horas)).flat();
  if (fracao > 0.0005) vagas.push(...emVagas(horas * fracao));
  return vagas.map((h) => ({
    nome: '',
    especialidade: linha.recurso?.nome?.trim() || 'Mão de obra',
    horas_estimadas: h,
    ...(custoHora !== undefined && { custo_hora: custoHora }),
  }));
}

function doRecurso(linha: RecursoInstrucaoApiResponse, saida: RecursosDaProgramacao) {
  const nome = linha.recurso?.nome?.trim();
  if (!nome) return;
  const categoria = linha.recurso?.categoria;
  const quantidade = numero(linha.quantidade) || 1;
  const custo = custoDaLinha(linha);

  switch (categoria) {
    case 'MATERIAL': {
      // O planejado com a perda: é o que se compra, então arredonda para cima (a
      // folga desconta o erro do ponto flutuante: 40 × 1,1 dá 44,000000000000007)
      const planejada = Math.max(Math.ceil(quantidade * (1 + numero(linha.fator_perda)) * 1000 - 1e-6) / 1000, 0.001);
      saida.materiais.push({
        descricao: nome,
        quantidade_planejada: planejada,
        unidade: linha.recurso?.unidade?.trim() || '',
        ...(custo != null && { custo_unitario: casas(custo / planejada, 2) }),
      });
      return;
    }
    case 'MAO_DE_OBRA':
      saida.tecnicos.push(...vagasDaMaoDeObra(linha));
      return;
    case 'INSTRUMENTO':
      saida.ferramentas.push({ descricao: nome, quantidade: casas(quantidade, 3), unidade: linha.recurso?.unidade?.trim() || undefined });
      saida.itens_orcamento.push(...noOrcamento(`${rotuloCategoria(categoria)}: ${nome}`, custo, naturezaDaCategoria(categoria)));
      return;
    case 'VEICULO':
    case 'TERCEIRO':
    case 'DESPESA_CAMPO':
      saida.itens_orcamento.push(...noOrcamento(`${rotuloCategoria(categoria)}: ${nome}`, custo, naturezaDaCategoria(categoria)));
      return;
    default:
      // Categoria nova cai aqui e não entra calada: vai ao orçamento com o nome dela
      saida.itens_orcamento.push(...noOrcamento(`${rotuloCategoria(categoria)}: ${nome}`, custo, naturezaDaCategoria(categoria)));
  }
}

function doMaquinario(linha: MaquinarioInstrucaoApiResponse, saida: RecursosDaProgramacao) {
  const nome = linha.maquinario?.nome?.trim();
  if (!nome) return;
  saida.ferramentas.push({ descricao: nome, quantidade: casas(numero(linha.quantidade) || 1, 3) });
  saida.itens_orcamento.push(...noOrcamento(`Maquinário: ${nome}`, custoDaLinha(linha), 'MAQUINARIO'));
}

/** O que uma instrução sugere, já com as linhas iguais dela juntas */
export function contribuicaoDaInstrucao(instrucao: Pick<InstrucaoApiResponse, 'recursos' | 'maquinarios'>): RecursosDaProgramacao {
  const linhas = vazio();
  for (const linha of instrucao.recursos ?? []) doRecurso(linha, linhas);
  for (const linha of instrucao.maquinarios ?? []) doMaquinario(linha, linhas);
  return somar(vazio(), linhas);
}

/** Média ponderada do preço quando os dois têm; senão o que tiver */
function precoJunto(a: number | undefined, qa: number, b: number | undefined, qb: number) {
  if (a == null) return b;
  if (b == null || qa + qb <= 0) return a;
  return casas((a * qa + b * qb) / (qa + qb), 2);
}

const chaveDoMaterial = (m: Pick<MaterialItem, 'descricao' | 'unidade'>) => `${m.descricao.trim()}|${(m.unidade ?? '').trim()}`;
const chaveDaFerramenta = (f: Pick<FerramentaItem, 'descricao'>) => f.descricao.trim();
const chaveDoItem = (i: Pick<ItemOrcamento, 'descricao'>) => i.descricao.trim();
const daEspecialidade = (tecnicos: TecnicoItem[], especialidade: string) =>
  tecnicos.filter((t) => (t.especialidade ?? '').trim() === especialidade);

/** Soma a contribuição ao planejado: a linha igual cresce, a nova entra no fim */
export function somar(atual: RecursosDaProgramacao, mais: RecursosDaProgramacao): RecursosDaProgramacao {
  const saida: RecursosDaProgramacao = {
    materiais: atual.materiais.map((m) => ({ ...m })),
    ferramentas: atual.ferramentas.map((f) => ({ ...f })),
    tecnicos: atual.tecnicos.map((t) => ({ ...t })),
    itens_orcamento: atual.itens_orcamento.map((i) => ({ ...i })),
  };

  for (const m of mais.materiais) {
    const igual = saida.materiais.find((x) => chaveDoMaterial(x) === chaveDoMaterial(m));
    if (!igual) {
      saida.materiais.push({ ...m });
      continue;
    }
    const antes = numero(igual.quantidade_planejada);
    igual.quantidade_planejada = casas(antes + m.quantidade_planejada, 3);
    const preco = precoJunto(igual.custo_unitario, antes, m.custo_unitario, m.quantidade_planejada);
    if (preco !== undefined) igual.custo_unitario = preco;
  }

  for (const f of mais.ferramentas) {
    const igual = saida.ferramentas.find((x) => chaveDaFerramenta(x) === chaveDaFerramenta(f));
    if (igual) igual.quantidade = casas(numero(igual.quantidade) + f.quantidade, 3);
    else saida.ferramentas.push({ ...f });
  }

  // A vaga i de uma especialidade soma com a vaga i que já existe (a mesma equipe
  // faz as instruções uma depois da outra), enquanto couber nas 24 h; senão abre outra
  const vagasPorEspecialidade = new Map<string, TecnicoItem[]>();
  for (const t of mais.tecnicos) {
    const chave = t.especialidade.trim();
    vagasPorEspecialidade.set(chave, [...(vagasPorEspecialidade.get(chave) ?? []), t]);
  }
  for (const [especialidade, vagas] of vagasPorEspecialidade) {
    const existentes = daEspecialidade(saida.tecnicos, especialidade);
    vagas.forEach((vaga, i) => {
      const igual = existentes[i];
      if (!igual || numero(igual.horas_estimadas) + vaga.horas_estimadas > HORAS_DA_VAGA.maximo + 0.0005) {
        saida.tecnicos.push({ ...vaga });
        return;
      }
      const antes = numero(igual.horas_estimadas);
      igual.horas_estimadas = casas(antes + vaga.horas_estimadas, 2);
      const preco = precoJunto(igual.custo_hora, antes, vaga.custo_hora, vaga.horas_estimadas);
      if (preco !== undefined) igual.custo_hora = preco;
    });
  }

  for (const item of mais.itens_orcamento) {
    const igual = saida.itens_orcamento.find((x) => chaveDoItem(x) === chaveDoItem(item));
    if (igual) igual.valor = casas(numero(igual.valor) + item.valor, 2);
    else saida.itens_orcamento.push({ ...item });
  }

  return saida;
}

/**
 * Tira a contribuição do planejado. A linha que chega a zero sai, a menos que
 * uma instrução que fica ainda a peça (`restantes`): a mão de obra sem horas
 * e o item sem preço contribuem com zero, e sem isso sairiam junto com a
 * instrução retirada. A que fica e passou de zero (o planejador tinha
 * diminuído) volta ao que as restantes pedem: negativa, o salvar daria 400.
 */
export function tirar(atual: RecursosDaProgramacao, menos: RecursosDaProgramacao, restantes: RecursosDaProgramacao): RecursosDaProgramacao {
  const materiais: MaterialItem[] = [];
  for (const linha of atual.materiais) {
    const chave = chaveDoMaterial(linha);
    const tirado = menos.materiais.find((m) => chaveDoMaterial(m) === chave);
    if (!tirado) {
      materiais.push({ ...linha });
      continue;
    }
    const sobra = casas(numero(linha.quantidade_planejada) - tirado.quantidade_planejada, 3);
    const pedido = restantes.materiais.find((m) => chaveDoMaterial(m) === chave);
    if (!zerou(sobra)) materiais.push({ ...linha, quantidade_planejada: sobra });
    else if (pedido) materiais.push({ ...linha, quantidade_planejada: pedido.quantidade_planejada });
  }

  const ferramentas: FerramentaItem[] = [];
  for (const linha of atual.ferramentas) {
    const chave = chaveDaFerramenta(linha);
    const tirada = menos.ferramentas.find((f) => chaveDaFerramenta(f) === chave);
    if (!tirada) {
      ferramentas.push({ ...linha });
      continue;
    }
    const sobra = casas(numero(linha.quantidade) - tirada.quantidade, 3);
    const pedida = restantes.ferramentas.find((f) => chaveDaFerramenta(f) === chave);
    if (!zerou(sobra)) ferramentas.push({ ...linha, quantidade: sobra });
    else if (pedida) ferramentas.push({ ...linha, quantidade: pedida.quantidade });
  }

  // Cada vaga da instrução retirada sai de uma linha da especialidade: a que ela
  // abriu sozinha (as mesmas horas, ninguém escalado), senão a que tem horas para
  // perder, senão a da mesma posição
  const tecnicos = atual.tecnicos.map((t) => ({ ...t }));
  const saem = new Set<TecnicoItem>();
  for (const especialidade of new Set(menos.tecnicos.map((t) => t.especialidade.trim()))) {
    const linhas = tecnicos.filter((t) => (t.especialidade ?? '').trim() === especialidade);
    menos.tecnicos
      .filter((t) => t.especialidade.trim() === especialidade)
      .forEach((vaga, i) => {
        const horas = (l: TecnicoItem) => numero(l.horas_estimadas);
        const alvo =
          linhas.find((l) => !escalada(l) && Math.abs(horas(l) - vaga.horas_estimadas) < 0.005 && (vaga.horas_estimadas === 0 || horas(l) > 0)) ??
          linhas.find((l) => horas(l) >= vaga.horas_estimadas - 0.005 && horas(l) > 0) ??
          linhas[i] ??
          linhas[linhas.length - 1];
        if (alvo) alvo.horas_estimadas = casas(horas(alvo) - vaga.horas_estimadas, 2);
      });

    // As restantes ainda pedem tantas vagas: a que zerou volta com as horas pedidas
    // enquanto faltar vaga; a escalada fica (sem horas, o formulário as pede); o resto sai
    const pedidas = restantes.tecnicos.filter((t) => t.especialidade.trim() === especialidade);
    let faltam = Math.max(0, pedidas.length - linhas.filter((l) => !zerou(numero(l.horas_estimadas))).length);
    for (const linha of linhas) {
      if (!zerou(numero(linha.horas_estimadas))) continue;
      if (faltam > 0) {
        linha.horas_estimadas = pedidas[pedidas.length - faltam].horas_estimadas;
        faltam -= 1;
      } else if (escalada(linha)) {
        linha.horas_estimadas = 0;
      } else {
        saem.add(linha);
      }
    }
  }

  const itens_orcamento: ItemOrcamento[] = [];
  for (const linha of atual.itens_orcamento) {
    const chave = chaveDoItem(linha);
    const tirado = menos.itens_orcamento.find((i) => chaveDoItem(i) === chave);
    // Só mexe no item que a instrução retirada trazia: o valor zero digitado à mão fica
    if (!tirado) {
      itens_orcamento.push({ ...linha });
      continue;
    }
    const sobra = casas(numero(linha.valor) - tirado.valor, 2);
    const pedido = restantes.itens_orcamento.find((i) => chaveDoItem(i) === chave);
    if (pedido) itens_orcamento.push({ ...linha, valor: sobra < 0 ? pedido.valor : sobra });
    else if (!zerou(sobra)) itens_orcamento.push({ ...linha, valor: sobra });
  }

  return { materiais, ferramentas, tecnicos: tecnicos.filter((t) => !saem.has(t)), itens_orcamento };
}

/** Uma troca na lista de instruções: tira as que saíram, soma as que entraram */
export function trocarInstrucoes(
  atual: RecursosDaProgramacao,
  { entraram, sairam, ficam }: { entraram: RecursosDaProgramacao[]; sairam: RecursosDaProgramacao[]; ficam: RecursosDaProgramacao[] },
): RecursosDaProgramacao {
  const juntas = (lista: RecursosDaProgramacao[]) => lista.reduce(somar, vazio());
  return somar(tirar(atual, juntas(sairam), juntas(ficam)), juntas(entraram));
}
