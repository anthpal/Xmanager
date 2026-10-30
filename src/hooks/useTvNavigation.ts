import { useEffect } from 'react';

const FOCUSABLE =
  'button:not([disabled]), [href], [role="button"][tabindex], [data-tv-focusable="true"]';

function isVisible(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return false;
  const style = window.getComputedStyle(element);
  return style.visibility !== 'hidden' && style.display !== 'none' && style.opacity !== '0';
}

/**
 * Si hay un diálogo abierto, la navegación se limita a él para que el D-pad
 * no se escape a las tarjetas del fondo.
 */
function activeScope(): ParentNode {
  const dialogs = document.querySelectorAll<HTMLElement>('[role="dialog"]');
  return dialogs.length > 0 ? dialogs[dialogs.length - 1] : document;
}

function getFocusables(): HTMLElement[] {
  return Array.from(activeScope().querySelectorAll<HTMLElement>(FOCUSABLE)).filter(isVisible);
}

function centerOf(element: HTMLElement): { x: number; y: number } {
  const rect = element.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

/**
 * Navegación espacial para D-pad de Android TV.
 * Se apoya en la geometría real de los elementos, así funciona igual en la
 * rejilla del catálogo y dentro de los diálogos de MUI.
 */
function findNext(current: HTMLElement, candidates: HTMLElement[], key: string): HTMLElement | null {
  const origin = centerOf(current);
  const vertical = key === 'ArrowUp' || key === 'ArrowDown';
  let best: HTMLElement | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const candidate of candidates) {
    if (candidate === current) continue;

    const point = centerOf(candidate);
    const dx = point.x - origin.x;
    const dy = point.y - origin.y;

    // Solo consideramos elementos que avanzan en la dirección pulsada.
    if (key === 'ArrowRight' && dx <= 4) continue;
    if (key === 'ArrowLeft' && dx >= -4) continue;
    if (key === 'ArrowDown' && dy <= 4) continue;
    if (key === 'ArrowUp' && dy >= -4) continue;

    const primary = vertical ? Math.abs(dy) : Math.abs(dx);
    const secondary = vertical ? Math.abs(dx) : Math.abs(dy);
    // Penaliza los saltos laterales para no cruzar filas o columnas.
    const score = primary + secondary * 3;

    if (score < bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  return best;
}

export function useTvNavigation(active: boolean): void {
  useEffect(() => {
    if (!active) return;

    const focusFirst = () => {
      const items = getFocusables();
      if (items.length === 0) return;

      const current = document.activeElement as HTMLElement | null;
      if (current && current.matches(FOCUSABLE) && isVisible(current)) return;

      const preferred = activeScope().querySelector<HTMLElement>('[data-tv-autofocus="true"]');
      const target = preferred && isVisible(preferred) ? preferred : items[0];
      target?.focus({ preventScroll: true });
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;

      const { key } = event;
      const isArrow =
        key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight';

      if (!isArrow) {
        if ((key === 'Enter' || key === ' ') && !document.activeElement?.matches(FOCUSABLE)) {
          event.preventDefault();
          focusFirst();
        }
        return;
      }

      const items = getFocusables();
      if (items.length === 0) return;

      event.preventDefault();

      const current = document.activeElement as HTMLElement | null;
      if (!current || !current.matches(FOCUSABLE) || !isVisible(current)) {
        items[0]?.focus({ preventScroll: true });
        return;
      }

      const next = findNext(current, items, key);
      if (!next) return;

      next.focus({ preventScroll: true });
      next.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    };

    window.addEventListener('keydown', onKeyDown);
    const timer = window.setTimeout(focusFirst, 250);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [active]);
}
