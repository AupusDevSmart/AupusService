import { Permissao } from '@/types/dtos/usuarios-dto';
import {
  type LucideIcon,
  Building2,
  Users,
  Zap,
  Factory,
  Wrench,
  Settings,
  Calendar,
  FileText,
  Truck,
  Building,
  AlertTriangle,
  CheckSquare,
  Package,
  PlayCircle,
  Layers,
  Tag,
  LayoutDashboard,
  CalendarDays,
  Clock,
  FilePenLine
} from 'lucide-react';


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
    key: 'dashboard',
    featureKey: 'dashboard.view',
    path: '/dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard Operacional',
    hint: 'Dashboard Operacional Unificado',
  },

  {
    key: 'cadastros',
    path: '/cadastros',
    icon: Building2,
    label: 'Cadastros',
    hint: 'Cadastros',
    links: [
      {
        key: 'usuarios',
        featureKey: 'usuarios.view',
        path: '/cadastros/usuarios',
        icon: Users,
        label: 'Usuários',
        hint: 'Usuários',
      },
      {
        key: 'plantas',
        featureKey: 'plantas.view',
        path: '/cadastros/plantas',
        icon: Factory,
        label: 'Plantas',
        hint: 'Plantas',
      },
      {
        key: 'unidades',
        featureKey: 'unidades.view',
        path: '/cadastros/unidades',
        icon: Building,
        label: 'Unidades',
        hint: 'Unidades',
      },
      {
        key: 'equipamentos',
        featureKey: 'equipamentos.view',
        path: '/cadastros/equipamentos',
        icon: Wrench,
        label: 'Equipamentos',
        hint: 'Equipamentos',
      },
      {
        key: 'concessionarias',
        featureKey: 'equipamentos.manage',
        path: '/cadastros/concessionarias',
        icon: Zap,
        label: 'Concessionárias',
        hint: 'Concessionárias',
      }
    ]
  },

  {
    key: 'manutencao',
    path: '/manutencao',
    icon: Settings,
    label: 'Manutenção',
    hint: 'Manutenção',
    links: [
      {
        key: 'planos-manutencao',
        featureKey: 'manutencao.manage',
        path: '/planos-manutencao',
        icon: Layers,
        label: 'Planos de Manutenção',
        hint: 'Planos de Manutenção',
      },
      {
        key: 'tarefas',
        featureKey: 'manutencao.manage',
        path: '/tarefas',
        icon: Tag,
        label: 'Tarefas',
        hint: 'Tarefas',
      },
      {
        key: 'instrucoes',
        featureKey: 'manutencao.manage',
        path: '/instrucoes',
        icon: FileText,
        label: 'Instruções',
        hint: 'Instruções',
      },
      {
        key: 'programacao-os',
        featureKey: 'programacao_os.view',
        path: '/programacao-os',
        icon: Calendar,
        label: 'Programação OS',
        hint: 'Programação OS',
      },
      {
        key: 'execucao-os',
        featureKey: 'execucao_os.view',
        path: '/execucao-os',
        icon: PlayCircle,
        label: 'Execução OS',
        hint: 'Execução OS',
      },
      {
        key: 'anomalias',
        featureKey: 'anomalias.view',
        path: '/anomalias',
        icon: AlertTriangle,
        label: 'Anomalias',
        hint: 'Anomalias',
      },
      {
        key: 'solicitacoes-servico',
        featureKey: 'manutencao.manage',
        path: '/solicitacoes-servico',
        icon: FilePenLine,
        label: 'Solicitações de Serviço',
        hint: 'Solicitações de Serviço',
      }
    ]
  },

  {
    key: 'recursos',
    path: '/recursos',
    icon: Package,
    label: 'Recursos',
    hint: 'Recursos',
    links: [
      {
        key: 'veiculos',
        featureKey: 'recursos.manage',
        path: '/veiculos',
        icon: Truck,
        label: 'Veículos',
        hint: 'Veículos',
      },
      {
        key: 'reservas',
        featureKey: 'recursos.manage',
        path: '/reservas',
        icon: CheckSquare,
        label: 'Reservas',
        hint: 'Reservas',
      }
    ]
  },

  {
    key: 'agenda',
    path: '#',
    icon: CalendarDays,
    label: 'Agenda',
    hint: 'Agenda',
    links: [
      {
        key: 'feriados',
        featureKey: 'agenda.manage',
        path: '/agenda/feriados',
        icon: Calendar,
        label: 'Feriados',
        hint: 'Feriados',
      },
      {
        key: 'configuracoes-dias-uteis',
        featureKey: 'agenda.manage',
        path: '/agenda/configuracoes-dias-uteis',
        icon: Clock,
        label: 'Configurações de Dias Úteis',
        hint: 'Configurações de Dias Úteis',
      }
    ]
  },
];
