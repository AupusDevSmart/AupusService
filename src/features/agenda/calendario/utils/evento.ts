import type { EventoDaAgenda } from '@/services/eventos-da-agenda.services';
import { formatarEmBrasilia } from '@/features/agenda/calendario/utils/periodo';

/** O que cabe numa célula: o que é o serviço, não o código (o código vai na lista e na dica). */
export const rotuloCurto = (evento: EventoDaAgenda) => (evento.origem === 'previsao' ? evento.titulo : evento.descricao?.trim() || evento.titulo);

/** A previsão só tem dia (o gerador marca a data); OS e programação têm hora. */
export const horaDoEvento = (evento: EventoDaAgenda) => (evento.origem === 'previsao' ? null : formatarEmBrasilia(evento.data, 'HH:mm'));
