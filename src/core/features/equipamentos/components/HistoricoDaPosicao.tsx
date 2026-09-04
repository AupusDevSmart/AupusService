import { useEffect, useState } from 'react';
import { History, Loader2, PackageMinus, ArrowRightLeft } from 'lucide-react';
import { Combobox } from '@/core/components/ui/combobox';
import { useAtivosFuncionais } from '../hooks/useAtivosFuncionais';
import { Button } from '@/core/components/ui/button';
import {
  useVinculoDaPosicao,
  type PosicaoDetalhada,
  type EquipamentoDaPosicao,
} from '../hooks/useAtivosFuncionais';

interface Props {
  posicaoId?: string;
  /** Instalacao, para listar os destinos possiveis da transferencia. */
  unidadeId?: string | null;
  readOnly?: boolean;
  /** Chamado depois de remover, para o sheet recarregar o que exibe. */
  onMudou?: () => void;
  /**
   * Abrir a ficha de um equipamento que passou por aqui.
   *
   * Sem isto o historico mostra so nome e datas: quem quer saber os dados
   * tecnicos de um equipamento que saiu ha meses teria de procura-lo na lista
   * geral, sem nem saber o nome proprio dele (a lista mostra o nome da POSICAO).
   */
  onVerEquipamento?: (equipamento: EquipamentoDaPosicao) => void;
  /** Qual esta sendo visitado agora, para marcar na lista. */
  equipamentoVisitadoId?: string;
}

const data = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('pt-BR') : '—';

/**
 * O que ja passou por esta posicao.
 *
 * E a razao de a separacao posicao/equipamento existir: trocar o equipamento nao
 * apaga o registro de quem esteve ali antes. Sem esta secao a informacao existe
 * no banco e nao chega a ninguem.
 *
 * O ocupante atual aparece separado dos anteriores porque a tela trata os dois
 * de forma diferente — um e operavel, os outros sao registro.
 */
