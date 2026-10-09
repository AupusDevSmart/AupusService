import type { Workbook } from 'exceljs';

import { api } from '@/config/api';
import type { Campo } from '@/lib/planilha/campos';
import { VERDE_RECURSOS } from '@/lib/planilha/estilo';
import { exportarFichas, lerFichas, secao, type PlanilhaDeFichas, type SecoesLidas } from '@/lib/planilha/fichas';
import { referencia, type Referencia } from '@/lib/planilha/referencias';
import { todasAsPaginas, type PaginaDaListagem } from '@/lib/planilha/todas-as-paginas';
import { ConcessionariasService } from '@/services/concessionarias.services';
import { PlantasService, type PlantaResponse } from '@/services/plantas.services';

/**
 * Plantas na planilha: uma aba por planta, com a seção UNIDADES. Unidade não
 * é apagada pela planilha (excluir unidade exclui os equipamentos dela):
 * tirar de uso é o STATUS inativo.
 */

type UnidadeDaApi = {
  id: string;
  nome: string;
  tipo: string;
  status: string;
  latitude: number | string;
  longitude: number | string;
  grupo?: string | null;
  numeroUc?: string | null;
  tensaoNominal?: string | null;
  concessionariaId?: string | null;
  /** Montado na exportação. */
  nomeDaConcessionaria?: string | null;
};

type Planta = PlantaResponse & { unidades: UnidadeDaApi[] };

const PERFIS: Record<string, string> = { Carga: 'Carga', 'Geração': 'Geração', Misto: 'Misto' };
const TENSOES = ['0,22 kV', '0,38 kV', '4,16 kV', '13,8 kV', '23,2 kV', '34,5 kV', '69 kV', '138 kV'];

function cabecalho(refs: Referencia[]): Campo<Planta>[] {
  const texto = (
    titulo: string,
    caminho: string,
    valor: (p: Planta) => unknown,
    explicacao: string,
    extra: Partial<Campo<Planta>> = {},
  ): Campo<Planta> => ({ titulo, caminho, tipo: 'texto', valor, explicacao, ...extra });

  return [
    texto('NOME', 'nome', (p) => p.nome, 'Nome da planta (de 2 a 100 caracteres).', { obrigatorio: 'Sim', exemplo: 'Fazenda Boa Vista' }),
    texto('CNPJ', 'cnpj', (p) => p.cnpj, 'CNPJ com pontuação: 00.000.000/0000-00. Não pode repetir o de outra planta.', {
      obrigatorio: 'Sim',
      exemplo: '12.345.678/0001-90',
    }),
    texto('PROPRIETÁRIO', 'proprietario', (p) => p.proprietario?.nome ?? null, 'O dono da planta, pelo nome como na aba REFERÊNCIAS.', {
      obrigatorio: 'Sim',
      lista: referencia(refs, 'proprietarios'),
    }),
    {
      titulo: 'ID DO PROPRIETÁRIO',
      caminho: 'proprietario_ref',
      tipo: 'texto',
      identificador: true,
      explicacao: 'O ID do proprietário. Resolve nomes repetidos; com o nome trocado, vale o nome.',
      valor: (p) => p.proprietarioId?.trim() ?? null,
    },
    texto('Nº DA UC', 'numero_uc', (p) => p.numeroUc ?? null, 'Número da unidade consumidora da planta.'),
    texto('HORÁRIO DE FUNCIONAMENTO', 'horarioFuncionamento', (p) => p.horarioFuncionamento, 'Texto livre (de 5 a 50 caracteres).', {
      obrigatorio: 'Sim',
      exemplo: '08:00 às 18:00',
    }),
    texto('LOCALIZAÇÃO', 'localizacao', (p) => p.localizacao, 'Como chegar ou onde fica (de 5 a 200 caracteres).', { obrigatorio: 'Sim' }),
    texto('CEP', 'endereco.cep', (p) => p.endereco?.cep ?? null, 'No formato 00000-000.', { obrigatorio: 'Sim', exemplo: '74000-000' }),
    texto('LOGRADOURO', 'endereco.logradouro', (p) => p.endereco?.logradouro ?? null, 'Rua, rodovia, número (de 5 a 200 caracteres).', {
      obrigatorio: 'Sim',
    }),
    texto('BAIRRO', 'endereco.bairro', (p) => p.endereco?.bairro ?? null, 'Bairro ou região (de 2 a 100 caracteres).', {
      obrigatorio: 'Na planta nova',
    }),
    texto('CIDADE', 'endereco.cidade', (p) => p.endereco?.cidade ?? null, 'Nome da cidade.', { obrigatorio: 'Sim' }),
    texto('UF', 'endereco.uf', (p) => p.endereco?.uf ?? null, 'Sigla do estado, em duas letras.', { obrigatorio: 'Sim', exemplo: 'GO' }),
  ];
}

