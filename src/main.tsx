import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import '@fontsource/press-start-2p/400.css';
import '@fontsource/vt323/400.css';
import './styles/global.css';

const container = document.getElementById('root');
if (!container) throw new Error('Element #root introuvable dans index.html');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
