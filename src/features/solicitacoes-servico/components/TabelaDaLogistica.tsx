// src/features/solicitacoes-servico/components/TabelaDaLogistica.tsx
import { useEffect, useState } from 'react';
import { RotateCcw, Trash2, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CampoDeNumero } from '@/components/common/CampoDeNumero';
import { DicaDaConta, type Explicacao } from '@/components/common/ComoSeCalcula';
import { AVISO_DE_DINHEIRO, dinheiroNoCampo, lerDinheiroDigitado } from '@/utils/leitura';
import { moeda, type LinhaDeLogistica, type Proposta, type TabelaDeLogistica } from '@/services/proposta.services';
import { BotaoAdicionar } from './TituloDaSecao';

/** O planejamento que a linha nova usa: o digitado e, no vazio, o calculado */
type Planejamento = Pick<Proposta, 'distancia_km' | 'dias_previstos' | 'pessoas_previstas' | 'noites_fora' | 'planejamento_calculado'>;

type Coluna = 'quantidade' | 'valor_unitario' | 'dias' | 'km' | 'valor_km' | 'valor_fixo';

/** Mexer nestas numa linha automática a tira do automático (o preço não: a quantidade segue o planejamento) */
const QUANTIDADES = new Set<Coluna>(['quantidade', 'dias', 'km']);

/** Um campo da conta da linha: o número e o que ele é, em volta ("R$ [2,50] /km") */
interface Campo {
  campo: Coluna;
  /** Para o leitor de tela e os testes: "Quantidade (diárias)" */
  rotulo: string;
  antes?: string;
  depois?: string;
  dinheiro?: boolean;
  vazio?: string;
}
/** A conta da linha, lida como se escreve: campo, operador, campo... */
type Parte = Campo | '×' | '+';

/**
 * Cada tabela é uma conta (a mesma de `totalDaLinha`), e a linha a mostra assim:
 *   frete:        viagens × km × R$/km + R$ fixo
 *   deslocamento: veículos × km × R$/km (a diária do veículo saiu, 30/out/2026)
 *   diárias:      unidades × R$ (café, almoço, jantar, pernoite)
 */
const TABELAS: Record<TabelaDeLogistica, { titulo: string; exemplo: string; partes: Parte[] }> = {
  FRETE: {
    titulo: 'Frete',
    exemplo: 'Ex.: frete do gerador',
    partes: [
      { campo: 'quantidade', rotulo: 'Viagens', depois: 'viagens' },
      '×',
      { campo: 'km', rotulo: 'km por viagem', depois: 'km' },
      '×',
      { campo: 'valor_km', rotulo: 'R$ por km', antes: 'R$', depois: '/km', dinheiro: true },
      '+',
      { campo: 'valor_fixo', rotulo: 'Valor fixo', antes: 'R$', depois: 'fixo', dinheiro: true },
    ],
  },
  DESLOCAMENTO: {
    titulo: 'Deslocamento',
    exemplo: 'Ex.: picape da equipe',
    partes: [
      { campo: 'quantidade', rotulo: 'Veículos', depois: 'veículos', vazio: '1' },
      '×',
      { campo: 'km', rotulo: 'km', depois: 'km' },
      '×',
      { campo: 'valor_km', rotulo: 'R$ por km', antes: 'R$', depois: '/km', dinheiro: true },
    ],
  },
  DIARIA: {
    titulo: 'Diárias',
    exemplo: 'Ex.: almoço, pernoite',
    partes: [{ campo: 'quantidade', rotulo: 'Quantidade', depois: 'unidades' }, '×', { campo: 'valor_unitario', rotulo: 'Valor', antes: 'R$', dinheiro: true }],
  },
};

/** A diária do veículo de antes (29/out/2026): só na linha que já a tinha, para poder zerá-la */
const DIARIA_DO_VEICULO: Parte[] = ['+', { campo: 'dias', rotulo: 'Dias', depois: 'dias' }, '×', { campo: 'valor_unitario', rotulo: 'Diária do veículo', antes: 'R$', depois: 'diária', dinheiro: true }];