export function HistoricoDaPosicao({
  posicaoId, unidadeId, readOnly, onMudou, onVerEquipamento, equipamentoVisitadoId,
}: Props) {
  const { buscar, remover, transferir, carregando } = useVinculoDaPosicao();
  const { ativos } = useAtivosFuncionais(unidadeId);
  const [transferindo, setTransferindo] = useState(false);
  const [destino, setDestino] = useState('');
  const [pedindoDestino, setPedindoDestino] = useState(false);
  const [posicao, setPosicao] = useState<PosicaoDetalhada | null>(null);
  const [removendo, setRemovendo] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [pedindoMotivo, setPedindoMotivo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!posicaoId) { setPosicao(null); return; }
    void buscar(posicaoId).then(setPosicao).catch(() => setPosicao(null));
  }, [posicaoId, buscar]);

  if (!posicaoId) return null;

  const confirmarRemocao = async () => {
    setRemovendo(true);
    setErro(null);
    try {
      await remover(posicaoId, motivo.trim() || undefined);
      setPedindoMotivo(false);
      setMotivo('');
      setPosicao(await buscar(posicaoId));
      onMudou?.();
    } catch (e: any) {
      setErro(e?.response?.data?.message ?? 'Nao foi possivel remover');
    } finally {
      setRemovendo(false);
    }
  };

  const confirmarTransferencia = async () => {
    const eq = posicao?.equipamento_ativo?.id;
    if (!eq || !destino) return;

    setTransferindo(true);
    setErro(null);
    try {
      await transferir(eq, destino, motivo.trim() || undefined);
      setPedindoDestino(false);
      setDestino(""); setMotivo("");
      setPosicao(await buscar(posicaoId!));
      onMudou?.();
    } catch (e: any) {
      setErro(e?.response?.data?.message ?? "Nao foi possivel transferir");
    } finally {
      setTransferindo(false);
    }
  };

  // Uma posicao ocupada nao pode receber outro equipamento — o indice parcial no
  // banco recusa, entao oferecer a opcao seria oferecer um erro. Logo apos a
  // migracao TODAS estao ocupadas, e o combobox vazio nao explicaria o motivo.
  const livres = ativos.filter(
    a => !a.ocupada && a.id?.trim() !== posicaoId?.trim(),
  );

  const anteriores = posicao?.anteriores ?? [];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground pb-2 border-b flex items-center gap-2">
        <History className="h-4 w-4 text-muted-foreground" />
        Histórico da posição
      </h3>

      {carregando && !posicao ? (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando...
        </p>
      ) : (
        <>
          <div className="space-y-1.5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Equipamento atual
            </p>
            {posicao?.equipamento_ativo ? (
              <div className="flex items-start justify-between gap-3 rounded-md border p-3">
                <div className="text-sm min-w-0">
                  {onVerEquipamento ? (
                    <button
                      type="button"
                      onClick={() => onVerEquipamento(posicao.equipamento_ativo!)}
                      className="font-medium truncate text-left hover:underline w-full"
                      title="Ver a ficha deste equipamento"
                    >
                      {posicao.equipamento_ativo.nome}
                    </button>
                  ) : (
                    <p className="font-medium truncate">{posicao.equipamento_ativo.nome}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {posicao.equipamento_ativo.modelo || 'sem modelo'}
                    {posicao.equipamento_ativo.numero_serie
                      ? ` · série ${posicao.equipamento_ativo.numero_serie}` : ''}
                  </p>
                </div>
                {!readOnly && (
                  <div className="flex gap-1 shrink-0">
                    <Button
                      type="button" variant="ghost" size="sm"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => { setPedindoDestino(true); setPedindoMotivo(false); setMotivo(""); setErro(null); }}
                    >
                      <ArrowRightLeft className="h-4 w-4 mr-1.5" />
                      Transferir
                    </Button>
                    <Button
                      type="button" variant="ghost" size="sm"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => { setPedindoMotivo(true); setPedindoDestino(false); setMotivo(""); setErro(null); }}
                    >
                      <PackageMinus className="h-4 w-4 mr-1.5" />
                      Remover
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              // Posicao vazia e estado legitimo — o equipamento saiu e o proximo
              // ainda nao chegou. Dizer isso explicitamente evita a leitura de
              // que a tela falhou ao carregar.
              <p className="text-sm text-muted-foreground rounded-md border border-dashed p-3">
                Nenhum equipamento instalado nesta posição.
              </p>
            )}
          </div>

          {pedindoDestino && (
            <div className="space-y-2 rounded-md border p-3">
              <p className="text-sm font-medium">Mover para qual posição?</p>
              {/* So posicoes LIVRES: a de destino ocupada seria recusada pelo
                  banco, e oferecer uma opcao que vai falhar e pior do que nao
                  oferecer. A posicao atual tambem sai da lista. */}
              {livres.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Todas as posições desta instalação estão ocupadas. Remova o
                  equipamento da posição de destino, ou crie uma nova posição,
                  antes de transferir.
                </p>
              ) : (
                <Combobox
                  options={livres.map(a => ({ value: a.id?.trim() || '', label: a.nome }))}
                  value={destino}
                  onValueChange={setDestino}
                  placeholder="Selecione a posição de destino"
                  searchPlaceholder="Buscar posição..."
                  emptyText="Nenhuma posição encontrada."
                />
              )}
              {livres.length > 0 && (
                <input
                  className="w-full h-9 px-3 rounded-md border bg-background text-sm"
                  placeholder="Motivo (opcional) — ex.: remanejado"
                  value={motivo}
                  onChange={e => setMotivo(e.target.value)}
                />
              )}
              {erro && <p className="text-xs text-destructive">{erro}</p>}
              <div className="flex gap-2">
                {livres.length > 0 && (
                  <Button type="button" size="sm" onClick={confirmarTransferencia} disabled={transferindo || !destino}>
                    {transferindo ? 'Transferindo...' : 'Confirmar transferência'}
                  </Button>
                )}
                <Button
                  type="button" size="sm" variant="ghost"
                  onClick={() => { setPedindoDestino(false); setErro(null); setDestino(""); setMotivo(""); }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {pedindoMotivo && (
            <div className="space-y-2 rounded-md border p-3">
              <p className="text-sm font-medium">Por que o equipamento está saindo?</p>
              <input
                className="w-full h-9 px-3 rounded-md border bg-background text-sm"
                placeholder="Ex.: queimou, enviado para manutenção"
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
              />
              {erro && <p className="text-xs text-destructive">{erro}</p>}
              <div className="flex gap-2">
                <Button type="button" size="sm" onClick={confirmarRemocao} disabled={removendo}>
                  {removendo ? 'Removendo...' : 'Confirmar remoção'}
                </Button>
                <Button
                  type="button" size="sm" variant="ghost"
                  onClick={() => { setPedindoMotivo(false); setErro(null); }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Já passaram por aqui ({anteriores.length})
            </p>
            {anteriores.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum equipamento anterior registrado.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {anteriores.map(v => {
                  const eq = v.equipamento;
                  const visitado = !!eq?.id && eq.id.trim() === equipamentoVisitadoId?.trim();
                  const conteudo = (
                    <>
                      <p className="font-medium truncate">
                        {eq?.nome ?? 'Equipamento removido'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {data(v.instalado_em)} até {data(v.removido_em)}
                        {v.motivo_remocao ? ` · ${v.motivo_remocao}` : ''}
                      </p>
                    </>
                  );

                  // Sem `onVerEquipamento` (ou sem o equipamento, que some do
                  // vinculo quando e excluido) a linha continua sendo so
                  // registro — botao que nao leva a lugar nenhum e pior do que
                  // texto.
                  if (!onVerEquipamento || !eq) {
                    return (
                      <li key={v.id} className="rounded-md border p-2.5 text-sm">
                        {conteudo}
                      </li>
                    );
                  }

                  return (
                    <li key={v.id}>
                      <button
                        type="button"
                        onClick={() => onVerEquipamento(eq)}
                        // 44px de alvo no celular: sao duas linhas de texto, e
                        // o dedo erra o que o ponteiro acerta.
                        className={`w-full min-h-11 sm:min-h-0 rounded-md border p-2.5 text-sm text-left hover:bg-accent ${
                          visitado ? 'border-foreground' : ''
                        }`}
                        title="Ver a ficha deste equipamento"
                      >
                        {conteudo}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
