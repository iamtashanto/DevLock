/**
 * Watermark injection module.
 * Renders a semi-transparent watermark overlay when license is invalid.
 */
export class WatermarkManager {
  private element: HTMLDivElement | null = null;
  private readonly WATERMARK_ID = '__devlock_wm__';

  /**
   * Show watermark overlay.
   */
  show(text = 'UNLICENSED'): void {
    if (typeof document === 'undefined') return;
    if (this.element) return; // Already showing

    this.element = document.createElement('div');
    this.element.id = this.WATERMARK_ID;
    this.element.setAttribute('style', this.getStyles());
    this.element.textContent = text;

    // Prevent removal via MutationObserver
    document.body.appendChild(this.element);
    this.protectElement();
  }

  /**
   * Remove watermark.
   */
  hide(): void {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }

  /**
   * Check if watermark is currently visible.
   */
  isVisible(): boolean {
    return this.element !== null;
  }

  private getStyles(): string {
    return [
      'position: fixed',
      'top: 0',
      'left: 0',
      'width: 100vw',
      'height: 100vh',
      'display: flex',
      'align-items: center',
      'justify-content: center',
      'font-size: 4rem',
      'font-weight: bold',
      'color: rgba(255, 0, 0, 0.08)',
      'pointer-events: none',
      'z-index: 2147483647',
      'user-select: none',
      'transform: rotate(-30deg)',
      'letter-spacing: 0.5rem',
      'font-family: monospace',
      'text-transform: uppercase',
      'white-space: nowrap',
      'overflow: hidden',
    ].join(';');
  }

  /**
   * Re-inject watermark if removed from DOM.
   */
  private protectElement(): void {
    if (typeof MutationObserver === 'undefined') return;

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const removed of mutation.removedNodes) {
          if (removed === this.element) {
            // Re-inject
            document.body.appendChild(this.element!);
          }
        }
      }
    });

    observer.observe(document.body, { childList: true });
  }
}
