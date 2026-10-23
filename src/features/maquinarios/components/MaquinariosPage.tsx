// src/features/maquinarios/components/MaquinariosPage.tsx
import { useMemo, useState } from 'react';
import { Layout } from '@/components/common/Layout';
import { TitleCard } from '@/components/common/title-card';
import { BaseTable, BaseFilters } from '@/core';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, Construction } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';
import { useLinhasPorPagina, LINHAS_POR_PAGINA_PADRAO } from '@/store/usePreferenciasDeTabela';
import { PlanilhaDoCadastro } from '@/components/common/PlanilhaDoCadastro';
import type { MaquinarioApiResponse, QueryMaquinariosParams, TipoDeMaquinario } from '@/services/maquinarios.services';
import { maquinariosFilterConfig, maquinariosTableColumns } from '../config/table-config';
import { useMaquinarios } from '../hooks/useMaquinarios';
import { exportarMaquinarios, lerMaquinarios } from '../utils/planilha';
import { MaquinarioModal } from './MaquinarioModal';

/** Os filtros como a tela guarda: o tipo pode ser 'all', o "sem filtro" do BaseFilters */
type FiltrosDaTela = Omit<QueryMaquinariosParams, 'tipo'> & { tipo?: TipoDeMaquinario | 'all' };

const FILTROS_INICIAIS: QueryMaquinariosParams = { search: '', page: 1, limit: LINHAS_POR_PAGINA_PADRAO };

/**
 * Cadastro de maquinários (SN-84): as máquinas que as instruções usam, com o
 * custo de cada uma. Exportar e Importar no cabeçalho, como todo cadastro; a
 * planilha do Smart Project também importa.
 */
export function MaquinariosPage() {
  const hasPermission = useUserStore((s) => s.hasPermission);
  const podeGerenciar = hasPermission('recursos.manage');

  const [linhasPorPagina, setLinhasPorPagina] = useLinhasPorPagina('maquinarios');
  const [filtrosBrutos, setFiltrosBrutos] = useState<FiltrosDaTela>(() => ({ ...FILTROS_INICIAIS, limit: linhasPorPagina }));

  // "all" é o "sem filtro" do BaseFilters: mandado à API, viraria um tipo inexistente
  const filtros = useMemo<QueryMaquinariosParams>(() => {
    const { tipo, search, page, limit } = filtrosBrutos;
    return {
      ...(tipo && tipo !== 'all' ? { tipo } : {}),
      ...(search ? { search } : {}),
      page: page || 1,
      limit: limit || LINHAS_POR_PAGINA_PADRAO,
    };
  }, [filtrosBrutos]);

  const { maquinarios, paginacao, carregando, salvando, salvar, remover, recarregar } = useMaquinarios(filtros);

  const [modal, setModal] = useState<{ aberto: boolean; modo: 'create' | 'edit'; maquinario: MaquinarioApiResponse | null }>({
    aberto: false,
    modo: 'create',
    maquinario: null,
  });
  const [aRemover, setARemover] = useState<MaquinarioApiResponse | null>(null);

  const mudarFiltro = (novos: Partial<FiltrosDaTela>) => setFiltrosBrutos((atuais) => ({ ...atuais, ...novos, page: 1 }));
  const mudarLinhas = (limit: number) => {
    setLinhasPorPagina(limit);
    setFiltrosBrutos((atuais) => ({ ...atuais, limit, page: 1 }));
  };
  const mudarPagina = (page: number) => setFiltrosBrutos((atuais) => ({ ...atuais, page }));

  return (
    <Layout>
      <Layout.Main>
        <div className="flex flex-col w-full sm:h-full">
          <TitleCard title="Maquinários" description="As máquinas que as instruções usam (próprias ou alugadas), com o custo de cada uma" />

          <div className="flex flex-col lg:flex-row gap-3 md:gap-4 mb-4 md:mb-6 lg:items-start">
            <div className="flex-1 min-w-0">
              <BaseFilters filters={filtrosBrutos} config={maquinariosFilterConfig} onFilterChange={mudarFiltro} />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
              <PlanilhaDoCadastro
                cadastro="maquinarios"
                titulo="Maquinários"
                exportar={() => exportarMaquinarios({ tipo: filtros.tipo, search: filtros.search })}
                ler={lerMaquinarios}
                aoImportar={recarregar}
                podeImportar={podeGerenciar}
              />
              {podeGerenciar && (
                <button
                  onClick={() => setModal({ aberto: true, modo: 'create', maquinario: null })}
                  className="btn-minimal-primary w-full lg:w-auto whitespace-nowrap"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Novo Maquinário</span>
                  <span className="sm:hidden">Novo</span>
                </button>
              )}
            </div>
          </div>

          <div className="sm:flex-1 sm:min-h-0">
            <BaseTable
              data={maquinarios}
              columns={maquinariosTableColumns}
              pagination={paginacao}
              loading={carregando}
              onPageChange={mudarPagina}
              onLimitChange={mudarLinhas}
              onEdit={podeGerenciar ? (maquinario) => setModal({ aberto: true, modo: 'edit', maquinario }) : undefined}
              onDelete={podeGerenciar ? (maquinario) => setARemover(maquinario) : undefined}
              emptyMessage="Nenhum maquinário cadastrado."
              emptyIcon={<Construction className="h-8 w-8 text-muted-foreground/50" />}
            />
          </div>
        </div>

        <MaquinarioModal
          isOpen={modal.aberto}
          mode={modal.modo}
          maquinario={modal.maquinario}
          salvando={salvando}
          onClose={() => setModal({ aberto: false, modo: 'create', maquinario: null })}
          onSubmit={salvar}
        />

        <Dialog open={!!aRemover} onOpenChange={(aberto: boolean) => !aberto && setARemover(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Remover maquinário</DialogTitle>
              <DialogDescription>Remover "{aRemover?.nome}"? Para só tirar de uso, desative-o em vez de remover.</DialogDescription>
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
