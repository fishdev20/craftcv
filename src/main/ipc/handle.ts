import { ipcMain, type IpcMainInvokeEvent } from 'electron'
import { z } from 'zod'
import type { Result } from '../../shared/contracts'
import { ActionableError } from '../core/external-pages'

export type Handle = <T extends z.ZodType>(
  name: string,
  schema: T,
  handler: (request: z.infer<T>) => unknown,
) => void

/** Names the fields of a request the renderer sent that failed validation. */
function invalidRequest(error: z.ZodError): string {
  const fields = [...new Set(error.issues.map((issue) => issue.path.join('.') || 'request'))]
  return `Invalid ${fields.join(', ')}. Check ${fields.length === 1 ? 'this field' : 'these fields'} and try again.`
}

/** Operating-system file errors, by code, in words; workers relay them as `CODE: …` text. */
const systemErrors: Record<string, string> = {
  ENOENT: 'The file or folder could not be found. It may have been moved or deleted.',
  EACCES:
    'CraftCV does not have permission to use that file or folder. Check its permissions and try again.',
  EPERM:
    'CraftCV does not have permission to use that file or folder. Check its permissions and try again.',
  ENOSPC: 'The disk is full. Free up some space and try again.',
  EISDIR: 'A folder was chosen where a file was expected. Choose a file instead.',
  ENOTDIR: 'A file was chosen where a folder was expected. Choose a folder instead.',
  EBUSY: 'The file is in use by another program. Close it there and try again.',
  EMFILE: 'Too many files are open. Close some programs and try again.',
}

function systemErrorMessage(error: Error): string | undefined {
  const code =
    (error as NodeJS.ErrnoException).code ?? /^([A-Z]{4,}):/.exec(error.message)?.[1] ?? ''
  return systemErrors[code]
}

/**
 * A message a person can act on. Services throw readable errors; a schema failure that
 * reaches this far means stored or received data was not in the shape expected, and its
 * field paths mean nothing to the reader.
 */
export function errorMessage(error: unknown): string {
  if (error instanceof z.ZodError)
    return 'CraftCV received data in an unexpected format. Try again; if it keeps happening, restart CraftCV.'
  if (!(error instanceof Error)) return 'Operation failed.'
  return systemErrorMessage(error) ?? error.message
}

/**
 * Returns `handle(name, schema, handler)`, which serves `craftcv:<name>`: it checks the sender,
 * validates the payload with the schema, and always answers with a Result, never a throw.
 */
export function createHandle(assertTrusted: (event: IpcMainInvokeEvent) => void): Handle {
  return (name, schema, handler) => {
    ipcMain.handle(`craftcv:${name}`, async (event, payload): Promise<Result<unknown>> => {
      try {
        assertTrusted(event)
        const request = schema.safeParse(payload)
        if (!request.success) return { ok: false, error: invalidRequest(request.error) }
        return { ok: true, value: await handler(request.data) }
      } catch (error) {
        return {
          ok: false,
          error: errorMessage(error),
          ...(error instanceof ActionableError && { pages: error.pages }),
        }
      }
    })
  }
}

/** Shared request schemas. */
export const id = z.string().uuid()
export const none = z.undefined()
export const exportFormat = z.enum(['pdf', 'docx'])
