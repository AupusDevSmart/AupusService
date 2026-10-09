import type { Workbook } from 'exceljs';

import type { Campo } from '@/lib/planilha/campos';
import { exportarPlana, lerPlana, type PlanilhaPlana } from '@/lib/planilha/plana';
import { todasAsPaginas } from '@/lib/planilha/todas-as-paginas';
import { VeiculosService, type QueryVeiculosParams, type VeiculoResponse } from '@/services/veiculos.services';

/**
 * Veículos na planilha: cadastro plano, editado na aba RESUMO. Inativar fica
 * na tela (tem motivo e cancela reservas); documentos e foto não viajam.
 */

/** O que a listagem devolve além do tipo do formulário. */
type VeiculoDaApi = Omit<VeiculoResponse, 'id'> & {
  id: string;
  ativo?: boolean;
};

const TIPOS: Record<string, string> = {
  carro: 'Carro',
  van: 'Van',
  caminhonete: 'Caminhonete',
  caminhao: 'Caminhão',
  onibus: 'Ônibus',
  moto: 'Moto',
  utilitario: 'Utilitário',
};

const COMBUSTIVEIS: Record<string, string> = {
  flex: 'Flex',
  gasolina: 'Gasolina',
  etanol: 'Etanol',
  diesel: 'Diesel',
  eletrico: 'Elétrico',
  hibrido: 'Híbrido',
  gnv: 'GNV',
};

const STATUS: Record<string, string> = {
  disponivel: 'Disponível',
  em_uso: 'Em uso',
  manutencao: 'Manutenção',
  inativo: 'Inativo',
};

/** A API devolve a data do calendário como meia-noite UTC; a planilha quer o dia. */
const dia = (valor?: string | null) => (valor ? valor.slice(0, 10) : null);

