import { useEffect, useState } from 'react';
import { History, Loader2, PackageMinus } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import {
  useVinculoDaPosicao,
  type PosicaoDetalhada,
} from '../hooks/useAtivosFuncionais';

interface Props {
  posicaoId?: string;
  readOnly?: boolean;
  /** Chamado depois de remover, para o sheet recarregar o que exibe. */
  onMudou?: () => void;
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
export function HistoricoDaPosicao({ posicaoId, readOnly, onMudou }: Props) {
  const { buscar, remover, carregando } = useVinculoDaPosicao();
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
                  <p className="font-medium truncate">{posicao.equipamento_ativo.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {posicao.equipamento_ativo.modelo || 'sem modelo'}
                    {posicao.equipamento_ativo.numero_serie
                      ? ` · série ${posicao.equipamento_ativo.numero_serie}` : ''}
                  </p>
                </div>
                {!readOnly && (
                  <Button
                    type="button" variant="ghost" size="sm"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => setPedindoMotivo(true)}
                  >
                    <PackageMinus className="h-4 w-4 mr-1.5" />
                    Remover
                  </Button>
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
                {anteriores.map(v => (
                  <li key={v.id} className="rounded-md border p-2.5 text-sm">
                    <p className="font-medium truncate">
                      {v.equipamento?.nome ?? 'Equipamento removido'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {data(v.instalado_em)} até {data(v.removido_em)}
                      {v.motivo_remocao ? ` · ${v.motivo_remocao}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
