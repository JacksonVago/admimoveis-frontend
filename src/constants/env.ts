import { z } from 'zod';

export const envSChema = z.object({
  /**
   * Acesso ao Blob azure
   * https://appimg.blob.core.windows.net/appimage/{id empresa}/{nome tela}/{id registro_descricao}.png
   */
  AZURE_BLOB_CONTAINER: z.string(),
  AZURE_ACCOUNT_STORAGE: z.string(),
  AZURE_SAS_TOKEN: z.string(),
  AZURE_CONTAINER_NAME: z.string(),
  AZURE_CONTAINER_CONNECTSTRING: z.string(),

});

export type Env = z.infer<typeof envSChema>;
