// src/core/features/equipamentos/components/ComponentesUARExpandedRow.tsx
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Copy, Eye, Pencil, Share2, Trash2, Unlink } from 'lucide-react';
import type { Equipamento } from '@/core/features/equipamentos/types';
import { statusDoEquipamento } from '@/core/features/equipamentos/utils/status-do-equipamento';
import { rotuloDaCriticidade } from '@/core/features/equipamentos/config/criticidade';
import { EquipamentoAvatar } from './EquipamentoAvatar';

/**
 * Componentes (UAR) de um UC, dentro da linha expandida da tabela de equipamentos.
 *
 * Mesmo desenho do `InstalacoesExpandedRow` (instalacoes de uma planta): legenda
 * das colunas, lista com divisoria e os botoes de icone a direita. APRESENTACIONAL
 * de proposito — a pagina e dona dos dados, dos sheets e do dialogo de
 * compartilhamento, porque sheet dentro de <TableCell> abre vazio.
 */

interface ComponentesUARExpandedRowProps {
  componentes: Equipamento[];
  /** Total no servidor; maior que a lista quando o UC passa do teto da linha. */
  total?: number;
  carregando?: boolean;
  falhou?: boolean;
  onTentarNovamente?: () => void;
  /** Esconde editar, duplicar e excluir. */
  somenteLeitura?: boolean;
  onVisualizar: (componente: Equipamento) => void;
  onEditar: (componente: Equipamento) => void;
  onDuplicar?: (componente: Equipamento) => void;
  onExcluir?: (componente: Equipamento) => void;
  estaCompartilhado?: (componente: Equipamento) => boolean;
  onCompartilhar?: (componente: Equipamento) => void;
  onPararDeCompartilhar?: (componente: Equipamento) => void;
}

/**
 * Recuo da lista para dentro da linha do UC: o nome do UC comeca depois da
 * celula do chevron (w-10) mais o px-3 da celula, e pl-16 poe o componente
 * adentro dele — filho, nao irmao. O recuo mora todo aqui, nao nas linhas.
 */
const RECUO = 'pl-16 pr-4';

export function ComponentesUARExpandedRow({
  componentes,
  total,
  carregando = false,
  falhou = false,
  onTentarNovamente,
  somenteLeitura = false,
  onVisualizar,
  onEditar,
  onDuplicar,
  onExcluir,
  estaCompartilhado,
  onCompartilhar,
  onPararDeCompartilhar,
}: ComponentesUARExpandedRowProps) {
  if (carregando) {
    return (
      <div className={`${RECUO} py-3 border-t`}>
        <p className="py-2 text-sm text-muted-foreground">Carregando componentes...</p>
      </div>
    );
  }

  // Nunca "vazio": a lista que falhou e outra coisa que a lista sem componentes
  if (falhou) {
    return (
      <div className={`${RECUO} py-3 border-t`}>
        <p className="py-2 text-sm text-muted-foreground">
          Não foi possível carregar os componentes.
          {onTentarNovamente && (
            <button
              type="button"
              onClick={onTentarNovamente}
              className="ml-2 text-foreground underline underline-offset-2 hover:no-underline"
            >
              Tentar novamente
            </button>
          )}
        </p>
      </div>
    );
  }

  if (componentes.length === 0) {
    return (
      <div className={`${RECUO} py-3 border-t`}>
        <p className="py-2 text-sm text-muted-foreground">Nenhum componente neste equipamento.</p>
      </div>
    );
  }

  const compartilhavel = !somenteLeitura && onCompartilhar && onPararDeCompartilhar;

  return (
    <div className={`${RECUO} py-3 border-t`}>
      {/* Larguras e visibilidade iguais as das celulas: a legenda cai sobre o dado
          que nomeia, inclusive quando uma coluna some no celular. A coluna de
          acoes nao tem titulo — os icones ja dizem o que fazem. */}
      <div className="flex items-center gap-3 pb-1.5 text-[11px] uppercase tracking-wide text-muted-foreground/70">
        <div className="min-w-0 flex-1">Componente</div>
        <div className="hidden md:block w-28 flex-shrink-0">TAG</div>
        <div className="hidden md:block w-28 flex-shrink-0">Criticidade</div>
        <div className="hidden lg:block w-20 flex-shrink-0">Status</div>
        <div className="hidden lg:block w-36 flex-shrink-0">Fabricante</div>
        <div className="w-40 flex-shrink-0" />
      </div>

      <div className="divide-y">
        {componentes.map((componente) => {
          const status = statusDoEquipamento(componente.status);
          return (
            <div key={componente.id} className="flex items-center gap-3 py-2">
              <div className="min-w-0 flex-1 flex items-center gap-2">
                <EquipamentoAvatar
                  fotoUrl={componente.fotoUrl}
                  iconeSvg={componente.tipoEquipamentoObj?.iconeSvg}
                  alt={componente.nome}
                  size={24}
                />
                <span className="text-sm text-foreground truncate block" title={componente.nome}>
                  {componente.nome}
                </span>
              </div>

              <div className="hidden md:block w-28 flex-shrink-0 text-xs text-muted-foreground truncate">
                {componente.tag || '-'}
              </div>

              <div className="hidden md:block w-28 flex-shrink-0">
                <Badge variant="outline" className="text-xs whitespace-nowrap">
                  {rotuloDaCriticidade(componente.criticidade)}
                </Badge>
              </div>

              <div className="hidden lg:block w-20 flex-shrink-0">
                <Badge
                  variant="outline"
                  className={`text-xs ${status === 'Ativo' ? 'border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400' : 'border-red-300 text-red-700 dark:border-red-700 dark:text-red-400'}`}
                >
                  {status}
                </Badge>
              </div>

              <div className="hidden lg:block w-36 flex-shrink-0 text-xs text-muted-foreground truncate" title={componente.fabricante}>
                {componente.fabricante || '-'}
              </div>

              {/* Largura fixa e alinhado a direita: ela precisa caber o caso cheio
                  (cinco botoes), senao a coluna desalinha da legenda quando
                  sobram menos. */}
              <div className="flex w-40 items-center justify-end gap-0.5 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onVisualizar(componente)}
                  title="Visualizar"
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
                {!somenteLeitura && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onEditar(componente)}
                    title="Editar"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                )}
                {!somenteLeitura && onDuplicar && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onDuplicar(componente)}
                    title="Duplicar"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                )}
                {compartilhavel &&
                  (estaCompartilhado?.(componente) ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onPararDeCompartilhar(componente)}
                      title="Parar de compartilhar"
                    >
                      <Unlink className="h-3.5 w-3.5" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onCompartilhar(componente)}
                      title="Compartilhar com o outro produto"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                    </Button>
                  ))}
                {!somenteLeitura && onExcluir && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onExcluir(componente)}
                    title="Excluir"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {typeof total === 'number' && total > componentes.length && (
        <p className="pt-2 text-xs text-muted-foreground">
          Mostrando {componentes.length} de {total} componentes. Abra o equipamento para ver todos.
        </p>
      )}
    </div>
  );
}
