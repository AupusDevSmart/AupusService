import type { ReactNode } from 'react';
import { format, isSameDay, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { EventoDaAgenda } from '@/services/eventos-da-agenda.services';
import { SITUACOES } from '@/features/agenda/calendario/config/situacoes';
import { DIAS_DA_SEMANA, chaveDoDia, comInicialMaiuscula } from '@/features/agenda/calendario/utils/periodo';
import { DetalheDaPrevisao, EventoDoCalendario, PontoDaSituacao } from '@/features/agenda/calendario/components/EventoDoCalendario';
import { horaDoEvento } from '@/features/agenda/calendario/utils/evento';

interface PropsDaVisao {
  dias: Date[];
  porDia: Map<string, EventoDaAgenda[]>;
  hoje: Date;
}

/** Quantos eventos a célula do mês mostra antes do "+N". */
const NA_CELULA = 3;

const doDia = (porDia: Map<string, EventoDaAgenda[]>, dia: Date) => porDia.get(chaveDoDia(dia)) ?? [];
const tituloDoDia = (dia: Date) => comInicialMaiuscula(format(dia, "EEEE, d 'de' MMMM", { locale: ptBR }));

function NumeroDoDia({ dia, hoje }: { dia: Date; hoje: Date }) {
  return (
    <span
      className={cn('inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs tabular-nums', isSameDay(dia, hoje) && 'bg-primary text-primary-foreground')}
      aria-current={isSameDay(dia, hoje) ? 'date' : undefined}
    >
      {format(dia, 'd')}
    </span>
  );
}

/** O dia inteiro, numa janela: o "+N" do mês e o toque no celular. */
function DiaCompleto({ dia, eventos, children, rotulo }: { dia: Date; eventos: EventoDaAgenda[]; children: ReactNode; rotulo: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" aria-label={rotulo} data-fundo-proprio className="rounded bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {children}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="start">
        <p className="px-1.5 pb-1 text-xs font-medium text-muted-foreground">{tituloDoDia(dia)}</p>
        <div className="max-h-72 space-y-0.5 overflow-y-auto">
          {eventos.map((evento) => (
            <EventoDoCalendario key={evento.id} evento={evento} />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function VisaoMes({ dias, porDia, hoje, mes }: PropsDaVisao & { mes: Date }) {
  return (
    <div className="overflow-hidden rounded-md border border-border">
      <div className="grid grid-cols-7 border-b border-border bg-muted text-center text-xs font-medium text-muted-foreground">
        {DIAS_DA_SEMANA.map(({ sigla, letra }) => (
          <div key={sigla} className="py-2">
            <abbr title={sigla} className="no-underline sm:hidden">
              {letra}
            </abbr>
            <span className="hidden sm:inline">{sigla}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {dias.map((dia) => {
          const eventos = doDia(porDia, dia);
          const sobram = eventos.length - NA_CELULA;
          return (
            <div
              key={dia.toISOString()}
              data-dia={chaveDoDia(dia)}
              className={cn('min-h-[4.5rem] border-b border-r border-border p-1 sm:min-h-[6.5rem] [&:nth-child(7n)]:border-r-0', !isSameMonth(dia, mes) && 'bg-muted text-muted-foreground')}
            >
              <NumeroDoDia dia={dia} hoje={hoje} />
              {/* No celular a célula não cabe texto: pontos, e o toque abre o dia */}
              {eventos.length > 0 && (
                <div className="mt-1 sm:hidden">
                  <DiaCompleto dia={dia} eventos={eventos} rotulo={`${eventos.length} no dia ${format(dia, 'd')}`}>
                    <span className="flex flex-wrap items-center gap-1 p-0.5">
                      {eventos.slice(0, NA_CELULA).map((evento) => (
                        <PontoDaSituacao key={evento.id} situacao={evento.situacao} />
                      ))}
                      {sobram > 0 && <span className="text-[10px] text-muted-foreground">+{sobram}</span>}
                    </span>
                  </DiaCompleto>
                </div>
              )}
              <div className="mt-0.5 hidden space-y-0.5 sm:block">
                {eventos.slice(0, NA_CELULA).map((evento) => (
                  <EventoDoCalendario key={evento.id} evento={evento} comHora={false} />
                ))}
                {sobram > 0 && (
                  <DiaCompleto dia={dia} eventos={eventos} rotulo={`Ver os ${eventos.length} do dia ${format(dia, 'd')}`}>
                    <span className="block px-1.5 text-left text-xs text-muted-foreground hover:text-foreground">+{sobram} mais</span>
                  </DiaCompleto>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function VisaoSemana({ dias, porDia, hoje }: PropsDaVisao) {
  return (
    <div className="grid grid-cols-1 overflow-hidden rounded-md border border-border sm:grid-cols-7">
      {dias.map((dia) => {
        const eventos = doDia(porDia, dia);
        return (
          <section key={dia.toISOString()} data-dia={chaveDoDia(dia)} className="min-h-[5rem] border-b border-border p-1.5 sm:min-h-[16rem] sm:border-r sm:last:border-r-0">
            <header className="mb-1 flex items-center gap-1.5 text-xs capitalize text-muted-foreground">
              <span>{format(dia, 'EEE', { locale: ptBR })}</span>
              <NumeroDoDia dia={dia} hoje={hoje} />
            </header>
            <div className="space-y-0.5">
              {eventos.map((evento) => (
                <EventoDoCalendario key={evento.id} evento={evento} />
              ))}
              {eventos.length === 0 && <p className="px-1.5 text-xs text-muted-foreground sm:hidden">Nada neste dia</p>}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function LinhaDaLista({ evento }: { evento: EventoDaAgenda }) {
  const hora = horaDoEvento(evento);
  const onde = [evento.planta_nome, ...evento.instalacoes].filter(Boolean).join(' · ');
  const conteudo = (
    <>
      <span className="w-12 shrink-0 pt-0.5 text-xs tabular-nums text-muted-foreground">{hora ?? '—'}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-foreground">
          {evento.origem === 'previsao' ? evento.titulo : `${evento.titulo}${evento.descricao ? ` · ${evento.descricao}` : ''}`}
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {evento.origem === 'previsao' ? [evento.descricao, onde].filter(Boolean).join(' · ') : onde}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-1.5 pt-0.5 text-xs text-muted-foreground">
        <PontoDaSituacao situacao={evento.situacao} />
        <span className="hidden sm:inline">{SITUACOES[evento.situacao].rotulo}</span>
      </span>
    </>
  );
  const classe = 'flex w-full items-start gap-3 bg-transparent px-3 py-2 text-left hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring';

  if (evento.link) {
    return (
      <Link to={evento.link} className={classe}>
        {conteudo}
      </Link>
    );
  }
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className={classe} data-fundo-proprio>
          {conteudo}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <DetalheDaPrevisao evento={evento} />
      </PopoverContent>
    </Popover>
  );
}

export function VisaoLista({ dias, porDia }: PropsDaVisao) {
  const comEventos = dias.filter((dia) => doDia(porDia, dia).length > 0);
  if (comEventos.length === 0) {
    return <p className="rounded-md border border-border p-6 text-center text-sm text-muted-foreground">Nada programado ou previsto neste período.</p>;
  }
  return (
    <div className="divide-y divide-border overflow-hidden rounded-md border border-border">
      {comEventos.map((dia) => (
        <section key={dia.toISOString()} data-dia={chaveDoDia(dia)}>
          <h3 className="bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">{tituloDoDia(dia)}</h3>
          <div className="divide-y divide-border">
            {doDia(porDia, dia).map((evento) => (
              <LinhaDaLista key={evento.id} evento={evento} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
