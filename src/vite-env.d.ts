/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AZURE_BLOB_CONTAINER: string
    readonly VITE_AZURE_ACCOUNT_STORAGE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}