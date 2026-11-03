/**
 * The one long operation allowed at a time (a scan, an import, an AI request), which the
 * renderer can cancel. Removals wait for it, so nothing is deleted from under it.
 */
export class Operations {
  private active: AbortController | null = null

  get running() {
    return this.active !== null
  }

  async run<T>(fn: (signal: AbortSignal) => Promise<T>): Promise<T> {
    if (this.active)
      throw new Error('Another operation is running. Cancel it or wait for completion.')
    const controller = new AbortController()
    this.active = controller
    try {
      return await fn(controller.signal)
    } finally {
      if (this.active === controller) this.active = null
    }
  }

  cancel() {
    this.active?.abort()
  }

  /** Throws `message` while an operation is running. */
  assertIdle(message = 'Wait for the current operation.') {
    if (this.active) throw new Error(message)
  }
}
