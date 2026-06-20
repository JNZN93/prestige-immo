import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

export interface HeroFrameManifest {
  frameCount: number;
  clipSeconds: number;
  fps?: number;
  pattern: string;
  contentFadeLeadInFrames: number;
}

const MANIFEST_URL = '/videos/hero-frames/manifest.json';

@Injectable({ providedIn: 'root' })
export class HeroFrameLoaderService {
  readonly progress = signal(0);
  readonly visible = signal(false);
  readonly ready = signal(false);

  private manifest: HeroFrameManifest | null = null;
  private frames: HTMLImageElement[] = [];
  private loadPromise: Promise<HeroFrameManifest> | null = null;

  constructor(@Inject(PLATFORM_ID) private readonly platformId: object) {}

  shouldPreload(path: string): boolean {
    const normalized = path.split('?')[0].replace(/\/$/, '') || '/';
    return normalized === '/';
  }

  getManifest(): HeroFrameManifest | null {
    return this.manifest;
  }

  getFrame(index: number): HTMLImageElement | null {
    return this.frames[index] ?? null;
  }

  getFrameUrl(index: number): string {
    const oneBased = String(index + 1).padStart(3, '0');
    return `/videos/hero-frames/frame-${oneBased}.jpg`;
  }

  complete(): void {
    this.progress.set(100);
    this.ready.set(true);
    this.hideLoaderSoon();
  }

  async preload(): Promise<HeroFrameManifest> {
    if (!isPlatformBrowser(this.platformId)) {
      return {
        frameCount: 120,
        clipSeconds: 15,
        fps: 8,
        pattern: '/videos/hero-frames/frame-{index}.jpg',
        contentFadeLeadInFrames: 56,
      };
    }

    if (this.manifest) {
      return this.manifest;
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.visible.set(true);
    this.progress.set(0);
    this.ready.set(false);
    this.loadPromise = this.loadFrames();

    return this.loadPromise;
  }

  private async loadFrames(): Promise<HeroFrameManifest> {
    const response = await fetch(MANIFEST_URL);
    if (!response.ok) {
      throw new Error('Hero frame manifest not found.');
    }

    this.manifest = (await response.json()) as HeroFrameManifest;
    this.frames = new Array(this.manifest.frameCount);

    for (let index = 0; index < this.manifest.frameCount; index++) {
      this.frames[index] = await this.loadImage(this.getFrameUrl(index));
      this.progress.set(Math.round(((index + 1) / this.manifest.frameCount) * 100));
    }

    this.complete();
    return this.manifest;
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Frame could not be loaded: ${src}`));
      image.src = src;
    });
  }

  private hideLoaderSoon(): void {
    window.setTimeout(() => this.visible.set(false), 450);
  }
}
