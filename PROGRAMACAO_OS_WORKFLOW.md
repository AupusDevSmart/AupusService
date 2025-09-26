# Formulário de Programação OS - Workflow por Status

## 📋 Resumo das Implementações

### ✅ Funcionalidades Implementadas

1. **Campos Condicionais Baseados no Status**
   - Campos são desabilitados automaticamente quando a programação não está em `RASCUNHO` ou `PENDENTE`
   - Novos campos específicos para cada transição de status

2. **Modal de Workflow Específico**
   - Modal dedicado para ações de workflow com campos específicos
   - Validação automática de campos obrigatórios
   - Interface otimizada para cada tipo de ação

3. **Integração com BaseForm e BaseModal**
   - Suporte para função `computeDisabled` nos campos
   - Campos condicionais baseados no status da entidade
   - Melhoria na tipagem TypeScript

## 🔄 Fluxo de Status e Campos

### 📝 CRIAR/RASCUNHO → PENDENTE

**Campos Obrigatórios:**
- ✅ `descricao` - Descrição da programação
- ✅ `local` - Local da execução
- ✅ `ativo` - Ativo/equipamento
- ✅ `condicoes` - Condição do equipamento (FUNCIONANDO, PARADO)
- ✅ `tipo` - Tipo da OS (PREVENTIVA, CORRETIVA, PREDITIVA, INSPECAO, VISITA_TECNICA)
- ✅ `prioridade` - Prioridade (BAIXA, MEDIA, ALTA, URGENTE)
- ✅ `origem` - Origem (MANUAL, ANOMALIA, TAREFA, PLANO_MANUTENCAO)
- ✅ `tempo_estimado` - Tempo estimado em horas
- ✅ `duracao_estimada` - Duração estimada em horas

**Campos Opcionais:**
- ✅ `planta_id`, `equipamento_id`, `anomalia_id`, `plano_manutencao_id`
- ✅ `tarefas_ids[]` - Array de IDs de tarefas
- ✅ `data_previsao_inicio`, `data_previsao_fim`
- ✅ `data_hora_programada`, `responsavel`, `responsavel_id`, `time_equipe`
- ✅ `necessita_veiculo`, `assentos_necessarios`, `carga_necessaria`, `observacoes_veiculo`
- ✅ `materiais[]`, `ferramentas[]`, `tecnicos[]`
- ✅ `orcamento_previsto`
- ✅ `observacoes`, `observacoes_programacao`, `justificativa`

---

### 🔍 PENDENTE → EM_ANALISE

**Modal Workflow - Campos:**
- ✅ `observacoes_analise` (opcional) - Observações da análise

**Campos Automaticamente Preenchidos:**
- ✅ `analisado_por_id` - ID do usuário que analisou
- ✅ `data_analise` - Data/hora atual

**Implementação:**
- ✅ Modal específico com formulário simples
- ✅ Função `handleAnalisar()` atualizada
- ✅ Validação automática de status

---

### ✅ EM_ANALISE → APROVADA

**Modal Workflow - Campos:**
- ✅ `observacoes_aprovacao` (opcional) - Observações da aprovação
- ✅ `ajustes_orcamento` (opcional) - Ajustes no orçamento
- ✅ `data_programada_sugerida` (opcional) - Data sugerida (YYYY-MM-DD)
- ✅ `hora_programada_sugerida` (opcional) - Hora sugerida (HH:MM)

**Campos Automaticamente Preenchidos:**
- ✅ `aprovado_por_id` - ID do usuário que aprovou
- ✅ `data_aprovacao` - Data/hora atual
- ✅ `data_hora_programada` - Combinação da data + hora sugeridas (se fornecidas)

**Implementação:**
- ✅ Modal específico com múltiplos campos
- ✅ Função `handleAprovar()` atualizada
- ✅ Mensagem de confirmação sobre geração automática da OS

---

### ❌ EM_ANALISE → REJEITADA

**Modal Workflow - Campos Obrigatórios:**
- ✅ `motivo_rejeicao` - Motivo da rejeição (obrigatório)

**Campos Opcionais:**
- ✅ `sugestoes_melhoria` - Sugestões de melhoria

**Implementação:**
- ✅ Modal específico com validação obrigatória
- ✅ Função `handleRejeitar()` atualizada
- ✅ Validação de campo obrigatório

---

### 🚫 QUALQUER_STATUS → CANCELADA

**Modal Workflow - Campos Obrigatórios:**
- ✅ `motivo_cancelamento` - Motivo do cancelamento (obrigatório)

**Restrições Implementadas:**
- ✅ Não pode cancelar se status = `CANCELADA` ou `APROVADA`
- ✅ Confirmação adicional via modal

