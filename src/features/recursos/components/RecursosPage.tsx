// src/features/recursos/components/RecursosPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { Layout } from '@/components/common/Layout';
import { TitleCard } from '@/components/common/title-card';
import { BaseTable, BaseFilters } from '@/core';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, Package, Trash2 } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';
import { useLinhasPorPagina, LINHAS_POR_PAGINA_PADRAO } from '@/store/usePreferenciasDeTabela';
import { ROTULO_PLURAL_DA_CATEGORIA, type CategoriaRecurso, type PedidoDeExclusaoEmLote, type QueryRecursosParams, type RecursoApiResponse } from '@/services/recursos.services';

/** Os filtros como a tela guarda: a categoria vazia (ou 'all') é "Todos". */
type FiltrosDaTela = Omit<QueryRecursosParams, 'categoria'> & { categoria?: CategoriaRecurso | 'all' | '' };
import { recursosTableColumns } from '../config/table-config';
import { recursosFilterConfig } from '../config/filter-config';
import { useRecursos } from '../hooks/useRecursos';
import { RecursoModal } from './RecursoModal';
import { PlanilhaDoCadastro } from '@/components/common/PlanilhaDoCadastro';
import { exportarRecursos, lerRecursos } from '../utils/planilha';
import { ExcluirEmLoteDialog } from './ExcluirEmLoteDialog';

const FILTROS_INICIAIS: QueryRecursosParams = { search: '', page: 1, limit: LINHAS_POR_PAGINA_PADRAO };

/**
 * Catálogo de recursos: o que se usa para executar uma instrução, com o custo
 * médio que alimenta o orçamento.
 */
