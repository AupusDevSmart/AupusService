import { ChartColumnBig } from '@/components/icons/ChartColumnBig';
import { ChartNoAxesColumn } from '@/components/icons/ChartNoAxesColumn';
import { Permissao } from '@/types/dtos/usuarios-dto';
import {
  type LucideIcon,
  Activity,
  BookUser,
  Building2,
  Component,
  DollarSign,
  Folder,
  Handshake,
  Magnet,
  SquareActivity,
  Users,
  UtilityPole,
  Zap,
  Factory,
  Wrench,
} from 'lucide-react';

import { FileUser } from '@/components/icons/FileUser';
import { HousePlugIcon } from '@/components/icons/HousePlugIcon';

export type NavigationLink = {
  key: string;
  path: string;
  featureKey?: Permissao;
  icon: LucideIcon | React.FC<React.SVGProps<SVGSVGElement>>;
  label: string;
  hint?: string;
  links?: NavigationLink[];
};

export const navigationLinks: Array<NavigationLink> = [
  {
    key: 'admin',
    featureKey: 'Dashboard',
    path: '/dashboard',
    icon: ChartNoAxesColumn,
    label: 'Dashboard SA',
    hint: 'Dashboard SA',
  },
  // ✅ NOVO: Gestão de Usuários
  {
    key: 'usuarios',
    featureKey: 'Usuarios',
    path: '/usuarios',
    icon: Users,
    label: 'Usuários',
    hint: 'Gestão de usuários do sistema'
  },
  // ✅ NOVO: Gestão de Plantas
  {
    key: 'plantas',
    featureKey: 'Plantas',
    path: '/plantas',
    icon: Factory,
    label: 'Plantas',
    hint: 'Gestão de plantas industriais'
  },
  // ✅ NOVO: Gestão de Equipamentos
  {
    key: 'equipamentos',
    featureKey: 'Equipamentos',
    path: '/equipamentos',
    icon: Wrench,
    label: 'Equipamentos',
    hint: 'Gestão de equipamentos e componentes'
  },
  // Outras páginas comentadas...
  // {
  //   key: 'monitoramentoConsumo',
  //   featureKey: 'MonitoramentoConsumo',
  //   path: '/monitoramento-de-consumo',
  //   icon: Activity,
  //   label: 'Monitoramento de Consumo',
  //   hint: 'Monitoramento de Consumo',
  // },
  // {
  //   key: 'areaDoAssociado',
  //   featureKey: 'AreaDoAssociado',
  //   path: 'area-do-associado',
  //   icon: Handshake,
  //   label: 'Área do Associado',
  //   hint: 'Área do Associado',
  // },
  // {
  //   key: 'associados',
  //   featureKey: 'Associados',
  //   path: '/associados',
  //   icon: SquareActivity,
  //   label: 'Associados',
  //   hint: 'Associados',
  // },
  // {
  //   key: 'prospeccao',
  //   featureKey: 'Prospeccao',
  //   path: '/prospeccao',
  //   icon: FileUser,
  //   label: 'Nova Prospecção',
  //   hint: 'Nova Prospecção',
  // },
  // {
  //   key: 'prospeccao',
  //   featureKey: 'ProspeccaoListagem',
  //   path: '/prospeccao/listagem',
  //   icon: BookUser,
  //   label: 'Listagem de Prospeccao',
  //   hint: 'Listagem de Prospeccao',
  // },
  // {
  //   key: 'oportunidades',
  //   featureKey: 'Oportunidades',
  //   path: '/rastreador-de-oportunidades',
  //   icon: Magnet,
  //   label: 'Rastreador de Oportunidades',
  //   hint: 'Rastreador de Oportunidades',
  // },
  // {
  //   key: 'financeiro',
  //   featureKey: 'Financeiro',
  //   path: '/financeiro',
  //   icon: DollarSign,
  //   label: 'Financeiro',
  //   hint: 'Financeiro',
  // },
  // {
  //   key: 'documentos',
  //   featureKey: 'Documentos',
  //   path: '/documentos',
  //   icon: Folder,
  //   label: 'Documentos',
  //   hint: 'Documentos',
  // },
  // {
  //   key: 'organizacoes',
  //   featureKey: 'Organizacoes',
  //   path: '/organizacoes',
  //   icon: Building2,
  //   label: 'Organizações',
  //   hint: 'Organizações',
  // }
];