/** A linha em branco, já com o planejamento onde ele cabe (o km do veículo, o de uma viagem de frete) */
function linhaEmBranco(tabela: TabelaDeLogistica, plano: Planejamento): LinhaDeLogistica {
  const base = { tabela, ativo: true, descricao: '', total: null };
  const kmDoVeiculo = plano.planejamento_calculado?.km_por_veiculo ?? (plano.distancia_km ? plano.distancia_km * 2 : null);
  if (tabela === 'DESLOCAMENTO') return { ...base, km: kmDoVeiculo };
  if (tabela === 'FRETE') return { ...base, quantidade: 1, km: plano.distancia_km };
  return { ...base, quantidade: null };
}

interface TabelaDaLogisticaProps {
  tabela: TabelaDeLogistica;
  /** As linhas desta tabela, na ordem */
  linhas: LinhaDeLogistica[];
  editavel: boolean;
  planejamento: Planejamento;
  /** A lista inteira da tabela, como fica (o servidor recalcula o total) */
  onChange: (linhas: LinhaDeLogistica[]) => void;
  /** Como o total da linha sai (o ícone discreto ao lado do título) */
  explicacao?: Explicacao;
}

/**
 * Uma tabelinha da proposta: frete, deslocamento ou diárias. Sem linha nenhuma,
 * só o título e o "Adicionar". Cada linha é o nome e, embaixo, a conta dela com
 * os campos no lugar dos números; as linhas se separam pelo espaço, sem caixa nem
 * traço (30/out/2026: menos borda). Nada pede arrasto para o lado no celular.
 */
