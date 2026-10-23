/**
 * O mesmo toast do app (`@/hooks/use-toast`, o que o Toaster do App mostra).
 *
 * Esta cópia tinha um estado próprio e o Toaster dela nunca foi montado: os
 * avisos de Plantas, Concessionárias, do sheet da unidade e dos anexos de
 * equipamento, unidade e concessionária, de sucesso ou de erro, nunca apareciam
 * (achado no SN-43, 22/out/2026).
 */
export { toast, useToast } from '@/hooks/use-toast';