**Implementação:**
- ✅ Modal específico com validação
- ✅ Função `handleCancelar()` atualizada
- ✅ Verificação de status antes da ação

---

## 🛠️ Componentes Criados/Modificados

### 1. **WorkflowModal.tsx** (NOVO)
```typescript
// Componente modal dedicado para ações de workflow
interface WorkflowModalProps {
  isOpen: boolean;
  action: 'analisar' | 'aprovar' | 'rejeitar' | 'cancelar' | null;
  programacao: any;
  onClose: () => void;
  onConfirm: (data: any) => void;
  loading?: boolean;
}
```

### 2. **form-config.tsx** (MODIFICADO)
- ✅ Adicionadas funções `computeDisabled` em todos os campos principais
- ✅ Novos campos específicos de workflow com `condition`
- ✅ Novo grupo `workflow` para organizar campos de transição
- ✅ Campos de auditoria expandidos

### 3. **ProgramacaoOSPage.tsx** (MODIFICADO)
- ✅ Integração com `WorkflowModal`
- ✅ Funções de workflow refatoradas (`handleAnalisar`, `handleAprovar`, etc.)
- ✅ Estados para controle do workflow modal
- ✅ Preparação de dados atualizada para snake_case

### 4. **types/base.ts** (MODIFICADO)
- ✅ Adicionada propriedade `computeDisabled` ao tipo `FormField`
- ✅ Melhor tipagem para funções condicionais

### 5. **BaseForm.tsx** (VERIFICADO)
- ✅ Já possui suporte para `computeDisabled`
- ✅ Suporte para campos condicionais via `condition`

---

## 🎯 Campos Sempre Readonly Após Criação

Quando `status !== 'RASCUNHO' && status !== 'PENDENTE'`:

### Campos Básicos:
- ✅ `descricao`, `local`, `ativo`
- ✅ `tipo`, `prioridade`, `condicoes`

### Campos de Planejamento:
- ✅ `tempo_estimado`, `duracao_estimada`
- ✅ `data_previsao_inicio`, `data_previsao_fim`, `orcamento_previsto`

### Campos de Programação:
- ✅ `data_hora_programada`, `responsavel`, `responsavel_id`, `time_equipe`

### Campos de Veículo:
- ✅ `necessita_veiculo`, `assentos_necessarios`, `carga_necessaria`, `observacoes_veiculo`

### Recursos:
- ✅ `materiais`, `ferramentas`, `tecnicos`

### Observações:
- ✅ `observacoes`, `observacoes_programacao`, `justificativa`

---

## 📱 Interface de Usuário

### Resumo para Interface:

1. **Criação (RASCUNHO/PENDENTE):**
   - ✅ Formulário completo editável
   - ✅ Todos os grupos de campos disponíveis

2. **Análise (PENDENTE → EM_ANALISE):**
   - ✅ Modal simplificado com campo de observações
   - ✅ Botão "Analisar" disponível apenas para status PENDENTE

3. **Aprovação (EM_ANALISE → APROVADA):**
   - ✅ Modal com campos de ajustes + data/hora sugerida
   - ✅ Botão "Aprovar" disponível apenas para status EM_ANALISE

4. **Rejeição (EM_ANALISE → REJEITADA):**
   - ✅ Modal com campo obrigatório de motivo + sugestões opcionais
   - ✅ Botão "Rejeitar" disponível apenas para status EM_ANALISE

5. **Cancelamento (QUALQUER_STATUS → CANCELADA):**
   - ✅ Modal com campo obrigatório de motivo
   - ✅ Botão "Cancelar" disponível para todos os status exceto APROVADA e CANCELADA

---

## ✅ Status da Implementação

- ✅ **Campos condicionais** - 100% implementado
- ✅ **Modal de workflow** - 100% implementado
- ✅ **Validações de status** - 100% implementado
- ✅ **Integração com formulários** - 100% implementado
- ✅ **Correções de TypeScript** - 100% implementado
- ✅ **Documentação** - 100% implementado

---

## 🚀 Próximos Passos (Opcional)

1. **Testes Unitários** - Criar testes para os componentes de workflow
2. **Integração com API** - Quando a API estiver disponível, conectar as funções
3. **Notificações** - Implementar sistema de notificações para mudanças de status
4. **Histórico** - Expandir o histórico de mudanças na interface
5. **Permissões** - Implementar controle de permissões por ação

---

## 📝 Notas Técnicas

- Todos os campos seguem o padrão `snake_case` para compatibilidade com a API
- Campos de formulário suportam tanto `snake_case` quanto `camelCase` para compatibilidade
- Modal de workflow é reutilizável e extensível para futuras ações
- Validações são realizadas tanto no frontend quanto no backend (quando disponível)
- Interface otimizada para diferentes tamanhos de tela