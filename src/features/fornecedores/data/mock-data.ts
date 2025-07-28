// src/features/fornecedores/data/mock-data.ts
import { Fornecedor } from '../types';

export const mockFornecedores: Fornecedor[] = [
  {
    id: 1,
    criadoEm: '2024-01-15T10:30:00Z',
    tipo: 'pessoa_juridica',
    email: 'contato@metalurgicaabc.com.br',
    telefone: '(11) 3456-7890',
    endereco: {
      logradouro: 'Rua das Indústrias',
      numero: '1500',
      complemento: 'Galpão A',
      bairro: 'Distrito Industrial',
      cidade: 'São Paulo',
      uf: 'SP',
      cep: '01234-567'
    },
    observacoes: 'Fornecedor principal de estruturas metálicas. Entrega rápida e qualidade excelente.',
    status: 'ativo',
    dadosPJ: {
      razaoSocial: 'Metalúrgica ABC Ltda',
      nomeFantasia: 'ABC Metais',
      cnpj: '12.345.678/0001-90',
      inscricaoEstadual: '123.456.789.012',
      nomeContato: 'João Silva Santos',
      tiposMateriais: ['Estruturas Metálicas', 'Chapas de Aço', 'Perfis Estruturais', 'Soldas']
    },
    ultimoContato: '2024-03-10',
    avaliacaoQualidade: 5
  },
  {
    id: 2,
    criadoEm: '2024-01-20T14:15:00Z',
    tipo: 'pessoa_fisica',
    email: 'carlos.eletricista@email.com',
    telefone: '(21) 9 8765-4321',
    endereco: {
      logradouro: 'Av. Central',
      numero: '789',
      bairro: 'Centro',
      cidade: 'Rio de Janeiro',
      uf: 'RJ',
      cep: '20000-123'
    },
    observacoes: 'Eletricista experiente, especialista em instalações industriais.',
    status: 'ativo',
    dadosPF: {
      nomeCompleto: 'Carlos Eduardo Oliveira',
      cpf: '123.456.789-00',
      especialidade: 'Instalações Elétricas Industriais'
    },
    ultimoContato: '2024-03-08',
    avaliacaoQualidade: 4
  },
  {
    id: 3,
    criadoEm: '2024-02-05T09:20:00Z',
    tipo: 'pessoa_juridica',
    email: 'vendas@equipamentosindustriais.com',
    telefone: '(31) 3321-9876',
    endereco: {
      logradouro: 'Rua dos Equipamentos',
      numero: '456',
      bairro: 'Industrial',
      cidade: 'Belo Horizonte',
      uf: 'MG',
      cep: '30000-456'
    },
    observacoes: 'Especialista em equipamentos de medição e instrumentos de precisão.',
    status: 'ativo',
    dadosPJ: {
      razaoSocial: 'Equipamentos Industriais BH S.A.',
      nomeFantasia: 'EI-BH',
      cnpj: '98.765.432/0001-10',
      inscricaoEstadual: '987.654.321.098',
      nomeContato: 'Maria Santos Costa',
      tiposMateriais: ['Instrumentos de Medição', 'Sensores', 'Controladores', 'Equipamentos de Automação']
    },
    ultimoContato: '2024-03-12',
    avaliacaoQualidade: 5
  },
  {
    id: 4,
    criadoEm: '2024-02-10T16:45:00Z',
    tipo: 'pessoa_fisica',
    email: 'ana.soldadora@gmail.com',
    telefone: '(85) 9 1234-5678',
    endereco: {
      logradouro: 'Rua do Trabalho',
      numero: '321',
      bairro: 'Operário',
      cidade: 'Fortaleza',
      uf: 'CE',
      cep: '60000-789'
    },
    observacoes: 'Soldadora certificada, especialista em soldas especiais e reparos.',
    status: 'ativo',
    dadosPF: {
      nomeCompleto: 'Ana Paula Ferreira',
      cpf: '987.654.321-00',
      especialidade: 'Soldas Especiais e Reparos Estruturais'
    },
    ultimoContato: '2024-03-05',
    avaliacaoQualidade: 5
  },
  {
    id: 5,
    criadoEm: '2024-02-18T15:10:00Z',
    tipo: 'pessoa_juridica',
    email: 'comercial@quimicaindustrial.com.br',
    telefone: '(47) 3654-9870',
    endereco: {
      logradouro: 'Av. Química',
      numero: '2000',
      complemento: 'Bloco B',
      bairro: 'Distrito Químico',
      cidade: 'Joinville',
      uf: 'SC',
      cep: '89000-321'
    },
    observacoes: 'Fornecedor de produtos químicos industriais. Possui todas as certificações.',
    status: 'ativo',
    dadosPJ: {
      razaoSocial: 'Química Industrial do Sul Ltda',
      nomeFantasia: 'QuimiSul',
      cnpj: '11.222.333/0001-44',
      inscricaoEstadual: '111.222.333.444',
      nomeContato: 'Roberto Silva Lima',
      tiposMateriais: ['Produtos Químicos', 'Solventes', 'Ácidos', 'Bases', 'Catalisadores']
    },
    ultimoContato: '2024-03-15',
    avaliacaoQualidade: 4
  },
  {
    id: 6,
    criadoEm: '2024-02-25T11:30:00Z',
    tipo: 'pessoa_fisica',
    email: 'pedro.mecanico@outlook.com',
    telefone: '(51) 9 8765-1234',
    endereco: {
      logradouro: 'Rua das Máquinas',
      numero: '987',
      bairro: 'Mecânico',
      cidade: 'Porto Alegre',
      uf: 'RS',
      cep: '90000-654'
    },
    observacoes: 'Mecânico industrial especializado em manutenção preventiva.',
    status: 'ativo',
    dadosPF: {
      nomeCompleto: 'Pedro Henrique Machado',
      cpf: '456.789.123-00',
      especialidade: 'Manutenção Preventiva e Corretiva de Máquinas'
    },
    ultimoContato: '2024-03-07',
    avaliacaoQualidade: 4
  },
  {
    id: 7,
    criadoEm: '2024-03-01T08:45:00Z',
    tipo: 'pessoa_juridica',
    email: 'atendimento@tecnologiait.com',
    telefone: '(61) 3987-6543',
    endereco: {
      logradouro: 'SCS Quadra 8',
      numero: '50',
      complemento: 'Sala 1201',
      bairro: 'Asa Sul',
      cidade: 'Brasília',
      uf: 'DF',
      cep: '70000-987'
    },
    observacoes: 'Empresa de tecnologia especializada em automação industrial.',
    status: 'ativo',
    dadosPJ: {
      razaoSocial: 'Tecnologia e Automação IT Ltda',
      nomeFantasia: 'TechIT',
      cnpj: '55.666.777/0001-88',
      inscricaoEstadual: '555.666.777.888',
      nomeContato: 'Fernanda Lima Souza',
      tiposMateriais: ['Software de Automação', 'Sistemas SCADA', 'PLCs', 'Interfaces HMI']
    },
    ultimoContato: '2024-03-14',
    avaliacaoQualidade: 5
  },
  {
    id: 8,
    criadoEm: '2024-03-10T13:20:00Z',
    tipo: 'pessoa_fisica',
    email: 'lucia.consultora@email.com',
    telefone: '(62) 9 5432-1098',
    endereco: {
      logradouro: 'Av. Consultoria',
      numero: '654',
      bairro: 'Setor Central',
      cidade: 'Goiânia',
      uf: 'GO',
      cep: '74000-456'
    },
    observacoes: 'Consultora em gestão da qualidade e processos industriais.',
    status: 'ativo',
    dadosPF: {
      nomeCompleto: 'Lúcia Maria dos Santos',
      cpf: '789.123.456-00',
      especialidade: 'Consultoria em Gestão da Qualidade ISO 9001'
    },
    ultimoContato: '2024-03-11',
    avaliacaoQualidade: 5
  },
  {
    id: 9,
    criadoEm: '2024-03-15T10:15:00Z',
    tipo: 'pessoa_juridica',
    email: 'vendas@transporteslogistica.com.br',
    telefone: '(19) 3456-7890',
    endereco: {
      logradouro: 'Rod. dos Transportes',
      numero: 'Km 15',
      bairro: 'Distrito Logístico',
      cidade: 'Campinas',
      uf: 'SP',
      cep: '13000-000'
    },
    observacoes: 'Transportadora especializada em cargas industriais e equipamentos pesados.',
    status: 'suspenso',
    dadosPJ: {
      razaoSocial: 'Transportes e Logística Rápida S.A.',
      nomeFantasia: 'LogRápida',
      cnpj: '77.888.999/0001-22',
      inscricaoEstadual: '777.888.999.000',
      nomeContato: 'Marcos Antônio Silva',
      tiposMateriais: ['Transporte de Equipamentos', 'Logística Industrial', 'Içamento', 'Armazenagem']
    },
    ultimoContato: '2024-02-28',
    avaliacaoQualidade: 3
  },
  {
    id: 10,
    criadoEm: '2024-03-20T16:30:00Z',
    tipo: 'pessoa_fisica',
    email: 'rafael.programador@dev.com',
    telefone: '(27) 9 9876-5432',
    endereco: {
      logradouro: 'Rua da Tecnologia',
      numero: '123',
      bairro: 'Tech Valley',
      cidade: 'Vitória',
      uf: 'ES',
      cep: '29000-123'
    },
    observacoes: 'Desenvolvedor freelancer especializado em sistemas industriais.',
    status: 'ativo',
    dadosPF: {
      nomeCompleto: 'Rafael Costa Pereira',
      cpf: '321.654.987-00',
      especialidade: 'Desenvolvimento de Sistemas Industriais e IoT'
    },
    ultimoContato: '2024-03-18',
    avaliacaoQualidade: 4
  }
];