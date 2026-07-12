export class OverlayManager {
  private element: HTMLDivElement | null = null;
  private readonly OVERLAY_ID = '__devlock_overlay__';

  show(title: string, message: string, dismissible: boolean = false): void {
    if (typeof document === 'undefined') return;
    this.hide(); // Hide any existing

    // Inject keyframes for animation
    if (!document.getElementById('devlock-styles')) {
      const style = document.createElement('style');
      style.id = 'devlock-styles';
      style.textContent = `
        @keyframes devlock-slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `;
      document.head.appendChild(style);
    }

    this.element = document.createElement('div');
    this.element.id = this.OVERLAY_ID;
    this.element.setAttribute('style', this.getOverlayStyles());

    const card = document.createElement('div');
    card.setAttribute('style', this.getCardStyles());

    const icon = document.createElement('div');
    icon.innerHTML = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="M12 8v4"></path><path d="M12 16h.01"></path></svg>`;
    icon.setAttribute('style', 'color: #ef4444; margin-bottom: 24px; display: flex; justify-content: center;');

    const titleEl = document.createElement('h1');
    titleEl.textContent = title;
    titleEl.setAttribute('style', 'color: #ffffff; font-size: 24px; font-weight: 600; margin: 0 0 12px 0; font-family: system-ui, -apple-system, sans-serif;');

    const msgEl = document.createElement('p');
    msgEl.textContent = message;
    msgEl.setAttribute('style', 'color: #9ca3af; font-size: 16px; line-height: 1.5; margin: 0 0 24px 0; font-family: system-ui, -apple-system, sans-serif;');

    card.appendChild(icon);
    card.appendChild(titleEl);
    card.appendChild(msgEl);

    if (dismissible) {
      const btn = document.createElement('button');
      btn.textContent = 'Acknowledge';
      btn.setAttribute('style', this.getButtonStyles());
      btn.onmouseover = () => btn.setAttribute('style', this.getButtonStyles() + 'background: #3b82f6;');
      btn.onmouseout = () => btn.setAttribute('style', this.getButtonStyles());
      btn.onclick = () => this.hide();
      card.appendChild(btn);
    }

    this.element.appendChild(card);
    document.body.appendChild(this.element);
    
    // Protect it from being removed
    this.protectElement();
  }

  hide(): void {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }

  private getOverlayStyles(): string {
    return [
      'position: fixed',
      'top: 0',
      'left: 0',
      'width: 100vw',
      'height: 100vh',
      'display: flex',
      'align-items: center',
      'justify-content: center',
      'background: rgba(0, 0, 0, 0.85)',
      'backdrop-filter: blur(8px)',
      '-webkit-backdrop-filter: blur(8px)',
      'z-index: 2147483647',
      'font-family: system-ui, -apple-system, sans-serif'
    ].join(';');
  }

  private getCardStyles(): string {
    return [
      'background: #111827',
      'border: 1px solid #374151',
      'border-radius: 16px',
      'padding: 40px',
      'width: 90%',
      'max-width: 420px',
      'text-align: center',
      'box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      'animation: devlock-slide-up 0.3s ease-out forwards'
    ].join(';');
  }

  private getButtonStyles(): string {
    return [
      'background: #2563eb',
      'color: white',
      'border: none',
      'padding: 12px 24px',
      'border-radius: 8px',
      'font-size: 14px',
      'font-weight: 500',
      'cursor: pointer',
      'transition: background 0.2s',
      'width: 100%',
      'font-family: system-ui, -apple-system, sans-serif'
    ].join(';');
  }

  private protectElement(): void {
    if (typeof MutationObserver === 'undefined') return;

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          const removed = Array.from(mutation.removedNodes);
          if (this.element && removed.includes(this.element)) {
            document.body.appendChild(this.element);
          }
        }
      }
    });

    observer.observe(document.body, { childList: true });
  }
}
