const PREFIX = 'solupark-cfg:'

export function loadState<T>(productId: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + productId)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    if (typeof fallback === 'object' && fallback !== null && !Array.isArray(fallback)) {
      return { ...(fallback as object), ...(parsed as object) } as T
    }
    return parsed as T
  } catch {
    return fallback
  }
}

export function saveState<T>(productId: string, state: T): void {
  try {
    localStorage.setItem(PREFIX + productId, JSON.stringify(state))
  } catch {
    /* quota o disabled — ignorar */
  }
}

export function clearState(productId: string): void {
  try { localStorage.removeItem(PREFIX + productId) } catch { /* ignore */ }
}
