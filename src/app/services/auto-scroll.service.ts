import { Injectable, OnDestroy } from '@angular/core';

export interface AutoScrollOptions {
  /** Scroll speed in pixels per second (smooth mode). */
  speed?: number;
  /** Wait before scrolling starts (ms) — time to start the recorder. */
  delay?: number;
  /** Restart from top after reaching the bottom. */
  loop?: boolean;
  /** `smooth` = continuous scroll, `sections` = pause at each section. */
  mode?: 'smooth' | 'sections';
  /** Pause duration at each section (ms, sections mode). */
  pauseMs?: number;
}

@Injectable({ providedIn: 'root' })
export class AutoScrollService implements OnDestroy {
  private running = false;
  private rafId = 0;
  private lastTime = 0;
  private timeoutId = 0;
  private abortSections = false;
  private onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      this.stop();
    }
  };

  start(options: AutoScrollOptions = {}): void {
    if (this.running || typeof window === 'undefined') {
      return;
    }

    const speed = options.speed ?? 45;
    const delay = options.delay ?? 1500;
    const loop = options.loop ?? false;
    const mode = options.mode ?? 'smooth';
    const pauseMs = options.pauseMs ?? 2500;

    window.addEventListener('keydown', this.onKeyDown);

    this.timeoutId = window.setTimeout(() => {
      this.timeoutId = 0;
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });

      if (mode === 'sections') {
        void this.runSections(speed, pauseMs, loop);
      } else {
        this.runSmooth(speed, loop);
      }
    }, delay);
  }

  stop(): void {
    this.running = false;
    this.abortSections = true;
    cancelAnimationFrame(this.rafId);
    this.rafId = 0;
    this.lastTime = 0;

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = 0;
    }

    window.removeEventListener('keydown', this.onKeyDown);
  }

  ngOnDestroy(): void {
    this.stop();
  }

  private runSmooth(speed: number, loop: boolean): void {
    this.running = true;
    this.lastTime = 0;

    const tick = (time: number) => {
      if (!this.running) {
        return;
      }

      if (!this.lastTime) {
        this.lastTime = time;
      }

      const delta = (time - this.lastTime) / 1000;
      this.lastTime = time;

      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const next = window.scrollY + speed * delta;

      if (next >= maxScroll) {
        if (loop) {
          window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
          this.lastTime = 0;
        } else {
          window.scrollTo({ top: maxScroll, behavior: 'instant' as ScrollBehavior });
          this.stop();
          return;
        }
      } else {
        window.scrollTo({ top: next, behavior: 'instant' as ScrollBehavior });
      }

      this.rafId = requestAnimationFrame(tick);
    };

    this.rafId = requestAnimationFrame(tick);
  }

  private async runSections(speed: number, pauseMs: number, loop: boolean): Promise<void> {
    const sections = Array.from(document.querySelectorAll('main section'));
    if (!sections.length) {
      return;
    }

    this.running = true;
    this.abortSections = false;

    do {
      for (const section of sections) {
        if (!this.running || this.abortSections) {
          return;
        }

        await this.scrollToElement(section, speed);
        if (!this.running || this.abortSections) {
          return;
        }

        await this.wait(pauseMs);
      }
    } while (loop && this.running && !this.abortSections);

    this.stop();
  }

  private scrollToElement(element: Element, speed: number): Promise<void> {
    return new Promise((resolve) => {
      const target = element.getBoundingClientRect().top + window.scrollY;
      const start = window.scrollY;
      const distance = target - start;
      const duration = Math.min(Math.max((Math.abs(distance) / speed) * 1000, 600), 5000);
      const startTime = performance.now();

      const animate = (time: number) => {
        if (!this.running || this.abortSections) {
          resolve();
          return;
        }

        const elapsed = time - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);

        window.scrollTo({ top: start + distance * eased, behavior: 'instant' as ScrollBehavior });

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }
}
