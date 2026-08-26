// src/features/recursos/components/RecursosPage.tsx
import { useMemo, useState } from 'react';
import { Layout } from '@/components/common/Layout';
import { TitleCard } from '@/components/common/title-card';
import { BaseTable, BaseFilters } from '@aupus/shared-pages';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, Package } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';
import type { QueryRecursosParams, RecursoApiResponse } from '@/services/recursos.services';
import { recursosTableColumns } from '../config/table-config';
import { recursosFilterConfig } from '../config/filter-config';
import { useRecursos } from '../hooks/useRecursos';
import { RecursoModal } from './RecursoModal';

const FILTROS_INICIAIS: QueryRecursosParams = { search: '', page: 1, limit: 10 };

/**
 * Catálogo de recursos: o que se usa para executar uma instrução, com o custo
 * médio que alimenta o orçamento.
 */
export function RecursosPage() {
  const { isAdmin } = useUserStore();

  const [filtrosBrutos, setFiltrosBrutos] = useState<Record<string, any>>(FILTROS_INICIAIS);

  // "all" é como o BaseFilters representa "sem filtro"; mandar isso para a API
  // viraria uma categoria inexistente e a lista voltaria vazia.
  const filtros = useMemo<QueryRecursosParams>(() => {
    const { categoria, search, page, limit } = filtrosBrutos;
    return {
      ...(categoria && categoria !== 'all' ? { categoria } : {}),
      ...(search ? { search } : {}),
      page: page || 1,
      limit: limit || 10,
    };
  }, [filtrosBrutos]);

  const { recursos, paginacao, carregando, salvando, salvar, remover } = useRecursos(filtros);

  const [modal, setModal] = useState<{
    aberto: boolean;
    modo: 'create' | 'edit';
    recurso: RecursoApiResponse | null;
  }>({ aberto: false, modo: 'create', recurso: null });

  const [aRemover, setARemover] = useState<RecursoApiResponse | null>(null);

  const mudarFiltro = (novos: Record<string, any>) => {
    setFiltrosBrutos((atuais) => ({ ...atuais, ...novos, page: 1 }));
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
            description="Peças, materiais, ferramentas, técnicos e viaturas usados nas instruções, com o custo médio de cada um"
          />

          <div className="flex flex-col lg:flex-row gap-3 md:gap-4 mb-4 md:mb-6 lg:items-start">
            <div className="flex-1 min-w-0">
              <BaseFilters
                filters={filtrosBrutos}
                config={recursosFilterConfig}
                onFilterChange={mudarFiltro}
              />
            </div>

            {isAdmin() && (
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

          <div className="sm:flex-1 sm:min-h-0">
            <BaseTable
              data={recursos}
              columns={recursosTableColumns}
              pagination={paginacao}
              loading={carregando}
              onPageChange={mudarPagina}
              onEdit={
                isAdmin()
                  ? (recurso) => setModal({ aberto: true, modo: 'edit', recurso })
                  : undefined
              }
              onDelete={isAdmin() ? (recurso) => setARemover(recurso) : undefined}
              emptyMessage="Nenhum recurso cadastrado."
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
