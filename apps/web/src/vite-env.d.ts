/// <reference types="vite/client" />

interface Window {
  Telegram?: {
    WebApp: any;
  };
}

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
