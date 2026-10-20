// src/features/programacao-os/components/origem-selector/ListaSelecionavel.tsx
import { useEffect, useMemo, useRef, useState, type UIEvent } from 'react';
import { Check, Loader2, Search } from 'lucide-react';
import type { PaginacaoDoCombobox } from '@/core';
import { filtrarOpcoes, type OpcaoDaLista } from './filtrar-opcoes';

export type { OpcaoDaLista } from './filtrar-opcoes';

interface ListaSelecionavelProps {
  opcoes: OpcaoDaLista[];
  value?: string;
  onChange: (id: string) => void;
  placeholder: string;
  /** Mostrado quando não há o que listar. */
  vazio: string;
  /** A primeira página ainda não chegou */
  loading?: boolean;
  /** A lista não carregou (o interceptor já avisou o motivo) */
  erro?: boolean;
  disabled?: boolean;
  /**
   * Cadastro que cresce (SN-77): a busca vai para o servidor e a próxima página
   * vem ao rolar até o fim. Sem ela, a lista filtra o que recebeu.
   */
  paginacao?: PaginacaoDoCombobox;
}

/** Quantos pixels antes do fim a próxima página já começa a vir. */
const PERTO_DO_FIM = 48;

/**
 * Uma lista com busca, para escolher um item.
 *
 * Nasceu de três telas quase iguais — anomalia, solicitação e plano —, cada uma
 * com sua cópia do filtro, do card e do estado vazio. Divergiam no espaçamento e
 * no que a busca alcançava, e a terceira sempre esquecia um campo.
 *
 * O `overscroll-contain` não é detalhe: sem ele, chegar ao fim desta lista
 * continuava rolando o modal atrás e jogava a pessoa para o pé do formulário.
 * O campo de busca fica montado enquanto carrega: no lugar do carregando, ele
 * perdia o foco a cada letra (a busca no servidor carrega a cada uma).
 */
export function ListaSelecionavel({
  opcoes,
  value,
  onChange,
  placeholder,
  vazio,
  loading = false,
  erro = false,
  disabled = false,
  paginacao,
}: ListaSelecionavelProps) {
  const [busca, setBusca] = useState('');

  // A busca do servidor fica no hook: ao sair do passo, ela volta a vazia junto com o campo
  const paginacaoAtual = useRef(paginacao);
  paginacaoAtual.current = paginacao;
  useEffect(() => () => paginacaoAtual.current?.onBuscar(''), []);

  // Paginado, quem filtra é o servidor
  const filtradas = useMemo(() => (paginacao ? opcoes : filtrarOpcoes(opcoes, busca)), [opcoes, busca, paginacao]);

  const buscar = (texto: string) => {
    setBusca(texto);
    paginacao?.onBuscar(texto);
  };

  const aoRolar = (e: UIEvent<HTMLDivElement>) => {
    if (!paginacao?.temMais || paginacao.carregando) return;
    const lista = e.currentTarget;
    if (lista.scrollHeight - lista.scrollTop - lista.clientHeight < PERTO_DO_FIM) paginacao.carregarMais();
  };

  const semResultado = busca.trim() ? `Nada encontrado para "${busca.trim()}".` : vazio;

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          className="input-minimal input-busca"
          placeholder={placeholder}
          value={busca}
          disabled={disabled}
          onChange={(e) => buscar(e.target.value)}
        />
      </div>

      <div className="max-h-72 space-y-1 overflow-y-auto overscroll-contain" onScroll={aoRolar} data-testid="lista-de-origem">
        {loading && filtradas.length === 0 && (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando...
          </div>
        )}

        {!loading && filtradas.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {erro ? 'Não foi possível carregar a lista.' : semResultado}
          </p>
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
                escolhida ? 'bg-muted' : 'hover:bg-muted'
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

        {paginacao?.carregando && filtradas.length > 0 && (
          <p className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Carregando mais...
          </p>
        )}
      </div>
    </div>
  );
}
