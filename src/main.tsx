import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/assets/globals.css';
// O mesmo CSS que o pacote publicava: o `index.ts` dele importava so este
// arquivo. `globals.css` puxa `design-system.css`, que nunca entrou no build da
// lib e nao compila.
import '@/core/styles/design-minimal-components.css';

import App from './App.tsx'
import { toast as toastDoSonner } from 'sonner'
import { detectarAvisosDoSonner } from '@/lib/aviso-de-erro'

// O toast.error da tela cancela o aviso global do mesmo erro da API (SN-43)
detectarAvisosDoSonner(toastDoSonner)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
