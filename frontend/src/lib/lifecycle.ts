/** Own global resources used by the compatibility runtime across React mounts. */
export function createLifecycle() {
  const controller = new AbortController()
  const timeouts = new Set<number>()
  const intervals = new Set<number>()
  const observers = new Set<ResizeObserver>()
  let disposed = false
  return {
    listen(target: EventTarget, type: string, listener: EventListener, options?: boolean | AddEventListenerOptions) {
      target.addEventListener(type, listener, {
        ...(typeof options === 'boolean' ? { capture: options } : options),
        signal: controller.signal,
      })
    },
    setTimeout(callback: () => void, delay = 0): number {
      if (disposed) return 0
      const id = window.setTimeout(() => { timeouts.delete(id); if (!disposed) callback() }, delay)
      timeouts.add(id)
      return id
    },
    clearTimeout(id: number) { window.clearTimeout(id); timeouts.delete(id) },
    setInterval(callback: () => void, delay: number): number {
      if (disposed) return 0
      const id = window.setInterval(() => { if (!disposed) callback() }, delay)
      intervals.add(id)
      return id
    },
    fetch(input: RequestInfo | URL, init?: RequestInit) {
      return window.fetch(input, { ...init, signal: controller.signal })
    },
    resizeObserver(callback: ResizeObserverCallback) {
      const observer = new ResizeObserver(callback)
      observers.add(observer)
      return observer
    },
    dispose() {
      disposed = true
      controller.abort()
      timeouts.forEach(id => window.clearTimeout(id))
      intervals.forEach(id => window.clearInterval(id))
      observers.forEach(observer => observer.disconnect())
      document.body.classList.remove('noscroll', 'rvo')
    },
  }
}
