// src/features/solicitacoes-servico/config/form-config.tsx
import { FormField } from '@/types/base';
import { PropostaSection } from '../components/PropostaSection';
import { SimpleCascadeSelector } from '../components/SimpleCascadeSelector';
import { AuthService } from '@/services/auth.service';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Render function para o campo de solicitante - mostra o usuário logado como readonly
const SolicitanteRender = ({ value: _value, onChange, disabled: _disabled, mode }: any) => {
  const [userName, setUserName] = useState<string>('Carregando...');
  const [userId, setUserId] = useState<string>('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Evitar múltiplas chamadas
    if (loaded) return;

    // Buscar dados do usuário logado
    AuthService.getCurrentUser()
      .then((user) => {
        setUserName(user.nome || 'Usuário');
        setUserId(user.id || '');
        setLoaded(true);
        // Preencher automaticamente o nome do solicitante (não será enviado para API)
        if (mode === 'create' && onChange) {
          onChange(user.nome || 'Usuário');
        }
      })
      .catch((error) => {
        console.error('Erro ao buscar usuário:', error);
        setUserName('Erro ao carregar usuário');
        setLoaded(true);
      });
  }, []); // Remover dependências para executar apenas uma vez

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground">
        Solicitante
        <span className="text-red-500 ml-1">*</span>
      </Label>
      <Input
        value={userName}
        disabled={true}
        className="bg-gray-50 dark:bg-gray-800 dark:text-gray-200 cursor-not-allowed"
        readOnly
      />
      <input type="hidden" name="solicitante_id" value={userId} />
    </div>
  );
};

export const solicitacoesFormFields: FormField[] = [
  {
    key: 'titulo',
    label: 'Título',
    type: 'text',
    required: true,
    placeholder: 'Digite o título da solicitação',
    colSpan: 2,
  },
  // Localização em cascata
  {
    key: 'localizacao',
    label: '',
    type: 'custom',
    required: false,
    render: SimpleCascadeSelector,
    colSpan: 2,
    excludeFromSubmit: true, // Não enviar este campo para a API
  },
  // Campos hidden para armazenar os valores reais
  {
    key: 'proprietario_id',
    label: '',
    type: 'text',
    required: false,
    hideOnMode: ['create', 'edit', 'view'], // Sempre oculto
  },
  {
    key: 'planta_id',
    label: '',
    type: 'text',
    required: false,
    hideOnMode: ['create', 'edit', 'view'], // Sempre oculto
  },
  {
    key: 'unidade_id',
    label: '',
    type: 'text',
    required: false,
    hideOnMode: ['create', 'edit', 'view'], // Sempre oculto
  },
  {
    key: 'descricao',
    label: 'Descrição',
    type: 'textarea',
    required: true,
    placeholder: 'Descreva detalhadamente a solicitação',
    rows: 4,
    colSpan: 2,
  },
  {
    key: 'tipo',
    label: 'Tipo',
    type: 'select',
    required: true,
    options: [
      { value: 'INSTALACAO', label: 'Instalação' },
      { value: 'MANUTENCAO_PREVENTIVA', label: 'Manutenção Preventiva' },
      { value: 'MANUTENCAO_CORRETIVA', label: 'Manutenção Corretiva' },
      { value: 'INSPECAO', label: 'Inspeção' },
      { value: 'CALIBRACAO', label: 'Calibração' },
      { value: 'MODIFICACAO', label: 'Modificação' },
      { value: 'REMOCAO', label: 'Remoção' },
      { value: 'CONSULTORIA', label: 'Consultoria' },
      { value: 'TREINAMENTO', label: 'Treinamento' },
      { value: 'OUTRO', label: 'Outro' },
    ],
  },
  {
    key: 'prioridade',
    label: 'Prioridade',
    type: 'select',
    options: [
      { value: 'BAIXA', label: 'Baixa' },
      { value: 'MEDIA', label: 'Média' },
      { value: 'ALTA', label: 'Alta' },
      { value: 'URGENTE', label: 'Urgente' },
    ],
  },
  {
    key: 'local',
    label: 'Local',
    type: 'text',
    required: true,
    colSpan: 2,
    placeholder: 'Informe o local',
  },
  // Instrucoes vinculadas
  {
    key: 'instrucoes_ids',
    label: '',
    type: 'custom',
    required: false,
    colSpan: 2,
  } as any,
  // Proposta comercial, depois das instrucoes e antes do solicitante: ela nasce
  // do que a instrucao traz, entao vem logo apos o escopo.
  //
  // excludeFromSubmit porque a proposta nao viaja no payload da solicitacao:
  // ela tem endpoints proprios e grava sozinha, ja com os totais que o
  // servidor calculou. O render vem da pagina (SolicitacoesPage), que e quem
  // tem para onde mandar o rascunho enquanto a solicitacao nao existe.
  {
    key: 'proposta',
    label: '',
    type: 'custom',
    colSpan: 2,
    excludeFromSubmit: true,
  } as any,
  // O solicitante fecha o formulario, sempre — e quem pediu, nao parte do que
  // sera feito.
  {
    key: 'solicitante',
    label: '',
    type: 'custom',
    render: SolicitanteRender,
    colSpan: 2,
    excludeFromSubmit: true,
  },
];
