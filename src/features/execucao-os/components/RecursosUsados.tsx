// src/features/execucao-os/components/RecursosUsados.tsx
import { useRef, useState } from 'react';
import { CheckCheck, Package, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CampoDeNumero } from '@/components/common/CampoDeNumero';
import { AVISO_DE_QUANTIDADE, lerQuantidadeDigitada } from '@/utils/leitura';
import { execucaoOSApi } from '@/services/execucao-os.service';
import { toast } from '@/hooks/use-toast';
import { formatApiError } from '@/utils/api-error';
import type { FerramentaOS, MaterialOS } from '../types';
import {
  materiaisDaExecucao,
  ferramentasDaExecucao,
  pedidoDoMaterial,
  pedidoDaFerramenta,
  quantidadeLegivel,
  trocarPorId,
  usoComoPlanejado,
  type MaterialUsado,
  type FerramentaUsada,
} from '../utils/recursos-usados';

interface RecursosUsadosProps {
  osId: string;
  materiais?: MaterialOS[];
  ferramentas?: FerramentaOS[];
  /** OS em execução ou pausada, e quem olha pode registrar; senão, só leitura */
  editavel: boolean;
}

/**
 * Materiais e ferramentas usados, registrados durante a execução, no próprio
 * sheet (06/nov/2026). Antes só o modo Editar registrava, num cartão lá embaixo
 * no formulário, que ninguém achava; no Visualizar nem havia como.
 *
 * Grava na hora, como o checklist: o consumo ao sair do campo, a ferramenta ao
 * marcar. Só o que a OS já tem (as rotas `PATCH :id/materiais` e
 * `:id/ferramentas` não criam item).
 */
