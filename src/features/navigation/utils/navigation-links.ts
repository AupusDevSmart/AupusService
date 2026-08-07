import { Permissao } from '@/types/dtos/usuarios-dto';
import {
  type LucideIcon,
  Building2,
  Users,
  Factory,
  Wrench,
  Settings,
  Calendar,
  FileText,
  Truck,
  AlertTriangle,
  CheckSquare,
  ClipboardList,
  PlayCircle,
  Layers,
  LayoutDashboard,
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

  // O que o usuário administra como patrimônio: onde ficam as instalações e o
  // que está instalado nelas. Instalações não têm página própria — vivem na
  // linha expandida de cada planta.
  {
    key: 'ativos',
    path: '/cadastros',
    icon: Building2,
    label: 'Ativos',
    hint: 'Ativos',
    links: [
      {
        key: 'plantas',
        featureKey: 'plantas.view',
        path: '/cadastros/plantas',
        icon: Factory,
        label: 'Plantas',
        hint: 'Plantas',
      },
      {
        key: 'equipamentos',
        featureKey: 'equipamentos.view',
        path: '/cadastros/equipamentos',
        icon: Wrench,
        label: 'Equipamentos',
        hint: 'Equipamentos',
      }
    ]
  },

  // Concessionárias existe só no AupusNexOn. A rota continua registrada aqui
  // para não quebrar link antigo, mas fora do menu.
  {
    key: 'controle',
    path: '/manutencao',
    icon: ClipboardList,
    label: 'Controle',
    hint: 'Controle',
    links: [
      {
        key: 'planos-manutencao',
        featureKey: 'manutencao.manage',
        path: '/planos-manutencao',
        icon: Layers,
        label: 'Planos de Manutenção',
        hint: 'Planos de Manutenção',
      },
      // Tarefas nao tem mais pagina propria: sao cadastradas e editadas dentro
      // da linha expandida de cada plano em /planos-manutencao.
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

  // Tudo que sustenta a operação sem ser a operação em si: quem acessa, o que
  // se reserva, e o calendário que define dia útil.
  {
    key: 'administracao',
    path: '/administracao',
    icon: Settings,
    label: 'Administração',
    hint: 'Administração',
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
      },
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
