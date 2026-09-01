/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NETWORK_ID: "preprod" | "preview";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
