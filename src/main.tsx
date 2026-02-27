import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/assets/globals.css';
// ✅ CRÍTICO: Importar estilos minimalistas do NexOn (btn-minimal-primary, etc.)
import '@nexon/styles/design-minimal-components.css';

import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
