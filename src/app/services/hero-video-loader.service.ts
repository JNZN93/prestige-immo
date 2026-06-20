import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

const VIDEO_SRC = '/videos/127983-739777069_medium.mp4';

@Injectable({ providedIn: 'root' })
export class HeroVideoLoaderService {
  readonly progress = signal(0);
  readonly visible = signal(false);
  readonly ready = signal(false);

  private objectUrl: string | null = null;
  private loadPromise: Promise<string> | null = null;

  constructor(@Inject(PLATFORM_ID) private readonly platformId: object) {}

  shouldPreload(path: string): boolean {
    const normalized = path.split('?')[0].replace(/\/$/, '') || '/';
    return normalized === '/';
  }

  getVideoUrl(): string | null {
    return this.objectUrl;
  }

  setPhaseProgress(phaseProgress: number): void {
    const clamped = Math.min(Math.max(phaseProgress, 0), 100);
    const mapped = 85 + Math.round(clamped * 0.14);
    this.progress.set(Math.max(this.progress(), mapped));
  }

  complete(): void {
    this.progress.set(100);
    this.ready.set(true);
    this.hideLoaderSoon();
  }

  async preload(): Promise<string> {
    if (!isPlatformBrowser(this.platformId)) {
      return VIDEO_SRC;
    }

    if (this.objectUrl) {
      return this.objectUrl;
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.visible.set(true);
    this.progress.set(0);
    this.ready.set(false);
    this.loadPromise = this.fetchVideoWithProgress();

    try {
      return await this.loadPromise;
    } catch {
      this.complete();
      return VIDEO_SRC;
    }
  }

  private async fetchVideoWithProgress(): Promise<string> {
    const response = await fetch(VIDEO_SRC);
    if (!response.ok) {
      throw new Error(`Video fetch failed: ${response.status}`);
    }

    const totalBytes = Number(response.headers.get('content-length')) || 0;
    const reader = response.body?.getReader();

    if (!reader) {
      const blob = await response.blob();
      this.objectUrl = URL.createObjectURL(blob);
      this.progress.set(85);
      return this.objectUrl;
    }

    const chunks: Uint8Array[] = [];
    let loadedBytes = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      chunks.push(value);
      loadedBytes += value.length;

      if (totalBytes > 0) {
        this.progress.set(Math.min(84, Math.round((loadedBytes / totalBytes) * 84)));
      } else {
        this.progress.set(Math.min(this.progress() + 3, 80));
      }
    }

    const blob = new Blob(chunks, { type: 'video/mp4' });
    this.objectUrl = URL.createObjectURL(blob);
    this.progress.set(85);
    return this.objectUrl;
  }

  private hideLoaderSoon(): void {
    window.setTimeout(() => this.visible.set(false), 500);
  }
}
