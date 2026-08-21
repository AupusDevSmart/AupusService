// src/features/programacao-os/components/origem-selector/ListaSelecionavel.tsx
import { useMemo, useState } from 'react';
import { Check, Loader2, Search } from 'lucide-react';

export interface OpcaoDaLista {
  id: string;
  titulo: string;
  /** Uma linha abaixo do título. Local, ativo, tipo — o que situa a escolha. */
  subtitulo?: string;
  /** Marcadores curtos antes do título: prioridade, status, número. */
  etiquetas?: Array<{ texto: string; alerta?: boolean }>;
}

interface ListaSelecionavelProps {
  opcoes: OpcaoDaLista[];
  value?: string;
  onChange: (id: string) => void;
  placeholder: string;
  /** Mostrado quando a busca não acha nada, ou quando não há o que listar. */
  vazio: string;
  loading?: boolean;
  disabled?: boolean;
}

/**
 * Uma lista com busca, para escolher um item.
 *
 * Nasceu de três telas quase iguais — anomalia, solicitação e plano —, cada uma
 * com sua cópia do filtro, do card e do estado vazio. Divergiam no espaçamento e
 * no que a busca alcançava, e a terceira sempre esquecia um campo.
 *
 * O `overscroll-contain` não é detalhe: sem ele, chegar ao fim desta lista
 * continuava rolando o modal atrás e jogava a pessoa para o pé do formulário.
 */
export function ListaSelecionavel({
  opcoes,
  value,
  onChange,
  placeholder,
  vazio,
  loading = false,
  disabled = false,
}: ListaSelecionavelProps) {
  const [busca, setBusca] = useState('');

  // O filtro varre tudo que a linha mostra. Buscar só pelo título fazia a
  // pessoa procurar por "casa de bombas" e não achar nada.
  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return opcoes;

    return opcoes.filter((o) =>
      [o.titulo, o.subtitulo, ...(o.etiquetas ?? []).map((e) => e.texto)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(termo),
    );
  }, [opcoes, busca]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 justify-center text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando...
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          className="input-minimal pl-8"
          placeholder={placeholder}
          value={busca}
          disabled={disabled}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <div className="max-h-72 space-y-1 overflow-y-auto overscroll-contain">
        {filtradas.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">{vazio}</p>
        )}

        {filtradas.map((opcao) => {
          const escolhida = value === opcao.id;

          return (
            <button
              key={opcao.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opcao.id)}
              className={`flex w-full items-start gap-2 rounded-md px-3 py-2 text-left transition-colors ${
                escolhida ? 'bg-primary/10 text-foreground' : 'hover:bg-muted'
              } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <div className="min-w-0 flex-1">
                {opcao.etiquetas && opcao.etiquetas.length > 0 && (
                  <div className="mb-0.5 flex flex-wrap items-center gap-1.5">
                    {opcao.etiquetas.map((etiqueta) => (
                      <span
                        key={etiqueta.texto}
                        className={`text-[10px] uppercase tracking-wide ${
                          etiqueta.alerta ? 'text-destructive' : 'text-muted-foreground'
                        }`}
                      >
                        {etiqueta.texto}
                      </span>
                    ))}
                  </div>
                )}
                <p className="truncate text-sm">{opcao.titulo}</p>
                {opcao.subtitulo && (
                  <p className="truncate text-xs text-muted-foreground">{opcao.subtitulo}</p>
                )}
              </div>

              {escolhida && <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
