export function registerServiceWorker(): void {
  if (import.meta.env.PROD && 'serviceWorker' in navigator && window.isSecureContext) {
    const base = new URL(import.meta.env.BASE_URL, document.baseURI)
    void navigator.serviceWorker.register(new URL('sw.js', base)).catch(error => {
      console.warn('Offline-Dienst konnte nicht gestartet werden:', error)
    })
  }
}