export function RecursosPage() {
  const hasPermission = useUserStore((s) => s.hasPermission);
  const podeGerenciar = hasPermission('recursos.manage');

  const [linhasPorPagina, setLinhasPorPagina] = useLinhasPorPagina('recursos');
  const [filtrosBrutos, setFiltrosBrutos] = useState<FiltrosDaTela>(() => ({
    ...FILTROS_INICIAIS,
    limit: linhasPorPagina,
  }));

  // A busca vai à API 350 ms depois da última tecla, como no AupusProject: antes
  // cada letra era uma requisição
  const [buscaAplicada, setBuscaAplicada] = useState(filtrosBrutos.search ?? '');
  useEffect(() => {
    const espera = setTimeout(() => setBuscaAplicada(filtrosBrutos.search ?? ''), 350);
    return () => clearTimeout(espera);
  }, [filtrosBrutos.search]);

  // "Todos" (vazio, ou o "all" de antes) não vai para a API: viraria uma
  // categoria inexistente e a lista voltaria vazia.
  const filtros = useMemo<QueryRecursosParams>(() => {
    const { categoria, situacao, page, limit } = filtrosBrutos;
    return {
      ...(categoria && categoria !== 'all' ? { categoria } : {}),
      ...(situacao === 'ATIVO' || situacao === 'INATIVO' ? { situacao } : {}),
      ...(buscaAplicada ? { search: buscaAplicada } : {}),
      page: page || 1,
      limit: limit || LINHAS_POR_PAGINA_PADRAO,
    };
  }, [filtrosBrutos, buscaAplicada]);

  const { recursos, paginacao, carregando, salvando, salvar, remover, recarregar } = useRecursos(filtros);

  const [modal, setModal] = useState<{
    aberto: boolean;
    modo: 'create' | 'edit';
    recurso: RecursoApiResponse | null;
  }>({ aberto: false, modo: 'create', recurso: null });

  const [aRemover, setARemover] = useState<RecursoApiResponse | null>(null);

  // Excluir vários (30/out/2026): os marcados na tabela, ou todos os inativos do filtro
  const [marcados, setMarcados] = useState<string[]>([]);
  const [emLote, setEmLote] = useState<{ pedido: PedidoDeExclusaoEmLote; descricao: string } | null>(null);
  // A busca vale 350 ms depois da última tecla: até lá, o botão espera (sairia sem a busca)
  const buscaPendente = (filtrosBrutos.search ?? '') !== buscaAplicada;
  const excluirInativos = () => {
    const categoria = filtros.categoria;
    const busca = filtros.search?.trim();
    const doFiltro = [categoria && `de ${ROTULO_PLURAL_DA_CATEGORIA[categoria]}`, busca && `com "${busca}" no nome`].filter(Boolean).join(' ');
    setEmLote({
      pedido: { inativos: true, ...(categoria && { categoria }), ...(busca && { search: busca }) },
      descricao: `todos os recursos inativos${doFiltro ? ` ${doFiltro}` : ''}, em todas as páginas`,
    });
  };

  // Trocar o filtro desmarca: o marcado que sumiu da tela não sai sem a pessoa ver
  const mudarFiltro = (novos: Partial<FiltrosDaTela>) => {
    setFiltrosBrutos((atuais) => ({ ...atuais, ...novos, page: 1 }));
    setMarcados([]);
  };

  // Volta para a pagina 1: na pagina 4 de 10 linhas, trocar para 100 pediria
  // um trecho que nao existe.
  const mudarLinhas = (limit: number) => {
    setLinhasPorPagina(limit);
    setFiltrosBrutos((atuais) => ({ ...atuais, limit, page: 1 }));
  };

  const mudarPagina = (page: number) => {
    setFiltrosBrutos((atuais) => ({ ...atuais, page }));
  };

  return (
    <Layout>
      <Layout.Main>
        <div className="flex flex-col w-full sm:h-full">
          <TitleCard
            title="Recursos"
            description="Mão de obra, materiais, instrumentos, veículos, terceiros e despesas de campo usados nas instruções, com o custo de cada um"
          />

          <div className="flex flex-col lg:flex-row gap-3 md:gap-4 mb-4 md:mb-6 lg:items-start">
            <div className="flex-1 min-w-0">
              <BaseFilters
                filters={filtrosBrutos}
                config={recursosFilterConfig}
                onFilterChange={mudarFiltro}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
              {podeGerenciar && (
                <button
                  onClick={excluirInativos}
                  disabled={buscaPendente}
                  className="btn-minimal-outline w-full lg:w-auto whitespace-nowrap disabled:opacity-50"
                  title="Exclui de uma vez todos os inativos da categoria e da busca escolhidas, em todas as páginas (o que está em uso fica)"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir inativos
                </button>
              )}
              <PlanilhaDoCadastro
                cadastro="recursos"
                titulo="Recursos"
                exportar={() => exportarRecursos({ categoria: filtros.categoria, search: filtros.search })}
                ler={lerRecursos}
                aoImportar={recarregar}
                podeImportar={podeGerenciar}
              />
              {podeGerenciar && (
                <button
                  onClick={() => setModal({ aberto: true, modo: 'create', recurso: null })}
                  className="btn-minimal-primary w-full lg:w-auto whitespace-nowrap"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Novo Recurso</span>
                  <span className="sm:hidden">Novo</span>
                </button>
              )}
            </div>
          </div>

          {marcados.length > 0 && (
            <div className="mb-2 flex flex-wrap items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm">
              <span className="font-medium">
                {marcados.length} {marcados.length === 1 ? 'marcado' : 'marcados'}
              </span>
              <span className="flex-1" />
              <Button type="button" variant="ghost" size="sm" className="h-8" onClick={() => setMarcados([])}>
                Desmarcar
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="h-8"
                onClick={() => setEmLote({ pedido: { ids: marcados }, descricao: `${marcados.length === 1 ? 'o recurso marcado' : `os ${marcados.length} recursos marcados`}` })}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Excluir marcados
              </Button>
            </div>
          )}

          <div className="sm:flex-1 sm:min-h-0">
            <BaseTable
              data={recursos}
              columns={recursosTableColumns}
              pagination={paginacao}
              loading={carregando}
              onPageChange={mudarPagina}
              onLimitChange={mudarLinhas}
              onEdit={
                podeGerenciar
                  ? (recurso) => setModal({ aberto: true, modo: 'edit', recurso })
                  : undefined
              }
              onDelete={podeGerenciar ? (recurso) => setARemover(recurso) : undefined}
              {...(podeGerenciar && { selecionados: marcados, onSelecionadosChange: setMarcados })}
              emptyMessage={
                filtros.situacao === 'INATIVO' ? 'Nenhum recurso inativo.' : filtros.categoria || filtros.search || filtros.situacao ? 'Nenhum recurso com esse filtro.' : 'Nenhum recurso cadastrado.'
              }
              emptyIcon={<Package className="h-8 w-8 text-muted-foreground/50" />}
            />
          </div>
        </div>

        <RecursoModal
          isOpen={modal.aberto}
          mode={modal.modo}
          recurso={modal.recurso}
          salvando={salvando}
          onClose={() => setModal({ aberto: false, modo: 'create', recurso: null })}
          onSubmit={salvar}
        />

        <ExcluirEmLoteDialog
          pedido={emLote?.pedido ?? null}
          descricao={emLote?.descricao ?? ''}
          onClose={() => setEmLote(null)}
          onExcluidos={() => {
            setMarcados([]);
            void recarregar();
          }}
        />

        <Dialog open={!!aRemover} onOpenChange={(aberto: boolean) => !aberto && setARemover(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Remover recurso</DialogTitle>
              <DialogDescription>
                Remover "{aRemover?.nome}"? Se ele estiver em uso em alguma instrução, a
                remoção será recusada — nesse caso, desative-o em vez de remover.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setARemover(null)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (aRemover) await remover(aRemover);
                  setARemover(null);
                }}
              >
                Remover
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Layout.Main>
    </Layout>
  );
}
