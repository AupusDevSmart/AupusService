//@ts-nocheck
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
  Settings,
  Calendar,
  FileText,
  ClipboardList,
  Truck,
  Hammer,
  Building,
  AlertTriangle,
  CheckSquare,
  Package,
  PlayCircle,
  Layers,
  Tag,
  LayoutDashboard,
  Gauge,
  SquareLibrary,
  SquareUser,
  SquareUserRound,
  CircleUserRound,
  OctagonAlert
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
  // 📊 DASHBOARD
  {
    key: 'dashboard',
    featureKey: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
    hint: 'Dashboard',
  },

  // 🏭 INFRAESTRUTURA
  {
    key: 'cadastros',
    featureKey: 'Plantas',
    path: '/cadastros',
    icon: Building2,
    label: 'Cadastros',
    hint: 'Cadastros',
    links: [
      // 👥 USUÁRIOS
      {
        key: 'usuarios',
        featureKey: 'Usuarios',
        path: '/usuarios',
        icon: Users,
        label: 'Usuários',
        hint: 'Usuários',
      },
      {
        key: 'plantas',
        featureKey: 'Plantas',
        path: '/plantas',
        icon: Factory,
        label: 'Plantas',
        hint: 'Plantas',
      },
      {
        key: 'equipamentos',
        featureKey: 'Equipamentos',
        path: '/equipamentos',
        icon: Wrench,
        label: 'Equipamentos',
        hint: 'Equipamentos',
      }
    ]
  },

  // 🔧 MANUTENÇÃO
  {
    key: 'manutencao',
    featureKey: 'Equipamentos',
    path: '/manutencao',
    icon: Settings,
    label: 'Manutenção',
    hint: 'Manutenção',
    links: [
      {
        key: 'planos-manutencao',
        featureKey: 'Equipamentos',
        path: '/planos-manutencao',
        icon: Layers,
        label: 'Planos de Manutenção',
        hint: 'Planos de Manutenção',
      },
      {
        key: 'tarefas',
        featureKey: 'Equipamentos',
        path: '/tarefas',
        icon: Tag,
        label: 'Tarefas',
        hint: 'Tarefas',
      },
      {
        key: 'programacao-os',
        featureKey: 'Equipamentos',
        path: '/programacao-os',
        icon: Calendar,
        label: 'Programação OS',
        hint: 'Programação OS',
      },
      {
        key: 'execucao-os',
        featureKey: 'Equipamentos',
        path: '/execucao-os',
        icon: PlayCircle,
        label: 'Execução OS',
        hint: 'Execução OS',
      },
      {
        key: 'anomalias',
        featureKey: 'Equipamentos',
        path: '/anomalias',
        icon: AlertTriangle,
        label: 'Anomalias',
        hint: 'Anomalias',
      }
    ]
  },

  // 📦 RECURSOS
  {
    key: 'recursos',
    featureKey: 'Equipamentos',
    path: '/recursos',
    icon: Package,
    label: 'Recursos',
    hint: 'Recursos',
    links: [
      {
        key: 'veiculos',
        featureKey: 'Equipamentos',
        path: '/veiculos',
        icon: Truck,
        label: 'Veículos',
        hint: 'Veículos',
      },
      {
        key: 'ferramentas',
        featureKey: 'Equipamentos',
        path: '/ferramentas',
        icon: Hammer,
        label: 'Ferramentas',
        hint: 'Ferramentas',
      },
      {
        key: 'reservas',
        featureKey: 'Equipamentos',
        path: '/reservas',
        icon: CheckSquare,
        label: 'Reservas',
        hint: 'Reservas',
      }
    ]
  },

  // 🤝 FORNECEDORES
  {
    key: 'fornecedores',
    featureKey: 'Equipamentos',
    path: '/fornecedores',
    icon: Handshake,
    label: 'Fornecedores',
    hint: 'Fornecedores',
  },
];