/**
 * O que o editar da execução grava: consumo de material e uso de ferramenta.
 *
 * O editar não salvava nada — o submit descartava os dados. As únicas rotas que
 * atualizam a OS fora das transições são `PATCH :id/materiais` e
 * `PATCH :id/ferramentas`, que mexem só nesses campos de itens que já existem.
 * O resto do formulário vem dos painéis das transições (iniciar, executar,
 * auditar) e fica só leitura no editar (decisão D1 da
 * SPEC-ATALHOS-E-ACOES-DA-OS).
 *
 * Vai só o que mudou: cada gravação entra no histórico da OS.
 */

interface MaterialDaOS {
  id?: string | null;
  quantidade_consumida?: number | null;
  observacoes?: string | null;
}

interface FerramentaDaOS {
  id?: string | null;
  utilizada?: boolean | null;
  condicao_antes?: string | null;
  condicao_depois?: string | null;
  observacoes?: string | null;
}

export interface RegistroDeMaterial {
  id: string;
  quantidade_consumida: number;
  observacoes?: string;
}

export interface RegistroDeFerramenta {
  id: string;
  utilizada: boolean;
  condicao_antes?: string;
  condicao_depois?: string;
  observacoes?: string;
}

/** Item que o servidor conhece. Linha nova (`temp_...`) não tem rota para ser criada aqui. */
const doServidor = (id?: string | null) => Boolean(id?.trim()) && !String(id).startsWith('temp_');

const porId = <T extends { id?: string | null }>(itens: T[]) =>
  new Map(itens.filter((i) => doServidor(i.id)).map((i) => [String(i.id).trim(), i]));

const texto = (v?: string | null) => (v?.trim() ? v.trim() : undefined);

export function registrosAlterados(
  original: { materiais: MaterialDaOS[]; ferramentas: FerramentaDaOS[] },
  atual: { materiais: MaterialDaOS[]; ferramentas: FerramentaDaOS[] },
): { materiais: RegistroDeMaterial[]; ferramentas: RegistroDeFerramenta[] } {
  const materiaisAntes = porId(original.materiais ?? []);
  const ferramentasAntes = porId(original.ferramentas ?? []);

  const materiais: RegistroDeMaterial[] = [];
  for (const [id, m] of porId(atual.materiais ?? [])) {
    const antes = materiaisAntes.get(id);
    const consumo = Number(m.quantidade_consumida) || 0;
    const mudou =
      !antes ||
      consumo !== (Number(antes.quantidade_consumida) || 0) ||
      texto(m.observacoes) !== texto(antes.observacoes);
    if (!mudou) continue;
    materiais.push({
      id,
      quantidade_consumida: consumo,
      ...(texto(m.observacoes) ? { observacoes: texto(m.observacoes) } : {}),
    });
  }

  const ferramentas: RegistroDeFerramenta[] = [];
  for (const [id, f] of porId(atual.ferramentas ?? [])) {
    const antes = ferramentasAntes.get(id);
    const mudou =
      !antes ||
      Boolean(f.utilizada) !== Boolean(antes.utilizada) ||
      texto(f.condicao_antes) !== texto(antes.condicao_antes) ||
      texto(f.condicao_depois) !== texto(antes.condicao_depois) ||
      texto(f.observacoes) !== texto(antes.observacoes);
    if (!mudou) continue;
    ferramentas.push({
      id,
      utilizada: Boolean(f.utilizada),
      ...(texto(f.condicao_antes) ? { condicao_antes: texto(f.condicao_antes) } : {}),
      ...(texto(f.condicao_depois) ? { condicao_depois: texto(f.condicao_depois) } : {}),
      ...(texto(f.observacoes) ? { observacoes: texto(f.observacoes) } : {}),
    });
  }

  return { materiais, ferramentas };
}
