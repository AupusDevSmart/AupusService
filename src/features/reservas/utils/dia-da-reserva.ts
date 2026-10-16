/**
 * O dia de uma reserva, para exibir: a regra de todo campo `@db.Date` mora em
 * `@/utils/dia-de-calendario` (meia-noite UTC é o dia gravado; em Brasília o
 * `toLocaleDateString` mostrava o anterior).
 */
export { diaDeCalendario as diaDaReserva, formatarDiaDeCalendario as formatarDiaDaReserva } from '@/utils/dia-de-calendario';
