import type { CraftAPI, ExternalPage, Result } from '@shared/contracts'

declare global {
  interface Window {
    craftcv: CraftAPI
  }
}

/** The preload bridge, read on every call so a reloaded preload (or a test double) is used. */
export const bridge = (): CraftAPI => window.craftcv

/** A failed call: its message, and any provider pages where the person can fix it. */
export class BridgeError extends Error {
  constructor(
    message: string,
    readonly pages: ExternalPage[] = [],
  ) {
    super(message)
  }
}

/** Turns the bridge's `Result` into a value, or throws it as a `BridgeError`. */
export async function unwrap<T>(promise: Promise<Result<T>>): Promise<T> {
  const result = await promise
  if (!result.ok) throw new BridgeError(result.error, result.pages)
  return result.value
}
