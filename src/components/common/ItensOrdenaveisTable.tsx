// src/components/common/ItensOrdenaveisTable.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { GripVertical, Plus, Trash2 } from 'lucide-react';

export interface ColunaItemOrdenavel<T> {
  key: string;
  header: string;
  /** Classe de largura da coluna (ex: 'w-28'). Sem valor, a coluna estica. */
  width?: string;
  align?: 'left' | 'center';
  render: (item: T, index: number) => React.ReactNode;
}

export interface ResumoItem {
  icone: React.ReactNode;
  label: string;
  valor: React.ReactNode;
}

interface ItensOrdenaveisTableProps<T> {
  itens: T[];
  colunas: Array<ColunaItemOrdenavel<T>>;
  onReordenar: (origem: number, destino: number) => void;
  onRemover: (index: number) => void;
  onAdicionar: () => void;
  textoAdicionar: string;
  /**
   * Quando informado, a tabela renderiza o proprio cabecalho com o titulo e o
   * botao de adicionar NA MESMA LINHA. Sem isso o titulo vem do grupo do
   * BaseForm e o botao fica numa linha so para ele, logo abaixo.
   */
  titulo?: string;
  resumo?: ResumoItem[];
  disabled?: boolean;
}

export function ItensOrdenaveisTable<T>({
  itens,
  colunas,
  onReordenar,
  onRemover,
  onAdicionar,
  textoAdicionar,
  titulo,
  resumo,
  disabled = false
}: ItensOrdenaveisTableProps<T>) {
  const [arrastando, setArrastando] = React.useState<number | null>(null);
  const [alvo, setAlvo] = React.useState<number | null>(null);
  // O draggable fica desligado até o mouse descer sobre a alça: com a linha
  // inteira arrastável não dá para selecionar texto dentro dos inputs.
  const [alcaAtiva, setAlcaAtiva] = React.useState(false);

  const podeEditar = !disabled;
  const totalColunas = colunas.length + (podeEditar ? 2 : 1);

  const limparArraste = () => {
    setArrastando(null);
    setAlvo(null);
    setAlcaAtiva(false);
  };

  const handleDrop = (destino: number) => {
    if (arrastando !== null && arrastando !== destino) {
      onReordenar(arrastando, destino);
    }
    limparArraste();
  };

  return (
    <div className="space-y-2">
      {(podeEditar || titulo) && (
        <div className={titulo ? 'flex items-center justify-between' : 'flex justify-end'}>
          {titulo && (
            <h3 className="text-sm font-medium text-foreground">
              {titulo}
              {itens.length > 0 && (
                <span className="ml-1.5 text-xs text-muted-foreground">({itens.length})</span>
              )}
            </h3>
          )}
          {/* Sem moldura: dentro de uma secao do formulario o botao e acao
              secundaria, e a borda competia com os campos. So o icone: o
              title/aria-label carrega o significado sem ocupar largura. */}
          {podeEditar && (
            <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onAdicionar}
            className="h-8 w-8"
            title={textoAdicionar}
            aria-label={textoAdicionar}
          >
            <Plus className="h-4 w-4" />
          </Button>
          )}
        </div>
      )}

      {/* Lista vazia nao renderiza nada: a caixa tracejada com "nenhum item"
          ocupava altura para dizer o obvio, e num sheet com varias secoes isso
          vira um vazio grande no meio do formulario. O botao de adicionar ja
          comunica que da para incluir. */}
      {itens.length === 0 ? null : (
        <div className="rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              {/* Sem borda nenhuma. Dentro de um formulario ja cheio de campos
                  emoldurados, a tabela com moldura propria virava uma caixa
                  dentro da caixa. O fundo do cabecalho e do rodape delimita o
                  corpo, e o hover diz em que linha se esta. */}
              <thead>
                <tr className="bg-muted/50">
                  {podeEditar && <th className="w-8" />}
                  <th className="w-10 px-2 py-2 text-center text-xs font-medium text-muted-foreground">#</th>
                  {colunas.map((coluna) => (
                    <th
                      key={coluna.key}
                      className={`px-2 py-2 text-xs font-medium text-muted-foreground ${
                        coluna.align === 'center' ? 'text-center' : 'text-left'
                      } ${coluna.width || ''}`}
                    >
                      {coluna.header}
                    </th>
                  ))}
                  {podeEditar && (
                    <th className="w-16 px-2 py-2 text-center text-xs font-medium text-muted-foreground">
                      Ações
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {itens.map((item, index) => (
                  <tr
                    key={index}
                    draggable={alcaAtiva && podeEditar}
                    onDragStart={(event) => {
                      setArrastando(index);
                      event.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragOver={(event) => {
                      if (arrastando === null) return;
                      event.preventDefault();
                      setAlvo(index);
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      handleDrop(index);
                    }}
                    onDragEnd={limparArraste}
                    className={`transition-colors ${
                      arrastando === index ? 'opacity-40' : ''
                    } ${alvo === index && arrastando !== index ? 'bg-muted' : 'hover:bg-muted/30'}`}
                  >
                    {podeEditar && (
                      <td className="px-1 align-middle">
                        <span
                          onMouseDown={() => setAlcaAtiva(true)}
                          onMouseUp={() => setAlcaAtiva(false)}
                          className="flex cursor-grab justify-center text-muted-foreground/60 hover:text-muted-foreground active:cursor-grabbing"
                          title="Arraste para reordenar"
                        >
                          <GripVertical className="h-4 w-4" />
                        </span>
                      </td>
                    )}
                    <td className="px-2 py-1.5 text-center text-xs text-muted-foreground">{index + 1}</td>
                    {colunas.map((coluna) => (
                      <td
                        key={coluna.key}
                        className={`px-2 py-1.5 align-middle ${coluna.align === 'center' ? 'text-center' : ''}`}
                      >
                        {coluna.render(item, index)}
                      </td>
                    ))}
                    {podeEditar && (
                      <td className="px-2 py-1.5 text-center align-middle">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => onRemover(index)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          title="Remover"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              {resumo && resumo.length > 0 && (
                <tfoot>
                  <tr className="bg-muted/30">
                    <td colSpan={totalColunas} className="px-3 py-2">
                      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
                        {resumo.map((item) => (
                          <span
                            key={item.label}
                            className="flex items-center gap-1.5 text-xs text-muted-foreground"
                          >
                            <span className="text-muted-foreground/60">{item.icone}</span>
                            {item.label}: <span className="font-medium text-foreground">{item.valor}</span>
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