export function RecursosUsados({ osId, materiais = [], ferramentas = [], editavel }: RecursosUsadosProps) {
  const [mats, setMats] = useState<MaterialUsado[]>(() => materiaisDaExecucao(materiais));
  const [ferrs, setFerrs] = useState<FerramentaUsada[]>(() => ferramentasDaExecucao(ferramentas));
  const [gravando, setGravando] = useState(false);
  // Um pedido por vez: dois PATCH do mesmo material saindo juntos (sair do campo com "3" e clicar
  // em "Tudo") podiam chegar fora de ordem, e o banco ficava com o mais velho enquanto a tela
  // mostrava o mais novo. A fila guarda a ordem em que a pessoa mexeu
  const fila = useRef<Promise<unknown>>(Promise.resolve());

  if (mats.length === 0 && ferrs.length === 0) {
    return (
      <div className="space-y-1">
        <h3 className="text-sm font-medium">Materiais e ferramentas usados</h3>
        <p className="text-sm text-muted-foreground">Nenhum material ou ferramenta planejado para esta OS.</p>
      </div>
    );
  }

  const naFila = (pedido: () => Promise<void>) => {
    const vez = fila.current.then(pedido, pedido);
    fila.current = vez.catch(() => undefined);
    return vez;
  };

  const gravarMateriais = (novos: MaterialUsado[]) => {
    const mudados = novos.filter((n) => mats.find((a) => a.id === n.id)?.consumida !== n.consumida);
    if (mudados.length === 0) return Promise.resolve();
    const antes = mats.filter((a) => mudados.some((m) => m.id === a.id));
    setMats((atuais) => trocarPorId(atuais, mudados));
    return naFila(async () => {
      try {
        await execucaoOSApi.registrarMateriais(osId, mudados.map(pedidoDoMaterial));
      } catch (error) {
        // Volta só o item que ainda mostra o que este pedido mandou: se a pessoa já mudou de novo,
        // o valor novo é o que vale (e vai no pedido seguinte da fila)
        setMats((atuais) =>
          trocarPorId(atuais, antes.filter((a) => atuais.find((x) => x.id === a.id)?.consumida === mudados.find((m) => m.id === a.id)?.consumida)),
        );
        toast({ title: 'Não foi possível salvar o consumo', description: formatApiError(error), variant: 'destructive' });
      }
    });
  };

  const gravarFerramentas = (novas: FerramentaUsada[]) => {
    const mudadas = novas.filter((n) => ferrs.find((a) => a.id === n.id)?.utilizada !== n.utilizada);
    if (mudadas.length === 0) return Promise.resolve();
    const antes = ferrs.filter((a) => mudadas.some((f) => f.id === a.id));
    setFerrs((atuais) => trocarPorId(atuais, mudadas));
    return naFila(async () => {
      try {
        await execucaoOSApi.registrarFerramentas(osId, mudadas.map(pedidoDaFerramenta));
      } catch (error) {
        setFerrs((atuais) =>
          trocarPorId(atuais, antes.filter((a) => atuais.find((x) => x.id === a.id)?.utilizada === mudadas.find((f) => f.id === a.id)?.utilizada)),
        );
        toast({ title: 'Não foi possível salvar a ferramenta', description: formatApiError(error), variant: 'destructive' });
      }
    });
  };

  // Atalho do caso comum: o que ninguém registrou foi usado como planejado
  const atalho = usoComoPlanejado(mats, ferrs);
  const faltaMarcar = atalho.materiais.length > 0 || atalho.ferramentas.length > 0;
  const usouTudo = async () => {
    setGravando(true);
    try {
      await Promise.all([gravarMateriais(atalho.materiais), gravarFerramentas(atalho.ferramentas)]);
    } finally {
      setGravando(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-medium">Materiais e ferramentas usados</h3>
          {editavel && (
            <p className="text-xs text-muted-foreground">Informe quanto usou de cada material e marque as ferramentas usadas. Salva sozinho.</p>
          )}
        </div>
        {editavel && faltaMarcar && (
          <Button type="button" size="sm" variant="outline" onClick={usouTudo} disabled={gravando}>
            <CheckCheck className="mr-1.5 h-4 w-4" />
            Usei tudo como planejado
          </Button>
        )}
      </div>

      {mats.length > 0 && (
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Package className="h-3.5 w-3.5" aria-hidden />
            Materiais
          </p>
          {mats.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-md border px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{m.descricao}</p>
                <p className="text-xs text-muted-foreground">Planejado: {quantidadeLegivel(m.planejada, m.unidade)}</p>
              </div>
              {editavel ? (
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground" htmlFor={`usado-${m.id}`}>
                    Usado
                  </label>
                  <CampoDeNumero
                    id={`usado-${m.id}`}
                    value={m.consumida}
                    onChange={(valor) => gravarMateriais([{ ...m, consumida: valor ?? 0 }])}
                    ler={lerQuantidadeDigitada}
                    aviso={AVISO_DE_QUANTIDADE}
                    avisoCurto
                    placeholder="0"
                    aria-label={`Quantidade usada de ${m.descricao}`}
                    className="h-8 w-20 text-right"
                  />
                  <span className="w-8 text-xs text-muted-foreground">{m.unidade}</span>
                  {m.consumida !== m.planejada && (
                    <Button type="button" size="sm" variant="ghost" className="h-8" onClick={() => gravarMateriais([{ ...m, consumida: m.planejada }])}>
                      Tudo
                    </Button>
                  )}
                </div>
              ) : (
                <span className="text-sm">Usado: {quantidadeLegivel(m.consumida, m.unidade)}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {ferrs.length > 0 && (
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Wrench className="h-3.5 w-3.5" aria-hidden />
            Ferramentas
          </p>
          {ferrs.map((f) => (
            <label
              key={f.id}
              className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate">{f.descricao}</span>
                <span className="block text-xs text-muted-foreground">{quantidadeLegivel(f.quantidade, f.unidade)}</span>
              </span>
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                {f.utilizada ? 'Usada' : 'Não usada'}
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border"
                  checked={f.utilizada}
                  disabled={!editavel}
                  onChange={(e) => gravarFerramentas([{ ...f, utilizada: e.target.checked }])}
                  aria-label={`${f.descricao} usada`}
                />
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
