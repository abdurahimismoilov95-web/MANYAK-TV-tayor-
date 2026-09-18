/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPER_ADMIN_ID: string;
  // Qo'shimcha environment variables shu yerda
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
