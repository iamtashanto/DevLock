/**
 * Generate a stable browser fingerprint for device identification.
 * Not meant to be unbreakable — just consistent across sessions.
 */
export async function generateFingerprint(): Promise<string> {
  const components: string[] = [];

  // Navigator properties
  components.push(navigator.userAgent);
  components.push(navigator.language);
  components.push(String(navigator.hardwareConcurrency ?? 0));
  components.push(String(navigator.maxTouchPoints ?? 0));

  // Screen
  components.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);

  // Timezone
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);

  // Canvas fingerprint (optional, fast)
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('DevLock', 2, 2);
      components.push(canvas.toDataURL().slice(-50));
    }
  } catch {
    // Canvas blocked
  }

  // WebGL renderer (if available)
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    if (gl) {
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      if (ext) {
        components.push(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) ?? '');
      }
    }
  } catch {
    // WebGL blocked
  }

  // Hash all components
  const raw = components.join('|');
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
