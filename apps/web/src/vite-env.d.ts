/// <reference types="vite/client" />

// CSS Modules;
declare module '*.module.css' {
  const classes: Readonly<Record<string, string>>
  export default classes;
}

// Environment variables;
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_ENV: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

