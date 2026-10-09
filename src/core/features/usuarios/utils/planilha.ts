import type { Workbook } from 'exceljs';

import { api } from '@/config/api';
import type { Campo } from '@/lib/planilha/campos';
import { chave } from '@/lib/planilha/leitura';
import { exportarPlana, lerPlana, type PlanilhaPlana } from '@/lib/planilha/plana';
import { todasAsPaginas } from '@/lib/planilha/todas-as-paginas';
import { UsuariosService, type UsuarioQueryParams } from '@/services/usuarios.services';

/**
 * Usuários na planilha: cadastro plano, editado na aba RESUMO.
 *
 * Decidido com o usuário (09/out/2026): o TIPO entra; permissões diretas e
 * senha nunca passam pela planilha; as plantas que um operador opera vão em
 * cinza (o vínculo é na tela de operadores).
 */

type UsuarioDaApi = {
  id: string;
  nome: string;
  email: string;
  status: string;
  telefone?: string | null;
  cpf_cnpj?: string | null;
  cep?: string | null;
  estado?: string | null;
  cidade?: string | null;
  endereco?: string | null;
  roles?: string[];
  updated_at?: string | null;
  /** Montado na exportação, para a coluna informativa. */
  plantasOperadas?: string[];
};

/** Os tipos que a tela oferece, com o rótulo que ela mostra. */
const TIPOS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Administrador',
  gerente: 'Gerente',
  analista: 'Analista',
  proprietario: 'Proprietário',
  operador: 'Operador',
};

const papelDe = (u: UsuarioDaApi) => u.roles?.[0] ?? null;

const campos: Campo<UsuarioDaApi>[] = [
  {
    titulo: 'NOME',
    caminho: 'nome',
    tipo: 'texto',
    obrigatorio: 'Sim',
    largura: 30,
    explicacao: 'Nome completo (de 2 a 255 caracteres).',
    exemplo: 'Maria da Silva',
    valor: (u) => u.nome,
  },
  {
    titulo: 'STATUS',
    caminho: 'status',
    tipo: 'opcao',
    rotulos: { Ativo: 'Ativo', Inativo: 'Inativo' },
    obrigatorio: 'Sim',
    largura: 10,
    explicacao: 'Inativo tira o acesso sem apagar o usuário.',
    exemplo: 'Ativo',
    valor: (u) => u.status,
  },
  {
    titulo: 'TIPO',
    caminho: 'tipo',
    tipo: 'texto',
    lista: `"${Object.values(TIPOS).join(',')}"`,
    obrigatorio: 'Só no usuário novo',
    largura: 16,
    explicacao:
      'O papel do usuário. Trocar exige que você possa criar usuários desse tipo. Usuário novo recebe as permissões padrão do tipo; em quem já existe, trocar o tipo NÃO mexe nas permissões diretas (revise-as na tela). Vazio = mantém.',
    exemplo: 'Operador',
    valor: (u) => {
      const papel = papelDe(u);
      return papel ? (TIPOS[papel] ?? papel) : null;
    },
  },
  {
    titulo: 'E-MAIL',
    caminho: 'email',
    tipo: 'texto',
    obrigatorio: 'Sim',
    largura: 32,
    explicacao: 'O login do usuário. Não pode repetir o de outro usuário.',
    exemplo: 'maria@empresa.com.br',
    valor: (u) => u.email,
  },
  {
    titulo: 'TELEFONE',
    caminho: 'telefone',
    tipo: 'texto',
    largura: 16,
    explicacao: 'Com DDD (de 10 a 20 caracteres).',
    exemplo: '62999998888',
    valor: (u) => u.telefone ?? null,
  },
  {
    titulo: 'CPF/CNPJ',
    caminho: 'cpfCnpj',
    tipo: 'texto',
    largura: 20,
    explicacao: 'CPF ou CNPJ (de 11 a 18 caracteres, com ou sem pontuação).',
    exemplo: '123.456.789-09',
    valor: (u) => u.cpf_cnpj ?? null,
  },
  {
    titulo: 'CEP',
    caminho: 'cep',
    tipo: 'texto',
    largura: 11,
    explicacao: 'CEP do endereço.',
    exemplo: '74000-000',
    valor: (u) => u.cep ?? null,
  },
  {
    titulo: 'UF',
    caminho: 'estado',
    tipo: 'texto',
    largura: 6,
    explicacao: 'Sigla do estado.',
    exemplo: 'GO',
    valor: (u) => u.estado ?? null,
  },
  {
    titulo: 'CIDADE',
    caminho: 'cidade',
    tipo: 'texto',
    largura: 18,
    explicacao: 'Nome da cidade.',
    exemplo: 'Goiânia',
    valor: (u) => u.cidade ?? null,
  },
  {
    titulo: 'ENDEREÇO',
    caminho: 'endereco',
    tipo: 'texto',
    largura: 34,
    explicacao: 'Endereço completo (de 5 a 255 caracteres).',
    exemplo: 'Rua 1, 100, Setor Central',
    valor: (u) => u.endereco ?? null,
  },
  {
    titulo: 'PLANTAS QUE OPERA',
    tipo: 'texto',
    largura: 34,
    explicacao: 'Só para operadores. O vínculo é feito na tela de operadores da planta, não pela planilha.',
    valor: (u) => u.plantasOperadas?.join('; ') || null,
  },
];