const campos: Campo<VeiculoDaApi>[] = [
  {
    titulo: 'NOME',
    caminho: 'nome',
    tipo: 'texto',
    obrigatorio: 'Sim',
    largura: 26,
    explicacao: 'Como o veículo é chamado na empresa (de 2 a 100 caracteres).',
    exemplo: 'Hilux 01',
    valor: (v) => v.nome,
  },
  {
    titulo: 'PLACA',
    caminho: 'placa',
    tipo: 'texto',
    obrigatorio: 'Sim',
    largura: 11,
    explicacao: 'Em maiúsculas, no formato antigo (ABC-1234) ou Mercosul (ABC1D23). Não pode repetir a de outro veículo.',
    exemplo: 'ABC1D23',
    valor: (v) => v.placa,
  },
  {
    titulo: 'STATUS',
    tipo: 'opcao',
    rotulos: STATUS,
    largura: 12,
    explicacao: 'Situação de uso. Muda pela tela e pelas reservas, não pela planilha.',
    valor: (v) => v.status,
  },
  {
    titulo: 'MARCA',
    caminho: 'marca',
    tipo: 'texto',
    obrigatorio: 'Sim',
    largura: 14,
    explicacao: 'Fabricante do veículo.',
    exemplo: 'Toyota',
    valor: (v) => v.marca,
  },
  {
    titulo: 'MODELO',
    caminho: 'modelo',
    tipo: 'texto',
    obrigatorio: 'Sim',
    largura: 16,
    explicacao: 'Modelo do veículo.',
    exemplo: 'Hilux',
    valor: (v) => v.modelo,
  },
  {
    titulo: 'ANO DE FABRICAÇÃO',
    caminho: 'anoFabricacao',
    tipo: 'inteiro',
    obrigatorio: 'Sim',
    largura: 12,
    explicacao: 'Ano com quatro dígitos.',
    exemplo: '2022',
    valor: (v) => v.anoFabricacao,
  },
  {
    titulo: 'TIPO',
    caminho: 'tipo',
    tipo: 'opcao',
    rotulos: TIPOS,
    obrigatorio: 'Sim',
    largura: 14,
    explicacao: 'Tipo de veículo.',
    exemplo: 'Caminhonete',
    valor: (v) => v.tipo,
  },
  {
    titulo: 'COMBUSTÍVEL',
    caminho: 'tipoCombustivel',
    tipo: 'opcao',
    rotulos: COMBUSTIVEIS,
    obrigatorio: 'Sim',
    largura: 12,
    explicacao: 'Combustível principal.',
    exemplo: 'Diesel',
    valor: (v) => v.tipoCombustivel,
  },
  {
    titulo: 'PASSAGEIROS',
    caminho: 'capacidadePassageiros',
    tipo: 'inteiro',
    obrigatorio: 'Sim',
    largura: 11,
    explicacao: 'Quantas pessoas leva, contando o motorista (mínimo 1).',
    exemplo: '5',
    valor: (v) => v.capacidadePassageiros,
  },
  {
    titulo: 'CARGA (KG)',
    caminho: 'capacidadeCarga',
    tipo: 'numero',
    obrigatorio: 'Sim',
    largura: 11,
    explicacao: 'Capacidade de carga em quilos (0 se não leva carga).',
    exemplo: '1000',
    valor: (v) => v.capacidadeCarga,
  },
  {
    titulo: 'QUILOMETRAGEM',
    caminho: 'quilometragem',
    tipo: 'inteiro',
    obrigatorio: 'Sim',
    largura: 13,
    explicacao: 'Quilometragem atual do hodômetro, em km inteiros.',
    exemplo: '12000',
    valor: (v) => v.quilometragem,
  },
  {
    titulo: 'LOCALIZAÇÃO ATUAL',
    caminho: 'localizacaoAtual',
    tipo: 'texto',
    obrigatorio: 'Sim',
    largura: 20,
    explicacao: 'Onde o veículo fica.',
    exemplo: 'Garagem Principal',
    valor: (v) => v.localizacaoAtual,
  },
  {
    titulo: 'RESPONSÁVEL',
    caminho: 'responsavel',
    tipo: 'texto',
    largura: 18,
    explicacao: 'Nome de quem responde pelo veículo (texto livre).',
    valor: (v) => v.responsavel ?? null,
  },
  {
    titulo: 'PRÓXIMA REVISÃO',
    caminho: 'proximaRevisao',
    tipo: 'data',
    largura: 13,
    explicacao: 'Data da próxima revisão.',
    exemplo: '15/12/2026',
    valor: (v) => dia(v.proximaRevisao),
  },
  {
    titulo: 'CHASSI',
    caminho: 'chassi',
    tipo: 'texto',
    largura: 20,
    explicacao: 'Número do chassi, exatamente 17 caracteres. Não pode repetir o de outro veículo.',
    valor: (v) => v.chassi ?? null,
  },
  {
    titulo: 'RENAVAM',
    caminho: 'renavam',
    tipo: 'texto',
    largura: 13,
    explicacao: 'Exatamente 11 dígitos.',
    valor: (v) => v.renavam ?? null,
  },
  {
    titulo: 'SEGURADORA',
    caminho: 'seguradora',
    tipo: 'texto',
    largura: 16,
    explicacao: 'Nome da seguradora.',
    valor: (v) => v.seguradora ?? null,
  },
  {
    titulo: 'VENCIMENTO DO SEGURO',
    caminho: 'vencimentoSeguro',
    tipo: 'data',
    largura: 13,
    explicacao: 'Data em que o seguro vence.',
    exemplo: '31/03/2027',
    valor: (v) => dia(v.vencimentoSeguro),
  },
  {
    titulo: 'COR',
    caminho: 'cor',
    tipo: 'texto',
    largura: 10,
    explicacao: 'Cor do veículo.',
    valor: (v) => v.cor ?? null,
  },
  {
    titulo: 'OBSERVAÇÕES',
    caminho: 'observacoes',
    tipo: 'texto',
    largura: 30,
    explicacao: 'Texto livre.',
    valor: (v) => v.observacoes ?? null,
  },
];

/** A placa vale em maiúsculas — a tela aceita digitar em minúsculas, o servidor não. */
function montar(dados: Record<string, unknown>) {
  return typeof dados.placa === 'string' ? { ...dados, placa: dados.placa.toUpperCase() } : dados;
}

export const definicaoDeVeiculos: PlanilhaPlana<VeiculoDaApi> = {
  cadastro: 'Veículos',
  singular: 'veículo',
  campos,
  id: (v) => v.id.trim(),
  nome: (v) => v.nome,
  atualizadoEm: (v) => v.atualizadoEm,
  comoTirarDeUso: 'use a ação Inativar na tela de Veículos (ela pede o motivo e cancela as reservas futuras)',
  montar,
  regrasDoCadastro: [
    'Documentos e foto do veículo não passam pela planilha: anexe pela tela.',
    'Veículo com reserva ativa não pode trocar de placa.',
  ],
};

export async function exportarVeiculos(filtros: Omit<QueryVeiculosParams, 'page' | 'limit'>) {
  const veiculos = await todasAsPaginas(async (page, limit) => {
    const resposta = await VeiculosService.getAllVeiculos({ ...filtros, page, limit });
    return resposta as unknown as { data: VeiculoDaApi[]; pagination: { totalPages: number } };
  });
  await exportarPlana(definicaoDeVeiculos, veiculos);
}

export const lerVeiculos = (livro: Workbook) => lerPlana(definicaoDeVeiculos, livro);