function secaoDeUnidades(refs: Referencia[]) {
  return secao<Planta, UnidadeDaApi>({
    titulo: 'UNIDADES',
    cor: VERDE_RECURSOS,
    explicacao:
      'As instalações da planta. Unidade com ID é editada; linha sem ID cria uma unidade nova, com a UF e a cidade da planta. Unidade que sumiu da seção NÃO é apagada — para tirar de uso, escreva inativo em STATUS. Nas colunas marcadas "vazio = mantém", apagar o valor não o limpa (a tela também não limpa).',
    itens: (p) => p.unidades,
    colunas: [
      {
        titulo: 'NOME',
        caminho: 'nome',
        tipo: 'texto',
        obrigatorio: 'Sim',
        explicacao: 'Nome da instalação.',
        exemplo: 'UFV 1',
        valor: (u) => u.nome,
      },
      {
        titulo: 'PERFIL',
        caminho: 'tipo',
        tipo: 'opcao',
        rotulos: PERFIS,
        obrigatorio: 'Sim',
        explicacao: 'Se a instalação consome, gera ou os dois.',
        exemplo: 'Geração',
        valor: (u) => u.tipo,
      },
      {
        titulo: 'STATUS',
        caminho: 'status',
        tipo: 'opcao',
        rotulos: { ativo: 'ativo', inativo: 'inativo' },
        vazioEhPadrao: true,
        explicacao: 'Inativo tira a unidade de uso sem apagá-la. A unidade nova nasce ativa. Vazio = mantém.',
        exemplo: 'ativo',
        valor: (u) => u.status,
      },
      {
        titulo: 'TENSÃO NOMINAL',
        caminho: 'tensao_nominal',
        tipo: 'texto',
        lista: `"${TENSOES.join(',')}"`,
        vazioEhPadrao: true,
        explicacao: `Uma de: ${TENSOES.join(', ')}. Vazio = mantém.`,
        exemplo: '13,8 kV',
        valor: (u) => u.tensaoNominal ?? null,
      },
      {
        titulo: 'GRUPO',
        caminho: 'grupo',
        tipo: 'opcao',
        rotulos: { A: 'A', B: 'B' },
        vazioEhPadrao: true,
        explicacao: 'Grupo tarifário. Vazio = mantém.',
        exemplo: 'A',
        valor: (u) => u.grupo ?? null,
      },
      {
        titulo: 'Nº DA UC',
        caminho: 'numero_uc',
        tipo: 'texto',
        vazioEhPadrao: true,
        explicacao: 'Número da unidade consumidora. Vazio = mantém.',
        valor: (u) => u.numeroUc ?? null,
      },
      {
        titulo: 'LATITUDE',
        caminho: 'latitude',
        tipo: 'numero',
        obrigatorio: 'Sim',
        explicacao: 'Em graus decimais, de -90 a 90.',
        exemplo: '-16,6869',
        valor: (u) => Number(u.latitude),
      },
      {
        titulo: 'LONGITUDE',
        caminho: 'longitude',
        tipo: 'numero',
        obrigatorio: 'Sim',
        explicacao: 'Em graus decimais, de -180 a 180.',
        exemplo: '-49,2648',
        valor: (u) => Number(u.longitude),
      },
      {
        titulo: 'CONCESSIONÁRIA',
        caminho: 'concessionaria',
        tipo: 'texto',
        lista: referencia(refs, 'concessionarias'),
        vazioEhPadrao: true,
        explicacao: 'A distribuidora, pelo nome como na aba REFERÊNCIAS. Vazio = mantém.',
        valor: (u) => u.nomeDaConcessionaria ?? null,
      },
      {
        titulo: 'ID DA UNIDADE',
        caminho: 'id',
        tipo: 'texto',
        identificador: true,
        explicacao: 'Identifica a unidade. Não altere; em unidade nova, deixe vazio.',
        valor: (u) => u.id.trim(),
      },
      {
        titulo: 'ID DA CONCESSIONÁRIA',
        caminho: 'concessionaria_ref',
        tipo: 'texto',
        identificador: true,
        explicacao: 'O ID da concessionária. Resolve nomes repetidos; com o nome trocado, vale o nome.',
        valor: (u) => u.concessionariaId?.trim() ?? null,
      },
    ],
  });
}