/** O rótulo da tela ("Operador") vira o nome do papel ("operador"); o que não é rótulo segue como veio. */
function montar(dados: Record<string, unknown>) {
  if (typeof dados.tipo !== 'string') return dados;
  const codigo = Object.entries(TIPOS).find(([, rotulo]) => chave(rotulo) === chave(dados.tipo as string))?.[0];
  return { ...dados, tipo: codigo ?? dados.tipo };
}

export const definicaoDeUsuarios: PlanilhaPlana<UsuarioDaApi> = {
  cadastro: 'Usuários',
  singular: 'usuário',
  campos,
  id: (u) => u.id.trim(),
  nome: (u) => u.nome,
  atualizadoEm: (u) => u.updated_at,
  comoTirarDeUso: 'escreva Inativo em STATUS',
  montar,
  regrasDoCadastro: [
    'Senha nunca passa pela planilha. O usuário novo recebe a senha provisória e o e-mail de boas-vindas, como no cadastro pela tela — o e-mail só sai depois que você confirmar a importação.',
    'Permissões diretas não passam pela planilha: ajuste-as na tela.',
    'Usuário compartilhado com o NexOn: a alteração confirmada é replicada lá.',
  ],
};

type FiltrosDeUsuarios = Pick<UsuarioQueryParams, 'search' | 'status' | 'role'>;

/** As plantas de cada operador, para a coluna informativa. */
async function plantasDosOperadores(usuarios: UsuarioDaApi[]) {
  const operadores = usuarios.filter((u) => papelDe(u) === 'operador');
  await Promise.all(
    operadores.map(async (u) => {
      const resposta = await api.get(`/usuarios/${u.id.trim()}/plantas-operadas`);
      const vinculos: Array<{ planta?: { nome: string } }> = Array.isArray(resposta.data)
        ? resposta.data
        : (resposta.data?.data ?? []);
      u.plantasOperadas = vinculos.map((v) => v.planta?.nome).filter((n): n is string => !!n);
    }),
  );
}

export async function exportarUsuarios(filtros: FiltrosDeUsuarios) {
  const usuarios = (await todasAsPaginas((page, limit) =>
    UsuariosService.getAllUsuarios({ ...filtros, page, limit }),
  )) as unknown as UsuarioDaApi[];
  await plantasDosOperadores(usuarios);
  await exportarPlana(definicaoDeUsuarios, usuarios);
}

export const lerUsuarios = (livro: Workbook) => lerPlana(definicaoDeUsuarios, livro);
