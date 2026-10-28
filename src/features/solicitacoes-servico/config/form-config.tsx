// src/features/solicitacoes-servico/config/form-config.tsx
import { FormField, FormFieldProps } from '@/types/base';
import type { SolicitacaoServico } from '../types';
import { SimpleCascadeSelector } from '../components/SimpleCascadeSelector';
import { AuthService } from '@/services/auth.service';
import { useUserStore } from '@/store/useUserStore';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * O solicitante, sempre em leitura.
 *
 * No CADASTRO é quem está logado — a pessoa está registrando agora. Em edição e
 * visualização é quem REGISTROU, lido do próprio registro.
 *
 * Antes o campo buscava o usuário logado nos três modos, então abrir uma
 * solicitação de outra pessoa mostrava o seu nome no lugar do dela: a tabela
 * dizia uma coisa e o sheet dizia outra sobre o mesmo registro.
 */
const SolicitanteRender = ({ value, onChange, mode, entity }: FormFieldProps & { entity?: SolicitacaoServico | null }) => {
  const registrado = entity?.solicitante_nome || (typeof value === 'string' ? value : '');
  const cadastrando = mode === 'create';

  const [logado, setLogado] = useState('Carregando...');
  const [usuarioId, setUsuarioId] = useState('');

  useEffect(() => {
    // Só o cadastro precisa saber quem está logado. Nos outros modos o nome
    // vem do registro, e buscar o usuário seria trabalho para descartar.
    if (!cadastrando) return;

    let cancelado = false;

    AuthService.getCurrentUser()
      .then((user) => {
        if (cancelado) return;
        const nome = user.nome || 'Usuário';
        setLogado(nome);
        setUsuarioId(user.id || '');
        onChange?.(nome);
      })
      .catch(() => {
        if (!cancelado) setLogado('Erro ao carregar usuário');
      });

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cadastrando]);

  const exibido = cadastrando ? logado : registrado || '—';

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground">
        Solicitante
        {cadastrando && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input value={exibido} disabled readOnly className="cursor-not-allowed" />
      {cadastrando && <input type="hidden" name="solicitante_id" value={usuarioId} />}
    </div>
  );
};

/** Os papéis que veem só as próprias plantas (a regra do escopo da API) */
const temEscopoPorPlanta = () => ['proprietario', 'operador'].includes(useUserStore.getState().getUserRole() ?? '');

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
  // Planta e instalação são opcionais: muita solicitação não vira OS, e criar
  // usuário, planta e instalação para cada uma era trabalho jogado fora. Sem
  // planta, quem pediu fica aqui (vai na lista e no PDF da proposta); a planta e
  // a instalação se escolhem ao programar. Com planta, o cliente é o dela.
  {
    key: 'cliente_nome',
    label: 'Cliente',
    type: 'text',
    required: false,
    colSpan: 2,
    placeholder: 'Sem planta cadastrada: o nome de quem pediu',
    // Só a equipe cadastra sem planta: quem tem escopo por planta (cliente, técnico) escolhe a dele
    condition: (_entidade, dados) => !dados?.planta_id && !temEscopoPorPlanta(),
  },
  {
    key: 'descricao',
    label: 'Descrição',
    type: 'textarea',
    required: true,
    placeholder: 'Descreva detalhadamente a solicitação',
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
    // Junto da prioridade: sao a mesma pergunta vista de dois angulos — "quao
    // urgente" e "ate quando". Longe uma da outra, da para marcar URGENTE e
    // nao dar data nenhuma.
    //
    // Grava em `data_necessidade`, coluna que ja existia e atravessava o DTO,
    // mas viajava sempre vazia porque nao havia campo que a preenchesse: 0 de
    // 25 solicitacoes tinham valor.
    key: 'data_necessidade',
    label: 'Precisa até',
    type: 'datetime-local',
    required: false,
  },
  {
    key: 'local',
    label: 'Local',
    type: 'text',
    required: false,
    colSpan: 2,
    placeholder: 'Opcional — onde o serviço será feito',
  },
  // Instrucoes vinculadas
  {
    key: 'instrucoes_ids',
    label: '',
    type: 'custom',
    required: false,
    colSpan: 2,
    // Lista desde o começo: o BaseModal semeia o custom com '', e o "" ia para a API (400)
    defaultValue: [],
  },
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
  },
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
