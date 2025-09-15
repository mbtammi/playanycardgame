export interface AdRenderOptions {
  slotId: string;
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  responsive?: boolean;
  meta?: Record<string, any>;
}

export interface AdProvider {
  key: string; // provider id
  init(): Promise<void> | void; // load scripts if needed
  render(container: HTMLElement, opts: AdRenderOptions): void; // render ad into container
  destroy?(slotId: string): void; // optional cleanup
}

// Basic global typing for AdSense queue
declare global {
  interface Window {
    adsbygoogle?: any[];
    __adsenseScriptLoaded?: boolean;
  }
}

export function createContainerSkeleton(height = 250): HTMLDivElement {
  const el = document.createElement('div');
  el.style.minHeight = height + 'px';
  el.style.display = 'flex';
  el.style.alignItems = 'center';
  el.style.justifyContent = 'center';
  el.style.background = 'rgba(0,0,0,0.03)';
  el.style.border = '1px dashed #d1d5db';
  el.style.fontSize = '12px';
  el.style.color = '#6b7280';
  el.style.borderRadius = '6px';
  el.textContent = 'Loading ad...';
  return el;
}
