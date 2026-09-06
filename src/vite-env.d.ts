/// <reference types="vite/client" />

export interface WindowControls {
  minimize: () => void;
  maximize: () => void;
  close: () => void;
}

declare global {
  interface Window {
    winCtl?: WindowControls;
  }
}
