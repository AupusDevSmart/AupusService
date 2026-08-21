# Selecao de origem da OS

A origem de uma ordem de servico e escolhida **um passo por vez**, pelo
`AssistentePassos` (`components/common/AssistentePassos.tsx`).

```
origem-selector/
  index.ts               barrel
  types.ts               tipos compartilhados
  ListaSelecionavel.tsx  lista com busca, usada nos tres tipos
  TarefasSelector.tsx    selecao multipla de tarefas de um plano
```

## Por que mudou

O formato anterior empilhava tres blocos no mesmo scroll do sheet — tipo, busca
e lista — e tinha um componente por tipo de origem (`AnomaliaSelector`,
`SolicitacaoSelector`, `PlanoSelector`), praticamente identicos entre si.

Dois problemas concretos:

1. **A rolagem encadeava.** As listas usavam `overflow-y-auto` sem
   `overscroll-behavior`. Chegar ao fim de uma delas continuava rolando o modal
   atras e jogava a pessoa para o pe do formulario. Hoje toda lista aninhada
   deste fluxo leva `overscroll-contain` — se voce adicionar outra, leve tambem.

2. **Tres copias da mesma lista.** Divergiam no espacamento e no que a busca
   alcancava, e a terceira sempre esquecia um campo. Viraram
   `ListaSelecionavel`, que recebe `OpcaoDaLista[]` e filtra por tudo que a
   linha mostra.

`PlantaSelector` e `UnidadeSelector` sairam porque planta e unidade nao sao mais
perguntadas: elas vem da propria anomalia ou solicitacao escolhida. O
`TipoOrigemSelector` virou o primeiro passo do assistente, e o
`HierarchyBreadcrumb`, a trilha dele.

## Fluxos

| Tipo | Passos |
|---|---|
| Anomalia | tipo -> anomalia |
| Solicitacao | tipo -> solicitacao |
| Plano | tipo -> plano -> tarefas |

Completa a escolha, o assistente sai e fica um resumo com botao **Trocar** —
quem esta preenchendo o resto do formulario precisa ver o que escolheu, nao a
maquina de escolher.

## Armadilha do `PlanoDisponivel`

O tipo em `types.ts` ja divergiu do que a API devolve: declarava `descricao`,
`tipo`, `frequencia` e `equipamentoNome`, campos que `GET /planos-manutencao`
nao manda. O seletor antigo recebia a lista com `as any`, entao o typecheck
calava e os cards mostravam linhas em branco.

Hoje o tipo espelha o que o `useOrigemDados` monta. **Nao reintroduza `as any`
ao passar essas listas** — foi o `as any` que escondeu o bug por meses.

## Instrucoes da origem

`components/InstrucoesDaOrigem.tsx` mostra as instrucoes vinculadas, em secao
propria abaixo. Nenhuma origem precisou de endpoint novo:

| Origem | De onde vem |
|---|---|
| Anomalia | `anomalias_instrucoes`, que o `GET /anomalias/:id` ja inclui |
| Solicitacao | `instrucoes`, que o `GET /solicitacoes-servico/:id` ja traz |
| Plano | `tarefa.instrucao`, uma por tarefa escolhida |
