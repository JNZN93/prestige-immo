import { AutoScrollOptions } from './auto-scroll.service';

export function parseAutoScrollParams(search: string): AutoScrollOptions | null {
  const params = new URLSearchParams(search);
  const value = params.get('autoscroll');

  if (!value || value === '0' || value === 'false') {
    return null;
  }

  const modeParam = params.get('mode');
  const mode: AutoScrollOptions['mode'] =
    modeParam === 'sections' ? 'sections' : 'smooth';

  return {
    speed: readNumber(params.get('speed'), 45),
    delay: readNumber(params.get('delay'), 1500),
    loop: params.get('loop') === '1' || params.get('loop') === 'true',
    mode,
    pauseMs: readNumber(params.get('pause'), 2500),
  };
}

function readNumber(value: string | null, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