const resumo: Campo<Planta>[] = [
  { titulo: 'PLANTA', caminho: 'nome', tipo: 'texto', largura: 36, explicacao: '', valor: (p) => p.nome },
  { titulo: 'PROPRIETÁRIO', tipo: 'texto', largura: 30, explicacao: '', valor: (p) => p.proprietario?.nome ?? null },
  {
    titulo: 'CIDADE',
    tipo: 'texto',
    largura: 26,
    explicacao: '',
    valor: (p) => [p.endereco?.cidade, p.endereco?.uf].filter(Boolean).join('/') || null,
  },
  {
    titulo: 'ENDEREÇO',
    tipo: 'texto',
    largura: 40,
    explicacao: '',
    valor: (p) => [p.endereco?.logradouro, p.endereco?.bairro, p.endereco?.cep].filter(Boolean).join(', ') || null,
  },
  { titulo: 'UNIDADES', tipo: 'inteiro', largura: 10, explicacao: '', valor: (p) => p.unidades.length },
];

/** UF em maiúsculas: o servidor só aceita duas letras maiúsculas. */
function montar(cabecalhoLido: Record<string, unknown>, secoesLidas: SecoesLidas) {
  const dados: Record<string, unknown> = { ...cabecalhoLido };
  const endereco = dados.endereco as Record<string, unknown> | undefined;
  if (endereco && typeof endereco.uf === 'string') dados.endereco = { ...endereco, uf: endereco.uf.toUpperCase() };
  if (secoesLidas.UNIDADES) dados.unidades = secoesLidas.UNIDADES;
  return dados;
}

function definicao(referencias: Referencia[]): PlanilhaDeFichas<Planta> {
  return {
    cadastro: 'Plantas',
    singular: 'planta',
    tituloDaFicha: 'PLANTA',
    campos: cabecalho(referencias),
    secoes: [secaoDeUnidades(referencias)],
    resumo,
    larguras: [26, 36, 14, 16, 10, 12, 14, 14, 30, 30, 30, 30],
    id: (p) => p.id.trim(),
    nome: (p) => p.nome,
    atualizadoEm: (p) => p.atualizadoEm ?? null,
    comoTirarDeUso: 'escreva inativo no STATUS das unidades (a planta em si sai pela tela)',
    montar,
    referencias,
    regrasDoCadastro: [
      'Os operadores de cada planta se vinculam na tela de operadores, não pela planilha. Anexos das unidades também ficam na tela.',
      'Planta e unidade compartilhadas com o NexOn: a alteração confirmada é replicada lá.',
    ],
  };
}

export const definicaoDePlantas = definicao([]);

type FiltrosDePlantas = { search?: string; proprietarioId?: string };

async function referencias(): Promise<{ refs: Referencia[]; nomeDaConcessionaria: Map<string, string> }> {
  const [proprietarios, concessionarias] = await Promise.all([
    api.get('/plantas/proprietarios').then((r) => (Array.isArray(r.data) ? r.data : (r.data?.data ?? [])) as Array<{ id: string; nome: string; email?: string }>),
    todasAsPaginas((page, limit) => ConcessionariasService.getAllConcessionarias({ page, limit })),
  ]);

  return {
    refs: [
      {
        chave: 'proprietarios',
        titulo: 'PROPRIETÁRIOS',
        colunas: ['NOME', 'E-MAIL', 'ID'],
        linhas: proprietarios.map((p) => [p.nome, p.email ?? null, p.id.trim()]),
      },
      {
        chave: 'concessionarias',
        titulo: 'CONCESSIONÁRIAS',
        colunas: ['NOME', 'UF', 'ID'],
        linhas: concessionarias.map((c) => [c.nome, c.estado, c.id.trim()]),
      },
    ],
    nomeDaConcessionaria: new Map(concessionarias.map((c) => [c.id.trim(), c.nome])),
  };
}

export async function exportarPlantas(filtros: FiltrosDePlantas) {
  const [lista, { refs, nomeDaConcessionaria }] = await Promise.all([
    todasAsPaginas((page, limit) =>
      PlantasService.getAllPlantas({ ...filtros, page, limit, orderBy: 'nome', orderDirection: 'asc' }),
    ),
    referencias(),
  ]);

  // As unidades de cada planta, uma planta por vez.
  const plantas: Planta[] = [];
  for (const planta of lista) {
    const unidades = await todasAsPaginas(async (page, limit) => {
      const resposta = await api.get('/unidades', { params: { plantaId: planta.id.trim(), page, limit } });
      return resposta.data as PaginaDaListagem<UnidadeDaApi>;
    });
    plantas.push({
      ...planta,
      unidades: unidades.map((u) => ({
        ...u,
        nomeDaConcessionaria: u.concessionariaId ? (nomeDaConcessionaria.get(u.concessionariaId.trim()) ?? null) : null,
      })),
    });
  }

  await exportarFichas(definicao(refs), plantas);
}

/** A leitura não usa as referências: quem acha o nome é o servidor. */
export const lerPlantas = (livro: Workbook) => lerFichas(definicaoDePlantas, livro);
