import type { ReactNode } from 'react';

/** Painel da marca (lg+). */
export function LoginBanner() {
  return (
    <aside className="relative hidden h-full overflow-hidden border-r border-white/10 bg-white/[0.03] p-12 lg:flex lg:w-1/2 lg:flex-col lg:justify-between">
      {/* Pulso: proporcao original, sempre da esquerda para a direita. */}
      <img
        src="/brand/pulso-verde.svg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-auto w-full"
      />

      <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
        <img
          src="/brand/service-logo-negativo.svg"
          alt="Aupus Service"
          className="h-auto w-full max-w-[340px] object-contain"
        />
        <div className="space-y-2">
          <p className="text-lg font-semibold text-white">Aupus Service</p>
          <p className="max-w-xs text-sm leading-relaxed text-service-texto-secundario">
            Interligando você com o futuro. Energize-se.
          </p>
        </div>
      </div>
    </aside>
  );
}

/**
 * Moldura comum as tres telas de entrada: sempre escura, sem card e sem troca
 * de tema. O logo do produto ja e o da Aupus Energia, entao a assinatura "Uma
 * plataforma Aupus Energia" do padrao ficaria repetida e sai.
 */
export function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-service-azul">
      <LoginBanner />
      <main className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-10">
        <div className="flex w-full max-w-sm flex-col items-center gap-8">
          {/* Sem o painel (< lg), a marca entra reduzida no topo. */}
          <img
            src="/brand/service-logo-negativo.svg"
            alt="Aupus Service"
            className="h-12 w-auto object-contain lg:hidden"
          />
          {children}
        </div>
      </main>
    </div>
  );
}
