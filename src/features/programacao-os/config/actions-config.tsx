// src/features/programacao-os/config/actions-config.tsx

import { Eye, Edit, CheckCircle, Ban, Trash2, ExternalLink, type LucideIcon } from 'lucide-react';
import type { TableAction } from '@/core';
import type { Permissao } from '@/types/dtos/usuarios-dto';
import type { ProgramacaoResponse } from '@/services/programacao-os.service';

export type AcaoProgramacao = 'aprovar' | 'editar' | 'cancelar' | 'excluir' | 'abrir_os';

/** O mínimo que a regra precisa saber da programação */
export interface ProgramacaoParaAcoes {
  status?: string | null;
  ordem_servico?: { id?: string | null; status?: string | null } | null;
}

export type TemPermissao = (...perms: Permissao[]) => boolean;
const liberaTudo: TemPermissao = () => true;

interface AcaoDaProgramacao {
  acao: AcaoProgramacao;
  label: string;
  descricao: string;
  icon: LucideIcon;
  variant: 'default' | 'destructive';
  /** Qualquer uma basta — espelha o @Permissions da rota */
  permissoes: Permissao[];
  disponivel: (p: ProgramacaoParaAcoes, modo: 'view' | 'edit') => boolean;
}

const statusDe = (p: ProgramacaoParaAcoes) => p.status?.toUpperCase();
const temOS = (p: ProgramacaoParaAcoes) => Boolean(p.ordem_servico?.id);

/**
 * As ações da programação, na ordem em que aparecem. É a única fonte: a tabela
 * e a seção do topo do sheet leem daqui, e as regras espelham as guardas do
 * programacao-os.service.
 *
 *   PENDENTE  -> aprovar, editar, cancelar, excluir
 *   APROVADA  -> abrir a OS; cancelar enquanto a OS não começou
 *               (o backend cancela a OS junto; se ela já começou, recusa)
 *   CANCELADA / FINALIZADA -> abrir a OS, se houver
 */
export const ACOES_DA_PROGRAMACAO: AcaoDaProgramacao[] = [
  {
    acao: 'aprovar', label: 'Aprovar', descricao: 'Aprovar e gerar a OS', icon: CheckCircle,
    variant: 'default', permissoes: ['programacao_os.aprovar'],
    disponivel: (p) => statusDe(p) === 'PENDENTE',
  },
  {
    acao: 'editar', label: 'Editar', descricao: 'Editar a programação', icon: Edit,
    variant: 'default', permissoes: ['programacao_os.manage'],
    disponivel: (p, modo) => modo === 'view' && statusDe(p) === 'PENDENTE',
  },
  {
    acao: 'abrir_os', label: 'Abrir OS', descricao: 'Abrir a ordem de serviço gerada', icon: ExternalLink,
    variant: 'default', permissoes: ['execucao_os.view'],
    disponivel: (p) => temOS(p),
  },
  {
    acao: 'cancelar', label: 'Cancelar', descricao: 'Cancelar com motivo', icon: Ban,
    variant: 'destructive', permissoes: ['programacao_os.cancelar'],
    disponivel: (p) => {
      const s = statusDe(p);
      if (s === 'PENDENTE') return true;
      if (s !== 'APROVADA') return false;
      // Sem a OS na mão (linha da tabela), deixa tentar: o backend recusa com o motivo.
      const statusOS = p.ordem_servico?.status?.toUpperCase();
      return !statusOS || statusOS === 'PENDENTE' || statusOS === 'CANCELADA';
    },
  },
  {
    acao: 'excluir', label: 'Excluir', descricao: 'Excluir a programação', icon: Trash2,
    variant: 'destructive', permissoes: ['programacao_os.cancelar'],
    disponivel: (p) => statusDe(p) === 'PENDENTE',
  },
];

export function acoesDaProgramacao(
  p: ProgramacaoParaAcoes,
  modo: 'view' | 'edit',
  temPermissao: TemPermissao = liberaTudo,
) {
  return ACOES_DA_PROGRAMACAO.filter((a) => a.disponivel(p, modo) && temPermissao(...a.permissoes));
}

/** Ações da tabela: Visualizar sempre, e as da regra acima filtradas por linha */
export function createProgramacaoOSTableActions(
  onView: (item: ProgramacaoResponse) => void,
  onAcao: (item: ProgramacaoResponse, acao: AcaoProgramacao) => void,
  temPermissao: TemPermissao = liberaTudo,
): TableAction<ProgramacaoResponse>[] {
  return [
    { key: 'view', label: 'Visualizar', icon: Eye, onClick: onView, variant: 'default' },
    ...ACOES_DA_PROGRAMACAO.filter((a) => temPermissao(...a.permissoes)).map((a) => ({
      key: a.acao,
      label: a.label,
      icon: a.icon,
      onClick: (item: ProgramacaoResponse) => onAcao(item, a.acao),
      variant: a.variant,
      condition: (item: ProgramacaoResponse) => a.disponivel(item as ProgramacaoParaAcoes, 'view'),
    })),
  ];
}
