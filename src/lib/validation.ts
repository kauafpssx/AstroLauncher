import { z } from 'zod'

/**
 * Max character limits per user input. Mirrors the schemas below and feeds
 * the `maxLength` of every input so users cannot over-type in the first
 * place. Single source of truth for the whole app.
 */
export const MAX = {
  INSTANCE_NAME: 60,
  ACCOUNT_USERNAME: 16,
  FOLDER_NAME: 50,
  NOTE_TITLE: 40,
  SERVER_NAME: 60,
  SERVER_IP: 255,
  SCREENSHOT_NAME: 60,
  MCSTAT_API_KEY: 100,
  JAVA_ARGS: 500,
  JAVA_PATH: 500,
  SEARCH_QUERY: 100,
  OPTION_VALUE: 200,
  ZEROTIER_API_TOKEN: 100,
  ZEROTIER_NETWORK_ID: 16,
} as const

const requiredField = (max: number, label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} não pode ficar vazio`)
    .max(max, `${label} deve ter no máximo ${max} caracteres`)

export const instanceNameSchema = requiredField(
  MAX.INSTANCE_NAME,
  'O nome da instância',
)
export const accountUsernameSchema = requiredField(
  MAX.ACCOUNT_USERNAME,
  'O username',
)
export const folderNameSchema = requiredField(
  MAX.FOLDER_NAME,
  'O nome da pasta',
)
export const noteTitleSchema = requiredField(MAX.NOTE_TITLE, 'O título da nota')
export const serverNameSchema = requiredField(
  MAX.SERVER_NAME,
  'O nome do servidor',
)
export const serverIpSchema = requiredField(
  MAX.SERVER_IP,
  'O endereço do servidor',
)
export const screenshotNameSchema = requiredField(
  MAX.SCREENSHOT_NAME,
  'O nome da screenshot',
)
export const mcstatApiKeySchema = requiredField(
  MAX.MCSTAT_API_KEY,
  'A chave da API',
)
export const zerotierApiTokenSchema = requiredField(
  MAX.ZEROTIER_API_TOKEN,
  'O token da API',
)
export const zerotierNetworkIdSchema = requiredField(
  MAX.ZEROTIER_NETWORK_ID,
  'O ID da rede',
)
export const javaArgsSchema = z
  .string()
  .max(
    MAX.JAVA_ARGS,
    `Os argumentos JVM devem ter no máximo ${MAX.JAVA_ARGS} caracteres`,
  )

/** Returns the first validation issue message, or null when valid. */
export function getFirstIssue(
  schema: z.ZodType<string, string>,
  value: string,
): string | null {
  const result = schema.safeParse(value)
  return result.success ? null : (result.error.issues[0]?.message ?? null)
}
