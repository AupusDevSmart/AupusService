import { Permissao } from '@/types/dtos/usuarios-dto';
import {
  type LucideIcon,
  Building2,
  Users,
  Factory,
  Wrench,
  Settings,
  Calendar,
  CalendarDays,
  FileText,
  Truck,
  Package,
  AlertTriangle,
  CheckSquare,
  ClipboardList,
  PlayCircle,
  Layers,
  LayoutDashboard,
  Clock,
  FilePenLine,
  Construction
} from 'lucide-react';


export type NavigationLink = {
  key: string;
  path: string;
  featureKey?: Permissao;
  icon: LucideIcon | React.FC<React.SVGProps<SVGSVGElement>>;
  label: string;
  hint?: string;
  links?: NavigationLink[];
  /**
   * Outras rotas que marcam este item como ativo no menu: telas internas com
   * outro nome, ou paginas que sairam do menu mas seguem acessiveis por link.
   */
  ativoEm?: string[];
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
        // Concessionarias saiu do menu (vive no AupusNexOn), mas a rota segue
        // viva para link antigo.
        ativoEm: ['/cadastros/concessionarias'],
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
    // A ordem segue o caminho do trabalho, do que se define ao que se executa:
    // a instrucao descreve o servico, o plano diz quando repetir, anomalia e
    // solicitacao sao as duas portas de entrada de demanda, a programacao agenda
    // e a execucao fecha.
    links: [
      {
        key: 'instrucoes',
        featureKey: 'manutencao.view',
        path: '/instrucoes',
        icon: FileText,
        label: 'Instruções',
        hint: 'Instruções',
      },
      // Tarefas nao tem mais pagina propria: sao cadastradas e editadas dentro
      // da linha expandida de cada plano em /planos-manutencao.
      {
        key: 'planos-manutencao',
        featureKey: 'manutencao.view',
        path: '/planos-manutencao',
        icon: Layers,
        label: 'Planos de Manutenção',
        hint: 'Planos de Manutenção',
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
        featureKey: 'solicitacoes.view',
        path: '/solicitacoes-servico',
        icon: FilePenLine,
        label: 'Solicitações de Serviço',
        hint: 'Solicitações de Serviço',
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
      }
    ]
  },

  // O que vai acontecer e quando: o calendário da manutenção (SN-52) e a
  // regra de dia útil que ele e o gerador usam (SN-56)
  {
    key: 'agenda',
    path: '/agenda',
    icon: CalendarDays,
    label: 'Agenda',
    hint: 'Agenda',
    links: [
      {
        key: 'calendario',
        featureKey: 'manutencao.view',
        path: '/agenda/calendario',
        icon: CalendarDays,
        label: 'Calendário',
        hint: 'Calendário de manutenção',
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
        label: 'Dias úteis',
        hint: 'Dias úteis das plantas',
      },
    ],
  },

  // Tudo que sustenta a operação sem ser a operação em si: quem acessa e o que
  // se reserva. Feriados e dias úteis foram para a Agenda (SN-56).
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
        key: 'recursos',
        featureKey: 'recursos.manage',
        path: '/recursos',
        icon: Package,
        label: 'Recursos',
        hint: 'Recursos',
        // Ferramentas e fornecedores nao tem item proprio no menu, mas as rotas
        // seguem abertas: marcam o cadastro de recursos, o mais proximo delas.
        ativoEm: ['/ferramentas', '/fornecedores'],
      },
      {
        // SN-84: o cadastro do AupusProject, com a permissão do de recursos
        key: 'maquinarios',
        featureKey: 'recursos.manage',
        path: '/maquinarios',
        icon: Construction,
        label: 'Maquinários',
        hint: 'Maquinários',
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
      }
    ]
  },
];