export function TabelaDaLogistica({ tabela, linhas, editavel, planejamento, onChange, explicacao }: TabelaDaLogisticaProps) {
  const config = TABELAS[tabela];
  const trocar = (indice: number, dados: Partial<LinhaDeLogistica>) => onChange(linhas.map((l, i) => (i === indice ? { ...l, ...dados } : l)));
  const total = linhas.filter((l) => l.ativo).reduce((s, l) => s + (l.total ?? 0), 0);
  // A automática zerada (sem noites, o pernoite) não aparece: fica gravada, com o preço e o
  // nome dela, para quando o planejamento a pedir de novo. Os índices seguem os da lista inteira
  const aparece = (linha: LinhaDeLogistica) => !(linha.automatica && linha.quantidade === 0);
  const visiveis = linhas.filter(aparece);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-sm font-medium">
          {config.titulo}
          {explicacao && <DicaDaConta {...explicacao} />}
        </span>
        <span className="flex items-center gap-1">
          {visiveis.length > 0 && <span className="text-xs text-muted-foreground tabular-nums">{moeda(total)}</span>}
          {editavel && (
            <BotaoAdicionar descricao={`Adicionar linha de ${config.titulo.toLowerCase()}`} onClick={() => onChange([...linhas, linhaEmBranco(tabela, planejamento)])} />
          )}
        </span>
      </div>

      {visiveis.length > 0 && (
        // As linhas se separam pelo espaço, sem traço (30/out/2026)
        <div className="space-y-3 pt-1">
          {linhas.map((linha, indice) => {
            if (!aparece(linha)) return null;
            const comDiaria = tabela === 'DESLOCAMENTO' && ((linha.valor_unitario ?? 0) > 0 || (linha.dias ?? 0) > 0) && !linha.automatica;
            const partes = comDiaria ? [...config.partes, ...DIARIA_DO_VEICULO] : config.partes;
            return (
              <div key={linha.id ?? `nova-${indice}`} className={`space-y-1.5 ${linha.ativo ? '' : 'opacity-50'}`}>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 shrink-0 accent-foreground"
                    checked={linha.ativo}
                    disabled={!editavel}
                    aria-label="Linha na conta"
                    title="Desmarcada, fica na proposta e sai da conta"
                    onChange={(e) => trocar(indice, { ativo: e.target.checked })}
                  />
                  <TextoDaLinha
                    valor={linha.descricao}
                    editavel={editavel}
                    placeholder={config.exemplo}
                    obrigatorio={Boolean(linha.automatica)}
                    onChange={(descricao) => trocar(indice, { descricao })}
                  />
                  {linha.automatica && !linha.ajustada && (
                    <span className="shrink-0 text-muted-foreground" title="Calculada pelo planejamento: acompanha o km, os dias, as pessoas e as noites">
                      <Wand2 className="h-3.5 w-3.5" aria-label="Linha automática" />
                    </span>
                  )}
                  {linha.automatica && linha.ajustada && (
                    <button
                      type="button"
                      className="flex shrink-0 items-center gap-1 rounded-sm text-xs text-muted-foreground hover:text-foreground disabled:pointer-events-none"
                      title="Ajustada à mão: não acompanha o planejamento. Clique para voltar ao cálculo automático"
                      aria-label="Voltar ao cálculo automático"
                      disabled={!editavel}
                      onClick={() => trocar(indice, { ajustada: false })}
                    >
                      <RotateCcw className="h-3 w-3" />
                      ajustada
                    </button>
                  )}
                  <span className="w-24 shrink-0 text-right text-sm font-medium tabular-nums">{moeda(linha.total ?? 0)}</span>
                  {editavel && !linha.automatica ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                      title="Remover linha"
                      aria-label="Remover linha"
                      onClick={() => onChange(linhas.filter((_, i) => i !== indice))}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  ) : (
                    // A automática não se remove (voltaria no próximo cálculo): desmarcá-la a tira da conta
                    editavel && <span className="w-7 shrink-0" />
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 pl-5 text-xs text-muted-foreground">
                  {partes.map((parte, i) =>
                    typeof parte === 'string' ? (
                      <span key={`op-${i}`} className="px-0.5">
                        {parte}
                      </span>
                    ) : (
                      // O campo com o que o acompanha ("R$ [2,50] /km") não se separa ao quebrar a linha
                      <span key={parte.campo} className="inline-flex items-center gap-1.5 whitespace-nowrap">
                        {parte.antes && <span>{parte.antes}</span>}
                        <CampoDeNumero
                          className="h-7 w-20 text-right text-xs"
                          value={linha[parte.campo] ?? null}
                          disabled={!editavel}
                          placeholder={parte.vazio}
                          onChange={(valor) => trocar(indice, { [parte.campo]: valor, ...(linha.automatica && QUANTIDADES.has(parte.campo) && { ajustada: true }) })}
                          {...(parte.dinheiro && { ler: lerDinheiroDigitado, mostrar: dinheiroNoCampo, aviso: AVISO_DE_DINHEIRO })}
                          avisoCurto
                          aria-label={`${parte.rotulo} (${config.titulo.toLowerCase()})`}
                        />
                        {parte.depois && <span>{parte.depois}</span>}
                      </span>
                    ),
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * O texto da linha grava ao sair do campo (por tecla, cada letra era uma escrita
 * na API). `obrigatorio`: a linha automática não fica sem nome (a sem nome não se
 * grava, e o servidor a recriaria ao lado); apagado, o nome volta. Parece texto
 * (30/out/2026: menos borda): a borda aparece ao passar o mouse, ao editar e na
 * linha nova, ainda sem nome.
 */
export function TextoDaLinha({
  valor,
  editavel,
  placeholder,
  obrigatorio = false,
  onChange,
}: {
  valor: string;
  editavel: boolean;
  placeholder?: string;
  obrigatorio?: boolean;
  onChange: (texto: string) => void;
}) {
  const [texto, setTexto] = useState(valor);
  useEffect(() => setTexto(valor), [valor]);
  const sair = () => {
    if (obrigatorio && !texto.trim()) return setTexto(valor);
    if (texto !== valor) onChange(texto);
  };
  return (
    <input
      className={`h-8 min-w-0 flex-1 rounded border bg-transparent px-2 text-sm font-medium placeholder:font-normal placeholder:text-muted-foreground hover:border-input focus-visible:border-input focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-default disabled:hover:border-transparent ${texto ? 'border-transparent' : 'border-input'}`}
      value={texto}
      placeholder={placeholder}
      disabled={!editavel}
      maxLength={200}
      onChange={(e) => setTexto(e.target.value)}
      onBlur={sair}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
    />
  );
}
