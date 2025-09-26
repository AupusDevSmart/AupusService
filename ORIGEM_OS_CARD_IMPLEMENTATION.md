# Implementação do Card de Origem da OS

## Resumo

Foi implementado um sistema que exibe diferentes cards baseados na origem da Ordem de Serviço no modo view/edit, substituindo o seletor de origem que só é usado no modo create.

## Componentes Criados

### 1. `OrigemOSCard.tsx`
Componente que renderiza diferentes cards baseado na origem:
- **Anomalia**: Card vermelho mostrando detalhes da anomalia
- **Plano de Manutenção/Tarefas**: Card azul listando as tarefas selecionadas
- **Manual**: Card cinza para OSs criadas manualmente

### 2. Modificações no `form-config.tsx`
- Campo `origem`: Apenas no modo `create`
- Campo `origemCard`: Apenas nos modos `view` e `edit`

## Estrutura de Dados Esperada

Para que o card funcione corretamente, a API deve retornar os seguintes dados no endpoint de detalhes da programação:

### Origem: ANOMALIA
```json
{
  "id": "...",
  "origem": "ANOMALIA",
  "anomalia_id": "123",
  "dados_origem": {
    "anomaliaId": "123",
    "tipo": "ANOMALIA"
  },
  "anomalia": {
    "id": "123",
    "descricao": "Problema no equipamento X",
    "local": "Área de Produção",
    "ativo": "Equipamento 001",
    "prioridade": "ALTA",
    "status": "EM_ANALISE",
    "data": "2025-01-15"
  }
}
```

### Origem: PLANO_MANUTENCAO
```json
{
  "id": "...",
  "origem": "PLANO_MANUTENCAO",
  "plano_manutencao_id": "456",
  "dados_origem": {
    "planoId": "456",
    "tipo": "PLANO_MANUTENCAO",
    "tarefasSelecionadas": ["t1", "t2", "t3"]
  },
  "plano_manutencao": {
    "id": "456",
    "nome": "Manutenção Preventiva Mensal",
    "categoria": "PREVENTIVA"
  },
  "tarefas_programacao": [
    {
      "id": "t1",
      "descricao": "Verificar pressão dos pneus",
      "tag": "TAG-001",
      "tipo": "INSPECAO",
      "criticidade": 3,
      "tempoEstimado": 30,
      "duracaoEstimada": 0.5
    },
    {
      "id": "t2",
      "descricao": "Trocar óleo do motor",
      "tag": "TAG-002",
      "tipo": "MANUTENCAO",
      "criticidade": 4,
      "tempoEstimado": 60,
      "duracaoEstimada": 1.0
    }
  ]
}
```

### Origem: MANUAL
```json
{
  "id": "...",
  "origem": "MANUAL",
  "dados_origem": {
    "tipo": "MANUAL"
  }
}
```

## Funcionamento

1. **Modo Create**: Mostra o `OrigemOSSelector` para escolher a origem
2. **Modo View/Edit**: Mostra o `OrigemOSCard` que renderiza o card apropriado baseado na origem
3. **Dados**: O `getFormDefaultValues` já mapeia os dados necessários da entidade da API

## Benefícios

- ✅ Interface mais clara no modo view/edit
- ✅ Cards visuais distintos para cada tipo de origem
- ✅ Informações relevantes exibidas de forma organizada
- ✅ Não interfere na funcionalidade de criação
- ✅ Implementação modular e reutilizável

## API Requirements

Para funcionar completamente, a API deve retornar:

1. **Campos obrigatórios**: `origem`, `dados_origem`
2. **Para anomalias**: objeto `anomalia` expandido
3. **Para planos**: objeto `plano_manutencao` e array `tarefas_programacao` expandidos
4. **Relacionamentos**: IDs dos relacionamentos (`anomalia_id`, `plano_manutencao_id`)